const db =
  require(
    "../config/db"
  );

const adminSettingsModel =
  require(
    "./adminSettingsModel"
  );


const toFiniteNumber = (
  value
) => {
  const numberValue =
    Number(value);

  return Number.isFinite(
    numberValue
  )
    ? numberValue
    : null;
};


const getCreditConfiguration =
  async () => {
    const settings =
      await adminSettingsModel
        .getSettings();

    const rechargeAmount =
      toFiniteNumber(
        settings[
          adminSettingsModel
            .KEYS
            .RECHARGE_FEE_AMOUNT
        ]
      );

    const rechargeCreditPoints =
      toFiniteNumber(
        settings[
          adminSettingsModel
            .KEYS
            .RECHARGE_CREDIT_POINTS
        ]
      );

    const lowCreditThreshold =
      toFiniteNumber(
        settings[
          adminSettingsModel
            .KEYS
            .LOW_CREDIT_REMINDER_THRESHOLD
        ]
      );

    if (
      rechargeAmount === null ||
      rechargeAmount <= 0
    ) {
      throw new Error(
        "Recharge amount configuration is invalid."
      );
    }

    if (
      rechargeCreditPoints ===
        null ||
      rechargeCreditPoints <= 0
    ) {
      throw new Error(
        "Recharge credit-point configuration is invalid."
      );
    }

    return {
      rechargeAmount,
      rechargeCreditPoints,

      lowCreditThreshold:
        lowCreditThreshold !==
          null &&
        lowCreditThreshold >= 0
          ? Math.floor(
              lowCreditThreshold
            )
          : 0,

      showInterestCost:
        Math.max(
          0,
          Math.floor(
            toFiniteNumber(
              settings[
                adminSettingsModel
                  .KEYS
                  .SHOW_INTEREST_CREDIT_COST
              ]
            ) || 0
          )
        ),

      shortlistCost:
        Math.max(
          0,
          Math.floor(
            toFiniteNumber(
              settings[
                adminSettingsModel
                  .KEYS
                  .SHORTLIST_CREDIT_COST
              ]
            ) || 0
          )
        ),

      directApplyCost:
        Math.max(
          0,
          Math.floor(
            toFiniteNumber(
              settings[
                adminSettingsModel
                  .KEYS
                  .DIRECT_APPLY_CREDIT_COST
              ]
            ) || 0
          )
        ),

      mutualInterestCost:
        Math.max(
          0,
          Math.floor(
            toFiniteNumber(
              settings[
                adminSettingsModel
                  .KEYS
                  .MUTUAL_INTEREST_CREDIT_COST
              ]
            ) || 0
          )
        ),

      contactViewCost:
        Math.max(
          0,
          Math.floor(
            toFiniteNumber(
              settings[
                adminSettingsModel
                  .KEYS
                  .CONTACT_VIEW_CREDIT_COST
              ]
            ) || 0
          )
        )
    };
  };


const calculateRechargeCredits =
  async (
    approvedPaymentAmount
  ) => {
    const amount =
      toFiniteNumber(
        approvedPaymentAmount
      );

    if (
      amount === null ||
      amount <= 0
    ) {
      throw new Error(
        "Approved recharge amount is invalid."
      );
    }

    const configuration =
      await getCreditConfiguration();

    const calculatedCredits =
      Math.floor(
        amount *
          (
            configuration
              .rechargeCreditPoints /
            configuration
              .rechargeAmount
          )
      );

    if (
      calculatedCredits <= 0
    ) {
      throw new Error(
        "Approved payment amount does not generate any credit points."
      );
    }

    return {
      approvedPaymentAmount:
        amount,

      credits:
        calculatedCredits,

      rechargeAmount:
        configuration
          .rechargeAmount,

      rechargeCreditPoints:
        configuration
          .rechargeCreditPoints
    };
  };


const getBalance =
  async (
    profileId
  ) => {
    if (!profileId) {
      return 0;
    }

    const [rows] =
      await db.execute(
        `
          SELECT
            credit_balance
          FROM member_credit_accounts
          WHERE profile_id = ?
          LIMIT 1
        `,
        [profileId]
      );

    return Number(
      rows?.[0]
        ?.credit_balance ||
      0
    );
  };


const getBalanceSummary =
  async (
    profileId
  ) => {
    const [
      balance,
      configuration
    ] =
      await Promise.all([
        getBalance(
          profileId
        ),

        getCreditConfiguration()
      ]);

    return {
      balance,

      lowCreditThreshold:
        configuration
          .lowCreditThreshold,

      lowCredit:
        balance <=
        configuration
          .lowCreditThreshold,

      configuration
    };
  };


const creditRecharge =
  async ({
    profileId,
    paymentId,
    approvedPaymentAmount
  }) => {
    if (
      !profileId ||
      !paymentId
    ) {
      throw new Error(
        "Profile ID and payment ID are required for recharge credit."
      );
    }

    const conversion =
      await calculateRechargeCredits(
        approvedPaymentAmount
      );

    const connection =
      await db.getConnection();

    try {
      await connection
        .beginTransaction();

      /*
       * Idempotency:
       * do not credit the same verified
       * recharge payment twice.
       */
      const [
        existingTransactions
      ] =
        await connection.execute(
          `
            SELECT
              id,
              balance_after
            FROM credit_transactions
            WHERE profile_id = ?
              AND transaction_type =
                    'RECHARGE'
              AND reference_type =
                    'OFFLINE_PAYMENT'
              AND reference_id = ?
            LIMIT 1
          `,
          [
            profileId,
            String(paymentId)
          ]
        );

      if (
        existingTransactions
          .length > 0
      ) {
        await connection
          .rollback();

        return {
          duplicate: true,

          creditsAdded: 0,

          balance:
            Number(
              existingTransactions[0]
                .balance_after ||
              0
            ),

          conversion
        };
      }

      await connection.execute(
        `
          INSERT INTO member_credit_accounts (
            profile_id,
            credit_balance
          )
          VALUES (?, 0)
          ON DUPLICATE KEY UPDATE
            profile_id =
              VALUES(profile_id)
        `,
        [profileId]
      );

      const [
        accountRows
      ] =
        await connection.execute(
          `
            SELECT
              credit_balance
            FROM member_credit_accounts
            WHERE profile_id = ?
            FOR UPDATE
          `,
          [profileId]
        );

      const balanceBefore =
        Number(
          accountRows?.[0]
            ?.credit_balance ||
          0
        );

      const balanceAfter =
        balanceBefore +
        conversion.credits;

      await connection.execute(
        `
          UPDATE member_credit_accounts
          SET
            credit_balance = ?
          WHERE profile_id = ?
        `,
        [
          balanceAfter,
          profileId
        ]
      );

      await connection.execute(
        `
          INSERT INTO credit_transactions (
            profile_id,
            transaction_type,
            reference_type,
            reference_id,
            payment_amount,
            credits_delta,
            balance_before,
            balance_after,
            description
          )
          VALUES (
            ?,
            'RECHARGE',
            'OFFLINE_PAYMENT',
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
          )
        `,
        [
          profileId,
          String(paymentId),
          conversion
            .approvedPaymentAmount,
          conversion.credits,
          balanceBefore,
          balanceAfter,
          `Recharge payment verified. ${conversion.credits} credit points added.`
        ]
      );

      await connection.commit();

      return {
        duplicate: false,

        creditsAdded:
          conversion.credits,

        balanceBefore,
        balanceAfter,

        balance:
          balanceAfter,

        conversion
      };

    } catch (error) {
      await connection
        .rollback();

      throw error;

    } finally {
      connection.release();
    }
  };

const debitCreditsWithConnection =
  async ({
    connection,
    profileId,
    transactionType,
    referenceType,
    referenceId,
    credits,
    description
  }) => {
    const requiredCredits =
      Math.max(
        0,
        Math.floor(
          Number(
            credits || 0
          )
        )
      );

    if (
      !connection ||
      !profileId ||
      !transactionType ||
      !referenceType ||
      !referenceId
    ) {
      throw new Error(
        "Credit transaction reference is incomplete."
      );
    }

    const [
      existingTransactions
    ] =
      await connection.execute(
        `
          SELECT
            id,
            balance_after
          FROM credit_transactions
          WHERE profile_id = ?
            AND transaction_type = ?
            AND reference_type = ?
            AND reference_id = ?
          LIMIT 1
        `,
        [
          profileId,
          transactionType,
          referenceType,
          String(referenceId)
        ]
      );

    if (
      existingTransactions.length > 0
    ) {
      return {
        duplicate: true,
        debited: 0,
        balance:
          Number(
            existingTransactions[0]
              .balance_after || 0
          )
      };
    }

    await connection.execute(
      `
        INSERT INTO member_credit_accounts (
          profile_id,
          credit_balance
        )
        VALUES (?, 0)
        ON DUPLICATE KEY UPDATE
          profile_id = profile_id
      `,
      [profileId]
    );

    const [
      accountRows
    ] =
      await connection.execute(
        `
          SELECT
            credit_balance
          FROM member_credit_accounts
          WHERE profile_id = ?
          FOR UPDATE
        `,
        [profileId]
      );

    const balanceBefore =
      Number(
        accountRows?.[0]
          ?.credit_balance || 0
      );

    if (
      balanceBefore <
      requiredCredits
    ) {
      const error =
        new Error(
          `Insufficient credits. This action requires ${requiredCredits} credits. Available balance: ${balanceBefore} credits.`
        );

      error.code =
        "INSUFFICIENT_CREDITS";

      error.requiredCredits =
        requiredCredits;

      error.availableBalance =
        balanceBefore;

      throw error;
    }

    const balanceAfter =
      balanceBefore -
      requiredCredits;

    await connection.execute(
      `
        UPDATE member_credit_accounts
        SET credit_balance = ?
        WHERE profile_id = ?
      `,
      [
        balanceAfter,
        profileId
      ]
    );

    await connection.execute(
      `
        INSERT INTO credit_transactions (
          profile_id,
          transaction_type,
          reference_type,
          reference_id,
          credits_delta,
          balance_before,
          balance_after,
          description
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        profileId,
        transactionType,
        referenceType,
        String(referenceId),
        -requiredCredits,
        balanceBefore,
        balanceAfter,
        description || null
      ]
    );

    return {
      duplicate: false,
      debited:
        requiredCredits,
      balanceBefore,
      balanceAfter,
      balance:
        balanceAfter
    };
  };
const debitCredits =
  async ({
    profileId,
    transactionType,
    referenceType,
    referenceId,
    credits,
    description
  }) => {
    const requiredCredits =
      Math.max(
        0,
        Math.floor(
          Number(
            credits || 0
          )
        )
      );

    if (
      !profileId ||
      !transactionType ||
      !referenceType ||
      !referenceId
    ) {
      throw new Error(
        "Credit transaction reference is incomplete."
      );
    }

    const connection =
      await db.getConnection();

    try {
      await connection
        .beginTransaction();

      const [
        existingTransactions
      ] =
        await connection.execute(
          `
            SELECT
              id,
              balance_after
            FROM credit_transactions
            WHERE profile_id = ?
              AND transaction_type = ?
              AND reference_type = ?
              AND reference_id = ?
            LIMIT 1
          `,
          [
            profileId,
            transactionType,
            referenceType,
            String(
              referenceId
            )
          ]
        );

      if (
        existingTransactions
          .length > 0
      ) {
        await connection
          .rollback();

        return {
          duplicate: true,
          debited: 0,

          balance:
            Number(
              existingTransactions[0]
                .balance_after ||
              0
            )
        };
      }

      await connection.execute(
        `
          INSERT INTO member_credit_accounts (
            profile_id,
            credit_balance
          )
          VALUES (?, 0)
          ON DUPLICATE KEY UPDATE
            profile_id =
              VALUES(profile_id)
        `,
        [profileId]
      );

      const [
        accountRows
      ] =
        await connection.execute(
          `
            SELECT
              credit_balance
            FROM member_credit_accounts
            WHERE profile_id = ?
            FOR UPDATE
          `,
          [profileId]
        );

      const balanceBefore =
        Number(
          accountRows?.[0]
            ?.credit_balance ||
          0
        );

      if (
        balanceBefore <
        requiredCredits
      ) {
        await connection
          .rollback();

        const error =
          new Error(
            `Insufficient credits. This action requires ${requiredCredits} credits. Available balance: ${balanceBefore} credits.`
          );

        error.code =
          "INSUFFICIENT_CREDITS";

        error.requiredCredits =
          requiredCredits;

        error.availableBalance =
          balanceBefore;

        throw error;
      }

      const balanceAfter =
        balanceBefore -
        requiredCredits;

      await connection.execute(
        `
          UPDATE member_credit_accounts
          SET
            credit_balance = ?
          WHERE profile_id = ?
        `,
        [
          balanceAfter,
          profileId
        ]
      );

      await connection.execute(
        `
          INSERT INTO credit_transactions (
            profile_id,
            transaction_type,
            reference_type,
            reference_id,
            credits_delta,
            balance_before,
            balance_after,
            description
          )
          VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?
          )
        `,
        [
          profileId,
          transactionType,
          referenceType,
          String(
            referenceId
          ),
          -requiredCredits,
          balanceBefore,
          balanceAfter,
          description || null
        ]
      );

      await connection.commit();

      return {
        duplicate: false,

        debited:
          requiredCredits,

        balanceBefore,
        balanceAfter,

        balance:
          balanceAfter
      };

    } catch (error) {
      try {
        await connection
          .rollback();
      } catch {
        // Ignore rollback error.
      }

      throw error;

    } finally {
      connection.release();
    }
  };


module.exports = {
  getCreditConfiguration,
  calculateRechargeCredits,
  getBalance,
  getBalanceSummary,
  creditRecharge,
  debitCredits,
  debitCreditsWithConnection
};
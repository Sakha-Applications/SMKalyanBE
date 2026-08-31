const db =
  require(
    "../config/db"
  );

const creditModel =
  require(
    "../models/creditModel"
  );


const run =
  async () => {
    console.log(
      "Starting historical recharge credit backfill..."
    );

    try {
      /*
       * Historical verified ProfileRenewal
       * payments were approved before the
       * credit ledger was introduced.
       */
      const [payments] =
        await db.execute(
          `
            SELECT
              id,
              profile_id,
              amount,
              status,
              payment_type,
              payment_reference,
              payment_date,
              created_at,
              updated_at
            FROM tblofflinepayments
            WHERE payment_type =
                  'ProfileRenewal'
              AND LOWER(status) =
                  'verified'
            ORDER BY id ASC
          `
        );

      console.log(
        `Verified recharge payments found: ${payments.length}`
      );

      let creditedCount = 0;
      let duplicateCount = 0;
      let failedCount = 0;

      for (
        const payment of payments
      ) {
        try {
          if (
            !payment.profile_id ||
            !payment.id
          ) {
            console.warn(
              "Skipping invalid payment:",
              payment
            );

            failedCount += 1;
            continue;
          }

          const result =
            await creditModel
              .creditRecharge({
                profileId:
                  payment.profile_id,

                paymentId:
                  payment.id,

                approvedPaymentAmount:
                  payment.amount
              });

          if (
            result.duplicate
          ) {
            duplicateCount += 1;

            console.log(
              `Already credited: payment=${payment.id}, profile=${payment.profile_id}`
            );

            continue;
          }

          creditedCount += 1;

          console.log(
            `Credited payment=${payment.id}, profile=${payment.profile_id}, credits=${result.creditsAdded}, balance=${result.balance}`
          );

        } catch (error) {
          failedCount += 1;

          console.error(
            `Failed payment=${payment.id}, profile=${payment.profile_id}:`,
            error.message
          );
        }
      }

      console.log("");
      console.log(
        "Backfill completed."
      );
      console.log(
        `Credited: ${creditedCount}`
      );
      console.log(
        `Already credited: ${duplicateCount}`
      );
      console.log(
        `Failed: ${failedCount}`
      );

    } catch (error) {
      console.error(
        "Historical recharge backfill failed:",
        error
      );

      process.exitCode = 1;

    } finally {
      try {
        await db.end();
      } catch {
        // Connection pool may already be closed.
      }
    }
  };


run();
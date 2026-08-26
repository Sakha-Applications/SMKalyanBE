const modifyProfileModel =
  require(
    "../models/modifyProfileModel"
  );

const UserLogin =
  require(
    "../models/userLoginModel"
  );

const {
  sendEmailReport
} =
  require(
    "../services/emailService"
  );


const normalizeEmail = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();


const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");


const forwardProfileByEmail =
  async (
    req,
    res
  ) => {
    try {
      const senderEmail =
        normalizeEmail(
          req.user?.email ||
          req.user?.userId
        );

      if (!senderEmail) {
        return res.status(401).json({
          success: false,
          message:
            "Authenticated member could not be identified."
        });
      }

      const senderUser =
        await UserLogin.findByUserId(
          senderEmail
        );

      const senderProfileId =
        senderUser?.profile_id;

      if (!senderProfileId) {
        return res.status(401).json({
          success: false,
          message:
            "Authenticated member profile is required."
        });
      }

      const {
        targetProfileId,
        recipientEmail,
        senderMessage,
        advertisementId,
        advertisementText
      } = req.body || {};

      const normalizedRecipientEmail =
        normalizeEmail(
          recipientEmail
        );

      if (!targetProfileId) {
        return res.status(400).json({
          success: false,
          message:
            "Target profile ID is required."
        });
      }

      if (!normalizedRecipientEmail) {
        return res.status(400).json({
          success: false,
          message:
            "Recipient email is required."
        });
      }

      const validEmail =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !validEmail.test(
          normalizedRecipientEmail
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a valid recipient email address."
        });
      }

      const [
        senderProfile,
        targetProfile
      ] =
        await Promise.all([
          modifyProfileModel
            .getProfileById(
              senderProfileId
            ),

          modifyProfileModel
            .getProfileById(
              targetProfileId
            )
        ]);

      if (!senderProfile) {
        return res.status(404).json({
          success: false,
          message:
            "Sender profile was not found."
        });
      }

      if (!targetProfile) {
        return res.status(404).json({
          success: false,
          message:
            "Profile to forward was not found."
        });
      }

      /*
       * Check whether recipient already has
       * a Kalyana Sakha account.
       *
       * userLoginModel.findByUserId() is
       * already used elsewhere in the current
       * backend for email/user resolution.
       */
      let recipientUser = null;

      try {
        recipientUser =
          await UserLogin.findByUserId(
            normalizedRecipientEmail
          );
      } catch (lookupError) {
        console.warn(
          "[ProfileForward] Recipient membership lookup failed:",
          lookupError.message
        );
      }

      const recipientIsMember =
        Boolean(recipientUser);

      const frontendBaseUrl =
        String(
          process.env
            .FRONTEND_BASE_URL ||
          "http://localhost:3000"
        ).replace(/\/+$/, "");

      const profileUrl =
        `${frontendBaseUrl}/view-profile/${encodeURIComponent(
          targetProfileId
        )}`;

      const registrationUrl =
        `${frontendBaseUrl}/register`;

      const loginUrl =
        `${frontendBaseUrl}/login`;

      /*
       * Safe profile summary only.
       *
       * DO NOT include:
       * phone, email, addresses,
       * references or guardian contacts.
       */
      const targetName =
        targetProfile.name ||
        targetProfile.profile_id ||
        targetProfileId;

      const safeSummary = {
        profileId:
          targetProfile.profile_id ||
          targetProfileId,

        name:
          targetName,

        age:
          targetProfile.current_age ||
          "",

        education:
          targetProfile.education ||
          "",

        profession:
          targetProfile.profession ||
          "",

        location:
          targetProfile.current_location ||
          "",

        gotra:
          targetProfile.gotra ||
          ""
      };

      const senderName =
        senderProfile.name ||
        senderProfile.profile_id ||
        senderProfileId;

      const safeMessage =
        String(
          senderMessage || ""
        )
          .trim()
          .slice(0, 1000);

      const safeAdvertisementText =
        String(
          advertisementText || ""
        )
          .trim()
          .slice(0, 1000);

      const isAdvertisementForward =
        Boolean(
          advertisementId &&
          safeAdvertisementText
        );

      const subject =
        isAdvertisementForward
          ? `${senderName} shared a matrimonial advertisement on Kalyana Sakha`
          : `${senderName} shared a matrimonial profile on Kalyana Sakha`;

      const summaryParts = [
        safeSummary.age
          ? `${safeSummary.age} years`
          : "",

        safeSummary.education,

        safeSummary.profession,

        safeSummary.location,

        safeSummary.gotra
          ? `${safeSummary.gotra} Gotra`
          : ""
      ].filter(Boolean);

      const summaryText =
        summaryParts.join(" · ");

      const actionUrl =
        recipientIsMember
          ? profileUrl
          : registrationUrl;

      const actionLabel =
        recipientIsMember
          ? "View Profile"
          : "Register to View Profile";

      const textLines = [
        "Namaskara,",
        "",
        isAdvertisementForward
          ? `${senderName} has shared a matrimonial advertisement with you on Kalyana Sakha.`
          : `${senderName} has shared a matrimonial profile with you on Kalyana Sakha.`,
        "",
        `Profile: ${safeSummary.name} (${safeSummary.profileId})`,
        summaryText
          ? `Summary: ${summaryText}`
          : ""
      ].filter(Boolean);

            if (isAdvertisementForward) {
        textLines.push(
          "",
          "Advertisement:",
          safeAdvertisementText
        );
      }


      if (safeMessage) {
        textLines.push(
          "",
          `Message from ${senderName}:`,
          safeMessage
        );
      }

      if (recipientIsMember) {
        textLines.push(
          "",
          `View the profile securely after signing in: ${profileUrl}`,
          "",
          `Sign in: ${loginUrl}`
        );
      } else {
        textLines.push(
          "",
          "To protect member privacy, full profile information is available only to registered Kalyana Sakha members.",
          "",
          `Register here: ${registrationUrl}`
        );
      }

      textLines.push(
        "",
        "Protected contact details are not included in this email.",
        "",
        "Regards,",
        "Kalyana Sakha"
      );

      const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#071226;">
          <p>Namaskara,</p>

          <p>
            <strong>${escapeHtml(senderName)}</strong>
            has shared a matrimonial
            ${isAdvertisementForward
              ? "advertisement"
              : "profile"}
            with you on Kalyana Sakha.
          </p>

          <div style="border:1px solid #E4E1D9;border-radius:12px;padding:16px;margin:16px 0;">
            <div style="font-size:18px;font-weight:700;">
              ${escapeHtml(safeSummary.name)}
            </div>

            <div style="margin-top:4px;color:#667085;">
              Profile ID:
              ${escapeHtml(safeSummary.profileId)}
            </div>

            ${
              summaryText
                ? `
                  <div style="margin-top:10px;">
                    ${escapeHtml(summaryText)}
                  </div>
                `
                : ""
            }
          </div>

          ${
            isAdvertisementForward
              ? `
                <div style="border:1px solid #E4E1D9;border-radius:12px;padding:16px;margin:16px 0;background:#FFF4D6;">
                  <div style="font-weight:700;margin-bottom:8px;">
                    Matrimonial Advertisement
                  </div>

                  <div>
                    ${escapeHtml(safeAdvertisementText)}
                  </div>
                </div>
              `
              : ""
          }

          ${
            safeMessage
              ? `
                <p>
                  <strong>Message from ${escapeHtml(senderName)}:</strong>
                </p>

                <p style="font-style:italic;">
                  ${escapeHtml(safeMessage)}
                </p>
              `
              : ""
          }

          ${
            recipientIsMember
              ? `
                <p>
                  Sign in to Kalyana Sakha to
                  review this profile securely.
                </p>
              `
              : `
                <p>
                  To protect member privacy,
                  full profile information is
                  available only to registered
                  Kalyana Sakha members.
                </p>
              `
          }

          <p style="margin:24px 0;">
            <a
              href="${actionUrl}"
              style="display:inline-block;background:#00264D;color:#ffffff;text-decoration:none;padding:11px 18px;border-radius:8px;font-weight:700;"
            >
              ${actionLabel}
            </a>
          </p>

          <p style="font-size:13px;color:#667085;">
            Protected phone numbers, email
            addresses and residential addresses
            are never included in forwarded
            profile emails.
          </p>

          <p>
            Regards,<br />
            Kalyana Sakha
          </p>
        </div>
      `;

      await sendEmailReport({
        to:
          normalizedRecipientEmail,

        subject,

        text:
          textLines.join("\n"),

        html
      });

      return res.status(200).json({
        success: true,

        recipientIsMember,

        message:
          recipientIsMember
            ? "Profile forwarded successfully to the registered member."
            : "Profile forwarded successfully. The recipient has been invited to register before viewing the profile."
      });

    } catch (error) {
      console.error(
        "[ProfileForward] Unable to forward profile:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to forward the profile right now."
      });
    }
  };


module.exports = {
  forwardProfileByEmail
};
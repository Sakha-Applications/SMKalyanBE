const { createProfile, fetchAllProfiles } = require("../models/profileModel");
const { sendEmailReport } = require("../services/emailService");

// Add a new profile
const addProfile = async (req, res) => {
    console.log("🟢 Received request to add profile:", req.body);
    const { profileData } = req.body;

    const calculatedProfileId = profileData.profileId;
    console.log("➡️ Calculated Profile ID at start:", calculatedProfileId);

    try {
        // 1. Insert the profile data
        console.log("📥 Inserting profile data...");
        const profileResult = await createProfile(profileData);
        console.log("✅ Profile creation result:", profileResult);

        if (profileResult && profileResult.insertId >= 0) {
            console.log("✅ Profile inserted successfully. Calculated Profile ID:", calculatedProfileId);

            // 2. Construct and send the confirmation email
            const emailSubject = 'Congratulations! Successful Registration';
            const emailHtmlContent = `
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        h2 { color: #007bff; }
                        strong { font-weight: bold; }
                        .note { color: #dc3545; font-weight: bold; }
                        .signature { margin-top: 20px; font-style: italic; }
                    </style>
                </head>
                <body>
                    <h2>Congratulations!!!!!</h2>
                    <p>You have been successfully registered.</p>
                    <p>Your login credentials will be shared with you shortly.</p>
                    <p><strong>Email ID:</strong> ${profileData.email}</p>
                    <p class="note">Note: To access "contact" details, the subscription charges are Rs 1000 per annum. The validity for login if you are a "subscribed member" will start from today for a period of 365 days.</p>
                    <div class="signature">
                        <p>Thanks / Best wishes</p>
                        <p>Kalyana Sakha</p>
                    </div>
                </body>
                </html>
            `;

            const mailOptions = {
                from: process.env.EMAIL_FROM || '"Kalyana Sakha" <smkalyanasakha@gmail.com>',
                to: profileData.email,
                subject: emailSubject,
                html: emailHtmlContent
            };

            try {
                const emailResult = await sendEmailReport(mailOptions);
                console.log('📨 Email sent result:', emailResult);
                return res.status(201).json({
                    message: "Profile created successfully, confirmation email sent",
                    profileId: calculatedProfileId
                });
            } catch (emailError) {
                console.error("❌ Error sending email:", emailError);
                return res.status(201).json({
                    message: "Profile created successfully, but failed to send confirmation email",
                    profileId: calculatedProfileId,
                    emailError: emailError.message
                });
            }

        } else {
            console.error("❌ Profile creation failed.");
            return res.status(500).json({
                error: "Failed to create profile"
            });
        }
    } catch (error) {
        console.error("❌ Unexpected error in addProfile:", error);
        return res.status(500).json({ error: "Unexpected Internal Server Error", details: error.message });
    }
};

// Fetch all profiles
const getAllProfiles = async (req, res) => {
    try {
        console.log("📥 Fetching all profiles...");
        const profiles = await fetchAllProfiles();
        console.log("✅ Profiles fetched:", Array.isArray(profiles[0]) ? profiles[0].length : 0);
        res.status(200).json(profiles[0]);
    } catch (error) {
        console.error("❌ Error fetching all profiles:", error);
        res.status(500).json({ error: "Failed to fetch profiles", details: error.message });
    }
};

module.exports = { addProfile, getAllProfiles };

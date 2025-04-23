const contactDetailsModel = require("../models/contactDetailsModel");
const UserLogin = require('../models/userLoginModel'); // Import the UserLogin model
console.log("✅ contactDetailsController.js loaded");

const getContactDetails = async (req, res) => {
    console.log("🔍 getContactDetails function is being called with body:", req.body);
    console.debug("🔍 getContactDetails - Request parameters:", req.body);

    try {
        const { profileId, profileFor, minAge, maxAge, gotra } = req.body;

        const results = await contactDetailsModel.findContactDetails({
            profileId,
            profileFor,
            minAge,
            maxAge,
            gotra
        });

        console.log("Backend Controller: Contact Details Results:", results);
        res.json(results);

    } catch (error) {
        console.error("❌ Error fetching contact details:", error);
        res.status(500).json({ message: "Failed to fetch contact details.", error: error.message });
    }
};

const shareContactDetails = async (req, res) => {
    console.log("🤝 shareContactDetails function is being called with body:", req.body);
    console.debug("🤝 shareContactDetails - Request body:", req.body);

    try {
        const userEmail = req.user.userId; // Get user ID (email) from the authenticated request
        console.debug("🤝 shareContactDetails - Authenticated user email:", userEmail);

        if (!userEmail) {
            console.error("❌ Unauthorized access attempt to share contact details - User email not found in request.");
            return res.status(401).json({ message: 'Unauthorized access - User not authenticated.' });
        }

        const { sharedProfileId, sharedProfileName } = req.body;
        console.debug("🤝 shareContactDetails - Sharing details for profile ID:", sharedProfileId, "name:", sharedProfileName);

        // 1. Find the user by email to get the associated profile ID
        const user = await UserLogin.findByUserId(userEmail);
        if (!user) {
            console.error("❌ Error finding user by email:", userEmail);
            return res.status(404).json({ error: 'User not found' });
        }

        const loggedInUserProfileId = user.profile_id;
        if (!loggedInUserProfileId) {
            console.error("❌ Profile ID not found for user:", userEmail);
            return res.status(400).json({ error: 'Profile ID not found for this user.' });
        }
        console.debug("🤝 shareContactDetails - Logged-in user's profile ID:", loggedInUserProfileId);

        // 2. Check the count of unique shared contacts for this user
        const uniqueSharedContactsCount = await contactDetailsModel.countUniqueSharedContacts(loggedInUserProfileId);
        console.debug("🔢 shareContactDetails - Unique shared contacts count for user:", uniqueSharedContactsCount);

        if (uniqueSharedContactsCount >= 5) {
            console.warn("🛑 shareContactDetails - User has reached the limit of 5 free contacts.");
            return res.status(403).json({ message: 'You have reached the limit of 5 free contact details. Please add more credits to get new contacts.' });
        }

        // 3. Check if the contact has already been shared with this user (optional, but good to prevent duplicates)
        const existingShare = await contactDetailsModel.findExistingShare(loggedInUserProfileId, sharedProfileId);
        if (existingShare) {
            console.info("🔄 shareContactDetails - Contact already shared with this user.");
            const completeDetails = await contactDetailsModel.findContactDetails({ profileId: sharedProfileId });
            return res.json(completeDetails && completeDetails.length > 0 ? completeDetails[0] : {});
        }

        // 4. Record the new share
        const sharedWithEmail = userEmail; // User's email is their userId
        const shareRecord = {
            shared_with_profile_id: loggedInUserProfileId,
            shared_with_email: sharedWithEmail,
            shared_profile_id: sharedProfileId,
            shared_profile_name: sharedProfileName,
            shared_at: new Date()
        };
        console.debug("💾 shareContactDetails - Preparing to record share:", shareRecord);
        const shareResult = await contactDetailsModel.recordShare(shareRecord);

        if (!shareResult) {
            console.error("❌ Failed to record contact details sharing in the database.");
            return res.status(500).json({ message: 'Failed to record contact details sharing.' });
        }
        console.info("💾 shareContactDetails - Successfully recorded contact details sharing.");

        // 5. Fetch and return the contact details
        console.debug("🔍 shareContactDetails - Fetching complete details for profile ID:", sharedProfileId);
        const completeDetails = await contactDetailsModel.findContactDetails({ profileId: sharedProfileId });

        if (!completeDetails || completeDetails.length === 0) {
            console.warn("⚠️ Contact details not found for profile ID:", sharedProfileId);
            return res.status(404).json({ message: 'Contact details not found for the requested profile.' });
        }

        console.log("✅ Contact details shared and retrieved:", completeDetails[0]);
        res.json(completeDetails[0]);

    } catch (error) {
        console.error("❌ Error sharing contact details:", error);
        res.status(500).json({ message: "Failed to share and retrieve contact details.", error: error.message });
    }
};

const sendEmailReport = async (req, res) => {
    console.log("📧 sendEmailReport function is being called with body:", req.body);
    console.debug("📧 sendEmailReport - Request body:", req.body);

    try {
        const { email, subject, data } = req.body;
        console.debug("📧 sendEmailReport - Email details:", { email, subject });

        // Placeholder for email sending logic
        console.log(`📧 Email would be sent to: ${email}`);

        setTimeout(() => {
            res.json({ success: true, message: "Email sent successfully" });
        }, 1000);

    } catch (error) {
        console.error("❌ Error sending email report:", error);
        res.status(500).json({ message: "Failed to send email report.", error: error.message });
    }
};

module.exports = { getContactDetails, shareContactDetails, sendEmailReport };
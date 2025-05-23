const pool = require("../config/db");
console.log("✅ contactDetailsModel.js loaded");

const findContactDetails = async ({ profileId, profileFor, minAge, maxAge, gotra }) => {
    try {
        let query = `
            SELECT *
            FROM profile
            WHERE 1=1
        `;
        let values = [];

        if (profileId) {
            query += ` AND profile_id = ?`;
            values.push(profileId);
        }
        if (profileFor) {
            query += ` AND profile_for = ?`;
            values.push(profileFor);
        }
        if (minAge && maxAge) {
            query += ` AND current_age BETWEEN ? AND ?`;
            values.push(parseInt(minAge), parseInt(maxAge));
        } else if (minAge) {
            query += ` AND current_age >= ?`;
            values.push(parseInt(minAge));
        } else if (maxAge) {
            query += ` AND current_age <= ?`;
            values.push(parseInt(maxAge));
        }
        if (gotra) {
            query += ` AND gotra != ?`;
            values.push(gotra);
        }

        query += " ORDER BY current_age ASC";
        console.log("Executing query:", query, "with values:", values);

        const [rows] = await pool.execute(query, values);
        return rows;
    } catch (error) {
        console.error("❌ Error finding contact details in model:", error);
        throw error;
        }
};

const recordShare = async (shareData) => {
    try {
        const {
            shared_with_profile_id,
            shared_with_email,
            shared_profile_id,
            shared_profile_name,
            shared_at
        } = shareData;

        // Count how many times this user has shared contact details
        const countQuery = `
            SELECT COUNT(*) as shareCount
            FROM contact_details_shared
            WHERE shared_with_profile_id = ?
        `;
        const [countResult] = await pool.execute(countQuery, [shared_with_profile_id]);
        const currentCount = countResult[0]?.shareCount || 0;
        const newCount = currentCount + 1;

        const insertQuery = `
            INSERT INTO contact_details_shared
            (shared_with_profile_id, shared_with_email, shared_profile_id, shared_profile_name, shared_at, shared_count)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const insertValues = [
            shared_with_profile_id,
            shared_with_email,
            shared_profile_id,
            shared_profile_name,
            shared_at,
            newCount
        ];
        const [result] = await pool.execute(insertQuery, insertValues);

        return result.affectedRows > 0;
    } catch (error) {
        console.error("❌ Error recording contact details share:", error);
        throw error;
    }
};

const countUniqueSharedContacts = async (userProfileId) => {
    try {
        const query = `
            SELECT MAX(shared_count) AS uniqueCount
            FROM contact_details_shared
            WHERE shared_with_profile_id = ?
        `;
        const values = [userProfileId];
        const [rows] = await pool.execute(query, values);
        return rows[0]?.uniqueCount || 0;
    } catch (error) {
        console.error("❌ Error counting unique shared contacts from shared_count:", error);
        throw error;
    }
};

const findExistingShare = async (userProfileId, sharedProfileId) => {
    try {
        const query = `
            SELECT *
            FROM contact_details_shared
            WHERE shared_with_profile_id = ? AND shared_profile_id = ?
        `;
        const values = [userProfileId, sharedProfileId];
        const [rows] = await pool.execute(query, values);
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error("❌ Error finding existing share:", error);
        throw error;
    }
};

// New function to reset shared contacts for a profile after renewal
const resetSharedContactsForProfile = async (profileId) => {
    try {
        console.log("🔄 Resetting shared contacts for profile:", profileId);
        const query = `
            DELETE FROM contact_details_shared
            WHERE shared_with_profile_id = ?
        `;
        const values = [profileId];
        const [result] = await pool.execute(query, values);
        
        console.log(`✅ Successfully deleted ${result.affectedRows} shared contact records for profile ${profileId}`);
        return result.affectedRows;
    } catch (error) {
        console.error("❌ Error resetting shared contacts for profile:", error);
        throw error;
    }
};

module.exports = { 
    findContactDetails, 
    recordShare, 
    countUniqueSharedContacts, 
    findExistingShare,
    resetSharedContactsForProfile
};
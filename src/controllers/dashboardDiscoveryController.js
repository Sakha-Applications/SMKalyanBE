const DashboardDiscoveryModel = require("../models/DashboardDiscoveryModel");

console.log("✅ dashboardDiscoveryController.js loaded");

const getDiscoveryCount = async (req, res) => {
  try {
    const loggedInProfileId = req.user?.profile_id;

    if (!loggedInProfileId) {
      return res.status(400).json({
        error: "Logged-in profile ID is not available.",
      });
    }

    const discoveryType = String(
      req.params?.type || ""
    )
      .trim()
      .toUpperCase();

    const profession = String(
      req.query?.profession || ""
    ).trim();

    const allowedTypes = [
      "RECENT",
      "SAME_CITY",
      "SAME_MOTHER_TONGUE",
      "GOTRA",
      "PROFESSION",
      "INTERNATIONAL",
    ];

    if (!allowedTypes.includes(discoveryType)) {
      return res.status(400).json({
        error: `Unsupported discovery type: ${discoveryType}`,
      });
    }

    const count =
      await DashboardDiscoveryModel.getDiscoveryCount(
        loggedInProfileId,
        discoveryType,
        profession
      );

    return res.status(200).json({
      discoveryType,
      count,
    });
  } catch (error) {
    console.error(
      "❌ Dashboard discovery count failed:",
      error
    );

    return res.status(500).json({
      error: "Failed to load dashboard discovery count.",
      details: error.message,
    });
  }
};

const getDiscoveryProfiles = async (req, res) => {
  try {
    const loggedInProfileId = req.user?.profile_id;

    if (!loggedInProfileId) {
      return res.status(400).json({
        error: "Logged-in profile ID is not available.",
      });
    }

    const discoveryType = String(
      req.params?.type || ""
    )
      .trim()
      .toUpperCase();

    const profession = String(
      req.query?.profession || ""
    ).trim();

    const limit = Number(
      req.query?.limit || 30
    );

    const allowedTypes = [
      "RECENT",
      "SAME_CITY",
      "SAME_MOTHER_TONGUE",
      "GOTRA",
      "PROFESSION",
      "INTERNATIONAL",
    ];

    if (!allowedTypes.includes(discoveryType)) {
      return res.status(400).json({
        error: `Unsupported discovery type: ${discoveryType}`,
      });
    }

    const profiles =
      await DashboardDiscoveryModel.getDiscoveryProfiles(
        loggedInProfileId,
        discoveryType,
        profession,
        limit
      );

    return res.status(200).json({
      discoveryType,
      profiles,
    });
  } catch (error) {
    console.error(
      "❌ Dashboard discovery profiles failed:",
      error
    );

    return res.status(500).json({
      error: "Failed to load dashboard discovery profiles.",
      details: error.message,
    });
  }
};

const getDiscoverySummary = async (req, res) => {
  try {
    const loggedInProfileId =
      req.user?.profile_id;

    if (!loggedInProfileId) {
      return res.status(400).json({
        error:
          "Logged-in profile ID is not available.",
      });
    }

    const summary =
      await DashboardDiscoveryModel.getDiscoverySummary(
        loggedInProfileId
      );

    return res.status(200).json(summary);
  } catch (error) {
    console.error(
      "Dashboard discovery summary failed:",
      error
    );

    return res.status(500).json({
      error:
        "Failed to load dashboard discovery summary.",
      details: error.message,
    });
  }
};

module.exports = {
  getDiscoveryCount,
  getDiscoveryProfiles,
  getDiscoverySummary,
};
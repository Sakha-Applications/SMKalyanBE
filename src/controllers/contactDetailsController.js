const contactDetailsModel =
    require("../models/contactDetailsModel");

const UserLogin =
    require("../models/userLoginModel");

const adminSettingsModel =
    require("../models/adminSettingsModel");

const AdvertisementResponseModel =
    require("../models/advertisementResponseModel");

const creditModel =
    require("../models/creditModel");

const {
    sendEmailReport
} = require("../services/emailService");

console.log(
    "✅ contactDetailsController.js loaded"
);


const getContactViewLimit = async () => {
    let limit = 10;

    try {
        const settings =
            await adminSettingsModel.getSettings();

        const raw =
            settings?.[
                adminSettingsModel.KEYS
                    .CONTACT_VIEWS_PER_CYCLE
            ];

        const parsed =
            parseInt(raw, 10);

        if (
            Number.isFinite(parsed) &&
            parsed > 0
        ) {
            limit = parsed;
        }
    } catch (error) {
        console.error(
            "⚠️ Unable to read CONTACT_VIEWS_PER_CYCLE. Using default 10.",
            error.message
        );
    }

    return limit;
};


const getAuthenticatedProfile = async (
    req
) => {
    const userEmail =
        req.user?.email ||
        req.user?.userId;

    if (!userEmail) {
        return null;
    }

    const user =
        await UserLogin.findByUserId(
            userEmail
        );

    if (!user?.profile_id) {
        return null;
    }

    return {
        email: userEmail,
        profileId: user.profile_id
    };
};


const getContactDetails = async (
    req,
    res
) => {
    try {
        const profileId =
            req.params?.profileId ||
            req.body?.profileId;

        if (!profileId) {
            return res.status(400).json({
                success: false,
                message:
                    "profileId is required."
            });
        }

        const authProfile =
            await getAuthenticatedProfile(req);

        if (!authProfile) {
            return res.status(401).json({
                success: false,
                message:
                    "Authenticated profile not found."
            });
        }

        const existingShare =
            await contactDetailsModel
                .findExistingShare(
                    authProfile.profileId,
                    profileId
                );

        console.log(
            "[ContactDetails] access check:",
            {
                requesterProfileId:
                    authProfile.profileId,
                targetProfileId:
                    profileId,
                approvedShareFound:
                    Boolean(
                        existingShare
                    )
            }
        );

        if (!existingShare) {
            return res.status(403).json({
                success: false,
                message:
                    "Contact details have not been approved for this profile."
            });
        }

        const results =
            await contactDetailsModel
                .findContactDetails({
                    profileId
                });

        if (
            !results ||
            results.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Contact details not found."
            });
        }

        return res.status(200).json({
            success: true,
            status: "APPROVED",
            contact:
                results[0]
        });

    } catch (error) {
        console.error(
            "❌ getContactDetails error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch contact details."
        });
    }
};


const shareContactDetails = async (
    req,
    res
) => {
    try {
        const authProfile =
            await getAuthenticatedProfile(req);

        if (!authProfile) {
            return res.status(401).json({
                success: false,
                message:
                    "Authenticated profile not found."
            });
        }

        const {
            sharedProfileId,
            sharedProfileName,
            requesterMessage,
            requestSource
        } = req.body || {};

        if (!sharedProfileId) {
            return res.status(400).json({
                success: false,
                message:
                    "sharedProfileId is required."
            });
        }

        if (
            String(authProfile.profileId) ===
            String(sharedProfileId)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "You cannot request your own contact details."
            });
        }

        /*
         * Advertisement-originated contact access
         * requires mutual matrimonial interest.
         *
         * Existing non-advertisement contact requests
         * continue through the current Moderator flow
         * unchanged.
         */
        if (
            String(
                requestSource || ""
            )
                .trim()
                .toUpperCase() ===
            "ADVERTISEMENT_MUTUAL"
        ) {
            const isMutual =
                await AdvertisementResponseModel
                    .hasMutualRelationship(
                        authProfile.profileId,
                        sharedProfileId
                    );

            if (!isMutual) {
                return res.status(403).json({
                    success: false,
                    code:
                        "MUTUAL_INTEREST_REQUIRED",
                    message:
                        "Contact details can be requested after both members have expressed mutual interest."
                });
            }
        }

        const normalizedRequestSource =
            String(
                requestSource || ""
            )
                .trim()
                .toUpperCase();

        if (
            normalizedRequestSource ===
            "ADVERTISEMENT_MUTUAL"
        ) {
            /*
             * If this phone was already unlocked
             * earlier, return it without charging
             * the member again.
             */
            const existingShare =
                await contactDetailsModel
                    .findExistingShare(
                        authProfile.profileId,
                        sharedProfileId
                    );

            if (existingShare) {
                const details =
                    await contactDetailsModel
                        .findContactDetails({
                            profileId:
                                sharedProfileId
                        });

                return res.status(200).json({
                    success: true,
                    status: "APPROVED",
                    alreadyUnlocked: true,
                    contact:
                        details?.[0] || null
                });
            }

            const configuration =
                await creditModel
                    .getCreditConfiguration();

            const contactViewCost =
                Number(
                    configuration
                        .contactViewCost || 0
                );

            const creditResult =
                await creditModel
                    .debitCredits({
                        profileId:
                            authProfile.profileId,

                        transactionType:
                            "CONTACT_VIEW",

                        referenceType:
                            "PROFILE_CONTACT",

                        referenceId:
                            sharedProfileId,

                        credits:
                            contactViewCost,

                        description:
                            `Phone number unlocked for profile ${sharedProfileId}`
                    });

            await contactDetailsModel
                .recordShare({
                    shared_with_profile_id:
                        authProfile.profileId,

                    shared_with_email:
                        authProfile.email,

                    shared_profile_id:
                        sharedProfileId,

                    shared_profile_name:
                        sharedProfileName || "",

                    shared_at:
                        new Date()
                });

            const details =
                await contactDetailsModel
                    .findContactDetails({
                        profileId:
                            sharedProfileId
                    });

            return res.status(200).json({
                success: true,
                status: "APPROVED",

                alreadyUnlocked:
                    false,

                contact:
                    details?.[0] || null,

                credit: {
                    cost:
                        contactViewCost,

                    debited:
                        creditResult.debited,

                    balanceBefore:
                        creditResult.balanceBefore,

                    balanceAfter:
                        creditResult.balanceAfter,

                    lowCredit:
                        creditResult.balanceAfter <=
                        configuration
                            .lowCreditThreshold,

                    lowCreditThreshold:
                        configuration
                            .lowCreditThreshold
                }
            });
        }
        /*
         * Already approved earlier:
         * return contact immediately without consuming
         * another contact view.
         */
        const existingShare =
            await contactDetailsModel
                .findExistingShare(
                    authProfile.profileId,
                    sharedProfileId
                );

        if (existingShare) {
            const details =
                await contactDetailsModel
                    .findContactDetails({
                        profileId:
                            sharedProfileId
                    });

            return res.json(
                details?.[0] || {}
            );
        }

        /*
         * Check allowance BEFORE accepting a new request.
         */
        const contactViewLimit =
            await getContactViewLimit();

        const used =
            await contactDetailsModel
                .countUniqueSharedContacts(
                    authProfile.profileId
                );

        if (used >= contactViewLimit) {
            return res.status(403).json({
                success: false,
                code:
                    "CONTACT_VIEW_LIMIT_REACHED",
                message:
                    `You have reached the limit of ${contactViewLimit} contact views. Please recharge to request more contact details.`,
                limit: contactViewLimit,
                used
            });
        }

        const previousRequest =
            await contactDetailsModel
                .findContactRequest(
                    authProfile.profileId,
                    sharedProfileId
                );

        if (
            previousRequest &&
            String(
                previousRequest.status
            ).toUpperCase() === "PENDING"
        ) {
            return res.status(202).json({
                success: true,
                requestId:
                    previousRequest.id,
                status: "PENDING",
                message:
                    "Your contact request is already awaiting moderator review."
            });
        }

        const request =
            await contactDetailsModel
                .createOrReopenContactRequest({
                    requesterProfileId:
                        authProfile.profileId,
                    requesterEmail:
                        authProfile.email,
                    targetProfileId:
                        sharedProfileId,
                    requesterMessage:
                        requesterMessage || ""
                });

        await contactDetailsModel
            .recordContactRequestHistory({
                requestId:
                    request.id,

                action:
                    previousRequest &&
                    String(
                        previousRequest.status ||
                        ""
                    )
                        .trim()
                        .toUpperCase() ===
                        "CLARIFICATION_REQUIRED"
                        ? "RESUBMITTED"
                        : "REQUESTED",

                actionBy:
                    authProfile.email,

                remarks:
                    requesterMessage || ""
            });

        return res.status(202).json({
            success: true,
            requestId: request.id,
            status: "PENDING",
            sharedProfileId,
            sharedProfileName:
                sharedProfileName || "",
            message:
                "Contact request submitted for moderator review."
        });

    } catch (error) {
        console.error(
            "❌ shareContactDetails error:",
            error
        );

        if (
            error.code ===
            "INSUFFICIENT_CREDITS"
        ) {
            return res.status(402).json({
                success: false,

                code:
                    "INSUFFICIENT_CREDITS",

                message:
                    error.message,

                data: {
                    requiredCredits:
                        error.requiredCredits,

                    availableBalance:
                        error.availableBalance
                }
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to unlock the phone number.",
            error: error.message
        });
    }
};

const listMyContactRequests = async (
    req,
    res
) => {
    try {
        const authProfile =
            await getAuthenticatedProfile(req);

        if (!authProfile) {
            return res.status(401).json({
                success: false,
                message:
                    "Authenticated profile not found."
            });
        }

        const requests =
            await contactDetailsModel
                .listContactRequestsForMember(
                    authProfile.profileId
                );

        return res.json({
            success: true,
            count:
                requests.length,
            requests
        });

    } catch (error) {
        console.error(
            "❌ listMyContactRequests error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load your contact requests."
        });
    }
};


const listContactRequests = async (
    req,
    res
) => {
    try {
        const status =
            req.query?.status ||
            "PENDING";

        const requests =
            await contactDetailsModel
                .listContactRequests(
                    status
                );

        /*
         * Add mutual-interest evidence for
         * Moderator review without changing
         * the existing contact-access rules.
         */
        const enrichedRequests =
            await Promise.all(
                requests.map(
                    async (
                        request
                    ) => {
                        let mutualInterest =
                            false;

                        try {
                            mutualInterest =
                                await AdvertisementResponseModel
                                    .hasMutualRelationship(
                                        request.requester_profile_id,
                                        request.target_profile_id
                                    );
                        } catch (
                            relationshipError
                        ) {
                            console.error(
                                "⚠️ Unable to verify mutual relationship for contact request:",
                                request.id,
                                relationshipError.message
                            );
                        }

                        return {
                            ...request,
                            mutual_interest:
                                Boolean(
                                    mutualInterest
                                )
                        };
                    }
                )
            );

        return res.json({
            success: true,
            count:
                enrichedRequests.length,
            requests:
                enrichedRequests
        });

    } catch (error) {
        console.error(
            "❌ listContactRequests error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load contact requests."
        });
    }
};


const reviewContactRequest = async (
    req,
    res
) => {
    try {
        const { requestId } =
            req.params;

        const {
            action,
            remarks
        } = req.body || {};

        const normalizedAction =
            String(action || "")
                .trim()
                .toUpperCase();

        const allowedActions = [
            "APPROVED",
            "REJECTED",
            "CLARIFICATION_REQUIRED"
        ];

        if (
            !allowedActions.includes(
                normalizedAction
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Action must be APPROVED, REJECTED or CLARIFICATION_REQUIRED."
            });
        }

        const normalizedRemarks =
            String(
                remarks || ""
            ).trim();

        if (
            (
                normalizedAction ===
                    "REJECTED" ||
                normalizedAction ===
                    "CLARIFICATION_REQUIRED"
            ) &&
            !normalizedRemarks
        ) {
            return res.status(400).json({
                success: false,
                message:
                    normalizedAction ===
                        "REJECTED"
                        ? "Moderator remarks are required when rejecting a contact request."
                        : "Moderator remarks are required when requesting clarification."
            });
        }

        const request =
            await contactDetailsModel
                .getContactRequestById(
                    requestId
                );

        if (!request) {
            return res.status(404).json({
                success: false,
                message:
                    "Contact request not found."
            });
        }

        const currentStatus =
            String(
                request.status || ""
            ).toUpperCase();

        if (
            currentStatus === "APPROVED"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Contact request is already approved."
            });
        }

        const reviewer =
            req.user?.email ||
            req.user?.userId ||
            req.user?.profile_id ||
            "SYSTEM";

        /*
         * Approval consumes one contact view.
         */
        if (
            normalizedAction ===
            "APPROVED"
        ) {
            const existingShare =
                await contactDetailsModel
                    .findExistingShare(
                        request.requester_profile_id,
                        request.target_profile_id
                    );

            if (!existingShare) {
                const contactViewLimit =
                    await getContactViewLimit();

                const used =
                    await contactDetailsModel
                        .countUniqueSharedContacts(
                            request.requester_profile_id
                        );

                if (
                    used >=
                    contactViewLimit
                ) {
                    return res.status(409).json({
                        success: false,
                        code:
                            "CONTACT_VIEW_LIMIT_REACHED",
                        message:
                            "Requester no longer has an available contact view. Recharge is required before approval.",
                        limit:
                            contactViewLimit,
                        used
                    });
                }

                const shared =
                    await contactDetailsModel
                        .recordShare({
                            shared_with_profile_id:
                                request.requester_profile_id,

                            shared_with_email:
                                request.requester_email,

                            shared_profile_id:
                                request.target_profile_id,

                            shared_profile_name:
                                request.target_name || "",

                            shared_at:
                                new Date()
                        });

                if (!shared) {
                    return res
                        .status(500)
                        .json({
                            success: false,
                            message:
                                "Unable to grant contact access."
                        });
                }
            }
        }

        await contactDetailsModel
            .updateContactRequestStatus({
                requestId,
                status:
                    normalizedAction,
                moderatorRemarks:
                    normalizedRemarks,
                reviewedBy:
                    reviewer
            });

        await contactDetailsModel
            .recordContactRequestHistory({
                requestId,
                action:
                    normalizedAction,
                actionBy:
                    reviewer,
                remarks:
                    normalizedRemarks
            });

        /*
         * Email failure must NOT roll back
         * the moderator's decision.
         */
        const recipient =
            request.requester_email ||
            request.requester_profile_email;

        if (recipient) {
            try {
                let subject;
                let message;

                if (
                    normalizedAction ===
                    "APPROVED"
                ) {
                    subject =
                        "Kalyana Sakha - Contact Request Approved";

                    message =
                        `Your request to view contact details for ${request.target_name || request.target_profile_id} has been approved. Please sign in to Kalyana Sakha to view the contact details.`;
                } else if (
                    normalizedAction ===
                    "REJECTED"
                ) {
                    subject =
                        "Kalyana Sakha - Contact Request Update";

                    message =
                        `Your request to view contact details for ${request.target_name || request.target_profile_id} was not approved.`;
                } else {
                    subject =
                        "Kalyana Sakha - Contact Request Clarification Required";

                    message =
                        `Additional clarification is required for your contact request for ${request.target_name || request.target_profile_id}.`;
                }

                if (
                    normalizedRemarks
                ) {
                    message +=
                        `\n\nModerator remarks: ${normalizedRemarks}`;
                }

                await sendEmailReport({
                    to: recipient,
                    subject,
                    text: message
                });

            } catch (emailError) {
                console.error(
                    "⚠️ Contact decision saved but email failed:",
                    emailError.message
                );
            }
        }

        return res.json({
            success: true,
            requestId,
            status:
                normalizedAction,
            message:
                normalizedAction ===
                "APPROVED"
                    ? "Contact request approved and access granted."
                    : normalizedAction ===
                      "REJECTED"
                    ? "Contact request rejected."
                    : "Clarification requested."
        });

    } catch (error) {
        console.error(
            "❌ reviewContactRequest error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to review contact request.",
            error: error.message
        });
    }
};


// Email/download/print of another member's
// contact details remains disabled.
const sendEmailReportDisabled = async (
    req,
    res
) => {
    return res.status(403).json({
        success: false,
        message:
            "Email/Download/Print of member contact details is disabled. Approved details must be viewed within Kalyana Sakha."
    });
};


module.exports = {
    getContactDetails,
    shareContactDetails,
    listMyContactRequests,
    listContactRequests,
    reviewContactRequest,

    sendEmailReport:
        sendEmailReportDisabled
};
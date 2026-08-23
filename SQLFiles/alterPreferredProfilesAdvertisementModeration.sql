ALTER TABLE preferred_profiles
    ADD COLUMN payment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
        AFTER transaction_details,
    ADD COLUMN review_status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
        AFTER payment_status,
    ADD COLUMN moderator_narrative TEXT NULL
        AFTER review_status,
    ADD COLUMN moderator_remarks TEXT NULL
        AFTER moderator_narrative,
    ADD COLUMN reviewed_by VARCHAR(255) NULL
        AFTER moderator_remarks,
    ADD COLUMN reviewed_at DATETIME NULL
        AFTER reviewed_by,
    ADD COLUMN published_at DATETIME NULL
        AFTER reviewed_at;

CREATE INDEX idx_preferred_profiles_payment_status
    ON preferred_profiles(payment_status);

CREATE INDEX idx_preferred_profiles_review_status
    ON preferred_profiles(review_status);

CREATE INDEX idx_preferred_profiles_status
    ON preferred_profiles(status);
CREATE TABLE IF NOT EXISTS member_credit_accounts (
    profile_id VARCHAR(50) NOT NULL,
    credit_balance BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (profile_id)
);

CREATE TABLE IF NOT EXISTS credit_transactions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    profile_id VARCHAR(50) NOT NULL,

    transaction_type VARCHAR(50) NOT NULL,
    reference_type VARCHAR(50) DEFAULT NULL,
    reference_id VARCHAR(100) DEFAULT NULL,

    payment_amount DECIMAL(12,2) DEFAULT NULL,

    credits_delta BIGINT NOT NULL,
    balance_before BIGINT NOT NULL,
    balance_after BIGINT NOT NULL,

    description VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_credit_transaction_reference (
        profile_id,
        transaction_type,
        reference_type,
        reference_id
    ),

    KEY idx_credit_transactions_profile (
        profile_id,
        created_at
    )
);
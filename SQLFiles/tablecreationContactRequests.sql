CREATE TABLE IF NOT EXISTS contact_requests (
    id BIGINT NOT NULL AUTO_INCREMENT,
    requester_profile_id VARCHAR(100) NOT NULL,
    requester_email VARCHAR(255) NULL,
    target_profile_id VARCHAR(100) NOT NULL,

    status VARCHAR(40) NOT NULL DEFAULT 'PENDING',

    requester_message TEXT NULL,
    moderator_remarks TEXT NULL,

    reviewed_by VARCHAR(255) NULL,
    reviewed_at DATETIME NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_contact_request_pair (
        requester_profile_id,
        target_profile_id
    ),

    KEY idx_contact_requests_status (status),
    KEY idx_contact_requests_requester (requester_profile_id),
    KEY idx_contact_requests_target (target_profile_id),
    KEY idx_contact_requests_created (created_at)
);


CREATE TABLE IF NOT EXISTS contact_request_history (
    id BIGINT NOT NULL AUTO_INCREMENT,
    contact_request_id BIGINT NOT NULL,

    action VARCHAR(50) NOT NULL,
    action_by VARCHAR(255) NULL,
    remarks TEXT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY idx_contact_request_history_request (
        contact_request_id
    ),

    CONSTRAINT fk_contact_request_history_request
        FOREIGN KEY (contact_request_id)
        REFERENCES contact_requests(id)
        ON DELETE CASCADE
);
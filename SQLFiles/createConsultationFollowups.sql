CREATE TABLE IF NOT EXISTS consultation_followups (
    id BIGINT NOT NULL AUTO_INCREMENT,

    advertisement_response_id BIGINT NOT NULL,

    consultation_status VARCHAR(40)
        NOT NULL
        DEFAULT 'PENDING',

    convenient_time VARCHAR(255) NULL,

    consultation_remarks TEXT NULL,

    next_follow_up_at DATETIME NULL,

    updated_by VARCHAR(255) NULL,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_consultation_response (
        advertisement_response_id
    ),

    KEY idx_consultation_status (
        consultation_status
    ),

    KEY idx_consultation_next_follow_up (
        next_follow_up_at
    ),

    CONSTRAINT fk_consultation_response
        FOREIGN KEY (
            advertisement_response_id
        )
        REFERENCES advertisement_responses(id)
        ON DELETE CASCADE
);
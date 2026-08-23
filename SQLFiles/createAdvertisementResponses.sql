CREATE TABLE advertisement_responses (
    id BIGINT NOT NULL AUTO_INCREMENT,

    advertisement_id INT NOT NULL,

    owner_profile_id VARCHAR(50) NOT NULL,
    responder_profile_id VARCHAR(50) NOT NULL,

    response_type ENUM(
        'INTEREST',
        'APPLY'
    ) NOT NULL,

    response_status ENUM(
        'NEW',
        'SHORTLISTED',
        'HOLD',
        'NOT_INTERESTED',
        'MUTUAL'
    ) NOT NULL DEFAULT 'NEW',

    responder_remarks VARCHAR(1000) NULL,
    owner_remarks VARCHAR(1000) NULL,

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_ad_response (
        advertisement_id,
        responder_profile_id,
        response_type
    ),

    KEY idx_ad_response_owner (
        owner_profile_id
    ),

    KEY idx_ad_response_responder (
        responder_profile_id
    ),

    KEY idx_ad_response_status (
        response_status
    ),

    CONSTRAINT fk_ad_response_advertisement
        FOREIGN KEY (advertisement_id)
        REFERENCES preferred_profiles(id)
        ON DELETE CASCADE
);
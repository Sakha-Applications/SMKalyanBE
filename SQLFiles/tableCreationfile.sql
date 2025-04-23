-- Create the table to store mother tongue information
CREATE TABLE mother_tongues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mother_tongue VARCHAR(50) NOT NULL UNIQUE
);

-- Insert data into the mother_tongues table
INSERT INTO mother_tongues (mother_tongue) VALUES
    ('Hindi'),
    ('English'),
    ('Telugu'),
    ('Tamil'),
    ('Kannada'),
    ('Malayalam'),
    ('Marathi'),
    ('Bengali'),
    ('Gujarati'),
    ('Urdu'),
    ('Odia'),
    ('Punjabi'),
    ('Assamese'),
    ('Sanskrit'),
    ('Konkani'),
    ('Tulu'),
    ('Bodo'),
    ('Dogri'),
    ('Maithili'),
    ('Nepali'),
    ('Santhali'),
    ('Kashmiri'),
    ('Manipuri'),
    ('Sindhi');
    
    CREATE TABLE tblGuruMatha (
    id INT AUTO_INCREMENT PRIMARY KEY,
    GuruMathaName VARCHAR(255) NOT NULL
);

INSERT INTO tblGuruMatha (GuruMathaName) VALUES
    ('Adamar (ಆದಮಾರು)'),
    ('Anegundi Matha (ಅನೇಗುಂದಿ ಮಠ)'),
    ('Hosanagar (ಹೋಸದ ನಗರ)'),
    ('Kanva Matha (ಕಣ್ವ ಮಠ)'),
    ('Kashi Matha (ಕಾಶಿ ಮಠ)'),
    ('Krishna Matha (ಕೃಷ್ಣ ಮಠ)'),
    ('Krishnapura (ಕೃಷ್ಣಪುರ)'),
    ('Mulbagal (ಮೂಲಬಾಗಲು)'),
    ('Parakal (ಪರಕಾಲ)'),
    ('Pejavara (ಪೇಜಾವರ)'),
    ('Pejawara Matha (ಪೇಜಾವರ ಮಠ)'),
    ('Ramachandra Pura Matha (ರಾಮಚಂದ್ರ ಪುರ ಮಠ)'),
    ('Rayara Matha (ರಾಯರ ಮಠ)'),
    ('Shankar Mutt (ಶಂಕರ ಮಠ)'),
    ('Udupi Matha (ಉಡುಪಿ ಮಠ)'),
    ('Uttaradhi Matha (ಉತ್ತರಾಧಿ ಮಠ)'),
    ('Vyasaraja Matha (ವ್ಯಾಸರಾಜ ಮಠ)'),
    ('ಇತರ (Other)'); -- "ಇತರ (Other)" ಅನ್ನು ಸೇರಿಸಲಾಗಿದೆ


CREATE TABLE userlogin (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    profile_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES profile(profile_id) ON DELETE CASCADE
);

ALTER TABLE profile
MODIFY COLUMN height VARCHAR(50);

CREATE TABLE tblPayments (
    paymentId VARCHAR(255) NOT NULL,          -- Razorpay Payment ID
    orderId VARCHAR(255) NOT NULL,            -- Razorpay Order ID
    signature VARCHAR(255) NOT NULL,          -- Razorpay Signature for verification
    amount DECIMAL(10, 2) NOT NULL,           -- Amount paid (e.g., 1000.00)
    currency VARCHAR(10) NOT NULL,             -- Currency (e.g., 'INR')
    userId VARCHAR(255),                     -- User ID from your users table
    paymentDate DATETIME NOT NULL,           -- Date and time of the payment
    PRIMARY KEY (paymentId),                 -- paymentId is a good candidate for primary key
    FOREIGN KEY (userId) REFERENCES users(user_id) -- Corrected foreign key
    
    
);INSERT INTO tblnakshatra (id, nakshatraname) VALUES (11, 'Purva Phalguni (ಪೂರ್ವ ಫಾಲ್ಗುಣಿ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (12, 'Uttara Phalguni (ಉತ್ತರ ಫಾಲ್ಗುಣಿ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (13, 'Hasta (ಹಸ್ತ)');

INSERT INTO tblnakshatra (id, nakshatraname) VALUES (13, 'Hasta (ಹಸ್ತ)');

INSERT INTO tblnakshatra (id, nakshatraname) VALUES (14, 'Chitra (ಚಿತ್ರ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (15, 'Swati (ಸ್ವಾತಿ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (16, 'Vishakha (ವಿಶಾಖಾ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (17, 'Anuradha (ಅನುರಾಧಾ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (18, 'Jyeshtha (ಜ್ಯೇಷ್ಠಾ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (19, 'Mula (ಮೂಲ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (20, 'Purva Ashadha (ಪೂರ್ವಾಷಾಢ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (21, 'Uttara Ashadha (ಉತ್ತರಾಷಾಢ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (22, 'Shravana (ಶ್ರಾವಣ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (23, 'Dhanishta (ಧನಿಷ್ಠಾ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (24, 'Shatabhisha (ಶತಭಿಷ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (25, 'Purva Bhadrapada (ಪೂರ್ವಭಾದ್ರಪದ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (26, 'Uttara Bhadrapada (ಉತ್ತರಭಾದ್ರಪದ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (27, 'Revati (ರೇವತಿ)');


	-- Insert Karnataka Cities
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Bengaluru');
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Mysuru');
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Hubballi-Dharwad');
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Mangaluru');
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Belagavi');
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Kalaburagi');
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Vijayapura');
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Shivamogga');
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Tumakuru');
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Raichur');
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Ballari');
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Davangere');
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Hassan');
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Udupi');
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Kolar');

	-- Insert Other South Indian Cities
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Chennai'); -- Tamil Nadu
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Hyderabad'); -- Telangana
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Kochi');    -- Kerala
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Vijayawada');  -- Andhra Pradesh
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Coimbatore'); -- Tamil Nadu
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Visakhapatnam');  -- Andhra Pradesh
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Thiruvananthapuram'); -- Kerala
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Madurai');    -- Tamil Nadu
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Warangal');   -- Telangana
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Kozhikode');  -- Kerala

	-- Insert North Indian Cities
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Delhi');
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Mumbai'); -- Maharashtra
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Kolkata'); -- West Bengal
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Jaipur');  -- Rajasthan
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Lucknow');  -- Uttar Pradesh
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Chandigarh'); -- Punjab/Haryana
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Ahmedabad'); -- Gujarat
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Pune');      -- Maharashtra
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Kanpur');     -- Uttar Pradesh
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Nagpur');     -- Maharashtra
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Patna');       -- Bihar
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Bhopal');      -- Madhya Pradesh

	-- Insert Country Names
	INSERT INTO tblnativeplace (nativeplace) VALUES ('India');
	INSERT INTO tblnativeplace (nativeplace) VALUES ('USA');
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Canada');
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Australia');
	INSERT INTO tblnativeplace (nativeplace) VALUES ('United Kingdom');
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Germany');
	INSERT INTO tblnativeplace (nativeplace) VALUES ('France');
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Japan');
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Singapore');
	INSERT INTO tblnativeplace (nativeplace) VALUES ('Malaysia');
CREATE TABLE tblPayments (
    paymentId VARCHAR(255) NOT NULL,          -- Razorpay Payment ID
    orderId VARCHAR(255) NOT NULL,            -- Razorpay Order ID
    signature VARCHAR(255) NOT NULL,          -- Razorpay Signature for verification
    amount DECIMAL(10, 2) NOT NULL,           -- Amount paid (e.g., 1000.00)
    currency VARCHAR(10) NOT NULL,             -- Currency (e.g., 'INR')
    userId VARCHAR(255),                     -- User ID from your users table
    paymentDate DATETIME NOT NULL,           -- Date and time of the payment
    PRIMARY KEY (paymentId)              -- paymentId is a good candidate for primary key
);
CREATE INDEX idx_orderId ON tblPayments (orderId);

CREATE TABLE tblnativeplace (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nativeplace VARCHAR(255)
);

ALTER TABLE profile
ADD COLUMN profile_category VARCHAR(255),
ADD COLUMN profile_category_need VARCHAR(255);

CREATE TABLE contact_details_shared (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shared_with_profile_id VARCHAR(255) NOT NULL,
    shared_with_email VARCHAR(255) NOT NULL,
    shared_profile_id VARCHAR(255) NOT NULL,
    shared_profile_name VARCHAR(255),
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE profile MODIFY COLUMN working_status VARCHAR(100) NULL;

CREATE TABLE profile_photos (
    photo_id INT AUTO_INCREMENT PRIMARY KEY,
    profile_id VARCHAR(50), -- Foreign key to link to the profile table
    email VARCHAR(255), -- Foreign Key to link to the profile table
    photo_path VARCHAR(255) NOT NULL,
    filename VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES profile(profile_id),
    FOREIGN KEY (email) REFERENCES profile(email)
);

ALTER TABLE profile_photos
ADD COLUMN is_default BOOLEAN DEFAULT FALSE;

ALTER TABLE userlogin
ADD COLUMN password_change_count INT UNSIGNED DEFAULT 0;

ALTER TABLE userlogin
ADD COLUMN first_login BOOLEAN DEFAULT TRUE;

REATE TABLE tblPayments (
    paymentId VARCHAR(255) NOT NULL,          -- Razorpay Payment ID
    orderId VARCHAR(255) NOT NULL,            -- Razorpay Order ID
    signature VARCHAR(255) NOT NULL,          -- Razorpay Signature for verification
    amount DECIMAL(10, 2) NOT NULL,           -- Amount paid (e.g., 1000.00)
    currency VARCHAR(10) NOT NULL,             -- Currency (e.g., 'INR')
    userId VARCHAR(255),                     -- User ID from your users table
    paymentDate DATETIME NOT NULL,           -- Date and time of the payment
    PRIMARY KEY (paymentId),                 -- paymentId is a good candidate for primary key
    FOREIGN KEY (userId) REFERENCES users(user_id) -- Corrected foreign key
);INSERT INTO tblnakshatra (id, nakshatraname) VALUES (11, 'Purva Phalguni (ಪೂರ್ವ ಫಾಲ್ಗುಣಿ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (12, 'Uttara Phalguni (ಉತ್ತರ ಫಾಲ್ಗುಣಿ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (13, 'Hasta (ಹಸ್ತ)');

INSERT INTO tblnakshatra (id, nakshatraname) VALUES (13, 'Hasta (ಹಸ್ತ)');

INSERT INTO tblnakshatra (id, nakshatraname) VALUES (14, 'Chitra (ಚಿತ್ರ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (15, 'Swati (ಸ್ವಾತಿ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (16, 'Vishakha (ವಿಶಾಖಾ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (17, 'Anuradha (ಅನುರಾಧಾ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (18, 'Jyeshtha (ಜ್ಯೇಷ್ಠಾ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (19, 'Mula (ಮೂಲ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (20, 'Purva Ashadha (ಪೂರ್ವಾಷಾಢ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (21, 'Uttara Ashadha (ಉತ್ತರಾಷಾಢ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (22, 'Shravana (ಶ್ರಾವಣ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (23, 'Dhanishta (ಧನಿಷ್ಠಾ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (24, 'Shatabhisha (ಶತಭಿಷ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (25, 'Purva Bhadrapada (ಪೂರ್ವಭಾದ್ರಪದ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (26, 'Uttara Bhadrapada (ಉತ್ತರಭಾದ್ರಪದ)');
INSERT INTO tblnakshatra (id, nakshatraname) VALUES (27, 'Revati (ರೇವತಿ)');
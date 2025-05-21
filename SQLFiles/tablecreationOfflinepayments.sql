-- Create table for offline payments
CREATE TABLE tblOfflinePayments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    profile_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_type ENUM('donation', 'profile_renewal') NOT NULL,
    payment_mode VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(100),
    payment_date DATE NOT NULL,
    payment_time TIME NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES profile(profile_id) ON DELETE CASCADE
);

-- If you want to add additional indexes
CREATE INDEX idx_profile_id ON tblOfflinePayments(profile_id);
CREATE INDEX idx_payment_type ON tblOfflinePayments(payment_type);
CREATE INDEX idx_status ON tblOfflinePayments(status);
-- Update payment table to include total_price, payment_date, and invoice_number
ALTER TABLE payment
ADD COLUMN total_price DECIMAL(10,2) AFTER property_id,
ADD COLUMN payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN invoice_number VARCHAR(50);

-- Create index for faster invoice lookup
CREATE INDEX idx_invoice_number ON payment(invoice_number);

-- Create index for faster user payment history lookup
CREATE INDEX idx_user_property ON payment(user_id, property_id);

-- Add owner_id and owner_type to properties table if they don't exist
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS owner_id INT,
ADD COLUMN IF NOT EXISTS owner_type ENUM('admin', 'seller') DEFAULT 'admin';

-- Add foreign key constraint from owner_id to users.id
ALTER TABLE properties
ADD CONSTRAINT fk_owner_id
FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL; 
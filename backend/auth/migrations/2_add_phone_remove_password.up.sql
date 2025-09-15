-- Add phone number field and remove password
ALTER TABLE users 
  ADD COLUMN phone_number TEXT,
  DROP COLUMN password;

-- Create OTP table for temporary codes
CREATE TABLE otps (
  id BIGSERIAL PRIMARY KEY,
  phone_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '10 minutes'),
  used BOOLEAN DEFAULT FALSE
);

-- Update existing users with default phone numbers (for testing)
UPDATE users SET phone_number = '+1234567890' WHERE username = 'admin';
UPDATE users SET phone_number = '+1234567891' WHERE username = 'teacher';
UPDATE users SET phone_number = '+1234567892' WHERE username = 'student';
UPDATE users SET phone_number = '+1234567893' WHERE username = 'parent';

-- Make phone_number required after adding default values
ALTER TABLE users ALTER COLUMN phone_number SET NOT NULL;

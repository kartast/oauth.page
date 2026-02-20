-- Add OAuth identity columns to access_requests
ALTER TABLE access_requests ADD COLUMN avatar_url TEXT;
ALTER TABLE access_requests ADD COLUMN provider TEXT;

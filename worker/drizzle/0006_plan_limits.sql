-- Plan limits enforcement columns
ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN deploys_this_month INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN deploys_reset_at INTEGER;
ALTER TABLE users ADD COLUMN emails_this_month INTEGER DEFAULT 0;

ALTER TABLE sites ADD COLUMN views_this_month INTEGER DEFAULT 0;
ALTER TABLE sites ADD COLUMN views_reset_at INTEGER;

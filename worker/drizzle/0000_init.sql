-- GateKeep: Initial schema migration
-- Tables: users, sites, access_requests, sessions

CREATE TABLE IF NOT EXISTS `users` (
  `id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL,
  `name` text,
  `avatar_url` text,
  `github_id` text,
  `google_id` text,
  `created_at` integer NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `users_email_unique` ON `users` (`email`);
CREATE INDEX IF NOT EXISTS `idx_users_github_id` ON `users` (`github_id`);
CREATE INDEX IF NOT EXISTS `idx_users_google_id` ON `users` (`google_id`);

CREATE TABLE IF NOT EXISTS `sites` (
  `id` text PRIMARY KEY NOT NULL,
  `owner_id` text NOT NULL REFERENCES `users`(`id`),
  `slug` text NOT NULL,
  `origin_url` text NOT NULL,
  `name` text NOT NULL,
  `created_at` integer NOT NULL,
  `settings` text
);

CREATE UNIQUE INDEX IF NOT EXISTS `sites_slug_unique` ON `sites` (`slug`);
CREATE INDEX IF NOT EXISTS `idx_sites_owner_id` ON `sites` (`owner_id`);

CREATE TABLE IF NOT EXISTS `access_requests` (
  `id` text PRIMARY KEY NOT NULL,
  `site_id` text NOT NULL REFERENCES `sites`(`id`),
  `email` text NOT NULL,
  `name` text,
  `message` text,
  `status` text NOT NULL DEFAULT 'pending',
  `decided_by` text REFERENCES `users`(`id`),
  `decided_at` integer,
  `created_at` integer NOT NULL
);

CREATE INDEX IF NOT EXISTS `idx_access_requests_site_id` ON `access_requests` (`site_id`);
CREATE INDEX IF NOT EXISTS `idx_access_requests_email` ON `access_requests` (`email`);

CREATE TABLE IF NOT EXISTS `sessions` (
  `id` text PRIMARY KEY NOT NULL,
  `token` text NOT NULL,
  `site_id` text NOT NULL REFERENCES `sites`(`id`),
  `email` text NOT NULL,
  `expires_at` integer NOT NULL,
  `created_at` integer NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `sessions_token_unique` ON `sessions` (`token`);
CREATE INDEX IF NOT EXISTS `idx_sessions_site_id` ON `sessions` (`site_id`);

CREATE TABLE IF NOT EXISTS `one_time_links` (
  `id` text PRIMARY KEY NOT NULL,
  `site_id` text NOT NULL REFERENCES `sites`(`id`),
  `token_hash` text NOT NULL,
  `path` text NOT NULL DEFAULT '/',
  `expires_at` integer NOT NULL,
  `max_uses` integer NOT NULL DEFAULT 1,
  `uses_count` integer NOT NULL DEFAULT 0,
  `status` text NOT NULL DEFAULT 'active',
  `created_by` text NOT NULL,
  `created_at` integer NOT NULL,
  `consumed_at` integer,
  `consumed_ip` text,
  `consumed_ua` text
);

CREATE UNIQUE INDEX IF NOT EXISTS `idx_otl_site_token` ON `one_time_links` (`site_id`, `token_hash`);
CREATE INDEX IF NOT EXISTS `idx_otl_site_status` ON `one_time_links` (`site_id`, `status`);

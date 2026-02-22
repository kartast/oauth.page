-- Bandwidth tracking per site per day
CREATE TABLE IF NOT EXISTS `site_bandwidth` (
  `site_id` text NOT NULL REFERENCES `sites`(`id`),
  `date` text NOT NULL,
  `bytes_out` integer NOT NULL DEFAULT 0,
  `requests` integer NOT NULL DEFAULT 0,
  PRIMARY KEY (`site_id`, `date`)
);

CREATE INDEX IF NOT EXISTS `idx_bandwidth_site_date` ON `site_bandwidth` (`site_id`, `date` DESC);

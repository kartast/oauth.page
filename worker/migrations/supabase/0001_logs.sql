-- 0001_logs.sql — visitor logging table (gatekeep)  [APPLIED 2026-05-30]
-- Stores client-side JS logs from hosted sites. Read by the Worker (service_role key).
-- Applied via Supabase Management API; pg_cron handles 7-day retention server-side.

create table if not exists public.logs (
  id        bigint generated always as identity primary key,
  site      text        not null,                 -- site id (stamped server-side)
  visitor   text        not null,                 -- visitor email (stamped server-side)
  ts        timestamptz not null default now(),
  level     text        not null check (level in ('log','warn','error')),
  msg       text        not null,
  meta      jsonb
);

-- Query patterns: by site+time, and by site+visitor+time.
create index if not exists logs_site_ts      on public.logs (site, ts desc);
create index if not exists logs_site_visitor on public.logs (site, visitor, ts desc);

-- Lock down: only the secret (service_role) key may read/write.
alter table public.logs enable row level security;     -- no policies → anon/publishable gets nothing
revoke all on public.logs from anon, authenticated;    -- belt-and-suspenders (PII)
grant all on public.logs to service_role;              -- the Worker's key

-- 7-day retention, run daily at 03:00 UTC by Supabase's pg_cron.
create extension if not exists pg_cron;
select cron.schedule(
  'logs-retention-7d',
  '0 3 * * *',
  $$ delete from public.logs where ts < now() - interval '7 days' $$
);

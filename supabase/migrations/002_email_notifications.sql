-- Adds the email notifications preference to per-user state.
alter table public.user_data
  add column if not exists email_notifications boolean not null default false;

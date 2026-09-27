-- Tetapan pelayan sahaja (contoh: rahsia webhook Stripe yang dicipta secara automatik).
-- Skema "private" tidak didedahkan oleh API; hanya service_role boleh baca/tulis melalui fungsi di bawah.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
revoke all on private.app_config from public, anon, authenticated;

create or replace function public.get_app_config(p_key text)
returns text
language sql
security definer
set search_path = ''
as $$ select value from private.app_config where key = p_key $$;
revoke all on function public.get_app_config(text) from public, anon, authenticated;

create or replace function public.set_app_config(p_key text, p_value text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into private.app_config (key, value) values (p_key, p_value)
  on conflict (key) do update set value = excluded.value, updated_at = now()
$$;
revoke all on function public.set_app_config(text, text) from public, anon, authenticated;

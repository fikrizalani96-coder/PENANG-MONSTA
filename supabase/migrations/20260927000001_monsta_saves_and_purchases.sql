-- Simpanan permainan (satu baris setiap pemain)
create table public.saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  name text,
  badges smallint default 0,
  saved_at bigint,
  updated_at timestamptz not null default now(),
  constraint saves_size check (pg_column_size(data) < 800000)
);
alter table public.saves enable row level security;
create policy "saves: pemilik baca" on public.saves for select to authenticated using ((select auth.uid()) = user_id);
create policy "saves: pemilik tambah" on public.saves for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "saves: pemilik kemas kini" on public.saves for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "saves: pemilik padam" on public.saves for delete to authenticated using ((select auth.uid()) = user_id);

-- Hak milik (Buang Iklan, kostum) - ditulis oleh pelayan sahaja
create table public.entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  owned jsonb not null default '{}'::jsonb,
  no_ads boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.entitlements enable row level security;
create policy "entitlements: pemilik baca" on public.entitlements for select to authenticated using ((select auth.uid()) = user_id);

-- Rekod pembelian Stripe - ditulis oleh pelayan, dituntut oleh permainan
create table public.purchases (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  sku text not null,
  sen integer not null,
  created_at timestamptz not null default now(),
  claimed boolean not null default false,
  claimed_at timestamptz
);
create index purchases_user_unclaimed on public.purchases (user_id) where not claimed;
alter table public.purchases enable row level security;
create policy "purchases: pemilik baca" on public.purchases for select to authenticated using ((select auth.uid()) = user_id);

-- Rekod pembelian daripada webhook (idempoten); hanya untuk service_role
create or replace function public.record_purchase(p_id text, p_user uuid, p_sku text, p_sen integer, p_once boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare inserted boolean;
begin
  insert into public.purchases (id, user_id, sku, sen) values (p_id, p_user, p_sku, p_sen)
  on conflict (id) do nothing;
  get diagnostics inserted = row_count;
  if inserted then
    insert into public.entitlements (user_id, owned, no_ads)
    values (p_user, case when p_once then jsonb_build_object(p_sku, true) else '{}'::jsonb end, p_sku = 'buang_iklan')
    on conflict (user_id) do update
      set owned = public.entitlements.owned || case when p_once then jsonb_build_object(p_sku, true) else '{}'::jsonb end,
          no_ads = public.entitlements.no_ads or (p_sku = 'buang_iklan'),
          updated_at = now();
  end if;
  return inserted;
end;
$$;
revoke all on function public.record_purchase(text, uuid, text, integer, boolean) from public, anon, authenticated;

-- Bayaran balik "Buang Iklan": kembalikan iklan
create or replace function public.revoke_no_ads(p_user uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.entitlements
     set no_ads = false, owned = owned || '{"buang_iklan": false}'::jsonb, updated_at = now()
   where user_id = p_user;
$$;
revoke all on function public.revoke_no_ads(uuid) from public, anon, authenticated;

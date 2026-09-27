-- Pemain hanya boleh menukar claimed (false -> true) pada pembeliannya sendiri
revoke update on public.purchases from authenticated, anon;
grant update (claimed, claimed_at) on public.purchases to authenticated;
create policy "purchases: pemilik tuntut" on public.purchases for update to authenticated
  using ((select auth.uid()) = user_id and claimed = false)
  with check ((select auth.uid()) = user_id and claimed = true);

-- Tuntut pembelian yang belum dihantar ke dalam permainan (atomik, ikut RLS pemain)
create or replace function public.claim_purchases()
returns table (id text, sku text)
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return query
    update public.purchases p
       set claimed = true, claimed_at = now()
     where p.user_id = auth.uid() and p.claimed = false
    returning p.id, p.sku;
end;
$$;
revoke all on function public.claim_purchases() from public, anon;
grant execute on function public.claim_purchases() to authenticated;

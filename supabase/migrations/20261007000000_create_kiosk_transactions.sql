create table if not exists public.kiosk_transactions (
  reference text primary key,
  issued_at timestamptz not null,
  payment_method text not null check (payment_method in ('Cash', 'QR Payment', 'Credit/Debit Card')),
  total numeric(10, 2) not null check (total > 0),
  amount_paid numeric(10, 2) not null check (amount_paid >= total),
  change_due numeric(10, 2) not null check (change_due = amount_paid - total),
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0),
  created_at timestamptz not null default now()
);

alter table public.kiosk_transactions enable row level security;

revoke all on table public.kiosk_transactions from anon, authenticated;
grant insert on table public.kiosk_transactions to anon;

drop policy if exists "Allow kiosk to save completed simulated sales" on public.kiosk_transactions;
create policy "Allow kiosk to save completed simulated sales"
  on public.kiosk_transactions
  for insert
  to anon
  with check (true);

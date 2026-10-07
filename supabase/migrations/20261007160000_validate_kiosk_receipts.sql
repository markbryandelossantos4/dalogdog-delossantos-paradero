-- Harden the receipt snapshot at the database boundary.
-- Existing receipts are left untouched; NOT VALID enforces these checks on new rows
-- without requiring a scan or rewrite of historical kiosk transactions.

create or replace function public.kiosk_transaction_items_match_total(
  p_items jsonb,
  p_total numeric
)
returns boolean
language plpgsql
immutable
set search_path = pg_catalog
as $function$
declare
  v_item jsonb;
  v_quantity numeric;
  v_unit_price numeric;
  v_subtotal numeric;
  v_calculated_total numeric := 0;
begin
  if pg_catalog.jsonb_typeof(p_items) is distinct from 'array'
     or pg_catalog.jsonb_array_length(p_items) = 0 then
    return false;
  end if;

  for v_item in
    select element.value
    from pg_catalog.jsonb_array_elements(p_items) as element(value)
  loop
    if pg_catalog.jsonb_typeof(v_item) is distinct from 'object'
       or pg_catalog.jsonb_typeof(v_item -> 'productId') is distinct from 'string'
       or pg_catalog.jsonb_typeof(v_item -> 'name') is distinct from 'string'
       or pg_catalog.jsonb_typeof(v_item -> 'quantity') is distinct from 'number'
       or pg_catalog.jsonb_typeof(v_item -> 'unitPrice') is distinct from 'number'
       or pg_catalog.jsonb_typeof(v_item -> 'subtotal') is distinct from 'number'
       or pg_catalog.btrim(v_item ->> 'productId') = ''
       or pg_catalog.btrim(v_item ->> 'name') = '' then
      return false;
    end if;

    v_quantity := (v_item ->> 'quantity')::numeric;
    v_unit_price := (v_item ->> 'unitPrice')::numeric;
    v_subtotal := (v_item ->> 'subtotal')::numeric;

    if v_quantity <= 0
       or v_quantity <> pg_catalog.trunc(v_quantity)
       or v_unit_price <= 0
       or v_subtotal <> pg_catalog.round(v_quantity * v_unit_price, 2) then
      return false;
    end if;

    v_calculated_total := v_calculated_total + v_subtotal;
  end loop;

  return v_calculated_total = p_total;
exception
  when invalid_text_representation or numeric_value_out_of_range then
    return false;
end;
$function$;

revoke all on function public.kiosk_transaction_items_match_total(jsonb, numeric) from public;
grant execute on function public.kiosk_transaction_items_match_total(jsonb, numeric) to anon;

alter table public.kiosk_transactions
  add constraint kiosk_transactions_non_cash_exact_payment_check
  check (payment_method = 'Cash' or amount_paid = total)
  not valid;

alter table public.kiosk_transactions
  add constraint kiosk_transactions_items_match_total_check
  check (public.kiosk_transaction_items_match_total(items, total))
  not valid;

-- Run this after applying 20261007160000_validate_kiosk_receipts.sql.
-- The DO block only exercises the immutable validator; it does not write sales.

do $receipt_integrity_test$
begin
  if not public.kiosk_transaction_items_match_total(
    '[{"productId":"ube-latte","name":"Ube Cloud Latte","quantity":2,"unitPrice":85,"subtotal":170}]'::jsonb,
    170
  ) then
    raise exception 'Expected a valid two-item receipt to pass';
  end if;

  if public.kiosk_transaction_items_match_total(
    '[{"productId":"ube-latte","name":"Ube Cloud Latte","quantity":2,"unitPrice":85,"subtotal":160}]'::jsonb,
    160
  ) then
    raise exception 'Expected a line subtotal mismatch to fail';
  end if;

  if public.kiosk_transaction_items_match_total(
    '[{"productId":"ube-latte","name":"Ube Cloud Latte","quantity":1.5,"unitPrice":85,"subtotal":127.50}]'::jsonb,
    127.50
  ) then
    raise exception 'Expected a fractional item quantity to fail';
  end if;

  if public.kiosk_transaction_items_match_total('[]'::jsonb, 0) then
    raise exception 'Expected an empty receipt to fail';
  end if;
end;
$receipt_integrity_test$;

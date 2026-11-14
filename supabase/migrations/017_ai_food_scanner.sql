alter table public.meal_items
  alter column food_id drop not null,
  add column if not exists item_name text,
  add column if not exists source text not null default 'MANUAL',
  add column if not exists ai_confidence numeric,
  add column if not exists amount numeric,
  add column if not exists amount_unit text;

alter table public.meal_items
  add constraint meal_items_item_name_length_check
    check (item_name is null or char_length(item_name) <= 80),
  add constraint meal_items_source_check
    check (source in ('MANUAL', 'SCAN_DB', 'SCAN_ESTIMATE')),
  add constraint meal_items_ai_confidence_check
    check (ai_confidence is null or (ai_confidence >= 0 and ai_confidence <= 1)),
  add constraint meal_items_amount_check
    check (amount is null or amount > 0),
  add constraint meal_items_amount_unit_check
    check (amount_unit is null or amount_unit in ('g', 'ml', 'piece')),
  add constraint meal_items_food_or_estimate_check
    check (food_id is not null or (source = 'SCAN_ESTIMATE' and item_name is not null));

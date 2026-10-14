# PHASE 06 — Foods and meal logging

First read `AGENTS.md`. Then read only:
- `docs/TECHNICAL_SPEC_USER_MVP.md` §12, §17 (foods, meals, meal_items), §18
- `docs/UI_SPEC_USER_MVP.md` §13, §17
- Stitch screen: `docs/stitch/nutrition/`

## Goal
The user can search foods, log meals with quantities, edit/delete items, and see today's totals against their calorie and macro targets.

## Tasks

### Database
1. Migration `006_foods_meals.sql`:
   - `foods` (`id`, `name`, `slug` unique, `category`, `serving_size` numeric, `unit` (e.g. g, ml, piece), `calories`, `protein`, `carbs`, `fat` — all per serving, non-negative; `status` `DRAFT|PUBLISHED|ARCHIVED`, timestamps).
   - `meals` (`id`, `user_id`, `meal_type` `BREAKFAST|LUNCH|DINNER|SNACK`, `eaten_at`).
   - `meal_items` (`id`, `meal_id`, `user_id`, `food_id`, `quantity` (number of servings), `calories`, `protein`, `carbs`, `fat` — **snapshot values computed at logging time**).
2. RLS: `foods` — anyone authenticated can `SELECT` `PUBLISHED` rows (no write policies yet; admin policies in Phase 09). `meals` and `meal_items` — `auth.uid() = user_id`; `meal_items` insert must verify the meal belongs to the same user. Every user-owned table that the web client inserts into must define `user_id DEFAULT auth.uid()`; the client must not be trusted to send `user_id`.
3. Indexes for food search (name) and for meals by `(user_id, eaten_at)`.

### Seed
4. `supabase/seed/seed_foods.*`: load `supabase/seed/foods.csv` if present; otherwise create **at least 200 common foods** (staples, proteins, vegetables, fruits, dairy, snacks, drinks) with realistic nutrition per serving. Foods are `PUBLISHED`. Script must be re-runnable (upsert by slug). Add the run instructions to the README.

### Logic (pure, unit-tested)
5. `calculateItemNutrition(food, quantity)` → snapshot values, rounded sensibly. `sumNutrition(items)`. Tests for rounding, zero quantity rejection, large quantities.

### Frontend
6. `/nutrition` matching the Stitch design:
   - date selector (today by default; previous/next day)
   - calories, protein, carbs, fat: consumed / target / remaining with progress indicators (targets from the latest `fitness_assessments` row; if missing, show an explanatory empty state with a link to Profile)
   - meals grouped by Breakfast / Lunch / Dinner / Snack with their items and totals
   - primary CTA **Add Food**
7. **Add Food** modal/bottom sheet: debounced food search → result rows (name, serving, calories, protein, carbs, fat) → choose quantity (servings) and meal type → **Add**. Show live calculated nutrition for the chosen quantity before adding.
8. Edit item quantity (recalculates the snapshot from the current food data **at edit time**), delete item, delete empty meal. Confirm destructive actions.
9. Loading skeletons, empty state ("Nothing logged yet"), error with retry.
10. All access via Supabase client + RLS (no new Node endpoints). Validate inputs with Zod (quantity > 0 and within a sane maximum).

## Out of scope
Custom user-created foods, barcode/photo scanning, AI meal plans, nutrition history charts (Phase 07), admin food editing.

## Acceptance criteria
- [ ] Search returns only `PUBLISHED` foods.
- [ ] Added items store snapshot values; changing a food afterwards (via SQL) does **not** change existing history.
- [ ] Daily totals and remaining values are correct and update immediately after add/edit/delete.
- [ ] Date navigation shows the correct meals per day.
- [ ] Another user cannot read or modify my meals (RLS check demonstrated).
- [ ] Seed script is idempotent.
- [ ] `typecheck`, `build`, `test` pass.

## Report
Use the template in `AGENTS.md` §9 and stop.

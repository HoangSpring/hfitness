alter table public.foods
  add constraint foods_category_check check (category in (
    'Staples', 'Proteins', 'Vegetables', 'Fruits', 'Dairy',
    'Snacks', 'Vietnamese', 'Drinks', 'Legumes', 'Prepared'
  )),
  add constraint foods_unit_check check (unit in ('g', 'ml', 'piece')),
  add constraint foods_serving_size_max_check check (serving_size <= 100000),
  add constraint foods_calories_max_check check (calories <= 10000),
  add constraint foods_protein_max_check check (protein <= 1000),
  add constraint foods_carbs_max_check check (carbs <= 1000),
  add constraint foods_fat_max_check check (fat <= 1000);

drop policy if exists foods_published_select on public.foods;
create policy foods_published_select on public.foods for select to authenticated
  using (
    status = 'PUBLISHED'
    or public.is_admin()
    or exists (
      select 1
      from public.meal_items
      where meal_items.food_id = foods.id
        and meal_items.user_id = auth.uid()
    )
  );

drop policy if exists exercises_authenticated_select on public.exercises;
create policy exercises_authenticated_select
  on public.exercises for select
  to authenticated
  using (
    status = 'PUBLISHED'
    or public.is_admin()
    or exists (
      select 1
      from public.workout_plan_exercises
      join public.workout_plan_days on workout_plan_days.id = workout_plan_exercises.plan_day_id
      join public.workout_plans on workout_plans.id = workout_plan_days.plan_id
      where workout_plan_exercises.exercise_id = exercises.id
        and workout_plans.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.workout_sets
      where workout_sets.exercise_id = exercises.id
        and workout_sets.user_id = auth.uid()
    )
  );

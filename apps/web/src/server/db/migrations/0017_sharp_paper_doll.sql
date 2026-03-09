-- Merge duplicate diary entries before creating unique index:
-- Keep the row with the smallest id, sum serving_qty and scale nutrition columns.
WITH dupes AS (
  SELECT
    user_id, date, meal_type, food_id,
    count(*) AS cnt,
    min(id::text)::uuid AS keep_id
  FROM diary_entries
  GROUP BY user_id, date, meal_type, food_id
  HAVING count(*) > 1
)
UPDATE diary_entries de
SET
  serving_qty = de.serving_qty * d.cnt,
  calories    = de.calories    * d.cnt,
  protein_g   = de.protein_g   * d.cnt,
  carbs_g     = de.carbs_g     * d.cnt,
  fat_g       = de.fat_g       * d.cnt,
  fiber_g     = de.fiber_g     * d.cnt
FROM dupes d
WHERE de.id = d.keep_id;

WITH dupes AS (
  SELECT
    user_id, date, meal_type, food_id,
    min(id::text)::uuid AS keep_id
  FROM diary_entries
  GROUP BY user_id, date, meal_type, food_id
  HAVING count(*) > 1
)
DELETE FROM diary_entries de
USING dupes d
WHERE de.user_id   = d.user_id
  AND de.date      = d.date
  AND de.meal_type = d.meal_type
  AND de.food_id   = d.food_id
  AND de.id       != d.keep_id;

CREATE UNIQUE INDEX "diary_user_date_meal_food_idx" ON "diary_entries" USING btree ("user_id","date","meal_type","food_id");

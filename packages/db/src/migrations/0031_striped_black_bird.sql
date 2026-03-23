-- Fix any double-serialized repeat_days (stored as JSON string instead of array)
UPDATE "custom_reminders"
SET "repeat_days" = ("repeat_days" #>> '{}')::jsonb
WHERE jsonb_typeof("repeat_days") = 'string';

ALTER TABLE "custom_reminders" ADD CONSTRAINT "custom_reminders_repeat_days_is_array" CHECK (jsonb_typeof("custom_reminders"."repeat_days") = 'array');
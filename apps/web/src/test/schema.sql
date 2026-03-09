CREATE TYPE "public"."activity_level" AS ENUM('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active');
CREATE TYPE "public"."goal_type" AS ENUM('lose', 'maintain', 'gain');
CREATE TYPE "public"."sex" AS ENUM('male', 'female', 'other');
CREATE TYPE "public"."target_mode" AS ENUM('grams', 'percentage');
CREATE TYPE "public"."unit_system" AS ENUM('metric', 'imperial');
CREATE TYPE "public"."food_source" AS ENUM('usda', 'openfoodfacts', 'user', 'verified', 'family', 'seven');
CREATE TYPE "public"."nutrient_category" AS ENUM('macro', 'vitamin', 'mineral', 'other');
CREATE TYPE "public"."meal_type" AS ENUM('breakfast', 'lunch', 'dinner', 'snack');
CREATE TYPE "public"."photo_category" AS ENUM('front', 'side', 'back');
CREATE TYPE "public"."exercise_category" AS ENUM('cardio', 'strength', 'flexibility', 'sport', 'other');
CREATE TYPE "public"."intensity" AS ENUM('low', 'moderate', 'high');
CREATE TYPE "public"."fasting_protocol" AS ENUM('16_8', '18_6', '20_4', 'omad', 'custom');
CREATE TYPE "public"."streak_type" AS ENUM('logging', 'weight', 'water', 'exercise', 'fasting');
CREATE TYPE "public"."blog_status" AS ENUM('draft', 'published', 'archived');
CREATE TYPE "public"."sleep_detection_method" AS ENUM('accelerometer', 'microphone', 'both');
CREATE TYPE "public"."sleep_phase" AS ENUM('awake', 'light', 'deep', 'rem');
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);

CREATE TABLE "user_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"goal_type" "goal_type" DEFAULT 'maintain',
	"target_weight_kg" numeric(5, 1),
	"weekly_rate_kg" numeric(3, 2),
	"calorie_target" integer,
	"protein_g" numeric(5, 1),
	"carbs_g" numeric(5, 1),
	"fat_g" numeric(5, 1),
	"fiber_g" numeric(5, 1),
	"protein_pct" numeric(4, 1),
	"carbs_pct" numeric(4, 1),
	"fat_pct" numeric(4, 1),
	"target_mode" "target_mode" DEFAULT 'percentage',
	"tracked_nutrient_ids" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_goals_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date_of_birth" date,
	"sex" "sex",
	"height_cm" numeric(5, 1),
	"activity_level" "activity_level" DEFAULT 'moderately_active',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"timezone" varchar(50) DEFAULT 'UTC',
	"unit_system" "unit_system" DEFAULT 'metric',
	"referral_code" varchar(12),
	"plan" text DEFAULT 'free' NOT NULL,
	"plan_expires_at" timestamp with time zone,
	"trial_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);

CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "food_nutrients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_id" uuid NOT NULL,
	"nutrient_id" integer NOT NULL,
	"amount" numeric(10, 3) NOT NULL
);

CREATE TABLE "food_servings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_id" uuid NOT NULL,
	"label" varchar(100) NOT NULL,
	"grams" numeric(8, 2) NOT NULL
);

CREATE TABLE "foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(500) NOT NULL,
	"brand" varchar(255),
	"barcode" varchar(50),
	"source" "food_source" NOT NULL,
	"source_id" varchar(100),
	"serving_size" numeric(8, 2) NOT NULL,
	"serving_unit" varchar(50) NOT NULL,
	"household_serving" varchar(100),
	"description" text,
	"calories" numeric(7, 1) NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "nutrient_definitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"unit" varchar(20) NOT NULL,
	"category" "nutrient_category" NOT NULL,
	"display_order" integer,
	"daily_value" numeric(10, 3),
	"usda_nutrient_id" integer,
	CONSTRAINT "nutrient_definitions_name_unique" UNIQUE("name")
);

CREATE TABLE "diary_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"meal_type" "meal_type" NOT NULL,
	"food_id" uuid NOT NULL,
	"serving_qty" numeric(6, 2) DEFAULT '1' NOT NULL,
	"serving_id" uuid,
	"calories" numeric(7, 1),
	"protein_g" numeric(6, 1),
	"carbs_g" numeric(6, 1),
	"fat_g" numeric(6, 1),
	"fiber_g" numeric(6, 1),
	"sort_order" integer DEFAULT 0,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "quick_foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"food_id" uuid NOT NULL,
	"use_count" integer DEFAULT 1 NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "saved_meal_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"saved_meal_id" uuid NOT NULL,
	"food_id" uuid NOT NULL,
	"serving_qty" numeric(6, 2) DEFAULT '1' NOT NULL,
	"serving_id" uuid
);

CREATE TABLE "saved_meals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "body_measurements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"waist_cm" numeric(5, 1),
	"hip_cm" numeric(5, 1),
	"chest_cm" numeric(5, 1),
	"arm_cm" numeric(5, 1),
	"thigh_cm" numeric(5, 1),
	"neck_cm" numeric(5, 1),
	"body_fat_pct" numeric(4, 1),
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "progress_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"image_url" text NOT NULL,
	"category" "photo_category" DEFAULT 'front',
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "step_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"steps" numeric(7, 0) NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "tdee_calculations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"estimated_tdee" numeric(7, 1) NOT NULL,
	"weight_trend" numeric(5, 2),
	"avg_calories_in" numeric(7, 1),
	"confidence" numeric(3, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "weight_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"weight_kg" numeric(5, 2) NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "exercise_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"exercise_id" uuid NOT NULL,
	"duration_min" integer,
	"calories_burned" numeric(6, 1),
	"intensity" "intensity",
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"category" "exercise_category",
	"met_value" numeric(4, 1),
	"is_custom" boolean DEFAULT false NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_by" text
);

CREATE TABLE "water_containers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"amount_ml" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "water_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"daily_target_ml" integer DEFAULT 2500 NOT NULL,
	CONSTRAINT "water_goals_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE "water_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"amount_ml" integer NOT NULL,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "fasting_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"protocol" "fasting_protocol" NOT NULL,
	"eating_start" time NOT NULL,
	"eating_end" time NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "fasting_configs_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE "fasting_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"planned_hours" numeric(4, 1) NOT NULL,
	"actual_hours" numeric(4, 1),
	"completed" boolean DEFAULT false NOT NULL,
	"note" text
);

CREATE TABLE "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"icon" varchar(100),
	"category" varchar(50),
	"requirement" jsonb NOT NULL,
	CONSTRAINT "achievements_name_unique" UNIQUE("name")
);

CREATE TABLE "streaks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"streak_type" "streak_type" NOT NULL,
	"current_count" integer DEFAULT 0 NOT NULL,
	"longest_count" integer DEFAULT 0 NOT NULL,
	"last_logged_date" date
);

CREATE TABLE "user_achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"achievement_id" integer NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(500) NOT NULL,
	"slug" varchar(500) NOT NULL,
	"summary" text NOT NULL,
	"content" text NOT NULL,
	"thumbnail_url" text,
	"youtube_video_id" varchar(20),
	"youtube_channel" varchar(255),
	"video_published_at" timestamp with time zone,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"status" "blog_status" DEFAULT 'draft' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"parts" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_id" text NOT NULL,
	"referee_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "referral_payouts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"amount_ntd" integer NOT NULL,
	"method" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);

CREATE TABLE "referral_rewards" (
	"id" text PRIMARY KEY NOT NULL,
	"referral_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"amount_ntd" integer,
	"free_days" integer,
	"subscription_month" text,
	"provider_invoice_id" text,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "ai_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"feature" text NOT NULL,
	"date" date NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);

CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"plan" text NOT NULL,
	"status" text NOT NULL,
	"provider" text NOT NULL,
	"provider_sub_id" text,
	"provider_cust_id" text,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "water_reminder_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"start_time" text DEFAULT '08:00' NOT NULL,
	"end_time" text DEFAULT '22:00' NOT NULL,
	"interval_minutes" integer DEFAULT 120 NOT NULL,
	"stop_when_goal_reached" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "water_reminder_settings_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE "coach_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" text NOT NULL,
	"client_id" text NOT NULL,
	"start_date" date NOT NULL,
	"coach_notes" text,
	"calorie_target" integer,
	"protein_pct" numeric(4, 1),
	"carbs_pct" numeric(4, 1),
	"fat_pct" numeric(4, 1),
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "posture_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"reminder_enabled" boolean DEFAULT true NOT NULL,
	"snooze_minutes" integer DEFAULT 10 NOT NULL,
	CONSTRAINT "posture_configs_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE "posture_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"emoji" text NOT NULL,
	"max_minutes" integer NOT NULL,
	"suggested_break" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL
);

CREATE TABLE "posture_detection_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"threshold_degrees" numeric(4, 1) DEFAULT '8.5' NOT NULL,
	"notification_cooldown_seconds" integer DEFAULT 120 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	CONSTRAINT "posture_detection_configs_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE "posture_detection_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone NOT NULL,
	"baseline_pitch" numeric(6, 3) NOT NULL,
	"threshold_degrees" numeric(4, 1) DEFAULT '8.5' NOT NULL,
	"total_duration_minutes" integer NOT NULL,
	"good_posture_minutes" integer NOT NULL,
	"bad_posture_minutes" integer NOT NULL,
	"average_deviation" numeric(6, 3),
	"max_deviation" numeric(6, 3),
	"slouch_count" integer DEFAULT 0 NOT NULL,
	"notification_count" integer DEFAULT 0 NOT NULL,
	"score" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "posture_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"posture_id" uuid NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"duration_minutes" integer,
	"was_reminded" boolean DEFAULT false NOT NULL
);

CREATE TABLE "push_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"keys" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "sleep_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"goal_hours" numeric(3, 1) DEFAULT '8.0' NOT NULL,
	"alarm_window_minutes" integer DEFAULT 30 NOT NULL,
	CONSTRAINT "sleep_goals_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE "sleep_phases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"phase" "sleep_phase" NOT NULL
);

CREATE TABLE "sleep_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"sleep_onset" timestamp with time zone NOT NULL,
	"wake_time" timestamp with time zone NOT NULL,
	"duration_minutes" integer NOT NULL,
	"quality" integer NOT NULL,
	"detection_method" "sleep_detection_method" NOT NULL,
	"movement_samples" jsonb,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "personal_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"exercise_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"workout_set_id" uuid,
	"achieved_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "workout_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workout_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"note" text
);

CREATE TABLE "workout_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workout_exercise_id" uuid NOT NULL,
	"set_number" integer NOT NULL,
	"weight_kg" numeric(6, 2),
	"reps" integer,
	"duration_sec" integer,
	"rpe" numeric(3, 1),
	"is_warmup" boolean DEFAULT false NOT NULL,
	"is_dropset" boolean DEFAULT false NOT NULL,
	"is_personal_record" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone
);

CREATE TABLE "workout_template_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"default_sets" integer DEFAULT 3 NOT NULL,
	"default_reps" integer,
	"default_weight_kg" numeric(6, 2)
);

CREATE TABLE "workout_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "workouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(200) NOT NULL,
	"template_id" uuid,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"duration_sec" integer,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_goals" ADD CONSTRAINT "user_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "food_nutrients" ADD CONSTRAINT "food_nutrients_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "food_nutrients" ADD CONSTRAINT "food_nutrients_nutrient_id_nutrient_definitions_id_fk" FOREIGN KEY ("nutrient_id") REFERENCES "public"."nutrient_definitions"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "food_servings" ADD CONSTRAINT "food_servings_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "foods" ADD CONSTRAINT "foods_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "diary_entries" ADD CONSTRAINT "diary_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "diary_entries" ADD CONSTRAINT "diary_entries_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "diary_entries" ADD CONSTRAINT "diary_entries_serving_id_food_servings_id_fk" FOREIGN KEY ("serving_id") REFERENCES "public"."food_servings"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "quick_foods" ADD CONSTRAINT "quick_foods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "quick_foods" ADD CONSTRAINT "quick_foods_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "saved_meal_items" ADD CONSTRAINT "saved_meal_items_saved_meal_id_saved_meals_id_fk" FOREIGN KEY ("saved_meal_id") REFERENCES "public"."saved_meals"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "saved_meal_items" ADD CONSTRAINT "saved_meal_items_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "saved_meal_items" ADD CONSTRAINT "saved_meal_items_serving_id_food_servings_id_fk" FOREIGN KEY ("serving_id") REFERENCES "public"."food_servings"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "saved_meals" ADD CONSTRAINT "saved_meals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "body_measurements" ADD CONSTRAINT "body_measurements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "progress_photos" ADD CONSTRAINT "progress_photos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "step_logs" ADD CONSTRAINT "step_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "tdee_calculations" ADD CONSTRAINT "tdee_calculations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "weight_logs" ADD CONSTRAINT "weight_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "water_containers" ADD CONSTRAINT "water_containers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "water_goals" ADD CONSTRAINT "water_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "water_logs" ADD CONSTRAINT "water_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "fasting_configs" ADD CONSTRAINT "fasting_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "fasting_logs" ADD CONSTRAINT "fasting_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "streaks" ADD CONSTRAINT "streaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referee_id_users_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "referral_payouts" ADD CONSTRAINT "referral_payouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_referral_id_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "water_reminder_settings" ADD CONSTRAINT "water_reminder_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "coach_clients" ADD CONSTRAINT "coach_clients_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "coach_clients" ADD CONSTRAINT "coach_clients_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "posture_configs" ADD CONSTRAINT "posture_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "posture_definitions" ADD CONSTRAINT "posture_definitions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "posture_detection_configs" ADD CONSTRAINT "posture_detection_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "posture_detection_sessions" ADD CONSTRAINT "posture_detection_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "posture_sessions" ADD CONSTRAINT "posture_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "posture_sessions" ADD CONSTRAINT "posture_sessions_posture_id_posture_definitions_id_fk" FOREIGN KEY ("posture_id") REFERENCES "public"."posture_definitions"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sleep_goals" ADD CONSTRAINT "sleep_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sleep_phases" ADD CONSTRAINT "sleep_phases_session_id_sleep_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sleep_sessions"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sleep_sessions" ADD CONSTRAINT "sleep_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_workout_set_id_workout_sets_id_fk" FOREIGN KEY ("workout_set_id") REFERENCES "public"."workout_sets"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_workout_id_workouts_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_workout_exercise_id_workout_exercises_id_fk" FOREIGN KEY ("workout_exercise_id") REFERENCES "public"."workout_exercises"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workout_template_exercises" ADD CONSTRAINT "workout_template_exercises_template_id_workout_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."workout_templates"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workout_template_exercises" ADD CONSTRAINT "workout_template_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "workout_templates" ADD CONSTRAINT "workout_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_template_id_workout_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."workout_templates"("id") ON DELETE set null ON UPDATE no action;
CREATE UNIQUE INDEX "food_nutrients_unique_idx" ON "food_nutrients" USING btree ("food_id","nutrient_id");
CREATE INDEX "food_nutrients_food_idx" ON "food_nutrients" USING btree ("food_id");
CREATE INDEX "food_servings_food_idx" ON "food_servings" USING btree ("food_id");
CREATE INDEX "foods_barcode_idx" ON "foods" USING btree ("barcode");
CREATE INDEX "foods_name_search_idx" ON "foods" USING gin (to_tsvector('simple', "name" || ' ' || coalesce("brand", '')));
CREATE INDEX "foods_source_idx" ON "foods" USING btree ("source");
CREATE INDEX "diary_user_date_idx" ON "diary_entries" USING btree ("user_id","date");
CREATE INDEX "diary_user_date_meal_idx" ON "diary_entries" USING btree ("user_id","date","meal_type");
CREATE UNIQUE INDEX "diary_user_date_meal_food_idx" ON "diary_entries" USING btree ("user_id","date","meal_type","food_id");
CREATE UNIQUE INDEX "quick_foods_user_food_idx" ON "quick_foods" USING btree ("user_id","food_id");
CREATE UNIQUE INDEX "body_measurements_user_date_idx" ON "body_measurements" USING btree ("user_id","date");
CREATE INDEX "progress_photos_user_date_idx" ON "progress_photos" USING btree ("user_id","date");
CREATE UNIQUE INDEX "step_logs_user_date_idx" ON "step_logs" USING btree ("user_id","date");
CREATE UNIQUE INDEX "tdee_user_date_idx" ON "tdee_calculations" USING btree ("user_id","date");
CREATE UNIQUE INDEX "weight_logs_user_date_idx" ON "weight_logs" USING btree ("user_id","date");
CREATE INDEX "exercise_logs_user_date_idx" ON "exercise_logs" USING btree ("user_id","date");
CREATE INDEX "water_logs_user_date_idx" ON "water_logs" USING btree ("user_id","date");
CREATE INDEX "fasting_logs_user_started_idx" ON "fasting_logs" USING btree ("user_id","started_at");
CREATE UNIQUE INDEX "streaks_user_type_idx" ON "streaks" USING btree ("user_id","streak_type");
CREATE UNIQUE INDEX "user_achievements_unique_idx" ON "user_achievements" USING btree ("user_id","achievement_id");
CREATE UNIQUE INDEX "blog_posts_slug_idx" ON "blog_posts" USING btree ("slug");
CREATE UNIQUE INDEX "blog_posts_youtube_video_id_idx" ON "blog_posts" USING btree ("youtube_video_id");
CREATE INDEX "blog_posts_status_created_idx" ON "blog_posts" USING btree ("status","created_at");
CREATE INDEX "chat_messages_session_created_idx" ON "chat_messages" USING btree ("session_id","created_at");
CREATE INDEX "chat_messages_user_role_created_idx" ON "chat_messages" USING btree ("user_id","role","created_at");
CREATE INDEX "chat_sessions_user_updated_idx" ON "chat_sessions" USING btree ("user_id","updated_at");
CREATE UNIQUE INDEX "referrals_referee_unique_idx" ON "referrals" USING btree ("referee_id");
CREATE INDEX "idx_referral_payouts_user" ON "referral_payouts" USING btree ("user_id");
CREATE INDEX "idx_referral_rewards_user" ON "referral_rewards" USING btree ("user_id");
CREATE INDEX "idx_referral_rewards_referral" ON "referral_rewards" USING btree ("referral_id");
CREATE INDEX "idx_referral_rewards_status" ON "referral_rewards" USING btree ("status");
CREATE UNIQUE INDEX "ai_usage_user_feature_date_idx" ON "ai_usage" USING btree ("user_id","feature","date");
CREATE INDEX "idx_subscriptions_user" ON "subscriptions" USING btree ("user_id");
CREATE INDEX "idx_subscriptions_provider" ON "subscriptions" USING btree ("provider","provider_sub_id");
CREATE UNIQUE INDEX "coach_clients_coach_client_idx" ON "coach_clients" USING btree ("coach_id","client_id");
CREATE INDEX "coach_clients_coach_idx" ON "coach_clients" USING btree ("coach_id");
CREATE INDEX "coach_clients_client_idx" ON "coach_clients" USING btree ("client_id");
CREATE INDEX "posture_definitions_user_idx" ON "posture_definitions" USING btree ("user_id");
CREATE INDEX "posture_detection_user_started_idx" ON "posture_detection_sessions" USING btree ("user_id","started_at");
CREATE INDEX "posture_sessions_user_started_idx" ON "posture_sessions" USING btree ("user_id","started_at");
CREATE INDEX "push_subscriptions_user_idx" ON "push_subscriptions" USING btree ("user_id");
CREATE INDEX "sleep_phases_session_idx" ON "sleep_phases" USING btree ("session_id");
CREATE UNIQUE INDEX "sleep_sessions_user_start_idx" ON "sleep_sessions" USING btree ("user_id","start_time");
CREATE UNIQUE INDEX "personal_records_user_exercise_type_idx" ON "personal_records" USING btree ("user_id","exercise_id","type");
CREATE INDEX "workout_exercises_workout_idx" ON "workout_exercises" USING btree ("workout_id","sort_order");
CREATE INDEX "workout_sets_exercise_idx" ON "workout_sets" USING btree ("workout_exercise_id","set_number");
CREATE INDEX "workout_template_exercises_template_idx" ON "workout_template_exercises" USING btree ("template_id","sort_order");
CREATE INDEX "workout_templates_user_idx" ON "workout_templates" USING btree ("user_id");
CREATE INDEX "workouts_user_started_idx" ON "workouts" USING btree ("user_id","started_at");

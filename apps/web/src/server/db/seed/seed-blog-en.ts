/**
 * Seed English version of the Open Health Guide blog post.
 *
 * Usage:
 *   cd apps/web && source .env.local && DATABASE_URL=$DATABASE_URL tsx src/server/db/seed/seed-blog-en.ts
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { blogPosts } from "../schema";
import { eq, and } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(sql);

const SLUG = "open-health-guide";
const LOCALE = "en";

const TITLE = "Open Health Complete Guide: From Food Tracking to Workout Logging";
const SUMMARY =
  "A complete walkthrough of all Open Health features, including food diary, AI food recognition, water tracking, exercise log, intermittent fasting, weight tracking, and the brand-new workout log.";
const TAGS = ["Guide", "Features", "Workout", "Nutrition Tracking"];
const THUMBNAIL = "/blog/open-health-guide-cover.png";

const CONTENT = `## What is Open Health?

Open Health is an open-source health tracking app that helps you log your diet, exercise, water intake, weight, and more. With AI-powered food recognition, nutrition tracking has never been easier.

---

## Feature Hub

From the Hub page you can quickly access all feature modules:

- Food Diary
- Food Search & AI Recognition
- Water Tracking
- Exercise Log
- Intermittent Fasting
- Workout Log (New!)
- Weight & Body Data
- AI Nutrition Advisor

![Feature Hub](/screenshots/en/01-hub.png)

---

## Today's Overview

The "Today" page is your personal health dashboard — see all your daily health data at a glance:

- **Calorie Intake**: Consumed / Remaining / Target at a glance
- **Macronutrients**: Track protein, carbs, fat, and fiber separately
- **Water Intake**: Daily hydration tracking
- **Weight Log**: Latest weight and 7-day trend
- **Steps**: Daily step count
- **AI Nutrition Advisor**: Get dietary advice anytime

![Today's Overview](/screenshots/en/02-today.png)

---

## AI Nutrition Advisor

Built-in AI nutrition advisor that can:

- Analyze your dietary records
- Provide personalized nutrition advice
- Answer nutrition-related questions
- Suggest meal plans

![AI Advisor](/screenshots/en/03-ai-chat.png)

---

## Food Diary

### Search Food

Multiple ways to add food:

1. **Keyword Search** — Search a database of over 1 million foods (USDA + OpenFoodFacts)
2. **AI Photo Recognition** — Take a photo of your food and let AI estimate the nutrition
3. **Nutrition Label Scan** — Scan packaged food labels for automatic nutrient detection
4. **Create Custom Food** — Manually enter food and nutrient details

![Food Search](/screenshots/en/04-food-search.png)

### Daily Food Log

Your food diary shows all meals for the day — breakfast, lunch, dinner, and snacks — with a calorie and macro summary at the top.

![Food Diary](/screenshots/en/05-diary.png)

### Food Details

Every food item comes with detailed nutrition info:

- Calories and macronutrients
- Vitamins and minerals (Pro feature)
- Custom serving sizes
- Add to daily diary

![Food Details](/screenshots/en/06-food-detail.png)

### Create Custom Food

Can't find your food? Create it manually:

![Create Food](/screenshots/en/07-food-create.png)

### AI Food Recognition

Simply take a photo or upload a food image — AI will identify the food and estimate calories and nutrients.

![AI Estimate](/screenshots/en/08-ai-estimate.png)

---

## Weight & Progress Tracking

Track your weight over time with trend charts and progress analysis:

- Weight trend line chart
- Progress photo comparisons
- BMI and body composition data

![Progress Tracking](/screenshots/en/09-progress.png)

---

## Workout Log (Brand New!)

Our brand-new workout log lets you track every training session just like Strong App.

### Workout Home

From the workout log home page, you can:

- **Start Empty Workout** — Begin a new training session anytime
- **Use Templates** — Quickly start a routine from preset templates
- **Recent Workouts** — Review recent sessions with total volume and PR markers

![Workout Home](/screenshots/en/13-workout-home.png)

### Active Workout

During a workout, you'll see:

- **Live Timer** — Track total workout duration
- **Rest Timer** — Countdown between sets (30s, 1min, 1.5min, 2min, 3min)
- **Exercise Cards** — Each exercise shows sets, weight (kg), and reps
- **Completion Markers** — Check off each set as you finish

Workflow:
1. Tap "Add Exercise" to select an exercise
2. Enter weight and reps for each set
3. Tap ✓ to complete the set
4. Add more sets or exercises
5. Tap "Finish" when done

### Exercise Selection

Tap "Add Exercise" to open the exercise picker with category filters:

- **All** — All 33 preset exercises
- **Cardio** — Running, walking, swimming, cycling, and 11 more
- **Strength** — Bench press, squat, deadlift, pull-up, and 7 more
- **Flexibility** — Yoga, stretching, pilates, tai chi
- **Sports** — Basketball, badminton, tennis, and 8 more
- **Other** — Walking, gardening, etc.

Search is supported to quickly find the exercise you need.

### Personal Record Tracking

The system automatically detects and marks your personal records (PRs):

- **Max Weight** — Heaviest single set
- **Max Estimated 1RM** — Estimated one-rep max using the Epley formula
- **Max Volume** — Highest total volume for an exercise in a single session
- **Max Reps** — Most reps in a single set

Every time you break a record, a trophy marker appears in your workout log!

### Workout Templates

Create templates from your favorite routines for one-tap access:

- Custom template names
- Set exercises and default sets
- Save completed workouts as templates

### Workout Statistics

Track your training progress and view data trends:

- Weight / Volume / 1RM trends by exercise
- Personal records leaderboard
- Time range filter (Week / Month / Year)

---

## More Features

### Water Tracking

Log daily water intake, set daily goals, and build a healthy hydration habit. Quick-add common volumes and customize cup sizes.

![Water Tracking](/screenshots/en/10-water.png)

### Exercise Log

Log cardio, strength, flexibility, and other activities. 33 preset exercises with automatic calorie calculation based on MET values.

![Exercise Log](/screenshots/en/11-exercise.png)

### Intermittent Fasting

Support for multiple fasting protocols (16:8, 18:6, 20:4, etc.). One-tap start/stop fasting with a live countdown timer.

![Intermittent Fasting](/screenshots/en/12-fasting.png)

---

## Get Started

Open Health is completely free and open-source. Head to [openhealth.blog](https://openhealth.blog) to create an account and start your health tracking journey!

### Pro Features

Upgrade to Pro to unlock advanced features:

- Unlimited AI recognition
- Micronutrient tracking
- Exercise calorie calculation
- Intermittent fasting tracking
- Progress photos
- Workout log
- Data export
`;

async function main() {
  // Check if English version already exists
  const existing = await db
    .select({ id: blogPosts.id })
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, SLUG), eq(blogPosts.locale, LOCALE)))
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    await db
      .update(blogPosts)
      .set({
        title: TITLE,
        summary: SUMMARY,
        content: CONTENT,
        thumbnailUrl: THUMBNAIL,
        tags: TAGS,
        status: "published",
        updatedAt: new Date(),
      })
      .where(and(eq(blogPosts.slug, SLUG), eq(blogPosts.locale, LOCALE)));
    console.log("Updated existing English blog post");
  } else {
    // Insert new
    await db.insert(blogPosts).values({
      title: TITLE,
      slug: SLUG,
      summary: SUMMARY,
      content: CONTENT,
      thumbnailUrl: THUMBNAIL,
      tags: TAGS,
      locale: LOCALE,
      status: "published",
    });
    console.log("Inserted new English blog post");
  }

  await sql.end();
  console.log("Done!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

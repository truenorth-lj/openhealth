/**
 * Seed blog post: Beginner's Guide to Food Tracking (zh-TW + en)
 *
 * Usage:
 *   cd apps/web && source .env.local && DATABASE_URL=$DATABASE_URL tsx src/server/db/seed/seed-blog-beginners-guide.ts
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

const SLUG = "beginners-guide-calorie-tracking";

// ─── zh-TW Version ───

const ZH_TITLE = "新手指南：如何開始追蹤飲食與計算熱量（2026 完整教學）";
const ZH_SUMMARY =
  "想開始記錄飲食但不知道從何下手？這篇完整教學帶你從零開始，了解 TDEE、巨量營養素、如何選擇追蹤工具，到建立可持續的飲食記錄習慣。";
const ZH_TAGS = ["新手指南", "熱量計算", "TDEE", "巨量營養素", "飲食追蹤"];
const ZH_THUMBNAIL = "/blog/beginners-guide-cover.png";

const ZH_CONTENT = `## 為什麼要追蹤飲食？

「你無法管理你不衡量的東西。」這句話用在飲食上特別貼切。

追蹤飲食不是要你變得神經質地計算每一克食物，而是幫助你：

- **了解自己的飲食模式**：很多人以為自己吃得很健康，追蹤後才發現蛋白質長期不足
- **達成體重目標**：不管是增肌還是減脂，熱量是最基本的變數
- **建立飲食意識**：追蹤幾週後，你會對食物的營養有直覺性的判斷力
- **發現問題**：長期追蹤能發現微量營養素的缺乏

研究顯示，持續追蹤飲食的人在體重管理上的成功率是不追蹤者的 **2-3 倍**。

---

## 第一步：了解你的 TDEE

### 什麼是 TDEE？

**TDEE（Total Daily Energy Expenditure）** 是你每天消耗的總熱量，包含：

- **BMR（基礎代謝率）**：身體維持生命所需的最低熱量（佔 60-70%）
- **TEF（食物熱效應）**：消化食物消耗的熱量（佔 10%）
- **NEAT（非運動性活動消耗）**：日常活動如走路、站立（佔 15-20%）
- **EAT（運動消耗）**：刻意運動消耗的熱量（佔 5-10%）

### 如何計算 TDEE

最簡單的方式是用 **Mifflin-St Jeor 公式** 計算 BMR，再乘以活動係數：

**男性 BMR** = 10 × 體重(kg) + 6.25 × 身高(cm) - 5 × 年齡 - 5

**女性 BMR** = 10 × 體重(kg) + 6.25 × 身高(cm) - 5 × 年齡 - 161

然後乘以活動係數：

| 活動等級 | 係數 | 描述 |
|---------|------|------|
| 久坐 | 1.2 | 辦公室工作，幾乎不運動 |
| 輕度活動 | 1.375 | 每週輕度運動 1-3 天 |
| 中度活動 | 1.55 | 每週中等強度運動 3-5 天 |
| 高度活動 | 1.725 | 每週高強度運動 6-7 天 |
| 極高活動 | 1.9 | 體力勞動 + 每天訓練 |

### 舉例

一位 30 歲、170 cm、70 kg 的男性上班族：
- BMR = 10 × 70 + 6.25 × 170 - 5 × 30 - 5 = **1,608 kcal**
- TDEE = 1,608 × 1.375（輕度活動）= **2,211 kcal**

這代表他每天大約消耗 2,211 大卡。

---

## 第二步：設定你的熱量目標

知道 TDEE 之後，根據你的目標調整：

| 目標 | 熱量調整 | 建議 |
|------|---------|------|
| **減脂** | TDEE - 300~500 kcal | 不建議低於 BMR |
| **維持** | = TDEE | 適合初學者先觀察 |
| **增肌** | TDEE + 200~300 kcal | 搭配重量訓練 |

### 重要提醒

- **不要太激進**：每週減 0.5-1% 體重是安全的速度
- **先追蹤再調整**：建議先用 TDEE 吃 1-2 週，觀察體重變化再微調
- **TDEE 只是起點**：每個人的代謝不同，需要根據實際結果調整

---

## 第三步：認識巨量營養素

熱量來自三大巨量營養素（macros）：

### 蛋白質（Protein）— 4 kcal/g

**為什麼重要**：維持肌肉、修復組織、增加飽足感

**建議攝取量**：
- 一般人：每公斤體重 0.8-1.0g
- 運動者/減脂：每公斤體重 1.6-2.2g
- 70 kg 的人 → 每天 112-154g 蛋白質

**優質來源**：雞胸肉、魚、蛋、豆腐、希臘優格、毛豆

### 碳水化合物（Carbohydrates）— 4 kcal/g

**為什麼重要**：大腦和運動的主要能量來源

**建議攝取量**：總熱量的 40-55%

**優質來源**：糙米、地瓜、燕麥、水果、全麥麵包

### 脂肪（Fat）— 9 kcal/g

**為什麼重要**：荷爾蒙製造、維生素吸收、細胞結構

**建議攝取量**：總熱量的 20-35%（不要低於 20%）

**優質來源**：酪梨、堅果、橄欖油、魚油、蛋黃

### 巨量營養素分配範例

以 TDEE 2,200 kcal、體重 70 kg 的減脂目標為例（攝取 1,800 kcal）：

| 營養素 | 比例 | 克數 | 熱量 |
|--------|------|------|------|
| 蛋白質 | 30% | 135g | 540 kcal |
| 碳水 | 45% | 203g | 810 kcal |
| 脂肪 | 25% | 50g | 450 kcal |
| **合計** | 100% | — | **1,800 kcal** |

---

## 第四步：選擇追蹤工具

現在你知道要追蹤什麼了，接下來選一個趁手的工具。

### 好的追蹤工具應該具備

1. **完整的食物資料庫**：能找到你常吃的食物
2. **簡單的記錄方式**：搜尋、掃條碼、拍照，越快越好
3. **清楚的數據呈現**：一眼看到今天的熱量和營養素攝取
4. **中文支援**：台灣的食物名稱和品牌要找得到

### 推薦：Open Health

[Open Health](https://openhealth.blog) 是一款免費的開源健康追蹤 App，特別適合新手：

- **100 萬+ 食物資料庫**：整合 USDA + OpenFoodFacts
- **AI 拍照辨識**：不想打字？拍張照就能記錄
- **營養標示掃描**：掃描包裝食品的營養標示
- **清楚的每日總覽**：熱量、三大營養素一目瞭然
- **免費使用**：核心功能不收費

👉 [免費註冊 Open Health](https://openhealth.blog)

---

## 第五步：建立可持續的追蹤習慣

追蹤飲食最大的挑戰不是「怎麼追蹤」，而是「怎麼持續」。以下是實戰建議：

### 1. 不需要追蹤到完美

80% 的準確度就夠了。與其糾結一道菜的油放了幾克，不如確保你每天都有記錄。**一致性比精確度重要**。

### 2. 善用常吃食物

大多數人每天吃的食物其實就那 20-30 種。把常吃的食物加入最愛，記錄速度會快很多。

### 3. 即時記錄

吃完就記，不要拖到晚上。晚上回想容易遺漏和估算錯誤。

### 4. 外食怎麼辦？

- 在 App 搜尋餐廳名稱或類似的食物
- 用 AI 拍照估算
- 寧可高估 10% 也不要低估

### 5. 不要因為一餐「爆掉」就放棄

一頓大餐不會毀了你的進度。把追蹤當成數據收集，不要當成道德審判。記錄下來，明天繼續。

### 6. 設定階段性目標

- **第 1 週**：只記錄，不調整。先了解現在的飲食狀況
- **第 2-3 週**：開始微調，先調整蛋白質攝取
- **第 4 週以後**：根據體重變化調整總熱量

---

## 常見問題

### Q：需要每天都追蹤嗎？

建議至少追蹤 **平日 + 週末各一天**，因為很多人平日吃得很好但週末暴食。理想的話，前 2-4 週每天追蹤，之後可以減少到一週追蹤 3-4 天。

### Q：追蹤多久才能看到效果？

通常 2-3 週就能看到趨勢。如果是減脂目標，4-6 週應該能看到明顯的體重變化。

### Q：食物標示的熱量準確嗎？

包裝食品的營養標示法規允許 ±20% 的誤差。不需要太擔心，因為你的 TDEE 本身也是估算值，兩個誤差會互相抵消。

### Q：追蹤飲食會不會導致飲食障礙？

對大多數人來說不會。但如果你發現自己對數字過度焦慮、開始限制正常飲食、或對「超標」感到極度罪惡，建議暫停追蹤並諮詢專業人士。追蹤是工具，不是枷鎖。

---

## 結論：開始行動

飲食追蹤不需要完美，也不需要永遠持續。把它當成一個學習階段 — 花 4-8 週認真追蹤，你會對食物的營養有全新的認識，這份知識會受用一輩子。

最好的開始方式就是現在就開始。選一個工具，記錄今天的第一餐。

👉 [用 Open Health 開始你的飲食追蹤之旅](https://openhealth.blog)

> 💡 **延伸閱讀**：[AI 拍照算熱量：5 款 App 實測比較](/blog/ai-photo-calorie-tracking) | [MyFitnessPal 替代方案](/blog/myfitnesspal-alternatives)
`;

// ─── English Version ───

const EN_TITLE =
  "Beginner's Guide to Food Tracking & Calorie Counting (2026)";
const EN_SUMMARY =
  "Want to start tracking your diet but don't know where to begin? This complete guide covers TDEE, macros, choosing the right tool, and building sustainable tracking habits.";
const EN_TAGS = [
  "Beginner Guide",
  "Calorie Counting",
  "TDEE",
  "Macros",
  "Food Tracking",
];
const EN_THUMBNAIL = "/blog/beginners-guide-cover.png";

const EN_CONTENT = `## Why Track Your Food?

"You can't manage what you don't measure." This is especially true for nutrition.

Food tracking isn't about obsessively counting every gram. It's about:

- **Understanding your eating patterns**: Many people think they eat healthy until tracking reveals chronic protein deficiency
- **Reaching weight goals**: Whether bulking or cutting, calories are the fundamental variable
- **Building food awareness**: After a few weeks of tracking, you'll develop intuitive nutritional judgment
- **Spotting deficiencies**: Long-term tracking reveals micronutrient gaps

Research shows that consistent food trackers are **2-3x more successful** at weight management.

---

## Step 1: Understand Your TDEE

### What Is TDEE?

**TDEE (Total Daily Energy Expenditure)** is the total calories you burn daily:

- **BMR (Basal Metabolic Rate)**: Minimum calories to sustain life (60-70%)
- **TEF (Thermic Effect of Food)**: Calories burned digesting food (10%)
- **NEAT (Non-Exercise Activity Thermogenesis)**: Daily activities like walking, standing (15-20%)
- **EAT (Exercise Activity Thermogenesis)**: Intentional exercise (5-10%)

### How to Calculate TDEE

Use the **Mifflin-St Jeor equation** for BMR, then multiply by an activity factor:

**Male BMR** = 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 5

**Female BMR** = 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161

Multiply by activity level:

| Activity Level | Factor | Description |
|---------------|--------|-------------|
| Sedentary | 1.2 | Desk job, minimal exercise |
| Lightly Active | 1.375 | Light exercise 1-3 days/week |
| Moderately Active | 1.55 | Moderate exercise 3-5 days/week |
| Very Active | 1.725 | Intense exercise 6-7 days/week |
| Extremely Active | 1.9 | Physical labor + daily training |

### Example

A 30-year-old male, 170 cm, 70 kg, office worker:
- BMR = 10 × 70 + 6.25 × 170 - 5 × 30 - 5 = **1,608 kcal**
- TDEE = 1,608 × 1.375 (lightly active) = **2,211 kcal**

This means he burns roughly 2,211 calories per day.

---

## Step 2: Set Your Calorie Target

Once you know your TDEE, adjust based on your goal:

| Goal | Calorie Adjustment | Notes |
|------|-------------------|-------|
| **Fat Loss** | TDEE - 300~500 kcal | Don't go below BMR |
| **Maintenance** | = TDEE | Good for beginners to observe first |
| **Muscle Gain** | TDEE + 200~300 kcal | Combine with resistance training |

### Important Notes

- **Don't be too aggressive**: Losing 0.5-1% bodyweight per week is a safe rate
- **Track first, adjust later**: Eat at TDEE for 1-2 weeks, observe weight trends, then adjust
- **TDEE is a starting point**: Everyone's metabolism differs — adjust based on actual results

---

## Step 3: Understand Macronutrients

Calories come from three macronutrients:

### Protein — 4 kcal/g

**Why it matters**: Maintains muscle, repairs tissue, increases satiety

**Recommended intake**:
- General population: 0.8-1.0g per kg bodyweight
- Active/cutting: 1.6-2.2g per kg bodyweight
- 70 kg person → 112-154g protein daily

**Quality sources**: Chicken breast, fish, eggs, tofu, Greek yogurt, edamame

### Carbohydrates — 4 kcal/g

**Why it matters**: Primary energy source for brain and exercise

**Recommended intake**: 40-55% of total calories

**Quality sources**: Brown rice, sweet potato, oats, fruit, whole wheat bread

### Fat — 9 kcal/g

**Why it matters**: Hormone production, vitamin absorption, cell structure

**Recommended intake**: 20-35% of total calories (don't go below 20%)

**Quality sources**: Avocado, nuts, olive oil, fish oil, egg yolks

### Macro Split Example

For a 70 kg person with TDEE 2,200 kcal, targeting fat loss at 1,800 kcal:

| Nutrient | Ratio | Grams | Calories |
|----------|-------|-------|----------|
| Protein | 30% | 135g | 540 kcal |
| Carbs | 45% | 203g | 810 kcal |
| Fat | 25% | 50g | 450 kcal |
| **Total** | 100% | — | **1,800 kcal** |

---

## Step 4: Choose Your Tracking Tool

Now you know what to track. Pick a tool that works for you.

### What to Look For

1. **Comprehensive food database**: Can you find the foods you actually eat?
2. **Quick logging**: Search, barcode scanning, photo AI — the faster the better
3. **Clear data display**: See today's calories and macros at a glance
4. **Sustainable UX**: If it's tedious, you won't stick with it

### Recommended: Open Health

[Open Health](https://openhealth.blog) is a free, open-source health tracking app ideal for beginners:

- **1M+ food database**: Integrated USDA + OpenFoodFacts
- **AI photo recognition**: Don't want to type? Snap a photo
- **Nutrition label scanning**: Scan packaged food labels instantly
- **Clear daily overview**: Calories and macros at a glance
- **Free to use**: Core features are completely free

👉 [Sign up for Open Health — free](https://openhealth.blog)

---

## Step 5: Build Sustainable Tracking Habits

The biggest challenge isn't "how to track" — it's "how to keep tracking." Here's practical advice:

### 1. You Don't Need Perfection

80% accuracy is enough. Rather than agonizing over how many grams of oil were in a dish, make sure you log something every day. **Consistency beats precision.**

### 2. Leverage Your Regular Foods

Most people rotate through 20-30 foods regularly. Favorite your go-to items and logging becomes much faster.

### 3. Log Immediately

Log right after eating, not at the end of the day. Evening recall leads to forgotten items and estimation errors.

### 4. Eating Out?

- Search for the restaurant name or similar dishes in your app
- Use AI photo estimation
- Better to overestimate by 10% than underestimate

### 5. Don't Quit Over One Bad Meal

One big meal won't destroy your progress. Treat tracking as data collection, not moral judgment. Log it and move on.

### 6. Set Phase Goals

- **Week 1**: Just log everything. Don't adjust. Understand your baseline
- **Week 2-3**: Start tweaking. Focus on protein first
- **Week 4+**: Adjust total calories based on weight trends

---

## FAQ

### Do I need to track every single day?

Track at least one weekday and one weekend day, since many people eat well on weekdays but overeat on weekends. Ideally, track daily for 2-4 weeks, then you can reduce to 3-4 days per week.

### How long until I see results?

You'll usually spot trends within 2-3 weeks. For fat loss goals, expect visible weight changes in 4-6 weeks.

### Are food label calories accurate?

Nutrition labels are legally allowed ±20% variance. Don't worry too much — your TDEE is also an estimate, and the errors tend to cancel out.

### Can food tracking cause eating disorders?

For most people, no. But if you find yourself obsessing over numbers, restricting normal eating, or feeling extreme guilt about going "over," take a break and consult a professional. Tracking is a tool, not a cage.

---

## Conclusion: Just Start

Food tracking doesn't need to be perfect, and it doesn't need to last forever. Think of it as a learning phase — spend 4-8 weeks tracking seriously, and you'll develop a new understanding of food nutrition that lasts a lifetime.

The best time to start is now. Pick a tool and log your next meal.

👉 [Start your food tracking journey with Open Health](https://openhealth.blog)

> 💡 **Further reading**: [AI Photo Calorie Tracking: 5 Apps Tested](/blog/ai-photo-calorie-tracking) | [MyFitnessPal Alternatives](/blog/myfitnesspal-alternatives)
`;

// ─── Seed Logic ───

async function upsert(
  slug: string,
  locale: string,
  data: {
    title: string;
    summary: string;
    content: string;
    thumbnailUrl: string;
    tags: string[];
  }
) {
  const existing = await db
    .select({ id: blogPosts.id })
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.locale, locale)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(blogPosts)
      .set({
        title: data.title,
        summary: data.summary,
        content: data.content,
        thumbnailUrl: data.thumbnailUrl,
        tags: data.tags,
        status: "published",
        updatedAt: new Date(),
      })
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.locale, locale)));
    console.log(`Updated: ${slug} [${locale}]`);
  } else {
    await db.insert(blogPosts).values({
      title: data.title,
      slug,
      summary: data.summary,
      content: data.content,
      thumbnailUrl: data.thumbnailUrl,
      tags: data.tags,
      locale,
      status: "published",
    });
    console.log(`Inserted: ${slug} [${locale}]`);
  }
}

async function main() {
  await upsert(SLUG, "zh-TW", {
    title: ZH_TITLE,
    summary: ZH_SUMMARY,
    content: ZH_CONTENT,
    thumbnailUrl: ZH_THUMBNAIL,
    tags: ZH_TAGS,
  });

  await upsert(SLUG, "en", {
    title: EN_TITLE,
    summary: EN_SUMMARY,
    content: EN_CONTENT,
    thumbnailUrl: EN_THUMBNAIL,
    tags: EN_TAGS,
  });

  await sql.end();
  console.log("Done! Both zh-TW and en versions seeded.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

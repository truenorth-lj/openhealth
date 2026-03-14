/**
 * Seed blog post: MyFitnessPal Alternatives (zh-TW + en)
 *
 * Usage:
 *   cd apps/web && source .env.local && DATABASE_URL=$DATABASE_URL tsx src/server/db/seed/seed-blog-mfp-alternatives.ts
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

const SLUG = "myfitnesspal-alternatives";

// ─── zh-TW Version ───

const ZH_TITLE =
  "MyFitnessPal 替代方案：2026 年 10 款最佳免費熱量追蹤 App 完整比較";
const ZH_SUMMARY =
  "MyFitnessPal 越來越貴、免費版限制越來越多？本文實測比較 10 款替代方案，包含 Cronometer、FatSecret、Cal AI 等，幫你找到最適合的熱量追蹤工具。";
const ZH_TAGS = [
  "MyFitnessPal",
  "替代方案",
  "熱量追蹤",
  "App 比較",
  "免費",
];
const ZH_THUMBNAIL = "/blog/mfp-alternatives-cover.png";

const ZH_CONTENT = `## 為什麼你需要 MyFitnessPal 的替代方案？

MyFitnessPal 曾經是熱量追蹤的代名詞，但近年來它的改變讓許多使用者開始尋找替代品：

- **免費版大幅縮水**：掃描條碼、自訂目標等基本功能都搬到了 Premium
- **訂閱價格飆升**：Premium 漲至每年 $79.99 美元（約 NT$2,500）
- **廣告轟炸**：免費版的廣告讓體驗越來越差
- **資料庫品質問題**：使用者自行輸入的資料常有錯誤，1,100 萬筆資料中不少是重複或不準確的
- **隱私疑慮**：Under Armour 時代的資料外洩事件讓人擔心

好消息是，2026 年有很多更好的選擇。我們實測了 10 款替代方案，從功能、價格、準確度到隱私，逐一比較。

---

## 快速比較表

| App | 價格 | AI 拍照 | 營養素追蹤 | 開源 | 中文支援 | 最適合 |
|-----|------|---------|-----------|------|---------|--------|
| **Open Health** | 免費 / $5/月 | ✅ | 82+ 種 | ✅ | ✅ 原生繁中 | 想要全方位健康追蹤 + 隱私 |
| **Cronometer** | 免費 / Gold 付費 | ❌ | 84 種 | ❌ | ❌ | 需要極精準微量營養素 |
| **FatSecret** | 免費 | ❌ | 基本 | ❌ | ✅ | 預算為零的入門者 |
| **Cal AI** | 付費訂閱 | ✅ | 基本 | ❌ | ❌ | 只想拍照記錄 |
| **SnapCalorie** | 付費訂閱 | ✅ | 基本 | ❌ | ❌ | 追求 AI 精準度 |
| **Yazio** | 免費 / Pro | ✅ | 中等 | ❌ | ❌ | 斷食 + 熱量追蹤 |
| **Noom** | 付費（較貴） | ❌ | 基本 | ❌ | ❌ | 需要行為改變教練 |
| **MacroFactor** | $71.99/年 | ❌ | 巨量營養素 | ❌ | ❌ | 認真的巨量營養素追蹤 |
| **Nutrola** | 免費 / 付費 | ✅ | 中等 | ❌ | ❌ | 營養師驗證資料庫 |
| **Cofit** | 免費 / 諮詢付費 | ❌ | 基本 | ❌ | ✅ | 需要台灣營養師諮詢 |

---

## 1. Open Health — 最佳全方位替代方案

**價格**：免費基本功能 / Pro $5/月

Open Health 是一款開源的全方位健康追蹤平台，不只是熱量計算器，而是整合飲食、運動、體重、飲水、斷食的健康作業系統。

### 優點
- **真正免費的核心功能**：食物日記、搜尋、手動記錄完全免費，沒有廣告
- **AI 拍照辨識**：用 Google Gemini 驅動的食物辨識，拍照即可估算營養
- **82+ 種營養素追蹤**：從巨量營養素到維生素、礦物質全覆蓋
- **全方位追蹤**：飲食 + 運動 + 重訓日誌 + 體重 + 飲水 + 斷食，一個 App 搞定
- **開源透明**：程式碼公開在 GitHub，你知道你的資料如何被處理
- **原生繁體中文**：不是翻譯軟體，從設計到食物資料庫都為台灣使用者優化
- **100 萬+ 食物資料庫**：整合 USDA + OpenFoodFacts 資料

### 缺點
- 較新的產品，社群規模還在成長中
- 食物資料庫持續擴充中

### 最適合
想要一個整合所有健康追蹤功能、注重隱私、價格合理的使用者。特別適合台灣使用者。

👉 [免費試用 Open Health](https://openhealth.blog)

---

## 2. Cronometer — 最精準的營養追蹤

**價格**：免費 / Gold 版付費

Cronometer 是營養師和健身愛好者的最愛，以資料庫的準確度著稱。

### 優點
- **最精準的資料庫**：所有食物資料經人工驗證，不接受使用者隨意提交
- **84 種營養素**：追蹤範圍業界最廣
- **適合特殊飲食**：生酮、純素、低 FODMAP 等特殊飲食模式支援良好

### 缺點
- 沒有 AI 拍照功能
- 介面較複雜，學習曲線較高
- 不支援中文
- 免費版功能受限

### 最適合
需要追蹤微量營養素、對數據精準度有極高要求的進階使用者。

---

## 3. FatSecret — 最佳免費選擇

**價格**：完全免費

FatSecret 是少數仍提供完整免費功能的熱量追蹤 App。

### 優點
- **真正免費**：核心功能不收費，沒有付費牆
- **食物日記 + 運動 + 體重**：基本追蹤功能齊全
- **社群功能**：可以分享飲食照片、參與挑戰
- **支援中文**

### 缺點
- 介面設計過時，操作體驗不如競品
- 沒有 AI 功能
- 營養素追蹤僅限基本項目
- 沒有重訓日誌

### 最適合
預算為零、只需要基本熱量追蹤功能的使用者。

---

## 4. Cal AI — 最受歡迎的 AI 拍照追蹤

**價格**：付費訂閱

Cal AI 是目前最熱門的 AI 食物辨識 App，主打「拍照就好」的極簡體驗。

### 優點
- **極快辨識速度**：2 秒內出結果
- **介面簡潔美觀**：使用體驗很好
- **100 萬+ 下載**：證明了市場需求

### 缺點
- 沒有免費版，必須付費訂閱
- 僅追蹤基本營養素
- 不支援中文
- 功能單一，不是全方位健康工具

### 最適合
只想用拍照方式記錄、不需要詳細營養分析的使用者。

---

## 5. SnapCalorie — AI 精準度最高

**價格**：付費訂閱

由前 Google AI 研究員（Google Lens 共同創辦人）創立，是唯一有學術論文背書的 AI 熱量追蹤。

### 優點
- **學術研究背書**：AI 精準度有 peer-reviewed 論文驗證
- **Google 團隊血統**：技術實力強
- **份量估算準確**：在 AI 追蹤 App 中精準度最高

### 缺點
- 必須付費
- 功能單一
- 不支援中文

### 最適合
追求 AI 辨識最高精準度的使用者。

---

## 6. Yazio — 最佳斷食 + 熱量追蹤組合

**價格**：免費 / Pro 版付費

Yazio 結合了熱量追蹤和間歇性斷食追蹤，兩個需求一次滿足。

### 優點
- **斷食追蹤整合**：支援 16:8、18:6 等多種斷食模式
- **AI 拍照功能**：Pro 版支援
- **介面美觀**：設計感不錯

### 缺點
- 免費版功能很受限
- 不支援中文
- Pro 版價格不便宜

### 最適合
同時需要斷食追蹤和熱量追蹤的使用者。

---

## 7. Noom — 最佳行為改變導向

**價格**：付費訂閱（較貴）

Noom 不只是熱量追蹤，更像是一個減重教練，強調行為科學和心理學。

### 優點
- **行為科學課程**：每天有小課程幫助建立健康心態
- **專業團隊支持**：有營養師和教練在社群中回答問題
- **適合減重**：為減重目標設計的完整方案

### 缺點
- **價格高**：比其他 App 貴很多
- 營養追蹤功能相對基本
- 不是純追蹤工具
- 不支援中文

### 最適合
需要心理支持和教練引導來改變飲食習慣的使用者。

---

## 8. MacroFactor — 最佳巨量營養素追蹤

**價格**：$71.99/年

MacroFactor 由知名健身科學家 Greg Nuckols 開發，專為認真追蹤巨量營養素的人設計。

### 優點
- **智慧演算法**：根據你的實際數據動態調整 TDEE 和目標
- **巨量營養素深度追蹤**：蛋白質、碳水、脂肪的追蹤非常細緻
- **科學方法論**：基於實證的營養建議

### 缺點
- 沒有免費版
- 不追蹤微量營養素
- 不支援中文
- 沒有運動或重訓日誌

### 最適合
認真健身、需要精確巨量營養素管理的進階使用者。

---

## 9. Nutrola — 營養師驗證的新選擇

**價格**：免費 / 付費

Nutrola 是較新的 App，結合營養師驗證資料庫和 AI 功能。

### 優點
- **營養師驗證**：資料庫品質有專業把關
- **多種輸入方式**：拍照、語音、文字都支援
- **介面現代**

### 缺點
- 較新，功能還在完善
- 社群規模小
- 不支援中文

### 最適合
想要精準資料庫又想用 AI 功能的使用者。

---

## 10. Cofit — 最佳台灣在地選擇

**價格**：免費 / 營養師諮詢付費

Cofit 是台灣團隊開發的飲食追蹤 App，最大特色是有真人營養師線上諮詢。

### 優點
- **台灣食物資料庫**：便利商店、外食、在地食材都找得到
- **營養師線上諮詢**：可以直接問專業營養師
- **全繁體中文**

### 缺點
- 營養師諮詢需要額外付費
- 沒有 AI 拍照功能
- 功能較單一，沒有運動或重訓追蹤
- 非開源

### 最適合
需要台灣在地食物資料庫和專業營養師建議的使用者。

---

## 選擇建議：哪款 App 最適合你？

根據你的需求，這是我們的推薦：

- **想要全方位追蹤 + 注重隱私** → [Open Health](https://openhealth.blog)
- **需要最精準的微量營養素數據** → Cronometer
- **預算為零** → FatSecret
- **只想拍照記錄** → Cal AI
- **斷食 + 熱量追蹤** → Yazio 或 [Open Health](https://openhealth.blog)
- **需要行為改變教練** → Noom
- **認真健身追蹤巨量營養素** → MacroFactor
- **需要台灣營養師諮詢** → Cofit
- **想要開源 + 透明** → [Open Health](https://openhealth.blog)

---

## 結論

MyFitnessPal 不再是唯一的選擇。2026 年的熱量追蹤市場百花齊放，從 AI 拍照到開源方案，每個人都能找到最適合自己的工具。

如果你正在尋找一款免費、功能全面、注重隱私的替代方案，不妨試試 [Open Health](https://openhealth.blog) — 一個為你的健康打造的開放平台。

> 💡 **本文會持續更新**：我們會定期重新測試這些 App，確保推薦資訊是最新的。最後更新：2026 年 3 月。
`;

// ─── English Version ───

const EN_TITLE =
  "10 Best MyFitnessPal Alternatives in 2026 (Free & Open Source Options)";
const EN_SUMMARY =
  "MyFitnessPal getting too expensive? We tested 10 alternatives including Cronometer, FatSecret, Cal AI, and more. Find the best calorie tracking app for your needs and budget.";
const EN_TAGS = [
  "MyFitnessPal",
  "Alternatives",
  "Calorie Tracking",
  "App Comparison",
  "Free",
];
const EN_THUMBNAIL = "/blog/mfp-alternatives-cover.png";

const EN_CONTENT = `## Why Look for MyFitnessPal Alternatives?

MyFitnessPal was once the gold standard for calorie tracking, but recent changes have pushed many users to explore alternatives:

- **Free tier gutted**: Barcode scanning, custom goals, and other basic features moved behind the paywall
- **Price hikes**: Premium now costs $79.99/year (Premium+ at $99.99/year)
- **Ad overload**: The free version is flooded with advertisements
- **Database accuracy issues**: With 11M+ user-submitted entries, many are duplicated or inaccurate
- **Privacy concerns**: The Under Armour-era data breach still haunts many users

The good news? In 2026, there are excellent alternatives. We tested 10 of them, comparing features, pricing, accuracy, and privacy.

---

## Quick Comparison Table

| App | Price | AI Photo | Nutrients Tracked | Open Source | Best For |
|-----|-------|----------|------------------|-------------|----------|
| **Open Health** | Free / $5/mo | ✅ | 82+ | ✅ | All-in-one health tracking + privacy |
| **Cronometer** | Free / Gold | ❌ | 84 | ❌ | Precise micronutrient tracking |
| **FatSecret** | Free | ❌ | Basic | ❌ | Zero-budget beginners |
| **Cal AI** | Paid sub | ✅ | Basic | ❌ | Photo-only logging |
| **SnapCalorie** | Paid sub | ✅ | Basic | ❌ | AI accuracy |
| **Yazio** | Free / Pro | ✅ | Medium | ❌ | Fasting + calorie tracking |
| **Noom** | Paid (expensive) | ❌ | Basic | ❌ | Behavioral coaching |
| **MacroFactor** | $71.99/yr | ❌ | Macros | ❌ | Serious macro tracking |
| **Nutrola** | Free / Paid | ✅ | Medium | ❌ | Dietitian-verified database |
| **Cofit** | Free / Paid consult | ❌ | Basic | ❌ | Taiwanese users + dietitian access |

---

## 1. Open Health — Best Overall Alternative

**Price**: Free basics / Pro at $5/month

Open Health is an open-source, all-in-one health tracking platform. It's not just a calorie counter — it's a complete health operating system integrating food, exercise, weight, water, and fasting tracking.

### Pros
- **Truly free core features**: Food diary, search, and manual logging are completely free with no ads
- **AI food recognition**: Powered by Google Gemini for photo-based nutrition estimation
- **82+ nutrients tracked**: From macros to vitamins and minerals
- **All-in-one tracking**: Diet + exercise + workout log + weight + water + fasting in one app
- **Open source & transparent**: Code is public on GitHub — you know exactly how your data is handled
- **1M+ food database**: Integrated USDA + OpenFoodFacts data

### Cons
- Newer product, community still growing
- Food database continuously expanding

### Best For
Users who want comprehensive health tracking with privacy, transparency, and fair pricing.

👉 [Try Open Health for free](https://openhealth.blog)

---

## 2. Cronometer — Most Accurate Nutrition Tracking

**Price**: Free / Gold tier paid

Cronometer is the favorite of dietitians and fitness enthusiasts, known for its database accuracy.

### Pros
- **Most accurate database**: All food data is manually verified — no user-submitted junk
- **84 nutrients tracked**: Widest tracking range in the industry
- **Great for special diets**: Keto, vegan, low-FODMAP support

### Cons
- No AI photo recognition
- Steeper learning curve
- Free version is limited

### Best For
Advanced users who need micronutrient tracking with maximum data accuracy.

---

## 3. FatSecret — Best Completely Free Option

**Price**: Free

FatSecret remains one of the few calorie trackers offering full functionality without a subscription.

### Pros
- **Genuinely free**: Core features don't require payment
- **Food diary + exercise + weight**: Basic tracking covered
- **Community features**: Share food photos, join challenges

### Cons
- Outdated UI design
- No AI features
- Basic nutrient tracking only
- No workout logging

### Best For
Budget-conscious users who need basic calorie tracking without any cost.

---

## 4. Cal AI — Most Popular AI Photo Tracker

**Price**: Paid subscription

Cal AI is the hottest AI food recognition app right now, focused on a "just take a photo" experience.

### Pros
- **Lightning-fast recognition**: Results in under 2 seconds
- **Clean, beautiful UI**: Great user experience
- **1M+ downloads**: Proven market demand

### Cons
- No free version — subscription required
- Basic nutrient tracking only
- Single-purpose tool

### Best For
Users who want the simplest possible logging — just snap and go.

---

## 5. SnapCalorie — Highest AI Accuracy

**Price**: Paid subscription

Founded by ex-Google AI researchers who co-created Google Lens, SnapCalorie is the only tracker backed by peer-reviewed research.

### Pros
- **Research-backed accuracy**: AI precision validated by academic papers
- **Google pedigree**: Serious technical talent
- **Best portion estimation**: Most accurate AI serving size detection

### Cons
- Subscription required
- Limited features beyond photo tracking

### Best For
Users who prioritize AI recognition accuracy above all else.

---

## 6. Yazio — Best Fasting + Calorie Combo

**Price**: Free / Pro paid

Yazio combines calorie tracking with intermittent fasting tracking in one app.

### Pros
- **Integrated fasting tracker**: Supports 16:8, 18:6, and more
- **AI photo feature**: Available in Pro
- **Nice design**: Modern, clean interface

### Cons
- Free version is very limited
- Pro pricing isn't cheap

### Best For
Users who need both fasting and calorie tracking in one place.

---

## 7. Noom — Best for Behavioral Change

**Price**: Paid subscription (premium pricing)

Noom goes beyond calorie counting — it's a weight loss coach that emphasizes behavioral science and psychology.

### Pros
- **Behavioral science lessons**: Daily micro-lessons to build healthier mindsets
- **Professional support**: Dietitians and coaches in community groups
- **Designed for weight loss**: Complete program, not just a tracker

### Cons
- **Expensive**: Significantly pricier than alternatives
- Basic nutrition tracking
- Not a pure tracking tool

### Best For
Users who need psychological support and coaching to change eating habits.

---

## 8. MacroFactor — Best for Serious Macro Tracking

**Price**: $71.99/year

Built by renowned fitness scientist Greg Nuckols, MacroFactor is designed for serious macro trackers.

### Pros
- **Smart algorithm**: Dynamically adjusts TDEE and targets based on your actual data
- **Deep macro tracking**: Detailed protein, carbs, and fat analysis
- **Evidence-based**: Scientifically grounded recommendations

### Cons
- No free version
- No micronutrient tracking
- No exercise or workout logging

### Best For
Serious fitness enthusiasts who need precise macronutrient management.

---

## 9. Nutrola — Dietitian-Verified Newcomer

**Price**: Free / Paid

Nutrola combines a dietitian-verified database with AI-powered logging.

### Pros
- **Dietitian-verified data**: Professional quality control
- **Multiple input methods**: Photo, voice, and text logging
- **Modern interface**

### Cons
- Newer app, still maturing
- Smaller community

### Best For
Users who want database accuracy plus AI convenience.

---

## 10. Cofit — Best for Taiwanese Users

**Price**: Free / Paid dietitian consultations

Cofit is a Taiwan-based food tracking app with real dietitian consultations.

### Pros
- **Local food database**: Convenience stores, restaurants, and local ingredients covered
- **Online dietitian access**: Consult professional dietitians directly
- **Full Traditional Chinese UI**

### Cons
- Dietitian consultations cost extra
- No AI photo feature
- Limited to food tracking only
- Not open source

### Best For
Taiwanese users who want local food data and professional dietary advice.

---

## How to Choose: Which App Is Right for You?

Based on your needs, here are our recommendations:

- **All-in-one tracking + privacy** → [Open Health](https://openhealth.blog)
- **Most precise micronutrient data** → Cronometer
- **Zero budget** → FatSecret
- **Photo-only logging** → Cal AI
- **Fasting + calorie tracking** → Yazio or [Open Health](https://openhealth.blog)
- **Behavioral coaching** → Noom
- **Serious macro tracking** → MacroFactor
- **Taiwanese local food + dietitian** → Cofit
- **Open source & transparent** → [Open Health](https://openhealth.blog)

---

## Conclusion

MyFitnessPal is no longer the only game in town. The calorie tracking market in 2026 is thriving with options — from AI-powered photo tracking to open-source solutions. There's a perfect fit for everyone.

If you're looking for a free, feature-rich, privacy-respecting alternative, give [Open Health](https://openhealth.blog) a try — an open platform built for your health journey.

> 💡 **This article is regularly updated.** We re-test these apps periodically to keep our recommendations current. Last updated: March 2026.
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

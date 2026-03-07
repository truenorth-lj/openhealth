# Open Health

開源的飲食與營養追蹤平台。

> [openhealth.blog](https://openhealth.blog)

## Screenshots

<p align="center">
  <img src="apps/web/public/screenshots/01-diary.png" alt="飲食日記" width="200" />
  <img src="apps/web/public/screenshots/02-food-search.png" alt="食物搜尋" width="200" />
  <img src="apps/web/public/screenshots/03-ai-chat.png" alt="AI 營養顧問" width="200" />
  <img src="apps/web/public/screenshots/04-progress.png" alt="進度追蹤" width="200" />
</p>
<p align="center">
  <img src="apps/web/public/screenshots/06-food-detail.png" alt="食物詳情" width="200" />
  <img src="apps/web/public/screenshots/07-food-create.png" alt="新增食物" width="200" />
  <img src="apps/web/public/screenshots/08-ai-estimate.png" alt="AI 飲食估算" width="200" />
  <img src="apps/web/public/screenshots/09-ai-chat-conversation.png" alt="AI 對話" width="200" />
</p>

## Features

- [x] **飲食日記** — 記錄每餐食物，自動計算卡路里與三大營養素
- [x] **食物資料庫** — 搜尋常見食物，支援自訂食物與收藏
- [x] **AI 營養標籤掃描** — 拍照辨識營養標籤，快速輸入食物資料
- [x] **AI 營養顧問** — 分析飲食紀錄，提供營養建議
- [x] **進度追蹤** — 視覺化追蹤熱量、營養素與體重趨勢分析
- [x] **飲水紀錄** — 追蹤每日飲水量、目標設定、歷史記錄
- [x] **深色模式** — 支援淺色與深色主題
- [x] **Google / Apple OAuth** — 社群帳號快速登入
- [x] **Mobile App** — Expo React Native 原生 app（iOS / Android）

## Roadmap

### 飲水追蹤增強

- [ ] **自訂容器** — 建立個人化的杯子/水瓶（名稱 + 容量），取代固定的快速新增按鈕（最多 4 個）
- [ ] **飲水提醒** — 設定時間點提醒（最多 3 個），在指定時間前未達飲水量時推播通知

### 其他規劃

- [ ] **條碼掃描** — 掃描食品條碼自動帶入營養資訊
- [ ] **社群分享** — 分享每日飲食紀錄
- [ ] **匯出報告** — 匯出每週/每月營養攝取報告

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web | Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui |
| Mobile | Expo SDK 52, React Native, NativeWind |
| Backend | tRPC v11, Server Actions, PostgreSQL, Drizzle ORM |
| Auth | Better Auth (email/password + Google + Apple OAuth) |
| AI | Google Gemini 2.5 Flash (nutrition label OCR, chat) |
| Monorepo | Turborepo + pnpm workspaces |

## Project Structure

```
open-health/
├── apps/
│   ├── web/          # Next.js web app
│   └── mobile/       # Expo React Native app
├── packages/
│   └── shared/       # Shared types, schemas, utils
├── scripts/
│   └── app-store-screenshots/   # App Store screenshot generator
└── turbo.json
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Run all apps
pnpm dev

# Run specific app
pnpm dev:web       # localhost:3001
pnpm dev:mobile    # Expo dev server
```

## Scripts

### App Store Screenshots

Generate iPhone 6.5" display screenshots (1284 x 2778px) for App Store Connect:

```bash
# Prerequisites
pip install playwright
playwright install chromium

# Generate screenshots
python scripts/app-store-screenshots/take-screenshots.py

# Also copy to web/public for landing page
python scripts/app-store-screenshots/take-screenshots.py --copy-to-web

# Take additional screenshots (food detail, create, AI estimate, AI chat)
python scripts/app-store-screenshots/take-extra-screenshots.py
```

Output: `scripts/app-store-screenshots/output/`

| File | Content |
|------|---------|
| `01-diary.png` | 飲食日記（含食物紀錄） |
| `02-food-search.png` | 食物搜尋結果 |
| `03-ai-chat.png` | AI 營養顧問 |
| `04-progress.png` | 進度追蹤 |
| `05-landing.png` | 首頁（未登入） |
| `06-food-detail.png` | 食物營養詳情 |
| `07-food-create.png` | 新增自訂食物 |
| `08-ai-estimate.png` | AI 飲食估算 |
| `09-ai-chat-conversation.png` | AI 營養顧問對話 |

Environment variables (optional):
- `BASE_URL` — target URL (default: `https://openhealth.blog`)
- `DEMO_EMAIL` / `DEMO_PASSWORD` — demo account credentials

## Docs

- [SEO Todo](docs/seo-todo.md) — SEO 待办事项与传播策略

## License

MIT

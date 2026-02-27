# Open Health

開源健康追蹤應用，替代 MyFitnessPal 的全功能飲食記錄工具。

## 功能

- **飲食日記** — 記錄每日早餐、午餐、晚餐、點心，即時顯示熱量與巨量營養素進度
- **食物搜尋** — PostgreSQL 全文搜尋，內建 20 種台灣常見食物
- **自訂食物** — 手動建立食物並記錄營養成分
- **營養標示辨識** — 拍照上傳營養標示，透過 Google Gemini AI 自動辨識
- **體重追蹤** — 記錄體重變化，以折線圖呈現 90 天趨勢
- **飲水追蹤** — 快速記錄每日飲水量
- **目標設定** — 自訂每日熱量與蛋白質、碳水、脂肪目標
- **帳號系統** — Email/密碼註冊登入

## 技術架構

| 層級 | 技術 |
|------|------|
| 框架 | Next.js 15 (App Router, Turbopack) |
| 語言 | TypeScript |
| 資料庫 | PostgreSQL + Drizzle ORM |
| 認證 | Better Auth |
| API | tRPC v11 (查詢) + Server Actions (寫入) |
| 狀態管理 | Zustand + TanStack Query |
| UI | Tailwind CSS v4 + shadcn/ui |
| 圖表 | Recharts |
| AI | Google Generative AI (Gemini 2.5 Flash) |

## 快速開始

### 環境需求

- Node.js 18+
- PostgreSQL 15+

### 安裝

```bash
git clone <repo-url>
cd food-record
npm install
```

### 環境變數

建立 `.env.local`：

```env
DATABASE_URL=postgresql://user:password@localhost:5432/food_record
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=http://localhost:3001
GOOGLE_AI_API_KEY=your-gemini-api-key
```

### 資料庫設定

```bash
# 建立資料庫
createdb food_record

# 推送 schema 到資料庫
npm run db:push

# 匯入種子資料（41 種營養素定義 + 20 種台灣食物）
npm run db:seed
```

### 啟動開發伺服器

```bash
npm run dev
```

預設在 `http://localhost:3000` 啟動。

## 指令

| 指令 | 說明 |
|------|------|
| `npm run dev` | 啟動開發伺服器 (Turbopack) |
| `npm run build` | 建置正式版 |
| `npm start` | 啟動正式版伺服器 |
| `npm run lint` | ESLint 檢查 |
| `npm run db:push` | 推送 schema 到資料庫 |
| `npm run db:generate` | 產生遷移檔 |
| `npm run db:migrate` | 執行遷移 |
| `npm run db:studio` | 開啟 Drizzle Studio |
| `npm run db:seed` | 匯入種子資料 |

## 專案結構

```
src/
├── app/                    # 頁面路由
│   ├── (app)/              # 登入後頁面
│   │   ├── diary/          # 飲食日記
│   │   ├── food/           # 食物搜尋、建立、營養標示辨識
│   │   ├── progress/       # 體重追蹤
│   │   ├── water/          # 飲水追蹤
│   │   └── settings/       # 個人設定、目標
│   ├── (auth)/             # 登入、註冊
│   └── api/                # tRPC + Better Auth 端點
├── components/             # UI 元件
├── server/
│   ├── db/schema/          # Drizzle ORM schema
│   ├── trpc/routers/       # tRPC 查詢路由
│   ├── actions/            # Server Actions（寫入操作）
│   └── auth.ts             # Better Auth 設定
├── hooks/                  # React hooks
└── lib/                    # 工具函式、客戶端設定
```

## 授權

MIT

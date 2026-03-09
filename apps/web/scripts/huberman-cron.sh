#!/bin/bash
# Huberman Digest Cron Job
# 每天自動抓取 Huberman Lab 最新影片並生成文章

set -euo pipefail

LOGFILE="$HOME/.local/log/huberman-digest.log"
mkdir -p "$(dirname "$LOGFILE")"

exec >> "$LOGFILE" 2>&1
echo "===== $(date '+%Y-%m-%d %H:%M:%S') ====="

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

# 載入環境變數
source .env.local
export DATABASE_URL MINIMAX_API_KEY YOUTUBE_API_KEY

# 執行腳本（只處理最新 5 部影片，跳過已存在的）
npx tsx scripts/huberman-digest.ts --limit 5

echo "===== Done ====="
echo ""

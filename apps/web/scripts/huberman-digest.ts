/**
 * Huberman Lab YouTube Digest 腳本
 * 自動抓取 Huberman Lab YouTube 頻道的新影片逐字稿，
 * 用 MiniMax AI 分析後生成摘要文章存入資料庫。
 *
 * 用法：
 *   cd apps/web && source .env.local && \
 *   DATABASE_URL=$DATABASE_URL MINIMAX_API_KEY=$MINIMAX_API_KEY YOUTUBE_API_KEY=$YOUTUBE_API_KEY \
 *   pnpm huberman
 *
 *   pnpm huberman -- --limit 3
 *   pnpm huberman -- --dry-run
 *   pnpm huberman -- --video-id dQw4w9WgXcQ
 *   pnpm huberman -- --locale en          # 產生英文版
 *   pnpm huberman -- --locale en --limit 10
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and } from "drizzle-orm";
import postgres from "postgres";
import { blogPosts } from "../src/server/db/schema";

// ---------- Config ----------

const HUBERMAN_CHANNEL_ID = "UC2D2CMWXMOVWx7giW1n3LIg";
const MINIMAX_API_URL = "https://api.minimax.io/v1/text/chatcompletion_v2";
const MINIMAX_MODEL = "MiniMax-M2.7";
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;
const CHUNK_SIZE = 80000; // ~80K chars per chunk for map-reduce

// ---------- Types ----------

type Locale = "zh-TW" | "en";

interface YouTubeVideo {
  id: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string;
}

interface ArticleResult {
  title: string;
  slug: string;
  summary: string;
  content: string;
  tags: string[];
}

// ---------- Phase 1 Summary Budget ----------
// Keep Phase 2 total input under ~12K chars to avoid MiniMax socket disconnects.
// Budget per chunk = floor(PHASE2_BUDGET / numChunks)

const PHASE2_BUDGET = 12000;

function summaryBudget(numChunks: number): number | null {
  if (numChunks <= 1) return null; // no limit for single chunk
  return Math.floor(PHASE2_BUDGET / numChunks);
}

function getPhase1System(locale: Locale, charLimit: number | null): string {
  const base =
    locale === "zh-TW"
      ? `你是一位專業的健康科學內容分析師。你會收到 Huberman Lab podcast 的逐字稿片段（含時間戳）。

請提取以下內容：
1. **核心科學概念**：主要討論的生物機制、神經科學原理
2. **實用建議**：具體的健康/生活方式建議（劑量、時間、方法）
3. **研究數據**：引用的研究結果和數據
4. **關鍵時間點**：重要話題的時間戳

輸出格式為繁體中文，保持條理清晰。保留重要的英文術語（括號標注）。`
      : `You are an expert health science content analyst. You will receive transcript segments (with timestamps) from the Huberman Lab podcast.

Extract the following:
1. **Core Scientific Concepts**: Key biological mechanisms and neuroscience principles discussed
2. **Practical Advice**: Specific health/lifestyle recommendations (dosages, timing, methods)
3. **Research Data**: Referenced study results and data points
4. **Key Timestamps**: Timestamps of important topics

Output in clear, well-organized English. Retain scientific terminology accurately.`;

  if (charLimit) {
    const suffix =
      locale === "zh-TW"
        ? `\n\n⚠️ 嚴格限制：輸出總長度不超過 ${charLimit} 字元。只保留最重要的要點，刪除次要細節和冗長引述。用精簡的條列式呈現。`
        : `\n\n⚠️ STRICT LIMIT: Keep your entire output under ${charLimit} characters. Focus only on the most important points, use concise bullet points, and omit secondary details and lengthy quotes.`;
    return base + suffix;
  }
  return base;
}

// ---------- Locale-specific Prompts ----------

const PROMPTS = {
  "zh-TW": {

    phase2System: `你是一位專業的健康科學科普作家。你會收到 Huberman Lab podcast 的分段摘要，請整合成一篇完整的繁體中文深度筆記文章。

輸出嚴格的 JSON 格式（不要包含 markdown code block 標記）：
{
  "title": "繁體中文標題（簡潔有力，點出核心主題）",
  "slug": "english-url-slug-with-hyphens",
  "summary": "精華摘要（300-500 字，涵蓋核心觀點和最重要的實用建議）",
  "content": "深度筆記（Markdown 格式，包含以下章節：\\n## 核心主題\\n## 科學機制\\n## 實用建議\\n## 關鍵時間點\\n## 延伸資源）",
  "tags": ["標籤1", "標籤2"]
}

重要規則：
1. 所有內容使用繁體中文
2. 保留重要英文術語（括號標注）
3. 實用建議要具體（包含劑量、時間、頻率等）
4. content 使用 Markdown 格式，章節用 ## 標題
5. tags 選擇 3-6 個相關標籤（如：睡眠、多巴胺、運動、營養等）
6. slug 使用英文，用連字號分隔，簡短描述主題`,

    phase1User: (title: string, i: number, total: number, chunk: string) =>
      `影片標題：${title}\n\n逐字稿片段 ${i}/${total}：\n\n${chunk}`,
    phase2User: (title: string, summaries: string) =>
      `影片標題：${title}\n\n以下是各段落的摘要：\n\n${summaries}`,
    chunkLabel: (i: number) => `--- 段落 ${i} 摘要 ---`,
  },
  en: {
    phase2System: `You are an expert health science writer. You will receive segmented summaries from a Huberman Lab podcast episode. Synthesize them into a comprehensive English article.

Output strict JSON format (do NOT include markdown code block markers):
{
  "title": "Concise, compelling English title highlighting the core topic",
  "slug": "english-url-slug-with-hyphens",
  "summary": "Executive summary (150-300 words) covering core insights and the most important practical takeaways",
  "content": "In-depth notes (Markdown format with these sections:\\n## Core Topic\\n## Scientific Mechanisms\\n## Practical Recommendations\\n## Key Timestamps\\n## Further Resources)",
  "tags": ["Tag1", "Tag2"]
}

Important rules:
1. All content in English
2. Use accurate scientific terminology
3. Practical advice must be specific (include dosages, timing, frequency, etc.)
4. content uses Markdown format with ## headings
5. Select 3-6 relevant tags (e.g.: Sleep, Dopamine, Exercise, Nutrition, etc.)
6. slug uses lowercase English with hyphens, briefly describing the topic`,

    phase1User: (title: string, i: number, total: number, chunk: string) =>
      `Video title: ${title}\n\nTranscript segment ${i}/${total}:\n\n${chunk}`,
    phase2User: (title: string, summaries: string) =>
      `Video title: ${title}\n\nSegment summaries:\n\n${summaries}`,
    chunkLabel: (i: number) => `--- Segment ${i} Summary ---`,
  },
} as const;

// ---------- YouTube Data API ----------

async function fetchChannelVideos(
  apiKey: string,
  limit: number
): Promise<YouTubeVideo[]> {
  // Step 1: Get the uploads playlist ID
  const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${HUBERMAN_CHANNEL_ID}&key=${apiKey}`;
  const channelRes = await fetch(channelUrl);
  if (!channelRes.ok) {
    throw new Error(
      `YouTube Channels API error: ${channelRes.status} ${await channelRes.text()}`
    );
  }
  const channelData = await channelRes.json();
  const uploadsPlaylistId =
    channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    throw new Error("Could not find uploads playlist for Huberman channel");
  }

  // Step 2: Get recent videos from uploads playlist
  const videos: YouTubeVideo[] = [];
  let nextPageToken = "";
  const maxResults = Math.min(limit, 50);

  while (videos.length < limit) {
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ""}`;
    const playlistRes = await fetch(playlistUrl);
    if (!playlistRes.ok) {
      throw new Error(
        `YouTube PlaylistItems API error: ${playlistRes.status} ${await playlistRes.text()}`
      );
    }
    const playlistData = await playlistRes.json();

    for (const item of playlistData.items || []) {
      if (videos.length >= limit) break;
      const snippet = item.snippet;
      videos.push({
        id: snippet.resourceId.videoId,
        title: snippet.title,
        publishedAt: snippet.publishedAt,
        thumbnailUrl: `https://img.youtube.com/vi/${snippet.resourceId.videoId}/maxresdefault.jpg`,
      });
    }

    nextPageToken = playlistData.nextPageToken;
    if (!nextPageToken) break;
  }

  return videos;
}

// ---------- YouTube Transcript (via yt-dlp) ----------

async function fetchTranscript(videoId: string): Promise<string> {
  const { execSync } = await import("child_process");
  const { readFileSync, unlinkSync } = await import("fs");
  const tmpFile = `/tmp/yt-transcript-${videoId}`;

  try {
    execSync(
      `yt-dlp --write-auto-sub --sub-lang en --skip-download --sub-format json3 -o "${tmpFile}" "https://www.youtube.com/watch?v=${videoId}"`,
      { stdio: "pipe", timeout: 60000 }
    );

    const json3Path = `${tmpFile}.en.json3`;
    const data = JSON.parse(readFileSync(json3Path, "utf-8"));
    unlinkSync(json3Path);

    const events: Array<{ tStartMs?: number; segs?: Array<{ utf8: string }> }> =
      data.events || [];
    const lines: string[] = [];

    for (const ev of events) {
      if (ev.segs === undefined) continue;
      const segText = ev.segs.map((s) => s.utf8).join("");
      if (segText.trim()) {
        const ms = ev.tStartMs || 0;
        const mins = Math.floor(ms / 60000);
        const secs = Math.floor((ms % 60000) / 1000);
        const ts = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
        lines.push(`[${ts}] ${segText.trim()}`);
      }
    }

    if (lines.length === 0) {
      throw new Error(`No transcript segments found for video ${videoId}`);
    }

    return lines.join("\n");
  } catch (err) {
    // Clean up temp files on error
    try {
      unlinkSync(`${tmpFile}.en.json3`);
    } catch {
      // ignore
    }
    throw new Error(`Failed to fetch transcript for ${videoId}: ${err}`);
  }
}

// ---------- MiniMax AI ----------

async function callMiniMax(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 16000
): Promise<string> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(MINIMAX_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MINIMAX_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: maxTokens,
          temperature: 0.3,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`MiniMax API error ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from MiniMax");
      }
      return content;
    } catch (err) {
      console.error(`  MiniMax attempt ${attempt}/${MAX_RETRIES} failed:`, err);
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      } else {
        throw err;
      }
    }
  }
  throw new Error("MiniMax call failed after all retries");
}

// ---------- Map-Reduce Processing ----------

function chunkTranscript(transcript: string): string[] {
  if (transcript.length <= CHUNK_SIZE) {
    return [transcript];
  }

  const chunks: string[] = [];
  const lines = transcript.split("\n");
  let current = "";

  for (const line of lines) {
    if (current.length + line.length + 1 > CHUNK_SIZE && current.length > 0) {
      chunks.push(current);
      current = line;
    } else {
      current += (current ? "\n" : "") + line;
    }
  }
  if (current) {
    chunks.push(current);
  }

  return chunks;
}

async function processTranscript(
  minimaxKey: string,
  transcript: string,
  videoTitle: string,
  locale: Locale
): Promise<ArticleResult> {
  const prompts = PROMPTS[locale];
  const chunks = chunkTranscript(transcript);
  const budget = summaryBudget(chunks.length);
  console.log(
    `  Transcript: ${transcript.length} chars, ${chunks.length} chunk(s), budget: ${budget ?? "unlimited"} chars/chunk`
  );

  // Phase 1: Extract key points from each chunk (with length budget)
  const p1System = getPhase1System(locale, budget);
  const chunkSummaries: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(
      `  Phase 1: Processing chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)...`
    );
    // ~4 chars per token; cap Phase 1 output tokens to match budget
    const p1MaxTokens = budget ? Math.ceil(budget / 4) + 200 : 16000;
    const summary = await callMiniMax(
      minimaxKey,
      p1System,
      prompts.phase1User(videoTitle, i + 1, chunks.length, chunks[i]),
      p1MaxTokens
    );
    chunkSummaries.push(summary);
  }

  // Phase 2: Merge summaries into final article
  const mergedSummaries = chunkSummaries
    .map((s, i) => `${prompts.chunkLabel(i + 1)}\n${s}`)
    .join("\n\n");

  console.log(`  Phase 2: Generating final article... (merged summaries: ${mergedSummaries.length} chars)`);

  const finalResponse = await callMiniMax(
    minimaxKey,
    prompts.phase2System,
    prompts.phase2User(videoTitle, mergedSummaries)
  );

  // Parse JSON from response (handle potential markdown code blocks)
  let jsonStr = finalResponse.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    const result = JSON.parse(jsonStr) as ArticleResult;
    if (!result.title || !result.slug || !result.summary || !result.content) {
      throw new Error("Missing required fields in AI response");
    }
    return result;
  } catch (err) {
    console.error("  Failed to parse AI response:", jsonStr.slice(0, 500));
    throw new Error(`Invalid JSON from MiniMax: ${err}`);
  }
}

// ---------- Helpers ----------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv: string[]): {
  limit: number;
  dryRun: boolean;
  videoId: string | null;
  locale: Locale;
} {
  let limit = 5;
  let dryRun = false;
  let videoId: string | null = null;
  let locale: Locale = "zh-TW";

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--limit" && argv[i + 1]) {
      limit = parseInt(argv[i + 1], 10);
      i++;
    } else if (argv[i] === "--dry-run") {
      dryRun = true;
    } else if (argv[i] === "--video-id" && argv[i + 1]) {
      videoId = argv[i + 1];
      i++;
    } else if (argv[i] === "--locale" && argv[i + 1]) {
      const val = argv[i + 1];
      if (val !== "zh-TW" && val !== "en") {
        console.error(`Invalid locale: ${val}. Supported: zh-TW, en`);
        process.exit(1);
      }
      locale = val;
      i++;
    }
  }

  return { limit, dryRun, videoId, locale };
}

// ---------- Main ----------

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log("=== Huberman Lab YouTube Digest ===");
  console.log(`Config: limit=${args.limit}, dryRun=${args.dryRun}, locale=${args.locale}, videoId=${args.videoId || "auto"}`);

  // Validate env vars
  const databaseUrl = process.env.DATABASE_URL;
  const minimaxKey = process.env.MINIMAX_API_KEY;
  const youtubeKey = process.env.YOUTUBE_API_KEY;

  if (!databaseUrl) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
  }
  if (!minimaxKey) {
    console.error("Missing MINIMAX_API_KEY");
    process.exit(1);
  }

  // DB connection
  const client = postgres(databaseUrl, {
    max: 3,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  const db = drizzle(client);

  try {
    let videos: YouTubeVideo[];

    if (args.videoId) {
      // Process a specific video
      console.log(`\nFetching video info for ${args.videoId}...`);
      if (!youtubeKey) {
        // If no YouTube API key, create a minimal video entry
        videos = [
          {
            id: args.videoId,
            title: `Huberman Lab - ${args.videoId}`,
            publishedAt: new Date().toISOString(),
            thumbnailUrl: `https://img.youtube.com/vi/${args.videoId}/maxresdefault.jpg`,
          },
        ];
      } else {
        const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${args.videoId}&key=${youtubeKey}`;
        const videoRes = await fetch(videoUrl);
        const videoData = await videoRes.json();
        const snippet = videoData.items?.[0]?.snippet;
        if (!snippet) {
          throw new Error(`Video ${args.videoId} not found`);
        }
        videos = [
          {
            id: args.videoId,
            title: snippet.title,
            publishedAt: snippet.publishedAt,
            thumbnailUrl: `https://img.youtube.com/vi/${args.videoId}/maxresdefault.jpg`,
          },
        ];
      }
    } else {
      // Fetch latest videos from channel
      if (!youtubeKey) {
        console.error("Missing YOUTUBE_API_KEY (required for channel listing)");
        process.exit(1);
      }
      console.log(`\nFetching latest ${args.limit} videos from Huberman Lab...`);
      videos = await fetchChannelVideos(youtubeKey, args.limit);
    }

    console.log(`Found ${videos.length} video(s)`);

    // Filter out already-processed videos (check by videoId + locale)
    const newVideos: YouTubeVideo[] = [];
    for (const video of videos) {
      const existing = await db
        .select({ id: blogPosts.id })
        .from(blogPosts)
        .where(
          and(
            eq(blogPosts.youtubeVideoId, video.id),
            eq(blogPosts.locale, args.locale)
          )
        )
        .limit(1);
      if (existing.length > 0) {
        console.log(`  [SKIP] Already processed (${args.locale}): ${video.title}`);
      } else {
        newVideos.push(video);
      }
    }

    if (newVideos.length === 0) {
      console.log("\nNo new videos to process.");
      return;
    }

    console.log(`\n${newVideos.length} new video(s) to process\n`);

    // Process each video
    let processed = 0;
    let failed = 0;

    for (const video of newVideos) {
      console.log(`\n[${processed + failed + 1}/${newVideos.length}] ${video.title}`);
      console.log(`  Video ID: ${video.id}`);

      try {
        // Step 1: Fetch transcript
        console.log("  Fetching transcript...");
        const transcript = await fetchTranscript(video.id);
        console.log(`  Transcript fetched: ${transcript.length} chars`);

        if (args.dryRun) {
          console.log("  [DRY RUN] Would process with MiniMax and save to DB");
          console.log(`  Transcript preview: ${transcript.slice(0, 200)}...`);
          processed++;
          continue;
        }

        // Step 2: Process with MiniMax
        const article = await processTranscript(
          minimaxKey,
          transcript,
          video.title,
          args.locale
        );
        console.log(`  Article generated: "${article.title}"`);
        console.log(`  Tags: ${article.tags.join(", ")}`);

        // Step 3: Save to DB
        await db.insert(blogPosts).values({
          title: article.title,
          slug: article.slug,
          summary: article.summary,
          content: article.content,
          thumbnailUrl: video.thumbnailUrl,
          youtubeVideoId: video.id,
          youtubeChannel: "Huberman Lab",
          videoPublishedAt: new Date(video.publishedAt),
          tags: article.tags,
          locale: args.locale,
          status: "published",
          metadata: {
            model: MINIMAX_MODEL,
            originalTitle: video.title,
            transcriptLength: transcript.length,
            processedAt: new Date().toISOString(),
            locale: args.locale,
          },
        });

        console.log("  Saved to database!");
        processed++;

        // Rate limit between videos
        if (newVideos.indexOf(video) < newVideos.length - 1) {
          console.log("  Waiting 2s before next video...");
          await sleep(2000);
        }
      } catch (err) {
        console.error(`  [ERROR] Failed to process: ${err}`);
        failed++;
      }
    }

    console.log(`\n=== Done ===`);
    console.log(`Processed: ${processed}, Failed: ${failed}, Skipped: ${videos.length - newVideos.length}`);
  } finally {
    await client.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });

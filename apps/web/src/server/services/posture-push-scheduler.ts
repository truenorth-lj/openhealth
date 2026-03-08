import { db } from "@/server/db";
import { pushSubscriptions } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { webpush, VAPID_PUBLIC_KEY } from "./web-push";

// In-memory map: sessionId -> NodeJS.Timeout
const timers = new Map<string, NodeJS.Timeout>();

interface PushPayload {
  type: string;
  title: string;
  body: string;
  tag?: string;
  url?: string;
}

async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!VAPID_PUBLIC_KEY) return;

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  const jsonPayload = JSON.stringify(payload);

  for (const sub of subs) {
    const keys = sub.keys as { p256dh: string; auth: string };
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys },
        jsonPayload
      );
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      // 410 Gone or 404 — subscription expired, clean up
      if (statusCode === 410 || statusCode === 404) {
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.id, sub.id));
      }
    }
  }
}

export function schedulePush(
  userId: string,
  sessionId: string,
  fireAt: Date,
  payload: PushPayload
) {
  // Cancel any existing timer for this session
  cancelPush(sessionId);

  const delay = fireAt.getTime() - Date.now();
  if (delay <= 0) {
    // Already past — fire immediately
    sendPushToUser(userId, payload);
    return;
  }

  const timer = setTimeout(() => {
    timers.delete(sessionId);
    sendPushToUser(userId, payload);
  }, delay);

  // Prevent timer from blocking Node.js shutdown
  if (timer.unref) timer.unref();

  timers.set(sessionId, timer);
}

export function cancelPush(sessionId: string) {
  const existing = timers.get(sessionId);
  if (existing) {
    clearTimeout(existing);
    timers.delete(sessionId);
  }
}

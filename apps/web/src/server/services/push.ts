import { db } from "@/server/db";
import { pushSubscriptions, pushTokens } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { webpush, VAPID_PUBLIC_KEY } from "./web-push";

export interface PushPayload {
  type: string;
  title: string;
  body: string;
  tag?: string;
  url?: string;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!VAPID_PUBLIC_KEY) return;

  const jsonPayload = JSON.stringify(payload);
  const sentEndpoints = new Set<string>();

  // Send via new push_tokens table (web tokens) — primary
  const tokens = await db
    .select()
    .from(pushTokens)
    .where(eq(pushTokens.userId, userId));

  for (const token of tokens) {
    if (token.platform !== "web") continue;
    try {
      const subscription = JSON.parse(token.token) as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
      await webpush.sendNotification(subscription, jsonPayload);
      sentEndpoints.add(subscription.endpoint);
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 410 || statusCode === 404) {
        await db.delete(pushTokens).where(eq(pushTokens.id, token.id));
      }
    }
  }

  // Fallback: legacy push_subscriptions (skip already-sent endpoints)
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  for (const sub of subs) {
    if (sentEndpoints.has(sub.endpoint)) continue;
    const keys = sub.keys as { p256dh: string; auth: string };
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys },
        jsonPayload
      );
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 410 || statusCode === 404) {
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.id, sub.id));
      }
    }
  }
}

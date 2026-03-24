import { sendPushToUser, type PushPayload } from "./push";

// In-memory map: sessionId -> NodeJS.Timeout
const timers = new Map<string, NodeJS.Timeout>();

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

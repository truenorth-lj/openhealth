"use client";

import { useEffect, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc-client";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushSubscription() {
  const subscribedRef = useRef(false);

  const { data: vapid } = trpc.push.getVapidPublicKey.useQuery(undefined, {
    staleTime: Infinity,
  });
  const subscribeMutation = trpc.push.subscribe.useMutation();
  const mutateRef = useRef(subscribeMutation.mutateAsync);
  mutateRef.current = subscribeMutation.mutateAsync;

  const subscribeToPush = useCallback(async () => {
    if (!vapid?.key) return false;
    if (!("serviceWorker" in navigator) || !("PushManager" in window))
      return false;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    const registration = await navigator.serviceWorker.ready;
    const applicationServerKey = urlBase64ToUint8Array(vapid.key);

    // Check for existing subscription first
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });
    }

    const json = subscription.toJSON();
    if (json.endpoint && json.keys) {
      // Legacy subscribe (writes to push_subscriptions + push_tokens)
      await mutateRef.current({
        endpoint: json.endpoint,
        keys: {
          p256dh: json.keys.p256dh!,
          auth: json.keys.auth!,
        },
      });
    }

    return true;
  }, [vapid?.key]);

  // Auto-subscribe if permission already granted
  useEffect(() => {
    if (subscribedRef.current) return;
    if (!vapid?.key) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    subscribedRef.current = true;
    subscribeToPush().catch(() => {});
  }, [vapid?.key, subscribeToPush]);

  return {
    subscribeToPush,
    isSupported:
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window,
    permission:
      typeof window !== "undefined" && "Notification" in window
        ? Notification.permission
        : ("denied" as NotificationPermission),
  };
}

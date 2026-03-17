"use client";

import { useRef, useCallback, useState, useEffect } from "react";

/**
 * Hook for meditation audio — ambient music + bell alarm.
 * Uses HTML5 Audio API (works in all browsers / PWA).
 */
export function useMeditationAudio() {
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const bellRef = useRef<HTMLAudioElement | null>(null);
  const vibrationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [bellRinging, setBellRinging] = useState(false);

  const startMusic = useCallback((volume = 0.4) => {
    if (musicRef.current) {
      musicRef.current.pause();
    }
    const audio = new Audio("/meditation-ambient.mp3");
    audio.loop = true;
    audio.volume = volume;
    audio.play().catch(() => {
      // Autoplay may be blocked — user interaction required
      console.warn("[meditation-audio] Autoplay blocked");
    });
    musicRef.current = audio;
    setMusicPlaying(true);
  }, []);

  const stopMusic = useCallback(() => {
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current.src = "";
      musicRef.current = null;
    }
    setMusicPlaying(false);
  }, []);

  const toggleMusic = useCallback(
    (volume = 0.4) => {
      if (musicPlaying) {
        stopMusic();
      } else {
        startMusic(volume);
      }
    },
    [musicPlaying, startMusic, stopMusic]
  );

  const startBell = useCallback(() => {
    if (bellRef.current) {
      bellRef.current.pause();
    }
    // Stop music first
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current.src = "";
      musicRef.current = null;
      setMusicPlaying(false);
    }
    const audio = new Audio("/meditation-bell.mp3");
    audio.loop = true;
    audio.volume = 0.8;
    audio.play().catch(() => {
      console.warn("[meditation-audio] Bell autoplay blocked");
    });
    bellRef.current = audio;
    setBellRinging(true);

    // Persistent vibration for mobile browsers / PWA
    if ("vibrate" in navigator) {
      navigator.vibrate([600, 1500]);
      vibrationRef.current = setInterval(() => {
        navigator.vibrate([600, 1500]);
      }, 2100);
    }

    // Fire a notification as fallback (user may have screen locked in PWA)
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("冥想時間到", {
          body: "您的冥想計時已完成",
          tag: "meditation-bell",
          requireInteraction: true,
        });
      } catch {
        // Notification API may not be available in some contexts
      }
    }
  }, []);

  const stopBell = useCallback(() => {
    if (bellRef.current) {
      bellRef.current.pause();
      bellRef.current.src = "";
      bellRef.current = null;
    }
    setBellRinging(false);
    if (vibrationRef.current) {
      clearInterval(vibrationRef.current);
      vibrationRef.current = null;
    }
    if ("vibrate" in navigator) {
      navigator.vibrate(0);
    }
  }, []);

  const cleanup = useCallback(() => {
    stopMusic();
    stopBell();
  }, [stopMusic, stopBell]);

  // Cleanup on unmount — stop all audio and vibration
  useEffect(() => {
    return () => {
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current.src = "";
      }
      if (bellRef.current) {
        bellRef.current.pause();
        bellRef.current.src = "";
      }
      if (vibrationRef.current) {
        clearInterval(vibrationRef.current);
      }
    };
  }, []);

  return {
    musicPlaying,
    bellRinging,
    startMusic,
    stopMusic,
    toggleMusic,
    startBell,
    stopBell,
    cleanup,
  };
}

"use client";

import { useCallback, useEffect, useRef } from "react";

import { importLocalData } from "@/lib/local-data";

const SYNC_TIMEOUT_MS = 10_000;
const MIN_SYNC_INTERVAL_MS = 60_000;
const RECOVERY_POLL_MS = 5 * 60_000;
const LAST_SYNC_ATTEMPT_KEY = "goodminton:local-sync:last-attempt";

type LocalBackendSyncProps = {
 returnOnlineWhenRecovered?: boolean;
};

function readLastAttempt() {
 const value = window.sessionStorage.getItem(LAST_SYNC_ATTEMPT_KEY);
 if (!value) return 0;

 const parsed = Number(value);
 return Number.isFinite(parsed) ? parsed : 0;
}

function writeLastAttempt(value: number) {
 window.sessionStorage.setItem(LAST_SYNC_ATTEMPT_KEY, String(value));
}

export function LocalBackendSync({
 returnOnlineWhenRecovered = false,
}: LocalBackendSyncProps) {
 const syncingRef = useRef(false);

 const sync = useCallback(
  async (force = false) => {
   if (syncingRef.current || !navigator.onLine) return;

   const now = Date.now();
   if (!force && now - readLastAttempt() < MIN_SYNC_INTERVAL_MS) return;

   writeLastAttempt(now);
   syncingRef.current = true;

   const controller = new AbortController();
   const timeoutId = window.setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);

   try {
    const response = await fetch("/api/local-sync", {
     cache: "no-store",
     signal: controller.signal,
    });

    if (!response.ok) return;

    const payload: unknown = await response.json();
    importLocalData(JSON.stringify(payload));

    if (returnOnlineWhenRecovered) {
     window.location.replace("/");
    }
   } catch {
    // Local data remains untouched when the backend is unavailable.
   } finally {
    window.clearTimeout(timeoutId);
    syncingRef.current = false;
   }
  },
  [returnOnlineWhenRecovered],
 );

 useEffect(() => {
  void sync();

  const handleOnline = () => void sync(true);
  const handleVisibility = () => {
   if (document.visibilityState === "visible") {
    void sync();
   }
  };
  const pollId = window.setInterval(() => void sync(), RECOVERY_POLL_MS);

  window.addEventListener("online", handleOnline);
  document.addEventListener("visibilitychange", handleVisibility);

  return () => {
   window.clearInterval(pollId);
   window.removeEventListener("online", handleOnline);
   document.removeEventListener("visibilitychange", handleVisibility);
  };
 }, [sync]);

 return null;
}

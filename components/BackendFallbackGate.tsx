"use client";

import { useEffect, useState } from "react";

import { readLocalData } from "@/lib/local-data";

type HealthState = "checking" | "online" | "offline";

type BackendFallbackGateProps = {
 showDiagnostics?: boolean;
};

export function BackendFallbackGate({
 showDiagnostics = false,
}: BackendFallbackGateProps) {
 const [state, setState] = useState<HealthState>("checking");
 const [hasLocalData, setHasLocalData] = useState(false);

 useEffect(() => {
  const snapshot = readLocalData();
  const localAvailable = snapshot.members.length > 0 || snapshot.sessions.length > 0;
  setHasLocalData(localAvailable);

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 5_000);
  const fallbackUrl = showDiagnostics
   ? "/backup?offline=1&recover=1"
   : "/backup?recover=1";

  fetch("/api/backend-health", {
   cache: "no-store",
   signal: controller.signal,
  })
   .then((response) => {
    if (response.ok) {
     setState("online");
     return;
    }

    setState("offline");
    if (localAvailable) {
     window.location.replace(fallbackUrl);
    }
   })
   .catch(() => {
    setState("offline");
    if (localAvailable) {
     window.location.replace(fallbackUrl);
    }
   })
   .finally(() => window.clearTimeout(timeoutId));

  return () => {
   window.clearTimeout(timeoutId);
   controller.abort();
  };
 }, [showDiagnostics]);

 if (!showDiagnostics || state !== "offline" || hasLocalData) {
  return null;
 }

 return (
  <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm">
   <div className="text-sm font-black">Supabase hiện không phản hồi.</div>
   <p className="mt-1 text-sm font-semibold leading-relaxed text-amber-800">
    Thiết bị này chưa có snapshot local để fallback. Khi backend hoạt động lại, hãy mở
    Tổng quan một lần để tạo bản sao trên máy.
   </p>
  </section>
 );
}

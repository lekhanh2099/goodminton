import { NextResponse } from "next/server";

import { getAllMembers, getDashboardData } from "@/lib/data";
import { LOCAL_DATA_SCHEMA_VERSION } from "@/lib/local-data";
import { getCurrentMemberId } from "@/lib/member-session";

export const dynamic = "force-dynamic";

const SYNC_TIMEOUT_MS = 8_000;

async function loadAuthoritativeSnapshot() {
 const timeout = new Promise<never>((_, reject) => {
  setTimeout(() => reject(new Error("Supabase local sync timed out.")), SYNC_TIMEOUT_MS);
 });

 const data = Promise.all([getAllMembers(), getDashboardData()]);
 const [members, dashboard] = await Promise.race([data, timeout]);

 return {
  schemaVersion: LOCAL_DATA_SCHEMA_VERSION,
  updatedAt: new Date().toISOString(),
  members,
  sessions: dashboard.sessions,
 };
}

export async function GET() {
 const memberId = await getCurrentMemberId();

 if (!memberId) {
  return NextResponse.json(
   { synced: false },
   {
    status: 401,
    headers: { "Cache-Control": "no-store, max-age=0" },
   },
  );
 }

 try {
  const snapshot = await loadAuthoritativeSnapshot();
  return NextResponse.json(snapshot, {
   headers: { "Cache-Control": "no-store, max-age=0" },
  });
 } catch (error) {
  console.error("Supabase local snapshot sync failed.", error);
  return NextResponse.json(
   { synced: false },
   {
    status: 503,
    headers: { "Cache-Control": "no-store, max-age=0" },
   },
  );
 }
}

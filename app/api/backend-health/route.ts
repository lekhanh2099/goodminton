import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const HEALTH_TIMEOUT_MS = 4_000;

async function checkSupabase() {
 const supabase = createSupabaseServerClient();
 const query = supabase.from("members").select("id").limit(1);
 const timeout = new Promise<never>((_, reject) => {
  setTimeout(() => reject(new Error("Supabase health check timed out.")), HEALTH_TIMEOUT_MS);
 });

 const { error } = await Promise.race([query, timeout]);
 if (error) {
  throw new Error(error.message);
 }
}

export async function GET() {
 try {
  await checkSupabase();
  return NextResponse.json(
   { available: true },
   { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
 } catch (error) {
  console.error("Supabase backend health check failed.", error);
  return NextResponse.json(
   { available: false },
   {
    status: 503,
    headers: { "Cache-Control": "no-store, max-age=0" },
   },
  );
 }
}

"use client";

import { useEffect } from "react";

import { saveLocalSnapshot } from "@/lib/local-data";
import type { Member, SessionSummary } from "@/lib/types";

type LocalDataSyncProps = {
 members?: Member[];
 sessions?: SessionSummary[];
 replaceMembers?: boolean;
 replaceSessions?: boolean;
};

export function LocalDataSync({
 members,
 sessions,
 replaceMembers = false,
 replaceSessions = false,
}: LocalDataSyncProps) {
 useEffect(() => {
  try {
   saveLocalSnapshot({
    members,
    sessions,
    replaceMembers,
    replaceSessions,
   });
  } catch (error) {
   console.error("Không thể lưu bản sao dữ liệu trên thiết bị.", error);
  }
 }, [members, sessions, replaceMembers, replaceSessions]);

 return null;
}

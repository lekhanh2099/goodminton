"use client";

import { type ChangeEvent, useCallback, useEffect, useState } from "react";

import {
 clearLocalData,
 exportLocalBackup,
 exportMembersCsv,
 exportSessionsCsv,
 importLocalData,
 LOCAL_DATA_UPDATED_EVENT,
 readLocalData,
 type LocalDataSnapshot,
} from "@/lib/local-data";

function formatUpdatedAt(value: string) {
 const date = new Date(value);
 if (Number.isNaN(date.getTime()) || date.getTime() === 0) return "Chưa có dữ liệu";

 return new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
 }).format(date);
}

export function LocalDataCenter() {
 const [snapshot, setSnapshot] = useState<LocalDataSnapshot | null>(null);
 const [message, setMessage] = useState("");

 const refresh = useCallback(() => {
  setSnapshot(readLocalData());
 }, []);

 useEffect(() => {
  refresh();

  window.addEventListener("storage", refresh);
  window.addEventListener(LOCAL_DATA_UPDATED_EVENT, refresh);

  return () => {
   window.removeEventListener("storage", refresh);
   window.removeEventListener(LOCAL_DATA_UPDATED_EVENT, refresh);
  };
 }, [refresh]);

 async function handleImport(event: ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;

  try {
   const imported = importLocalData(await file.text());
   setSnapshot(imported);
   setMessage("Đã nhập backup vào dữ liệu local trên thiết bị này.");
  } catch (error) {
   setMessage(error instanceof Error ? error.message : "Không thể đọc file backup.");
  }
 }

 function handleClear() {
  if (!window.confirm("Xóa toàn bộ bản sao local trên thiết bị này? Dữ liệu Supabase không bị ảnh hưởng.")) {
   return;
  }

  clearLocalData();
  setMessage("Đã xóa dữ liệu local. Dữ liệu trên Supabase không thay đổi.");
 }

 if (!snapshot) {
  return (
   <section className="card">
    <p className="text-sm font-semibold text-slate-500">Đang đọc dữ liệu local...</p>
   </section>
  );
 }

 const hasData = snapshot.members.length > 0 || snapshot.sessions.length > 0;
 const playerCount = snapshot.sessions.reduce(
  (total, session) => total + session.players.length,
  0,
 );

 return (
  <div className="flex flex-col gap-5">
   <section className="rounded-3xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm sm:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
     <div>
      <p className="text-xs font-black uppercase tracking-wide text-indigo-600">
       Local backup
      </p>
      <h1 className="mt-1 text-xl font-black tracking-tight text-slate-950">
       Dữ liệu trên thiết bị
      </h1>
      <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-slate-600">
       Supabase vẫn là nguồn dữ liệu chính. Mỗi khi app tải thành công dữ liệu từ DB,
       một bản sao không chứa mã PIN sẽ được lưu trong localStorage của trình duyệt để
       xem lại và xuất file khi cần.
      </p>
     </div>

     <div className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-indigo-100">
      <div className="text-xs font-black uppercase tracking-wide text-slate-400">
       Cập nhật gần nhất
      </div>
      <div className="mt-1 font-black text-slate-800">
       {formatUpdatedAt(snapshot.updatedAt)}
      </div>
     </div>
    </div>
   </section>

   <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
    <Metric label="Thành viên" value={snapshot.members.length} />
    <Metric label="Buổi chơi" value={snapshot.sessions.length} />
    <Metric label="Lượt người chơi" value={playerCount} />
   </section>

   <section className="card">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
     <div>
      <h2 className="text-lg font-black text-slate-950">Xuất dữ liệu</h2>
      <p className="mt-1 text-sm font-semibold text-slate-500">
       CSV có BOM UTF-8 nên mở trực tiếp bằng Excel không bị lỗi tiếng Việt.
      </p>
     </div>

     <div className="flex flex-wrap gap-2">
      <button
       className="button-secondary"
       disabled={!hasData}
       onClick={() => exportLocalBackup(snapshot)}
       type="button"
      >
       Backup JSON
      </button>
     </div>
    </div>

    <div className="mt-4 grid gap-3 sm:grid-cols-2">
     <ExportCard
      description="Tên, username, SĐT, ghi chú, trạng thái và số dư hiện tại."
      disabled={snapshot.members.length === 0}
      label="Thành viên"
      onExport={() => exportMembersCsv(snapshot)}
     />
     <ExportCard
      description="Mỗi người chơi một dòng, gồm chi phí buổi, phải đóng, đã nhận, nợ và tiền dư."
      disabled={snapshot.sessions.length === 0}
      label="Buổi chơi"
      onExport={() => exportSessionsCsv(snapshot)}
     />
    </div>
   </section>

   <section className="card">
    <h2 className="text-lg font-black text-slate-950">Khôi phục / quản lý bản local</h2>
    <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-500">
     Import chỉ khôi phục bản local trên thiết bị này, không tự ghi ngược lên Supabase.
     Như vậy hai nguồn dữ liệu không ghi đè lẫn nhau ngoài ý muốn.
    </p>

    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
     <label className="button-secondary cursor-pointer text-center">
      Nhập backup JSON
      <input
       accept="application/json,.json"
       className="sr-only"
       onChange={handleImport}
       type="file"
      />
     </label>

     <button
      className="button-secondary text-rose-600"
      disabled={!hasData}
      onClick={handleClear}
      type="button"
     >
      Xóa bản local
     </button>
    </div>

    {message ? (
     <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700">
      {message}
     </p>
    ) : null}
   </section>

   <section className="card">
    <h2 className="text-lg font-black text-slate-950">Dữ liệu đang có</h2>

    {!hasData ? (
     <p className="mt-4 rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm font-semibold text-slate-500">
      Chưa có bản local. Hãy mở Tổng quan hoặc Thành viên khi Supabase hoạt động để app
      tạo snapshot đầu tiên.
     </p>
    ) : (
     <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <PreviewList
       items={snapshot.members.slice(0, 8).map((member) => member.name)}
       moreCount={Math.max(snapshot.members.length - 8, 0)}
       title="Thành viên gần nhất trong backup"
      />
      <PreviewList
       items={snapshot.sessions
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 8)
        .map((session) => `${session.date} · ${session.playerCount} người`)}
       moreCount={Math.max(snapshot.sessions.length - 8, 0)}
       title="Buổi chơi gần nhất trong backup"
      />
     </div>
    )}
   </section>
  </div>
 );
}

function Metric({ label, value }: { label: string; value: number }) {
 return (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
   <div className="text-[11px] font-black uppercase tracking-wide text-slate-500 sm:text-xs">
    {label}
   </div>
   <div className="mt-2 text-xl font-black tracking-tight text-slate-950">{value}</div>
  </div>
 );
}

function ExportCard({
 label,
 description,
 disabled,
 onExport,
}: {
 label: string;
 description: string;
 disabled: boolean;
 onExport: () => void;
}) {
 return (
  <div className="rounded-2xl border border-slate-200 p-4">
   <div className="font-black text-slate-950">{label}</div>
   <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-500">
    {description}
   </p>
   <button
    className="button-primary mt-4 w-full sm:w-auto"
    disabled={disabled}
    onClick={onExport}
    type="button"
   >
    Xuất CSV
   </button>
  </div>
 );
}

function PreviewList({
 title,
 items,
 moreCount,
}: {
 title: string;
 items: string[];
 moreCount: number;
}) {
 return (
  <div className="rounded-2xl border border-slate-200 p-4">
   <h3 className="text-sm font-black text-slate-950">{title}</h3>
   <div className="mt-3 flex flex-col gap-2">
    {items.length === 0 ? (
     <span className="text-sm font-semibold text-slate-400">Chưa có dữ liệu.</span>
    ) : (
     items.map((item, index) => (
      <div
       className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
       key={`${item}-${index}`}
      >
       {item}
      </div>
     ))
    )}
    {moreCount > 0 ? (
     <div className="text-xs font-black text-slate-400">+ {moreCount} mục khác</div>
    ) : null}
   </div>
  </div>
 );
}

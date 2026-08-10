import Link from "next/link";

import { LocalWorkspace } from "@/components/LocalWorkspace";

export function DbError({ error }: { error: unknown }) {
 const showDiagnostics = process.env.NODE_ENV === "development";

 return (
  <div className="flex flex-col gap-5">
   {showDiagnostics ? (
    <section className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm sm:p-6">
     <h1 className="text-lg font-black">Supabase hiện không phản hồi</h1>
     <p className="mt-2 text-sm font-semibold leading-relaxed">
      DEV: app đã chuyển phần dữ liệu sang snapshot local ở chế độ chỉ đọc. Thao tác ghi sẽ không được thực hiện cho tới khi backend hoạt động lại.
     </p>
     <p className="mt-2 text-xs font-semibold text-amber-700">
      {error instanceof Error ? error.message : "Không xác định được lỗi backend."}
     </p>
     <div className="mt-4 flex flex-wrap gap-2">
      <Link
       className="inline-flex min-h-10 items-center justify-center rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm font-black text-amber-800 hover:bg-amber-100"
       href="/backup?offline=1&recover=1"
      >
       Mở Local mode riêng
      </Link>
      <Link
       className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
       href="/"
      >
       Thử kết nối lại
      </Link>
     </div>
    </section>
   ) : null}

   <LocalWorkspace offline={showDiagnostics} />
  </div>
 );
}

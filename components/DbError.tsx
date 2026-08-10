import Link from "next/link";

export function DbError({ error }: { error: unknown }) {
 return (
  <section className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-rose-800 shadow-sm sm:p-6">
   <h1 className="text-lg font-black">Không thể tải dữ liệu từ Supabase</h1>
   <p className="mt-2 text-sm font-semibold">
    {error instanceof Error
     ? error.message
     : "Vui lòng kiểm tra cấu hình Supabase và thử lại."}
   </p>
   <div className="mt-4">
    <Link
     className="inline-flex min-h-10 items-center justify-center rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-black text-rose-700 hover:bg-rose-100"
     href="/backup"
    >
     Xem / xuất bản local
    </Link>
   </div>
  </section>
 );
}

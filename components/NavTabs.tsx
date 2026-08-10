"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
 { href: "/", label: "Tổng quan", adminOnly: false },
 { href: "/sessions", label: "Buổi chơi", adminOnly: false },
 { href: "/members", label: "Thành viên", adminOnly: false },
 { href: "/backup", label: "Dữ liệu máy", adminOnly: false },
 { href: "/sessions/new", label: "Tạo buổi", adminOnly: true },
];

function isActivePath(pathname: string, href: string) {
 if (href === "/") {
  return pathname === "/";
 }

 if (href === "/sessions") {
  return (
   pathname === "/sessions" ||
   (pathname.startsWith("/sessions/") && pathname !== "/sessions/new")
  );
 }

 return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavTabs({ isAdmin }: { isAdmin: boolean }) {
 const pathname = usePathname();
 const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

 return (
  <nav className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
   {visibleItems.map((item) => {
    const isActive = isActivePath(pathname, item.href);

    return (
     <Link
      aria-current={isActive ? "page" : undefined}
      className={
       isActive
        ? "flex min-h-10 items-center justify-center rounded-full border border-indigo-300 bg-indigo-600 px-3 py-2 text-sm font-black text-white shadow-sm sm:px-4"
        : "flex min-h-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-white sm:px-4"
      }
      href={item.href}
      key={item.href}
     >
      {item.label}
     </Link>
    );
   })}
  </nav>
 );
}

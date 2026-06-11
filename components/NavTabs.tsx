"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Tổng quan" },
  { href: "/members", label: "Thành viên" },
  { href: "/sessions", label: "Buổi chơi" },
  { href: "/sessions/new", label: "Tạo buổi chơi" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  if (href === "/sessions") {
    return pathname === "/sessions" || (pathname.startsWith("/sessions/") && pathname !== "/sessions/new");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1">
      {navItems.map((item) => {
        const isActive = isActivePath(pathname, item.href);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "whitespace-nowrap rounded-full border border-indigo-300 bg-indigo-600 px-4 py-2 text-sm font-black text-white shadow-sm"
                : "whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-white"
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

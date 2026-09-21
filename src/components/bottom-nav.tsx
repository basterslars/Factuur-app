"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

function NavIcon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d={path} />
    </svg>
  );
}

const ICONS = {
  home: "M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  plus: "M12 5v14M5 12h14",
  users:
    "M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  menu: "M4 6h16M4 12h16M4 18h16",
};

type NavItem = { href: string; label: string; icon: keyof typeof ICONS };

const items: NavItem[] = [
  { href: "/", label: "Overzicht", icon: "home" },
  { href: "/facturen", label: "Facturen", icon: "list" },
  { href: "/facturen/nieuw", label: "Nieuw", icon: "plus" },
  { href: "/klanten", label: "Klanten", icon: "users" },
  { href: "/meer", label: "Meer", icon: "menu" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2">
        {items.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const isCenter = item.icon === "plus";
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-xs ${
                  active ? "text-blue-600" : "text-gray-500"
                }`}
              >
                {isCenter ? (
                  <span className="-mt-4 flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-md">
                    <NavIcon path={ICONS[item.icon]} />
                  </span>
                ) : (
                  <NavIcon path={ICONS[item.icon]} />
                )}
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function PageWithNav({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="flex-1 pb-24">{children}</div>
      <BottomNav />
    </>
  );
}

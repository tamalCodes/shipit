"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiBarChart2, FiCheckSquare, FiMenu, FiX } from "react-icons/fi";
import type { IconType } from "react-icons";

import SignOutButton from "@/components/auth/SignOutButton";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
};

type NavItem = {
  label: string;
  href: string;
  icon: IconType;
};

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: FiBarChart2,
  },
  {
    label: "Tasks",
    href: "/tasks",
    icon: FiCheckSquare,
  },
];

type SidebarContentProps = {
  isCollapsed: boolean;
  pathname: string;
  onLinkClick?: () => void;
  showCloseButton?: boolean;
  onClose?: () => void;
};

function SidebarContent({
  isCollapsed,
  pathname,
  onLinkClick,
  showCloseButton = false,
  onClose,
}: SidebarContentProps) {
  return (
    <>
      <div className="flex h-16 items-center justify-between gap-2 border-b border-zinc-200 px-4">
        <Link
          href="/dashboard"
          onClick={onLinkClick}
          className="flex items-center gap-2 text-sm font-semibold text-zinc-900"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 text-xs font-bold uppercase tracking-wide text-white">
            SI
          </span>
          {!isCollapsed ? <span>ShipIt</span> : null}
        </Link>
        {showCloseButton ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700"
            aria-label="Close navigation"
          >
            <FiX className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center rounded-xl text-sm font-medium transition-colors",
                isCollapsed
                  ? "h-12 w-12 justify-center"
                  : "gap-3 px-3 py-2",
                isActive
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {!isCollapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "flex flex-col gap-3 border-t border-zinc-200 p-4 transition-all",
          isCollapsed ? "items-center" : ""
        )}
      >
        {!isCollapsed ? (
          <div className="text-left">
            <p className="text-xs uppercase tracking-wide text-zinc-400">
              Workspace
            </p>
            <p className="text-sm font-medium text-zinc-700">Product Team</p>
          </div>
        ) : null}
        <div className={cn(isCollapsed ? "" : "flex w-full")}>
          <SignOutButton />
        </div>
      </div>
    </>
  );
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [isCollapsed, setCollapsed] = useState(true);
  const [isMobileOpen, setMobileOpen] = useState(false);

  const activeItem = useMemo(() => {
    return navItems.find((item) => {
      if (pathname === item.href) return true;
      return pathname.startsWith(`${item.href}/`);
    });
  }, [pathname]);

  const handleMouseEnter = () => {
    setCollapsed(false);
  };

  const handleMouseLeave = () => {
    setCollapsed(true);
  };

  return (
    <div className="relative flex h-screen overflow-hidden bg-zinc-100 text-zinc-900">
      {/* Desktop sidebar */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "absolute inset-y-0 left-0 z-30 hidden h-full flex-col border-r border-zinc-200 bg-white transition-[width] duration-200 ease-in-out overflow-hidden shadow-xl md:flex",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent isCollapsed={isCollapsed} pathname={pathname} />
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200 bg-white shadow-xl md:hidden">
            <SidebarContent
              isCollapsed={false}
              pathname={pathname}
              onLinkClick={() => setMobileOpen(false)}
              showCloseButton
              onClose={() => setMobileOpen(false)}
            />
          </aside>
        </>
      ) : null}

      <div className="flex h-full flex-1 flex-col">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 sm:px-6 md:pl-24">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 md:hidden"
              aria-label="Open navigation"
            >
              <FiMenu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-400">
                Overview
              </p>
              <h1 className="text-lg font-semibold text-zinc-900">
                {activeItem?.label ?? "Workspace"}
              </h1>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-zinc-50 md:pl-24">
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

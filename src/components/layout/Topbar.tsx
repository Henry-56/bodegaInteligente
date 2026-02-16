"use client";

import { useSession, signOut } from "next-auth/react";
import Button from "@/components/ui/Button";

interface TopbarProps {
  onMenuToggle: () => void;
}

export default function Topbar({ onMenuToggle }: TopbarProps) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      {/* Hamburger button (mobile only) */}
      <button
        onClick={onMenuToggle}
        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
        aria-label="Abrir menu"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Spacer on desktop */}
      <div className="hidden lg:block" />

      {/* Right side: user info + logout */}
      <div className="flex items-center gap-4">
        {session?.user && (
          <div className="hidden items-center gap-2 sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">
              {session.user.name
                ? session.user.name.charAt(0).toUpperCase()
                : session.user.email.charAt(0).toUpperCase()}
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-700">
                {session.user.name || session.user.email}
              </p>
              <p className="text-xs text-gray-400">
                {session.user.role === "OWNER" ? "Propietario" : "Personal"}
              </p>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span className="hidden sm:inline">Salir</span>
        </Button>
      </div>
    </header>
  );
}

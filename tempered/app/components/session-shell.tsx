"use client";

import { useEffect } from "react";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { SessionProvider, notifySessionChanged, useSession } from "./session-context";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const activityEvents = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];

function clearSessionCookies() {
  document.cookie = "tempered_session=; Max-Age=0; path=/";
  document.cookie = "tempered_user_id=; Max-Age=0; path=/";
}

function SessionChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { authenticated } = useSession();
  const isLoginPage = pathname === "/";
  const isMainMenu = pathname === "/menu";
  const theme = pathname === "/" || pathname === "/menu"
    ? "theme-tempered"
    : pathname.startsWith("/mawina")
      ? "theme-mawina"
      : pathname.startsWith("/grobit")
      ? "theme-grobit"
      : pathname.startsWith("/herramientas") || pathname.startsWith("/utilidades")
        ? "theme-tools"
        : "theme-isorropia";

  useEffect(() => {
    if (isLoginPage || !authenticated) return;

    let idleTimer: ReturnType<typeof setTimeout>;
    let loggingOut = false;

    const logout = async () => {
      if (loggingOut) return;
      loggingOut = true;
      try {
        await signOut(auth);
      } finally {
        clearSessionCookies();
        notifySessionChanged();
        router.replace("/");
      }
    };

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => void logout(), IDLE_TIMEOUT_MS);
    };

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetIdleTimer, { passive: true });
    });
    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetIdleTimer);
      });
    };
  }, [authenticated, isLoginPage, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      clearSessionCookies();
      notifySessionChanged();
      router.replace("/");
    }
  };

  return (
    <div key={pathname} className={`theme-root page-enter ${theme}`}>
      {!isLoginPage && !isMainMenu && authenticated && (
        <nav className="flex w-full items-center justify-between gap-3 px-4 pt-4 sm:px-6" aria-label="Navegación de sesión">
          <Link
            href="/menu"
            className="min-h-11 transform-gpu rounded-xl border border-white/45 bg-black/35 px-4 py-2 text-xs uppercase text-white shadow-lg shadow-black/20 transition-[transform,background-color,border-color] duration-150 ease-out hover:border-white hover:bg-white/15 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <span aria-hidden="true">←</span> Volver al menú principal
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="min-h-11 transform-gpu rounded-xl border border-white/45 bg-black/35 px-4 py-2 text-xs uppercase text-white shadow-lg shadow-black/20 transition-[transform,background-color,border-color] duration-150 ease-out hover:border-white hover:bg-white/15 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <span aria-hidden="true">↪</span> Cerrar sesión
          </button>
        </nav>
      )}
      {children}
    </div>
  );
}

export default function SessionShell({ children }: { children: React.ReactNode }) {
  return <SessionProvider><SessionChrome>{children}</SessionChrome></SessionProvider>;
}

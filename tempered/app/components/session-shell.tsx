"use client";

import { useEffect, useState } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const activityEvents = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];

function hasSessionCookie() {
  return document.cookie.split("; ").some((cookie) => cookie.startsWith("tempered_session=authenticated"));
}

function clearSessionCookies() {
  document.cookie = "tempered_session=; Max-Age=0; path=/";
  document.cookie = "tempered_user_id=; Max-Age=0; path=/";
}

export default function SessionShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
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
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setAuthenticated(Boolean(firebaseUser) || hasSessionCookie());
    });
    return unsubscribe;
  }, []);

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

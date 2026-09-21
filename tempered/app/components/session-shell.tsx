"use client";

import { useEffect, useState } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
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
  const theme = pathname === "/" || pathname === "/menu"
    ? "theme-tempered"
    : pathname.startsWith("/grobit")
      ? "theme-grobit"
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
    <div className={`theme-root ${theme}`}>
      {!isLoginPage && authenticated && (
        <nav className="flex w-full justify-end px-4 pt-4 sm:px-6" aria-label="Sesión">
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="min-h-11 rounded-xl border border-white/25 bg-black/20 px-4 py-2 text-xs uppercase text-white/80 transition hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70"
          >
            Cerrar sesión
          </button>
        </nav>
      )}
      {children}
    </div>
  );
}

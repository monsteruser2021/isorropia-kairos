"use client";

import { onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { readSessionUserId } from "./grobit-data";

const SESSION_EVENT = "tempered-session-changed";

type SessionContextValue = {
  userId: string | null;
  authenticated: boolean;
};

const SessionContext = createContext<SessionContextValue>({ userId: null, authenticated: false });

export function notifySessionChanged() {
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [firebaseAuthenticated, setFirebaseAuthenticated] = useState(false);

  useEffect(() => {
    const syncSession = () => setUserId(readSessionUserId());
    syncSession();
    const unsubscribe = onAuthStateChanged(auth, (user) => setFirebaseAuthenticated(Boolean(user)));
    window.addEventListener(SESSION_EVENT, syncSession);
    window.addEventListener("storage", syncSession);
    return () => {
      unsubscribe();
      window.removeEventListener(SESSION_EVENT, syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, []);

  return (
    <SessionContext.Provider value={{ userId, authenticated: Boolean(userId) || firebaseAuthenticated }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}

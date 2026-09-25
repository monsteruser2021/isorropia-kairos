"use client";

import { onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type SessionContextValue = {
  userId: string | null;
  authenticated: boolean;
  loading: boolean;
};

const SessionContext = createContext<SessionContextValue>({ userId: null, authenticated: false, loading: true });

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [firebaseAuthenticated, setFirebaseAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseAuthenticated(Boolean(user));
      setLoading(false);
      if (!user) {
        setUserId(null);
        document.cookie = "tempered_user_id=; Max-Age=0; path=/";
        return;
      }

      void getDocs(query(collection(db, "users"), where("authUid", "==", user.uid)))
        .then((snapshot) => {
          if (!active) return;
          const legacyUserId = snapshot.docs[0]?.id ?? user.uid;
          setUserId(legacyUserId);
          document.cookie = `tempered_user_id=${encodeURIComponent(legacyUserId)}; path=/; SameSite=Lax`;
        })
        .catch((error) => {
          console.error("No se pudo resolver el usuario de Tempered:", error);
          if (active) setUserId(null);
        });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider value={{ userId, authenticated: firebaseAuthenticated, loading }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}

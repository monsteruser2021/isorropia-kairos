"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { notifySessionChanged } from "./components/session-context";

export default function Home() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const usernameInput = formData.get("username") as string;
    const passwordInput = formData.get("password") as string;

    try {
      const userRef = doc(db, "users", "cesc.8");
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        if (userData.username === usernameInput && userData.password === passwordInput) {
          document.cookie = "tempered_session=authenticated; path=/; SameSite=Lax";
          document.cookie = "tempered_user_id=cesc.8; path=/; SameSite=Lax";
          window.localStorage.setItem("tempered_user_id", "cesc.8");
          notifySessionChanged();
          router.push("/menu");
        } else {
          setErrorMsg("Credenciales incorrectas. Verifica tus datos.");
        }
      } else {
        setErrorMsg("No se encontró el usuario administrador en la base de datos.");
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setErrorMsg("Ocurrió un error de conexión con la base de datos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center overflow-x-hidden px-4 py-6 sm:px-6 sm:py-10">
      <section className="w-full max-w-2xl rounded-3xl border border-white/25 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-10 md:p-12">
        <div className="mx-auto w-full max-w-md">
          <h1 className="font-display text-center text-3xl uppercase tracking-[0.08em] text-[#adc0fa] sm:text-4xl sm:tracking-[0.1em] md:text-5xl">
            Tempered
          </h1>

          <form onSubmit={handleLogin} className="mt-8 space-y-5 sm:mt-12 sm:space-y-6">
            {errorMsg && (
              <div className="rounded-xl border border-red-500/50 bg-red-500/20 p-3 text-center text-xs leading-5 text-red-200 sm:text-sm">
                {errorMsg}
              </div>
            )}

            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-xs font-medium text-white/85 sm:text-sm"
              >
                Usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="min-h-12 w-full rounded-xl border border-white/25 bg-black/20 px-4 py-3 text-base text-white outline-none transition placeholder:text-sm placeholder:text-white/45 focus:border-white/70 focus:bg-black/30 focus:ring-2 focus:ring-white/20 sm:text-sm"
                placeholder="Ingresa tu usuario"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-medium text-white/85 sm:text-sm"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="min-h-12 w-full rounded-xl border border-white/25 bg-black/20 px-4 py-3 text-base text-white outline-none transition placeholder:text-sm placeholder:text-white/45 focus:border-white/70 focus:bg-black/30 focus:ring-2 focus:ring-white/20 sm:text-sm"
                placeholder="Ingresa tu contraseña"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="min-h-12 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#121212] transition hover:bg-white/85 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Entrar"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
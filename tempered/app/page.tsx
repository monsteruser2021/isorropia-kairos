"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-[#121212] to-[#2e4484] px-5 py-10">
      <section className="w-[60vw] max-w-2xl min-w-0 rounded-3xl border border-white/25 bg-white/10 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-12">
        <div className="mx-auto max-w-md">
          <h1 className="font-display text-center text-4xl uppercase tracking-[0.1em] text-[#adc0fa] sm:text-5xl">
            Tempered
          </h1>

          <form onSubmit={handleLogin} className="mt-12 space-y-6">
            {errorMsg && (
              <div className="rounded-xl bg-red-500/20 border border-red-500/50 p-3 text-center text-sm text-red-200">
                {errorMsg}
              </div>
            )}

            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-white/85"
              >
                Usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="w-full rounded-xl border border-white/25 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/45 focus:border-white/70 focus:bg-black/30 focus:ring-2 focus:ring-white/20"
                placeholder="Ingresa tu usuario"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-white/85"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-white/25 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/45 focus:border-white/70 focus:bg-black/30 focus:ring-2 focus:ring-white/20"
                placeholder="Ingresa tu contraseña"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-[#121212] transition hover:bg-white/85 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Entrar"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
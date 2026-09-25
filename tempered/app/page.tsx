"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Home() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const emailInput = formData.get("email") as string;
    const passwordInput = formData.get("password") as string;

    try {
      await signInWithEmailAndPassword(auth, emailInput.trim().toLowerCase(), passwordInput);
      router.push("/menu");
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setErrorMsg("Credenciales incorrectas. Verifica tus datos.");
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
                htmlFor="email"
                className="mb-2 block text-xs font-medium text-white/85 sm:text-sm"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="min-h-12 w-full rounded-xl border border-white/25 bg-black/20 px-4 py-3 text-base text-white outline-none transition placeholder:text-sm placeholder:text-white/45 focus:border-white/70 focus:bg-black/30 focus:ring-2 focus:ring-white/20 sm:text-sm"
                placeholder="Ingresa tu correo electrónico"
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
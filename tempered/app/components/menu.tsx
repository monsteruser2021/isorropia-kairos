import Link from "next/link";

export default function Main() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="flex min-h-[70vh] w-[90vw] max-w-7xl items-center justify-center rounded-3xl border border-white/25 bg-white/10 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-12">
        <div className="w-full max-w-4xl">
          <h1 className="font-display text-center text-3xl uppercase tracking-[0.1em] text-[#ffa216] sm:text-5xl">
            Isorropia Kairos
          </h1>

          <nav className="mt-16 grid gap-5 sm:grid-cols-2 md:grid-cols-4" aria-label="Opciones principales">
            <Link
              href="/distribucion"
              className="rounded-xl border border-white/25 bg-black/20 px-5 py-5 text-center text-sm uppercase text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/70"
            >
              Distribución
            </Link>
            <Link
              href="/balance-bs"
              className="rounded-xl border border-white/25 bg-black/20 px-5 py-5 text-center text-sm uppercase text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/70"
            >
              Balance Bs
            </Link>
            <Link
              href="/balance-dolares"
              className="rounded-xl border border-white/25 bg-black/20 px-5 py-5 text-center text-sm uppercase text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/70"
            >
              Balance $
            </Link>
            <Link
              href="/transfers"
              className="rounded-xl border border-white/25 bg-black/20 px-5 py-5 text-center text-sm uppercase text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/70"
            >
              Transferencias
            </Link>
          </nav>
        </div>
      </section>
    </main>
  );
}

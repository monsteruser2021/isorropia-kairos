import Link from "next/link";

export default function Distribucion() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="w-[90vw] max-w-7xl rounded-3xl border border-white/25 bg-white/10 p-8 text-white shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-12">
        <Link
          href="/menu"
          className="text-sm uppercase text-white/70 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70"
        >
          Volver al menú
        </Link>
        <h1 className="font-display mt-12 text-center text-3xl uppercase tracking-[0.1em] text-[#adc0fa] sm:text-5xl">
          Distribución
        </h1>
      </section>
    </main>
  );
}

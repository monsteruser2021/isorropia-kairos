import Link from "next/link";

const financialApps = [
  { href: "/summary", label: "Resumen" },
  { href: "/distribucion", label: "Distribuciones" },
  { href: "/balance-bs", label: "Balance Bs" },
  { href: "/balance-dolares", label: "Balance $" },
  { href: "/transfers", label: "Transferencias" },
];

export default function FinancialMenu() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="flex min-h-[70vh] w-[90vw] max-w-7xl items-center justify-center rounded-3xl border border-white/25 bg-white/10 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-12">
        <div className="w-full max-w-4xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/menu" className="text-xs uppercase text-white/65 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70">
              Volver a Tempered
            </Link>
            <span className="text-xs uppercase tracking-[0.12em] text-white/45">Aplicación financiera</span>
          </div>
          <h1 className="font-display mt-10 text-center text-3xl uppercase tracking-[0.1em] text-[#ddab36] sm:text-5xl">
            Isorropia Kairos
          </h1>

          <nav className="mt-16 grid gap-5 sm:grid-cols-2 md:grid-cols-3" aria-label="Opciones de Isorropia Kairos">
            {financialApps.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border border-white/25 bg-black/20 px-5 py-5 text-center text-sm uppercase text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/70"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </main>
  );
}
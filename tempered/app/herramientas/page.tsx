import BackButton from "../components/back-button";

export default function HerramientasPage() {
  return (
    <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-5 py-10 sm:px-8">
      <section className="w-full max-w-5xl border border-white/45 bg-black/80 p-7 shadow-2xl shadow-black/50 sm:p-12">
        <BackButton href="/menu">Volver al menú</BackButton>

        <div className="mt-16 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Tempered</p>
          <h1 className="mt-4 text-4xl uppercase tracking-[0.08em] text-white sm:text-6xl">
            Herramientas
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-7 text-white/70 sm:text-base">
            Un espacio para las utilidades que acompañan tu operación diaria.
          </p>
        </div>

        <div className="mt-16 border-t border-white/25 pt-6">
          <p className="text-sm uppercase tracking-[0.12em] text-white/50">
            Módulo preparado para nuevas herramientas
          </p>
        </div>
      </section>
    </main>
  );
}
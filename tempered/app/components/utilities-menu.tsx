import Link from "next/link";
import BackButton from "./back-button";

const utilities = [
  {
    href: "/utilidades/tareas",
    title: "Tareas / To-Do List",
    description: "Organiza pendientes puntuales con fechas límite.",
    action: "Abrir utilidad",
  },
  {
    href: "/utilidades/notas",
    title: "Notas",
    description: "Espacio reservado para notas rápidas.",
    action: "Próximamente",
  },
  {
    href: "/utilidades/temporizador",
    title: "Temporizador",
    description: "Acceso preparado para una utilidad futura.",
    action: "Próximamente",
  },
];

export default function UtilitiesMenu() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <section className="w-full border border-white/45 bg-black/80 p-5 shadow-2xl shadow-black/50 sm:p-10">
        <BackButton href="/menu">Volver a Tempered</BackButton>
        <header className="mt-12 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Tempered / Utilidades</p>
          <h1 className="mt-4 wrap-break-word text-3xl uppercase tracking-widest text-white sm:text-5xl">Herramientas</h1>
          <p className="mt-5 text-sm leading-7 text-white/70">Utilidades puntuales para despejar y organizar tu día.</p>
        </header>
        <nav className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Menú de utilidades">
          {utilities.map((utility) => {
            const card = "flex min-h-48 min-w-0 flex-col border border-white/30 bg-[#121212] p-5 transition hover:border-white hover:bg-white/10 sm:p-6";
            const content = <><h2 className="wrap-break-word text-lg uppercase text-white">{utility.title}</h2><p className="mt-4 wrap-break-word text-sm leading-6 text-white/60">{utility.description}</p><span className="mt-auto pt-8 text-xs uppercase text-white/55">{utility.action}</span></>;
            return utility.action === "Abrir utilidad" ? <Link key={utility.href} href={utility.href} className={`${card} focus:outline-none focus:ring-2 focus:ring-white`}>{content}</Link> : <div key={utility.href} className={`${card} cursor-not-allowed opacity-60`}>{content}</div>;
          })}
        </nav>
      </section>
    </main>
  );
}
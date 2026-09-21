import Link from "next/link";

const applications = [
  {
    href: "/isorropia",
    name: "Isorropia Kairos",
    description: "Administración financiera",
    className: "border-[#ffa216]/50 bg-[#ffa216]/10 hover:bg-[#ffa216]/20",
  },
  {
    href: "#",
    name: "Grobit",
    description: "Hábitos, próximamente",
    className: "border-white/20 bg-black/20 opacity-80",
  },
];

export default function Main() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="flex min-h-[70vh] w-[90vw] max-w-5xl items-center justify-center rounded-3xl border border-white/25 bg-white/10 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-12">
        <div className="w-full max-w-4xl">
          <p className="text-center text-xs uppercase tracking-[0.16em] text-white/50">Panel de aplicaciones</p>
          <h1 className="font-display mt-5 text-center text-3xl uppercase tracking-widest text-[#adc0fa] sm:text-5xl">
            Tempered
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-center text-sm leading-6 text-white/65">
            Selecciona una aplicación para continuar.
          </p>

          <nav className="mt-12 grid gap-5 md:grid-cols-2" aria-label="Aplicaciones de Tempered">
            {applications.map((application) => {
              const content = (
                <>
                  <span className="block text-xl uppercase tracking-[0.06em] text-white sm:text-2xl">{application.name}</span>
                  <span className="mt-4 block text-sm text-white/60">{application.description}</span>
                  <span className="mt-10 block text-xs uppercase text-white/45">{application.href === "#" ? "Acceso próximamente" : "Abrir aplicación"}</span>
                </>
              );
              const className = `min-h-44 rounded-2xl border p-7 text-left transition ${application.className}`;

              return application.href === "#" ? (
                <div key={application.name} aria-disabled="true" className={className}>{content}</div>
              ) : (
                <Link key={application.name} href={application.href} className={`${className} focus:outline-none focus:ring-2 focus:ring-white/70`}>{content}</Link>
              );
            })}
          </nav>
        </div>
      </section>
    </main>
  );
}

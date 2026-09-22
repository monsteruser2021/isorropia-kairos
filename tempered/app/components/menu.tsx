import Link from "next/link";

const applications = [
  {
    href: "/isorropia",
    name: "Isorropia Kairos",
    description: "Administración financiera",
    className: "border-[#ddab36]/70 bg-linear-to-br from-[#ddab36]/80 via-[#ddab36]/25 to-[#121212] hover:from-[#ddab36] hover:via-[#ddab36]/35",
  },
  {
    href: "/grobit",
    name: "Grobit",
    description: "Seguimiento de hábitos",
    className: "border-[#066204]/70 bg-linear-to-br from-[#066204]/80 via-[#066204]/25 to-[#121212] hover:from-[#066204] hover:via-[#066204]/35",
  },
  {
    href: "/mawina",
    name: "Mawina Kairos",
    description: "Rutinas, próximamente",
    className: "border-[#620404]/70 bg-linear-to-br from-[#620404]/80 via-[#620404]/25 to-[#121212] hover:from-[#620404] hover:via-[#620404]/35",
  },
  {
    href: "/utilidades",
    name: "Utilidades",
    description: "Utilidades de Tempered",
    className: "border-white/70 bg-linear-to-br from-black via-black/90 to-white/10 hover:from-white/15 hover:via-black",
  },
];

export default function Main() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="flex min-h-[70vh] w-[calc(100%-2rem)] max-w-5xl items-center justify-center rounded-3xl border border-white/25 bg-white/10 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:w-[90vw] sm:p-12">
        <div className="w-full max-w-4xl min-w-0">
          <p className="text-center text-xs uppercase tracking-[0.16em] text-white/50">Panel de aplicaciones</p>
          <h1 className="font-display mt-5 text-center text-3xl uppercase tracking-widest text-[#adc0fa] sm:text-5xl">
            Tempered
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-center text-sm leading-6 text-white/65">
            Selecciona una aplicación para continuar.
          </p>

          <nav className="mt-12 grid min-w-0 gap-5 md:grid-cols-2 lg:grid-cols-4" aria-label="Aplicaciones de Tempered">
            {applications.map((application) => {
              const content = (
                <>
                  <span className="block max-w-full wrap-break-word text-md uppercase tracking-[0.04em] text-white sm:text-lg sm:tracking-[0.06em]">{application.name}</span>
                  <span className="mt-4 block max-w-full wrap-break-word text-sm text-white/60">{application.description}</span>
                  <span className="mt-10 block max-w-full wrap-break-word text-xs uppercase text-white/45">{application.href === "/mawina" ? "Vista previa" : "Abrir aplicación"}</span>
                </>
              );
              const className = `flex min-h-44 min-w-0 w-full max-w-full flex-col items-start rounded-2xl border p-5 text-left transition sm:p-6 ${application.className}`;

              return <Link key={application.name} href={application.href} className={`${className} focus:outline-none focus:ring-2 focus:ring-white/70`}>{content}</Link>;
            })}
          </nav>
        </div>
      </section>
    </main>
  );
}

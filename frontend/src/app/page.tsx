import { ProfileSearch } from "@/components/profile-search";

const capabilities = [
  {
    number: "01",
    title: "Perfil",
    description: "Identidad, biografía y enlaces públicos.",
  },
  {
    number: "02",
    title: "Impacto",
    description: "Repositorios, seguidores y comunidad.",
  },
  {
    number: "03",
    title: "Señales",
    description: "Datos claros para conocer su trabajo.",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070908] text-stone-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(190,255,130,0.12),transparent_28%),radial-gradient(circle_at_85%_65%,rgba(92,126,255,0.12),transparent_30%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:56px_56px]"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-7 lg:px-10">
        <a
          href="#inicio"
          className="group inline-flex items-center gap-3 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-300"
          aria-label="Volver al inicio"
        >
          <span className="grid size-10 place-items-center rounded-full border border-white/15 bg-white/5 text-xs font-bold tracking-tight text-lime-300 transition-colors group-hover:border-lime-300/50">
            GH
          </span>
          <span className="text-sm font-semibold tracking-[0.18em] text-white">
            PROFILE<span className="text-white/35">/</span>SCAN
          </span>
        </a>
        <span className="hidden items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-white/45 sm:flex">
          <span className="size-1.5 rounded-full bg-lime-300 shadow-[0_0_14px_3px_rgba(190,255,130,0.4)]" />
          GitHub public data
        </span>
      </header>

      <main
        id="inicio"
        className="relative z-10 mx-auto grid w-full max-w-7xl gap-16 px-6 pb-16 pt-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)] lg:px-10 lg:pb-24 lg:pt-24"
      >
        <section>
          <p className="mb-7 font-mono text-xs uppercase tracking-[0.25em] text-lime-300">
            Explora talento sin ruido
          </p>
          <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[0.95] tracking-[-0.055em] text-white sm:text-7xl lg:text-[5.6rem]">
            La historia detrás{" "}
            <span className="text-white/34">de cada commit.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-pretty text-base leading-7 text-white/58 sm:text-lg sm:leading-8">
            Escribe un usuario de GitHub y convierte sus datos públicos en una
            vista clara, rápida y fácil de explorar.
          </p>

          <div className="mt-10 max-w-2xl">
            <ProfileSearch />
          </div>
        </section>

        <aside className="self-end lg:pb-2" aria-label="Información disponible">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] p-2 shadow-2xl shadow-black/30 backdrop-blur">
            <div className="rounded-[1.55rem] border border-white/8 bg-[#0d100e]/85 px-6 py-7 sm:px-8 sm:py-9">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/35">
                  Vista estructurada
                </span>
                <span className="rounded-full border border-lime-300/25 bg-lime-300/8 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-lime-200">
                  Live API
                </span>
              </div>

              <div className="mt-8 divide-y divide-white/8">
                {capabilities.map((capability) => (
                  <div
                    key={capability.number}
                    className="grid grid-cols-[2.5rem_1fr] gap-3 py-5 first:pt-0 last:pb-0"
                  >
                    <span className="pt-1 font-mono text-xs text-lime-300/70">
                      {capability.number}
                    </span>
                    <div>
                      <h2 className="text-lg font-medium tracking-tight text-white">
                        {capability.title}
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-white/42">
                        {capability.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </main>

      <footer className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-3 border-t border-white/8 px-6 py-6 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <p>Datos públicos servidos de forma segura por nuestra API.</p>
        <p>Next.js · NestJS · GitHub REST API</p>
      </footer>
    </div>
  );
}

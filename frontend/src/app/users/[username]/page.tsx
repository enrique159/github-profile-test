import type { Metadata } from "next";
import Link from "next/link";

import { ProfileOverview } from "@/components/profile-overview";
import { ProfileSearch } from "@/components/profile-search";

interface UserPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: UserPageProps): Promise<Metadata> {
  const { username } = await params;

  return {
    title: `@${username} · Profile/Scan`,
    description: `Perfil público enriquecido de @${username} en GitHub.`,
  };
}

export default async function UserPage({ params }: UserPageProps) {
  const { username } = await params;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070908] text-stone-100">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_8%_5%,rgba(190,255,130,0.1),transparent_28%),radial-gradient(circle_at_90%_42%,rgba(92,126,255,0.1),transparent_34%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:56px_56px]"
      />

      <header className="relative z-10 border-b border-white/8 bg-[#070908]/72 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-4 px-5 py-4 sm:px-7 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <Link
            href="/"
            className="group inline-flex w-fit items-center gap-3 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-300"
            aria-label="Volver al inicio"
          >
            <span className="grid size-9 place-items-center rounded-full border border-white/15 bg-white/5 text-[0.65rem] font-bold tracking-tight text-lime-300 transition-colors group-hover:border-lime-300/50">
              GH
            </span>
            <span className="text-xs font-semibold tracking-[0.18em] text-white">
              PROFILE<span className="text-white/35">/</span>SCAN
            </span>
          </Link>

          <div className="w-full lg:max-w-md">
            <ProfileSearch initialUsername={username} compact />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[90rem] px-5 py-7 sm:px-7 lg:px-10 lg:py-10">
        <ProfileOverview key={username} username={username} />
      </main>

      <footer className="relative z-10 mx-auto flex w-full max-w-[90rem] flex-col gap-2 border-t border-white/8 px-5 py-6 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between sm:px-7 lg:px-10">
        <p>Vista generada con datos públicos de GitHub.</p>
        <p>Sin persistencia · Actualizada en cada consulta</p>
      </footer>
    </div>
  );
}

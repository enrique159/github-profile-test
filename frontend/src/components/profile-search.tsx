"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";

import {
  GitHubApiError,
  getGitHubProfile,
  type GitHubProfile,
} from "@/lib/github-api";

const numberFormatter = new Intl.NumberFormat("es-MX", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function ProfileSearch() {
  const [profile, setProfile] = useState<GitHubProfile | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "").trim();

    setError("");
    setProfile(null);
    setIsLoading(true);

    try {
      setProfile(await getGitHubProfile(username));
    } catch (requestError) {
      setError(
        requestError instanceof GitHubApiError
          ? requestError.message
          : "No pudimos consultar el perfil. Inténtalo de nuevo.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-[1.35rem] border border-white/12 bg-white/[0.06] p-2 shadow-xl shadow-black/20 backdrop-blur sm:flex-row"
        aria-label="Buscar un perfil de GitHub"
      >
        <label className="sr-only" htmlFor="github-username">
          Usuario de GitHub
        </label>
        <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
          <span className="select-none font-mono text-lg text-white/30">@</span>
          <input
            id="github-username"
            name="username"
            type="text"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck="false"
            maxLength={39}
            pattern="[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}"
            placeholder="octocat"
            required
            className="h-14 min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/28"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="h-14 shrink-0 rounded-2xl bg-lime-300 px-7 text-sm font-bold text-[#0b1008] transition hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-200 disabled:cursor-wait disabled:opacity-70"
        >
          {isLoading ? "Buscando…" : "Explorar perfil"}
        </button>
      </form>

      <div aria-live="polite" aria-busy={isLoading} className="mt-4">
        {error ? (
          <p
            role="alert"
            className="rounded-2xl border border-red-300/20 bg-red-300/8 px-4 py-3 text-sm text-red-100"
          >
            {error}
          </p>
        ) : null}

        {profile ? <ProfileResult profile={profile} /> : null}
      </div>
    </div>
  );
}

function ProfileResult({ profile }: { profile: GitHubProfile }) {
  return (
    <article className="rounded-[1.5rem] border border-white/12 bg-[#101310]/95 p-5 shadow-2xl shadow-black/30 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <Image
          src={profile.avatarUrl}
          alt={`Avatar de ${profile.name ?? profile.login}`}
          width={88}
          height={88}
          className="size-20 rounded-2xl bg-white/5 object-cover ring-1 ring-white/15 sm:size-[5.5rem]"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="truncate text-2xl font-semibold tracking-tight text-white">
                {profile.name ?? profile.login}
              </h2>
              <p className="mt-0.5 font-mono text-sm text-lime-300/80">
                @{profile.login}
              </p>
            </div>
            <a
              href={profile.htmlUrl}
              target="_blank"
              rel="noreferrer"
              className="w-fit rounded-full border border-white/12 px-3.5 py-2 text-xs font-semibold text-white/70 transition hover:border-white/25 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
            >
              Ver en GitHub ↗
            </a>
          </div>
          {profile.bio ? (
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/55">
              {profile.bio}
            </p>
          ) : null}
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-2 border-t border-white/8 pt-5">
        <Metric label="Repos" value={profile.publicRepos} />
        <Metric label="Seguidores" value={profile.followers} />
        <Metric label="Siguiendo" value={profile.following} />
      </dl>

      {profile.location || profile.company ? (
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/42">
          {profile.location ? <span>Ubicación: {profile.location}</span> : null}
          {profile.company ? <span>Compañía: {profile.company}</span> : null}
        </div>
      ) : null}
    </article>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-white/35">
        {label}
      </dt>
      <dd className="mt-1 text-xl font-semibold text-white">
        {numberFormatter.format(value)}
      </dd>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

const USERNAME_PATTERN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

interface ProfileSearchProps {
  initialUsername?: string;
  compact?: boolean;
}

export function ProfileSearch({
  initialUsername = "",
  compact = false,
}: ProfileSearchProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isNavigating, startNavigation] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "").trim();

    if (!USERNAME_PATTERN.test(username)) {
      setError("Escribe un nombre de usuario de GitHub válido.");
      return;
    }

    setError("");
    startNavigation(() => {
      router.push(`/users/${encodeURIComponent(username)}`);
    });
  }

  return (
    <div className={compact ? "w-full" : undefined}>
      <form
        onSubmit={handleSubmit}
        className={
          compact
            ? "flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.055] p-1.5 shadow-lg shadow-black/20"
            : "flex flex-col gap-3 rounded-[1.35rem] border border-white/12 bg-white/[0.06] p-2 shadow-xl shadow-black/20 backdrop-blur sm:flex-row"
        }
        aria-label="Buscar un perfil de GitHub"
      >
        <label className="sr-only" htmlFor={`github-username-${compact}`}>
          Usuario de GitHub
        </label>
        <div
          className={
            compact
              ? "flex min-w-0 flex-1 items-center gap-2 px-2"
              : "flex min-w-0 flex-1 items-center gap-3 px-3"
          }
        >
          <span
            className={
              compact
                ? "select-none font-mono text-sm text-white/30"
                : "select-none font-mono text-lg text-white/30"
            }
          >
            @
          </span>
          <input
            id={`github-username-${compact}`}
            name="username"
            type="text"
            key={initialUsername}
            defaultValue={initialUsername}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck="false"
            maxLength={39}
            placeholder="octocat"
            required
            className={
              compact
                ? "h-10 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/28"
                : "h-14 min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/28"
            }
          />
        </div>
        <button
          type="submit"
          disabled={isNavigating}
          className={
            compact
              ? "h-10 shrink-0 rounded-xl bg-lime-300 px-4 text-xs font-bold text-[#0b1008] transition hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-200 disabled:cursor-wait disabled:opacity-70"
              : "h-14 shrink-0 rounded-2xl bg-lime-300 px-7 text-sm font-bold text-[#0b1008] transition hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-200 disabled:cursor-wait disabled:opacity-70"
          }
        >
          {isNavigating ? "Abriendo…" : compact ? "Buscar" : "Explorar perfil"}
        </button>
      </form>

      {error ? (
        <p
          role="alert"
          className="mt-2 rounded-xl border border-red-300/20 bg-red-300/8 px-3 py-2 text-xs text-red-100"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

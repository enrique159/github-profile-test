"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import {
  getGitHubProfile,
  GitHubApiError,
  type GitHubActivity,
  type GitHubProfile,
  type GitHubRepository,
  type GitHubSectionStatus,
} from "@/lib/github-api";

const numberFormatter = new Intl.NumberFormat("es-MX", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const relativeFormatter = new Intl.RelativeTimeFormat("es", {
  numeric: "auto",
});

const languageColors = [
  "bg-lime-300",
  "bg-violet-400",
  "bg-cyan-400",
  "bg-amber-300",
  "bg-rose-400",
];

interface ProfileOverviewProps {
  username: string;
}

interface RequestState {
  profile: GitHubProfile | null;
  error: GitHubApiError | null;
  loading: boolean;
}

export function ProfileOverview({ username }: ProfileOverviewProps) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<RequestState>({
    profile: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    const abortController = new AbortController();

    getGitHubProfile(username, abortController.signal)
      .then((profile) => {
        setState({ profile, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setState({
          profile: null,
          error:
            error instanceof GitHubApiError
              ? error
              : new GitHubApiError(
                  "No pudimos consultar el perfil. Inténtalo de nuevo.",
                ),
          loading: false,
        });
      });

    return () => abortController.abort();
  }, [attempt, username]);

  if (state.loading) {
    return <ProfileSkeleton />;
  }

  if (state.error) {
    return (
      <ProfileError
        error={state.error}
        username={username}
        onRetry={() => {
          setState({ profile: null, error: null, loading: true });
          setAttempt((current) => current + 1);
        }}
      />
    );
  }

  if (!state.profile) {
    return null;
  }

  return <ProfileContent profile={state.profile} />;
}

function ProfileContent({ profile }: { profile: GitHubProfile }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[19rem_minmax(0,1fr)] xl:gap-7">
      <aside className="lg:self-start">
        <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0d100e]/92 shadow-2xl shadow-black/25 lg:sticky lg:top-5">
          <div className="h-24 bg-[radial-gradient(circle_at_10%_30%,rgba(190,252,130,0.28),transparent_45%),linear-gradient(125deg,rgba(255,255,255,0.08),rgba(92,126,255,0.13))]" />
          <div className="-mt-12 px-5 pb-6">
            <Image
              src={profile.avatarUrl}
              alt={`Avatar de ${profile.name ?? profile.login}`}
              width={112}
              height={112}
              priority
              className="size-24 rounded-[1.5rem] border-4 border-[#0d100e] bg-white/5 object-cover shadow-xl sm:size-28"
            />

            <div className="mt-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold tracking-tight text-white">
                  {profile.name ?? profile.login}
                </h1>
                <p className="mt-0.5 truncate font-mono text-sm text-lime-300/75">
                  @{profile.login}
                </p>
              </div>
              {profile.hireable ? (
                <span className="shrink-0 rounded-full border border-lime-300/25 bg-lime-300/8 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-wider text-lime-200">
                  Disponible
                </span>
              ) : null}
            </div>

            {profile.bio ? (
              <p className="mt-4 text-sm leading-6 text-white/58">
                {profile.bio}
              </p>
            ) : (
              <p className="mt-4 text-sm italic text-white/32">
                Sin biografía pública.
              </p>
            )}

            <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/8">
              <Metric label="Repos" value={profile.publicRepos} />
              <Metric label="Gists" value={profile.publicGists} />
              <Metric label="Seguidores" value={profile.followers} />
              <Metric label="Siguiendo" value={profile.following} />
            </dl>

            <div className="mt-5 space-y-2.5 text-xs leading-5 text-white/48">
              {profile.location ? (
                <p>
                  <span className="mr-2 text-white/25">●</span>
                  {profile.location}
                </p>
              ) : null}
              {profile.company ? (
                <p>
                  <span className="mr-2 text-white/25">◆</span>
                  {profile.company}
                </p>
              ) : null}
              <p>
                <span className="mr-2 text-white/25">◷</span>
                En GitHub desde {dateFormatter.format(new Date(profile.createdAt))}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <ExternalLink href={profile.htmlUrl}>GitHub ↗</ExternalLink>
              {profile.blogUrl ? (
                <ExternalLink href={profile.blogUrl}>
                  {shortHost(profile.blogUrl)} ↗
                </ExternalLink>
              ) : null}
              {profile.twitterUsername ? (
                <ExternalLink
                  href={`https://x.com/${encodeURIComponent(profile.twitterUsername)}`}
                >
                  @{profile.twitterUsername} ↗
                </ExternalLink>
              ) : null}
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 space-y-5 xl:space-y-7">
        <Languages profile={profile} />
        <Repositories profile={profile} />
        <div className="grid gap-5 xl:grid-cols-[minmax(15rem,0.75fr)_minmax(20rem,1.25fr)] xl:gap-7">
          <Organizations profile={profile} />
          <ActivityTimeline profile={profile} />
        </div>
      </div>
    </div>
  );
}

function Languages({ profile }: { profile: GitHubProfile }) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 sm:p-6">
      <SectionHeading
        eyebrow="Stack visible"
        title="Tecnologías principales"
        description="Lenguajes primarios en repositorios públicos elegibles."
      />
      <SectionNotice status={profile.sections.repositories} />

      {profile.topLanguages.length ? (
        <div className="mt-5 flex flex-wrap gap-2.5">
          {profile.topLanguages.map((language, index) => (
            <div
              key={language.name}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-black/15 px-3 py-2"
            >
              <span
                className={`size-2 rounded-full ${languageColors[index] ?? "bg-white/50"}`}
              />
              <span className="text-sm font-medium text-white/82">
                {language.name}
              </span>
              <span className="font-mono text-[0.65rem] text-white/35">
                {language.repositoryCount}
              </span>
            </div>
          ))}
        </div>
      ) : profile.sections.repositories === "ok" ? (
        <EmptyState text="No hay lenguajes públicos para destacar." />
      ) : null}
    </section>
  );
}

function Repositories({ profile }: { profile: GitHubProfile }) {
  return (
    <section>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          eyebrow="Selección por impacto"
          title="Repositorios destacados"
          description="Balance entre estrellas, forks y actividad reciente."
        />
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-white/28">
          Top {profile.repositories.length}/6
        </span>
      </div>
      <SectionNotice status={profile.sections.repositories} />

      {profile.repositories.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {profile.repositories.map((repository, index) => (
            <RepositoryCard
              key={repository.id}
              repository={repository}
              index={index}
            />
          ))}
        </div>
      ) : profile.sections.repositories === "ok" ? (
        <div className="rounded-[1.5rem] border border-dashed border-white/12 bg-white/[0.025] p-6">
          <EmptyState text="Este perfil no tiene repositorios elegibles para destacar." />
        </div>
      ) : null}
    </section>
  );
}

function RepositoryCard({
  repository,
  index,
}: {
  repository: GitHubRepository;
  index: number;
}) {
  return (
    <article className="group flex min-h-56 flex-col rounded-[1.4rem] border border-white/10 bg-[#0d100e]/85 p-5 transition hover:-translate-y-0.5 hover:border-lime-300/22 hover:bg-[#101410]">
      <div className="flex items-start justify-between gap-4">
        <span className="font-mono text-[0.62rem] text-white/25">
          0{index + 1}
        </span>
        <div className="flex gap-3 font-mono text-[0.68rem] text-white/42">
          <span title="Estrellas">★ {numberFormatter.format(repository.stars)}</span>
          <span title="Forks">⑂ {numberFormatter.format(repository.forks)}</span>
        </div>
      </div>

      <h3 className="mt-5 min-w-0 text-lg font-semibold tracking-tight">
        <a
          href={repository.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="break-words text-white transition group-hover:text-lime-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-300"
        >
          {repository.name} ↗
        </a>
      </h3>
      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-white/46">
        {repository.description ?? "Repositorio público sin descripción."}
      </p>

      {repository.topics.length ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {repository.topics.slice(0, 3).map((topic) => (
            <span
              key={topic}
              className="rounded-full bg-white/[0.055] px-2 py-1 font-mono text-[0.6rem] text-white/38"
            >
              {topic}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/7 pt-3 font-mono text-[0.62rem] text-white/32">
        {repository.language ? <span>{repository.language}</span> : null}
        {repository.license ? <span>{repository.license}</span> : null}
        <span>Activo {formatRelativeDate(repository.pushedAt)}</span>
        {repository.homepageUrl ? (
          <a
            href={repository.homepageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-lime-300/60 hover:text-lime-200"
          >
            Demo ↗
          </a>
        ) : null}
      </div>
    </article>
  );
}

function Organizations({ profile }: { profile: GitHubProfile }) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
      <SectionHeading eyebrow="Comunidad" title="Organizaciones" />
      <SectionNotice status={profile.sections.organizations} />

      {profile.organizations.length ? (
        <div className="mt-5 space-y-3">
          {profile.organizations.map((organization) => (
            <a
              key={organization.id}
              href={organization.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-2xl border border-white/8 bg-black/10 p-3 transition hover:border-white/18 hover:bg-white/[0.035] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
            >
              <Image
                src={organization.avatarUrl}
                alt=""
                width={44}
                height={44}
                className="size-11 rounded-xl bg-white/5 object-cover"
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-white/82 group-hover:text-white">
                  {organization.login}
                </span>
                <span className="mt-0.5 line-clamp-1 block text-xs text-white/35">
                  {organization.description ?? "Organización pública"}
                </span>
              </span>
              <span className="ml-auto text-white/20 group-hover:text-lime-300">
                ↗
              </span>
            </a>
          ))}
        </div>
      ) : profile.sections.organizations === "ok" ? (
        <EmptyState text="No hay organizaciones públicas visibles." />
      ) : null}
    </section>
  );
}

function ActivityTimeline({ profile }: { profile: GitHubProfile }) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
      <SectionHeading
        eyebrow="Últimos movimientos"
        title="Actividad pública"
      />
      <SectionNotice status={profile.sections.activity} />

      {profile.activity.length ? (
        <ol className="mt-5 space-y-0">
          {profile.activity.map((activity, index) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              isLast={index === profile.activity.length - 1}
            />
          ))}
        </ol>
      ) : profile.sections.activity === "ok" ? (
        <EmptyState text="No hay actividad pública reciente compatible." />
      ) : null}
    </section>
  );
}

function ActivityItem({
  activity,
  isLast,
}: {
  activity: GitHubActivity;
  isLast: boolean;
}) {
  return (
    <li className="grid grid-cols-[1rem_1fr] gap-3">
      <div className="flex flex-col items-center">
        <span className="mt-1.5 size-2.5 rounded-full border-2 border-[#111512] bg-lime-300 shadow-[0_0_10px_rgba(190,252,130,0.35)]" />
        {!isLast ? <span className="h-full w-px bg-white/9" /> : null}
      </div>
      <div className={isLast ? "pb-0" : "pb-5"}>
        <p className="text-sm leading-5 text-white/68">
          {activityLabel(activity)}{" "}
          <a
            href={activity.repositoryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-white hover:text-lime-200"
          >
            {activity.repositoryName}
          </a>
        </p>
        <time
          dateTime={activity.createdAt}
          className="mt-1 block font-mono text-[0.62rem] text-white/28"
        >
          {formatRelativeDate(activity.createdAt)}
        </time>
      </div>
    </li>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-lime-300/62">
        {eyebrow}
      </p>
      <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-white sm:text-2xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-sm leading-6 text-white/38">{description}</p>
      ) : null}
    </div>
  );
}

function SectionNotice({ status }: { status: GitHubSectionStatus }) {
  if (status === "ok") {
    return null;
  }

  return (
    <p
      role="status"
      className="my-4 rounded-xl border border-amber-200/15 bg-amber-200/[0.055] px-3 py-2 text-xs leading-5 text-amber-100/72"
    >
      {status === "rateLimited"
        ? "GitHub limitó temporalmente esta sección. El resto del perfil sigue disponible."
        : "Esta sección no pudo cargarse. El resto del perfil sigue disponible."}
    </p>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[#111512] px-3 py-3">
      <dt className="text-[0.58rem] uppercase tracking-[0.14em] text-white/30">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold text-white">
        {numberFormatter.format(value)}
      </dd>
    </div>
  );
}

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-full border border-white/10 px-3 py-1.5 text-[0.68rem] font-semibold text-white/55 transition hover:border-white/22 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
    >
      {children}
    </a>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="mt-5 text-sm italic text-white/32">{text}</p>;
}

function ProfileError({
  error,
  username,
  onRetry,
}: {
  error: GitHubApiError;
  username: string;
  onRetry: () => void;
}) {
  const isMissing = error.status === 404;
  const isRateLimited = error.status === 429;
  const eyebrow = isMissing
    ? "Perfil no encontrado"
    : isRateLimited
      ? "Límite temporal"
      : "Servicio no disponible";
  const title = isMissing
    ? `No encontramos a @${username}`
    : isRateLimited
      ? "GitHub necesita un respiro"
      : "No pudimos abrir este perfil";

  return (
    <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-white/[0.045] px-6 py-14 text-center shadow-2xl shadow-black/25 sm:px-12">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-white/12 bg-white/5 font-mono text-xl text-lime-300">
        {isMissing ? "404" : isRateLimited ? "429" : "!"}
      </span>
      <p className="mt-6 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-lime-300/65">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
        {title}
      </h1>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/48">
        {error.message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-7 rounded-2xl bg-lime-300 px-5 py-3 text-sm font-bold text-[#0b1008] transition hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-200"
      >
        Reintentar consulta
      </button>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div
      aria-label="Cargando perfil"
      aria-busy="true"
      className="grid animate-pulse gap-5 motion-reduce:animate-none lg:grid-cols-[19rem_minmax(0,1fr)] xl:gap-7"
    >
      <div className="h-[34rem] rounded-[1.75rem] border border-white/8 bg-white/[0.055]" />
      <div className="space-y-5 xl:space-y-7">
        <div className="h-40 rounded-[1.5rem] border border-white/8 bg-white/[0.05]" />
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-56 rounded-[1.4rem] border border-white/8 bg-white/[0.05]"
            />
          ))}
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="h-72 rounded-[1.5rem] border border-white/8 bg-white/[0.05]" />
          <div className="h-72 rounded-[1.5rem] border border-white/8 bg-white/[0.05]" />
        </div>
      </div>
    </div>
  );
}

function shortHost(value: string): string {
  return new URL(value).hostname.replace(/^www\./, "");
}

function formatRelativeDate(value: string): string {
  const differenceInDays = Math.round(
    (Date.parse(value) - Date.now()) / 86_400_000,
  );

  if (Math.abs(differenceInDays) < 31) {
    return relativeFormatter.format(differenceInDays, "day");
  }

  const differenceInMonths = Math.round(differenceInDays / 30);
  if (Math.abs(differenceInMonths) < 12) {
    return relativeFormatter.format(differenceInMonths, "month");
  }

  return dateFormatter.format(new Date(value));
}

function activityLabel(activity: GitHubActivity): string {
  const labels: Record<GitHubActivity["type"], string> = {
    push: "Publicó cambios en",
    pullRequest: "Actualizó un pull request en",
    issue: "Participó en un issue de",
    create: "Creó contenido en",
    star: "Marcó con estrella",
    fork: "Creó un fork de",
    release: "Publicó una versión en",
  };

  return labels[activity.type];
}

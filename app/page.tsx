import Generator from "@/components/Generator";
import ThemeToggle from "@/components/ThemeToggle";
import { SPONSOR, isSponsorEnabled } from "@/config/sponsor";

export default function Home() {
  const sponsor = isSponsorEnabled() ? SPONSOR : null;
  return (
    <main className="flex min-h-dvh flex-col items-center px-5 pb-10 pt-6 [background:var(--page-glow)]">
      <div className="flex w-full max-w-xl items-center justify-end">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-xl">
        <header className="mb-9 text-center">
          <div className="relative mx-auto mb-4 w-fit">
            <span className="absolute inset-0 -z-10 rounded-2xl bg-brand/40 blur-2xl" aria-hidden="true" />
            <img
              className="block h-16 w-16 rounded-2xl shadow-[0_10px_30px_-10px_rgba(246,130,31,0.55)]"
              src="/icon.svg"
              alt=""
              width={64}
              height={64}
            />
          </div>
          <p className="mb-2.5 font-mono text-xs font-medium uppercase tracking-[0.14em] text-brand">
            Cloudflare WARP
          </p>
          <h1 className="text-balance text-[34px] font-extrabold leading-[1.08] tracking-tight text-ink sm:text-[40px]">
            WARP Config RU
          </h1>
          <p className="mx-auto mt-3 max-w-md text-pretty text-[15px] leading-relaxed text-body">
            Обход блокировок — бесплатно и без своих серверов. Рабочий конфиг
            Cloudflare WARP (AmneziaWG или Clash) за пару секунд.
          </p>
        </header>

        <Generator sponsor={sponsor} />
      </div>

      <footer className="mt-auto flex flex-col items-center gap-3 pt-14">
        <a
          className="inline-flex items-center justify-center text-mute transition-colors hover:text-ink hover:-translate-y-px"
          href="https://github.com/AppsGanin/warp-config-ru"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Открыть проект на GitHub"
        >
          <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.62 7.62 0 014 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </a>
      </footer>
    </main>
  );
}

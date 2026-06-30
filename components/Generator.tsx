"use client";

import { useRef, useState } from "react";
import type {
  ApiResponse,
  ClashDevice,
  ConfigFormat,
  DnsId,
  EndpointId,
  GenerateResult,
} from "@/types";
import { DNS_PROVIDERS } from "@/config/dns";
import { ENDPOINTS } from "@/config/endpoints";
import { CLASH_DEVICES } from "@/config/clash-templates";
import type { Sponsor } from "@/config/sponsor";

const FORMAT_OPTIONS: readonly { value: ConfigFormat; label: string }[] = [
  { value: "amneziawg", label: "Amnezia" },
  { value: "clash", label: "Clash" },
];
const DNS_OPTIONS = DNS_PROVIDERS.map((p) => ({ value: p.id, label: p.label }));
const ENDPOINT_OPTIONS = ENDPOINTS.map((e) => ({ value: e.id, label: e.label }));
const DEVICE_OPTIONS = CLASH_DEVICES.map((d) => ({ value: d.id, label: d.label }));

type Guide = { app: string; url: string; steps: string[] };

const AMNEZIA_GUIDE: Guide = {
  app: "AmneziaVPN",
  url: "https://amnezia.org/ru/downloads",
  steps: [
    "Установите AmneziaVPN — обычные WireGuard-клиенты не поддерживают awg-обфускацию.",
    "Откройте приложение → «+» → «У меня есть данные для подключения».",
    "Импортируйте скачанный файл .conf (или вставьте текст конфига).",
    "Выберите протокол AmneziaWG и нажмите «Подключиться».",
  ],
};

const CLASH_GUIDE: Record<ClashDevice, Guide> = {
  computer: {
    app: "Mihomo Party",
    url: "https://github.com/mihomo-party-org/mihomo-party/releases",
    steps: [
      "Установите Mihomo Party (Windows / macOS / Linux) — есть английский интерфейс.",
      "Subscriptions → Import → «Local File» → выберите скачанный .yaml (или перетащите).",
      "Кликните по профилю, чтобы активировать его.",
      "Включите TUN Mode и/или системный прокси.",
    ],
  },
  mobile: {
    app: "FlClash",
    url: "https://github.com/chen08209/FlClash/releases",
    steps: [
      "Android: поставьте FlClash или Clash Meta for Android. iOS: Stash или Shadowrocket (платные).",
      "Откройте приложение → Профили → «+» → импорт из файла.",
      "Выберите скачанный .yaml (или «Поделиться» файлом в приложение).",
      "Активируйте профиль и нажмите «Подключить».",
    ],
  },
  router: {
    app: "Nikki",
    url: "https://github.com/nikkinikki-org/OpenWrt-nikki",
    steps: [
      "На роутере с OpenWrt установите Nikki (luci-app-nikki, ядро mihomo) — английский интерфейс.",
      "LuCI → Services → Nikki → Profiles → загрузите скачанный .yaml.",
      "Выберите его активным профилем и сохраните (Save & Apply).",
      "Включите Nikki (Enable) на вкладке Status.",
    ],
  },
};

const LINK_CLASS =
  "mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-brand transition-colors hover:text-brand-hover";

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-2 block text-sm font-semibold text-ink">{label}</legend>
      <div className="flex w-full flex-wrap gap-1 rounded-full border border-hairline bg-surface-soft p-1">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.value)}
              className={[
                "min-w-0 flex-1 cursor-pointer truncate rounded-full px-4 py-2 text-sm font-medium leading-none transition-colors",
                active
                  ? "bg-surface text-ink shadow-sm ring-1 ring-brand/40"
                  : "text-body hover:text-ink",
              ].join(" ")}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function ImportGuide({
  format,
  device,
  divider = false,
}: {
  format: ConfigFormat;
  device: ClashDevice;
  divider?: boolean;
}) {
  const g = format === "amneziawg" ? AMNEZIA_GUIDE : CLASH_GUIDE[device];
  return (
    <section className={divider ? "mt-5 border-t border-hairline pt-5" : ""}>
      <h3 className="mb-2.5 text-sm font-semibold text-ink">Как подключить</h3>
      <ol className="m-0 flex list-decimal flex-col gap-1.5 pl-5 text-[13.5px] leading-relaxed text-body marker:tabular-nums marker:text-mute">
        {g.steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      <a className={LINK_CLASS} href={g.url} target="_blank" rel="noopener noreferrer">
        Скачать {g.app} ↗
      </a>
    </section>
  );
}

function SponsorBlock({
  sponsor,
  divider = false,
}: {
  sponsor: Sponsor;
  divider?: boolean;
}) {
  return (
    <aside className={divider ? "mt-5 border-t border-hairline pt-5" : ""}>
      <span className="mb-2 inline-block text-[10.5px] font-bold uppercase tracking-wider text-brand">
        {sponsor.title}
      </span>
      <p className="m-0 text-[13.5px] leading-relaxed text-body">{sponsor.text}</p>
      <a className={LINK_CLASS} href={sponsor.url} target="_blank" rel="noopener noreferrer">
        {sponsor.cta} ↗
      </a>
    </aside>
  );
}

export default function Generator({ sponsor }: { sponsor: Sponsor | null }) {
  const [format, setFormat] = useState<ConfigFormat>("amneziawg");
  const [dnsId, setDnsId] = useState<DnsId>("geohide");
  const [endpointId, setEndpointId] = useState<EndpointId>("default");
  const [device, setDevice] = useState<ClashDevice>("computer");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const dialogRef = useRef<HTMLDialogElement>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, dnsId, endpointId, device }),
      });
      const json = (await res.json()) as ApiResponse;
      if (!json.success) {
        setError(json.error);
        return;
      }
      setResult(json.data);
      setCopied(false);
      dialogRef.current?.showModal();
    } catch {
      setError("Не удалось связаться с сервером. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    dialogRef.current?.close();
  }

  function onBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) closeModal();
  }

  async function onCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.config);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Не удалось скопировать в буфер обмена.");
    }
  }

  function onDownload() {
    if (!result) return;
    const blob = new Blob([result.config], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const secondaryBtn =
    "inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-hairline-strong bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-soft";

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-5 rounded-2xl border border-hairline bg-surface p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_20px_44px_-26px_rgba(246,130,31,0.35)]"
      >
        <Segmented label="Формат" value={format} options={FORMAT_OPTIONS} onChange={setFormat} />

        {format === "amneziawg" && (
          <Segmented
            label="Эндпоинт"
            value={endpointId}
            options={ENDPOINT_OPTIONS}
            onChange={setEndpointId}
          />
        )}

        {format === "clash" && (
          <Segmented
            label="Устройство"
            value={device}
            options={DEVICE_OPTIONS}
            onChange={setDevice}
          />
        )}

        <Segmented label="DNS" value={dnsId} options={DNS_OPTIONS} onChange={setDnsId} />

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-on-brand shadow-[0_10px_24px_-10px_rgba(246,130,31,0.75)] transition-all hover:-translate-y-px hover:bg-brand-hover active:translate-y-0 disabled:cursor-not-allowed disabled:bg-surface-soft disabled:text-mute disabled:shadow-none"
        >
          {loading ? (
            <>
              <span
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:[animation-duration:1.5s]"
                aria-hidden="true"
              />
              Генерация…
            </>
          ) : (
            <>
              <svg
                className="flex-none"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Сгенерировать
            </>
          )}
        </button>
      </form>

      <div aria-live="polite">
        {error && (
          <p
            className="mt-4 rounded-xl border border-hairline bg-surface-soft px-4 py-3 text-sm text-body"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>

      {sponsor && (
        <div className="mt-4 rounded-2xl border border-hairline bg-surface-soft p-6">
          <SponsorBlock sponsor={sponsor} />
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-hairline bg-surface-soft p-6">
        <ImportGuide format={format} device={device} />
      </div>

      <dialog
        ref={dialogRef}
        className="m-auto max-h-[calc(100dvh-48px)] w-[calc(100vw-32px)] max-w-xl overflow-hidden rounded-2xl border border-hairline bg-surface p-0 text-body shadow-[0_24px_60px_-16px_rgba(0,0,0,0.45)] backdrop:bg-black/50"
        aria-labelledby="result-title"
        onClick={onBackdropClick}
        onClose={() => setCopied(false)}
      >
        {result && (
          <div className="flex max-h-[calc(100dvh-48px)] flex-col gap-4 overflow-y-auto p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="result-title" className="text-lg font-bold text-ink">
                  {result.format === "amneziawg" ? "AmneziaWG" : "Clash"}
                </h2>
                <span className="mt-1 block break-all font-mono text-xs text-mute">
                  {result.fileName}
                </span>
              </div>
              <button
                type="button"
                className="inline-flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-full border border-hairline-strong bg-surface text-[13px] text-ink transition-colors hover:bg-surface-soft"
                aria-label="Закрыть"
                onClick={closeModal}
              >
                ✕
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-hairline bg-canvas">
              <div className="flex items-center gap-2 border-b border-hairline px-4 py-3" aria-hidden="true">
                <span className="h-3 w-3 rounded-full bg-term-red" />
                <span className="h-3 w-3 rounded-full bg-term-yellow" />
                <span className="h-3 w-3 rounded-full bg-term-green" />
              </div>
              <pre className="m-0 max-h-[min(360px,52dvh)] overflow-auto p-4 font-mono text-[13px] leading-relaxed whitespace-pre text-ink [tab-size:2]">
                <code>{result.config}</code>
              </pre>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" className={secondaryBtn} onClick={onCopy}>
                {copied ? "Скопировано" : "Копировать"}
              </button>
              <button type="button" className={secondaryBtn} onClick={onDownload}>
                Скачать
              </button>
            </div>

            {sponsor && <SponsorBlock sponsor={sponsor} divider />}

            <ImportGuide format={result.format} device={device} divider />
          </div>
        )}
      </dialog>
    </>
  );
}

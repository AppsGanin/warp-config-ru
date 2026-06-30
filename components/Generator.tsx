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
    app: "Clash Verge Rev",
    url: "https://github.com/clash-verge-rev/clash-verge-rev/releases",
    steps: [
      "Установите Clash Verge Rev (Windows / macOS / Linux).",
      "Профили → «+» → тип «Локальный файл» → выберите скачанный .yaml (или перетащите).",
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
    app: "OpenClash",
    url: "https://github.com/vernesong/OpenClash",
    steps: [
      "На роутере с OpenWrt установите OpenClash (ядро mihomo).",
      "LuCI → Services → OpenClash → Config Manage → загрузите скачанный .yaml.",
      "Выберите его активным конфигом → Save & Apply.",
      "Запустите OpenClash (Enable).",
    ],
  },
};

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
    <fieldset className="field">
      <legend className="field-label">{label}</legend>
      <div className="segmented">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className="segment"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function ImportGuide({
  format,
  device,
}: {
  format: ConfigFormat;
  device: ClashDevice;
}) {
  const g = format === "amneziawg" ? AMNEZIA_GUIDE : CLASH_GUIDE[device];
  return (
    <section className="guide">
      <h3 className="guide-title">Как подключить</h3>
      <ol className="guide-steps">
        {g.steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      <a className="guide-link" href={g.url} target="_blank" rel="noopener noreferrer">
        Скачать {g.app} ↗
      </a>
    </section>
  );
}

function SponsorBlock({ sponsor }: { sponsor: Sponsor }) {
  return (
    <aside className="sponsor">
      <span className="sponsor-tag">{sponsor.title}</span>
      <p className="sponsor-text">{sponsor.text}</p>
      <a
        className="sponsor-cta"
        href={sponsor.url}
        target="_blank"
        rel="sponsored noopener noreferrer"
      >
        {sponsor.cta}
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

  return (
    <>
      <form onSubmit={onSubmit} className="card">
        <Segmented
          label="Формат"
          value={format}
          options={FORMAT_OPTIONS}
          onChange={setFormat}
        />

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

        <Segmented
          label="DNS"
          value={dnsId}
          options={DNS_OPTIONS}
          onChange={setDnsId}
        />

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Генерация…
            </>
          ) : (
            <>
              <svg
                className="btn-icon"
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
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </div>

      {sponsor && (
        <div className="guide-card sponsor-card">
          <SponsorBlock sponsor={sponsor} />
        </div>
      )}

      <div className="guide-card">
        <ImportGuide format={format} device={device} />
      </div>

      <dialog
        ref={dialogRef}
        className="modal"
        aria-labelledby="result-title"
        onClick={onBackdropClick}
        onClose={() => setCopied(false)}
      >
        {result && (
          <div className="modal-inner">
            <div className="modal-head">
              <div>
                <h2 id="result-title" className="result-title">
                  {result.format === "amneziawg" ? "AmneziaWG" : "Clash"}
                </h2>
                <span className="result-file">{result.fileName}</span>
              </div>
              <button
                type="button"
                className="modal-close"
                aria-label="Закрыть"
                onClick={closeModal}
              >
                ✕
              </button>
            </div>

            <div className="terminal">
              <div className="terminal-bar" aria-hidden="true">
                <span className="dot dot-r" />
                <span className="dot dot-y" />
                <span className="dot dot-g" />
              </div>
              <pre>
                <code>{result.config}</code>
              </pre>
            </div>

            <div className="actions">
              <button type="button" className="btn-secondary" onClick={onCopy}>
                {copied ? "Скопировано" : "Копировать"}
              </button>
              <button type="button" className="btn-secondary" onClick={onDownload}>
                Скачать
              </button>
            </div>

            {sponsor && <SponsorBlock sponsor={sponsor} />}

            <ImportGuide format={result.format} device={device} />
          </div>
        )}
      </dialog>
    </>
  );
}

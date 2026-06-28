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

const FORMAT_OPTIONS: readonly { value: ConfigFormat; label: string }[] = [
  { value: "amneziawg", label: "Amnezia" },
  { value: "clash", label: "Clash" },
];
const DNS_OPTIONS = DNS_PROVIDERS.map((p) => ({ value: p.id, label: p.label }));
const ENDPOINT_OPTIONS = ENDPOINTS.map((e) => ({ value: e.id, label: e.label }));
const DEVICE_OPTIONS = CLASH_DEVICES.map((d) => ({ value: d.id, label: d.label }));

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

export default function Generator() {
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
      <form onSubmit={onSubmit}>
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
            "Сгенерировать"
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
          </div>
        )}
      </dialog>
    </>
  );
}

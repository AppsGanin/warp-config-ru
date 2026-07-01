import type { ConfigMeta, GenerateResult } from "@/types";

// Client-side generation history, kept in localStorage and shared across
// components (the Generator writes it; the header HistoryButton reads it) via a
// custom window event plus the native cross-tab "storage" event.

export const HISTORY_KEY = "warp:history";
const HISTORY_MAX = 8;
const HISTORY_EVENT = "warp:history-updated";

export interface HistoryEntry {
  id: string;
  at: number;
  fileName: string;
  config: string;
  meta: ConfigMeta;
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveEntry(data: GenerateResult): void {
  const entry: HistoryEntry = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now()),
    at: Date.now(),
    fileName: data.fileName,
    config: data.config,
    meta: data.meta,
  };
  const next = [entry, ...loadHistory()].slice(0, HISTORY_MAX);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // storage full / unavailable — nothing to persist
  }
  window.dispatchEvent(new Event(HISTORY_EVENT));
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(HISTORY_EVENT));
}

/** Subscribe to history changes; returns an unsubscribe fn. */
export function onHistoryChange(cb: () => void): () => void {
  window.addEventListener(HISTORY_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(HISTORY_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function download(fileName: string, config: string): void {
  const blob = new Blob([config], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function copyConfig(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function summarize(meta: ConfigMeta): string {
  if (meta.format === "amneziawg") return `AmneziaWG · ${meta.endpoint ?? "—"}`;
  return `Clash · ${meta.device ?? "computer"}`;
}

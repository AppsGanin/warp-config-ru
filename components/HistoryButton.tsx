"use client";

import { useEffect, useRef, useState } from "react";
import {
  clearHistory,
  copyConfig,
  download,
  loadHistory,
  onHistoryChange,
  summarize,
  type HistoryEntry,
} from "@/lib/history";

export default function HistoryButton() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const refresh = () => setEntries(loadHistory());
    refresh();
    return onHistoryChange(refresh);
  }, []);

  function open() {
    setEntries(loadHistory());
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  function onBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) close();
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label="История конфигов"
        title="История конфигов"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-surface/70 text-body backdrop-blur transition-colors hover:border-hairline-strong hover:text-ink"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 3v5h5" />
          <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
          <path d="M12 7v5l3 2" />
        </svg>
        {entries.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-on-brand">
            {entries.length}
          </span>
        )}
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto max-h-[calc(100dvh-48px)] w-[calc(100vw-32px)] max-w-lg overflow-hidden rounded-2xl border border-hairline bg-surface p-0 text-body shadow-[0_24px_60px_-16px_rgba(0,0,0,0.45)] backdrop:bg-black/50"
        aria-labelledby="history-title"
        onClick={onBackdropClick}
      >
        <div className="flex max-h-[calc(100dvh-48px)] flex-col gap-4 overflow-y-auto p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="history-title" className="text-lg font-bold text-ink">
                История
              </h2>
              <span className="mt-1 block text-xs text-mute">Только в этом браузере</span>
            </div>
            <button
              type="button"
              className="inline-flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-full border border-hairline-strong bg-surface text-[13px] text-ink transition-colors hover:bg-surface-soft"
              aria-label="Закрыть"
              onClick={close}
            >
              ✕
            </button>
          </div>

          {entries.length === 0 ? (
            <p className="rounded-xl border border-hairline bg-surface-soft px-4 py-6 text-center text-sm text-mute">
              Пока пусто. Сгенерируйте конфиг — он появится здесь.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {entries.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-surface-soft px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="m-0 truncate text-[13px] font-medium text-ink">
                      {summarize(h.meta)}
                    </p>
                    <span className="font-mono text-xs text-mute">
                      {new Date(h.at).toLocaleString("ru-RU")}
                    </span>
                  </div>
                  <div className="flex flex-none gap-2">
                    <button
                      type="button"
                      onClick={() => copyConfig(h.config)}
                      className="cursor-pointer rounded-full border border-hairline-strong bg-surface px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-soft"
                    >
                      Копировать
                    </button>
                    <button
                      type="button"
                      onClick={() => download(h.fileName, h.config)}
                      className="cursor-pointer rounded-full border border-hairline-strong bg-surface px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-soft"
                    >
                      Скачать
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {entries.length > 0 && (
            <div className="flex items-center justify-between gap-3 border-t border-hairline pt-4">
              <p className="m-0 text-xs text-mute">
                Содержит приватные ключи — не на общем устройстве.
              </p>
              <button
                type="button"
                onClick={clearHistory}
                className="flex-none cursor-pointer text-[13px] font-medium text-mute transition-colors hover:text-ink"
              >
                Очистить
              </button>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}

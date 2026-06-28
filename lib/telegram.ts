import { generateConfig } from "./warp";
import { DNS_PROVIDERS } from "@/config/dns";
import { ENDPOINTS } from "@/config/endpoints";
import { CLASH_DEVICES } from "@/config/clash-templates";
import type { ClashDevice, ConfigFormat, DnsId, EndpointId } from "@/types";

// Shared Telegram-bot logic, used by both the webhook route (app/api/telegram)
// and the long-polling script (bot/index.ts). Reuses generateConfig as-is.
export const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
export const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

type Btn = { text: string; callback_data: string };
interface TgChat {
  id: number;
}
interface TgMessage {
  message_id: number;
  chat: TgChat;
  text?: string;
}
interface TgCallback {
  id: string;
  data?: string;
  message?: TgMessage;
}
export interface TgUpdate {
  update_id?: number;
  message?: TgMessage;
  callback_query?: TgCallback;
}

const kb = (rows: Btn[][]) => ({ inline_keyboard: rows });
const btn = (text: string, callback_data: string): Btn => ({ text, callback_data });

async function tg(method: string, body: unknown): Promise<void> {
  await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function answer(callbackId: string, text?: string): Promise<void> {
  await tg("answerCallbackQuery", { callback_query_id: callbackId, text });
}

async function edit(chatId: number, messageId: number, text: string, rows: Btn[][]): Promise<void> {
  await tg("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    reply_markup: rows.length ? kb(rows) : undefined,
  });
}

async function sendDocument(chatId: number, fileName: string, content: string, caption: string): Promise<void> {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("caption", caption);
  form.append("document", new Blob([content], { type: "text/plain" }), fileName);
  await fetch(`${API}/sendDocument`, { method: "POST", body: form });
}

const dnsRows = (prefix: string): Btn[][] =>
  DNS_PROVIDERS.map((p) => [btn(p.label, `${prefix}:${p.id}`)]);

function captionFor(format: ConfigFormat): string {
  return format === "amneziawg"
    ? "AmneziaWG (.conf) — импортируйте файл в AmneziaVPN (нужен клиент с поддержкой awg)."
    : "Clash (.yaml) — добавьте как профиль в Clash Verge Rev / FlClash / OpenClash.";
}

async function onMessage(m: TgMessage): Promise<void> {
  await tg("sendMessage", {
    chat_id: m.chat.id,
    text: "Сгенерирую рабочий конфиг Cloudflare WARP.\nВыберите формат:",
    reply_markup: kb([[btn("AmneziaWG", "f:amneziawg"), btn("Clash", "f:clash")]]),
  });
}

async function onCallback(cq: TgCallback): Promise<void> {
  const chatId = cq.message?.chat.id;
  const messageId = cq.message?.message_id;
  const data = cq.data;
  if (chatId === undefined || messageId === undefined || !data) {
    await answer(cq.id);
    return;
  }
  const [kind, p1, p2, p3] = data.split(":");

  if (kind === "f") {
    if (p1 === "amneziawg") {
      await edit(chatId, messageId, "Выберите эндпоинт:", ENDPOINTS.map((e) => [btn(e.label, `e:${e.id}`)]));
    } else {
      await edit(chatId, messageId, "Выберите устройство:", CLASH_DEVICES.map((d) => [btn(d.label, `d:${d.id}`)]));
    }
    await answer(cq.id);
    return;
  }

  if (kind === "e") {
    await edit(chatId, messageId, "Выберите DNS:", dnsRows(`g:amneziawg:${p1}`));
    await answer(cq.id);
    return;
  }

  if (kind === "d") {
    await edit(chatId, messageId, "Выберите DNS:", dnsRows(`g:clash:${p1}`));
    await answer(cq.id);
    return;
  }

  if (kind === "g") {
    await answer(cq.id, "Генерирую…");
    const format: ConfigFormat = p1 === "clash" ? "clash" : "amneziawg";
    const dnsId: DnsId = p3 === "xbox" ? "xbox" : "geohide";
    try {
      const result = await generateConfig({
        format,
        dnsId,
        endpointId: format === "amneziawg" ? ((p2 === "alt" ? "alt" : "default") as EndpointId) : undefined,
        device:
          format === "clash"
            ? ((p2 === "mobile" || p2 === "router" ? p2 : "computer") as ClashDevice)
            : undefined,
      });
      await edit(chatId, messageId, "Готово ✓", []);
      await sendDocument(chatId, result.fileName, result.config, captionFor(format));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Неизвестная ошибка";
      await edit(chatId, messageId, `Не получилось: ${msg}\nПопробуйте ещё раз — /start`, []);
    }
    return;
  }

  await answer(cq.id);
}

/** Route one Telegram update through the bot wizard. */
export async function handleUpdate(update: TgUpdate): Promise<void> {
  if (update.message?.text) await onMessage(update.message);
  else if (update.callback_query) await onCallback(update.callback_query);
}

/** Register a webhook (used by the GET self-setup in the route). */
export async function setWebhook(url: string): Promise<{ ok?: boolean; description?: string }> {
  const body: Record<string, unknown> = {
    url,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  };
  if (WEBHOOK_SECRET) body.secret_token = WEBHOOK_SECRET;
  const res = await fetch(`${API}/setWebhook`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

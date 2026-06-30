import { generateConfig } from "./warp";
import { DNS_PROVIDERS } from "@/config/dns";
import { ENDPOINTS } from "@/config/endpoints";
import { CLASH_DEVICES } from "@/config/clash-templates";
import { SPONSOR, isSponsorEnabled } from "@/config/sponsor";
import type { ClashDevice, ConfigFormat, DnsId, EndpointId } from "@/types";

// Shared Telegram-bot logic, used by the webhook route (app/api/telegram).
// Reuses generateConfig as-is; the UI is a small inline-keyboard wizard.
export const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
export const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

type Btn = { text: string; callback_data: string };
type Menu = { text: string; rows: Btn[][] };
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

const FORMAT = {
  amneziawg: { emoji: "⚡", label: "AmneziaWG" },
  clash: { emoji: "🧩", label: "Clash" },
} as const;
const DEVICE_EMOJI: Record<ClashDevice, string> = { computer: "💻", mobile: "📱", router: "🌐" };

const kb = (rows: Btn[][]) => ({ inline_keyboard: rows });
const btn = (text: string, callback_data: string): Btn => ({ text, callback_data });
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const endpointLabel = (id: string) => ENDPOINTS.find((e) => e.id === id)?.label ?? id;
const deviceLabel = (id: string) => CLASH_DEVICES.find((d) => d.id === id)?.label ?? id;
const dnsLabel = (id: string) => DNS_PROVIDERS.find((p) => p.id === id)?.label ?? id;

// ── Telegram API helpers ──────────────────────────────────────────────────
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

async function send(chatId: number, text: string, rows?: Btn[][]): Promise<void> {
  await tg("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: rows ? kb(rows) : undefined,
  });
}

async function edit(chatId: number, messageId: number, text: string, rows: Btn[][]): Promise<void> {
  await tg("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    reply_markup: rows.length ? kb(rows) : undefined,
  });
}

async function sendDocument(
  chatId: number,
  fileName: string,
  content: string,
  caption: string,
  rows?: Btn[][],
): Promise<void> {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("caption", caption);
  form.append("parse_mode", "HTML");
  if (rows) form.append("reply_markup", JSON.stringify(kb(rows)));
  form.append("document", new Blob([content], { type: "text/plain" }), fileName);
  await fetch(`${API}/sendDocument`, { method: "POST", body: form });
}

async function deleteMessage(chatId: number, messageId: number): Promise<void> {
  await tg("deleteMessage", { chat_id: chatId, message_id: messageId });
}

// ── Wizard menus ──────────────────────────────────────────────────────────
function formatMenu(): Menu {
  return {
    text:
      "👋 <b>WARP Config Generator</b>\n\n" +
      "Сгенерирую рабочий конфиг Cloudflare WARP со свежими ключами.\n\n" +
      "<b>Шаг 1 из 3</b> · Формат",
    rows: [[btn(`${FORMAT.amneziawg.emoji} AmneziaWG`, "f:amneziawg"), btn(`${FORMAT.clash.emoji} Clash`, "f:clash")]],
  };
}

function endpointMenu(): Menu {
  return {
    text: `${FORMAT.amneziawg.emoji} <b>AmneziaWG</b>\n\n<b>Шаг 2 из 3</b> · Эндпоинт`,
    rows: [...ENDPOINTS.map((e) => [btn(e.label, `e:${e.id}`)]), [btn("‹ Назад", "back:format")]],
  };
}

function deviceMenu(): Menu {
  return {
    text: `${FORMAT.clash.emoji} <b>Clash</b>\n\n<b>Шаг 2 из 3</b> · Устройство`,
    rows: [
      ...CLASH_DEVICES.map((d) => [btn(`${DEVICE_EMOJI[d.id]} ${d.label}`, `d:${d.id}`)]),
      [btn("‹ Назад", "back:format")],
    ],
  };
}

function dnsMenu(format: ConfigFormat, mid: string): Menu {
  const crumb =
    format === "amneziawg"
      ? `${FORMAT.amneziawg.emoji} <b>AmneziaWG</b> · ${endpointLabel(mid)}`
      : `${FORMAT.clash.emoji} <b>Clash</b> · ${DEVICE_EMOJI[mid as ClashDevice] ?? ""} ${deviceLabel(mid)}`;
  return {
    text: `${crumb}\n\n<b>Шаг 3 из 3</b> · DNS`,
    rows: [
      ...DNS_PROVIDERS.map((p) => [btn(p.label, `g:${format}:${mid}:${p.id}`)]),
      [btn("‹ Назад", `back:${format}`)],
    ],
  };
}

function summary(format: ConfigFormat, mid: string, dns: string): string {
  return format === "amneziawg"
    ? `${FORMAT.amneziawg.emoji} <b>AmneziaWG</b> · ${endpointLabel(mid)} · ${dnsLabel(dns)}`
    : `${FORMAT.clash.emoji} <b>Clash</b> · ${DEVICE_EMOJI[mid as ClashDevice] ?? ""} ${deviceLabel(mid)} · ${dnsLabel(dns)}`;
}

function captionFor(format: ConfigFormat): string {
  return format === "amneziawg"
    ? "📥 <b>Импорт:</b> откройте файл в AmneziaVPN (нужен клиент с поддержкой awg)."
    : "📥 <b>Импорт:</b> добавьте как профиль в Clash Verge Rev / FlClash / OpenClash.";
}

/** Спонсорская строка для подписи к файлу (пусто, если блок выключен). */
function sponsorLine(): string {
  if (!isSponsorEnabled()) return "";
  return `\n\n💎 <b>${esc(SPONSOR.title)}:</b> ${esc(SPONSOR.text)}\n<a href="${esc(SPONSOR.url)}">${esc(SPONSOR.cta)}</a>`;
}

// ── Handlers ──────────────────────────────────────────────────────────────
async function onMessage(m: TgMessage): Promise<void> {
  if (m.text === "/help") {
    await send(
      m.chat.id,
      "Я генерирую рабочие конфиги <b>Cloudflare WARP</b> со свежими ключами.\n\n" +
        "• <b>AmneziaWG</b> (.conf) — для AmneziaVPN\n" +
        "• <b>Clash</b> (.yaml) — для Clash Verge Rev / FlClash / OpenClash\n\n" +
        "Нажмите /start, чтобы начать.",
    );
    return;
  }
  const menu = formatMenu();
  await send(m.chat.id, menu.text, menu.rows);
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
  const show = (menu: Menu) => edit(chatId, messageId, menu.text, menu.rows);

  // "Ещё конфиг" обычно приходит с сообщения-файла (его текст editMessageText
  // не правит), поэтому начинаем заново новым сообщением.
  if (kind === "restart") {
    await answer(cq.id);
    const menu = formatMenu();
    await send(chatId, menu.text, menu.rows);
    return;
  }

  if (kind === "g") {
    await answer(cq.id);
    await edit(chatId, messageId, "⏳ Генерирую конфиг…", []);
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
      // Результат — одно сообщение: сам файл, со сводкой и подсказкой в подписи
      // и кнопкой «Ещё конфиг». Служебное «Генерирую…» удаляем.
      const caption = `✅ <b>Готово!</b>\n\n${summary(format, p2, p3)}\n\n${captionFor(format)}${sponsorLine()}`;
      await sendDocument(chatId, result.fileName, result.config, caption, [[btn("🔄 Ещё конфиг", "restart")]]);
      await deleteMessage(chatId, messageId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Неизвестная ошибка";
      await edit(chatId, messageId, `⚠️ Не получилось: ${esc(msg)}`, [[btn("🔄 Заново", "restart")]]);
    }
    return;
  }

  switch (kind) {
    case "back":
      await show(p1 === "amneziawg" ? endpointMenu() : p1 === "clash" ? deviceMenu() : formatMenu());
      break;
    case "f":
      await show(p1 === "amneziawg" ? endpointMenu() : deviceMenu());
      break;
    case "e":
      await show(dnsMenu("amneziawg", p1));
      break;
    case "d":
      await show(dnsMenu("clash", p1));
      break;
  }
  await answer(cq.id);
}

/** Route one Telegram update through the bot wizard. */
export async function handleUpdate(update: TgUpdate): Promise<void> {
  if (update.message?.text) await onMessage(update.message);
  else if (update.callback_query) await onCallback(update.callback_query);
}

/** Register the webhook (used by the GET self-setup). */
async function setWebhook(url: string): Promise<{ ok?: boolean; description?: string }> {
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

/** One-shot bot setup: command menu (/start, /help) + webhook. */
export async function registerBot(webhookUrl: string): Promise<{ ok?: boolean; description?: string }> {
  await tg("setMyCommands", {
    commands: [
      { command: "start", description: "Сгенерировать конфиг" },
      { command: "help", description: "Что это и как пользоваться" },
    ],
  });
  return setWebhook(webhookUrl);
}

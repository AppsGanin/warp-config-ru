import { NextResponse } from "next/server";
import {
  TELEGRAM_TOKEN,
  WEBHOOK_SECRET,
  handleUpdate,
  registerBot,
  type TgUpdate,
} from "@/lib/telegram";

// Webhook entry point. Optional — the bot also runs via long polling
// (bot/index.ts, `npm run bot`), which needs no public URL. Shared logic lives
// in lib/telegram.ts.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<NextResponse> {
  if (!TELEGRAM_TOKEN) {
    return NextResponse.json({ ok: false, error: "TELEGRAM_BOT_TOKEN не задан" }, { status: 500 });
  }
  if (WEBHOOK_SECRET && req.headers.get("x-telegram-bot-api-secret-token") !== WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: TgUpdate;
  try {
    update = (await req.json()) as TgUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    await handleUpdate(update);
  } catch (err) {
    // Always 200 so Telegram doesn't spam-retry; log for diagnostics.
    console.error("telegram webhook error:", err);
  }

  return NextResponse.json({ ok: true });
}

// One-shot self-setup: open once after deploy to register the webhook.
//   GET /api/telegram?token=<TELEGRAM_BOT_TOKEN>
export async function GET(req: Request): Promise<NextResponse> {
  if (!TELEGRAM_TOKEN) {
    return NextResponse.json({ ok: false, error: "TELEGRAM_BOT_TOKEN не задан" }, { status: 500 });
  }
  if (new URL(req.url).searchParams.get("token") !== TELEGRAM_TOKEN) {
    return NextResponse.json({ ok: false, error: "Добавьте ?token=<TELEGRAM_BOT_TOKEN>" }, { status: 401 });
  }

  const host = req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const data = await registerBot(`${proto}://${host}/api/telegram`);
  return NextResponse.json({ ok: data.ok === true, telegram: data });
}

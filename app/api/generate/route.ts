import { NextResponse } from "next/server";
import { generateConfig } from "@/lib/warp";
import type { ApiResponse, ClashDevice, DnsId, EndpointId } from "@/types";

// Registration calls Cloudflare per request and must never be cached; needs the
// Node runtime for node:crypto key generation.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<NextResponse<ApiResponse>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Некорректный запрос" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  if (b.format !== "amneziawg" && b.format !== "clash") {
    return NextResponse.json({ success: false, error: "Неизвестный формат" }, { status: 400 });
  }
  const format = b.format;
  const dnsId: DnsId = b.dnsId === "xbox" ? "xbox" : "geohide";
  const endpointId: EndpointId | undefined = b.endpointId === "alt" ? "alt" : "default";
  const device: ClashDevice | undefined =
    b.device === "mobile" || b.device === "router" ? b.device : "computer";

  try {
    const data = await generateConfig({ format, dnsId, endpointId, device });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("generate error:", err);
    const error = err instanceof Error ? err.message : "Неизвестная ошибка";
    return NextResponse.json({ success: false, error }, { status: 502 });
  }
}

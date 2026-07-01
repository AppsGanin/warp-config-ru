import { NextResponse } from "next/server";
import { generateConfig } from "@/lib/warp";
import { WARP_PORTS, DEFAULT_PORT } from "@/types";
import type { ApiResponse, ClashDevice, DnsId, WarpPort } from "@/types";
import { ENDPOINT_HOSTS, DEFAULT_HOST_ID } from "@/config/endpoints";

// Registration calls Cloudflare per request and must never be cached; needs the
// Node runtime for node:crypto key generation and node:net endpoint probing.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOST_IDS = new Set(ENDPOINT_HOSTS.map((h) => h.id));

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

  const endpointHostId =
    typeof b.endpointHostId === "string" && HOST_IDS.has(b.endpointHostId)
      ? b.endpointHostId
      : DEFAULT_HOST_ID;
  const port: WarpPort = WARP_PORTS.includes(b.port as WarpPort) ? (b.port as WarpPort) : DEFAULT_PORT;
  const ipv6 = b.ipv6 !== false;
  const device: ClashDevice | undefined =
    b.device === "mobile" || b.device === "router" ? b.device : "computer";

  try {
    const data = await generateConfig({
      format,
      dnsId,
      endpointHostId,
      port,
      ipv6,
      device,
    });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("generate error:", err);
    const error = err instanceof Error ? err.message : "Неизвестная ошибка";
    return NextResponse.json({ success: false, error }, { status: 502 });
  }
}

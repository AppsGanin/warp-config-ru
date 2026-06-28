const BASE_URL = "https://api.cloudflareclient.com/v0i1909051800";

const HEADERS = {
  "User-Agent": "okhttp/3.12.1",
  "Content-Type": "application/json",
} as const;

export interface WarpRegistration {
  /** Cloudflare's WARP peer public key. */
  peerPublicKey: string;
  /** Client interface IPv4 (always 172.16.0.2 for WARP). */
  clientIPv4: string;
  /** Client interface IPv6 assigned to this registration. */
  clientIPv6: string;
}

interface RegResponse {
  result?: { id?: string; token?: string };
}

interface WarpResponse {
  result?: {
    config?: {
      peers?: { public_key?: string }[];
      interface?: { addresses?: { v4?: string; v6?: string } };
    };
  };
}

/**
 * Registers a fresh WireGuard public key with the Cloudflare WARP API and
 * enables WARP, returning the peer key and assigned client addresses needed to
 * build a working config.
 */
export async function registerWarp(publicKey: string): Promise<WarpRegistration> {
  const reg = await fetch(`${BASE_URL}/reg`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      install_id: "",
      tos: new Date().toISOString(),
      key: publicKey,
      fcm_token: "",
      type: "ios",
      locale: "en_US",
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!reg.ok) throw new Error(`Регистрация не удалась: HTTP ${reg.status}`);

  const regData = (await reg.json()) as RegResponse;
  const id = regData.result?.id;
  const token = regData.result?.token;
  if (!id || !token) throw new Error("Некорректный ответ регистрации Cloudflare");

  const warp = await fetch(`${BASE_URL}/reg/${id}`, {
    method: "PATCH",
    headers: { ...HEADERS, Authorization: `Bearer ${token}` },
    body: JSON.stringify({ warp_enabled: true }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!warp.ok) throw new Error(`Активация WARP не удалась: HTTP ${warp.status}`);

  const warpData = (await warp.json()) as WarpResponse;
  const peer = warpData.result?.config?.peers?.[0];
  const iface = warpData.result?.config?.interface;
  if (!peer?.public_key || !iface?.addresses?.v4 || !iface.addresses.v6) {
    throw new Error("Некорректный ответ конфигурации WARP");
  }

  return {
    peerPublicKey: peer.public_key,
    clientIPv4: iface.addresses.v4,
    clientIPv6: iface.addresses.v6,
  };
}

import type { DnsId } from "@/types";
import { dnsList } from "@/config/dns";
import { pickI1 } from "@/lib/i1-masks";

const MTU = 1280;

export interface AmneziaWGParams {
  privateKey: string;
  peerPublicKey: string;
  clientIPv4: string;
  clientIPv6: string;
  dnsId: DnsId;
  endpoint: string;
  ipv6: boolean;
}

/**
 * Builds an AmneziaWG 1.5 (.conf) config for Cloudflare WARP. WARP is a standard
 * WireGuard server, so headers (H1–H4) and padding (S1/S2) stay at standard
 * values — only the junk (Jc) and I1 signature survive against it.
 */
export function buildAmneziaWG(p: AmneziaWGParams): string {
  const dns = dnsList(p.dnsId, p.ipv6).join(", ");
  const address = p.ipv6 ? `${p.clientIPv4}, ${p.clientIPv6}` : p.clientIPv4;
  const allowedIPs = p.ipv6 ? "0.0.0.0/0, ::/0" : "0.0.0.0/0";

  const iface = [
    "[Interface]",
    `PrivateKey = ${p.privateKey}`,
    `Address = ${address}`,
    `DNS = ${dns}`,
    `MTU = ${MTU}`,
    "S1 = 0",
    "S2 = 0",
    "Jc = 4",
    "Jmin = 40",
    "Jmax = 70",
    "H1 = 1",
    "H2 = 2",
    "H3 = 3",
    "H4 = 4",
    pickI1(),
  ].join("\n");

  const peer = [
    "[Peer]",
    `PublicKey = ${p.peerPublicKey}`,
    `AllowedIPs = ${allowedIPs}`,
    `Endpoint = ${p.endpoint}`,
    "PersistentKeepalive = 25",
  ].join("\n");

  return `${iface}\n\n${peer}\n`;
}

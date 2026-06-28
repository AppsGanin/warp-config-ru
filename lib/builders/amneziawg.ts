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
}

/**
 * Builds an AmneziaWG 1.5 (.conf) config. The awg1.5 obfuscation set is the
 * fixed junk/magic-header parameters plus a random `I1` QUIC-mimicry signature.
 */
export function buildAmneziaWG(p: AmneziaWGParams): string {
  const dns = dnsList(p.dnsId, true).join(", ");

  const iface = [
    "[Interface]",
    `PrivateKey = ${p.privateKey}`,
    `Address = ${p.clientIPv4}, ${p.clientIPv6}`,
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
    "AllowedIPs = 0.0.0.0/0, ::/0",
    `Endpoint = ${p.endpoint}`,
    "PersistentKeepalive = 25",
  ].join("\n");

  return `${iface}\n\n${peer}\n`;
}

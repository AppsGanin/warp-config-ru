import type { GenerateRequest, GenerateResult } from "@/types";
import { DEFAULT_PORT } from "@/types";
import { generateKeyPair } from "./crypto";
import { registerWarp } from "./cloudflare";
import { buildAmneziaWG } from "./builders/amneziawg";
import { buildClash } from "./builders/clash";
import { resolveEndpoint } from "./endpoint-resolver";
import { DEFAULT_HOST_ID } from "@/config/endpoints";
import { DEFAULT_CLASH_DEVICE } from "@/config/clash-templates";
import { getDnsProvider } from "@/config/dns";

/**
 * Full pipeline: generate keys -> register with Cloudflare WARP -> pick a
 * reachable endpoint -> build the config in the requested format.
 */
export async function generateConfig(req: GenerateRequest): Promise<GenerateResult> {
  const keyPair = generateKeyPair();
  const reg = await registerWarp(keyPair.publicKey);
  const dnsLabel = getDnsProvider(req.dnsId).label;

  if (req.format === "amneziawg") {
    const ipv6 = req.ipv6 ?? true;
    const port = req.port ?? DEFAULT_PORT;
    const resolved = await resolveEndpoint(req.endpointHostId ?? DEFAULT_HOST_ID, port);

    const config = buildAmneziaWG({
      privateKey: keyPair.privateKey,
      peerPublicKey: reg.peerPublicKey,
      clientIPv4: reg.clientIPv4,
      clientIPv6: reg.clientIPv6,
      dnsId: req.dnsId,
      endpoint: resolved.endpoint,
      ipv6,
    });

    return {
      config,
      fileName: `warp-awg-${stamp()}.conf`,
      format: "amneziawg",
      meta: {
        format: "amneziawg",
        endpoint: resolved.endpoint,
        endpointSource: resolved.source,
        port: resolved.port,
        ipv6,
        dnsLabel,
      },
    };
  }

  const device = req.device ?? DEFAULT_CLASH_DEVICE;
  const config = await buildClash({
    device,
    privateKey: keyPair.privateKey,
    clientIPv6: reg.clientIPv6,
    dnsId: req.dnsId,
  });
  return {
    config,
    fileName: `warp-clash-${device}.yaml`,
    format: "clash",
    meta: { format: "clash", dnsLabel, device },
  };
}

function stamp(): string {
  return Math.floor(Math.random() * 9_000_000 + 1_000_000).toString();
}

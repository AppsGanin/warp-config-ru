import type { GenerateRequest, GenerateResult } from "@/types";
import { generateKeyPair } from "./crypto";
import { registerWarp } from "./cloudflare";
import { buildAmneziaWG } from "./builders/amneziawg";
import { buildClash } from "./builders/clash";
import { getEndpoint } from "@/config/endpoints";
import { DEFAULT_CLASH_DEVICE } from "@/config/clash-templates";

/**
 * Full pipeline: generate keys -> register with Cloudflare WARP -> build the
 * config in the requested format.
 */
export async function generateConfig(req: GenerateRequest): Promise<GenerateResult> {
  const keyPair = generateKeyPair();
  const reg = await registerWarp(keyPair.publicKey);

  if (req.format === "amneziawg") {
    const config = buildAmneziaWG({
      privateKey: keyPair.privateKey,
      peerPublicKey: reg.peerPublicKey,
      clientIPv4: reg.clientIPv4,
      clientIPv6: reg.clientIPv6,
      dnsId: req.dnsId,
      endpoint: getEndpoint(req.endpointId),
    });
    return { config, fileName: `warp-awg-${stamp()}.conf`, format: "amneziawg" };
  }

  const device = req.device ?? DEFAULT_CLASH_DEVICE;
  const config = await buildClash({
    device,
    privateKey: keyPair.privateKey,
    clientIPv6: reg.clientIPv6,
    dnsId: req.dnsId,
  });
  return { config, fileName: `warp-clash-${device}.yaml`, format: "clash" };
}

function stamp(): string {
  return Math.floor(Math.random() * 9_000_000 + 1_000_000).toString();
}

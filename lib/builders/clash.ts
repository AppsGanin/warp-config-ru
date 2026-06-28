import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ClashDevice, DnsId } from "@/types";
import { dnsList } from "@/config/dns";
import { CLASH_TEMPLATE_FILES } from "@/config/clash-templates";

export interface ClashParams {
  device: ClashDevice;
  privateKey: string;
  clientIPv6: string;
  dnsId: DnsId;
}

/**
 * Builds a Clash config by reading the locally-vendored device template and
 * injecting the freshly registered credentials. The templates share one
 * `&warp-common` YAML anchor, so we substitute exactly three lines in it: the
 * private key, the WARP client IPv6, and the DNS servers.
 *
 * Templates live in `config/templates/`; they are force-bundled into the
 * serverless function via `outputFileTracingIncludes` in `next.config.mjs`.
 */
export async function buildClash(p: ClashParams): Promise<string> {
  const file = CLASH_TEMPLATE_FILES[p.device];
  const fullPath = path.join(process.cwd(), "config", "templates", file);

  let template: string;
  try {
    template = await readFile(fullPath, "utf8");
  } catch {
    throw new Error(`Не удалось прочитать шаблон Clash: ${file}`);
  }

  const dns = dnsList(p.dnsId, true).join(", ");

  return template
    .replace(/private-key:[^\n]*/, `private-key: ${p.privateKey}`)
    .replace(/ipv6:\s*2606:[0-9a-fA-F:]+/, `ipv6: ${p.clientIPv6}`)
    .replace(/dns:\s*\[[^\]]*\]/, `dns: [${dns}]`);
}

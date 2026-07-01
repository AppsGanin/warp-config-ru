import net from "node:net";
import type { EndpointSource, WarpPort } from "@/types";
import { DEFAULT_PORT } from "@/types";
import { ENDPOINT_HOSTS, IP_POOL, DEFAULT_HOST_ID } from "@/config/endpoints";

// Server-only endpoint resolution (uses node:net). Keep this out of any client
// component — config/endpoints.ts holds the pure data that the UI imports.

/**
 * TCP-connect probe. WARP data uses UDP, but these anycast IPs are Cloudflare
 * and answer on TCP 443, so a fast connect is a decent liveness signal for
 * "this range is reachable from our region". Returns latency ms or null.
 */
function tcpLatency(host: string, port: number, timeoutMs: number): Promise<number | null> {
  return new Promise((resolve) => {
    const started = Date.now();
    const socket = new net.Socket();
    const finish = (ok: boolean) => {
      socket.destroy();
      resolve(ok ? Date.now() - started : null);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
    socket.connect(port, host);
  });
}

/** Probe the IP pool in parallel; pick the fastest reachable, else fall back. */
async function pickReachableIp(): Promise<{ host: string; source: EndpointSource }> {
  const probes = await Promise.all(
    IP_POOL.map(async (h) => ({ host: h.host!, latency: await tcpLatency(h.host!, 443, 700) })),
  );
  const alive = probes.filter((p) => p.latency !== null).sort((a, b) => a.latency! - b.latency!);
  if (alive.length > 0) return { host: alive[0].host, source: "auto" };
  const random = IP_POOL[Math.floor(Math.random() * IP_POOL.length)];
  return { host: random.host!, source: "fallback" };
}

export interface ResolvedEndpoint {
  endpoint: string;
  port: WarpPort;
  source: EndpointSource;
}

/** Resolve a host id + port into a concrete `host:port` and its source. */
export async function resolveEndpoint(
  hostId: string = DEFAULT_HOST_ID,
  port: WarpPort = DEFAULT_PORT,
): Promise<ResolvedEndpoint> {
  const chosen = ENDPOINT_HOSTS.find((h) => h.id === hostId) ?? ENDPOINT_HOSTS[0];

  if (chosen.kind === "auto") {
    const { host, source } = await pickReachableIp();
    return { endpoint: `${host}:${port}`, port, source };
  }

  const source: EndpointSource = chosen.kind === "hostname" ? "hostname" : "manual-ip";
  return { endpoint: `${chosen.host}:${port}`, port, source };
}

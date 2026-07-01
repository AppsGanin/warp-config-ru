// Cloudflare WARP endpoint hosts (pure data — safe to import client-side).
// A hostname plus a spread of anycast IPs from several distinct /24 subnets: if
// one range is filtered by a provider, another still works. "auto" lets the
// server TCP-probe the pool and pick the fastest reachable one.
export interface EndpointHost {
  id: string;
  label: string;
  /** null for the "auto" pseudo-host. */
  host: string | null;
  kind: "auto" | "hostname" | "ip";
}

const HOSTNAME = "engage.cloudflareclient.com";

export const ENDPOINT_HOSTS: EndpointHost[] = [
  { id: "auto", label: "Авто", host: null, kind: "auto" },
  { id: "hostname", label: HOSTNAME, host: HOSTNAME, kind: "hostname" },
  { id: "ip-162-159-192-1", label: "162.159.192.1", host: "162.159.192.1", kind: "ip" },
  { id: "ip-162-159-193-1", label: "162.159.193.1", host: "162.159.193.1", kind: "ip" },
  { id: "ip-162-159-195-1", label: "162.159.195.1", host: "162.159.195.1", kind: "ip" },
  { id: "ip-188-114-96-1", label: "188.114.96.1", host: "188.114.96.1", kind: "ip" },
  { id: "ip-188-114-97-1", label: "188.114.97.1", host: "188.114.97.1", kind: "ip" },
  { id: "ip-188-114-99-1", label: "188.114.99.1", host: "188.114.99.1", kind: "ip" },
];

export const IP_POOL = ENDPOINT_HOSTS.filter((h) => h.kind === "ip");
export const DEFAULT_HOST_ID = "auto";

export function endpointLabel(id: string): string {
  return ENDPOINT_HOSTS.find((h) => h.id === id)?.label ?? id;
}

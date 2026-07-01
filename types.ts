export type ConfigFormat = "amneziawg" | "clash";
export type DnsId = "geohide" | "xbox";
export type ClashDevice = "computer" | "mobile" | "router";

/** UDP ports Cloudflare WARP is known to accept. */
export const WARP_PORTS = [4500, 2408, 500, 1701, 880, 8854] as const;
export type WarpPort = (typeof WARP_PORTS)[number];
export const DEFAULT_PORT: WarpPort = 4500;

/** How the endpoint host in the final config was chosen. */
export type EndpointSource = "auto" | "manual-ip" | "hostname" | "fallback";

export interface GenerateRequest {
  format: ConfigFormat;
  dnsId: DnsId;
  /** AmneziaWG only — id from config/endpoints ENDPOINT_HOSTS. */
  endpointHostId?: string;
  /** AmneziaWG only. */
  port?: WarpPort;
  /** AmneziaWG only — include IPv6 address/route/DNS. */
  ipv6?: boolean;
  /** Clash only. */
  device?: ClashDevice;
}

/** Diagnostics surfaced in the result modal and stored in history. */
export interface ConfigMeta {
  format: ConfigFormat;
  /** host:port that landed in the config. */
  endpoint?: string;
  endpointSource?: EndpointSource;
  port?: number;
  ipv6?: boolean;
  dnsLabel: string;
  device?: ClashDevice;
}

export interface GenerateResult {
  config: string;
  fileName: string;
  format: ConfigFormat;
  meta: ConfigMeta;
}

export type ApiResponse =
  | { success: true; data: GenerateResult }
  | { success: false; error: string };

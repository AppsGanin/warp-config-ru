export type ConfigFormat = "amneziawg" | "clash";
export type DnsId = "geohide" | "xbox";
export type EndpointId = "default" | "alt";
export type ClashDevice = "computer" | "mobile" | "router";

export interface GenerateRequest {
  format: ConfigFormat;
  dnsId: DnsId;
  /** Only used when format === "amneziawg". */
  endpointId?: EndpointId;
  /** Only used when format === "clash". */
  device?: ClashDevice;
}

export interface GenerateResult {
  config: string;
  fileName: string;
  format: ConfigFormat;
}

export type ApiResponse =
  | { success: true; data: GenerateResult }
  | { success: false; error: string };

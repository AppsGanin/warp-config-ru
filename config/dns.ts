import type { DnsId } from "@/types";

export interface DnsProvider {
  id: DnsId;
  label: string;
  ipv4: string[];
  ipv6: string[];
}

export const DNS_PROVIDERS: DnsProvider[] = [
  {
    id: "geohide",
    label: "dns.geohide.ru",
    ipv4: ["45.155.204.190", "37.230.192.51"],
    ipv6: [],
  },
  {
    id: "xbox",
    label: "xbox-dns.ru",
    ipv4: ["111.88.96.50", "111.88.96.51"],
    ipv6: ["2a00:ab00:1233:26::50", "2a00:ab00:1233:26::51"],
  },
];

export const DEFAULT_DNS_ID: DnsId = "geohide";

export function getDnsProvider(id: DnsId): DnsProvider {
  return DNS_PROVIDERS.find((p) => p.id === id) ?? DNS_PROVIDERS[0];
}

/** Returns the list of DNS server IPs for a provider. */
export function dnsList(id: DnsId, includeIPv6 = true): string[] {
  const p = getDnsProvider(id);
  return includeIPv6 ? [...p.ipv4, ...p.ipv6] : p.ipv4;
}

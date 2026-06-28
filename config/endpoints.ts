import type { EndpointId } from "@/types";

export interface EndpointOption {
  id: EndpointId;
  label: string;
  value: string;
}

export const ENDPOINTS: EndpointOption[] = [
  { id: "default", label: "162.159.195.1:500", value: "162.159.195.1:500" },
  {
    id: "alt",
    label: "engage.cloudflareclient.com:2408",
    value: "engage.cloudflareclient.com:2408",
  },
];

export const DEFAULT_ENDPOINT_ID: EndpointId = "default";

export function getEndpoint(id: EndpointId = DEFAULT_ENDPOINT_ID): string {
  return ENDPOINTS.find((e) => e.id === id)?.value ?? ENDPOINTS[0].value;
}

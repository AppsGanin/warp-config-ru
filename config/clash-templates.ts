import type { ClashDevice } from "@/types";

/**
 * Local Clash templates, vendored from codelabhq/clash-warp-config and edited
 * to drop the third-party relay servers (the `[🌍] *.tribukvy.ltd` nodes and
 * the `Relay-сервера` group). Filenames are relative to `config/templates/`.
 */
export const CLASH_TEMPLATE_FILES: Record<ClashDevice, string> = {
  computer: "computer.yaml",
  mobile: "mobile.yaml",
  router: "router.yaml",
};

export interface ClashDeviceOption {
  id: ClashDevice;
  label: string;
}

export const CLASH_DEVICES: ClashDeviceOption[] = [
  { id: "computer", label: "Компьютер" },
  { id: "mobile", label: "Телефон" },
  { id: "router", label: "Роутер" },
];

export const DEFAULT_CLASH_DEVICE: ClashDevice = "computer";

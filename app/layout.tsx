import type { Metadata, Viewport } from "next";
import "./globals.css";

const TITLE = "WARP Config Generator";
const DESCRIPTION =
  "Рабочие конфиги Cloudflare WARP за пару секунд — AmneziaWG и Clash, со свежими ключами.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}

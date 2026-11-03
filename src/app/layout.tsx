import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JKJ CRM",
  description: "Viðskiptavinakerfi fyrir fasteignasölu",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1f7a6b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="is">
      <body>{children}</body>
    </html>
  );
}

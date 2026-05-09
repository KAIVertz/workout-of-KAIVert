import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KAIVert",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

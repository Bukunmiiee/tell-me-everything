import type { Metadata } from "next";
import "./globals.css";

// Fraunces (serif headings) and Inter (sans body) are loaded via Google Fonts
// <link> tags below rather than next/font, so the build never depends on
// fetching fonts at build time. Swap for next/font/local if you prefer
// self-hosted fonts in production.

export const metadata: Metadata = {
  title: "Tell Me Everything",
  description: "A few honest questions. No perfect answers — just yours.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,400..500&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

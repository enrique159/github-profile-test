import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Profile/Scan — GitHub Profile Explorer",
  description:
    "Explora perfiles públicos de GitHub en una experiencia clara y moderna.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

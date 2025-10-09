import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/providers/providers";

export const metadata: Metadata = {
  title: "Puddle",
  description: "Puddle",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

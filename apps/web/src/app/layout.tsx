import "./globals.css";

import AppShell from "./app-shell";
import Providers from "./providers";

import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Providers>
          <div className="app-device-frame">
            <div className="app-device-screen">
              <AppShell>{children}</AppShell>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}

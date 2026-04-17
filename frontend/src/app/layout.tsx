import type { Metadata } from "next";
import { Manrope, Public_Sans } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-headline",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

import { LanguageProvider } from "@/i18n/LanguageContext";
import { ClientLayoutContext } from "@/components/ClientLayoutContext";

export const metadata: Metadata = {
  title: "Sakny - Your Dream University Home",
  description: "Official University Housing Platform - Secure & Verified",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${publicSans.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-background font-body antialiased flex flex-col min-h-screen">
        <LanguageProvider>
          <ClientLayoutContext>
            {children}
          </ClientLayoutContext>
        </LanguageProvider>
      </body>
    </html>
  );
}

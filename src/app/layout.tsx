import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { MotionConfig } from "framer-motion";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageTransition from "@/components/layout/PageTransition";
import CustomCursor from "@/components/cursor/CustomCursor";
import BackToTop from "@/components/layout/BackToTop";
import { isRtl } from "@/i18n/config";

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#07080b" };

export const metadata: Metadata = {
  applicationName: "Zo7al Game",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Zo7al Game", statusBarStyle: "black-translucent" },
  icons: { apple: [{ url: "/assets/app/icon-180.png", sizes: "180x180", type: "image/png" }] },
  metadataBase: new URL("https://zo7al.example"),
  title: {
    default: "Zo7al Projects — Gaming Universe",
    template: "%s — Zo7al Projects",
  },
  description:
    "Zo7al is a gaming creator building Minecraft networks, modpacks, Fortnite Creative maps and experimental gaming projects.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = isRtl(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={`${GeistSans.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <NextIntlClientProvider messages={messages}>
          <MotionConfig reducedMotion="user">
            <div className="grain" aria-hidden="true" />
            <CustomCursor />
            <AppShell navigation={<Navbar />} footer={<><Footer /><BackToTop /></>}>
            <PageTransition>
              <div className="flex-1">{children}</div>
            </PageTransition>
            </AppShell>
          </MotionConfig>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}


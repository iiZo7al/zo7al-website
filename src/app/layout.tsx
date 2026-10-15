import "@/components/ui/markdown.css";
import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { MotionConfig } from "framer-motion";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import "./globals.css";
import "@/components/hub/hub.css";
import CommandSearch from "@/components/hub/CommandSearch";
import AccountProvider from "@/components/account/AccountProvider";
import "@/components/account/account.css";
import CartProvider from "@/components/store/CartProvider";
import CommunityProvider from "@/components/community/CommunityProvider";
import AppShell from "@/components/layout/AppShell";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageTransition from "@/components/layout/PageTransition";
import CustomCursor from "@/components/cursor/CustomCursor";
import BackToTop from "@/components/layout/BackToTop";
import { isRtl } from "@/i18n/config";

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#07080b" };

const baseMetadata: Metadata = {
  applicationName: "Zo7al Game",
  manifest: "/site.webmanifest",
  appleWebApp: { capable: true, title: "Zo7al Game", statusBarStyle: "black-translucent" },
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }], apple: [{ url: "/assets/app/icon-180.png", sizes: "180x180", type: "image/png" }] },
  metadataBase: new URL("https://zo7al.is-a.dev"),

};

export async function generateMetadata():Promise<Metadata>{
  const t=await getTranslations('metadata');
  return {...baseMetadata,title:{default:t('homeTitle'),template:'%s — Zo7al Projects'},description:t('homeDescription')};
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = isRtl(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={`${GeistSans.variable} h-full`}>
      <head>
        <link rel="stylesheet" href="https://cdn-uicons.flaticon.com/4.0.0/uicons-solid-rounded/css/uicons-solid-rounded.css" />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <NextIntlClientProvider messages={messages}>
          <AccountProvider><CommunityProvider><CartProvider><MotionConfig reducedMotion="user">
            <div className="grain" aria-hidden="true" />
            <CustomCursor />
            <CommandSearch />
            <AppShell navigation={<Navbar />} footer={<><Footer /><BackToTop /></>}>
            <PageTransition>
              <div className="flex-1">{children}</div>
            </PageTransition>
            </AppShell>
          </MotionConfig></CartProvider></CommunityProvider></AccountProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

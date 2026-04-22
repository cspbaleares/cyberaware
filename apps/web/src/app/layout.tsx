import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/top-nav";
import { ToastProvider } from "@/components/toast-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { PWAProvider } from "@/components/pwa-provider";
import { I18nProvider } from "@/components/i18n-provider";
import { getCurrentSession } from "@/lib/server-session";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "CyberAware - Human Risk Intelligence Platform",
  description: "Reduce el riesgo humano con simulaciones de phishing, formación personalizada y automatización inteligente.",
  keywords: ["ciberseguridad", "phishing", "formación", "riesgo humano", "security awareness"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CyberAware",
  },
  icons: {
    icon: "/logo-icon.svg",
    apple: "/logo-icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#06b6d4",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentSession();

  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <body>
        <I18nProvider>
          <ThemeProvider>
            <ToastProvider>
              <PWAProvider>
                <div className="app-shell">
                  <TopNav session={session} />
                  <main className="app-main">
                    {children}
                  </main>
                </div>
              </PWAProvider>
            </ToastProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

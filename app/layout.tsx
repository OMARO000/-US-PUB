import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/themes/ThemeProvider";
import AmbientYouWrapper from "@/components/navigation/AmbientYouWrapper";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "[us]",
  description: "human connection",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "[us]",
  },
};

export const viewport: Viewport = {
  themeColor: "#1E2A3A",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      {/* Blocking script — sets data-theme before first paint to prevent flash */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('us-theme');var v=['light','charcoal','dusk'];document.documentElement.setAttribute('data-theme',v.includes(t)?t:'light');var sc=localStorage.getItem('us_sidebar_collapsed')==='true';document.documentElement.style.setProperty('--sidebar-width',sc?'112px':'480px');})();` }} />
      </head>
      <body className={`${ibmPlexSans.variable} ${ibmPlexMono.variable}`}>
        <ThemeProvider>
          {children}
          <AmbientYouWrapper />
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Sora, DM_Sans } from "next/font/google";
import "./globals.css";
import SiteNav from "./components/SiteNav";
import SiteFooter from "./components/SiteFooter";
import CrossLinkBanner from "./components/CrossLinkBanner";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Handyroo — Your room. Your project. Your materials list.",
  description:
    "Tell us what you want to do, and we'll tell you exactly what you need. We already know your room dimensions — no tape measure required.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} ${dmSans.variable} font-sans antialiased bg-white text-[#475569] min-h-screen flex flex-col`}>
        <SiteNav activeSite="handyroo" />
        <main className="flex-1">
          {children}
        </main>
        <CrossLinkBanner site="handyroo" />
        <SiteFooter />
      </body>
    </html>
  );
}

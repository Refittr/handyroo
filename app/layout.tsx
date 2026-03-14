import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
      <body className={`${geistSans.variable} font-sans antialiased bg-white text-slate-900`}>
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Logo from "@/components/Logo.tsx/Logo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Maison Royale — Luxury Watch Customizer",
  description:
    "Compose your own chronograph. A maison of haute horlogerie where every dial, strap, hand and case is yours to specify — then hand-assembled by a single master watchmaker.",
  keywords: ["luxury watches", "custom watch", "chronograph", "haute horlogerie", "bespoke timepiece"],
  authors: [{ name: "Maison Royale" }],
  icons: {
    icon: "/Gemini_Generated_Image_l5cv03l5cv03l5cv.png",
  },
  openGraph: {
    title: "Maison Royale — Luxury Watch Customizer",
    description: "Compose your own chronograph. Haute horlogerie, yours to specify.",
    siteName: "Maison Royale",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${cormorant.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

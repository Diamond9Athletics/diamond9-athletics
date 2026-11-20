import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Headings: a tight, modern sans in sentence case. Body: Inter.
const interTight = Inter_Tight({
  variable: "--font-heading",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.diamond9athletics.com"),
  title: {
    default: "Diamond Nine Athletics | Elite Baseball Training in Austin, TX",
    template: "%s | Diamond Nine Athletics",
  },
  description:
    "Diamond Nine Athletics offers elite, data-driven baseball training in Austin, Texas. Rapsodo-tracked pitching and hitting plans built by real trainers for real results.",
  keywords: [
    "baseball training",
    "pitching lessons",
    "hitting lessons",
    "Rapsodo training",
    "Austin baseball training",
    "Diamond Nine Athletics",
    "pitching plans",
    "hitting plans",
  ],
  applicationName: "Diamond Nine Athletics",
  openGraph: {
    type: "website",
    siteName: "Diamond Nine Athletics",
    title: "Diamond Nine Athletics | Elite Baseball Training in Austin, TX",
    description:
      "Rapsodo-tracked pitching and hitting plans built by real trainers for real results. Based in Austin, Texas.",
    url: "https://www.diamond9athletics.com",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Diamond Nine Athletics | Elite Baseball Training",
    description:
      "Rapsodo-tracked pitching and hitting plans built by real trainers for real results.",
  },
  alternates: {
    canonical: "https://www.diamond9athletics.com",
  },
  // Tell search engines to skip preview deployments (booking-system branch
  // etc.). Production builds index normally.
  robots:
    process.env.VERCEL_ENV === "production"
      ? undefined
      : { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${interTight.variable} font-sans bg-[#0d0c11] text-[#f3f1f6] antialiased`}>
        <Navbar />
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}

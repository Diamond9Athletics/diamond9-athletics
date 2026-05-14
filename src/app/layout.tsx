import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${bebasNeue.variable} font-sans bg-[#040200] text-white antialiased`}>
        <ThemeProvider>
          <Navbar />
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}

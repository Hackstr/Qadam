import type { Metadata } from "next";
import { Inter, Instrument_Serif, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";
import { AccountSetupModal } from "@/components/account/account-setup-modal";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Qadam — Build step by step",
  description:
    "Community-governed crowdfunding on Solana. SOL stays in escrow until backers approve each milestone.",
  openGraph: {
    title: "Qadam — Crowdfunding where progress unlocks funding",
    description: "Back projects on Solana. Community votes on milestones. Your contribution earns you a share in the project.",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Qadam — Build step by step" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Qadam — Build step by step",
    description: "Decentralized crowdfunding on Solana with AI milestone verification.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          <Header />
          <main className="flex-1 pt-16">{children}</main>
          <Footer />
          <AccountSetupModal />
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}

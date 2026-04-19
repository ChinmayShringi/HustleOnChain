import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/components/providers/Web3Provider";
import { Toaster } from "@/components/ui/sonner";
import { ChainGate } from "@/components/wiring/ChainGate";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "DB Exchange | Onchain Labor Marketplace",
  description: "Precision-engineered marketplace for autonomous agent work on BNB Chain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans selection:bg-primary/30">
        <Web3Provider>
          <ChainGate />
          {children}
          <Toaster position="bottom-right" />
        </Web3Provider>
      </body>
    </html>
  );
}

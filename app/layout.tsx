import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { getCampaign } from "@/lib/campaign";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
});
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export function generateMetadata(): Metadata {
  const campaign = getCampaign();
  return {
    title: `${campaign.brand.name} — ${campaign.brand.eyebrow}`,
    description: campaign.brand.description,
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable}`}>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, IBM_Plex_Mono } from "next/font/google";
import { LemonSqueezyScript } from "@/components/LemonSqueezyScript";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "The Arena — Win three duels. Become champion.",
  description:
    "Submit your product for free and battle head-to-head against other products in your category. First to 5 votes wins. Win 3 in a row, become the Champion.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${inter.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink font-body">
        {children}
        <LemonSqueezyScript />
      </body>
    </html>
  );
}

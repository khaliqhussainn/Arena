import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, IBM_Plex_Mono } from "next/font/google";
import { LemonSqueezyScript } from "@/components/LemonSqueezyScript";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

// Applies a saved theme override before first paint, so a light/dark
// toggle choice never flashes the wrong theme on load. Runs as the very
// first thing in <body> — synchronous inline scripts block rendering of
// what follows until they finish, and document.documentElement always
// already exists at this point.
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('arena_theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

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
    "Submit your product for free and battle head-to-head against other products in your category. First to 100 votes wins. Win 3 in a row, become the Champion.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${inter.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-ink font-body">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <SiteHeader />
        {children}
        <LemonSqueezyScript />
      </body>
    </html>
  );
}

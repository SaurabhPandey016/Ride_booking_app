import "./globals.css";
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { AppProviders } from "@/components/shared/app-providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RideX | Move with confidence",
  description: "Reliable rides, connected journeys, and a better way to move.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable}`}>
        <AppProviders>
          <Navbar />
          <div className="min-h-screen pt-[4.5rem]">{children}</div>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}

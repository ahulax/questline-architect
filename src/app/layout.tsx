import type { Metadata } from "next";
import { Cinzel, MedievalSharp } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Providers } from "@/components/providers";

const medieval = MedievalSharp({ weight: "400", subsets: ["latin"], variable: "--font-fantasy" });
const cinzel = Cinzel({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-fantasy-header" });

export const metadata: Metadata = {
  title: "Questline Architect",
  description: "Gamified planning for solo founders",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${medieval.className} ${cinzel.variable} antialiased scanlines`}>
        <div className="flex min-h-screen bg-bg-void text-text-primary">
          <Providers>
            <Sidebar />
            <MobileNav />
            <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8">
              <div className="container mx-auto">
                {children}
              </div>
            </main>
          </Providers>
        </div>
      </body>
    </html>
  );
}

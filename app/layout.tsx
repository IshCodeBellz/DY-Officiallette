import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import Providers from "../components/providers/Providers";
import { CartSync } from "../components/providers/CartSync";
import { AuthProvider } from "../components/providers/AuthProvider";

export const metadata: Metadata = {
  title: "DYOFFICIAL",
  description:
    "DYOFFICIAL fashion storefront built with Next.js 14 & Tailwind (educational demo)",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <Providers>
            <Header />
            <CartSync />
            <main className="flex-1">{children}</main>
            <Footer />
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}

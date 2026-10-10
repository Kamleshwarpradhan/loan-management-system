import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CreditSea — Loan Management & Lending Platform",
  description: "Borrowing made easy with CreditSea. Instant personal loans and end-to-end lifecycle management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

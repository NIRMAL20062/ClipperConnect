
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google"; // Corrected import name
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/toaster"; // ShadCN Toaster

const geistSans = Geist({ // Corrected variable name
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({ // Corrected variable name
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClipperConnect - Barbershop Bookings",
  description: "Find and book appointments at your favorite barbershops.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-grow container py-8">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

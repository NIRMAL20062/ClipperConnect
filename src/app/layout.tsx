
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google"; 
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/toaster"; 
import { AiChatbotWidget } from "@/components/chatbot/ai-chatbot-widget"; // Import the chatbot widget

const geistSans = Geist({ 
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({ 
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
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-grow container py-8">{children}</main>
            <Footer />
          </div>
          <Toaster />
          <AiChatbotWidget /> {/* Add chatbot widget here */}
        </AuthProvider>
      </body>
    </html>
  );
}

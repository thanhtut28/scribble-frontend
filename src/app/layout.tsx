import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/providers/query-provider";
import { AuthProvider } from "@/lib/providers/auth-provider";
import { SocketProvider } from "@/lib/providers/socket-provider";
import { GameProvider } from "@/lib/providers/game-provider";
import { Toaster } from "sonner";
import Navbar from "@/components/navbar";
import BlockConsole from "@/components/ui/block-console";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dootell - Scribble Game",
  description: "A multiplayer online scribble game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <BlockConsole />
        <QueryProvider>
          <AuthProvider>
            <SocketProvider>
              <GameProvider>
                <div className="flex min-h-screen flex-col">
                  <Navbar />
                  <main className="flex-1">{children}</main>
                </div>
                <Toaster position="top-right" richColors />
              </GameProvider>
            </SocketProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

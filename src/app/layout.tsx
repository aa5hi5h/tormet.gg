import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import WalletConnectionProvider from "@/components/connection";
import NavigationMenus from "@/components/nav/main";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tormet.gg",
  description: "Participate in online duel's with the other players all around the world.",
  icons:{
    icon: '/tormet-real-logo-removebg-preview.png'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-900`}
      >
        <WalletConnectionProvider>
          <NavigationMenus />
             <main className=" ml-[4%]">
            {children}
          </main>
        </WalletConnectionProvider>
      </body>
    </html>
  );
}

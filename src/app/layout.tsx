import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "FlashFood Admin",
  description: "App manage FlashFood for admins",
};
import { Toaster } from "@/components/ui/toaster";

import MainNav from "@/components/Nav/MainNav";
import SideBar from "@/components/Nav/SideBar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-tr from-indigo-200 to-green-200 min-h-screen m-0 flex items-center justify-center`}
      >
        <div className="background max-w-screen-lg h-[calc(100vh-1rem)] rounded-lg shadow-md overflow-hidden mx-auto">
          <div className="grid grid-cols-12 h-full">
            <SideBar />
            <div className="col-span-10 bg-white/50 backdrop-blur-sm p-6 overflow-auto">
              <MainNav />
              {children}
              <Toaster />
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

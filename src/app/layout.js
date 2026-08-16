import { Lora, DM_Sans } from "next/font/google";
import Script from "next/script"; // ← Import Script
import "./globals.css";

import Navbar from "@/components/layout/Navbar";
import MobileBottomBar from "@/components/layout/MobileBottomBar";
import AuthProvider from "@/components/providers/SessionProvider";
import AuthSync from "@/components/providers/AuthSync";
import Footer from "@/components/footer/Footer";

const Primary = Lora({
  variable: "--font-Lora-Serif",
  subsets: ["latin"],
  display: "swap",
});

const Secondary = DM_Sans({
  variable: "--font-DM_Sans-sans-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Rantraa",
  description: "Book Pooja & Consult Experts",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${Primary.variable} ${Secondary.variable} antialiased`}
      >
      
     
          <div className="min-h-screen bg-background">
           

            <main className="pb-20 lg:pb-0">
              {children}
            </main>
          
          </div>
        
      </body>
    </html>
  );
}
import { Lora, DM_Sans } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
import QueryProvider from "@/components/QueryProvider";
import NavBar from "@/components/NavBar";
import "./globals.css";

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
  title: "Rantraa - Book Pooja & Consult Experts",
  description: "Book Pooja & Consult Spiritual Experts",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${Primary.variable} ${Secondary.variable} antialiased`}>
        <AuthProvider>
          <QueryProvider>
            <NavBar />
            <main className="pb-20 lg:pb-0">
              {children}
            </main>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
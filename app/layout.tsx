import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const sarabun = localFont({
  src: "../public/fonts/Sarabun-Regular.ttf",
  variable: "--font-sarabun",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NID - Leave Management ",
  description: "ระบบจัดการการลาพนักงาน (Leave Management System)",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sarabun.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

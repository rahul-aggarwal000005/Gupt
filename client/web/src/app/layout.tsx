import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";

import "./globals.css";

import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://your-domain.com"),

  title: {
    default: "Gupt Vault – Secure Password Manager",
    template: "%s | Gupt Vault",
  },

  description:
    "Gupt Vault is a secure password manager for storing passwords, secure notes, and sensitive information in an encrypted vault.",

  keywords: [
    "password manager",
    "secure password manager",
    "password vault",
    "encrypted password manager",
    "secure notes",
    "password storage",
    "Gupt Vault",
  ],

  applicationName: "Gupt Vault",

  authors: [
    {
      name: "Gupt Vault",
    },
  ],

  creator: "Gupt Vault",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://your-domain.com",
    siteName: "Gupt Vault",
    title: "Gupt Vault – Secure Password Manager",
    description:
      "Securely store passwords, secure notes, and sensitive information in an encrypted vault.",
  },

  twitter: {
    card: "summary_large_image",
    title: "Gupt Vault – Secure Password Manager",
    description:
      "Securely store passwords, secure notes, and sensitive information in an encrypted vault.",
  },

  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}

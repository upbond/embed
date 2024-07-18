import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Auth0Provider } from "@auth0/auth0-react";
import { Providers } from "./auth0";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UPBOND TSS Embed Sample",
  description: "UPBOND TSS Embed Sample",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

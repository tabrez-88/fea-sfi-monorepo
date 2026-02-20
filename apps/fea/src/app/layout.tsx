import 'reflect-metadata';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';
import Footer from '@/components/shared/Footer';
import Navbar from '@/components/shared/Navbar';

export const metadata: Metadata = {
  title: 'SFI-FEA | Settlement & Financial Infrastructure',
  description: 'Settlement and Financial Infrastructure platform for managing deals and revenue allocation',
};

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-title" content="FEA" />
      </head>
      <body className={inter.className}>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}

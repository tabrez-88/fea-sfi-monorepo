import 'reflect-metadata';

import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'SFI-FEA | Settlement & Financial Infrastructure',
  description: 'Settlement and Financial Infrastructure platform for managing deals and revenue allocation',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

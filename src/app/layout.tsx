import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SIJAGA JOHOR — Sistem Pemantauan Petugas Kebersihan Kecamatan Medan Johor',
  description: 'Sistem informasi dan pemantauan lokasi petugas kebersihan Melati dan Bestari di Kecamatan Medan Johor, Kota Medan.',
  keywords: 'Medan Johor, kebersihan, Melati, Bestari, pemantauan, petugas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}

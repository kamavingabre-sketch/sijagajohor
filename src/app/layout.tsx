import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'SIJAGA JOHOR — Sistem Pemantauan Petugas Kebersihan',
  description: 'Sistem informasi dan pemantauan lokasi petugas kebersihan Melati dan Bestari di Kecamatan Medan Johor.',
  keywords: 'Medan Johor, kebersihan, Melati, Bestari, pemantauan, petugas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

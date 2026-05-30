import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Channel OS — YouTube運営管理OS',
  description: 'YouTube仕分け・コメント人格作成・投稿管理のためのSaaSツール',
  icons: { icon: '/favicon.ico' }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#12141f'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

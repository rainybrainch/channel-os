import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Channel OS — YouTube運営管理OS',
  description: 'YouTube仕分け・企画化・投稿管理のためのモックOS'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

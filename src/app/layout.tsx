import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'SLOT NOTE | パチスロ収支', description: '今日の実戦を、さっと記録。個人用パチスロ収支管理。', appleWebApp: { capable: true, title: 'SLOT NOTE', statusBarStyle: 'default' } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f6f7f2' };
export default function Layout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="ja"><body>{children}</body></html>; }

import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'M2 Labs – Crafting the Future of Vintage Sound',
  description:
    'Crafting the future of vintage sound with high-quality analog equipment, modern design and a transferable lifetime warranty.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans bg-background text-primary leading-relaxed antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

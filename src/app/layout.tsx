import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { WatchlistProvider } from '@/context/WatchlistContext';
import { LanguageProvider } from '@/context/LanguageContext';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: 'Toggle Box - Stream Movies, TV Shows & Originals',
  description:
    'Experience the best in entertainment on Toggle Box. Stream blockbuster movies, award-winning series, and exclusive originals.',
  keywords: ['Toggle Box', 'Prime Video', 'Streaming', 'Movies', 'TV Shows', 'Watch Online'],
  openGraph: {
    title: 'Toggle Box - Stream Movies, TV Shows & Originals',
    description: 'Watch anywhere. Cancel anytime. Start your Toggle Box experience.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body suppressHydrationWarning>
        <WatchlistProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </WatchlistProvider>
      </body>
    </html>
  );
}

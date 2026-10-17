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
  title: 'Tea+ - Stream Movies, TV Shows & Originals',
  description:
    'Experience the best in entertainment on Tea+. Stream blockbuster movies, award-winning series, and exclusive originals.',
  keywords: ['Tea+', 'Tea Plus', 'Streaming', 'Movies', 'TV Shows', 'Watch Online'],
  openGraph: {
    title: 'Tea+ - Stream Movies, TV Shows & Originals',
    description: 'Watch anywhere. Cancel anytime. Start your Tea+ experience.',
    type: 'website',
  },
};

import { ProviderProvider } from '@/context/ProviderContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body suppressHydrationWarning>
        <WatchlistProvider>
          <LanguageProvider>
            <ProviderProvider>{children}</ProviderProvider>
          </LanguageProvider>
        </WatchlistProvider>
      </body>
    </html>
  );
}

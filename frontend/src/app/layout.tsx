import './globals.css';
import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Catalyst Markets – NSE & NASDAQ Intelligence',
  description: 'Real-time stock prices, IPO tracking, portfolio analytics.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#14d2b4',
          colorBackground: '#07090f',
          colorInputBackground: '#0c1018',
          colorInputText: '#e8edf5',
        },
      }}
    >
      <html lang="en">
        <body style={{ background: 'var(--bg)', minHeight: '100vh' }}>
          <Navbar />
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}

/*
//basic b&w 
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Catalyst Markets – Global Stock & IPO Intelligence',
  description:
    'Track NSE & NASDAQ stocks and IPOs in real time with AI-powered insights for Indian investors.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        //{ Shared Navbar across all pages }
        <Navbar />

        //{ Page content }
        <main>{children}</main>
      </body>
    </html>
  );
}

*/
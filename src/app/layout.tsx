import type { Metadata } from 'next';
import './globals.css';
import { TerminalHeader } from '@/components/layout/TerminalHeader';
import { TerminalNav } from '@/components/layout/TerminalNav';

export const metadata: Metadata = {
  title: 'FOMO Alpha Scanner | Follow the Smart Money',
  description:
    'Identify high-conviction coins by analyzing what successful, high-performing FOMO traders are buying in real-time.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-terminal-bg text-terminal-text antialiased font-mono selection:bg-terminal-green selection:text-black">
        <div className="flex min-h-screen flex-col">
          <TerminalHeader />
          <div className="flex flex-1">
            <TerminalNav />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 terminal-grid">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

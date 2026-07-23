import React from 'react';

export const metadata = {
  title: 'AlgoWeb - Algorithmic Trading Platform',
  description: 'Enterprise algorithmic trading and backtesting suite',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

import React from 'react';
import './globals.css';
export const metadata={title:'Delta Opposite Pair Bot',description:'15m BTC/ETH opposite-order paper trading dashboard'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" className="dark"><body className="bg-slate-950 text-slate-100 antialiased">{children}</body></html>}
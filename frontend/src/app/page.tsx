import React from 'react';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-100">
      <div className="max-w-2xl text-center space-y-4">
        <h1 className="text-3xl font-bold font-mono text-cyan-400">
          AlgoWeb Next.js 15 Scaffold
        </h1>
        <p className="text-slate-400 text-sm">
          Frontend client repository structure initialized. Zero business logic or mock APIs implemented.
        </p>
      </div>
    </main>
  );
}

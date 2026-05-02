import React from 'react';

export default function Badge({ children, tone = 'red' }) {
  const tones = {
    red: 'border-brand/40 text-brand',
    white: 'border-white/15 text-white/70',
    green: 'border-emerald-400/40 text-emerald-400',
  };
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 border rounded-full text-[9px] md:text-[10px] font-mono font-bold tracking-[0.28em] uppercase ${tones[tone] || tones.red}`}>
      <span className="w-1 h-1 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}
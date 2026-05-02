import React from 'react';

export function LogoMark({ size = 28, className = '' }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} fill="none">
      <circle cx="20" cy="20" r="18.5" stroke="white" strokeOpacity="0.9" strokeWidth="1.2" />
      <path d="M5 20 H10 L13 12 L17 28 L21 8 L25 32 L29 16 L32 22 H35" stroke="#FF3B2E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Logo({ size = 'md', className = '' }) {
  const px = size === 'sm' ? 22 : size === 'lg' ? 36 : 28;
  const text = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={px} />
      <span className={`font-display tracking-[0.18em] ${text}`}>PULSE</span>
    </div>
  );
}
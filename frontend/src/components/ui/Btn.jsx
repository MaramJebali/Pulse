import React from 'react';

export default function Btn({ children, onClick, variant = 'primary', size = 'lg', icon, type = 'button', disabled }) {
  const sizes = {
    md: 'h-11 px-5 text-[11px]',
    lg: 'h-14 px-7 text-xs',
    xl: 'h-16 px-9 text-sm',
  };
  const base = `relative group inline-flex items-center justify-center gap-3 rounded-full font-mono font-bold tracking-[0.22em] uppercase transition-all ${sizes[size]} disabled:opacity-40 disabled:pointer-events-none`;
  const styles = {
    primary: 'bg-brand text-white hover:bg-white hover:text-black shadow-glow hover:shadow-glow-lg',
    ghost: 'border border-white/15 text-white hover:bg-white/5',
    outline: 'border border-brand text-brand hover:bg-brand hover:text-white',
    dark: 'bg-white/5 border border-white/10 text-white hover:bg-white/10',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]}`}>
      {children}
      {icon && <span className="text-base">{icon}</span>}
      {variant === 'primary' && (
        <span className="pointer-events-none absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition" style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.2) inset' }} />
      )}
    </button>
  );
}
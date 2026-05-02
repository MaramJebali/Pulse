// Shared small atoms

function Badge({ children, tone = 'red' }) {
  const tones = {
    red: 'border-brand/40 text-brand',
    white: 'border-white/15 text-white/70',
    green: 'border-emerald-400/40 text-emerald-400',
  };
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 border rounded-full text-[9px] md:text-[10px] font-mono font-bold tracking-[0.28em] uppercase ${tones[tone] || tones.red}`}>
      <span className="w-1 h-1 rounded-full bg-current opacity-70"></span>
      {children}
    </span>
  );
}

function MassiveText({ children, opacity = 0.025 }) {
  return (
    <div className="massive-text" style={{ color: `rgba(255,255,255,${opacity})` }}>{children}</div>
  );
}

function Btn({ children, onClick, variant = 'primary', size = 'lg', icon, type = 'button', disabled }) {
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

function ArrowRight({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}
function ArrowLeft({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
    </svg>
  );
}

// Platform glyphs (custom — no brand logos)
function GlyphIG({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
    </svg>
  );
}
function GlyphYT({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2.5" y="6" width="19" height="12" rx="3" />
      <path d="M11 9.5v5l4-2.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

window.Badge = Badge;
window.MassiveText = MassiveText;
window.Btn = Btn;
window.ArrowRight = ArrowRight;
window.ArrowLeft = ArrowLeft;
window.GlyphIG = GlyphIG;
window.GlyphYT = GlyphYT;

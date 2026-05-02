import React from 'react';

export default function Footer({ t }) {
  return (
    <footer className="absolute bottom-0 left-0 right-0 z-30 px-6 md:px-10 pb-4 pointer-events-none">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-6 text-[10px] font-mono uppercase tracking-[0.25em] text-white/35 pointer-events-auto">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-brand blink" />
          <span>{t('footer.live')}</span>
        </div>
        <div className="hidden md:block">{t('footer.tagline')}</div>
        <div className="flex items-center gap-3">
          <span>v0.1 · 2026</span>
          <span className="text-white/20">·</span>
          <span>{t('footer.author')}</span>
        </div>
      </div>
    </footer>
  );
}
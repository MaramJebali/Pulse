import React from 'react';
import Logo from '../ui/Logo';

export default function TopNav({ route, setRoute, lang, setLang, t }) {
  const items = [
    { id: 'home', label: t('nav.home') },
    { id: 'input', label: t('nav.input') },
    { id: 'select', label: t('nav.select') },
    { id: 'loading', label: t('nav.loading') },
    { id: 'dashboard', label: t('nav.dashboard') },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 md:px-6 pt-4 pointer-events-none">
      <nav className="w-full max-w-[1400px] pointer-events-auto rounded-full bg-black/70 backdrop-blur-md border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between px-3 py-2">
          <button onClick={() => setRoute('home')} className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-white/5 transition">
            <Logo size="sm" />
          </button>

          <div className="hidden lg:flex items-center gap-0.5 pr-1">
            {items.map((it, i) => {
              const active = route === it.id;
              return (
                <button
                  key={it.id}
                  onClick={() => setRoute(it.id)}
                  className={`relative px-3.5 py-2 rounded-full text-[10px] font-mono font-semibold tracking-[0.22em] uppercase transition ${active ? 'text-white bg-white/10' : 'text-white/55 hover:text-white hover:bg-white/5'}`}
                >
                  <span className="text-brand mr-1.5">{String(i + 1).padStart(2, '0')}</span>
                  {it.label}
                </button>
              );
            })}
            <div className="w-px h-4 bg-white/10 mx-2" />
            <div className="flex items-center text-[10px] font-mono tracking-[0.2em] uppercase">
              <button onClick={() => setLang('en')} className={`px-2.5 py-1 rounded-full transition ${lang === 'en' ? 'text-brand' : 'text-white/40 hover:text-white'}`}>EN</button>
              <span className="text-white/20">/</span>
              <button onClick={() => setLang('fr')} className={`px-2.5 py-1 rounded-full transition ${lang === 'fr' ? 'text-brand' : 'text-white/40 hover:text-white'}`}>FR</button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
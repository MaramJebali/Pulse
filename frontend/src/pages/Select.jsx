import React from 'react';
import Badge from '../components/ui/Badge';
import Btn from '../components/ui/Btn';
import MassiveText from '../components/ui/MassiveText';
import { ArrowLeft, ArrowRight, GlyphIG, GlyphYT } from '../components/ui/Icons';

const IG_LIST = [
  { handle: '@solene.studio', name: 'Solène Khaled', followers: '482K', posts: 4 },
  { handle: '@maximerune', name: 'Maxime Rune', followers: '1.2M', posts: 6 },
  { handle: '@aya.minimal', name: 'Aya Belkhir', followers: '218K', posts: 3 },
  { handle: '@theodore.ferrier', name: 'Théo Ferrier', followers: '94K', posts: 5 },
  { handle: '@nour.archive', name: 'Nour El-Idrissi', followers: '763K', posts: 4 },
];
const YT_LIST = [
  { handle: '@laplus_creative', name: 'La Plus Creative', followers: '328K', posts: 2 },
  { handle: '@brieflab', name: 'Brief Lab', followers: '1.4M', posts: 1 },
  { handle: '@studio.kosa', name: 'Studio Kosa', followers: '212K', posts: 3 },
  { handle: '@tarek.reviews', name: 'Tarek Reviews', followers: '585K', posts: 2 },
  { handle: '@maison.echo', name: 'Maison Écho', followers: '127K', posts: 1 },
];

function PlatformPanel({ t, title, icon, list, selected, onToggle, window, setWindow, windows, windowLabel, unit, postsLabel }) {
  return (
    <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 md:p-6 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg border border-white/15 flex items-center justify-center">{icon}</div>
          <div>
            <div className="font-display text-xl tracking-tight uppercase">{title}</div>
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/40">{selected.length}/5 {t('select.selected').toLowerCase()}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[8px] tracking-[0.25em] uppercase text-white/40 mr-1">{windowLabel}</span>
          {windows.map(w => (
            <button key={w} onClick={() => setWindow(w)} className={`px-2.5 py-1 rounded-md font-mono text-[10px] uppercase tracking-[0.18em] transition ${window === w ? 'bg-brand text-white' : 'bg-white/5 text-white/50 hover:text-white'}`}>{w}</button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar pr-1">
        {list.map((p) => {
          const sel = selected.includes(p.handle);
          return (
            <button key={p.handle} onClick={() => onToggle(p.handle)} className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition text-left ${sel ? 'border-brand bg-brand/10 shadow-glow' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.06]'}`}>
              <div className={`w-9 h-9 rounded-full border ${sel ? 'border-brand' : 'border-white/15'} bg-gradient-to-br from-white/5 to-white/0 flex items-center justify-center font-display text-sm`}>
                {p.name.split(' ').map(s => s[0]).slice(0, 2).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[11px] text-white truncate">{p.handle}</div>
                <div className="font-sans text-[12px] text-white/45 truncate">{p.name}</div>
              </div>
              <div className="text-right hidden sm:block">
                <div className="font-display text-sm tracking-tight">{p.followers}</div>
                <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/35">{unit}</div>
              </div>
              <div className="text-right hidden md:block min-w-[60px]">
                <div className="font-display text-sm tracking-tight text-white/80">{p.posts}</div>
                <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/35">{postsLabel}</div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${sel ? 'border-brand bg-brand' : 'border-white/20'}`}>
                {sel && (
                  <svg width="10" height="10" viewBox="0 0 12 12">
                    <path d="M2 6 L5 9 L10 3" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Select({ t, setRoute, store, setStore, triggerReveal }) {
  const ig = store.igSelected || [];
  const yt = store.ytSelected || [];

  const toggle = (key, handle) => {
    const cur = store[key] || [];
    const next = cur.includes(handle) ? cur.filter(h => h !== handle) : (cur.length >= 5 ? cur : [...cur, handle]);
    setStore({ ...store, [key]: next });
  };

  const total = ig.length + yt.length;

  return (
    <section className="relative w-full h-full overflow-hidden page-in">
      <MassiveText opacity={0.02}>TARGETS</MassiveText>
      <div className="absolute inset-0 z-10 px-8 md:px-14 pt-24 pb-16 flex flex-col">
        <div className="max-w-[1400px] w-full mx-auto flex items-end justify-between mb-6">
          <div>
            <Badge>{t('select.kicker')}</Badge>
            <h1 className="font-display leading-[0.82] tracking-tight mt-3">
              <div className="text-5xl md:text-7xl title-solid-white">{t('select.title')}</div>
              <div className="text-5xl md:text-7xl title-solid-red -mt-1">{t('select.title2')}</div>
            </h1>
            <p className="mt-4 max-w-xl text-sm md:text-base text-white/50">{t('select.lede')}</p>
          </div>
          <div className="hidden md:flex flex-col items-end gap-1 font-mono text-[10px] tracking-[0.28em] uppercase text-white/40">
            <span>{t('select.selected')}</span>
            <span className="text-white text-3xl font-display">{total}<span className="text-white/30 text-lg">/10</span></span>
          </div>
        </div>
        <div className="max-w-[1400px] w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-5 flex-1 min-h-0">
          <PlatformPanel
            t={t}
            title={t('select.ig.title')}
            icon={<GlyphIG size={20} />}
            list={IG_LIST}
            selected={ig}
            onToggle={(h) => toggle('igSelected', h)}
            window={store.igWindow || '24h'}
            setWindow={(w) => setStore({ ...store, igWindow: w })}
            windows={['24h', '36h']}
            windowLabel={t('select.window.ig')}
            unit={t('select.followers')}
            postsLabel={t('select.posts')}
          />
          <PlatformPanel
            t={t}
            title={t('select.yt.title')}
            icon={<GlyphYT size={20} />}
            list={YT_LIST}
            selected={yt}
            onToggle={(h) => toggle('ytSelected', h)}
            window={store.ytWindow || '3d'}
            setWindow={(w) => setStore({ ...store, ytWindow: w })}
            windows={['3d', '7d']}
            windowLabel={t('select.window.yt')}
            unit={t('select.subs')}
            postsLabel={t('select.posts')}
          />
        </div>
        <div className="max-w-[1400px] w-full mx-auto mt-6 flex items-center justify-between">
          <Btn variant="ghost" size="md" onClick={() => triggerReveal(() => setRoute('input'), false)}>
            <ArrowLeft /> {t('select.back')}
          </Btn>
          <Btn disabled={total === 0} onClick={() => triggerReveal(() => setRoute('loading'), true)} icon={<ArrowRight />}>
            {t('select.start')}
          </Btn>
        </div>
      </div>
    </section>
  );
}
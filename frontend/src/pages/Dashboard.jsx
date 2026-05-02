import React from 'react';
import Badge from '../components/ui/Badge';
import Btn from '../components/ui/Btn';
import MassiveText from '../components/ui/MassiveText';
import { ArrowRight, GlyphIG, GlyphYT } from '../components/ui/Icons';

const POSTS = [
  {
    handle: '@solene.studio', plat: 'ig', when: '14h ago',
    text: 'My evening routine with the new Halo serum — the texture really is different. Honest review in stories ✨',
    likes: '24.1K', comments: '1,284', shares: '312',
    sentiment: { p: 68, n: 22, x: 10 },
    excerpts: [
      { t: 'Finally an honest review, thank you', s: 'p' },
      { t: 'Is it cruelty-free though?', s: 'x' },
      { t: 'Smells weird tbh, returned mine', s: 'n' },
      { t: 'My skin literally glows now', s: 'p' },
    ],
  },
  {
    handle: '@brieflab', plat: 'yt', when: '2d ago',
    text: 'I tried 12 plant-based serums for 30 days. Here\'s the only one I\'d buy again.',
    likes: '88.7K', comments: '4,902', shares: '1.1K',
    sentiment: { p: 54, n: 28, x: 18 },
    excerpts: [
      { t: 'The price is the only issue', s: 'x' },
      { t: 'Wish you tested oily skin too', s: 'n' },
      { t: 'Best comparison on YouTube', s: 'p' },
    ],
  },
  {
    handle: '@maximerune', plat: 'ig', when: '6h ago',
    text: 'Lab visit ↗ how Halo formulates without parabens. The science deserves the price.',
    likes: '52.3K', comments: '2,118', shares: '801',
    sentiment: { p: 81, n: 9, x: 10 },
    excerpts: [
      { t: 'Loved seeing the actual lab', s: 'p' },
      { t: 'Sponcon at this point', s: 'n' },
      { t: 'Genuinely informative thank you', s: 'p' },
    ],
  },
];

const RECOS = [
  { tag: 'AMPLIFY', title: 'Re-share Maxime\'s lab tour', body: 'Highest positive ratio (81%). Cross-post to your IG story with a UGC quote overlay.', tone: 'p' },
  { tag: 'REPLY', title: 'Address pricing in Brief Lab thread', body: '210+ comments mention price. Pinned reply explaining the formulation cost will neutralize ~40% of objections.', tone: 'x' },
  { tag: 'WATCH', title: 'Scent complaints on Solène\'s post', body: '7% of comments cite scent. Not viral yet, but trending up. Brief PR sample to a fragrance reviewer to defuse.', tone: 'n' },
];

function SentimentDonut({ p, x, n, t }) {
  const r = 70, c = 2 * Math.PI * r;
  const segs = [
    { v: p, color: '#33D679' },
    { v: x, color: '#9CA3AF' },
    { v: n, color: '#FF3B2E' },
  ];
  let off = 0;
  return (
    <div className="relative w-full aspect-square max-w-[220px] mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
        <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="18" />
        {segs.map((s, i) => {
          const len = (s.v / 100) * c;
          const dash = `${len} ${c - len}`;
          const dashOff = -off;
          off += len;
          return <circle key={i} cx="100" cy="100" r={r} fill="none" stroke={s.color} strokeWidth="18" strokeDasharray={dash} strokeDashoffset={dashOff} strokeLinecap="butt" />;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-5xl text-white">{p}<span className="text-white/30">%</span></div>
        <div className="font-mono text-[9px] tracking-[0.28em] uppercase text-emerald-400">{t('dash.positive')}</div>
      </div>
    </div>
  );
}

function SentChip({ color, label, val }) {
  return (
    <div className="px-2 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-center">
      <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ background: color }} />
      <div className="font-display text-base">{val}</div>
      <div className="font-mono text-[8px] tracking-[0.2em] uppercase text-white/40">{label}</div>
    </div>
  );
}

function VolumeSpark() {
  const data = [12, 18, 9, 22, 30, 24, 38, 42, 56, 48, 62, 70, 58, 78, 84];
  const max = 84;
  return (
    <div className="flex items-end gap-1 h-14">
      {data.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm" style={{ height: `${(v / max) * 100}%`, background: i === data.length - 1 ? '#FF3B2E' : `rgba(255,255,255,${0.18 + (v / max) * 0.5})` }} />
      ))}
    </div>
  );
}

function PostCard({ p, t }) {
  const Icon = p.plat === 'ig' ? GlyphIG : GlyphYT;
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full border border-white/15 flex items-center justify-center"><Icon size={14} /></div>
        <div className="font-mono text-[11px] text-white">{p.handle}</div>
        <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">· {p.when}</div>
      </div>
      <div className="text-[13px] text-white/80 leading-snug mb-3 line-clamp-2">{p.text}</div>
      <div className="flex h-1.5 rounded-full overflow-hidden mb-2">
        <div style={{ width: `${p.sentiment.p}%`, background: '#33D679' }} />
        <div style={{ width: `${p.sentiment.x}%`, background: '#9CA3AF' }} />
        <div style={{ width: `${p.sentiment.n}%`, background: '#FF3B2E' }} />
      </div>
      <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.2em] text-white/40 mb-2.5">
        <span>{p.likes} {t('dash.likes')}</span>
        <span>·</span>
        <span>{p.comments} {t('dash.comments')}</span>
        <span>·</span>
        <span>{p.shares} {t('dash.shares')}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {p.excerpts.slice(0, 3).map((e, i) => {
          const c = e.s === 'p' ? 'border-emerald-400/40 text-emerald-300 bg-emerald-400/5' : e.s === 'n' ? 'border-brand/50 text-brand bg-brand/5' : 'border-white/15 text-white/55 bg-white/[0.03]';
          return <span key={i} className={`px-2 py-1 rounded-full text-[10px] font-sans border ${c}`}>"{e.t}"</span>;
        })}
      </div>
    </div>
  );
}

function RecoCard({ r, idx }) {
  const tone = r.tone === 'p' ? 'border-emerald-400/40' : r.tone === 'n' ? 'border-brand/50' : 'border-white/15';
  return (
    <div className={`rounded-xl border ${tone} bg-black/30 p-3.5`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[8px] tracking-[0.3em] uppercase text-brand">{r.tag}</span>
        <span className="font-display text-lg text-white/30">0{idx}</span>
      </div>
      <div className="font-display text-base tracking-tight uppercase leading-tight mb-1">{r.title}</div>
      <div className="text-[11px] text-white/50 leading-snug">{r.body}</div>
    </div>
  );
}

export default function Dashboard({ t, setRoute, triggerReveal }) {
  return (
    <section className="relative w-full h-full overflow-hidden page-in">
      <MassiveText opacity={0.018}>INSIGHTS</MassiveText>
      <div className="absolute inset-0 z-10 px-6 md:px-10 pt-24 pb-10 flex flex-col">
        <div className="max-w-[1500px] w-full mx-auto flex items-end justify-between mb-5">
          <div>
            <Badge>{t('dash.kicker')}</Badge>
            <h1 className="font-display leading-[0.82] tracking-tight mt-3">
              <div className="text-5xl md:text-6xl title-solid-white">{t('dash.title')}</div>
              <div className="text-5xl md:text-6xl title-solid-red -mt-1">{t('dash.title2')}</div>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Btn variant="ghost" size="md">{t('dash.export')}</Btn>
            <Btn size="md" onClick={() => triggerReveal(() => setRoute('home'), false)} icon={<ArrowRight />}>{t('dash.again')}</Btn>
          </div>
        </div>
        <div className="max-w-[1500px] w-full mx-auto grid grid-cols-12 gap-4 flex-1 min-h-0">
          <div className="col-span-12 lg:col-span-4 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 flex flex-col">
            <div className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/40 mb-3">{t('dash.overall')}</div>
            <SentimentDonut p={64} x={22} n={14} t={t} />
            <div className="grid grid-cols-3 gap-2 mt-4">
              <SentChip color="#33D679" label={t('dash.positive')} val="64%" />
              <SentChip color="#9CA3AF" label={t('dash.neutral')} val="22%" />
              <SentChip color="#FF3B2E" label={t('dash.negative')} val="14%" />
            </div>
            <div className="mt-5 pt-4 border-t border-white/10">
              <div className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/40 mb-3">VOLUME · 24H</div>
              <VolumeSpark />
            </div>
          </div>
          <div className="col-span-12 lg:col-span-5 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3">
              <div className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/40">{t('dash.posts')}</div>
              <div className="font-mono text-[10px] tracking-[0.18em] text-white/40">3 / 12</div>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar pr-1">
              {POSTS.map((p, i) => <PostCard key={i} p={p} t={t} />)}
            </div>
          </div>
          <div className="col-span-12 lg:col-span-3 rounded-3xl border border-brand/40 bg-gradient-to-b from-brand/[0.08] to-white/[0.02] backdrop-blur-md p-5 shadow-glow flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand blink"></span>
              <div className="font-mono text-[10px] tracking-[0.28em] uppercase text-brand">{t('dash.reco')}</div>
            </div>
            <div className="font-display text-3xl tracking-tight uppercase mb-1">3 Plays</div>
            <div className="text-[12px] text-white/50 mb-4">{t('dash.reco.lede')}</div>
            <div className="flex flex-col gap-2.5 overflow-y-auto no-scrollbar">
              {RECOS.map((r, i) => <RecoCard key={i} r={r} idx={i + 1} />)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
import React from 'react';
import Badge from '../components/ui/Badge';
import Btn from '../components/ui/Btn';
import { ArrowRight } from '../components/ui/Icons';

export default function Home({ t, setRoute, triggerReveal }) {
  const startAnalysis = () => triggerReveal(() => setRoute('input'), true);

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 px-6 md:px-10 py-20 md:py-32 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-12 gap-8 items-start">
          {/* Left column: Hero text & CTA */}
          <div className="col-span-12 lg:col-span-7">
            <h1 className="font-display tracking-tight leading-[0.86]">
              <div className="text-[88px] md:text-[112px] xl:text-[128px] text-white">{t('home.title.read')}</div>
              <div className="text-[88px] md:text-[112px] xl:text-[128px] title-outline -mt-2">{t('home.title.between')}</div>
              <div className="text-[88px] md:text-[112px] xl:text-[128px] text-brand -mt-2">{t('home.title.lines')}</div>
            </h1>
            <p className="mt-7 max-w-[520px] text-[17px] leading-relaxed text-white/60">{t('home.lede')}</p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <button
                onClick={startAnalysis}
                className="group relative inline-flex items-center justify-center gap-3 rounded-full bg-brand text-white font-mono font-bold tracking-[0.22em] uppercase h-[68px] px-10 text-[13px] shadow-cta-lg cta-pulse hover:scale-[1.02] active:scale-[.98] transition-transform"
              >
                <span>{t('home.cta.start')}</span>
                <ArrowRight size={18} />
                <span className="absolute -inset-px rounded-full opacity-0 group-hover:opacity-100 transition" style={{ boxShadow: '0 0 0 1px rgba(255,255,255,.25) inset' }} />
              </button>
              <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-white/35">No credit card · 2 min setup</span>
            </div>
          </div>

          {/* Right column: Cards are now horizontal (flex-row, not stacked down) */}
          <div className="col-span-12 lg:col-span-5">
            <div className="flex flex-row flex-wrap gap-4">
              {/* Card 1 */}
              <div className="flex-1 min-w-[140px] rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
                <div className="font-mono text-[10px] tracking-[0.28em] text-brand">AI POWERED</div>
                <div className="font-display text-lg tracking-tight uppercase mt-1">Instant</div>
                <p className="text-[11px] text-white/55 mt-1 leading-tight">Real-time analysis</p>
              </div>

              {/* Card 2 */}
              <div className="flex-1 min-w-[140px] rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
                <div className="font-mono text-[10px] tracking-[0.28em] text-brand">PRECISE</div>
                <div className="font-display text-lg tracking-tight uppercase mt-1">Deep Context</div>
                <p className="text-[11px] text-white/55 mt-1 leading-tight">Semantic understanding</p>
              </div>

              {/* Card 3 */}
              <div className="flex-1 min-w-[140px] rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
                <div className="font-mono text-[10px] tracking-[0.28em] text-brand">SECURE</div>
                <div className="font-display text-lg tracking-tight uppercase mt-1">Encrypted</div>
                <p className="text-[11px] text-white/55 mt-1 leading-tight">Your data stays private</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom feature grid (unchanged) */}
        <div className="mt-32">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 font-mono text-[10px] tracking-[0.28em] uppercase">{t('home.feature.kicker')}</span>
            <h2 className="font-display text-4xl md:text-5xl tracking-tight uppercase mt-4">{t('home.feature.title')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md">
              <div className="font-mono text-[10px] tracking-[0.28em] text-brand">{t('home.f1.label')}</div>
              <div className="font-display text-xl tracking-tight uppercase mt-2 mb-2">{t('home.f1.title')}</div>
              <p className="text-[12.5px] text-white/55 leading-snug">{t('home.f1.desc')}</p>
            </div>
            <div className="rounded-2xl border border-brand/40 bg-brand/[0.06] p-6 backdrop-blur-md">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] tracking-[0.28em] text-brand">{t('home.f2.label')}</span>
                <span className="font-mono text-[8px] tracking-[0.3em] uppercase text-brand">Core</span>
              </div>
              <div className="font-display text-xl tracking-tight uppercase mt-2 mb-2">{t('home.f2.title')}</div>
              <p className="text-[12.5px] text-white/55 leading-snug">{t('home.f2.desc')}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md">
              <div className="font-mono text-[10px] tracking-[0.28em] text-brand">{t('home.f3.label')}</div>
              <div className="font-display text-xl tracking-tight uppercase mt-2 mb-2">{t('home.f3.title')}</div>
              <p className="text-[12.5px] text-white/55 leading-snug">{t('home.f3.desc')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
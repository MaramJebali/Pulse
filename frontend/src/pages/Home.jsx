import React from 'react';
import Badge from '../components/ui/Badge';
import Btn from '../components/ui/Btn';
import { ArrowRight } from '../components/ui/Icons';

export default function Home({ t, setRoute, triggerReveal }) {
  const startAnalysis = () => triggerReveal(() => setRoute('input'), true);

  return (
    // Outer wrapper: no horizontal scroll, exactly viewport height, no vertical scroll
    <div className="relative h-screen overflow-hidden">
      <div className="relative z-10 px-6 md:px-10 py-8 md:py-12 h-full overflow-y-auto">
        {/* Inner container with max-width and centering */}
        <div className="max-w-[1400px] mx-auto h-full flex flex-col justify-center">
          <div className="grid grid-cols-12 gap-8 items-center">
            {/* Left column: Hero text & CTA */}
            <div className="col-span-12 lg:col-span-6">
              <h1 className="font-display tracking-tight leading-[0.86]">
                <div className="text-[72px] md:text-[96px] xl:text-[112px] text-white">{t('home.title.read')}</div>
                <div className="text-[72px] md:text-[96px] xl:text-[112px] title-outline -mt-2">{t('home.title.between')}</div>
                <div className="text-[72px] md:text-[96px] xl:text-[112px] text-brand -mt-2">{t('home.title.lines')}</div>
              </h1>
              <p className="mt-5 max-w-[480px] text-[16px] leading-relaxed text-white/60">{t('home.lede')}</p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <button
                  onClick={startAnalysis}
                  className="group relative inline-flex items-center justify-center gap-3 rounded-full bg-brand text-white font-mono font-bold tracking-[0.22em] uppercase h-[60px] px-8 text-[12px] shadow-cta-lg cta-pulse hover:scale-[1.02] active:scale-[.98] transition-transform"
                >
                  <span>{t('home.cta.start')}</span>
                  <ArrowRight size={16} />
                  <span className="absolute -inset-px rounded-full opacity-0 group-hover:opacity-100 transition" style={{ boxShadow: '0 0 0 1px rgba(255,255,255,.25) inset' }} />
                </button>
                <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/35">No credit card · 2 min setup</span>
              </div>
            </div>

            {/* Right column: Four cards (no overflow, perfectly sized) */}
            <div className="col-span-12 lg:col-span-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Lens 1 */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
                  <div className="font-mono text-[10px] tracking-[0.28em] text-brand">{t('home.f1.label')}</div>
                  <div className="font-display text-xl tracking-tight uppercase mt-2 mb-1">{t('home.f1.title')}</div>
                  <p className="text-[13px] text-white/60 leading-snug">{t('home.f1.desc')}</p>
                </div>

                {/* Lens 2 (Core) */}
                <div className="rounded-2xl border border-brand/40 bg-brand/[0.06] p-5 backdrop-blur-md">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] tracking-[0.28em] text-brand">{t('home.f2.label')}</span>
                    <span className="font-mono text-[8px] tracking-[0.3em] uppercase text-brand">Core</span>
                  </div>
                  <div className="font-display text-xl tracking-tight uppercase mt-2 mb-1">{t('home.f2.title')}</div>
                  <p className="text-[13px] text-white/60 leading-snug">{t('home.f2.desc')}</p>
                </div>

                {/* Lens 3 */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
                  <div className="font-mono text-[10px] tracking-[0.28em] text-brand">{t('home.f3.label')}</div>
                  <div className="font-display text-xl tracking-tight uppercase mt-2 mb-1">{t('home.f3.title')}</div>
                  <p className="text-[13px] text-white/60 leading-snug">{t('home.f3.desc')}</p>
                </div>

                {/* Verdict Card */}
                <div className="rounded-2xl border border-white/20 bg-white/[0.08] p-5 backdrop-blur-md">
                  <div className="font-mono text-[10px] tracking-[0.28em] text-brand">VERDICT</div>
                  <div className="font-display text-xl tracking-tight uppercase mt-2 mb-1">Final Call</div>
                  <p className="text-[13px] text-white/60 leading-snug">Clear, actionable recommendation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import Badge from '../components/ui/Badge';
import MassiveText from '../components/ui/MassiveText';

export default function Loading({ t, setRoute, triggerReveal }) {
  const [step, setStep] = useState(0);
  const [typed, setTyped] = useState('');
  const stepKeys = [
    'loading.steps.0',
    'loading.steps.1',
    'loading.steps.2',
    'loading.steps.3',
    'loading.steps.4',
    'loading.steps.5',
    'loading.steps.6',
  ];
  const total = stepKeys.length;

  useEffect(() => {
    if (step >= total) {
      const t2 = setTimeout(() => triggerReveal(() => setRoute('dashboard'), true), 700);
      return () => clearTimeout(t2);
    }
    const dur = 700 + Math.random() * 500;
    const id = setTimeout(() => setStep(step + 1), dur);
    return () => clearTimeout(id);
  }, [step, setRoute, triggerReveal, total]);

  useEffect(() => {
    if (step >= total) {
      setTyped(t('dash.title'));
      return;
    }
    const target = t(stepKeys[step]);
    setTyped('');
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(target.slice(0, i));
      if (i >= target.length) clearInterval(id);
    }, 22);
    return () => clearInterval(id);
  }, [step, t, stepKeys, total]);

  const pct = Math.min(100, Math.round((step / total) * 100));

  return (
    <section className="relative w-full h-full overflow-hidden page-in">
      <MassiveText opacity={0.02}>LISTEN</MassiveText>
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8">
        <div className="relative w-80 h-80 mb-10">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-full border border-brand/40 ring-pulse"
              style={{ animationDelay: `${i * 0.8}s` }}
            />
          ))}
          <div className="absolute inset-0 rounded-full border border-white/10" />
          <div className="absolute inset-8 rounded-full border border-white/5" />
          <div className="absolute inset-16 rounded-full border border-white/5" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="font-display text-7xl text-brand">{pct}</div>
              <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/40">PERCENT</div>
            </div>
          </div>
          {[0, 72, 144, 216, 288].map((deg, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 w-2 h-2 -ml-1 -mt-1"
              style={{ transform: `rotate(${deg}deg) translateY(-160px)` }}
            >
              <div className="w-full h-full rounded-full bg-brand" style={{ opacity: i === step % 5 ? 1 : 0.25 }} />
            </div>
          ))}
        </div>
        <div className="text-center max-w-2xl">
          <Badge>PULSE · LIVE</Badge>
          <h1 className="font-display text-5xl md:text-7xl tracking-tight uppercase mt-4 mb-2">{t('loading.title')}</h1>
          <p className="text-sm md:text-base text-white/50">{t('loading.lede')}</p>
        </div>
        <div className="mt-10 w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5">
          <div className="font-mono text-[11px] text-white/80 mb-4 flex items-center gap-2">
            <span className="text-brand">›</span>
            <span>{typed}</span>
            <span className="caret text-brand">▌</span>
          </div>
          <div className="space-y-1.5 max-h-44 overflow-y-auto no-scrollbar">
            {stepKeys.map((k, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <div
                  key={k}
                  className={`flex items-center gap-3 font-mono text-[10px] tracking-[0.18em] uppercase transition ${
                    done ? 'text-white/40' : active ? 'text-white' : 'text-white/20'
                  }`}
                >
                  <span
                    className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                      done ? 'border-brand bg-brand' : active ? 'border-brand' : 'border-white/20'
                    }`}
                  >
                    {done && (
                      <svg width="8" height="8" viewBox="0 0 12 12">
                        <path d="M2 6 L5 9 L10 3" stroke="white" strokeWidth="2" fill="none" />
                      </svg>
                    )}
                    {active && <span className="w-1 h-1 rounded-full bg-brand blink"></span>}
                  </span>
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <span>{t(k)}</span>
                </div>
              );
            })}
          </div>
        </div>
        <button
          onClick={() => triggerReveal(() => setRoute('select'), false)}
          className="mt-6 font-mono text-[10px] tracking-[0.28em] uppercase text-white/40 hover:text-brand transition"
        >
          ✕ {t('loading.cancel')}
        </button>
      </div>
    </section>
  );
}
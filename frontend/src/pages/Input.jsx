import React from 'react';

export default function Input({ t, setRoute, store, setStore, triggerReveal }) {
  const next = () => triggerReveal(() => setRoute('select'), true);
  const back = () => triggerReveal(() => setRoute('home'), false);

  return (
    <section className="relative w-full h-full overflow-hidden page-in">
      <MassiveText opacity={0.02}>BRIEF</MassiveText>

      <div className="absolute inset-0 z-10 px-8 md:px-14 pt-24 pb-16 flex flex-col">
        <div className="max-w-[1400px] w-full mx-auto flex items-end justify-between mb-8">
          <div>
            <Badge>{t('input.kicker')}</Badge>
            <h1 className="font-display leading-[0.82] tracking-tight mt-3">
              <div className="text-5xl md:text-7xl title-solid-white">{t('input.title')}</div>
              <div className="text-5xl md:text-7xl title-outline -mt-1">{t('input.title2')}</div>
            </h1>
            <p className="mt-4 max-w-xl text-sm md:text-base text-white/50">{t('input.lede')}</p>
          </div>
          <div className="hidden md:flex items-center gap-3 font-mono text-[10px] tracking-[0.28em] uppercase text-white/40">
            <span>STEP</span>
            <span className="text-white text-2xl font-display">01</span>
            <span className="text-white/30">/ 04</span>
          </div>
        </div>

        <div className="max-w-[1400px] w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-5 flex-1 min-h-0">
          <Card label={t('input.agency.title')} index="01">
            <Field
              label={t('input.agency.name')}
              value={store.agencyName}
              onChange={(v) => setStore({ ...store, agencyName: v })}
              placeholder="Mirage Studio"
            />
            <Field
              label={t('input.agency.site')}
              value={store.agencySite}
              onChange={(v) => setStore({ ...store, agencySite: v })}
              placeholder="mirage.studio"
            />
            <Field
              label={t('input.agency.desc')}
              value={store.agencyDesc}
              onChange={(v) => setStore({ ...store, agencyDesc: v })}
              placeholder="Influencer-led campaigns for emerging beauty brands"
              multiline
            />
          </Card>

          <Card label={t('input.brand.title')} index="02" featured>
            <Field
              label={`${t('input.brand.name')} *`}
              value={store.brandName}
              onChange={(v) => setStore({ ...store, brandName: v })}
              placeholder="Halo Skincare"
              hint={t('input.required')}
            />
            <Field
              label={t('input.brand.desc')}
              value={store.brandDesc}
              onChange={(v) => setStore({ ...store, brandDesc: v })}
              placeholder="Plant-based skincare for Gen-Z"
              multiline
            />
            <FileField label={t('input.brand.image')} cta={t('input.brand.upload')} />
          </Card>
        </div>

        <div className="max-w-[1400px] w-full mx-auto mt-6 flex items-center justify-between">
          <Btn variant="ghost" size="md" onClick={back} icon={null}>
            <ArrowLeft /> {t('select.back')}
          </Btn>
          <Btn onClick={next} icon={<ArrowRight />}>
            {t('input.next')}
          </Btn>
        </div>
      </div>
    </section>
  );
}

// ----- helper components (same as your original but exported locally) -----
function Card({ label, index, children, featured }) {
  return (
    <div
      className={`relative rounded-3xl border bg-white/[0.03] backdrop-blur-md p-6 md:p-8 flex flex-col ${
        featured ? 'border-brand/40 shadow-glow' : 'border-white/10'
      }`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/50">{label}</div>
        <div className="font-display text-3xl text-brand">{index}</div>
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, multiline, hint }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-2">
        <div className="font-mono text-[9px] tracking-[0.28em] uppercase text-white/40">{label}</div>
        {hint && <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-brand/70">{hint}</div>}
      </div>
      {multiline ? (
        <textarea
          rows={2}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:border-brand/50 focus:bg-white/10 outline-none transition font-sans text-sm resize-none"
        />
      ) : (
        <input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:border-brand/50 focus:bg-white/10 outline-none transition font-sans text-sm"
        />
      )}
    </label>
  );
}

function FileField({ label, cta }) {
  return (
    <div>
      <div className="font-mono text-[9px] tracking-[0.28em] uppercase text-white/40 mb-2">{label}</div>
      <div className="border border-dashed border-white/15 rounded-xl px-4 py-6 text-center stripe-bg cursor-pointer hover:border-brand/40 transition">
        <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/50">⬆ {cta}</div>
        <div className="font-mono text-[9px] tracking-[0.2em] text-white/25 mt-1">PNG · JPG · max 4MB</div>
      </div>
    </div>
  );
}

function Btn({ children, onClick, variant = 'primary', size = 'lg', icon }) {
  const sizes = { md: 'h-11 px-5 text-[11px]', lg: 'h-14 px-7 text-xs', xl: 'h-16 px-9 text-sm' };
  const base = `relative group inline-flex items-center justify-center gap-3 rounded-full font-mono font-bold tracking-[0.22em] uppercase transition-all ${sizes[size]} disabled:opacity-40 disabled:pointer-events-none`;
  const styles = {
    primary: 'bg-brand text-white hover:bg-white hover:text-black shadow-glow hover:shadow-glow-lg',
    ghost: 'border border-white/15 text-white hover:bg-white/5',
  };
  return (
    <button onClick={onClick} className={`${base} ${styles[variant]}`}>
      {children}
      {icon && <span className="text-base">{icon}</span>}
      {variant === 'primary' && (
        <span
          className="pointer-events-none absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition"
          style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.2) inset' }}
        />
      )}
    </button>
  );
}

function ArrowRight({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function ArrowLeft({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function Badge({ children }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 border border-brand/40 rounded-full text-[9px] md:text-[10px] font-mono font-bold tracking-[0.28em] uppercase text-brand">
      <span className="w-1 h-1 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}

function MassiveText({ opacity, children }) {
  return <div className="massive-text" style={{ color: `rgba(255,255,255,${opacity})` }}>{children}</div>;
}
// src/pages/Select.jsx
import React, { useEffect, useState } from 'react';
import Badge from '../components/ui/Badge';
import Btn from '../components/ui/Btn';
import MassiveText from '../components/ui/MassiveText';
import { ArrowLeft, ArrowRight, GlyphIG } from '../components/ui/Icons';

// ---------- FALLBACK DATA (same as your JSON, first 10 entries) ----------
const FALLBACK_INFLUENCERS = [
  { rank: "1", nom: "DORRA درة@dorra_zarrouk", handler: "dorra_zarrouk", followers_text: "17M", engagement_rate: "0.35%" },
  { rank: "2", nom: "Oumaima Taleb@oumaima_taleb", handler: "oumaima_taleb", followers_text: "4.9M", engagement_rate: "0.31%" },
  { rank: "3", nom: "Manel Amara / منال عمارة@manelamara", handler: "manelamara", followers_text: "4.8M", engagement_rate: "0.09%" },
  { rank: "4", nom: "Marwa Agrebi@marwa_agrebi_", handler: "marwa_agrebi_", followers_text: "3.5M", engagement_rate: "0.37%" },
  { rank: "5", nom: "Latifa لطيفة التونسية@latifaofficial", handler: "latifaofficial", followers_text: "3.4M", engagement_rate: "0.02%" },
  { rank: "6", nom: "Aicha Attia@atiaaichaofficial", handler: "atiaaichaofficial", followers_text: "3.2M", engagement_rate: "0.73%" },
  { rank: "7", nom: "Hichem Deux Neuf هشام دوناف@hichem.dn", handler: "hichem.dn", followers_text: "3.1M", engagement_rate: "2.51%" },
  { rank: "8", nom: "Ali Maaloul Official@maaloul_ali_", handler: "maaloul_ali_", followers_text: "3M", engagement_rate: "2.86%" },
  { rank: "9", nom: "Aicha Ben Ahmed عائشة بن أحمد@aichabahmed", handler: "aichabahmed", followers_text: "2.8M", engagement_rate: "0.88%" },
  { rank: "10", nom: "L A T I F A  R A A F A T@raafatlatifa", handler: "raafatlatifa", followers_text: "2.6M", engagement_rate: "0.06%" }
];

const MAX_SELECTION = 5;

const TIME_RANGES = [
  { value: '24h', label: '24 hours' },
  { value: '48h', label: '48 hours' },
  { value: '1w', label: '1 week' },
  { value: '2w', label: '2 weeks' },
  { value: '1m', label: '1 month' },
];

export default function Select({ t, setRoute, store, setStore, triggerReveal }) {
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHandles, setSelectedHandles] = useState(store.selectedInfluencers || []);
  const [analysisRange, setAnalysisRange] = useState(store.analysisRange || '1w');

  // Load JSON (with fallback)
  useEffect(() => {
    fetch('/tunisian_influencers.json')
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        if (data?.influencers?.length) setInfluencers(data.influencers);
        else throw new Error();
      })
      .catch(() => {
        console.warn('Using fallback influencer data');
        setInfluencers(FALLBACK_INFLUENCERS);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleSelect = (handler) => {
    setSelectedHandles(prev => {
      if (prev.includes(handler)) return prev.filter(h => h !== handler);
      if (prev.length >= MAX_SELECTION) {
        alert(`You can select up to ${MAX_SELECTION} influencers.`);
        return prev;
      }
      return [...prev, handler];
    });
  };

  const filtered = influencers.filter(inf =>
    inf.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inf.handler?.toLowerCase().includes(searchTerm.toLowerCase())
  );

    // In Select.jsx
    const startAnalysis = async () => {
    if (selectedHandles.length === 0) {
        alert('Please select at least one influencer.');
        return;
    }
    // Store selection locally
    setStore({ ...store, selectedInfluencers: selectedHandles, analysisRange });

    const payload = {
        influencers: selectedHandles,
        time_range: analysisRange,
        brand_name: store.brandName,
        brand_desc: store.brandDesc,
    };

    try {
        const res = await fetch('/api/start-analysis/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.job_id) {
        setStore(prev => ({ ...prev, jobId: data.job_id }));
        triggerReveal(() => setRoute('loading'), true);
        } else {
        alert('Failed to start analysis');
        }
    } catch (err) {
        alert('Network error: ' + err.message);
    }
    };

  if (loading) {
    return <div className="fixed inset-0 flex items-center justify-center text-white/60">Loading influencers...</div>;
  }

  // --- SAME STRUCTURE AS YOUR WORKING INPUT PAGE ---
  return (
    <div className="relative h-screen overflow-hidden">
      <div className="relative z-10 px-6 md:px-10 py-8 md:py-12 h-full">
        <div className="max-w-[1400px] mx-auto h-full flex flex-col">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
            <div>
              <Badge>{t('select.kicker')}</Badge>
              <h1 className="font-display leading-[0.82] tracking-tight mt-3">
                <div className="text-5xl md:text-7xl title-solid-white">Choose your</div>
                <div className="text-5xl md:text-7xl title-solid-red -mt-1">Target voices</div>
              </h1>
              <p className="mt-4 max-w-xl text-sm md:text-base text-white/50">
                Select up to {MAX_SELECTION} Tunisian influencers. We'll analyse their recent posts over the chosen time window.
              </p>
            </div>
            <div className="hidden md:flex flex-col items-end gap-1 font-mono text-[10px] tracking-[0.28em] uppercase text-white/40">
              <span>{t('select.selected')}</span>
              <span className="text-white text-3xl font-display">
                {selectedHandles.length}<span className="text-white/30 text-lg">/{MAX_SELECTION}</span>
              </span>
            </div>
          </div>

          {/* Two‑column layout – uses flex-1 min-h-0 to fill remaining height */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
            {/* Left column – influencer list */}
            <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md flex flex-col min-h-0 overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <input
                  type="text"
                  placeholder="Search by name or handle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand/50"
                />
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
                {filtered.map(inf => {
                  const isSelected = selectedHandles.includes(inf.handler);
                  return (
                    <button
                      key={inf.rank}
                      onClick={() => toggleSelect(inf.handler)}
                      className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition ${
                        isSelected ? 'bg-brand/10 border border-brand/40 shadow-glow' : 'bg-white/[0.02] border border-white/10 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand/40 to-brand/10 flex items-center justify-center font-display text-sm shrink-0">
                        {inf.nom?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-sm text-white truncate">@{inf.handler}</div>
                        <div className="font-sans text-xs text-white/60 truncate">{inf.nom}</div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <div className="font-display text-sm tracking-tight">{inf.followers_text}</div>
                        <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/35">followers</div>
                      </div>
                      <div className="text-right hidden md:block min-w-[70px]">
                        <div className="font-display text-sm text-white/80">{inf.engagement_rate}</div>
                        <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/35">engagement</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${isSelected ? 'border-brand bg-brand' : 'border-white/20'}`}>
                        {isSelected && <svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 6 L5 9 L10 3" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right column – selection + time range */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 flex flex-col gap-5 min-h-0">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <GlyphIG size={20} />
                  <h3 className="font-display text-xl tracking-tight uppercase">Your selection</h3>
                </div>
                {selectedHandles.length === 0 && <p className="text-white/40 text-sm">No influencers selected yet.</p>}
                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                  {selectedHandles.map(handle => {
                    const inf = influencers.find(i => i.handler === handle);
                    return inf ? (
                      <div key={handle} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                        <div className="min-w-0">
                          <div className="font-mono text-xs text-white truncate">@{inf.handler}</div>
                          <div className="text-[11px] text-white/50 truncate">{inf.nom}</div>
                        </div>
                        <button onClick={() => toggleSelect(handle)} className="text-white/40 hover:text-white/80 text-sm">✕</button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
              <div>
                <h3 className="font-mono text-[10px] tracking-[0.28em] text-brand mb-3">ANALYSIS WINDOW</h3>
                <div className="flex flex-wrap gap-2">
                  {TIME_RANGES.map(range => (
                    <button
                      key={range.value}
                      onClick={() => setAnalysisRange(range.value)}
                      className={`px-3 py-1.5 rounded-md font-mono text-[11px] uppercase tracking-[0.12em] transition ${
                        analysisRange === range.value ? 'bg-brand text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-white/35 mt-2">Posts & engagement within this period will be analysed by AI.</p>
              </div>
            </div>
          </div>

          {/* Bottom navigation */}
          <div className="mt-6 flex items-center justify-between">
            <Btn variant="ghost" size="md" onClick={() => triggerReveal(() => setRoute('input'), false)}>
              <ArrowLeft /> {t('select.back')}
            </Btn>
            <Btn onClick={startAnalysis} icon={<ArrowRight />}>
              {t('select.start')}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
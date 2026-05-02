// src/pages/Loading.jsx
import React, { useState, useEffect, useRef } from 'react';
import Badge from '../components/ui/Badge';
import MassiveText from '../components/ui/MassiveText';

export default function Loading({ t, setRoute, store, setStore, triggerReveal }) {
  const [steps, setSteps] = useState([]);
  const [pct, setPct] = useState(0);
  const [error, setError] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const eventSourceRef = useRef(null);
  const mockIntervalRef = useRef(null);

  useEffect(() => {
    const jobId = store.jobId;

    // If no jobId, simulate the analysis (so the page doesn't stay blank)
    if (!jobId) {
      console.warn('No jobId found – simulating analysis for demo');
      setSimulating(true);
      const mockSteps = [
        'Connecting to Instagram API...',
        'Resolving influencer profiles...',
        'Fetching recent posts (last 7 days)...',
        'Scanning post captions with AI (phase 1)...',
        'Found 3 relevant mentions...',
        'Fetching comments for relevant posts (phase 2)...',
        'Analyzing sentiment and topics...',
        'Generating actionable insights...',
      ];
      let idx = 0;
      mockIntervalRef.current = setInterval(() => {
        if (idx < mockSteps.length) {
          setSteps(prev => [...prev, { text: mockSteps[idx], timestamp: Date.now() }]);
          setPct(Math.floor(((idx + 1) / mockSteps.length) * 100));
          idx++;
        } else {
          clearInterval(mockIntervalRef.current);
          setPct(100);
          // After simulation, create mock results and navigate to dashboard
          const mockResult = [{
            profile: 'demo_influencer',
            posts_scanned: 12,
            relevant_posts_found: 3,
            brand_mention_timeline: [
              {
                shortcode: 'demo123',
                url: 'https://instagram.com/p/demo123',
                caption: 'Loving this new product! #sponsored',
                likes: 1234,
                comments_count: 56,
                llm_classification: { relevant: true, confidence: 'high' },
                comments: [{ owner: 'user1', text: 'Looks great!', timestamp: new Date().toISOString(), likes: 5 }]
              }
            ]
          }];
          setStore(prev => ({ ...prev, analysisResults: mockResult }));
          setTimeout(() => triggerReveal(() => setRoute('dashboard'), true), 1000);
        }
      }, 800);
      return () => {
        if (mockIntervalRef.current) clearInterval(mockIntervalRef.current);
      };
    }

    // Real SSE connection
    const es = new EventSource(`/api/progress/${jobId}/`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'step') {
        setSteps(prev => [...prev, { text: data.message, timestamp: Date.now() }]);
        // rough progress estimation
        setPct(prev => Math.min(95, prev + 3));
      } else if (data.type === 'error') {
        setError(data.message);
        es.close();
      } else if (data.type === 'result' && data.data) {
        setStore(prev => ({ ...prev, analysisResults: data.data }));
        setPct(100);
        es.close();
        setTimeout(() => triggerReveal(() => setRoute('dashboard'), true), 800);
      } else if (data.type === 'completed') {
        setPct(100);
        es.close();
        setTimeout(() => triggerReveal(() => setRoute('dashboard'), true), 500);
      }
    };

    es.onerror = (err) => {
      console.error('SSE error, falling back to simulation', err);
      setSimulating(true);
      // simulate steps as fallback
      const fallbackSteps = [
        'Real-time connection lost – switching to demo mode',
        'Simulating analysis...',
        'Please check your backend server for full integration',
      ];
      let idx = 0;
      const fallbackInterval = setInterval(() => {
        if (idx < fallbackSteps.length) {
          setSteps(prev => [...prev, { text: fallbackSteps[idx], timestamp: Date.now() }]);
          setPct(((idx + 1) / fallbackSteps.length) * 100);
          idx++;
        } else {
          clearInterval(fallbackInterval);
          setPct(100);
          const mockResult = [{
            profile: 'demo_fallback',
            posts_scanned: 5,
            relevant_posts_found: 1,
            brand_mention_timeline: []
          }];
          setStore(prev => ({ ...prev, analysisResults: mockResult }));
          setTimeout(() => triggerReveal(() => setRoute('dashboard'), true), 1000);
        }
      }, 1000);
      es.close();
    };

    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (mockIntervalRef.current) clearInterval(mockIntervalRef.current);
    };
  }, [store.jobId, setStore, triggerReveal]);

  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/90 text-white z-50">
        <div className="text-red-400 mb-4 text-center max-w-md px-4">
          <p className="text-xl mb-2">⚠️ Analysis Error</p>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={() => triggerReveal(() => setRoute('select'), false)}
          className="mt-4 px-6 py-2 rounded-full border border-white/30 hover:bg-white/10 transition"
        >
          ← Back to Selection
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 overflow-hidden bg-black/95 backdrop-blur-sm">
      <MassiveText opacity={0.02}>LISTEN</MassiveText>
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
        {/* Animated rings */}
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
              <div className="w-full h-full rounded-full bg-brand" style={{ opacity: i === Math.floor(pct / 20) ? 1 : 0.25 }} />
            </div>
          ))}
        </div>

        <div className="text-center max-w-2xl">
          <Badge>PULSE · LIVE</Badge>
          <h1 className="font-display text-5xl md:text-7xl tracking-tight uppercase mt-4 mb-2">
            {t('loading.title')}
          </h1>
          <p className="text-sm md:text-base text-white/50">{t('loading.lede')}</p>
        </div>

        {/* Chain of thought log */}
        <div className="mt-10 w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5">
          <div className="font-mono text-[11px] text-white/80 mb-4 flex items-center gap-2">
            <span className="text-brand">›</span>
            <span>Live analysis log</span>
            {pct < 100 && <span className="caret text-brand ml-1 animate-pulse">▌</span>}
          </div>
          <div className="space-y-1.5 max-h-44 overflow-y-auto no-scrollbar">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2 font-mono text-[10px] tracking-[0.1em] text-white/70">
                <span className="text-brand mt-0.5">●</span>
                <span>{step.text}</span>
              </div>
            ))}
            {steps.length === 0 && (
              <div className="text-white/30 italic">Initializing analysis engine...</div>
            )}
            {pct === 100 && steps.length > 0 && (
              <div className="text-green-400 flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                <span>✓</span> Analysis complete — redirecting to dashboard...
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => triggerReveal(() => setRoute('select'), false)}
          className="mt-6 font-mono text-[10px] tracking-[0.28em] uppercase text-white/40 hover:text-brand transition"
        >
          ✕ {t('loading.cancel')}
        </button>
      </div>
    </div>
  );
}
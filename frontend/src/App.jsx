// src/App.jsx
import React, { useState, useMemo, useCallback } from 'react';
import Home from './pages/Home';
import Input from './pages/Input';
import Select from './pages/Select';
import Loading from './pages/Loading';
import Dashboard from './pages/Dashboard';
import TopNav from './components/layout/TopNav';
import Footer from './components/layout/Footer';
import Backdrop from './components/layout/Backdrop';
import { makeT } from './i18n';

export default function App() {
  const [route, setRoute] = useState('home');
  const [lang, setLang] = useState('en');
  
  
  const [store, setStore] = useState({
    agencyName: '',
    agencySite: '',
    agencyDesc: '',
    brandName: '',
    brandDesc: '',
    selectedInfluencers: [],
    analysisRange: '1w',
    jobId: null,          // added for SSE
    analysisResults: null, // added to hold final data
  });
  const [reveal, setReveal] = useState(false);
  const t = useMemo(() => makeT(lang), [lang]);

  const triggerReveal = useCallback((cb, critical = false) => {
    if (!critical) {
      cb?.();
      return;
    }
    setReveal(true);
    setTimeout(() => { cb?.(); }, 280);
    setTimeout(() => setReveal(false), 600);
  }, []);

  const PageComponent = {
    home: Home,
    input: Input,
    select: Select,
    loading: Loading,
    dashboard: Dashboard,
  }[route];

  return (
    <div className="relative w-full min-h-screen">
      <Backdrop />
      <TopNav
        route={route}
        setRoute={(r) => triggerReveal(() => setRoute(r), false)}
        lang={lang}
        setLang={setLang}
        t={t}
      />
      <main className="relative w-full h-full">
        <PageComponent
          t={t}
          setRoute={setRoute}
          store={store}
          setStore={setStore}
          triggerReveal={triggerReveal}
        />
      </main>
      <Footer t={t} />
      <div className={`reveal-curtain ${reveal ? 'open' : ''}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="font-display text-[160px] tracking-tighter text-white/10 select-none">PULSE</div>
        </div>
      </div>
    </div>
  );
}
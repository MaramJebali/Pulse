import React from 'react';
import Starfield from '../ui/Starfield';

export default function Backdrop() {
  return (
    <>
      <Starfield />
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0, background: 'linear-gradient(180deg, #020205 0%, #000000 100%)' }} />
      <div className="halo bg-brand/30" style={{ width: 520, height: 520, left: '-10%', top: '20%' }} />
      <div className="halo bg-brand/20" style={{ width: 420, height: 420, right: '-8%', bottom: '0%' }} />
    </>
  );
}
import React from 'react';

export default function MassiveText({ children, opacity = 0.025 }) {
  return (
    <div className="absolute inset-0 pointer-events-none select-none text-[15vw] md:text-[10vw] font-black whitespace-nowrap flex items-center justify-center" style={{ color: `rgba(255,255,255,${opacity})` }}>
      {children}
    </div>
  );
}
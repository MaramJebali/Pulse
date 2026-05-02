import React, { useRef, useEffect } from 'react';

export default function Starfield() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const lowMemory = (navigator.deviceMemory || 8) < 4;
    const lowPower = reduceMotion || isMobile || lowMemory;

    let stars = [];
    let shootingStars = [];
    let frame = 0;
    let lastFrame = 0;
    let raf;

    const initStars = () => {
      const count = lowPower ? 80 : 160;
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        baseAlpha: Math.random() * 0.6 + 0.2,
        vy: 0.1 + Math.random() * 0.3,
        ts: Math.random() * 0.01 + 0.003,
        to: Math.random() * Math.PI * 2,
      }));
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const targetFPS = lowPower ? 30 : 60;
    const interval = 1000 / targetFPS;

    const draw = (timestamp) => {
      if (document.hidden) {
        raf = requestAnimationFrame(draw);
        return;
      }
      if (timestamp - lastFrame < interval) {
        raf = requestAnimationFrame(draw);
        return;
      }
      lastFrame = timestamp;
      frame++;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let s of stars) {
        s.y += s.vy;
        if (s.y > canvas.height) {
          s.y = -10;
          s.x = Math.random() * canvas.width;
        }
        const twinkle = 0.6 + 0.4 * Math.sin(frame * s.ts + s.to);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.baseAlpha * twinkle})`;
        ctx.fill();
      }

      if (!lowPower && frame % 180 === 0 && shootingStars.length < 2) {
        shootingStars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height * 0.4,
          vx: -5 - Math.random() * 5,
          vy: 3 + Math.random() * 4,
          life: 0,
          maxLife: 40,
        });
      }

      shootingStars = shootingStars.filter(s => s.life < s.maxLife);
      for (let s of shootingStars) {
        s.life++;
        s.x += s.vx;
        s.y += s.vy;
        const alpha = s.life / s.maxLife < 0.2 ? (s.life / s.maxLife) / 0.2 : s.life / s.maxLife > 0.8 ? 1 - ((s.life / s.maxLife) - 0.8) / 0.2 : 1;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 8, s.y - s.vy * 8);
        ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.6})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} />;
}
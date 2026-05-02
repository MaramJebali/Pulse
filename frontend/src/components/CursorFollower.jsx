function CursorFollower() {
  const dotRef = React.useRef(null);
  const ringRef = React.useRef(null);
  const stateRef = React.useRef({ tx: -100, ty: -100, x: -100, y: -100, hover: false, raf: 0 });

  React.useEffect(() => {
    if (window.matchMedia('(max-width: 768px)').matches) return;

    const s = stateRef.current;

    const move = (e) => {
      s.tx = e.clientX; s.ty = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX - 2}px, ${e.clientY - 2}px)`;
      }
    };
    const over = (e) => {
      const t = e.target;
      const interactive = t.closest && t.closest('a, button, [role=button], [data-cursor=hover]');
      s.hover = !!interactive;
    };

    const tick = () => {
      s.x += (s.tx - s.x) * 0.18;
      s.y += (s.ty - s.y) * 0.18;
      if (ringRef.current) {
        const sc = s.hover ? 1.8 : 1;
        ringRef.current.style.transform = `translate(${s.x - 14}px, ${s.y - 14}px) scale(${sc})`;
        ringRef.current.style.borderColor = s.hover ? '#FF3B2E' : 'rgba(255,255,255,0.6)';
      }
      s.raf = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseover', over);
    s.raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(s.raf);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseover', over);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="hidden md:block fixed top-0 left-0 w-1 h-1 bg-brand rounded-full pointer-events-none" style={{ zIndex: 100, willChange: 'transform' }} />
      <div ref={ringRef} className="hidden md:block fixed top-0 left-0 w-7 h-7 rounded-full border pointer-events-none" style={{ zIndex: 100, borderColor: 'rgba(255,255,255,0.6)', willChange: 'transform', transition: 'border-color .2s' }} />
    </>
  );
}

window.CursorFollower = CursorFollower;

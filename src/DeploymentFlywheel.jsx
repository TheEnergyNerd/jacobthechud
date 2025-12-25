import React, { useState, useEffect } from 'react';

const fonts = { heading: 'Georgia, serif', body: 'Inter, system-ui, sans-serif' };

const stages = [
  { year: 0, label: 'Day 1', robots: 1, dataHours: 0, autonomy: 70, models: 0 },
  { year: 0.08, label: 'Mo 1', robots: 10, dataHours: 400, autonomy: 72, models: 1 },
  { year: 0.25, label: 'Mo 3', robots: 50, dataHours: 2000, autonomy: 76, models: 3 },
  { year: 0.5, label: 'Mo 6', robots: 200, dataHours: 8000, autonomy: 82, models: 6 },
  { year: 1, label: 'Yr 1', robots: 1000, dataHours: 40000, autonomy: 88, models: 12 },
  { year: 2, label: 'Yr 2', robots: 10000, dataHours: 400000, autonomy: 93, models: 24 },
  { year: 3, label: 'Yr 3', robots: 50000, dataHours: 2000000, autonomy: 96, models: 36 },
  { year: 5, label: 'Yr 5', robots: 500000, dataHours: 20000000, autonomy: 98, models: 60 },
  { year: 7, label: 'Yr 7', robots: 2000000, dataHours: 100000000, autonomy: 99, models: 84 },
  { year: 10, label: 'Yr 10', robots: 10000000, dataHours: 500000000, autonomy: 99.5, models: 120 },
];

const fmt = (n) => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return n.toString();
};

export default function DeploymentFlywheel() {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setIdx(i => {
        if (i >= stages.length - 1) { setPlaying(false); return i; }
        return i + 1;
      });
    }, 900);
    return () => clearInterval(t);
  }, [playing]);

  const cur = stages[idx];
  const cx = 300, cy = 240;

  const pts = stages.map((_, i) => {
    const p = i / (stages.length - 1);
    const a = p * Math.PI * 2 - Math.PI / 2;
    const r = 120 + p * 80;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: fonts.body }}>
      <div style={{ maxWidth: '950px', margin: '0 auto', padding: '24px' }}>
        
        <header style={{ marginBottom: '20px', borderBottom: '2px solid #111', paddingBottom: '12px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111', fontFamily: fonts.heading, margin: 0 }}>
            The Deployment Data Flywheel
          </h1>
          <p style={{ color: '#666', fontSize: '14px', margin: '8px 0 0' }}>
            Deploy → Collect Data → Train Models → Deploy More. The cycle that builds an unassailable moat.
          </p>
        </header>

        {/* Main Visualization */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
          <svg viewBox="0 0 600 480" style={{ width: '100%', height: '440px' }}>
            <defs>
              <linearGradient id="spiralG" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            </defs>
            
            {/* Background track */}
            <path d={pts.reduce((p, pt, i) => i === 0 ? `M ${pt.x} ${pt.y}` : `${p} L ${pt.x} ${pt.y}`, '')}
              fill="none" stroke="#e5e7eb" strokeWidth="8" strokeLinecap="round" />
            
            {/* Active track */}
            <path d={pts.slice(0, idx + 1).reduce((p, pt, i) => i === 0 ? `M ${pt.x} ${pt.y}` : `${p} L ${pt.x} ${pt.y}`, '')}
              fill="none" stroke="url(#spiralG)" strokeWidth="8" strokeLinecap="round" style={{ transition: 'all 0.3s' }} />

            {/* Stage nodes */}
            {stages.map((s, i) => {
              const pt = pts[i];
              const active = i === idx, past = i < idx;
              const sz = active ? 24 : past ? 18 : 14;
              return (
                <g key={i} style={{ cursor: 'pointer' }} onClick={() => { setIdx(i); setPlaying(false); }}>
                  <circle cx={pt.x} cy={pt.y} r={sz}
                    fill={active ? '#2563eb' : past ? '#059669' : '#f1f5f9'}
                    stroke={active ? '#1d4ed8' : past ? '#047857' : '#d1d5db'} strokeWidth="2" />
                  <text x={pt.x} y={pt.y + 4} textAnchor="middle" fontSize={active ? '10' : '8'} fontWeight="600"
                    fill={active || past ? '#fff' : '#666'}>{s.label}</text>
                </g>
              );
            })}

            {/* Center circle with stats */}
            <circle cx={cx} cy={cy} r="95" fill="#f8fafc" stroke="#e5e7eb" strokeWidth="2" />
            
            {/* Robots */}
            <text x={cx - 45} y={cy - 30} fontSize="9" fill="#666" fontWeight="500">ROBOTS</text>
            <text x={cx - 45} y={cy - 12} fontSize="22" fill="#2563eb" fontWeight="700" fontFamily={fonts.heading}>{fmt(cur.robots)}</text>
            
            {/* Data */}
            <text x={cx + 15} y={cy - 30} fontSize="9" fill="#666" fontWeight="500">DATA</text>
            <text x={cx + 15} y={cy - 12} fontSize="22" fill="#059669" fontWeight="700" fontFamily={fonts.heading}>{fmt(cur.dataHours)}</text>
            
            {/* Models */}
            <text x={cx - 20} y={cy + 20} fontSize="9" fill="#666" fontWeight="500">MODELS</text>
            <text x={cx - 20} y={cy + 40} fontSize="22" fill="#7c3aed" fontWeight="700" fontFamily={fonts.heading}>{cur.models}</text>
            
            {/* Autonomy */}
            <text x={cx} y={cy + 70} textAnchor="middle" fontSize="13" fill="#f59e0b" fontWeight="600" fontFamily={fonts.heading}>
              {cur.autonomy}% Autonomous
            </text>
          </svg>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'Robots', value: fmt(cur.robots), color: '#2563eb' },
            { label: 'Data Hours', value: fmt(cur.dataHours), color: '#059669' },
            { label: 'Models', value: cur.models, color: '#7c3aed' },
            { label: 'Autonomy', value: `${cur.autonomy}%`, color: '#f59e0b' },
            { label: 'Timeline', value: cur.label, color: '#111' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '12px', textAlign: 'center', borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: s.color, fontFamily: fonts.heading }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => { if (idx >= stages.length - 1) setIdx(0); setPlaying(!playing); }}
            style={{ padding: '10px 20px', background: playing ? '#666' : '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', minWidth: '80px' }}>
            {playing ? 'Pause' : 'Play'}
          </button>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#666' }}>Day 1</span>
            <div style={{ flex: 1, display: 'flex', gap: '3px' }}>
              {stages.map((_, i) => (
                <div key={i} onClick={() => { setIdx(i); setPlaying(false); }}
                  style={{ flex: 1, height: '10px', borderRadius: '2px', background: i === idx ? '#2563eb' : i < idx ? '#059669' : '#e5e7eb', cursor: 'pointer' }} />
              ))}
            </div>
            <span style={{ fontSize: '11px', color: '#666' }}>Year 10</span>
          </div>
        </div>

        {/* Insight */}
        <div style={{ background: 'linear-gradient(135deg, #059669, #047857)', borderRadius: '6px', padding: '18px', color: '#fff' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px', fontFamily: fonts.heading }}>The Unassailable Moat</div>
          <p style={{ fontSize: '13px', margin: 0, lineHeight: 1.6 }}>
            By Year 10: <strong>10M robots</strong> have generated <strong>500M hours</strong> of real-world training data and shipped <strong>120 model updates</strong>. 
            That's 57,000 robot-years of experience. A competitor starting today would need decades to catch up.
          </p>
        </div>

        <footer style={{ marginTop: '16px', textAlign: 'center', color: '#999', fontSize: '10px' }}>
          10-year deployment projection showing compounding data advantage
        </footer>
      </div>
    </div>
  );
}

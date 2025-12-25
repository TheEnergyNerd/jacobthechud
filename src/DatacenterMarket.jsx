import React, { useState } from 'react';

const fonts = { heading: 'Georgia, serif', body: 'Inter, system-ui, sans-serif' };

const segments = [
  { label: 'Hyperscaler CapEx', value: 405, growth: 62, color: '#2563eb', desc: 'AWS, Azure, GCP, Meta' },
  { label: 'AI Servers & GPUs', value: 204, growth: 76, color: '#7c3aed', desc: 'NVIDIA, AMD, custom silicon' },
  { label: 'Supply Chain', value: 180, growth: 30, color: '#8b5cf6', desc: 'Foxconn, ODMs, components' },
  { label: 'Construction', value: 85, growth: 45, color: '#059669', desc: 'New builds, prefab' },
  { label: 'Power Systems', value: 65, growth: 35, color: '#d97706', desc: 'Generation, UPS, grid' },
  { label: 'Networking', value: 42, growth: 40, color: '#ec4899', desc: 'Switches, optical' },
  { label: 'Operations', value: 35, growth: 25, color: '#f97316', desc: 'Staffing, maintenance' },
  { label: 'Cooling', value: 28, growth: 55, color: '#06b6d4', desc: 'Liquid cooling, HVAC' },
];

const projections = [
  { year: 2024, value: 290 },
  { year: 2025, value: 405 },
  { year: 2026, value: 520 },
  { year: 2027, value: 680 },
  { year: 2028, value: 820 },
  { year: 2029, value: 920 },
  { year: 2030, value: 1000 },
];

const total = segments.reduce((s, x) => s + x.value, 0);

export default function DatacenterMarket() {
  const [hoveredSeg, setHoveredSeg] = useState(null);
  const [showProjection, setShowProjection] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: fonts.body }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px' }}>
        
        <header style={{ marginBottom: '20px', borderBottom: '2px solid #111', paddingBottom: '12px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111', fontFamily: fonts.heading, margin: 0 }}>
            AI Datacenter Market Sizing
          </h1>
          <p style={{ color: '#666', fontSize: '14px', margin: '8px 0 0' }}>
            $1T+ market by 2030 — the foundation for robotics deployment at scale
          </p>
        </header>

        {/* Hero Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Total Market 2025', value: `$${total}B+`, color: '#2563eb' },
            { label: 'Q3 2025 Single Quarter', value: '$142B', color: '#059669' },
            { label: 'Stargate Commitment', value: '$500B', color: '#7c3aed' },
            { label: 'New Capacity', value: '10GW+', color: '#f59e0b' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', textAlign: 'center', borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: s.color, fontFamily: fonts.heading }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '16px' }}>
          {/* Main Chart */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 16px', fontFamily: fonts.heading }}>Market Segments (2025)</h3>
            
            {segments.map((seg, i) => {
              const pct = (seg.value / total) * 100;
              const isHovered = hoveredSeg === i;
              return (
                <div key={i} style={{ marginBottom: '12px' }}
                  onMouseEnter={() => setHoveredSeg(i)}
                  onMouseLeave={() => setHoveredSeg(null)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: isHovered ? 600 : 400 }}>{seg.label}</span>
                    <span style={{ fontSize: '12px', fontFamily: fonts.heading, fontWeight: 600 }}>${seg.value}B</span>
                  </div>
                  <div style={{ height: '24px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ 
                      width: `${pct}%`, height: '100%', background: seg.color,
                      transition: 'all 0.2s', opacity: isHovered ? 1 : 0.85,
                    }} />
                    {isHovered && (
                      <div style={{ position: 'absolute', right: '8px', top: '4px', fontSize: '10px', color: '#fff', fontWeight: 500 }}>
                        {seg.desc} • +{seg.growth}% YoY
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Projection */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0, fontFamily: fonts.heading }}>Path to $1T</h3>
              <button onClick={() => setShowProjection(!showProjection)}
                style={{ padding: '6px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
                {showProjection ? 'Reset' : 'Animate'}
              </button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '200px', marginBottom: '8px' }}>
              {projections.map((p, i) => {
                const h = (p.value / 1000) * 180;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ 
                      width: '100%', 
                      height: showProjection ? `${h}px` : '20px',
                      background: p.year === 2030 ? '#059669' : '#2563eb',
                      borderRadius: '4px 4px 0 0',
                      transition: `height 0.5s ease ${i * 0.1}s`,
                    }} />
                  </div>
                );
              })}
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              {projections.map((p, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#666' }}>{p.year}</div>
                  <div style={{ fontSize: '11px', fontWeight: 600, fontFamily: fonts.heading }}>${p.value >= 1000 ? '1T' : p.value + 'B'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Robotics Opportunity */}
        <div style={{ marginTop: '16px', background: 'linear-gradient(135deg, #059669, #047857)', borderRadius: '8px', padding: '20px', color: '#fff' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px', fontFamily: fonts.heading }}>The Robotics Opportunity</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { label: 'Construction', value: '$85B', desc: 'Site prep, installation, assembly' },
              { label: 'Operations', value: '$35B', desc: 'Maintenance, repairs, monitoring' },
              { label: 'Supply Chain', value: '$180B', desc: 'Server assembly, logistics' },
            ].map((item, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '6px', padding: '14px' }}>
                <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '4px' }}>{item.label}</div>
                <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: fonts.heading }}>{item.value}</div>
                <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>{item.desc}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '13px', margin: '16px 0 0', opacity: 0.95, lineHeight: 1.5 }}>
            These three segments represent <strong>$300B in annual TAM</strong> for robotics automation. 
            As datacenter buildout accelerates, labor becomes the bottleneck—creating massive pull for robotic labor.
          </p>
        </div>

        <footer style={{ marginTop: '16px', textAlign: 'center', color: '#999', fontSize: '10px' }}>
          Data: Company filings, Synergy Research, Bloomberg (2024-2025)
        </footer>
      </div>
    </div>
  );
}

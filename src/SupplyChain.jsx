import React, { useState } from 'react';

// Two fonts only
const fonts = { heading: 'Georgia, serif', body: 'Inter, system-ui, sans-serif' };

const FlaskIcon = ({ color = '#dc2626' }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M9 3h6v6l4 8a2 2 0 01-2 2H7a2 2 0 01-2-2l4-8V3z" />
  </svg>
);

const GearIcon = ({ color = '#7c3aed' }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

const RobotIcon = ({ color = '#059669' }) => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <rect x="5" y="8" width="14" height="10" rx="2" />
    <circle cx="9" cy="13" r="1" fill={color} />
    <circle cx="15" cy="13" r="1" fill={color} />
    <path d="M12 4v4M8 4h8" />
  </svg>
);

const DonutChart = ({ percentage, color, size = 70 }) => {
  const r = 28, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 70 70">
      <circle cx="35" cy="35" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
      <circle cx="35" cy="35" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c - (percentage / 100) * c} transform="rotate(-90 35 35)" />
    </svg>
  );
};

export default function SupplyChainVisual() {
  const [activePanel, setActivePanel] = useState('rareearths');

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: fonts.body }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        
        <header style={{ marginBottom: '16px', borderBottom: '2px solid #111', paddingBottom: '10px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111', fontFamily: fonts.heading, margin: 0 }}>
            Robotics Supply Chain: Bottlenecks & Solutions
          </h1>
          <p style={{ color: '#666', fontSize: '13px', margin: '6px 0 0' }}>
            Two chokepoints in the middle of the stack—both more solvable than they appear
          </p>
        </header>

        {/* Pipeline */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '16px', marginBottom: '16px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', minWidth: '800px', gap: '8px' }}>
            
            {/* Raw Materials */}
            <div style={{ flex: '0 0 120px' }}>
              <div style={{ fontSize: '9px', fontWeight: 600, color: '#059669', marginBottom: '6px', textAlign: 'center' }}>RAW MATERIALS</div>
              <div style={{ padding: '10px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>Rare Earth Ores</div>
                <div style={{ fontSize: '10px', color: '#059669' }}>Global deposits</div>
                <div style={{ fontSize: '9px', background: '#dcfce7', color: '#059669', padding: '2px 6px', borderRadius: '2px', display: 'inline-block', marginTop: '4px' }}>LOW</div>
              </div>
            </div>

            <div style={{ color: '#059669', fontSize: '18px' }}>→</div>

            {/* Processing */}
            <div style={{ flex: '0 0 140px' }}>
              <div style={{ fontSize: '9px', fontWeight: 600, color: '#dc2626', marginBottom: '6px', textAlign: 'center' }}>⚠ PROCESSING</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ padding: '8px', background: '#fff', border: '2px solid #dc2626', borderRadius: '6px', cursor: 'pointer' }} onClick={() => setActivePanel('rareearths')}>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>Rare Earth Oxides</div>
                  <div style={{ fontSize: '10px', color: '#dc2626' }}>China 85%</div>
                  <div style={{ fontSize: '9px', background: '#fef2f2', color: '#dc2626', padding: '2px 6px', borderRadius: '2px', display: 'inline-block', marginTop: '2px' }}>HIGH</div>
                </div>
                <div style={{ padding: '8px', background: '#fff', border: '2px solid #dc2626', borderRadius: '6px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>Magnets</div>
                  <div style={{ fontSize: '10px', color: '#dc2626' }}>China 90%</div>
                  <div style={{ fontSize: '9px', background: '#fef2f2', color: '#dc2626', padding: '2px 6px', borderRadius: '2px', display: 'inline-block', marginTop: '2px' }}>HIGH</div>
                </div>
              </div>
            </div>

            <div style={{ color: '#dc2626', fontSize: '18px' }}>→</div>

            {/* Precision */}
            <div style={{ flex: '0 0 140px' }}>
              <div style={{ fontSize: '9px', fontWeight: 600, color: '#7c3aed', marginBottom: '6px', textAlign: 'center' }}>⚠ PRECISION</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ padding: '8px', background: '#fff', border: '2px solid #7c3aed', borderRadius: '6px', cursor: 'pointer' }} onClick={() => setActivePanel('reducers')}>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>Harmonic Drives</div>
                  <div style={{ fontSize: '10px', color: '#7c3aed' }}>Japan 60%</div>
                  <div style={{ fontSize: '9px', background: '#f5f3ff', color: '#7c3aed', padding: '2px 6px', borderRadius: '2px', display: 'inline-block', marginTop: '2px' }}>HIGH</div>
                </div>
                <div style={{ padding: '8px', background: '#fff', border: '2px solid #7c3aed', borderRadius: '6px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>RV Reducers</div>
                  <div style={{ fontSize: '10px', color: '#7c3aed' }}>Nabtesco 60%</div>
                  <div style={{ fontSize: '9px', background: '#f5f3ff', color: '#7c3aed', padding: '2px 6px', borderRadius: '2px', display: 'inline-block', marginTop: '2px' }}>HIGH</div>
                </div>
              </div>
            </div>

            <div style={{ color: '#2563eb', fontSize: '18px' }}>→</div>

            {/* Subsystems */}
            <div style={{ flex: '0 0 130px' }}>
              <div style={{ fontSize: '9px', fontWeight: 600, color: '#2563eb', marginBottom: '6px', textAlign: 'center' }}>SUBSYSTEMS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ padding: '8px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>Motors</div>
                  <div style={{ fontSize: '10px', color: '#666' }}>Diversifying</div>
                  <div style={{ fontSize: '9px', background: '#fef9c3', color: '#ca8a04', padding: '2px 6px', borderRadius: '2px', display: 'inline-block', marginTop: '2px' }}>MED</div>
                </div>
                <div style={{ padding: '8px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>Sensors</div>
                  <div style={{ fontSize: '10px', color: '#666' }}>Global</div>
                  <div style={{ fontSize: '9px', background: '#fef9c3', color: '#ca8a04', padding: '2px 6px', borderRadius: '2px', display: 'inline-block', marginTop: '2px' }}>MED</div>
                </div>
              </div>
            </div>

            <div style={{ color: '#059669', fontSize: '18px' }}>→</div>

            {/* Robot */}
            <div style={{ flex: '0 0 100px' }}>
              <div style={{ fontSize: '9px', fontWeight: 600, color: '#059669', marginBottom: '6px', textAlign: 'center' }}>ASSEMBLY</div>
              <div style={{ padding: '14px 10px', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '2px solid #059669', borderRadius: '8px', textAlign: 'center' }}>
                <RobotIcon />
                <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', fontFamily: fonts.heading }}>Robot</div>
                <div style={{ fontSize: '9px', color: '#059669' }}>LOW RISK</div>
              </div>
            </div>
          </div>
        </div>

        {/* Detail Panels */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          
          {/* Rare Earths */}
          <div style={{ background: '#fff', border: `2px solid ${activePanel === 'rareearths' ? '#dc2626' : '#e5e7eb'}`, borderRadius: '6px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <FlaskIcon />
              <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, fontFamily: fonts.heading }}>Rare Earth Processing</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#dc2626', marginBottom: '4px' }}>PROCESSING</div>
                <DonutChart percentage={85} color="#dc2626" />
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626', fontFamily: fonts.heading }}>85%</div>
                <div style={{ fontSize: '10px', color: '#666' }}>China controls</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#059669', marginBottom: '4px' }}>DEPOSITS</div>
                <DonutChart percentage={37} color="#059669" />
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#059669', fontFamily: fonts.heading }}>Global</div>
                <div style={{ fontSize: '10px', color: '#666' }}>Found everywhere</div>
              </div>
            </div>

            <div style={{ background: '#f0fdf4', borderRadius: '4px', padding: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#059669', marginBottom: '6px' }}>WHY IT'S SOLVABLE</div>
              <div style={{ fontSize: '10px', color: '#333', lineHeight: 1.5 }}>
                <div>• Oil & Gas has liquid-liquid separation expertise</div>
                <div>• JP Morgan $1.5T + DOD $400M deployed</div>
                <div>• Lynas: first non-China heavy RE separation</div>
                <div>• Months of inventory buffer exists</div>
              </div>
            </div>
          </div>

          {/* Precision Reducers */}
          <div style={{ background: '#fff', border: `2px solid ${activePanel === 'reducers' ? '#7c3aed' : '#e5e7eb'}`, borderRadius: '6px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <GearIcon />
              <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, fontFamily: fonts.heading }}>Precision Reducers</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#7c3aed', marginBottom: '4px' }}>MARKET SHARE</div>
                <DonutChart percentage={85} color="#7c3aed" />
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#7c3aed', fontFamily: fonts.heading }}>85%</div>
                <div style={{ fontSize: '10px', color: '#666' }}>Japan dominates</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#dc2626', marginBottom: '4px' }}>THE CHALLENGE</div>
                <div style={{ fontSize: '10px', color: '#666', lineHeight: 1.6 }}>
                  <div>• Multi-year qualification</div>
                  <div>• Tribology is empirical</div>
                  <div>• Failures emerge slowly</div>
                </div>
              </div>
            </div>

            <div style={{ background: '#f0fdf4', borderRadius: '4px', padding: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#059669', marginBottom: '6px' }}>WHY IT'S SOLVABLE</div>
              <div style={{ fontSize: '10px', color: '#333', lineHeight: 1.5 }}>
                <div>• Software compensates for hardware</div>
                <div>• Chinese at 80% quality, 35% price</div>
                <div>• Qualify during deployment</div>
                <div>• Better AI tolerates worse hardware</div>
              </div>
            </div>
          </div>
        </div>

        {/* Industry Convergence */}
        <div style={{ marginTop: '12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '14px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 12px', fontFamily: fonts.heading }}>
            Industries Already Solving These Problems
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { from: 'Oil & Gas', to: 'RE Processing', color: '#f97316', desc: 'Liquid separation expertise' },
              { from: 'Automotive', to: 'Robot Mfg', color: '#2563eb', desc: 'Same factories & suppliers' },
              { from: 'Electronics', to: 'AI + Robots', color: '#7c3aed', desc: 'Same ODM facilities' },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, padding: '6px 10px', background: '#f8fafc', borderRadius: '4px', display: 'inline-block' }}>{item.from}</div>
                <div style={{ fontSize: '16px', color: item.color, margin: '4px 0' }}>↓</div>
                <div style={{ fontSize: '12px', fontWeight: 500, padding: '6px 10px', background: item.color, color: '#fff', borderRadius: '4px', display: 'inline-block' }}>{item.to}</div>
                <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <footer style={{ marginTop: '14px', textAlign: 'center', color: '#999', fontSize: '10px' }}>
          Data: USGS, industry reports
        </footer>
      </div>
    </div>
  );
}

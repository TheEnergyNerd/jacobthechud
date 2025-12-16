import React, { useState, useEffect, useRef } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';

const colors = {
  bg: '#fafafa',
  bgCard: '#ffffff',
  accent: '#2563eb',
  accentLight: '#3b82f6',
  warning: '#d97706',
  danger: '#dc2626',
  success: '#059669',
  text: '#1f2937',
  textDim: '#6b7280',
  border: '#e5e7eb',
  gridLine: '#f3f4f6',
  conveyorBelt: '#d1d5db',
  box: '#3b82f6',
  boxMissed: '#ef4444',
  boxPicked: '#10b981',
};

const LatencySimulator = () => {
  const [selectedCountry, setSelectedCountry] = useState('mexico');
  const [selectedRegion, setSelectedRegion] = useState('texas');
  const [isRunning, setIsRunning] = useState(false);
  const [boxes, setBoxes] = useState([]);
  const [armX, setArmX] = useState(300);
  const [targetX, setTargetX] = useState(300);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [heldBoxId, setHeldBoxId] = useState(null);
  const [stats, setStats] = useState({ picks: 0, misses: 0 });
  
  const animRef = useRef(null);
  const lastTimeRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const boxIdRef = useRef(0);
  const boxesRef = useRef([]);
  const armXRef = useRef(300);
  const heldBoxIdRef = useRef(null);
  
  const pickZoneStart = 285;
  const pickZoneEnd = 315;
  const armY = 145;
  const conveyorY = 175;
  
  const countries = {
    mexico: { name: 'Mexico', wage: 6.29, baseLatency: 25 },
    canada: { name: 'Canada', wage: 18.50, baseLatency: 20 },
    philippines: { name: 'Philippines', wage: 2.80, baseLatency: 180 },
    india: { name: 'India', wage: 3.20, baseLatency: 200 },
    poland: { name: 'Poland', wage: 12.40, baseLatency: 120 },
    vietnam: { name: 'Vietnam', wage: 2.50, baseLatency: 190 },
  };
  
  const usRegions = {
    texas: { name: 'Texas', latencyMod: 1.0 },
    california: { name: 'California', latencyMod: 1.2 },
    newyork: { name: 'New York', latencyMod: 1.1 },
    midwest: { name: 'Midwest', latencyMod: 0.9 },
  };
  
  const latency = Math.round(countries[selectedCountry].baseLatency * usRegions[selectedRegion].latencyMod);
  const isViable = latency < 200;
  const conveyorSpeed = 80;
  
  useEffect(() => { boxesRef.current = boxes; }, [boxes]);
  useEffect(() => { armXRef.current = armX; }, [armX]);
  useEffect(() => { heldBoxIdRef.current = heldBoxId; }, [heldBoxId]);
  
  useEffect(() => {
    setBoxes([]);
    setStats({ picks: 0, misses: 0 });
    setHeldBoxId(null);
    setArmX(300);
    setTargetX(300);
    boxesRef.current = [];
    armXRef.current = 300;
    heldBoxIdRef.current = null;
  }, [selectedCountry, selectedRegion]);
  
  useEffect(() => {
    if (!isRunning) return;
    const spawnInterval = 800;
    
    const gameLoop = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;
      
      if (timestamp - lastSpawnRef.current > spawnInterval) {
        lastSpawnRef.current = timestamp;
        const newBox = { id: boxIdRef.current++, x: -30, status: 'moving' };
        setBoxes(prev => [...prev, newBox]);
      }
      
      setArmX(prev => {
        const speed = 2.5;
        const diff = targetX - prev;
        if (Math.abs(diff) < 1) return targetX;
        return prev + Math.sign(diff) * Math.min(Math.abs(diff), speed);
      });
      
      setBoxes(prev => {
        const currentArmX = armXRef.current;
        const currentHeldId = heldBoxIdRef.current;
        
        return prev.map(box => {
          if (box.id === currentHeldId) {
            return { ...box, x: currentArmX - 15, status: 'picked' };
          }
          if (box.status !== 'moving') {
            const newX = box.x + conveyorSpeed * delta;
            if (newX > 620) return null;
            return { ...box, x: newX };
          }
          const newX = box.x + conveyorSpeed * delta;
          if (newX > pickZoneEnd + 20) {
            setStats(s => ({ ...s, misses: s.misses + 1 }));
            return { ...box, x: newX, status: 'missed' };
          }
          if (newX > 620) return null;
          return { ...box, x: newX };
        }).filter(Boolean);
      });
      
      animRef.current = requestAnimationFrame(gameLoop);
    };
    
    animRef.current = requestAnimationFrame(gameLoop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isRunning, targetX]);
  
  const handleCanvasClick = (e) => {
    if (!isRunning) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 600;
    const clampedX = Math.max(60, Math.min(540, x));
    setTimeout(() => setTargetX(clampedX), latency);
  };
  
  const handleGrab = () => {
    if (!isRunning || heldBoxIdRef.current !== null) return;
    setTimeout(() => {
      const currentArmX = armXRef.current;
      const currentBoxes = boxesRef.current;
      
      for (const box of currentBoxes) {
        if (box.status !== 'moving') continue;
        const boxCenterX = box.x + 15;
        const distance = Math.abs(currentArmX - boxCenterX);
        const isInPickZone = boxCenterX >= pickZoneStart && boxCenterX <= pickZoneEnd;
        if (distance < 20 && isInPickZone) {
          setHeldBoxId(box.id);
          heldBoxIdRef.current = box.id;
          setStats(s => ({ ...s, picks: s.picks + 1 }));
          setIsGrabbing(true);
          setTimeout(() => setIsGrabbing(false), 150);
          return;
        }
      }
      setIsGrabbing(true);
      setTimeout(() => setIsGrabbing(false), 150);
    }, latency);
  };
  
  const handleRelease = () => {
    if (heldBoxIdRef.current === null) return;
    setTimeout(() => {
      const releasedId = heldBoxIdRef.current;
      setHeldBoxId(null);
      heldBoxIdRef.current = null;
      setBoxes(prev => prev.filter(b => b.id !== releasedId));
    }, latency);
  };
  
  const startStop = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      setBoxes([]);
      setStats({ picks: 0, misses: 0 });
      setHeldBoxId(null);
      heldBoxIdRef.current = null;
      setArmX(300);
      setTargetX(300);
      armXRef.current = 300;
      lastTimeRef.current = 0;
      lastSpawnRef.current = 0;
      setIsRunning(true);
    }
  };
  
  const total = stats.picks + stats.misses;
  const successRate = total > 0 ? ((stats.picks / total) * 100).toFixed(0) : '—';

  return (
    <div style={{ padding: '24px', background: colors.bgCard, borderRadius: '4px', border: `1px solid ${colors.border}`, marginBottom: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px', color: colors.text, fontFamily: 'Georgia, serif' }}>
          Figure 1: Teleoperator Latency Simulation
        </h2>
        <p style={{ color: colors.textDim, fontSize: '13px', fontStyle: 'italic' }}>
          Interactive demonstration of network latency effects on remote robot operation. Click to position arm; use controls to grab packages from moving conveyor.
        </p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label style={{ display: 'block', color: colors.text, fontSize: '12px', marginBottom: '6px', fontWeight: 600 }}>Teleoperator Location</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
            {Object.entries(countries).map(([key, country]) => (
              <button key={key} onClick={() => setSelectedCountry(key)}
                style={{ padding: '8px 4px', background: selectedCountry === key ? colors.accent : colors.bg, border: `1px solid ${selectedCountry === key ? colors.accent : colors.border}`, borderRadius: '2px', color: selectedCountry === key ? '#fff' : colors.text, cursor: 'pointer', fontSize: '11px' }}>
                <div style={{ fontWeight: 500 }}>{country.name}</div>
                <div style={{ fontSize: '10px', opacity: 0.8 }}>${country.wage}/hr · {country.baseLatency}ms</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ display: 'block', color: colors.text, fontSize: '12px', marginBottom: '6px', fontWeight: 600 }}>Robot Location (United States)</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            {Object.entries(usRegions).map(([key, region]) => (
              <button key={key} onClick={() => setSelectedRegion(key)}
                style={{ padding: '8px', background: selectedRegion === key ? colors.accent : colors.bg, border: `1px solid ${selectedRegion === key ? colors.accent : colors.border}`, borderRadius: '2px', color: selectedRegion === key ? '#fff' : colors.text, cursor: 'pointer', fontSize: '12px' }}>
                {region.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1px', background: colors.border, marginBottom: '16px', border: `1px solid ${colors.border}` }}>
        {[
          { label: 'Latency', value: `${latency} ms`, status: isViable ? 'good' : 'bad' },
          { label: 'Successful Picks', value: stats.picks },
          { label: 'Missed Packages', value: stats.misses },
          { label: 'Success Rate', value: `${successRate}%` },
          { label: 'Status', value: isViable ? 'Viable' : 'Not Viable', status: isViable ? 'good' : 'bad' },
        ].map((stat, i) => (
          <div key={i} style={{ background: colors.bgCard, padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: colors.textDim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{stat.label}</div>
            <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'Georgia, serif', color: stat.status === 'bad' ? colors.danger : stat.status === 'good' ? colors.success : colors.text }}>{stat.value}</div>
          </div>
        ))}
      </div>
      
      <div onClick={handleCanvasClick} style={{ height: '220px', background: '#f9fafb', border: `1px solid ${colors.border}`, position: 'relative', cursor: isRunning ? 'crosshair' : 'default', marginBottom: '12px' }}>
        {!isRunning && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.9)', zIndex: 10 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: colors.text, marginBottom: '4px' }}>Click "Start Simulation" to begin</div>
              <div style={{ fontSize: '12px', color: colors.textDim }}>Then click on the canvas to move the arm</div>
            </div>
          </div>
        )}
        <svg width="100%" height="100%" viewBox="0 0 600 220" preserveAspectRatio="xMidYMid meet">
          {[...Array(13)].map((_, i) => <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="220" stroke={colors.gridLine} strokeWidth="1" />)}
          {[...Array(5)].map((_, i) => <line key={`h${i}`} x1="0" y1={i * 50} x2="600" y2={i * 50} stroke={colors.gridLine} strokeWidth="1" />)}
          <rect x="0" y={conveyorY} width="600" height="35" fill={colors.conveyorBelt} />
          <rect x="0" y={conveyorY} width="600" height="2" fill="#9ca3af" />
          <rect x="0" y={conveyorY + 33} width="600" height="2" fill="#9ca3af" />
          {[...Array(16)].map((_, i) => <line key={i} x1={i * 40 + 20} y1={conveyorY + 5} x2={i * 40 + 20} y2={conveyorY + 30} stroke="#9ca3af" strokeWidth="2" />)}
          <rect x={pickZoneStart} y={conveyorY - 5} width={pickZoneEnd - pickZoneStart} height="45" fill="rgba(37, 99, 235, 0.1)" stroke={colors.accent} strokeWidth="1" strokeDasharray="4 2" />
          <text x={(pickZoneStart + pickZoneEnd) / 2} y={conveyorY - 12} fill={colors.accent} fontSize="10" textAnchor="middle">PICK ZONE</text>
          
          {boxes.map(box => (
            <g key={box.id}>
              <rect x={box.x} y={box.status === 'picked' ? armY + 25 : conveyorY + 5} width="30" height="24" fill={box.status === 'picked' ? colors.boxPicked : box.status === 'missed' ? colors.boxMissed : colors.box} stroke={box.status === 'picked' ? '#059669' : box.status === 'missed' ? '#dc2626' : '#2563eb'} strokeWidth="1" rx="2" />
              <text x={box.x + 15} y={(box.status === 'picked' ? armY + 25 : conveyorY + 5) + 15} fill="white" fontSize="10" textAnchor="middle" fontWeight="500">PKG</text>
            </g>
          ))}
          
          <rect x="30" y="25" width="540" height="6" fill="#6b7280" rx="2" />
          <rect x={armX - 12} y="20" width="24" height="16" fill="#374151" rx="2" />
          <rect x={armX - 4} y="36" width="8" height={armY - 36} fill="#4b5563" />
          <g transform={`translate(${armX}, ${armY})`}>
            <rect x="-8" y="0" width="16" height="12" fill="#374151" rx="1" />
            <rect x="-12" y="12" width="6" height="16" fill="#4b5563" rx="1" transform={`rotate(${isGrabbing ? 15 : 0} -9 12)`} />
            <rect x="6" y="12" width="6" height="16" fill="#4b5563" rx="1" transform={`rotate(${isGrabbing ? -15 : 0} 9 12)`} />
          </g>
          
          {isRunning && Math.abs(targetX - armX) > 5 && (
            <g>
              <line x1={targetX} y1={armY} x2={targetX} y2={armY + 30} stroke={colors.warning} strokeWidth="1" strokeDasharray="3 2" />
              <circle cx={targetX} cy={armY + 30} r="4" fill="none" stroke={colors.warning} strokeWidth="1" />
            </g>
          )}
          
          {latency >= 150 && isRunning && (
            <g><rect x="200" y="60" width="200" height="28" fill={colors.danger} rx="2" />
            <text x="300" y="79" fill="white" fontSize="12" textAnchor="middle" fontWeight="500">⚠ High Latency: {latency}ms</text></g>
          )}
          <text x="580" y="215" fill={colors.textDim} fontSize="9" textAnchor="end">t = {latency}ms delay</text>
        </svg>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button onClick={startStop} style={{ flex: 1, padding: '10px', background: isRunning ? colors.danger : colors.accent, border: 'none', borderRadius: '2px', color: '#fff', fontWeight: 500, cursor: 'pointer', fontSize: '13px' }}>
          {isRunning ? 'Stop Simulation' : 'Start Simulation'}
        </button>
        <button onClick={handleGrab} disabled={!isRunning || heldBoxId !== null}
          style={{ flex: 1, padding: '10px', background: (!isRunning || heldBoxId !== null) ? colors.border : colors.success, border: 'none', borderRadius: '2px', color: (!isRunning || heldBoxId !== null) ? colors.textDim : '#fff', fontWeight: 500, cursor: (!isRunning || heldBoxId !== null) ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
          Grab Package
        </button>
        <button onClick={handleRelease} disabled={!isRunning || heldBoxId === null}
          style={{ flex: 1, padding: '10px', background: (!isRunning || heldBoxId === null) ? colors.border : colors.warning, border: 'none', borderRadius: '2px', color: (!isRunning || heldBoxId === null) ? colors.textDim : '#fff', fontWeight: 500, cursor: (!isRunning || heldBoxId === null) ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
          Release Package
        </button>
      </div>
      
      <div style={{ background: colors.bg, padding: '12px', fontSize: '12px', border: `1px solid ${colors.border}` }}>
        <div style={{ fontWeight: 600, marginBottom: '8px', color: colors.text }}>Economic Analysis</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div><span style={{ color: colors.textDim }}>Base Labor Cost: </span><span style={{ color: colors.text, fontWeight: 500 }}>${countries[selectedCountry].wage.toFixed(2)}/hr</span></div>
          <div><span style={{ color: colors.textDim }}>Effective Cost: </span><span style={{ color: colors.text, fontWeight: 500 }}>${(countries[selectedCountry].wage / Math.max(0.3, (parseInt(successRate) || 50) / 100)).toFixed(2)}/hr</span></div>
          <div><span style={{ color: colors.textDim }}>Viability: </span><span style={{ color: isViable ? colors.success : colors.danger, fontWeight: 500 }}>{isViable ? 'Acceptable (<200ms)' : 'Not Recommended (≥200ms)'}</span></div>
        </div>
      </div>
    </div>
  );
};

const BreakevenExplorer = () => {
  const [humanWage, setHumanWage] = useState(25);
  const [robotCost, setRobotCost] = useState(45000);
  const [speedDiscount, setSpeedDiscount] = useState(30);
  const [successRate, setSuccessRate] = useState(85);
  const [hoursPerDay, setHoursPerDay] = useState(16);
  const [teleopRatio, setTeleopRatio] = useState(3);
  const [teleopWage, setTeleopWage] = useState(6.29);
  
  const daysPerYear = 250, depreciation = 3, maintenancePct = 0.15;
  const humanYearlyCost = humanWage * 8 * daysPerYear;
  const robotHoursPerYear = hoursPerDay * daysPerYear;
  const robotEfficiency = (1 - speedDiscount / 100) * (successRate / 100);
  const robotDepreciationPerYear = robotCost / depreciation;
  const maintenancePerYear = robotCost * maintenancePct;
  const teleopCostPerYear = (teleopWage * robotHoursPerYear) / teleopRatio;
  const robotYearlyCost = robotDepreciationPerYear + maintenancePerYear + teleopCostPerYear;
  const robotEquivalentOutput = robotEfficiency * (hoursPerDay / 8);
  const breakeven = robotCost / Math.max(0.01, (humanYearlyCost * robotEquivalentOutput - robotYearlyCost + robotDepreciationPerYear));
  const breakevenMonths = Math.max(0, breakeven * 12);
  
  const chartData = Array.from({ length: 49 }, (_, month) => ({
    month,
    human: Math.round((humanYearlyCost / 12) * month),
    robot: Math.round(robotCost + ((robotYearlyCost - robotDepreciationPerYear) / 12) * month),
  }));

  const Slider = ({ label, value, onChange, min, max, step = 1, format = v => v, unit = '' }) => (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ color: colors.text, fontSize: '12px' }}>{label}</span>
        <span style={{ color: colors.accent, fontSize: '12px', fontWeight: 500 }}>{format(value)}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', height: '4px', borderRadius: '2px', background: colors.border, appearance: 'none', cursor: 'pointer' }} />
    </div>
  );

  return (
    <div style={{ padding: '24px', background: colors.bgCard, borderRadius: '4px', border: `1px solid ${colors.border}`, marginBottom: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px', color: colors.text, fontFamily: 'Georgia, serif' }}>Figure 2: Breakeven Analysis Model</h2>
        <p style={{ color: colors.textDim, fontSize: '13px', fontStyle: 'italic' }}>Comparative total cost of ownership between human labor and robotic systems over a 48-month horizon.</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: colors.border, marginBottom: '20px', border: `1px solid ${colors.border}` }}>
        <div style={{ background: colors.bgCard, padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: colors.textDim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Breakeven Period</div>
          <div style={{ fontSize: '28px', fontWeight: 600, fontFamily: 'Georgia, serif', color: breakevenMonths < 24 ? colors.success : breakevenMonths < 36 ? colors.warning : colors.danger }}>{breakevenMonths > 100 ? '∞' : breakevenMonths.toFixed(1)}</div>
          <div style={{ fontSize: '11px', color: colors.textDim }}>months</div>
        </div>
        <div style={{ background: colors.bgCard, padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: colors.textDim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Human Equivalent</div>
          <div style={{ fontSize: '28px', fontWeight: 600, fontFamily: 'Georgia, serif', color: colors.text }}>{robotEquivalentOutput.toFixed(2)}×</div>
          <div style={{ fontSize: '11px', color: colors.textDim }}>output ratio</div>
        </div>
        <div style={{ background: colors.bgCard, padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: colors.textDim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Annual Robot OpEx</div>
          <div style={{ fontSize: '28px', fontWeight: 600, fontFamily: 'Georgia, serif', color: colors.text }}>${(robotYearlyCost / 1000).toFixed(1)}k</div>
          <div style={{ fontSize: '11px', color: colors.textDim }}>per year</div>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: colors.text, marginBottom: '12px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '8px' }}>Model Parameters</div>
          <Slider label="Human Wage" value={humanWage} onChange={setHumanWage} min={10} max={60} format={v => `$${v}`} unit="/hr" />
          <Slider label="Robot CapEx" value={robotCost} onChange={setRobotCost} min={15000} max={150000} step={5000} format={v => `$${(v/1000).toFixed(0)}k`} />
          <Slider label="Speed Discount" value={speedDiscount} onChange={setSpeedDiscount} min={0} max={70} unit="%" />
          <Slider label="Success Rate" value={successRate} onChange={setSuccessRate} min={50} max={100} unit="%" />
          <Slider label="Robot Hours/Day" value={hoursPerDay} onChange={setHoursPerDay} min={8} max={24} unit=" hrs" />
          <Slider label="Teleop Ratio" value={teleopRatio} onChange={setTeleopRatio} min={1} max={20} format={v => `1:${v}`} />
          <Slider label="Teleop Wage" value={teleopWage} onChange={setTeleopWage} min={2} max={20} step={0.5} format={v => `$${v.toFixed(2)}`} unit="/hr" />
        </div>
        <div>
          <div style={{ height: '340px', border: `1px solid ${colors.border}`, background: '#fff' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.gridLine} />
                <XAxis dataKey="month" stroke={colors.textDim} fontSize={10} tickFormatter={v => `${v}`} label={{ value: 'Months', position: 'bottom', offset: 0, fontSize: 10, fill: colors.textDim }} />
                <YAxis stroke={colors.textDim} fontSize={10} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={50} />
                <Tooltip contentStyle={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: '2px', fontSize: '11px' }} formatter={value => [`$${value.toLocaleString()}`, '']} labelFormatter={label => `Month ${label}`} />
                <Area type="monotone" dataKey="human" stroke={colors.danger} fill={colors.danger} fillOpacity={0.1} strokeWidth={2} name="Human Labor" />
                <Area type="monotone" dataKey="robot" stroke={colors.accent} fill={colors.accent} fillOpacity={0.1} strokeWidth={2} name="Robot TCO" />
                {breakevenMonths > 0 && breakevenMonths < 48 && <ReferenceLine x={Math.round(breakevenMonths)} stroke={colors.text} strokeDasharray="3 3" label={{ value: 'Breakeven', fontSize: 10, fill: colors.text }} />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: '24px', marginTop: '8px', justifyContent: 'center', fontSize: '11px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '16px', height: '2px', background: colors.danger }}></div><span style={{ color: colors.textDim }}>Cumulative Human Labor Cost</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '16px', height: '2px', background: colors.accent }}></div><span style={{ color: colors.textDim }}>Robot Total Cost of Ownership</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RacingBarChart = () => {
  const [year, setYear] = useState(2024);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const robotTypes = [
    { id: 'arms', name: 'Dual Cobot Arms (ReBeL 6DoF)', color: colors.accent, base: 15000, curve: 0.88 },
    { id: 'wheeled', name: 'Wheeled Humanoid (Galaxea R1)', color: '#7c3aed', base: 45000, curve: 0.85 },
    { id: 'legged_low', name: 'Basic Legged (Unitree G1)', color: colors.warning, base: 21600, curve: 0.90 },
    { id: 'legged_high', name: 'Advanced Legged Humanoid', color: colors.danger, base: 150000, curve: 0.82 },
  ];
  
  const getCost = (base, curve, years) => Math.round(base * Math.pow(curve, years));
  const currentData = robotTypes.map(r => ({ ...r, cost: getCost(r.base, r.curve, year - 2024) })).sort((a, b) => a.cost - b.cost);
  const maxCost = Math.max(...currentData.map(d => d.cost));
  
  useEffect(() => {
    if (!isPlaying || year >= 2035) { if (year >= 2035) setIsPlaying(false); return; }
    const timer = setTimeout(() => setYear(y => y + 1), 800);
    return () => clearTimeout(timer);
  }, [isPlaying, year]);

  return (
    <div style={{ padding: '24px', background: colors.bgCard, borderRadius: '4px', border: `1px solid ${colors.border}` }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px', color: colors.text, fontFamily: 'Georgia, serif' }}>Figure 3: Projected Hardware Cost Trajectories</h2>
        <p style={{ color: colors.textDim, fontSize: '13px', fontStyle: 'italic' }}>Manufacturing learning curves applied to current robot form factors. Costs decrease 10-18% annually based on production scaling.</p>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', padding: '12px', background: colors.bg, border: `1px solid ${colors.border}` }}>
        <button onClick={() => { if (year >= 2035) setYear(2024); setIsPlaying(!isPlaying); }}
          style={{ padding: '8px 16px', background: isPlaying ? colors.danger : colors.accent, border: 'none', borderRadius: '2px', color: '#fff', fontWeight: 500, cursor: 'pointer', fontSize: '12px' }}>
          {isPlaying ? 'Pause' : 'Play Animation'}
        </button>
        <input type="range" min={2024} max={2035} value={year} onChange={e => { setYear(Number(e.target.value)); setIsPlaying(false); }}
          style={{ flex: 1, height: '4px', background: colors.border, appearance: 'none', cursor: 'pointer' }} />
        <div style={{ fontSize: '32px', fontWeight: 600, fontFamily: 'Georgia, serif', color: colors.text, minWidth: '80px', textAlign: 'right' }}>{year}</div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {currentData.map((robot, i) => (
          <div key={robot.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '200px', fontSize: '12px', color: colors.text }}>{robot.name}</div>
            <div style={{ flex: 1, height: '28px', background: colors.bg, border: `1px solid ${colors.border}`, position: 'relative' }}>
              <div style={{ height: '100%', width: `${(robot.cost / maxCost) * 100}%`, background: robot.color, transition: 'width 0.5s ease-out', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#fff' }}>${(robot.cost / 1000).toFixed(1)}k</span>
              </div>
              {i === 0 && <span style={{ position: 'absolute', right: '-24px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px' }}>←</span>}
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '16px', padding: '12px', background: colors.bg, border: `1px solid ${colors.border}`, fontSize: '12px', color: colors.textDim }}>
        <strong style={{ color: colors.text }}>Note:</strong> Per the unit economics framework, simpler arm-based systems maintain cost leadership throughout the projection period. Legged humanoids require clear operational justification to overcome CapEx disadvantage.
      </div>
    </div>
  );
};

export default function RoboticsUnitEconomicsToolkit() {
  const [activeTab, setActiveTab] = useState('latency');
  const tabs = [
    { id: 'latency', name: 'Latency Simulation' },
    { id: 'breakeven', name: 'Breakeven Analysis' },
    { id: 'projections', name: 'Cost Projections' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, padding: '32px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input[type="range"]::-webkit-slider-thumb { appearance: none; width: 14px; height: 14px; background: ${colors.accent}; border-radius: 50%; cursor: pointer; border: 2px solid #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
      `}</style>
      
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <header style={{ marginBottom: '32px', borderBottom: `2px solid ${colors.text}`, paddingBottom: '16px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: colors.text, fontFamily: 'Georgia, serif', marginBottom: '8px' }}>Robotics Unit Economics: Interactive Analysis</h1>
          <p style={{ color: colors.textDim, fontSize: '14px' }}>A framework for evaluating deployment economics across robot form factors, teleoperator configurations, and market conditions.</p>
        </header>
        
        <nav style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: `1px solid ${colors.border}` }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding: '12px 20px', background: 'transparent', border: 'none', borderBottom: activeTab === tab.id ? `2px solid ${colors.accent}` : '2px solid transparent', color: activeTab === tab.id ? colors.accent : colors.textDim, cursor: 'pointer', fontWeight: 500, fontSize: '13px', marginBottom: '-1px' }}>
              {tab.name}
            </button>
          ))}
        </nav>
        
        {activeTab === 'latency' && <LatencySimulator />}
        {activeTab === 'breakeven' && <BreakevenExplorer />}
        {activeTab === 'projections' && <RacingBarChart />}
        
        <footer style={{ marginTop: '32px', paddingTop: '16px', borderTop: `1px solid ${colors.border}`, textAlign: 'center', color: colors.textDim, fontSize: '11px' }}>
          Interactive supplement to unit economics analysis · Model parameters derived from industry data
        </footer>
      </div>
    </div>
  );
}

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

const HumanVsRobotComparison = () => {
  // Task configuration - 3 cables with specific port assignments
  const cableConfig = [
    { id: 1, color: '#ef4444', label: 'Red', targetPort: 5 },
    { id: 2, color: '#3b82f6', label: 'Blue', targetPort: 12 },
    { id: 3, color: '#10b981', label: 'Green', targetPort: 18 },
  ];
  
  // Human side state
  const [humanStep, setHumanStep] = useState('idle'); // 'idle', 'grabbed', 'working', 'complete'
  const [humanCurrentCable, setHumanCurrentCable] = useState(null);
  const [humanPluggedCables, setHumanPluggedCables] = useState([]); // [{cableId, portNum, correct}]
  const [humanTimeElapsed, setHumanTimeElapsed] = useState(0);
  const [humanMousePos, setHumanMousePos] = useState(null);
  const [humanCableVisible, setHumanCableVisible] = useState(false);
  
  // Robot side state
  const [robotStep, setRobotStep] = useState('idle'); // 'idle', 'working', 'complete'
  const [robotProgress, setRobotProgress] = useState(0);
  const [robotCurrentCable, setRobotCurrentCable] = useState(null);
  const [robotActivePort, setRobotActivePort] = useState(null);
  const [robotScannedPorts, setRobotScannedPorts] = useState(new Set());
  const [robotCablePath, setRobotCablePath] = useState(null);
  const [robotPluggedCables, setRobotPluggedCables] = useState([]);
  
  // Shared state
  const [fastForwarded, setFastForwarded] = useState(false);
  const [humanResult, setHumanResult] = useState(null);
  const [robotResult, setRobotResult] = useState(null);
  const [showResults, setShowResults] = useState(false);
  
  const ports = Array.from({ length: 24 }, (_, i) => i + 1);
  
  const humanTimerRef = useRef(null);
  const robotAnimRef = useRef(null);
  const containerRef = useRef(null);
  
  // Human timer
  useEffect(() => {
    if (humanStep === 'working') {
      humanTimerRef.current = setInterval(() => {
        setHumanTimeElapsed(prev => prev + 0.1);
      }, 100);
    }
    return () => {
      if (humanTimerRef.current) clearInterval(humanTimerRef.current);
    };
  }, [humanStep]);
  
  // Robot animation - handles multiple cables
  useEffect(() => {
    if (robotStep === 'working') {
      let progress = 0;
      let currentCableIndex = 0;
      const scanned = new Set();
      const plugged = [];
      
      robotAnimRef.current = setInterval(() => {
        if (currentCableIndex >= cableConfig.length) {
          clearInterval(robotAnimRef.current);
          setRobotStep('complete');
          setRobotPluggedCables(plugged);
          setRobotCurrentCable(null);
          setRobotCablePath(null);
          return;
        }
        
        const currentCable = cableConfig[currentCableIndex];
        const cableSegment = 1 / cableConfig.length;
        const cableStart = currentCableIndex * cableSegment;
        const cableProgress = (progress - cableStart) / cableSegment;
        
        setRobotCurrentCable(currentCable);
        
        if (cableProgress < 0.2) {
          // Scanning phase
          const scanPort = Math.floor(cableProgress * 5) + 1;
          scanned.add(scanPort);
          setRobotScannedPorts(new Set(scanned));
          setRobotActivePort(scanPort);
          setRobotCablePath(null);
        } else if (cableProgress < 0.35) {
          // Identifying target
          setRobotActivePort(currentCable.targetPort);
          setRobotCablePath(null);
        } else if (cableProgress < 0.65) {
          // Routing
          setRobotActivePort(currentCable.targetPort);
          const portPos = getPortPosition(currentCable.targetPort);
          setRobotCablePath({ 
            from: { x: 50, y: 300 }, 
            to: { x: portPos.centerX * 3.5, y: portPos.centerY * 3.5 } 
          });
        } else if (cableProgress < 0.85) {
          // Plugging
          setRobotActivePort(currentCable.targetPort);
        } else if (cableProgress < 0.95) {
          // Verifying
          setRobotActivePort(currentCable.targetPort);
        } else {
          // Cable complete
          plugged.push({ cableId: currentCable.id, portNum: currentCable.targetPort, correct: true });
          setRobotPluggedCables([...plugged]);
          currentCableIndex++;
          if (currentCableIndex < cableConfig.length) {
            setRobotCablePath(null);
          }
        }
        
        progress += 0.01;
        setRobotProgress(Math.min(progress, 1));
      }, 100);
    }
    return () => {
      if (robotAnimRef.current) clearInterval(robotAnimRef.current);
    };
  }, [robotStep]);
  
  const getNextHumanCable = () => {
    return cableConfig.find(cable => !humanPluggedCables.find(p => p.cableId === cable.id));
  };
  
  const handleHumanGrab = () => {
    if (humanStep !== 'idle') return;
    const nextCable = getNextHumanCable();
    if (!nextCable) return;
    setHumanCurrentCable(nextCable);
    setHumanStep('grabbed');
    setHumanCableVisible(true);
  };
  
  const handleHumanMouseMove = (e) => {
    if (humanStep === 'grabbed' && containerRef.current && humanCurrentCable) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setHumanMousePos({ x, y });
    }
  };
  
  const handleHumanPlug = (portNum) => {
    if (humanStep !== 'grabbed' || !humanCurrentCable) return;
    const isCorrect = portNum === humanCurrentCable.targetPort;
    const newPlugged = [...humanPluggedCables, { cableId: humanCurrentCable.id, portNum, correct: isCorrect }];
    setHumanPluggedCables(newPlugged);
    
    if (newPlugged.length < cableConfig.length) {
      // More cables to plug
      setHumanStep('idle');
      setHumanCurrentCable(null);
      setHumanCableVisible(false);
      setHumanMousePos(null);
    } else {
      // All cables done
      setHumanStep('working');
      setHumanTimeElapsed(0);
      setTimeout(() => {
        setHumanStep('complete');
        const correctCount = newPlugged.filter(p => p.correct).length;
        const errorRate = 1 - (correctCount / cableConfig.length);
        const misplug = errorRate > 0.2; // Error if more than 20% wrong
        const bendViolation = Math.random() < 0.3;
        setHumanResult({ 
          misplug, 
          bendViolation, 
          time: humanTimeElapsed, 
          correctCount,
          totalCables: cableConfig.length,
          errors: newPlugged.filter(p => !p.correct).length
        });
      }, 500);
    }
  };
  
  const handleStartBoth = () => {
    setHumanStep('idle');
    setRobotStep('idle');
    setHumanCurrentCable(null);
    setHumanPluggedCables([]);
    setRobotProgress(0);
    setRobotCurrentCable(null);
    setRobotActivePort(null);
    setRobotScannedPorts(new Set());
    setRobotCablePath(null);
    setRobotPluggedCables([]);
    setHumanTimeElapsed(0);
    setFastForwarded(false);
    setShowResults(false);
    setHumanResult(null);
    setRobotResult(null);
    
    // Auto-start robot
    setTimeout(() => {
      setRobotStep('working');
    }, 500);
  };
  
  const handleFastForward = () => {
    if ((humanStep !== 'complete' || robotStep !== 'complete') && !fastForwarded) return;
    setFastForwarded(true);
    
    setTimeout(() => {
      const humanErrorRate = humanResult?.errors / humanResult?.totalCables || 0;
      const humanHasIssue = Math.random() < (humanErrorRate > 0.2 || humanResult?.bendViolation ? 0.7 : 0.3);
      const humanMTTR = humanHasIssue ? Math.floor(Math.random() * 8 + 4) : 0;
      const humanSLA = humanHasIssue ? Math.floor(Math.random() * 20 + 10) : 0;
      
      const robotHasIssue = Math.random() < 0.01; // Even lower chance since all correct
      const robotMTTR = robotHasIssue ? Math.floor(Math.random() * 30 + 5) : 0;
      const robotSLA = robotHasIssue ? Math.floor(Math.random() * 2) : 0;
      
      setHumanResult(prev => ({ ...prev, hasIssue: humanHasIssue, mttr: humanMTTR, sla: humanSLA }));
      setRobotResult({ 
        hasIssue: robotHasIssue, 
        mttr: robotMTTR, 
        sla: robotSLA, 
        logged: true, 
        timestamp: '2024-01-15 14:23:17', 
        action: `All ${cableConfig.length} cables verified and logged`,
        correctCount: cableConfig.length,
        totalCables: cableConfig.length
      });
      setShowResults(true);
    }, 1500);
  };
  
  const reset = () => {
    setHumanStep('idle');
    setRobotStep('idle');
    setHumanCurrentCable(null);
    setHumanPluggedCables([]);
    setRobotProgress(0);
    setRobotCurrentCable(null);
    setRobotActivePort(null);
    setRobotScannedPorts(new Set());
    setRobotCablePath(null);
    setRobotPluggedCables([]);
    setHumanTimeElapsed(0);
    setHumanMousePos(null);
    setHumanCableVisible(false);
    setFastForwarded(false);
    setShowResults(false);
    setHumanResult(null);
    setRobotResult(null);
  };
  
  const getRobotStep = (progress) => {
    const currentCableIndex = Math.floor(progress * cableConfig.length);
    const currentCable = cableConfig[Math.min(currentCableIndex, cableConfig.length - 1)];
    const cableSegment = 1 / cableConfig.length;
    const cableStart = currentCableIndex * cableSegment;
    const cableProgress = (progress - cableStart) / cableSegment;
    
    if (!currentCable) return 'Complete';
    if (cableProgress < 0.3) return `Cable ${currentCableIndex + 1}/${cableConfig.length}: Working...`;
    if (cableProgress < 0.7) return `Cable ${currentCableIndex + 1}/${cableConfig.length}: Plugging port ${currentCable.targetPort}...`;
    return `Cable ${currentCableIndex + 1}/${cableConfig.length}: Verifying...`;
  };
  
  const getPortPosition = (portNum) => {
    const col = (portNum - 1) % 6;
    const row = Math.floor((portNum - 1) / 6);
    return { 
      x: 12 + col * 14.5, 
      y: 15 + row * 12,
      centerX: 12 + col * 14.5 + 6,
      centerY: 15 + row * 12 + 5
    };
  };
  
  const Port = ({ portNum, side, isSelected, isPlugged, isActive, isScanned, onClick, cableColor, isCorrect }) => {
    const portPos = getPortPosition(portNum);
    const targetCable = cableConfig.find(c => c.targetPort === portNum);
    const statusColor = isPlugged ? (isCorrect ? colors.success : colors.danger) : isActive ? colors.accent : colors.border;
    const bgColor = isPlugged ? (isCorrect ? colors.success : colors.danger) : isActive ? colors.accentLight : colors.bgCard;
    
    return (
      <div
        onClick={onClick}
        style={{
          position: 'absolute',
          left: `${portPos.x}%`,
          top: `${portPos.y}%`,
          width: '12%',
          height: '10%',
          background: bgColor,
          border: `3px solid ${statusColor}`,
          borderRadius: '6px',
          padding: '6px',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.3s',
          boxShadow: isActive ? `0 0 16px ${colors.accent}` : isPlugged ? `0 2px 8px rgba(0,0,0,0.2)` : 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: isActive ? 10 : isPlugged ? 5 : 1,
          transform: isActive ? 'scale(1.1)' : 'scale(1)'
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 700, color: isPlugged ? '#fff' : colors.text }}>
          {portNum}
        </div>
        {isPlugged && (
          <>
            <div style={{ fontSize: '14px', color: '#fff', marginTop: '2px' }}>
              {isCorrect ? '✓' : '✗'}
            </div>
            {cableColor && (
              <div style={{ 
                width: '16px', 
                height: '4px', 
                background: cableColor, 
                borderRadius: '2px',
                marginTop: '4px'
              }} />
            )}
          </>
        )}
        {isActive && !isPlugged && (
          <div style={{ 
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: colors.accent,
            boxShadow: `0 0 8px ${colors.accent}`,
            animation: 'pulse 1s infinite'
          }} />
        )}
      </div>
    );
  };
  
  return (
    <div style={{ padding: '24px', background: colors.bgCard, borderRadius: '4px', border: `1px solid ${colors.border}`, marginBottom: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px', color: colors.text, fontFamily: 'Georgia, serif' }}>
          Figure 4: Human vs Robot — Same Task
        </h2>
        <p style={{ color: colors.textDim, fontSize: '13px', fontStyle: 'italic' }}>
          Side-by-side comparison. Same task. Watch the difference in speed, precision, and long-term reliability.
        </p>
      </div>
      
      {!showResults && (
        <div>
          {/* Instructions Banner */}
          {humanStep === 'idle' && robotStep === 'idle' && (
            <div style={{ background: colors.accentLight, border: `2px solid ${colors.accent}`, borderRadius: '4px', padding: '12px', marginBottom: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>Task: Plug 3 cables into ports 5, 12, and 18</div>
              <div style={{ fontSize: '12px', color: '#fff' }}>
                Left: You click ports • Right: Robot does it automatically
              </div>
            </div>
          )}
          
          {humanStep === 'grabbed' && humanCurrentCable && (
            <div style={{ background: colors.warning, border: `2px solid ${colors.warning}`, borderRadius: '4px', padding: '10px', marginBottom: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                Click port {humanCurrentCable.targetPort} for {humanCurrentCable.label} cable ({humanPluggedCables.length + 1}/{cableConfig.length})
              </div>
            </div>
          )}
          
          {humanStep === 'complete' && robotStep === 'complete' && !fastForwarded && (
            <div style={{ background: colors.success, border: `2px solid ${colors.success}`, borderRadius: '4px', padding: '12px', marginBottom: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                ✓ Both completed! Click below to see what happens after 30 days...
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: colors.text }}>
              {humanStep === 'idle' && robotStep === 'idle' ? 'Ready to start' : 'In Progress'}
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: colors.textDim }}>
              {humanStep === 'working' && <span>Human: {humanTimeElapsed.toFixed(1)}s</span>}
              {robotStep === 'working' && <span>Robot: {getRobotStep(robotProgress)}</span>}
              {humanStep === 'complete' && robotStep === 'complete' && !fastForwarded && (
                <span style={{ color: colors.success, fontWeight: 600 }}>Both Complete</span>
              )}
            </div>
            <button onClick={reset} style={{ padding: '6px 12px', background: colors.border, border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '12px' }}>
              Reset
            </button>
          </div>
          
          {/* Split Screen Comparison */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            {/* Human Side */}
            <div style={{ background: '#f9fafb', border: `2px solid ${colors.border}`, borderRadius: '4px', padding: '16px', position: 'relative', minHeight: '400px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '12px', textAlign: 'center' }}>
                Human Operator
              </div>
              <div 
                ref={containerRef}
                onMouseMove={handleHumanMouseMove}
                style={{ position: 'relative', width: '100%', height: '350px', background: '#fff', borderRadius: '4px', border: `1px solid ${colors.border}`, overflow: 'hidden' }}
              >
                {/* Rack Background */}
                <div style={{ position: 'absolute', inset: '20px', background: '#f3f4f6', borderRadius: '4px', border: '2px solid #d1d5db' }}>
                  <div style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '11px', color: colors.textDim, fontWeight: 600 }}>Rack A - 24 Ports</div>
                </div>
                
                {/* Ports */}
                {ports.map(port => {
                  const pluggedCable = humanPluggedCables.find(p => p.portNum === port);
                  const cableInfo = pluggedCable ? cableConfig.find(c => c.id === pluggedCable.cableId) : null;
                  return (
                    <Port
                      key={port}
                      portNum={port}
                      side="human"
                      isSelected={false}
                      isPlugged={!!pluggedCable}
                      isActive={false}
                      isScanned={false}
                      isCorrect={pluggedCable?.correct}
                      cableColor={cableInfo?.color}
                      onClick={() => humanStep === 'grabbed' && handleHumanPlug(port)}
                    />
                  );
                })}
                
                {/* Cable visualization for human */}
                {humanCableVisible && humanMousePos && containerRef.current && humanCurrentCable && (
                  <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20, width: '100%', height: '100%' }}>
                    <line
                      x1="50"
                      y1="320"
                      x2={(humanMousePos.x / 100) * containerRef.current.offsetWidth}
                      y2={(humanMousePos.y / 100) * containerRef.current.offsetHeight}
                      stroke={humanCurrentCable.color}
                      strokeWidth="4"
                      strokeDasharray="5 5"
                      opacity={0.8}
                    />
                    <circle 
                      cx={(humanMousePos.x / 100) * containerRef.current.offsetWidth} 
                      cy={(humanMousePos.y / 100) * containerRef.current.offsetHeight} 
                      r="10" 
                      fill={humanCurrentCable.color} 
                      opacity={0.9} 
                    />
                  </svg>
                )}
                
                {/* Cable button and progress */}
                {humanStep === 'idle' && (
                  <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                    <button onClick={handleHumanGrab}
                      style={{ padding: '12px 24px', background: colors.accent, border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                      Grab Cable ({humanPluggedCables.length + 1}/{cableConfig.length})
                    </button>
                  </div>
                )}
                {humanStep === 'grabbed' && humanCurrentCable && (
                  <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                    <div style={{ padding: '10px 20px', background: humanCurrentCable.color, borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: 700 }}>
                      Click port {humanCurrentCable.targetPort}
                    </div>
                  </div>
                )}
                {humanStep === 'complete' && (
                  <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', background: colors.success, borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: 700 }}>
                    ✓ Done ({humanTimeElapsed.toFixed(1)}s)
                  </div>
                )}
              </div>
            </div>
            
            {/* Robot Side */}
            <div style={{ background: '#f9fafb', border: `2px solid ${colors.border}`, borderRadius: '4px', padding: '16px', position: 'relative', minHeight: '400px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '12px', textAlign: 'center' }}>
                Robot System
              </div>
              <div style={{ position: 'relative', width: '100%', height: '350px', background: '#fff', borderRadius: '4px', border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
                {/* Rack Background */}
                <div style={{ position: 'absolute', inset: '20px', background: '#f3f4f6', borderRadius: '4px', border: '2px solid #d1d5db' }}>
                  <div style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '11px', color: colors.textDim, fontWeight: 600 }}>Rack B - 24 Ports</div>
                </div>
                
                {/* Ports */}
                {ports.map(port => {
                  const pluggedCable = robotPluggedCables.find(p => p.portNum === port);
                  const cableInfo = pluggedCable ? cableConfig.find(c => c.id === pluggedCable.cableId) : null;
                  return (
                    <Port
                      key={port}
                      portNum={port}
                      side="robot"
                      isSelected={false}
                      isPlugged={!!pluggedCable}
                      isActive={robotActivePort === port}
                      isScanned={robotScannedPorts.has(port)}
                      isCorrect={pluggedCable?.correct}
                      cableColor={cableInfo?.color}
                      onClick={null}
                    />
                  );
                })}
                
                {/* Cable path visualization for robot */}
                {robotCablePath && robotCurrentCable && (
                  <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 15, width: '100%', height: '100%' }}>
                    <path
                      d={`M ${robotCablePath.from.x} ${robotCablePath.from.y} Q ${robotCablePath.from.x + 50} ${robotCablePath.from.y - 50} ${robotCablePath.to.x} ${robotCablePath.to.y}`}
                      stroke={robotCurrentCable.color}
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={robotProgress < 0.7 ? "8 4" : "0"}
                      opacity={0.8}
                    />
                    {robotProgress >= 0.7 && (
                      <circle cx={robotCablePath.to.x} cy={robotCablePath.to.y} r="6" fill={robotCurrentCable.color} opacity={0.9} />
                    )}
                  </svg>
                )}
                
                {/* Robot status */}
                {robotStep === 'idle' && (
                  <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                    <div style={{ padding: '10px 20px', background: colors.bg, borderRadius: '6px', fontSize: '12px', color: colors.textDim, fontWeight: 600 }}>
                      🤖 Auto-starting robot...
                    </div>
                  </div>
                )}
                {robotStep === 'working' && (
                  <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', width: '90%', textAlign: 'center' }}>
                    <div style={{ background: colors.border, height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                      <div style={{ background: colors.accent, height: '100%', width: `${robotProgress * 100}%`, transition: 'width 0.1s' }}></div>
                    </div>
                    <div style={{ fontSize: '12px', color: colors.text, fontWeight: 600 }}>{getRobotStep(robotProgress)}</div>
                  </div>
                )}
                {robotStep === 'complete' && (
                  <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', background: colors.success, borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: 700 }}>
                    ✓ Verified & Logged
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Start button */}
          {humanStep === 'idle' && robotStep === 'idle' && (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <button onClick={handleStartBoth}
                style={{ padding: '14px 28px', background: colors.accent, border: 'none', borderRadius: '4px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '15px' }}>
                Start
              </button>
            </div>
          )}
          
          {/* Fast forward button */}
          {humanStep === 'complete' && robotStep === 'complete' && !fastForwarded && (
            <div style={{ textAlign: 'center' }}>
              <button onClick={handleFastForward}
                style={{ padding: '14px 28px', background: colors.warning, border: 'none', borderRadius: '4px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '15px' }}>
                See 30 Days Later
              </button>
            </div>
          )}
          
          {fastForwarded && !showResults && (
            <div style={{ textAlign: 'center', padding: '20px', background: colors.bg, borderRadius: '4px' }}>
              <div style={{ fontSize: '14px', color: colors.textDim }}>Fast forwarding 30 days...</div>
            </div>
          )}
        </div>
      )}
      
      {showResults && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            {/* Human Results */}
            <div style={{ padding: '20px', background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '4px' }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: colors.text, marginBottom: '16px', textAlign: 'center' }}>Human</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div><span style={{ color: colors.textDim }}>Speed: </span><span style={{ color: colors.success, fontWeight: 600 }}>Fast</span></div>
                <div><span style={{ color: colors.textDim }}>Cost: </span><span style={{ color: colors.success, fontWeight: 600 }}>Cheap</span></div>
                <div><span style={{ color: colors.textDim }}>Reliability: </span><span style={{ color: colors.danger, fontWeight: 600 }}>Error-prone</span></div>
                <div><span style={{ color: colors.textDim }}>Memory: </span><span style={{ color: colors.danger, fontWeight: 600 }}>None</span></div>
                <div><span style={{ color: colors.textDim }}>Audit: </span><span style={{ color: colors.danger, fontWeight: 600 }}>None</span></div>
                {humanResult && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${colors.border}` }}>
                    <div style={{ fontSize: '11px', color: colors.textDim, marginBottom: '4px' }}>
                      Accuracy: {humanResult.correctCount}/{humanResult.totalCables} correct ({((humanResult.correctCount / humanResult.totalCables) * 100).toFixed(0)}%)
                    </div>
                    {humanResult.errors > 0 && (
                      <div style={{ fontSize: '11px', color: colors.danger, marginBottom: '4px' }}>
                        ⚠ {humanResult.errors} misplugged cable{humanResult.errors > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                )}
                {humanResult?.hasIssue && (
                  <>
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${colors.border}` }}>
                      <div style={{ color: colors.danger, fontWeight: 600, marginBottom: '4px' }}>Issue Detected</div>
                      <div style={{ fontSize: '11px', color: colors.textDim }}>Root cause: Unknown</div>
                      <div style={{ fontSize: '11px', color: colors.textDim }}>MTTR: {humanResult.mttr} hours</div>
                      <div style={{ fontSize: '11px', color: colors.textDim }}>SLA penalty: {humanResult.sla}%</div>
                    </div>
                  </>
                )}
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${colors.border}`, fontSize: '11px', color: colors.textDim }}>
                  Tail risk: Explodes with scale
                </div>
              </div>
            </div>
            
            {/* Robot Results */}
            <div style={{ padding: '20px', background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '4px' }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: colors.text, marginBottom: '16px', textAlign: 'center' }}>Robot</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div><span style={{ color: colors.textDim }}>Speed: </span><span style={{ color: colors.warning, fontWeight: 600 }}>Slower</span></div>
                <div><span style={{ color: colors.textDim }}>Precision: </span><span style={{ color: colors.success, fontWeight: 600 }}>High</span></div>
                <div><span style={{ color: colors.textDim }}>Logged: </span><span style={{ color: colors.success, fontWeight: 600 }}>Yes</span></div>
                <div><span style={{ color: colors.textDim }}>Verifiable: </span><span style={{ color: colors.success, fontWeight: 600 }}>Yes</span></div>
                <div><span style={{ color: colors.textDim }}>Improvement: </span><span style={{ color: colors.success, fontWeight: 600 }}>With repetition</span></div>
                {robotResult && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${colors.border}` }}>
                    <div style={{ fontSize: '11px', color: colors.success, marginBottom: '4px' }}>
                      ✓ Accuracy: {robotResult.correctCount}/{robotResult.totalCables} correct (100%)
                    </div>
                    <div style={{ fontSize: '11px', color: colors.textDim }}>
                      All cables logged with timestamps and verification
                    </div>
                  </div>
                )}
                {robotResult?.hasIssue && (
                  <>
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${colors.border}` }}>
                      <div style={{ color: colors.warning, fontWeight: 600, marginBottom: '4px' }}>Issue Detected</div>
                      <div style={{ fontSize: '11px', color: colors.textDim }}>Timestamp: {robotResult.timestamp}</div>
                      <div style={{ fontSize: '11px', color: colors.textDim }}>Action: {robotResult.action}</div>
                      <div style={{ fontSize: '11px', color: colors.success }}>MTTR: {robotResult.mttr} minutes</div>
                      <div style={{ fontSize: '11px', color: colors.success }}>SLA penalty: {robotResult.sla}%</div>
                    </div>
                  </>
                )}
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${colors.border}`, fontSize: '11px', color: colors.textDim }}>
                  Tail risk: Collapses with scale
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <button onClick={reset}
              style={{ padding: '12px 24px', background: colors.accent, border: 'none', borderRadius: '4px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const FlywheelDynamicsVisualizer = () => {
  const [budget, setBudget] = useState(500000);
  const [quarter, setQuarter] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [totalInvested, setTotalInvested] = useState(0);
  const [history, setHistory] = useState([]);
  
  const [nodes, setNodes] = useState([
    {
      id: 'capex',
      name: 'Lower CapEx',
      description: 'Robot production cost',
      currentValue: 45000,
      baseValue: 45000,
      unit: '$',
      investmentEffect: -500,
      pendingEffects: [],
      history: [45000],
      connections: [
        { to: 'financing', multiplier: 0.7, lag: 1 },
        { to: 'scale', multiplier: 0.3, lag: 2 }
      ]
    },
    {
      id: 'financing',
      name: 'Better Financing',
      description: 'Financing rate',
      currentValue: 12,
      baseValue: 12,
      unit: '%',
      investmentEffect: -0.3,
      pendingEffects: [],
      history: [12],
      connections: [
        { to: 'deployments', multiplier: 0.8, lag: 1 }
      ]
    },
    {
      id: 'deployments',
      name: 'More Deployments',
      description: 'Active deployments',
      currentValue: 50,
      baseValue: 50,
      unit: 'units',
      investmentEffect: 3,
      pendingEffects: [],
      history: [50],
      connections: [
        { to: 'scale', multiplier: 0.6, lag: 1 }
      ]
    },
    {
      id: 'scale',
      name: 'Manufacturing Scale',
      description: 'Scale factor',
      currentValue: 1.0,
      baseValue: 1.0,
      unit: 'x',
      investmentEffect: 0.05,
      pendingEffects: [],
      history: [1.0],
      connections: [
        { to: 'capex', multiplier: 0.5, lag: 2 },
        { to: 'supply', multiplier: 0.4, lag: 1 }
      ]
    },
    {
      id: 'supply',
      name: 'Robust Supply Chain',
      description: 'Supply chain score',
      currentValue: 60,
      baseValue: 60,
      unit: '%',
      investmentEffect: 2,
      pendingEffects: [],
      history: [60],
      connections: [
        { to: 'capex', multiplier: 0.3, lag: 1 },
        { to: 'financing', multiplier: 0.2, lag: 1 }
      ]
    }
  ]);
  
  const investmentAmount = 50000;
  const centerX = 400;
  const centerY = 300;
  const radius = 200;
  
  const getNodePosition = (index, total) => {
    const angle = (index * 2 * Math.PI / total) - Math.PI / 2;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      angle
    };
  };
  
  const invest = (nodeId) => {
    if (budget < investmentAmount) return;
    
    const nodeIndex = nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) return;
    
    const node = nodes[nodeIndex];
    const newValue = node.id === 'capex' || node.id === 'financing' 
      ? Math.max(node.currentValue + node.investmentEffect, node.baseValue * 0.5)
      : node.currentValue + node.investmentEffect;
    
    setNodes(prev => prev.map((n, i) => 
      i === nodeIndex 
        ? { ...n, currentValue: newValue, history: [...n.history.slice(-7), newValue] }
        : n
    ));
    
    setBudget(prev => prev - investmentAmount);
    setTotalInvested(prev => prev + investmentAmount);
    setHistory(prev => [...prev, { quarter, type: 'investment', node: nodeId, amount: investmentAmount }]);
  };
  
  const advanceQuarter = () => {
    setNodes(prev => {
      // First, process pending effects and calculate new values
      const updated = prev.map(node => {
        const effectsToApply = node.pendingEffects.filter(e => e.quartersRemaining === 1);
        let newValue = node.currentValue;
        
        effectsToApply.forEach(effect => {
          if (node.id === 'capex' || node.id === 'financing') {
            newValue = Math.max(newValue + effect.amount, node.baseValue * 0.5);
          } else {
            newValue = newValue + effect.amount;
          }
        });
        
        const newPending = node.pendingEffects
          .map(effect => ({ ...effect, quartersRemaining: effect.quartersRemaining - 1 }))
          .filter(effect => effect.quartersRemaining > 0);
        
        return {
          ...node,
          currentValue: newValue,
          pendingEffects: newPending,
          history: [...node.history.slice(-7), newValue]
        };
      });
      
      // Then, generate new effects from current node values
      return updated.map(node => {
        const incomingEffects = updated
          .filter(n => n.connections.some(c => c.to === node.id))
          .flatMap(n => {
            const conn = n.connections.find(c => c.to === node.id);
            if (!conn) return [];
            const baseDiff = n.currentValue - n.baseValue;
            if (Math.abs(baseDiff) < 0.01) return [];
            
            let effectAmount = baseDiff * conn.multiplier;
            // Convert units appropriately
            if (node.unit === '$' && n.unit !== '$') effectAmount = effectAmount * 1000;
            if (node.unit === '%' && n.unit === '$') effectAmount = effectAmount / 1000;
            if (node.unit === 'x' && n.unit !== 'x') effectAmount = effectAmount / 100;
            
            return [{
              amount: effectAmount,
              fromNode: n.id,
              quartersRemaining: conn.lag
            }];
          });
        
        return {
          ...node,
          pendingEffects: [...node.pendingEffects, ...incomingEffects]
        };
      });
    });
    
    setQuarter(prev => {
      const newQuarter = prev + 1;
      setNodes(currentNodes => {
        const deploymentsNode = currentNodes.find(n => n.id === 'deployments');
        const revenue = (deploymentsNode?.currentValue || 50) * 5000;
        setHistory(h => [...h, { quarter: newQuarter, type: 'quarter', revenue }]);
        return currentNodes;
      });
      return newQuarter;
    });
  };
  
  const autoPlayRef = useRef(null);
  const maxQuarters = 20; // Stop auto-play after 20 quarters
  
  useEffect(() => {
    if (isAutoPlaying && quarter < maxQuarters) {
      autoPlayRef.current = setInterval(() => {
        if (quarter < maxQuarters) {
          advanceQuarter();
        } else {
          setIsAutoPlaying(false);
        }
      }, 2000);
    } else {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
      if (quarter >= maxQuarters) {
        setIsAutoPlaying(false);
      }
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isAutoPlaying, quarter]);
  
  const calculateMetrics = () => {
    const capexNode = nodes.find(n => n.id === 'capex');
    const deploymentsNode = nodes.find(n => n.id === 'deployments');
    const quarterlyRevenue = (deploymentsNode?.currentValue || 50) * 5000;
    const revenue = history.filter(h => h.type === 'quarter').reduce((sum, h) => sum + (h.revenue || 0), 0) + quarterlyRevenue;
    const paybackPeriod = capexNode ? (capexNode.currentValue / (quarterlyRevenue / 3)) : 9;
    const roi = totalInvested > 0 ? ((revenue - totalInvested) / totalInvested * 100) : 0;
    
    return { revenue, paybackPeriod, roi };
  };
  
  const metrics = calculateMetrics();
  
  const reset = () => {
    setBudget(500000);
    setQuarter(0);
    setTotalInvested(0);
    setHistory([]);
    setIsAutoPlaying(false);
    setNodes([
      {
        id: 'capex',
        name: 'Lower CapEx',
        description: 'Robot production cost',
        currentValue: 45000,
        baseValue: 45000,
        unit: '$',
        investmentEffect: -500,
        pendingEffects: [],
        history: [45000],
        connections: [
          { to: 'financing', multiplier: 0.7, lag: 1 },
          { to: 'scale', multiplier: 0.3, lag: 2 }
        ]
      },
      {
        id: 'financing',
        name: 'Better Financing',
        description: 'Financing rate',
        currentValue: 12,
        baseValue: 12,
        unit: '%',
        investmentEffect: -0.3,
        pendingEffects: [],
        history: [12],
        connections: [
          { to: 'deployments', multiplier: 0.8, lag: 1 }
        ]
      },
      {
        id: 'deployments',
        name: 'More Deployments',
        description: 'Active deployments',
        currentValue: 50,
        baseValue: 50,
        unit: 'units',
        investmentEffect: 3,
        pendingEffects: [],
        history: [50],
        connections: [
          { to: 'scale', multiplier: 0.6, lag: 1 }
        ]
      },
      {
        id: 'scale',
        name: 'Manufacturing Scale',
        description: 'Scale factor',
        currentValue: 1.0,
        baseValue: 1.0,
        unit: 'x',
        investmentEffect: 0.05,
        pendingEffects: [],
        history: [1.0],
        connections: [
          { to: 'capex', multiplier: 0.5, lag: 2 },
          { to: 'supply', multiplier: 0.4, lag: 1 }
        ]
      },
      {
        id: 'supply',
        name: 'Robust Supply Chain',
        description: 'Supply chain score',
        currentValue: 60,
        baseValue: 60,
        unit: '%',
        investmentEffect: 2,
        pendingEffects: [],
        history: [60],
        connections: [
          { to: 'capex', multiplier: 0.3, lag: 1 },
          { to: 'financing', multiplier: 0.2, lag: 1 }
        ]
      }
    ]);
  };
  
  return (
    <div style={{ padding: '24px', background: colors.bgCard, borderRadius: '4px', border: `1px solid ${colors.border}`, marginBottom: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px', color: colors.text, fontFamily: 'Georgia, serif' }}>
          Figure 5: Flywheel Dynamics
        </h2>
        <p style={{ color: colors.textDim, fontSize: '13px', fontStyle: 'italic' }}>
          Invest $50k in any node. Effects propagate to connected nodes over time.
        </p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px', marginBottom: '24px' }}>
        {/* Main Flywheel Diagram - Grid Layout */}
        <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: '4px', padding: '24px' }}>
          {/* Node Grid - 2 rows, 3 columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
            {/* Row 1: CapEx, Financing, Deployments */}
            {nodes.filter(n => ['capex', 'financing', 'deployments'].includes(n.id)).map(node => {
              const isImproving = node.id === 'capex' || node.id === 'financing' 
                ? node.currentValue < node.baseValue
                : node.currentValue > node.baseValue;
              const change = node.currentValue - node.baseValue;
              const pendingCount = node.pendingEffects.length;
              
              return (
                <div
                  key={node.id}
                  style={{
                    background: colors.bgCard,
                    border: `2px solid ${isImproving ? colors.success : colors.border}`,
                    borderRadius: '8px',
                    padding: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 600, color: colors.text, marginBottom: '8px' }}>
                    {node.name}
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: colors.text, fontFamily: 'Georgia, serif', marginBottom: '4px' }}>
                    {node.unit === '$' && '$'}
                    {node.unit === '$' ? node.currentValue.toLocaleString() : node.currentValue.toFixed(node.unit === 'x' ? 2 : 1)}
                    {node.unit === '%' && '%'}
                    {node.unit === 'units' && ''}
                  </div>
                  <div style={{ fontSize: '10px', color: isImproving ? colors.success : colors.textDim, marginBottom: '12px' }}>
                    {change > 0 ? '+' : ''}{change.toFixed(node.unit === 'x' ? 2 : 1)} {node.unit}
                    {pendingCount > 0 && <span style={{ marginLeft: '8px', color: colors.warning }}>• {pendingCount} pending</span>}
                  </div>
                  <button
                    onClick={() => invest(node.id)}
                    disabled={budget < investmentAmount}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: budget >= investmentAmount ? colors.accent : colors.border,
                      border: 'none',
                      borderRadius: '4px',
                      color: budget >= investmentAmount ? '#fff' : colors.textDim,
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: budget >= investmentAmount ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Invest ${(investmentAmount / 1000).toFixed(0)}k
                  </button>
                  {node.connections.length > 0 && (
                    <div style={{ fontSize: '9px', color: colors.textDim, marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${colors.border}` }}>
                      Affects: {node.connections.map(c => {
                        const target = nodes.find(n => n.id === c.to);
                        return target?.name;
                      }).filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Row 2: Empty, Scale, Supply */}
            <div></div>
            {nodes.filter(n => ['scale', 'supply'].includes(n.id)).map(node => {
              const isImproving = node.id === 'capex' || node.id === 'financing' 
                ? node.currentValue < node.baseValue
                : node.currentValue > node.baseValue;
              const change = node.currentValue - node.baseValue;
              const pendingCount = node.pendingEffects.length;
              
              return (
                <div
                  key={node.id}
                  style={{
                    background: colors.bgCard,
                    border: `2px solid ${isImproving ? colors.success : colors.border}`,
                    borderRadius: '8px',
                    padding: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 600, color: colors.text, marginBottom: '8px' }}>
                    {node.name}
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: colors.text, fontFamily: 'Georgia, serif', marginBottom: '4px' }}>
                    {node.unit === '$' && '$'}
                    {node.unit === '$' ? node.currentValue.toLocaleString() : node.currentValue.toFixed(node.unit === 'x' ? 2 : 1)}
                    {node.unit === '%' && '%'}
                    {node.unit === 'units' && ''}
                  </div>
                  <div style={{ fontSize: '10px', color: isImproving ? colors.success : colors.textDim, marginBottom: '12px' }}>
                    {change > 0 ? '+' : ''}{change.toFixed(node.unit === 'x' ? 2 : 1)} {node.unit}
                    {pendingCount > 0 && <span style={{ marginLeft: '8px', color: colors.warning }}>• {pendingCount} pending</span>}
                  </div>
                  <button
                    onClick={() => invest(node.id)}
                    disabled={budget < investmentAmount}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: budget >= investmentAmount ? colors.accent : colors.border,
                      border: 'none',
                      borderRadius: '4px',
                      color: budget >= investmentAmount ? '#fff' : colors.textDim,
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: budget >= investmentAmount ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Invest ${(investmentAmount / 1000).toFixed(0)}k
                  </button>
                  {node.connections.length > 0 && (
                    <div style={{ fontSize: '9px', color: colors.textDim, marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${colors.border}` }}>
                      Affects: {node.connections.map(c => {
                        const target = nodes.find(n => n.id === c.to);
                        return target?.name;
                      }).filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Connection Flow Diagram */}
          <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '4px', padding: '16px', marginTop: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: colors.text, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              How Effects Flow
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '10px' }}>
              {nodes.map(node => {
                if (node.connections.length === 0) return null;
                return (
                  <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, color: colors.text, minWidth: '120px' }}>{node.name}</span>
                    <span style={{ color: colors.textDim }}>→</span>
                    {node.connections.map((conn, idx) => {
                      const target = nodes.find(n => n.id === conn.to);
                      return (
                        <span key={conn.to} style={{ color: colors.textDim }}>
                          {target?.name} ({conn.multiplier}x, {conn.lag}Q){idx < node.connections.length - 1 ? ', ' : ''}
                        </span>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Control Panel & Metrics */}
        <div>
          <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '4px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: colors.text, marginBottom: '16px' }}>Controls</div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', color: colors.textDim, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Capital Budget</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: colors.text, fontFamily: 'Georgia, serif' }}>
                ${(budget / 1000).toFixed(0)}k
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', color: colors.textDim, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Quarter</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: colors.text, fontFamily: 'Georgia, serif' }}>
                Q{quarter}
              </div>
            </div>
            <button
              onClick={advanceQuarter}
              style={{
                width: '100%',
                padding: '10px',
                background: colors.accent,
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '8px'
              }}
            >
              Advance Quarter
            </button>
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              disabled={quarter >= maxQuarters}
              style={{
                width: '100%',
                padding: '10px',
                background: quarter >= maxQuarters ? colors.border : (isAutoPlaying ? colors.danger : colors.warning),
                border: 'none',
                borderRadius: '4px',
                color: quarter >= maxQuarters ? colors.textDim : '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: quarter >= maxQuarters ? 'not-allowed' : 'pointer',
                marginBottom: '8px'
              }}
            >
              {quarter >= maxQuarters ? 'Max Quarters Reached' : (isAutoPlaying ? '⏸ Stop' : '▶ Auto-play')}
            </button>
            {quarter >= maxQuarters && (
              <div style={{ fontSize: '10px', color: colors.textDim, textAlign: 'center', marginTop: '-8px', marginBottom: '8px' }}>
                Reached Q{maxQuarters} limit
              </div>
            )}
            <button
              onClick={reset}
              style={{
                width: '100%',
                padding: '10px',
                background: colors.border,
                border: 'none',
                borderRadius: '4px',
                color: colors.text,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Reset
            </button>
          </div>
          
          <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '4px', padding: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: colors.text, marginBottom: '16px' }}>Outcomes</div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', color: colors.textDim, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Revenue</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: colors.text, fontFamily: 'Georgia, serif' }}>
                ${(metrics.revenue / 1000).toFixed(0)}k
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', color: colors.textDim, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payback</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: colors.text, fontFamily: 'Georgia, serif' }}>
                {metrics.paybackPeriod.toFixed(1)} mo
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', color: colors.textDim, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invested</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: colors.text, fontFamily: 'Georgia, serif' }}>
                ${(totalInvested / 1000).toFixed(0)}k
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: colors.textDim, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ROI</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: metrics.roi > 0 ? colors.success : colors.text, fontFamily: 'Georgia, serif' }}>
                {metrics.roi > 0 ? '+' : ''}{metrics.roi.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
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
    { id: 'comparison', name: 'Human vs Robot' },
    { id: 'flywheel', name: 'Flywheel Dynamics' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, padding: '32px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input[type="range"]::-webkit-slider-thumb { appearance: none; width: 14px; height: 14px; background: ${colors.accent}; border-radius: 50%; cursor: pointer; border: 2px solid #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }
        @keyframes dashMove {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 20; }
        }
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
        {activeTab === 'comparison' && <HumanVsRobotComparison />}
        {activeTab === 'flywheel' && <FlywheelDynamicsVisualizer />}
        
        <footer style={{ marginTop: '32px', paddingTop: '16px', borderTop: `1px solid ${colors.border}`, textAlign: 'center', color: colors.textDim, fontSize: '11px' }}>
          Interactive supplement to unit economics analysis · Model parameters derived from industry data
        </footer>
      </div>
    </div>
  );
}

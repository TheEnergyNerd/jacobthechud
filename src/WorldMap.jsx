import React, { useState, useEffect, useMemo } from 'react';
import * as d3 from 'd3';

const countryWages = {
  'United States of America': 35.00, 'Canada': 32.00, 'Mexico': 5.50, 'Brazil': 8.50,
  'Argentina': 6.00, 'Chile': 7.50, 'Colombia': 3.80, 'Peru': 3.20, 'Venezuela': 2.50,
  'United Kingdom': 33.00, 'France': 42.00, 'Germany': 52.00, 'Italy': 34.00,
  'Spain': 26.00, 'Portugal': 14.00, 'Netherlands': 42.00, 'Belgium': 48.00,
  'Switzerland': 62.00, 'Austria': 44.00, 'Sweden': 46.00, 'Norway': 58.00,
  'Finland': 40.00, 'Denmark': 50.00, 'Poland': 12.00, 'Russia': 6.50,
  'China': 7.50, 'Japan': 28.00, 'South Korea': 24.00, 'India': 2.20,
  'Australia': 38.00, 'New Zealand': 28.00, 'South Africa': 5.50, 'Egypt': 2.00,
  'Saudi Arabia': 9.00, 'Turkey': 6.50, 'Indonesia': 2.50, 'Thailand': 4.50,
  'Vietnam': 3.00, 'Viet Nam': 3.00, 'Malaysia': 5.50, 'Singapore': 26.00, 
  'Philippines': 2.80, 'Pakistan': 1.80, 'Bangladesh': 0.95, 'Iran': 4.00, 
  'Israel': 25.00, 'United Arab Emirates': 8.00, 'Nigeria': 1.50, 'Kenya': 2.00, 
  'Ukraine': 4.00, 'Greece': 16.00, 'Czechia': 16.00, 'Czech Republic': 16.00,
  'Hungary': 12.50, 'Romania': 9.00, 'Ireland': 38.00, 'Greenland': 45.00, 
  'Iceland': 50.00, 'Taiwan': 12.00,
};

const width = 900;
const height = 500;

export default function WorldMapEconomics() {
  const [robotCapEx, setRobotCapEx] = useState(45000);
  const [hovered, setHovered] = useState(null);
  const [geoData, setGeoData] = useState(null);

  // D3 Natural Earth projection - handles everything properly
  const projection = useMemo(() => 
    d3.geoNaturalEarth1()
      .scale(170)
      .translate([width / 2, height / 2])
  , []);

  const pathGenerator = useMemo(() => d3.geoPath().projection(projection), [projection]);

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(res => res.json())
      .then(topology => {
        const countries = decodeTopology(topology);
        setGeoData(countries);
      })
      .catch(console.error);
  }, []);

  function decodeTopology(topology) {
    const { arcs, transform, objects } = topology;
    
    const decodedArcs = arcs.map(arc => {
      const coords = [];
      let x = 0, y = 0;
      for (const [dx, dy] of arc) {
        x += dx;
        y += dy;
        coords.push([
          x * transform.scale[0] + transform.translate[0],
          y * transform.scale[1] + transform.translate[1]
        ]);
      }
      return coords;
    });

    function decodeRing(indices) {
      const coords = [];
      for (const idx of indices) {
        const arc = decodedArcs[idx < 0 ? ~idx : idx];
        const points = idx < 0 ? [...arc].reverse() : arc;
        const start = coords.length > 0 ? 1 : 0;
        for (let i = start; i < points.length; i++) {
          coords.push(points[i]);
        }
      }
      return coords;
    }

    function decodeGeom(geom) {
      if (geom.type === 'Polygon') {
        return { type: 'Polygon', coordinates: geom.arcs.map(decodeRing) };
      } else if (geom.type === 'MultiPolygon') {
        return { type: 'MultiPolygon', coordinates: geom.arcs.map(p => p.map(decodeRing)) };
      }
      return null;
    }

    return {
      type: 'FeatureCollection',
      features: objects.countries.geometries.map(geom => ({
        type: 'Feature',
        properties: geom.properties || {},
        geometry: decodeGeom(geom)
      }))
    };
  }

  const robotRate = useMemo(() => {
    const hoursPerYear = 16 * 300;
    const totalHours = hoursPerYear * 3;
    return ((robotCapEx / totalHours) + ((robotCapEx * 0.15) / hoursPerYear) + 0.50 + (6.29 / 8)) / (0.70 * 0.85);
  }, [robotCapEx]);

  const getWage = (name) => countryWages[name] || null;

  const getColor = (name) => {
    const wage = getWage(name);
    if (!wage) return '#d4d4d4';
    const savings = wage - robotRate;
    if (savings <= 0) return '#fca5a5';
    const pct = (savings / wage) * 100;
    if (pct > 70) return '#047857';
    if (pct > 50) return '#059669';
    if (pct > 30) return '#10b981';
    if (pct > 10) return '#6ee7b7';
    return '#fde047';
  };

  const viableCount = Object.values(countryWages).filter(w => w > robotRate).length;

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px' }}>
        
        <header style={{ marginBottom: '20px', borderBottom: '2px solid #111', paddingBottom: '12px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111', fontFamily: 'Georgia, serif', margin: 0 }}>
            Global Robot Labor Arbitrage
          </h1>
          <p style={{ color: '#666', fontSize: '14px', margin: '8px 0 0' }}>
            Where robots are cheaper than human labor at current system prices
          </p>
        </header>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr auto auto', 
          gap: '16px', 
          padding: '16px 20px', 
          background: '#fff', 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          marginBottom: '16px', 
          alignItems: 'center' 
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500 }}>Robot System CapEx</span>
              <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'Georgia, serif' }}>
                ${robotCapEx.toLocaleString()}
              </span>
            </div>
            <input 
              type="range" 
              min={15000} 
              max={120000} 
              step={5000} 
              value={robotCapEx}
              onChange={(e) => setRobotCapEx(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }} 
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#888', marginTop: '4px' }}>
              <span>$15K</span><span>$45K</span><span>$80K</span><span>$120K</span>
            </div>
          </div>
          
          <div style={{ padding: '14px 24px', background: '#2563eb', borderRadius: '8px', textAlign: 'center', color: '#fff' }}>
            <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '2px' }}>Robot Rate</div>
            <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Georgia, serif' }}>
              ${robotRate.toFixed(2)}<span style={{ fontSize: '14px' }}>/hr</span>
            </div>
          </div>

          <div style={{ 
            padding: '14px 24px', 
            background: viableCount > 30 ? '#dcfce7' : '#fef9c3', 
            borderRadius: '8px', 
            textAlign: 'center' 
          }}>
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>Countries Viable</div>
            <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Georgia, serif' }}>{viableCount}</div>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', position: 'relative' }}>
          <svg 
            viewBox={`0 0 ${width} ${height}`} 
            style={{ width: '100%', height: '450px', background: '#dbeafe', borderRadius: '4px', display: 'block' }}
          >
            {geoData?.features?.map((feature, i) => {
              const name = feature.properties?.name || '';
              const path = pathGenerator(feature.geometry);
              if (!path) return null;
              
              const wage = getWage(name);
              const isHovered = hovered === name;
              
              return (
                <path
                  key={i}
                  d={path}
                  fill={isHovered ? '#1e40af' : getColor(name)}
                  stroke="#fff"
                  strokeWidth={0.5}
                  style={{ cursor: wage ? 'pointer' : 'default' }}
                  onMouseEnter={() => wage && setHovered(name)}
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })}
            
            {!geoData && (
              <text x={width/2} y={height/2} textAnchor="middle" fill="#666" fontSize="14">
                Loading map...
              </text>
            )}
          </svg>

          <div style={{ 
            position: 'absolute', 
            bottom: '24px', 
            left: '24px', 
            background: 'rgba(255,255,255,0.95)', 
            padding: '12px', 
            borderRadius: '6px', 
            border: '1px solid #e5e7eb', 
            fontSize: '11px' 
          }}>
            <div style={{ fontWeight: 600, marginBottom: '8px' }}>Robot vs Human</div>
            {[
              { c: '#047857', l: '70%+ savings' },
              { c: '#059669', l: '50-70%' },
              { c: '#10b981', l: '30-50%' },
              { c: '#6ee7b7', l: '10-30%' },
              { c: '#fde047', l: '0-10%' },
              { c: '#fca5a5', l: 'Human cheaper' },
            ].map((x, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <div style={{ width: '16px', height: '12px', background: x.c, borderRadius: '2px' }} />
                <span>{x.l}</span>
              </div>
            ))}
          </div>

          {hovered && (
            <div style={{ 
              position: 'absolute', 
              top: '24px', 
              right: '24px', 
              background: '#1e293b', 
              color: '#fff', 
              padding: '14px 18px', 
              borderRadius: '8px', 
              fontSize: '12px', 
              minWidth: '170px' 
            }}>
              <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '15px', fontFamily: 'Georgia, serif' }}>
                {hovered}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                <span style={{ opacity: 0.7 }}>Human</span>
                <span>${getWage(hovered)?.toFixed(2)}/hr</span>
                <span style={{ opacity: 0.7 }}>Robot</span>
                <span>${robotRate.toFixed(2)}/hr</span>
                <span style={{ opacity: 0.7 }}>Savings</span>
                <span style={{ color: getWage(hovered) > robotRate ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                  {getWage(hovered) > robotRate 
                    ? `$${(getWage(hovered) - robotRate).toFixed(2)}/hr` 
                    : 'None'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: '16px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '10px', color: '#666', letterSpacing: '0.5px' }}>
            ROBOT HOURLY RATE BREAKDOWN
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '12px' }}>
            <span style={{ padding: '5px 10px', background: '#eff6ff', borderRadius: '4px' }}>
              CapEx <strong style={{ fontFamily: 'Georgia, serif' }}>${(robotCapEx / (16 * 300 * 3)).toFixed(2)}</strong>
            </span>
            <span>+</span>
            <span style={{ padding: '5px 10px', background: '#f0fdf4', borderRadius: '4px' }}>
              Maint <strong style={{ fontFamily: 'Georgia, serif' }}>${((robotCapEx * 0.15) / (16 * 300)).toFixed(2)}</strong>
            </span>
            <span>+</span>
            <span style={{ padding: '5px 10px', background: '#fefce8', borderRadius: '4px' }}>
              Power <strong style={{ fontFamily: 'Georgia, serif' }}>$0.50</strong>
            </span>
            <span>+</span>
            <span style={{ padding: '5px 10px', background: '#faf5ff', borderRadius: '4px' }}>
              Teleop <strong style={{ fontFamily: 'Georgia, serif' }}>$0.79</strong>
            </span>
            <span>÷ 60%</span>
            <span>=</span>
            <span style={{ padding: '5px 12px', background: '#111', color: '#fff', borderRadius: '4px', fontFamily: 'Georgia, serif', fontWeight: 700 }}>
              ${robotRate.toFixed(2)}/hr
            </span>
          </div>
        </div>

        <footer style={{ marginTop: '16px', textAlign: 'center', color: '#999', fontSize: '10px' }}>
          Data: BLS, Conference Board, KPMG (2024)
        </footer>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import WorldMap from './WorldMap';
import SupplyChain from './SupplyChain';
import DatacenterMarket from './DatacenterMarket';
import DeploymentFlywheel from './DeploymentFlywheel';

const tabs = [
  { id: 'map', label: 'Global Labor Arbitrage', component: WorldMap },
  { id: 'supply', label: 'Supply Chain', component: SupplyChain },
  { id: 'datacenter', label: 'Datacenter Market', component: DatacenterMarket },
  { id: 'flywheel', label: 'Deployment Flywheel', component: DeploymentFlywheel },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || WorldMap;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Navigation */}
      <nav style={{ 
        background: '#111', 
        padding: '12px 24px',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              background: activeTab === tab.id ? '#2563eb' : 'transparent',
              color: '#fff',
              border: activeTab === tab.id ? 'none' : '1px solid #444',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Active Visualization */}
      <ActiveComponent />
    </div>
  );
}

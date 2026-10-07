import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import OperationalBoard from './OperationalBoard';
import DirectOrder from './DirectOrder';

const TABS = [
  { key: 'projects',      label: 'Projects',        path: '/project-tracking/projects' },
  { key: 'missing-extra', label: 'Missing & Extra',  path: '/project-tracking/missing-extra' },
  { key: 'direct-order',  label: 'Direct Order',     path: '/project-tracking/direct-order' },
] as const;

type TabKey = typeof TABS[number]['key'];

const ProjectsHub: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeKey: TabKey =
    TABS.find(t => location.pathname.startsWith(t.path))?.key ?? 'projects';

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Tab bar — fixed so it stays visible while scrolling */}
      <div style={{
        display: 'flex',
        backgroundColor: '#ffffff',
        borderBottom: '2px solid #e0e0e0',
        padding: '0 16px',
        position: 'fixed',
        top: '64px',
        left: 0,
        right: 0,
        zIndex: 101,
      }}>
        {TABS.map(tab => {
          const isActive = tab.key === activeKey;
          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.path)}
              style={{
                padding: '11px 20px',
                border: 'none',
                borderBottom: isActive ? '2px solid #1a2c5b' : '2px solid transparent',
                marginBottom: '-2px',
                backgroundColor: 'transparent',
                color: isActive ? '#1a2c5b' : '#888',
                fontWeight: isActive ? 600 : 400,
                fontSize: '14px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Spacer to push content below the fixed tab bar (≈44px) */}
      <div style={{ height: '44px', flexShrink: 0 }} />

      {/* Page content — existing pages unchanged */}
      {activeKey === 'projects'      && <OperationalBoard />}
      {activeKey === 'missing-extra' && <OperationalBoard mode="missingExtra" />}
      {activeKey === 'direct-order'  && <DirectOrder />}
    </div>
  );
};

export default ProjectsHub;

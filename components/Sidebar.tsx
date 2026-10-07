import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { NAV_PAGES } from '../lib/permissionKeys';
import {
  LayoutDashboard,
  Kanban,
  Building2,
  CircleDollarSign,
  BarChart3,
  ShieldCheck,
  ScrollText,
  Wallet,
  Receipt,
  FileText,
  PackageX,
  DatabaseBackup,
  Trash2,
  HardDrive,
  ClipboardList,
  ClipboardCheck,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const NAV_GROUPS: { label: string | null; paths: string[] }[] = [
  {
    label: null,
    paths: ['/dashboard', '/project-tracking/projects'],
  },
  {
    label: 'Suppliers',
    paths: ['/suppliers', '/supplier-total', '/project-total', '/reports'],
  },
  {
    label: 'Expenses',
    paths: ['/trust-expenses', '/expenses-p', '/expenses-direct-order', '/expenses-missing-extra'],
  },
  {
    label: 'Admin',
    paths: ['/admin/roles', '/admin/activity-log', '/admin/backup-restore', '/admin/trash-bin'],
  },
  {
    label: 'Tools',
    paths: ['/dropbox-test', '/price-list', '/pending-approvals'],
  },
];

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Kanban,
  Building2,
  CircleDollarSign,
  BarChart3,
  ShieldCheck,
  ScrollText,
  Wallet,
  Receipt,
  FileText,
  PackageX,
  DatabaseBackup,
  Trash2,
  HardDrive,
  ClipboardList,
  ClipboardCheck,
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onMenuSelect: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onMenuSelect }) => {
  const { canAccessPage } = useAuth();

  // Close on ESC key
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleMenuClick = () => {
    onMenuSelect(); // Close sidebar when any menu item is clicked
  };

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const visiblePages = NAV_PAGES.filter(page => canAccessPage(page.key));
  const visiblePathSet = new Set(visiblePages.map(p => p.path));
  const pageByPath = Object.fromEntries(visiblePages.map(p => [p.path, p]));

  return (
    <div className="sidebar-overlay" onClick={handleOverlayClick}>
      <div className="sidebar" onClick={(e) => e.stopPropagation()}>
        {/* Header with close button */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="sidebar-brand-dot" />
            <h3 className="sidebar-title">Trust Project</h3>
          </div>
          <button className="sidebar-close" onClick={onClose} aria-label="Close navigation menu">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Grouped menu */}
        <nav className="sidebar-nav" role="navigation" aria-label="Main navigation">
          {NAV_GROUPS.map((group, groupIndex) => {
            const items = group.paths
              .filter(path => visiblePathSet.has(path))
              .map(path => pageByPath[path]);

            if (items.length === 0) return null;

            return (
              <div key={groupIndex} className="sidebar-group">
                {group.label && (
                  <div className="sidebar-group-label">{group.label}</div>
                )}
                {items.map((item) => {
                  const IconComponent = ICON_MAP[item.icon];
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `sidebar-menu-item ${isActive ? 'active' : ''}`
                      }
                      onClick={handleMenuClick}
                    >
                      <span className="menu-icon" aria-hidden="true">
                        {IconComponent ? <IconComponent size={18} strokeWidth={1.75} /> : null}
                      </span>
                      <span className="menu-label">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;

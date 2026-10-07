import React, { useState, useRef } from 'react';
import { Menu, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logoWhite from '../src/permissions/Trust_Lines_DSB-white.png';

interface GlobalNavbarProps {
  onMenuToggle: () => void;
  onAddProject?: () => void;
}

const GlobalNavbar: React.FC<GlobalNavbarProps> = ({ onMenuToggle, onAddProject }) => {
  const { user, logout } = useAuth();
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const navbarRef = useRef<HTMLDivElement>(null);

  const displayName = user?.displayName || user?.name || user?.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleAccountClick = () => {
    setShowAccountDropdown(!showAccountDropdown);
  };

  const handleAccountAction = async (action: string) => {
    setShowAccountDropdown(false);

    if (action === 'logout') {
      try {
        await logout();
        window.location.href = '/login';
        return;
      } catch {
        window.location.href = '/login';
        return;
      }
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target as Node)) {
        setShowAccountDropdown(false);
      }
    };

    if (showAccountDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAccountDropdown]);

  return (
    <div ref={navbarRef} className="global-navbar">
      {/* Left: Hamburger Menu + Add Project */}
      <div className="navbar-left">
        <button className="navbar-hamburger" onClick={onMenuToggle} aria-label="Toggle navigation">
          <Menu size={20} strokeWidth={2} />
        </button>
        {onAddProject && (
          <button className="navbar-add-project" onClick={onAddProject}>
            <span className="add-project-icon">+</span>
            <span className="add-project-text">Project</span>
          </button>
        )}
      </div>

      {/* Center: Logo */}
      <div className="navbar-center">
        <img src={logoWhite} alt="Trust Lines" className="navbar-logo" />
      </div>

      {/* Right: Account Menu */}
      <button className="navbar-account" onClick={handleAccountClick}>
        <span className="navbar-avatar">{initials}</span>
        <span className="account-name">{displayName}</span>
        <ChevronDown
          size={14}
          strokeWidth={2.5}
          className={`account-chevron ${showAccountDropdown ? 'open' : ''}`}
        />
      </button>

      {/* Account Dropdown */}
      {showAccountDropdown && (
        <div className="navbar-account-dropdown">
          <div className="account-dropdown-header">
            <span className="account-dropdown-name">{displayName}</span>
            <span className="account-dropdown-email">{user?.email || ''}</span>
          </div>
          <div className="account-dropdown-divider" />
          <div className="account-dropdown-item" onClick={() => handleAccountAction('profile')}>
            <User size={14} strokeWidth={2} />
            Profile
          </div>
          <div className="account-dropdown-item" onClick={() => handleAccountAction('settings')}>
            <Settings size={14} strokeWidth={2} />
            Settings
          </div>
          <div className="account-dropdown-divider" />
          <div className="account-dropdown-item account-dropdown-logout" onClick={() => handleAccountAction('logout')}>
            <LogOut size={14} strokeWidth={2} />
            Logout
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalNavbar;
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface TopBarProps {
  onMenuToggle: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuToggle }) => {
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const accountButtonRef = useRef<HTMLButtonElement>(null);

  const handleAccountClick = () => {
    setShowAccountDropdown(!showAccountDropdown);
  };

  const handleAccountAction = (_action: string) => {
    setShowAccountDropdown(false);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountButtonRef.current && !accountButtonRef.current.contains(event.target as Node)) {
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

  // Account dropdown portal
  const accountDropdown = showAccountDropdown && accountButtonRef.current ? (
    createPortal(
      <div className="account-dropdown">
        <div className="account-dropdown-item" onClick={() => handleAccountAction('profile')}>
          Profile
        </div>
        <div className="account-dropdown-item" onClick={() => handleAccountAction('settings')}>
          Settings
        </div>
        <div className="account-dropdown-item" onClick={() => handleAccountAction('logout')}>
          Logout
        </div>
      </div>,
      document.body
    )
  ) : null;

  return (
    <>
      <div className="top-bar">
        {/* Left: Hamburger Menu */}
        <button className="hamburger-button" onClick={onMenuToggle}>
          <span className="hamburger-icon">☰</span>
        </button>

        {/* Center: App Title */}
        <h1 className="app-title">T LINES NE</h1>

        {/* Right: Account Menu */}
        <button
          ref={accountButtonRef}
          className="account-button"
          onClick={handleAccountClick}
        >
          <span className="account-name">Admin</span>
          <span className="account-arrow">▼</span>
        </button>
      </div>

      {accountDropdown}
    </>
  );
};

export default TopBar;
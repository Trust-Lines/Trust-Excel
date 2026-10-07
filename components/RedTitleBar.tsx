import React, { useState, useRef } from 'react';

interface RedTitleBarProps {
  title: string;
  onMenuToggle: () => void;
}

const RedTitleBar: React.FC<RedTitleBarProps> = ({ title, onMenuToggle }) => {
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const redBarRef = useRef<HTMLDivElement>(null);

  const handleAccountClick = () => {
    setShowAccountDropdown(!showAccountDropdown);
  };

  const handleAccountAction = (_action: string) => {
    setShowAccountDropdown(false);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (redBarRef.current && !redBarRef.current.contains(event.target as Node)) {
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
    <div ref={redBarRef} className="red-title-bar">
      {/* Left: Hamburger Menu */}
      <button className="hamburger-button" onClick={onMenuToggle}>
        <span className="hamburger-icon">☰</span>
      </button>

      {/* Center: App Title */}
      <h1>{title}</h1>

      {/* Right: Account Menu */}
      <button
        className="account-button"
        onClick={handleAccountClick}
      >
        <span className="account-name">Admin</span>
        <span className="account-arrow">▼</span>
      </button>

      {/* Account Dropdown - positioned absolutely relative to this bar */}
      {showAccountDropdown && (
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
        </div>
      )}
    </div>
  );
};

export default RedTitleBar;
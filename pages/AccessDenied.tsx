import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { NAV_PAGES } from '../lib/permissionKeys';

const AccessDenied: React.FC = () => {
  const navigate = useNavigate();
  const { canAccessPage, userAccessPolicy } = useAuth();

  // Auto-redirect when permissions change (e.g. admin grants access while user is on this page)
  useEffect(() => {
    const firstAllowed = NAV_PAGES.find(page => canAccessPage(page.key));
    if (firstAllowed) {
      navigate(firstAllowed.path, { replace: true });
    }
  }, [userAccessPolicy]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGoHome = () => {
    const firstAllowed = NAV_PAGES.find(page => canAccessPage(page.key));
    if (firstAllowed) {
      navigate(firstAllowed.path);
    }
  };

  const firstAllowed = NAV_PAGES.find(page => canAccessPage(page.key));

  return (
    <div className="access-denied-page">
      <div className="access-denied-content" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        textAlign: 'center',
        padding: '40px'
      }}>
        <h1 style={{ fontSize: '2rem', color: '#dc3545', marginBottom: '20px' }}>Access Denied</h1>
        <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '30px' }}>
          Your role does not have permission to view this page.
        </p>
        {firstAllowed ? (
          <button
            onClick={handleGoHome}
            style={{
              padding: '12px 24px',
              backgroundColor: '#2c3e50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Go to {firstAllowed.label}
          </button>
        ) : (
          <p style={{ fontSize: '1rem', color: '#999' }}>
            No accessible pages found. Please contact your administrator.
          </p>
        )}
      </div>
    </div>
  );
};

export default AccessDenied;

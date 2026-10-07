import React, { ReactNode, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './PasswordChangeGuard.css';

interface PasswordChangeGuardProps {
  children: ReactNode;
}

const PasswordChangeGuard: React.FC<PasswordChangeGuardProps> = ({ children }) => {
  const { user, requiresPasswordChange, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isOnChangePasswordPage = location.pathname === '/change-password';
  const isOnLogoutRoute = location.pathname === '/logout';

  useEffect(() => {
    if (!isLoading && user && requiresPasswordChange && !isOnChangePasswordPage && !isOnLogoutRoute) {
      // Redirect to change password page if user needs to change password
      navigate('/change-password', { replace: true });
    }
  }, [user, requiresPasswordChange, isLoading, isOnChangePasswordPage, isOnLogoutRoute, navigate]);

  // Show loading if still loading
  if (isLoading) {
    return (
      <div className="password-guard-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // If user requires password change and is not on the change password page, show blocking modal
  if (requiresPasswordChange && !isOnChangePasswordPage && !isOnLogoutRoute) {
    return (
      <div className="password-change-blocker">
        <div className="password-change-modal">
          <div className="modal-header">
            <svg className="warning-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h2>Password Change Required</h2>
          </div>
          <div className="modal-content">
            <p>
              For security reasons, you must change your password before continuing to use the application.
            </p>
            <p>
              This is a one-time requirement for new accounts or when your password has been reset by an administrator.
            </p>
          </div>
          <div className="modal-actions">
            <button
              className="change-password-btn"
              onClick={() => navigate('/change-password', { replace: true })}
            >
              Change Password Now
            </button>
          </div>
        </div>
        <div className="modal-backdrop"></div>
      </div>
    );
  }

  // If on change password page or no password change required, render children normally
  return <>{children}</>;
};

export default PasswordChangeGuard;
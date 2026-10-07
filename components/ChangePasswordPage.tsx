import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch, getCurrentUser } from '../lib/auth';
import './ChangePasswordPage.css';

interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isChanging, setIsChanging] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [pendingRedirect, setPendingRedirect] = useState(false);

  // Navigate to dashboard AFTER React has committed the new auth state
  useEffect(() => {
    if (pendingRedirect && !user?.forcePasswordChange) {
      navigate('/dashboard', { replace: true });
    }
  }, [pendingRedirect, user?.forcePasswordChange, navigate]);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];

    if (password.length < 6) {
      errors.push('Şifre en az 6 karakter olmalı');
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset previous states
    setError('');
    setSuccess('');
    setValidationErrors({});

    // Validate form
    const errors: Record<string, string> = {};

    if (!currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else {
      const passwordErrors = validatePassword(newPassword);
      if (passwordErrors.length > 0) {
        errors.newPassword = passwordErrors[0]; // Show first error
      }
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setIsChanging(true);

      const response = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const result: ChangePasswordResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Password change failed');
      }

      setSuccess('Password changed successfully!');

      // Clear form fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Refresh user data from backend to get updated forcePasswordChange status
      try {
        const updatedUserData = await getCurrentUser();
        login(updatedUserData.user, updatedUserData.role, updatedUserData.permissions, updatedUserData.columnVisibility, updatedUserData.userAccessPolicy, updatedUserData.isAdmin);

        // Signal redirect - useEffect will navigate after React commits the new auth state
        if (user?.forcePasswordChange) {
          setPendingRedirect(true);
        }
      } catch (error) {
        console.error('Failed to refresh user data:', error);
        // Still redirect even if refresh fails, since password change was successful
        if (user?.forcePasswordChange) {
          setPendingRedirect(true);
        }
      }

    } catch (error: any) {
      console.error('Password change failed:', error);
      setError(error.message || 'Password change failed. Please try again.');
    } finally {
      setIsChanging(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    if (field === 'current') {
      setShowCurrentPassword(!showCurrentPassword);
    } else if (field === 'new') {
      setShowNewPassword(!showNewPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const getPasswordStrength = (password: string): { strength: string; color: string; percent: number } => {
    const len = password.length;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    let score = 0;
    if (len >= 6) score++;
    if (len >= 8) score++;
    if (hasLower && hasUpper) score++;
    if (hasDigit) score++;
    if (hasSpecial) score++;

    if (score <= 1) return { strength: 'Zayıf', color: '#ef4444', percent: 20 };
    if (score === 2) return { strength: 'Orta', color: '#f97316', percent: 40 };
    if (score === 3) return { strength: 'İyi', color: '#eab308', percent: 60 };
    if (score === 4) return { strength: 'Güçlü', color: '#22c55e', percent: 80 };
    return { strength: 'Çok Güçlü', color: '#16a34a', percent: 100 };
  };

  const handleCancel = () => {
    if (!user?.forcePasswordChange) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="change-password-page">
      {/* Background Panels */}
      <div className="background-panels">
        <div className="panel-left"></div>
        <div className="panel-right"></div>
        <div className="curved-divider">
          <svg className="curve-svg" viewBox="0 0 200 800" preserveAspectRatio="none">
            <path
              d="M0,0 Q100,200 0,400 Q100,600 0,800 L200,800 Q100,600 200,400 Q100,200 200,0 Z"
              fill="url(#curveGradient)"
            />
            <defs>
              <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#B03A2E" />
                <stop offset="50%" stopColor="#8B3426" />
                <stop offset="100%" stopColor="#2F2F2F" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <div className="change-password-container">
        <div className="change-password-card">
          <div className="change-password-header">
            <h1 className="change-password-title">
              {user?.forcePasswordChange ? 'Password Change Required' : 'Change Password'}
            </h1>
            <p className="change-password-subtitle">
              {user?.forcePasswordChange
                ? 'For security reasons, you must change your password before continuing.'
                : 'Update your account password for security.'}
            </p>
          </div>

          {user?.forcePasswordChange && (
            <div className="force-change-notice">
              <svg className="notice-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <strong>Action Required:</strong> You must change your password to continue using the application.
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              <svg className="alert-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <svg className="alert-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
              {user?.forcePasswordChange && (
                <div style={{ marginTop: '8px', fontSize: '13px' }}>
                  Redirecting to dashboard...
                </div>
              )}
            </div>
          )}

          <form className="change-password-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="currentPassword" className="form-label">
                Current Password
              </label>
              <div className="password-input-container">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  id="currentPassword"
                  className={`form-input ${validationErrors.currentPassword ? 'form-input-error' : ''}`}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (validationErrors.currentPassword) {
                      setValidationErrors(prev => ({ ...prev, currentPassword: '' }));
                    }
                  }}
                  placeholder="Enter your current password"
                  disabled={isChanging}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('current')}
                  disabled={isChanging}
                >
                  {showCurrentPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M10.733 5.076a10.744 10.744 0 0 1 1.267-.074c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639a18.79 18.79 0 0 1-3.056 4.94m-7.81 1.191L12 19.5c-4.638 0-8.573-3.007-9.963-7.178a1.012 1.012 0 0 1 0-.639 18.861 18.861 0 0 1 3.056-4.94" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88m4.24 4.24L9.88 9.88m4.24 4.24L19.5 19.5M9.88 9.88 4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
              {validationErrors.currentPassword && (
                <span className="form-error">{validationErrors.currentPassword}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="newPassword" className="form-label">
                New Password
              </label>
              <div className="password-input-container">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="newPassword"
                  className={`form-input ${validationErrors.newPassword ? 'form-input-error' : ''}`}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (validationErrors.newPassword) {
                      setValidationErrors(prev => ({ ...prev, newPassword: '' }));
                    }
                  }}
                  placeholder="Enter your new password"
                  disabled={isChanging}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('new')}
                  disabled={isChanging}
                >
                  {showNewPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M10.733 5.076a10.744 10.744 0 0 1 1.267-.074c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639a18.79 18.79 0 0 1-3.056 4.94m-7.81 1.191L12 19.5c-4.638 0-8.573-3.007-9.963-7.178a1.012 1.012 0 0 1 0-.639 18.861 18.861 0 0 1 3.056-4.94" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88m4.24 4.24L9.88 9.88m4.24 4.24L19.5 19.5M9.88 9.88 4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>

              {newPassword && (
                <div className="password-strength">
                  <div className="password-strength-bar">
                    <div
                      className="password-strength-fill"
                      style={{
                        width: `${getPasswordStrength(newPassword).percent}%`,
                        backgroundColor: getPasswordStrength(newPassword).color
                      }}
                    ></div>
                  </div>
                  <span
                    className="password-strength-text"
                    style={{ color: getPasswordStrength(newPassword).color }}
                  >
                    {getPasswordStrength(newPassword).strength}
                  </span>
                </div>
              )}

              {validationErrors.newPassword && (
                <span className="form-error">{validationErrors.newPassword}</span>
              )}

              {newPassword && validatePassword(newPassword).length > 0 && (
                <span className="form-error">{validatePassword(newPassword)[0]}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm New Password
              </label>
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  className={`form-input ${validationErrors.confirmPassword ? 'form-input-error' : ''}`}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (validationErrors.confirmPassword) {
                      setValidationErrors(prev => ({ ...prev, confirmPassword: '' }));
                    }
                  }}
                  placeholder="Confirm your new password"
                  disabled={isChanging}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('confirm')}
                  disabled={isChanging}
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M10.733 5.076a10.744 10.744 0 0 1 1.267-.074c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639a18.79 18.79 0 0 1-3.056 4.94m-7.81 1.191L12 19.5c-4.638 0-8.573-3.007-9.963-7.178a1.012 1.012 0 0 1 0-.639 18.861 18.861 0 0 1 3.056-4.94" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88m4.24 4.24L9.88 9.88m4.24 4.24L19.5 19.5M9.88 9.88 4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <span className="form-error">{validationErrors.confirmPassword}</span>
              )}
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="change-password-btn"
                disabled={isChanging || !currentPassword || !newPassword || !confirmPassword}
              >
                {isChanging ? 'Changing Password...' : 'Change Password'}
              </button>

              {!user?.forcePasswordChange && (
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleCancel}
                  disabled={isChanging}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
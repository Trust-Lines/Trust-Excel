import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch, setToken as saveAuthToken } from '../lib/auth';
import './ActivationPage.css';

interface ActivationResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  user?: any;
  role?: any;
  permissions?: any[];
  columnVisibility?: any[];
  userAccessPolicy?: any;
  isAdmin?: boolean;
}

const ActivationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, isAuthenticated, role } = useAuth();

  const [token, setToken] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [pendingRedirect, setPendingRedirect] = useState(false);

  // Navigate to dashboard AFTER React has committed the auth state
  useEffect(() => {
    if (pendingRedirect && isAuthenticated && role) {
      navigate('/dashboard', { replace: true });
    }
  }, [pendingRedirect, isAuthenticated, role, navigate]);

  useEffect(() => {
    // If user is already authenticated (not from activation), redirect to dashboard
    if (isAuthenticated && !pendingRedirect) {
      navigate('/dashboard', { replace: true });
      return;
    }

    // Extract token from URL
    const tokenFromUrl = searchParams.get('token');
    if (!tokenFromUrl) {
      setError('No activation token provided. Please check your invitation email for the correct link.');
      return;
    }

    setToken(tokenFromUrl);
  }, [searchParams, navigate, isAuthenticated]);

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

    if (!password) {
      errors.password = 'Password is required';
    } else {
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        errors.password = passwordErrors[0]; // Show first error
      }
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setIsActivating(true);

      const response = await apiFetch('/api/auth/activate', {
        method: 'POST',
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      const result: ActivationResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Account activation failed');
      }

      setSuccess('Account activated successfully! Redirecting to dashboard...');

      // If activation returned login tokens, use them to log in
      if (result.accessToken && result.user && result.role && result.permissions) {
        saveAuthToken(result.accessToken); // Save JWT to localStorage for API calls
        login(result.user, result.role, result.permissions, result.columnVisibility, result.userAccessPolicy, result.isAdmin);
        // Signal redirect - useEffect will navigate after React commits auth state
        setPendingRedirect(true);
      }

    } catch (error: any) {
      console.error('Activation failed:', error);
      setError(error.message || 'Account activation failed. Please try again.');
    } finally {
      setIsActivating(false);
    }
  };

  const togglePasswordVisibility = (field: 'password' | 'confirm') => {
    if (field === 'password') {
      setShowPassword(!showPassword);
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

  if (!token && !error) {
    return (
      <div className="activation-page">
        <div className="activation-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading activation page...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="activation-page">
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

      <div className="activation-container">
        <div className="activation-card">
          <div className="activation-header">
            <img
              src="https://res.cloudinary.com/dqhhgrd3g/image/upload/v1751268224/Trust_Lines_DSB-White_i6mlqv.png"
              alt="Trust Lines"
              className="activation-logo"
            />
            <h1 className="activation-title">Activate Your Account</h1>
            <p className="activation-subtitle">Set your password to complete account setup</p>
          </div>

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
            </div>
          )}

          {!success && token && (
            <form className="activation-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  New Password
                </label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className={`form-input ${validationErrors.password ? 'form-input-error' : ''}`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (validationErrors.password) {
                        setValidationErrors(prev => ({ ...prev, password: '' }));
                      }
                    }}
                    placeholder="Enter your new password"
                    disabled={isActivating}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => togglePasswordVisibility('password')}
                    disabled={isActivating}
                  >
                    {showPassword ? (
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

                {password && (
                  <div className="password-strength">
                    <div className="password-strength-bar">
                      <div
                        className="password-strength-fill"
                        style={{
                          width: `${getPasswordStrength(password).percent}%`,
                          backgroundColor: getPasswordStrength(password).color
                        }}
                      ></div>
                    </div>
                    <span
                      className="password-strength-text"
                      style={{ color: getPasswordStrength(password).color }}
                    >
                      {getPasswordStrength(password).strength}
                    </span>
                  </div>
                )}

                {validationErrors.password && (
                  <span className="form-error">{validationErrors.password}</span>
                )}

                {password && validatePassword(password).length > 0 && (
                  <span className="form-error">{validatePassword(password)[0]}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
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
                    disabled={isActivating}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => togglePasswordVisibility('confirm')}
                    disabled={isActivating}
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

              <button
                type="submit"
                className="activate-btn"
                disabled={isActivating || !password || !confirmPassword}
              >
                {isActivating ? 'Activating Account...' : 'Activate Account'}
              </button>

              <div className="activation-info">
                <p>After activating your account, you'll be automatically logged in and redirected to the dashboard.</p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivationPage;
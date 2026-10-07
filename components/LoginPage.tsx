import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { login as apiLogin } from '../lib/auth';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; submit?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [pendingNavigateTo, setPendingNavigateTo] = useState<string | null>(null);

  // Navigate AFTER React has committed the auth state from login()
  // Check role (always set) instead of userAccessPolicy (can be null)
  useEffect(() => {
    if (pendingNavigateTo && isAuthenticated && role) {
      navigate(pendingNavigateTo, { replace: true });
      setPendingNavigateTo(null);
    }
  }, [pendingNavigateTo, isAuthenticated, role, navigate]);

  // Detect Caps Lock state globally
  const handleKeyEvent = useCallback((e: KeyboardEvent) => {
    if (e.getModifierState) {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyEvent);
    window.addEventListener('keyup', handleKeyEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyEvent);
      window.removeEventListener('keyup', handleKeyEvent);
    };
  }, [handleKeyEvent]);

  const isFormValid = identifier.trim().length > 0 && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: { identifier?: string; password?: string; submit?: string } = {};

    if (!identifier.trim()) {
      newErrors.identifier = 'E-posta, kullanıcı adı veya telefon gerekli';
    }

    if (!password) {
      newErrors.password = 'Şifre gerekli';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      setErrors({});

      try {
        // Call backend login API with identifier + remember me preference
        const authResponse = await apiLogin({
          identifier: identifier.trim(),
          password,
          rememberMe,
        });

        // Update auth context with user data (include all fields so permissions work immediately)
        login(
          authResponse.user,
          authResponse.role,
          authResponse.permissions,
          authResponse.columnVisibility,
          authResponse.userAccessPolicy,
          authResponse.isAdmin,
        );


        // Signal navigation - useEffect will navigate after React commits auth state
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        setPendingNavigateTo(from);
      } catch (error: any) {
        console.error('Login failed:', error);

        // Handle rate limit (429)
        if (error.message?.includes('429') || error.message?.includes('Çok fazla')) {
          setErrors({
            submit: 'Çok fazla başarısız giriş denemesi. Lütfen birkaç dakika sonra tekrar deneyin.',
          });
        } else {
          setErrors({
            submit: error.message || 'Kullanıcı adı veya şifre hatalı',
          });
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page">
      {/* Background panels with curved divider */}
      <div className="background-panels">
        <div className="panel-left"></div>
        <div className="panel-right"></div>
        <div className="curved-divider">
          <svg
            className="curve-svg"
            viewBox="0 0 200 800"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0 Q100,200 50,400 Q0,600 100,800 L200,800 L200,0 Z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
      </div>

      {/* Login Card */}
      <div className="login-container">
        <div className="login-card">
          {/* Logo and Header */}
          <div className="login-header">
            <img
              src="https://res.cloudinary.com/dqhhgrd3g/image/upload/v1751268224/Trust_Lines_DSB-White_i6mlqv.png"
              alt="Trust Lines"
              className="login-logo"
            />
            <h1 className="login-title">Welcome back</h1>
            <p className="login-subtitle">Sign in to continue</p>
          </div>

          {/* Login Form */}
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {/* Identifier field (email / username / phone) */}
            <div className="form-group">
              <label htmlFor="identifier" className="form-label">
                E-posta veya Kullanıcı Adı
              </label>
              <input
                type="text"
                id="identifier"
                className={`form-input ${errors.identifier ? 'form-input-error' : ''}`}
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (errors.identifier) {
                    setErrors(prev => ({ ...prev, identifier: undefined }));
                  }
                  if (errors.submit) {
                    setErrors(prev => ({ ...prev, submit: undefined }));
                  }
                }}
                placeholder="E-posta veya kullanıcı adı girin"
                autoComplete="username"
                autoFocus
              />
              {errors.identifier && (
                <span className="form-error">{errors.identifier}</span>
              )}
            </div>

            {/* Password field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Şifre
              </label>
              <div className="password-input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={`form-input password-input ${errors.password ? 'form-input-error' : ''}`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      setErrors(prev => ({ ...prev, password: undefined }));
                    }
                    if (errors.submit) {
                      setErrors(prev => ({ ...prev, submit: undefined }));
                    }
                  }}
                  placeholder="Şifrenizi girin"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10.733 5.076a10.744 10.744 0 0 1 1.267-.074c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639a18.79 18.79 0 0 1-3.056 4.94m-7.81 1.191L12 19.5c-4.638 0-8.573-3.007-9.963-7.178a1.012 1.012 0 0 1 0-.639 18.861 18.861 0 0 1 3.056-4.94" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88m4.24 4.24L9.88 9.88m4.24 4.24L19.5 19.5M9.88 9.88 4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="form-error">{errors.password}</span>
              )}
              {/* Caps Lock Warning */}
              {capsLockOn && (
                <span className="caps-lock-warning">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 4, verticalAlign: 'middle' }}>
                    <path d="M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4.99c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Caps Lock açık
                </span>
              )}
            </div>

            {/* Remember me + Forgot password */}
            <div className="form-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkbox-text">Beni hatırla</span>
              </label>
              <a href="/forgot-password" className="forgot-password-link" onClick={(e) => {
                e.preventDefault();
                // Placeholder - navigate to forgot password when implemented
              }}>
                Şifremi unuttum
              </a>
            </div>

            {/* Submit Error - shown inline */}
            {errors.submit && (
              <div className="login-error-banner">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                  <path d="M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4.99c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{errors.submit}</span>
              </div>
            )}

            {/* Sign In Button - disabled when form invalid or loading */}
            <button
              type="submit"
              className={`sign-in-btn ${!isFormValid || isLoading ? 'sign-in-btn-disabled' : ''}`}
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <span className="btn-loading">
                  <span className="spinner"></span>
                  Giriş yapılıyor...
                </span>
              ) : (
                'Giriş Yap'
              )}
            </button>

            <p className="contact-admin-text">
              Erişim mi gerekiyor? <a href="#" className="contact-admin-link">Yönetici ile İletişime Geçin</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

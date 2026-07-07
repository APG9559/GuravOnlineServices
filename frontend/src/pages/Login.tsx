import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import SplashScreen from '@/components/Layout/SplashScreen';
import { startAuthentication } from '@simplewebauthn/browser';
import { authApi, api } from '@/api';
import { biometricService } from '@/services/biometric';
import { Capacitor } from '@capacitor/core';

export default function LoginPage() {
  const { login, loginWithPasskey, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  // Whether to show the "Login with Fingerprint" native biometric button
  const [showBiometricBtn, setShowBiometricBtn] = useState(false);
  const [showPasskeyBtn, setShowPasskeyBtn] = useState(true);

  useEffect(() => {
    // Hide passkey option on native Android < 11 where FIDO2 fails with RP ID error
    if (Capacitor.isNativePlatform()) {
      const ua = navigator.userAgent;
      const match = ua.match(/Android\s+([0-9]+)/);
      if (match) {
        const androidVer = parseInt(match[1], 10);
        if (androidVer < 11) {
          setShowPasskeyBtn(false);
        }
      }
    }

    // Check if the device supports biometrics AND has a saved token
    biometricService.isAvailable().then(async (available) => {
      if (available) {
        const hasToken = await biometricService.hasSavedToken();
        setShowBiometricBtn(hasToken);
      }
    });
  }, []);

  // --- Passkey (WebAuthn) login — for modern devices (e.g., Galaxy A36) ---
  const handlePasskeyLogin = async () => {
    setError('');
    setPasskeyLoading(true);
    try {
      const res = await authApi.getPasskeyLoginOptions();
      const { options, sessionId } = res.data;
      const authResult = await startAuthentication(options);
      await loginWithPasskey(sessionId, authResult);
      navigate('/');
    } catch (err: any) {
      console.error('[Passkey Login Error]', err);
      if (err.name === 'NotAllowedError') {
        setError('Passkey authentication cancelled or timed out.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to authenticate via Passkey.');
      }
    } finally {
      setPasskeyLoading(false);
    }
  };

  // --- Native biometric login — for older devices (e.g., Galaxy M30) ---
  const handleBiometricLogin = async () => {
    setError('');
    setBiometricLoading(true);
    try {
      const token = await biometricService.getTokenWithBiometric();
      if (!token) {
        setError('Fingerprint not recognised. Please sign in with your password.');
        return;
      }
      // Token is the saved JWT — inject it and navigate
      localStorage.setItem('token', token);
      // Force auth context to re-read the token by navigating
      navigate('/');
      // Reload so AuthContext re-initialises with the new token
      window.location.href = '/';
    } catch (err: any) {
      setError('Biometric login failed. Please sign in with your password.');
    } finally {
      setBiometricLoading(false);
    }
  };

  if (authLoading) return <SplashScreen />;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const accessToken = await login(email, password);
      // After successful login, save the token for future biometric login on native
      biometricService.isAvailable().then(async (available) => {
        if (available && accessToken) {
          try {
            await biometricService.saveToken(accessToken);
            setShowBiometricBtn(true);
          } catch {
            // Non-critical — biometric save failed silently
          }
        }
      });
      navigate('/');
    } catch (err: any) {
      if (!err.response) {
        console.log(err);
        setError(`Network error: Cannot reach the server (${api.defaults.baseURL}). ${err}`);
      } else if (err.response.status === 400) {
        const msg = err.response.data?.message;
        console.log(msg);
        setError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Invalid request inputs.'));
      } else if (err.response.status === 401) {
        setError(err.response.data?.message || 'Invalid email/name or password.');
      } else if (err.response.status === 403) {
        setError(err.response.data?.message || 'Access denied: Your account may be deactivated.');
      } else if (err.response.status === 404) {
        setError('API endpoint not found (404). Please verify your API URL configuration.');
      } else if (err.response.status === 429) {
        setError('Too many login attempts. Please try again later.');
      } else if (err.response.status >= 500) {
        setError('Server error: The server is experiencing issues. Please try again later.');
      } else {
        setError(err.response.data?.message || 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const anyLoading = loading || passkeyLoading || biometricLoading;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 360, padding: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 24 }}>
          <img src='/G.png' width='100px' height='100px' style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 20, fontWeight: 500 }}>Gurav Online Services</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email or Name</label>
            <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com or Name" required autoFocus />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                placeholder="Your password"
                required
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: isPasswordFocused
                    ? 'translateY(-50%) translate(1px, 1px)'
                    : 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-hint)',
                  transition: 'color 0.1s ease, transform 0.1s ease',
                  boxShadow: 'none',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-hint)'; }}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>
          {error && <div className="alert-error" style={{ marginBottom: 12 }}>{error}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', width: '100%', marginTop: 8 }}>
            <button className="btn btn-primary" style={{ width: '60%' }} disabled={anyLoading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            {/* Divider */}
            {(showBiometricBtn || showPasskeyBtn) && (
              <div style={{ fontSize: 11, color: 'var(--text-hint)', margin: '2px 0' }}>or</div>
            )}

            {/* Native biometric button — shown on older devices that have a saved token */}
            {showBiometricBtn && (
              <button
                id="biometric-login-btn"
                type="button"
                className="btn"
                style={{
                  width: '80%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontSize: 13,
                  background: 'var(--accent-light)',
                  color: 'var(--text)',
                  padding: '8px 12px',
                }}
                onClick={handleBiometricLogin}
                disabled={anyLoading}
              >
                {biometricLoading ? (
                  'Verifying fingerprint…'
                ) : (
                  <>
                    {/* Fingerprint icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/>
                      <path d="M14 13.12c0 2.38 0 6.38-1 8.88"/>
                      <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/>
                      <path d="M2 12a10 10 0 0 1 18-6"/>
                      <path d="M2 17.5a14.5 14.5 0 0 0 4.5 4.5"/>
                      <path d="M20 10a13 13 0 0 1 .09 2"/>
                      <path d="M6.27 10.87A11 11 0 0 0 6 12"/>
                      <path d="M12 2a9.96 9.96 0 0 1 6.29 2.23"/>
                      <path d="M9 7a4 4 0 0 1 6.15-.24"/>
                    </svg>
                    Login with Fingerprint
                  </>
                )}
              </button>
            )}

            {/* WebAuthn/Passkey button — for modern devices */}
            {showPasskeyBtn && (
              <button
                id="passkey-login-btn"
                type="button"
                className="btn"
                style={{
                  width: '80%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontSize: 13,
                  background: 'var(--accent-light)',
                  color: 'var(--text)',
                  padding: '8px 12px',
                }}
                onClick={handlePasskeyLogin}
                disabled={anyLoading}
              >
                {passkeyLoading ? (
                  'Verifying biometric…'
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 2H3v16h18V2z"></path>
                      <path d="M10 10v4"></path>
                      <path d="M14 10v4"></path>
                      <path d="M6 6h12"></path>
                    </svg>
                    Sign in with Passkey
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

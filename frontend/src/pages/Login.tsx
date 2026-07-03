import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import SplashScreen from '@/components/Layout/SplashScreen';
import { startAuthentication } from '@simplewebauthn/browser';
import { authApi, api } from '@/api';

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

  if (authLoading) return <SplashScreen />;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      if (!err.response) {
        console.log(err);
        setError(`Network error: Cannot reach the server (${api.defaults.baseURL}). Please verify the backend is running and you are connected to the same network.`);
      } else if (err.response.status === 400) {
        const msg = err.response.data?.message;
        console.log(msg);
        setError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Invalid request inputs.'));
      } else if (err.response.status === 401) {
        setError(err.response.data?.message || 'Invalid email or password.');
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 360, padding: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 24 }}>
          <img src='/G.png' width='100px' height='100px' style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 20, fontWeight: 500 }}>Gurav Online Services</div>
          {/* <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Kolhapur Municipal Services</div> */}
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-hint)';
                }}
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
            <button className="btn btn-primary" style={{ width: '60%' }} disabled={loading || passkeyLoading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <div style={{ fontSize: 11, color: 'var(--text-hint)', margin: '2px 0' }}>or</div>
            <button
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
                color: 'var(--accent)',
                borderColor: 'rgba(24,95,165,0.25)',
                padding: '8px 12px',
              }}
              onClick={handlePasskeyLogin}
              disabled={loading || passkeyLoading}
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
                  Sign in with Fingerprint
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

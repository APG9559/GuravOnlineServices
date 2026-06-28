import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/api';

export default function ResetPasswordPage() {
  const { logout } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(password);
      setSuccess('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 380, padding: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 24 }}>
          <img src='../public/G.png' width='100px' height='100px' style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 20, fontWeight: 500 }}>Reset Default Password</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            For security, please change your password on first login.
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
            />
          </div>
          {error && <div className="alert-error" style={{ marginBottom: 12 }}>{error}</div>}
          {success && <div className="alert-success" style={{ marginBottom: 12 }}>{success}</div>}
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 4 }} disabled={loading}>
            {loading ? 'Updating password…' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

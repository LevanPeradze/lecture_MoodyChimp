import { useState } from 'react';

const LoginModal = ({ isOpen, onClose, onMaybeLater, onLoginSuccess }) => {
  const [mode, setMode] = useState('initial'); // 'initial', 'signin', 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLoginSuccess(data.user.email);
        onClose();
      } else {
        setError(data.error || 'Sign up failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLoginSuccess(data.user.email);
        onClose();
      } else {
        setError(data.error || 'Invalid email or password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setMode('initial');
  };

  const handleBack = () => {
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="login-overlay" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        {mode !== 'initial' && (
          <button className="login-back-btn" onClick={handleBack}>
            ←
          </button>
        )}

        {mode === 'initial' && (
          <div className="login-initial">
            <h2 className="login-title">Welcome</h2>
            <button className="login-option-btn" onClick={() => setMode('signin')}>
              Sign In
            </button>
            <button className="login-option-btn" onClick={() => setMode('signup')}>
              Sign Up
            </button>
            <button className="login-maybe-later" onClick={onMaybeLater}>
              Maybe later
            </button>
          </div>
        )}

        {mode === 'signin' && (
          <form className="login-form" onSubmit={handleSignIn}>
            <h2 className="login-title">Sign In</h2>
            {error && <div className="login-error">{error}</div>}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="login-input"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="login-input"
            />
            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {mode === 'signup' && (
          <form className="login-form" onSubmit={handleSignUp}>
            <h2 className="login-title">Sign Up</h2>
            {error && <div className="login-error">{error}</div>}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="login-input"
            />
            <input
              type="password"
              placeholder="Create Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="login-input"
            />
            <input
              type="password"
              placeholder="Re-enter Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="login-input"
            />
            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginModal;


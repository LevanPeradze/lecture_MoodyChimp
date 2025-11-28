import { useState } from 'react';

const LoginModal = ({ isOpen, onClose, onMaybeLater, onLoginSuccess, t }) => {
  // Default translation function if not provided
  const translate = t || ((key) => key);
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
      setError(translate('passwordsDoNotMatch'));
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
        setError(data.error || translate('signUpFailed'));
      }
    } catch (err) {
      setError(translate('networkError'));
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
        setError(data.error || translate('invalidEmailPassword'));
      }
    } catch (err) {
      setError(translate('networkError'));
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
            <h2 className="login-title">{translate('welcome')}</h2>
            <p className="login-subtitle">{translate('welcomeMessage')}</p>
            <button className="login-option-btn" onClick={() => setMode('signin')}>
              {translate('signIn')}
            </button>
            <button className="login-option-btn" onClick={() => setMode('signup')}>
              {translate('signUp')}
            </button>
            <button className="login-maybe-later" onClick={onMaybeLater}>
              {translate('maybeLater')}
            </button>
          </div>
        )}

        {mode === 'signin' && (
          <form className="login-form" onSubmit={handleSignIn}>
            <h2 className="login-title">{translate('signIn')}</h2>
            {error && <div className="login-error">{error}</div>}
            <input
              type="email"
              placeholder={translate('email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="login-input"
            />
            <input
              type="password"
              placeholder={translate('password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="login-input"
            />
            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? translate('signingIn') : translate('signIn')}
            </button>
          </form>
        )}

        {mode === 'signup' && (
          <form className="login-form" onSubmit={handleSignUp}>
            <h2 className="login-title">{translate('signUp')}</h2>
            {error && <div className="login-error">{error}</div>}
            <input
              type="email"
              placeholder={translate('email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="login-input"
            />
            <input
              type="password"
              placeholder={translate('createPassword')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="login-input"
            />
            <input
              type="password"
              placeholder={translate('reenterPassword')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="login-input"
            />
            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? translate('creatingAccount') : translate('signUp')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginModal;


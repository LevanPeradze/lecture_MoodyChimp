import { useState } from 'react';
import { useI18n } from './i18n/index.jsx';
import { getApiUrl } from './config';

const LoginModal = ({ isOpen, onClose, onMaybeLater, onLoginSuccess }) => {
  const { t } = useI18n();
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
      setError(t('login.passwordsDoNotMatch'));
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(getApiUrl('api/signup'), {
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
        setError(data.error || t('login.signUpFailed'));
      }
    } catch (err) {
      setError(t('login.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(getApiUrl('api/signin'), {
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
        setError(data.error || t('login.invalidEmailPassword'));
      }
    } catch (err) {
      setError(t('login.networkError'));
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
            <h2 className="login-title">{t('login.welcome')}</h2>
            <p className="login-subtitle">{t('login.welcomeMessage')}</p>
            <button className="login-option-btn" onClick={() => setMode('signin')}>
              {t('login.signIn')}
            </button>
            <button className="login-option-btn" onClick={() => setMode('signup')}>
              {t('login.signUp')}
            </button>
            <button className="login-maybe-later" onClick={onMaybeLater}>
              {t('login.maybeLater')}
            </button>
          </div>
        )}

        {mode === 'signin' && (
          <form className="login-form" onSubmit={handleSignIn}>
            <h2 className="login-title">{t('login.signIn')}</h2>
            {error && <div className="login-error">{error}</div>}
            <input
              type="email"
              placeholder={t('login.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="login-input"
            />
            <input
              type="password"
              placeholder={t('login.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="login-input"
            />
            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? t('login.signingIn') : t('login.signIn')}
            </button>
          </form>
        )}

        {mode === 'signup' && (
          <form className="login-form" onSubmit={handleSignUp}>
            <h2 className="login-title">{t('login.signUp')}</h2>
            {error && <div className="login-error">{error}</div>}
            <input
              type="email"
              placeholder={t('login.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="login-input"
            />
            <input
              type="password"
              placeholder={t('login.createPassword')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="login-input"
            />
            <input
              type="password"
              placeholder={t('login.reenterPassword')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="login-input"
            />
            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? t('login.creatingAccount') : t('login.signUp')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginModal;


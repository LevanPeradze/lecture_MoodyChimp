import { useState } from 'react';
import { getApiUrl } from './config';

const PasswordVerificationModal = ({ isOpen, onClose, onSuccess, onError }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userEmail = localStorage.getItem('userEmail');
      
      if (!userEmail) {
        setError('User email not found. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await fetch(getApiUrl('api/verify-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: userEmail.trim(), 
          password: password.trim() 
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onSuccess();
        setPassword('');
        onClose();
      } else {
        setError(data.error || 'Incorrect password');
        onError && onError(data.error);
      }
    } catch (err) {
      console.error('Password verification error:', err);
      setError('Network error. Please try again.');
      onError && onError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="password-verify-overlay" onClick={onClose}>
      <div className="password-verify-modal" onClick={(e) => e.stopPropagation()}>
        <button className="password-verify-close" onClick={onClose}>
          ✕
        </button>
        <form className="password-verify-form" onSubmit={handleSubmit}>
          <h2 className="password-verify-title">Verify Password</h2>
          {error && <div className="password-verify-error">{error}</div>}
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="password-verify-input"
            autoFocus
          />
          <button type="submit" className="password-verify-submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordVerificationModal;


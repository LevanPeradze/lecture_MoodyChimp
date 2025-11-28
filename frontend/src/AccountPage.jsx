import { useState, useEffect } from 'react';
import PasswordVerificationModal from './PasswordVerificationModal';

const AccountPage = ({ userEmail, onBack, onLogout }) => {
  const [selectedOption, setSelectedOption] = useState('myacc');
  const [userPassword, setUserPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    // Fetch user password when "My Acc" is selected
    if (selectedOption === 'myacc' && userEmail) {
      fetchUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOption, userEmail]);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/user/${encodeURIComponent(userEmail)}`);
      const data = await response.json();
      if (response.ok && data.user) {
        setUserPassword(data.user.password);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const handleShowPassword = () => {
    if (!showPassword) {
      setShowPasswordModal(true);
    } else {
      setShowPassword(false);
    }
  };

  const handlePasswordVerified = () => {
    setShowPassword(true);
  };

  return (
    <div className="account-page">
      <PasswordVerificationModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordVerified}
      />

      <div className="account-sidebar">
        <button className="account-back-btn" onClick={onBack}>
          ← Back
        </button>
        <div className="account-profile">
          <div className="account-avatar">🍌</div>
          <div className="account-profile-info">
            <div className="account-profile-name">Account</div>
            <div className="account-profile-email">{userEmail}</div>
          </div>
        </div>

        <div className="account-options">
          <button
            className={`account-option ${selectedOption === 'myacc' ? 'active' : ''}`}
            onClick={() => setSelectedOption('myacc')}
          >
            My Acc
          </button>
        </div>
      </div>

      <div className="account-content">
        {selectedOption === 'myacc' && (
          <div className="account-details">
            <h2 className="account-section-title">My Account</h2>
            
            <div className="account-field">
              <label className="account-field-label">Email</label>
              <div className="account-field-value">{userEmail}</div>
            </div>

            <div className="account-field">
              <label className="account-field-label">Password</label>
              <div className="account-field-password-container">
                <div className="account-field-value password-value">
                  {showPassword ? userPassword : '••••••••'}
                </div>
                <button
                  className="account-password-eye"
                  onClick={handleShowPassword}
                  type="button"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="account-field">
              <button
                className="account-logout-btn"
                onClick={onLogout}
                type="button"
              >
                Log Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountPage;


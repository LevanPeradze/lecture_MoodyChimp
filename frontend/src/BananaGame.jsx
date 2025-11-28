import { useState, useEffect } from 'react';
import { useI18n } from './i18n/index.jsx';
import './BananaGame.css';

const BananaGame = () => {
  const { t } = useI18n();
  const [clickCount, setClickCount] = useState(() => {
    // Load from LocalStorage on mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bananaClicks');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [isBouncing, setIsBouncing] = useState(false);

  // Save to LocalStorage whenever clickCount changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bananaClicks', clickCount.toString());
    }
  }, [clickCount]);

  const handleBananaClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    // Trigger bounce animation
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 600);

    // Check for milestones
    let milestoneMessage = '';
    if (newCount === 10) {
      milestoneMessage = t('bananaGame.milestone10');
    } else if (newCount === 50) {
      milestoneMessage = t('bananaGame.milestone50');
    } else if (newCount === 100) {
      milestoneMessage = t('bananaGame.milestone100');
    } else if (newCount > 0 && newCount % 100 === 0) {
      // Replace {{count}} placeholder with actual count
      milestoneMessage = t('bananaGame.milestone100plus').replace('{{count}}', newCount);
    }

    if (milestoneMessage) {
      setMessage(milestoneMessage);
      setShowMessage(true);
      
      // Auto-hide message after 3 seconds
      setTimeout(() => {
        setShowMessage(false);
      }, 3000);
    }
  };

  return (
    <div className="banana-game-container">
      <button
        className={`banana-button ${isBouncing ? 'bouncing' : ''}`}
        onClick={handleBananaClick}
        aria-label={t('bananaGame.ariaLabel')}
        title={t('bananaGame.tooltip').replace('{{count}}', clickCount)}
      >
        <span className="banana-emoji">🍌</span>
        {clickCount > 0 && (
          <span className="banana-counter">{clickCount}</span>
        )}
      </button>
      {showMessage && (
        <div className="banana-message">
          {message}
        </div>
      )}
    </div>
  );
};

export default BananaGame;


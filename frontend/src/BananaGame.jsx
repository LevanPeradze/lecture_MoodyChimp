import { useState, useEffect } from 'react';
import { useI18n } from './i18n/index.jsx';
import { checkAchievements } from './achievements';
import './BananaGame.css';

const BananaGame = ({ userEmail }) => {
  const { t } = useI18n();
  const [clickCount, setClickCount] = useState(0);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [isBouncing, setIsBouncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load banana clicks from database on mount
  useEffect(() => {
    if (userEmail) {
      fetch(`http://localhost:4000/api/user/${encodeURIComponent(userEmail)}/banana-clicks`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setClickCount(data.bananaClicks || 0);
          }
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Error loading banana clicks:', err);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [userEmail]);

  // Save to database whenever clickCount changes (only if user is logged in)
  useEffect(() => {
    if (userEmail && !isLoading && clickCount > 0) {
      fetch(`http://localhost:4000/api/user/${encodeURIComponent(userEmail)}/banana-clicks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bananaClicks: clickCount }),
      }).catch(err => console.error('Error saving banana clicks:', err));
    }
  }, [clickCount, userEmail, isLoading]);

  // Check for unemployment achievement on mount if user is logged in
  useEffect(() => {
    if (userEmail && clickCount >= 500) {
      checkAchievements(userEmail, 'banana-clicks', { count: clickCount }).then(achievementNotifications => {
        if (achievementNotifications.length > 0) {
          const existingNotifications = JSON.parse(localStorage.getItem('chimpNotifications') || '[]');
          const updatedNotifications = [...existingNotifications, ...achievementNotifications];
          localStorage.setItem('chimpNotifications', JSON.stringify(updatedNotifications));
          window.dispatchEvent(new CustomEvent('achievementsUpdated'));
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  const handleBananaClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    // Trigger bounce animation
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 600);

    // Check for achievements (banana clicks)
    if (userEmail) {
      checkAchievements(userEmail, 'banana-clicks', { count: newCount }).then(achievementNotifications => {
        if (achievementNotifications.length > 0) {
          const existingNotifications = JSON.parse(localStorage.getItem('chimpNotifications') || '[]');
          const updatedNotifications = [...existingNotifications, ...achievementNotifications];
          localStorage.setItem('chimpNotifications', JSON.stringify(updatedNotifications));
          window.dispatchEvent(new CustomEvent('achievementsUpdated'));
        }
      });
    }

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


import { useState, useEffect, useRef } from 'react';
import { useI18n } from './i18n/index.jsx';
import './NotificationBell.css';

const NotificationBell = ({ userEmail, isLoggedIn, userData }) => {
  const { t } = useI18n();
  const bellRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [notifications, setNotifications] = useState(() => {
    // Initialize state from LocalStorage synchronously
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chimpNotifications');
      if (saved) {
        try {
          const loadedNotifications = JSON.parse(saved);
          // Filter to only achievement notifications
          return loadedNotifications.filter(n => n.type === 'achievement');
        } catch (err) {
          console.error('Error loading notifications:', err);
        }
      }
    }
    return [];
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const isInitialMount = useRef(true);

  // Load notifications from LocalStorage on mount (only if not already loaded)
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialMount.current) {
      const saved = localStorage.getItem('chimpNotifications');
      if (saved) {
        try {
          const loadedNotifications = JSON.parse(saved);
          // Filter to only achievement notifications and set them
          const achievementOnly = loadedNotifications.filter(n => n.type === 'achievement');
          setNotifications(achievementOnly);
          // Update storage if there were non-achievement notifications
          if (achievementOnly.length !== loadedNotifications.length) {
            localStorage.setItem('chimpNotifications', JSON.stringify(achievementOnly));
          }
        } catch (err) {
          console.error('Error loading notifications:', err);
        }
      }
      isInitialMount.current = false;
    }
    
    // Listen for achievement updates
    const handleAchievementsUpdated = () => {
      const saved = localStorage.getItem('chimpNotifications');
      if (saved) {
        try {
          const loadedNotifications = JSON.parse(saved);
          // Filter to only achievement notifications
          const achievementOnly = loadedNotifications.filter(n => n.type === 'achievement');
          setNotifications(achievementOnly);
          // Update storage if there were non-achievement notifications
          if (achievementOnly.length !== loadedNotifications.length) {
            localStorage.setItem('chimpNotifications', JSON.stringify(achievementOnly));
          }
        } catch (err) {
          console.error('Error loading notifications:', err);
        }
      }
    };
    
    window.addEventListener('achievementsUpdated', handleAchievementsUpdated);
    return () => {
      window.removeEventListener('achievementsUpdated', handleAchievementsUpdated);
    };
  }, []);

  // Save notifications to LocalStorage whenever they change (only after initial load)
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialMount.current) {
      // Ensure we only save achievement notifications
      const achievementOnly = notifications.filter(n => n.type === 'achievement');
      localStorage.setItem('chimpNotifications', JSON.stringify(achievementOnly));
    }
  }, [notifications]);

  // Update dropdown position when window resizes or scrolls
  useEffect(() => {
    if (showDropdown && bellRef.current) {
      const updatePosition = () => {
        const rect = bellRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 10,
          right: window.innerWidth - rect.right
        });
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);

      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [showDropdown]);

  // Filter notifications to only show achievements
  const achievementNotifications = notifications.filter(n => n.type === 'achievement');

  const unreadCount = achievementNotifications.filter(n => !n.read).length;

  const handleBellClick = () => {
    if (bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 10,
        right: window.innerWidth - rect.right
      });
    }
    setShowDropdown(!showDropdown);
  };

  const handleNotificationClick = (notificationId) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  const handleMarkAllRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const handleClearAll = () => {
    setNotifications([]);
    setShowDropdown(false);
  };

  // Don't show notification bell if user is not logged in
  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="notification-bell-container" ref={bellRef}>
      <button
        className="notification-bell-btn"
        onClick={handleBellClick}
        aria-label={t('notifications.bellAriaLabel')}
        title={t('notifications.bellTitle').replace('{{count}}', unreadCount)}
      >
        <span className="notification-bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div 
          className="notification-dropdown"
          style={{
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`
          }}
        >
          <div className="notification-dropdown-header">
            <h3 className="notification-dropdown-title">{t('notifications.title')}</h3>
            <div className="notification-dropdown-actions">
              {unreadCount > 0 && (
                <button
                  className="notification-mark-all-read"
                  onClick={handleMarkAllRead}
                  aria-label={t('notifications.markAllRead')}
                >
                  {t('notifications.markAllRead')}
                </button>
              )}
              {achievementNotifications.length > 0 && (
                <button
                  className="notification-clear-all"
                  onClick={handleClearAll}
                  aria-label={t('notifications.clearAll')}
                >
                  {t('notifications.clearAll')}
                </button>
              )}
            </div>
          </div>

          <div className="notification-list">
            {achievementNotifications.length === 0 ? (
              <div className="notification-empty">
                {t('notifications.empty')}
              </div>
            ) : (
              achievementNotifications
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${notification.read ? 'read' : 'unread'} ${notification.type || 'info'}`}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="notification-content">
                      <p className="notification-message">{notification.message}</p>
                      <span className="notification-time">
                        {new Date(notification.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    {!notification.read && <div className="notification-unread-indicator"></div>}
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="notification-dropdown-overlay"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;


import { useState, useEffect } from 'react';
import { useI18n } from './i18n/index.jsx';
import './NotificationBell.css';

const NotificationBell = ({ userEmail, isLoggedIn, userData }) => {
  const { t } = useI18n();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load notifications from LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chimpNotifications');
      if (saved) {
        try {
          setNotifications(JSON.parse(saved));
        } catch (err) {
          console.error('Error loading notifications:', err);
        }
      }
    }
  }, []);

  // Save notifications to LocalStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chimpNotifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  // Check for new notifications on mount and when user data changes
  useEffect(() => {
    if (!isLoggedIn || !userEmail) return;

    const checkNotifications = () => {
      const newNotifications = [];
      const existingIds = new Set(notifications.map(n => n.id));

      // Check for incomplete profile
      if (userData && (!userData.username || !userData.avatar_url || !userData.title)) {
        if (!existingIds.has('incomplete-profile')) {
          newNotifications.push({
            id: 'incomplete-profile',
            message: t('notifications.incompleteProfile'),
            read: false,
            timestamp: new Date().toISOString(),
            type: 'info'
          });
        }
      }

      // Check for first login achievement (only add once)
      const hasFirstLoginAchievement = notifications.some(n => n.id === 'first-login');
      const hasSeenFirstLogin = localStorage.getItem('hasSeenFirstLogin');
      if (!hasFirstLoginAchievement && !hasSeenFirstLogin) {
        newNotifications.push({
          id: 'first-login',
          message: t('notifications.firstLogin'),
          read: false,
          timestamp: new Date().toISOString(),
          type: 'achievement'
        });
        localStorage.setItem('hasSeenFirstLogin', 'true');
      }

      if (newNotifications.length > 0) {
        setNotifications(prev => [...prev, ...newNotifications]);
      }
    };

    checkNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, userEmail, userData]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleBellClick = () => {
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
    <div className="notification-bell-container">
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
        <div className="notification-dropdown">
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
              {notifications.length > 0 && (
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
            {notifications.length === 0 ? (
              <div className="notification-empty">
                {t('notifications.empty')}
              </div>
            ) : (
              notifications
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


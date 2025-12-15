import { useState, useEffect, useRef, useCallback } from 'react';
import { useI18n } from './i18n/index.jsx';
import { getApiUrl } from './config';
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

  // Function to fetch messages from database
  const fetchMessages = useCallback(async () => {
    if (!userEmail) return;

    // Load achievement notifications from localStorage
    const saved = localStorage.getItem('chimpNotifications');
    let achievementNotifications = [];
    if (saved) {
      try {
        const loadedNotifications = JSON.parse(saved);
        achievementNotifications = loadedNotifications.filter(n => n.type === 'achievement');
      } catch (err) {
        console.error('Error loading notifications:', err);
      }
    }

    try {
      const response = await fetch(getApiUrl(`api/notifications/${encodeURIComponent(userEmail)}`));
      const data = await response.json();
      
      if (data.success && data.notifications) {
        // Convert database notifications to the format expected by the component
        const dbMessages = data.notifications.map(n => {
          const senderName = n.sender_username || n.sender_email || 'Admin';
          const messageText = n.title ? `${n.title}: ${n.message}` : n.message;
          return {
            id: `msg-${n.id}`,
            message: `${messageText} (by: ${senderName})`,
            read: n.read,
            timestamp: n.created_at,
            type: 'message'
          };
        });

        // Merge achievement notifications with messages
        const allNotifications = [...achievementNotifications, ...dbMessages];
        setNotifications(allNotifications);

        // Save to localStorage (only achievements)
        localStorage.setItem('chimpNotifications', JSON.stringify(achievementNotifications));
      } else {
        // If no messages, just use achievement notifications
        setNotifications(achievementNotifications);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      // On error, just use achievement notifications
      setNotifications(achievementNotifications);
    }
  }, [userEmail]);

  // Load notifications from LocalStorage and database on mount and when userEmail changes
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialMount.current && userEmail) {
      fetchMessages();
      isInitialMount.current = false;
    } else if (typeof window !== 'undefined' && isInitialMount.current) {
      // No user email, just load from localStorage
      const saved = localStorage.getItem('chimpNotifications');
      if (saved) {
        try {
          const loadedNotifications = JSON.parse(saved);
          const achievementOnly = loadedNotifications.filter(n => n.type === 'achievement');
          setNotifications(achievementOnly);
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
          const achievementOnly = loadedNotifications.filter(n => n.type === 'achievement');
          
          // Merge with existing messages
          setNotifications(prev => {
            const existingMessages = prev.filter(n => n.type === 'message');
            return [...achievementOnly, ...existingMessages];
          });
        } catch (err) {
          console.error('Error loading notifications:', err);
        }
      }
    };

    // Listen for new messages
    const handleNewMessage = () => {
      if (userEmail) {
        fetchMessages();
      }
    };
    
    window.addEventListener('achievementsUpdated', handleAchievementsUpdated);
    window.addEventListener('newMessage', handleNewMessage);
    
    return () => {
      window.removeEventListener('achievementsUpdated', handleAchievementsUpdated);
      window.removeEventListener('newMessage', handleNewMessage);
    };
  }, [userEmail, fetchMessages]);

  // Poll for new notifications every 15 seconds
  useEffect(() => {
    if (!userEmail) return;

    const interval = setInterval(() => {
      fetchMessages();
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [userEmail, fetchMessages]);

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

  // Show all notifications (achievements and messages)
  const allNotifications = notifications;
  const unreadCount = allNotifications.filter(n => !n.read).length;

  const handleBellClick = () => {
    if (bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 10,
        right: window.innerWidth - rect.right
      });
    }
    
    // Refresh notifications when opening the dropdown
    if (!showDropdown && userEmail) {
      fetchMessages();
    }
    
    setShowDropdown(!showDropdown);
  };

  const handleNotificationClick = async (notificationId) => {
    // Update local state immediately
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );

    // If it's a message notification, mark it as read in the database
    if (notificationId.startsWith('msg-')) {
      const dbId = notificationId.replace('msg-', '');
      try {
        await fetch(getApiUrl(`api/notifications/${dbId}/read`), {
          method: 'PUT'
        });
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }
  };

  const handleMarkAllRead = async () => {
    // Update local state immediately
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );

    // Mark all message notifications as read in the database
    if (userEmail) {
      try {
        const messageNotifications = notifications.filter(n => n.id.startsWith('msg-') && !n.read);
        for (const notification of messageNotifications) {
          const dbId = notification.id.replace('msg-', '');
          await fetch(getApiUrl(`api/notifications/${dbId}/read`), {
            method: 'PUT'
          });
        }
      } catch (err) {
        console.error('Error marking notifications as read:', err);
      }
    }
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
              {allNotifications.length > 0 && (
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
            {allNotifications.length === 0 ? (
              <div className="notification-empty">
                {t('notifications.empty')}
              </div>
            ) : (
              allNotifications
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


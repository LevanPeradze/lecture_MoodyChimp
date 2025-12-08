import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from './i18n/index.jsx';
import './RecentlyViewed.css';

const RecentlyViewed = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [recentItems, setRecentItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load recent items from LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recentServices');
      if (saved) {
        try {
          const items = JSON.parse(saved);
          setRecentItems(items);
        } catch (err) {
          console.error('Error loading recent services:', err);
        }
      }
    }
  }, []);

  // Listen for storage events to update when items are added from other tabs/components
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('recentServices');
      if (saved) {
        try {
          const items = JSON.parse(saved);
          setRecentItems(items);
        } catch (err) {
          console.error('Error loading recent services:', err);
        }
      } else {
        setRecentItems([]);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom event for same-tab updates
    window.addEventListener('recentServicesUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('recentServicesUpdated', handleStorageChange);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.recently-viewed-dropdown')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleItemClick = (item) => {
    if (item.type === 'service' && item.isCreateService) {
      navigate(`/order/${item.id}`);
    } else {
      navigate(`/details/${item.type}/${item.id}`);
    }
    setIsOpen(false);
  };

  // Don't render if no recent items
  if (recentItems.length === 0) {
    return null;
  }

  return (
    <div className="recently-viewed-dropdown">
      <button
        className="recently-viewed-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={t('recentlyViewed.title')}
      >
        <span className="recently-viewed-toggle-icon">👁️</span>
        <span className="recently-viewed-toggle-text">{t('recentlyViewed.title')}</span>
        <span className={`recently-viewed-toggle-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>
      
      {isOpen && (
        <div className="recently-viewed-dropdown-content">
          <div className="recently-viewed-strip">
            {recentItems.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="recently-viewed-card"
                onClick={() => handleItemClick(item)}
              >
                {(() => {
                  // Check if thumbnail exists and is valid
                  const hasThumbnail = item.thumbnail && 
                                      typeof item.thumbnail === 'string' && 
                                      item.thumbnail.trim() !== '';
                  
                  if (hasThumbnail) {
                    return (
                      <div className="recently-viewed-thumbnail">
                        <img 
                          src={item.thumbnail} 
                          alt={item.title}
                          onError={(e) => {
                            // If image fails to load, replace with placeholder
                            const placeholder = document.createElement('div');
                            placeholder.className = 'recently-viewed-thumbnail-placeholder';
                            // Use course illustration/icon if available, otherwise fallback emoji
                            if (item.type === 'course' && item.illustration) {
                              placeholder.textContent = item.illustration;
                            } else {
                              placeholder.textContent = item.type === 'course' ? '📚' : '🎨';
                            }
                            e.target.parentElement.replaceWith(placeholder);
                          }} 
                        />
                      </div>
                    );
                  } else {
                    // For courses, use the illustration/icon from the course data (same as learn section)
                    // For services, use the default emoji
                    const placeholderContent = item.type === 'course' && item.illustration 
                      ? item.illustration 
                      : (item.type === 'course' ? '📚' : '🎨');
                    
                    return (
                      <div className="recently-viewed-thumbnail-placeholder">
                        {placeholderContent}
                      </div>
                    );
                  }
                })()}
                <div className="recently-viewed-info">
                  <h3 className="recently-viewed-item-title">{item.title}</h3>
                  <span className="recently-viewed-item-type">
                    {item.type === 'course' ? t('recentlyViewed.course') : t('recentlyViewed.service')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentlyViewed;

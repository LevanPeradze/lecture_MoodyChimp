import { useI18n } from './i18n/index.jsx';

export default function BookmarksPage({ bookmarkedCourses, learnServices, onClose, onToggleBookmark }) {
  const { t } = useI18n();
  
  // Filter learnServices to only show bookmarked ones
  const bookmarkedServices = learnServices.filter(service => {
    const courseId = service.id || service.title;
    return bookmarkedCourses.includes(courseId);
  });

  if (bookmarkedServices.length === 0) {
    return (
      <div className="bookmarks-page">
        <div className="bookmarks-header">
          <h1>{t('bookmarks.title')}</h1>
          <button className="close-btn" onClick={onClose} aria-label={t('bookmarks.close')}>✕</button>
        </div>
        <div className="bookmarks-empty">
          <p>{t('bookmarks.empty')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bookmarks-page">
      <div className="bookmarks-header">
        <h1>{t('bookmarks.title')} ({bookmarkedServices.length})</h1>
        <button className="close-btn" onClick={onClose} aria-label={t('bookmarks.close')}>✕</button>
      </div>
      <div className="bookmarks-content">
        <div className="learn-services-grid">
          {bookmarkedServices.map((service) => {
            const courseId = service.id || service.title;
            const isBookmarked = bookmarkedCourses.includes(courseId);
            return (
              <div key={courseId} className="learn-service-item">
                <button
                  className={`bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleBookmark(courseId);
                  }}
                  aria-label={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
                >
                  {isBookmarked ? '❤️' : '🤍'}
                </button>
                {service.thumbnail_image_url ? (
                  <div className="learn-service-banner">
                    <img 
                      src={service.thumbnail_image_url} 
                      alt={service.title}
                      className="learn-service-banner-img"
                      onError={(e) => {
                        // Fallback to emoji if image fails to load
                        const parent = e.target.parentElement;
                        parent.innerHTML = `<div class="learn-service-illustration">${service.illustration || service.icon || '📚'}</div>`;
                      }}
                    />
                  </div>
                ) : (
                  <div className="learn-service-illustration">{service.illustration || service.icon || '📚'}</div>
                )}
                <div className="learn-service-content">
                  <h3 className="learn-service-title">{service.title}</h3>
                  <span className="learn-service-level">{service.level}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


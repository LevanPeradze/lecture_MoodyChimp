export default function BookmarksPage({ bookmarkedCourses, learnServices, onClose, onToggleBookmark }) {
  // Filter learnServices to only show bookmarked ones
  const bookmarkedServices = learnServices.filter(service => {
    const courseId = service.id || service.title;
    return bookmarkedCourses.includes(courseId);
  });

  if (bookmarkedServices.length === 0) {
    return (
      <div className="bookmarks-page">
        <div className="bookmarks-header">
          <h1>Saved Stuff</h1>
          <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="bookmarks-empty">
          <p>You haven't saved any courses yet.</p>
          <p>Click the heart icon on any course to save it here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bookmarks-page">
      <div className="bookmarks-header">
        <h1>Saved Stuff ({bookmarkedServices.length})</h1>
        <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
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
                <div className="learn-service-illustration">{service.illustration || service.icon}</div>
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


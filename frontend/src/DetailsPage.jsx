import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReviewSection from './ReviewSection';
import { useI18n } from './i18n/index.jsx';
import { formatPrice, convertCurrency } from './i18n/currency';
import { checkAchievements } from './achievements';
import './DetailsPage.css';
import './OrderPage.css';

// Helper function to track recently viewed items
// Always keeps max 3 items, with newest overwriting oldest
export const trackRecentlyViewed = (item) => {
  if (typeof window === 'undefined') return;
  
  try {
    const saved = localStorage.getItem('recentServices');
    let recentItems = saved ? JSON.parse(saved) : [];
    
    // Normalize item ID to number for consistent comparison
    const itemId = typeof item.id === 'string' ? parseInt(item.id) : item.id;
    
    // Remove duplicates (same id and type) - compare as numbers
    recentItems = recentItems.filter(
      existing => {
        const existingId = typeof existing.id === 'string' ? parseInt(existing.id) : existing.id;
        return !(existingId === itemId && existing.type === item.type);
      }
    );
    
    // Add new item to the beginning (with normalized ID)
    const normalizedItem = { ...item, id: itemId };
    recentItems.unshift(normalizedItem);
    
    // Always keep max 3 items (newest overwrites oldest)
    recentItems = recentItems.slice(0, 3);
    
    // Save to LocalStorage
    localStorage.setItem('recentServices', JSON.stringify(recentItems));
    
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event('recentServicesUpdated'));
  } catch (err) {
    console.error('Error tracking recently viewed:', err);
  }
};

const DetailsPage = ({ isLoggedIn, bookmarkedCourses, onToggleBookmark, userOptimalCourse, userEmail }) => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { t, currency, locale } = useI18n();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirect service types to order page (services don't have details pages)
  useEffect(() => {
    if (type === 'service') {
      navigate(`/order/${id}`);
      return;
    }
  }, [type, id, navigate]);

  useEffect(() => {
    // Don't fetch if it's a service (will be redirected)
    if (type === 'service') {
      return;
    }

    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const endpoint = `http://localhost:4000/api/course-services/${id}`;

        const response = await fetch(endpoint);
        const data = await response.json();

        if (response.ok && data.success) {
          const fetchedItem = data.course;
          setItem(fetchedItem);
          
          // Track recently viewed item
          if (fetchedItem && id) {
            let thumbnail = null;
            let illustration = null;
            
            // Use thumbnail_image_url instead of banner_image_url for other sections
            // Check both top level and details object for thumbnail
            thumbnail = fetchedItem.thumbnail_image_url || fetchedItem.details?.thumbnail_image_url || null;
            illustration = fetchedItem.illustration || fetchedItem.icon || null;
            
            // Only set thumbnail if it's a valid non-empty string
            if (!thumbnail || (typeof thumbnail === 'string' && thumbnail.trim() === '')) {
              thumbnail = null;
            }
            
            // Only set illustration if it's a valid non-empty string
            if (!illustration || (typeof illustration === 'string' && illustration.trim() === '')) {
              illustration = null;
            }
            
            trackRecentlyViewed({
              id: parseInt(id),
              type: 'course', // Only courses use details page
              title: fetchedItem.title,
              thumbnail: thumbnail,
              illustration: illustration
            });
          }
        } else {
          setError(data.error || t('details.error'));
        }
      } catch (err) {
        console.error('Error fetching details:', err);
        setError(t('details.error'));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, id]);

  if (loading) {
    return (
      <div className="details-page">
        <div className="details-loading">{t('details.loading')}</div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="details-page">
        <div className="details-error">
          <p>{error || t('details.error')}</p>
          <button className="details-back-btn" onClick={() => navigate(-1)}>
            {t('details.goBack')}
          </button>
        </div>
      </div>
    );
  }

  const itemId = item.id || item.title;
  const isBookmarked = bookmarkedCourses.includes(itemId);
  const isOptimal = userOptimalCourse && type === 'course' && 
    ((userOptimalCourse === 'Game Dev' && item.title === 'Game Dev') ||
     (userOptimalCourse === 'Animation' && item.title === 'Animation') ||
     (userOptimalCourse === 'Simplifying the human figure' && item.title === 'Simplifying the human figure'));

  return (
    <div className="details-page">
      <div className="details-nav-buttons">
        <button className="details-back-btn" onClick={() => navigate(-1)}>
          {t('details.back')}
        </button>
        {type === 'course' && (
          <button 
            className="details-next-btn" 
            onClick={() => {
              if (isLoggedIn) {
                navigate(`/order/course/${item.id}`);
              } else {
                navigate('/');
              }
            }}
          >
            {t('details.next')}
          </button>
        )}
      </div>

      <div className="details-container">
        {item.details?.banner_image_url && (
          <div className="details-banner">
            <img 
              src={item.details.banner_image_url} 
              alt={item.title}
              className="details-banner-img"
            />
          </div>
        )}

        <div className="details-header">
          <div className="details-title-section">
            {isOptimal && <span className="optimal-tag">Optimal!</span>}
            <h1 className="details-title">{item.title}</h1>
            {type === 'course' && item.level && (
              <span className="details-level">{item.level}</span>
            )}
          </div>
          <button
            className={`details-bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
            onClick={() => onToggleBookmark(itemId)}
            aria-label={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
          >
            {isBookmarked ? '❤️' : '🤍'}
          </button>
        </div>

        <div className="details-content">
          {item.details?.full_description ? (
            <div className="details-section">
              <h2 className="details-section-title">{t('details.description')}</h2>
              <p className="details-text">{item.details.full_description}</p>
            </div>
          ) : item.description && (
            <div className="details-section">
              <h2 className="details-section-title">{t('details.description')}</h2>
              <p className="details-text">{item.description}</p>
            </div>
          )}

          {type === 'course' && item.details?.what_youll_learn && (
            <div className="details-section">
              <h2 className="details-section-title">{t('details.whatYoullLearn')}</h2>
              <p className="details-text">{item.details.what_youll_learn}</p>
            </div>
          )}


          {item.details?.difficulty_level && (
            <div className="details-section">
              <h2 className="details-section-title">{t('details.difficultyLevel')}</h2>
              <p className="details-text">{item.details.difficulty_level}</p>
            </div>
          )}

          {item.details?.estimated_duration && (
            <div className="details-section">
              <h2 className="details-section-title">{t('details.estimatedDuration')}</h2>
              <p className="details-text">{item.details.estimated_duration}</p>
            </div>
          )}

          {item.details?.requirements && (
            <div className="details-section">
              <h2 className="details-section-title">{t('details.requirements')}</h2>
              <p className="details-text">{item.details.requirements}</p>
            </div>
          )}

          {type === 'course' && item.details?.course_outline && (
            <div className="details-section">
              <h2 className="details-section-title">{t('details.courseOutline')}</h2>
              <p className="details-text">{item.details.course_outline}</p>
            </div>
          )}

          {type === 'course' && item.details?.prerequisites && (
            <div className="details-section">
              <h2 className="details-section-title">{t('details.prerequisites')}</h2>
              <p className="details-text">{item.details.prerequisites}</p>
            </div>
          )}


          {/* Reviews Section */}
          <div className="details-section">
            <ReviewSection
              itemId={item.id}
              itemType="course"
              userEmail={userEmail}
              isLoggedIn={isLoggedIn}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsPage;


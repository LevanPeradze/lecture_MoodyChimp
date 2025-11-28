import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReviewSection from './ReviewSection';
import './DetailsPage.css';
import './OrderPage.css';

const DetailsPage = ({ isLoggedIn, bookmarkedCourses, onToggleBookmark, userOptimalCourse, userEmail }) => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const endpoint = type === 'service' 
          ? `http://localhost:4000/api/services/${id}`
          : `http://localhost:4000/api/course-services/${id}`;

        const response = await fetch(endpoint);
        const data = await response.json();

        if (response.ok && data.success) {
          setItem(type === 'service' ? data.service : data.course);
        } else {
          setError(data.error || 'Item not found');
        }
      } catch (err) {
        console.error('Error fetching details:', err);
        setError('Failed to load details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDetails();
    }
  }, [type, id]);

  if (loading) {
    return (
      <div className="details-page">
        <div className="details-loading">Loading...</div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="details-page">
        <div className="details-error">
          <p>{error || 'Item not found'}</p>
          <button className="details-back-btn" onClick={() => navigate(-1)}>
            Go Back
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
          ← Back
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
            Next →
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
            {type === 'service' && item.price && (
              <span className="details-price">{item.price}</span>
            )}
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
              <h2 className="details-section-title">Description</h2>
              <p className="details-text">{item.details.full_description}</p>
            </div>
          ) : item.description && (
            <div className="details-section">
              <h2 className="details-section-title">Description</h2>
              <p className="details-text">{item.description}</p>
            </div>
          )}

          {type === 'course' && item.details?.what_youll_learn && (
            <div className="details-section">
              <h2 className="details-section-title">What You'll Learn</h2>
              <p className="details-text">{item.details.what_youll_learn}</p>
            </div>
          )}

          {type === 'service' && item.details?.what_youll_learn && (
            <div className="details-section">
              <h2 className="details-section-title">What You'll Get</h2>
              <p className="details-text">{item.details.what_youll_learn}</p>
            </div>
          )}

          {item.details?.difficulty_level && (
            <div className="details-section">
              <h2 className="details-section-title">Difficulty Level</h2>
              <p className="details-text">{item.details.difficulty_level}</p>
            </div>
          )}

          {item.details?.estimated_duration && (
            <div className="details-section">
              <h2 className="details-section-title">Estimated Duration</h2>
              <p className="details-text">{item.details.estimated_duration}</p>
            </div>
          )}

          {item.details?.requirements && (
            <div className="details-section">
              <h2 className="details-section-title">Requirements</h2>
              <p className="details-text">{item.details.requirements}</p>
            </div>
          )}

          {type === 'course' && item.details?.course_outline && (
            <div className="details-section">
              <h2 className="details-section-title">Course Outline</h2>
              <p className="details-text">{item.details.course_outline}</p>
            </div>
          )}

          {type === 'course' && item.details?.prerequisites && (
            <div className="details-section">
              <h2 className="details-section-title">Prerequisites</h2>
              <p className="details-text">{item.details.prerequisites}</p>
            </div>
          )}

          {type === 'service' && (
            <div className="details-section">
              <div className="details-order-section">
                {isLoggedIn ? (
                  <button
                    className="details-order-btn"
                    onClick={() => navigate(`/order/service/${item.id}`)}
                  >
                    Order Now
                  </button>
                ) : (
                  <div className="details-login-prompt">
                    <p>Please log in to place an order</p>
                    <button
                      className="details-order-btn"
                      onClick={() => navigate('/')}
                    >
                      Go to Login
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reviews Section */}
          <div className="details-section">
            <ReviewSection
              itemId={item.id}
              itemType={type}
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


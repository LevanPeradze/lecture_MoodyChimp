import { useState, useEffect } from 'react';
import './ReviewSection.css';

const ReviewSection = ({ itemId, itemType, userEmail, isLoggedIn }) => {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [userReview, setUserReview] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [itemId, itemType]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:4000/api/reviews/${itemType}/${itemId}`);
      const data = await response.json();
      
      if (data.success) {
        setReviews(data.reviews);
        setAverageRating(data.averageRating || 0);
        setTotalReviews(data.totalReviews || 0);
        
        // Find user's existing review if logged in
        if (isLoggedIn && userEmail) {
          const existingReview = data.reviews.find(r => r.user_email === userEmail);
          if (existingReview) {
            setUserReview(existingReview);
            setUserRating(existingReview.rating);
            setComment(existingReview.comment || '');
          }
        }
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStarClick = (rating) => {
    if (!isLoggedIn) return;
    setUserRating(rating);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      setSubmitMessage('Please log in to submit a review');
      return;
    }

    if (userRating === 0) {
      setSubmitMessage('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('http://localhost:4000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          itemId: parseInt(itemId),
          itemType,
          rating: userRating,
          comment: comment.trim() || null
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setSubmitMessage(userReview ? 'Review updated successfully!' : 'Review submitted successfully!');
        setUserReview(data.review);
        setTimeout(() => setSubmitMessage(''), 3000);
        // Refresh reviews
        fetchReviews();
      } else {
        setSubmitMessage(data.error || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setSubmitMessage('Error submitting review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating, interactive = false, onStarClick = null, onStarHover = null) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
            onClick={() => interactive && onStarClick && onStarClick(star)}
            onMouseEnter={() => interactive && onStarHover && onStarHover(star)}
            onMouseLeave={() => interactive && onStarHover && onStarHover(0)}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="review-section">
      <div className="review-section-header">
        <h3 className="review-section-title">Reviews & Ratings</h3>
        {!loading && (
          <div className="review-summary">
            <div className="average-rating">
              <span className="average-rating-value">{averageRating.toFixed(1)}</span>
              {renderStars(Math.round(averageRating))}
            </div>
            <span className="total-reviews">({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</span>
          </div>
        )}
      </div>

      {isLoggedIn && (
        <form className="review-form" onSubmit={handleSubmit}>
          <div className="review-form-group">
            <label className="review-form-label">Your Rating</label>
            <div className="review-stars-input">
              {renderStars(
                hoveredRating || userRating,
                true,
                handleStarClick,
                setHoveredRating
              )}
              {userRating > 0 && (
                <span className="rating-text">
                  {userRating === 1 ? 'Poor' : 
                   userRating === 2 ? 'Fair' : 
                   userRating === 3 ? 'Good' : 
                   userRating === 4 ? 'Very Good' : 'Excellent'}
                </span>
              )}
            </div>
          </div>

          <div className="review-form-group">
            <label className="review-form-label" htmlFor="review-comment">
              Your Review {comment.trim() && <span className="optional">(optional)</span>}
            </label>
            <textarea
              id="review-comment"
              className="review-comment-input"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              rows="4"
            />
          </div>

          {submitMessage && (
            <div className={`review-message ${submitMessage.includes('success') ? 'success' : 'error'}`}>
              {submitMessage}
            </div>
          )}

          <button
            type="submit"
            className="review-submit-btn"
            disabled={isSubmitting || userRating === 0}
          >
            {isSubmitting ? 'Submitting...' : userReview ? 'Update Review' : 'Submit Review'}
          </button>
        </form>
      )}

      {!isLoggedIn && (
        <p className="review-login-prompt">Please log in to leave a review</p>
      )}

      <div className="reviews-list">
        {loading ? (
          <p className="reviews-loading">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="reviews-empty">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="review-item">
              <div className="review-item-header">
                <div className="review-user-info">
                  <span className="review-user-email">{review.user_email}</span>
                  <span className="review-date">
                    {new Date(review.created_at).toLocaleDateString()}
                    {review.updated_at !== review.created_at && ' (edited)'}
                  </span>
                </div>
                <div className="review-item-rating">
                  {renderStars(review.rating)}
                </div>
              </div>
              {review.comment && (
                <p className="review-comment">{review.comment}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewSection;


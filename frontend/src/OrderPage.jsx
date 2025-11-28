import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './OrderPage.css';

const OrderPage = ({ userEmail, isLoggedIn, orderType = 'service' }) => {
  const { serviceId, courseId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderForm, setOrderForm] = useState({
    packageType: 'basic',
    deliveryTime: 'standard',
    revisions: '0',
    specialInstructions: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
      return;
    }

    const fetchService = async () => {
      try {
        setLoading(true);
        const id = orderType === 'course' ? courseId : serviceId;
        const endpoint = orderType === 'course' 
          ? `http://localhost:4000/api/course-services/${id}`
          : `http://localhost:4000/api/services/${id}`;
        
        const response = await fetch(endpoint);
        const data = await response.json();
        
        if (response.ok && data.success) {
          // Normalize the data structure (course vs service)
          const item = orderType === 'course' ? data.course : data.service;
          setService(item);
        } else {
          console.error('Failed to fetch item:', data.error || 'Unknown error');
          setError(data.error || `${orderType === 'course' ? 'Course' : 'Service'} not found`);
        }
      } catch (err) {
        console.error('Error fetching item:', err);
        setError(`Failed to load ${orderType === 'course' ? 'course' : 'service'}. Please try again.`);
      } finally {
        setLoading(false);
      }
    };

    if (serviceId || courseId) {
      fetchService();
    }
  }, [serviceId, courseId, isLoggedIn, navigate, orderType]);

  const calculatePrice = () => {
    if (!service) return 0;
    
    // For courses, use a simple fixed price
    if (orderType === 'course') {
      // Courses have a fixed enrollment fee
      return 99; // Default course enrollment price
    }
    
    // For services, use the complex pricing logic
    // Extract base price from service.price (e.g., "Starting at $150" -> 150)
    const baseMatch = service.price?.match(/\$?(\d+)/);
    const basePrice = baseMatch ? parseInt(baseMatch[1], 10) : 0;

    if (basePrice === 0) return 0;

    // Package type base multipliers (premium-based pricing)
    // Basic: Base price (1.0x)
    // Standard: 40% premium (1.4x) - includes faster delivery and more revisions
    // Premium: 80% premium (1.8x) - includes fastest delivery and unlimited revisions
    let packageMultiplier = 1.0;
    let includedRevisions = 1;

    if (orderForm.packageType === 'standard') {
      packageMultiplier = 1.4;
      includedRevisions = 2;
    } else if (orderForm.packageType === 'premium') {
      packageMultiplier = 1.8;
      includedRevisions = 999; // Unlimited
    }

    // Start with package base price
    let total = basePrice * packageMultiplier;

    // Delivery time premium (adds to total based on how premium the delivery is)
    // Standard delivery is included in all packages
    if (orderForm.deliveryTime === 'fast') {
      // Fast delivery adds 25% of the current package price
      total += (basePrice * packageMultiplier) * 0.25;
    } else if (orderForm.deliveryTime === 'very-fast') {
      // Very fast delivery adds 50% of the current package price
      total += (basePrice * packageMultiplier) * 0.50;
    }

    // Additional revisions (the value already represents additional revisions beyond what's included)
    // Premium package has unlimited revisions, so no additional charge
    if (orderForm.packageType !== 'premium') {
      const additionalRevisions = parseInt(orderForm.revisions) || 0;
      
      if (additionalRevisions > 0) {
        // Each additional revision adds 10% of base price
        total += basePrice * 0.10 * additionalRevisions;
      }
    }

    return Math.round(total);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const totalPrice = calculatePrice();

      // Use different endpoints for courses vs services
      const endpoint = orderType === 'course' 
        ? 'http://localhost:4000/api/course-enrollments'
        : 'http://localhost:4000/api/orders';

      const requestBody = orderType === 'course' 
        ? {
            userEmail,
            courseId: service.id,
            courseTitle: service.title,
            totalPrice
          }
        : {
            userEmail,
            serviceId: service.id,
            serviceTitle: service.title,
            orderDetails: {
              packageType: orderForm.packageType,
              deliveryTime: orderForm.deliveryTime,
              revisions: orderForm.revisions
            },
            totalPrice,
            deliveryTime: orderForm.deliveryTime,
            specialInstructions: orderForm.specialInstructions
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitMessage(orderType === 'course' 
          ? 'Enrollment successful! You now have access to the course.' 
          : 'Order placed successfully!');
      } else {
        setSubmitMessage(data.error || (orderType === 'course' 
          ? 'Failed to enroll in course' 
          : 'Failed to place order'));
      }
    } catch (err) {
      console.error('Error placing order:', err);
      setSubmitMessage('Error placing order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="order-page">
        <div className="order-loading">Loading {orderType === 'course' ? 'course' : 'service'}...</div>
      </div>
    );
  }

  if (error || (!loading && !service)) {
    return (
      <div className="order-page">
        <div className="order-error">
          <p>{error || 'Service not found'}</p>
          <button className="order-back-btn" onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  const totalPrice = calculatePrice();

  return (
    <div className="order-page">
      <button className="order-back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="order-container">
        <div className="order-header">
          <h1 className="order-title">{orderType === 'course' ? 'Enroll in Course' : 'Place Your Order'}</h1>
          <div className="order-service-info">
            <h2>{service.title}</h2>
            {orderType === 'service' && service.category && (
              <p className="order-service-category">{service.category}</p>
            )}
            {orderType === 'course' && service.level && (
              <p className="order-service-category">{service.level}</p>
            )}
          </div>
        </div>

        {orderType === 'course' ? (
          <div className="order-course-layout">
            <div className="order-summary-section order-course-summary">
              <div className="order-summary-card">
                <h3 className="order-summary-title">Enrollment Summary</h3>
                <div className="order-summary-item">
                  <span>Course:</span>
                  <span>{service.title}</span>
                </div>
                {service.level && (
                  <div className="order-summary-item">
                    <span>Level:</span>
                    <span>{service.level}</span>
                  </div>
                )}
                <div className="order-summary-divider"></div>
                <div className="order-summary-total">
                  <span>Total:</span>
                  <span className="order-total-price">${totalPrice}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="order-course-form">
                {submitMessage && (
                  <div className={`order-message ${submitMessage.includes('success') ? 'success' : 'error'}`}>
                    {submitMessage}
                  </div>
                )}

                <button
                  type="submit"
                  className="order-submit-btn order-course-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Enrolling...' : `Enroll Now - $${totalPrice}`}
                </button>
              </form>

              <div className="order-info-card">
                <h4>What happens next?</h4>
                <ul>
                  <li>Your enrollment will be confirmed</li>
                  <li>You'll receive access to course materials</li>
                  <li>Start learning at your own pace</li>
                  <li>Track your progress in your account</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="order-content">
            <div className="order-form-section">
              <form onSubmit={handleSubmit} className="order-form">
                <div className="order-package-section">
                <h3 className="order-section-title">Select Package</h3>
                <div className="order-package-options">
                  <label className={`order-package-option ${orderForm.packageType === 'basic' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="packageType"
                      value="basic"
                      checked={orderForm.packageType === 'basic'}
                      onChange={(e) => setOrderForm({ ...orderForm, packageType: e.target.value })}
                    />
                    <div className="package-info">
                      <span className="package-name">Basic</span>
                      <span className="package-desc">Standard delivery, 1 revision</span>
                    </div>
                  </label>

                  <label className={`order-package-option ${orderForm.packageType === 'standard' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="packageType"
                      value="standard"
                      checked={orderForm.packageType === 'standard'}
                      onChange={(e) => setOrderForm({ ...orderForm, packageType: e.target.value })}
                    />
                    <div className="package-info">
                      <span className="package-name">Standard</span>
                      <span className="package-desc">Faster delivery, 2 revisions</span>
                    </div>
                  </label>

                  <label className={`order-package-option ${orderForm.packageType === 'premium' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="packageType"
                      value="premium"
                      checked={orderForm.packageType === 'premium'}
                      onChange={(e) => setOrderForm({ ...orderForm, packageType: e.target.value })}
                    />
                    <div className="package-info">
                      <span className="package-name">Premium</span>
                      <span className="package-desc">Fastest delivery, unlimited revisions</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="order-delivery-section">
                <h3 className="order-section-title">Delivery Time</h3>
                <select
                  className="order-select"
                  value={orderForm.deliveryTime}
                  onChange={(e) => setOrderForm({ ...orderForm, deliveryTime: e.target.value })}
                >
                  <option value="standard">Standard (5-7 days) - Included</option>
                  <option value="fast">Fast (3-5 days) - Premium</option>
                  <option value="very-fast">Very Fast (1-3 days) - Premium+</option>
                </select>
              </div>

              <div className="order-revisions-section">
                <h3 className="order-section-title">Additional Revisions</h3>
                <select
                  className="order-select"
                  value={orderForm.revisions}
                  onChange={(e) => setOrderForm({ ...orderForm, revisions: e.target.value })}
                >
                  <option value="0">0 revisions (included)</option>
                  <option value="1">1 additional revision (+10%)</option>
                  <option value="2">2 additional revisions (+20%)</option>
                  <option value="3">3 additional revisions (+30%)</option>
                </select>
              </div>

              <div className="order-instructions-section">
                <h3 className="order-section-title">Special Instructions</h3>
                <textarea
                  className="order-textarea"
                  value={orderForm.specialInstructions}
                  onChange={(e) => setOrderForm({ ...orderForm, specialInstructions: e.target.value })}
                  placeholder="Tell us about your project, specific requirements, style preferences, etc."
                  rows="5"
                />
              </div>

              {submitMessage && (
                <div className={`order-message ${submitMessage.includes('success') ? 'success' : 'error'}`}>
                  {submitMessage}
                </div>
              )}

              <button
                type="submit"
                className="order-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Placing Order...' : `Place Order - $${totalPrice}`}
              </button>
            </form>
          </div>

          <div className="order-summary-section">
            <div className="order-summary-card">
              <h3 className="order-summary-title">Order Summary</h3>
              <div className="order-summary-item">
                <span>Service:</span>
                <span>{service.title}</span>
              </div>
              <div className="order-summary-item">
                <span>Package:</span>
                <span className="order-capitalize">{orderForm.packageType}</span>
              </div>
              <div className="order-summary-item">
                <span>Delivery:</span>
                <span>{orderForm.deliveryTime === 'standard' ? '5-7 days' : orderForm.deliveryTime === 'fast' ? '3-5 days' : '1-3 days'}</span>
              </div>
              <div className="order-summary-item">
                <span>Revisions:</span>
                <span>{orderForm.revisions} {orderForm.revisions === '1' ? 'revision' : 'revisions'}</span>
              </div>
              <div className="order-summary-divider"></div>
              <div className="order-summary-total">
                <span>Total:</span>
                <span className="order-total-price">${totalPrice}</span>
              </div>
            </div>

            <div className="order-info-card">
              <h4>What happens next?</h4>
              <ul>
                <li>Your order will be reviewed</li>
                <li>You'll receive a confirmation email</li>
                <li>Work will begin based on your selected delivery time</li>
                <li>You can track progress in your account</li>
              </ul>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default OrderPage;


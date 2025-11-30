import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useI18n } from './i18n/index.jsx';
import { formatPrice, convertCurrency } from './i18n/currency';
import { trackRecentlyViewed } from './DetailsPage';
import { checkAchievements } from './achievements';
import OrderAIRecommendation from './OrderAIRecommendation';
import './OrderPage.css';

const OrderPage = ({ userEmail, isLoggedIn, orderType = 'service' }) => {
  const { serviceId, courseId } = useParams();
  const navigate = useNavigate();
  const { t, currency, locale } = useI18n();
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
  const [hasDiscount, setHasDiscount] = useState(false);
  const [recommendedPackage, setRecommendedPackage] = useState(null);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [aiRecommendedPackage, setAiRecommendedPackage] = useState(null);
  const [aiRecommendedTotal, setAiRecommendedTotal] = useState(null);

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
          
          // Track recently viewed for order page (create services)
          if (item && id) {
            let thumbnail = null;
            let illustration = null;
            
            if (orderType === 'course') {
              thumbnail = item.details?.banner_image_url || null;
              illustration = item.illustration || item.icon || null;
            } else {
              thumbnail = item.details?.banner_image_url || null;
            }
            
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
              type: orderType === 'course' ? 'course' : 'service',
              title: item.title,
              thumbnail: thumbnail,
              illustration: illustration,
              isCreateService: orderType === 'service'
            });
          }
        } else {
          console.error('Failed to fetch item:', data.error || 'Unknown error');
          setError(data.error || t('order.error'));
        }
      } catch (err) {
        console.error('Error fetching item:', err);
        setError(t('order.error'));
      } finally {
        setLoading(false);
      }
    };

    if (serviceId || courseId) {
      fetchService();
    }

    // Check for achievement discount
    if (userEmail && typeof window !== 'undefined') {
      fetch(`http://localhost:4000/api/user/${encodeURIComponent(userEmail)}/achievements`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.discountAvailable) {
            setHasDiscount(true);
          }
        })
        .catch(err => console.error('Error checking discount:', err));
    }
  }, [serviceId, courseId, isLoggedIn, navigate, orderType, userEmail]);

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

    let finalTotal = Math.round(total);

    // Apply 30% discount if available
    if (hasDiscount && userEmail) {
      finalTotal = Math.round(finalTotal * 0.7);
    }

    return finalTotal;
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
          ? t('order.enrollmentSuccess')
          : t('order.orderSuccess'));
        
        // Remove discount after successful order (one-time use)
        if (hasDiscount && userEmail) {
          fetch(`http://localhost:4000/api/user/${encodeURIComponent(userEmail)}/achievements`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ discountAvailable: false }),
          }).then(() => {
            setHasDiscount(false);
          }).catch(err => console.error('Error removing discount:', err));
        }
        
        // Check for first order achievement
        if (userEmail) {
          checkAchievements(userEmail, 'order').then(achievementNotifications => {
            if (achievementNotifications.length > 0) {
              const existingNotifications = JSON.parse(localStorage.getItem('chimpNotifications') || '[]');
              const updatedNotifications = [...existingNotifications, ...achievementNotifications];
              localStorage.setItem('chimpNotifications', JSON.stringify(updatedNotifications));
              window.dispatchEvent(new CustomEvent('achievementsUpdated'));
            }
          });
        }
      } else {
        setSubmitMessage(data.error || (orderType === 'course' 
          ? t('order.enrollmentFailed')
          : t('order.orderFailed')));
      }
    } catch (err) {
      console.error('Error placing order:', err);
      setSubmitMessage(t('order.errorPlacingOrder'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="order-page">
        <div className="order-loading">{t('order.loading')}</div>
      </div>
    );
  }

  if (error || (!loading && !service)) {
    return (
      <div className="order-page">
        <div className="order-error">
          <p>{error || t('order.error')}</p>
          <button className="order-back-btn" onClick={() => navigate(-1)}>{t('order.goBack')}</button>
        </div>
      </div>
    );
  }

  if (!service) {
    return null;
  }

  // Calculate base total (before discount)
  const calculateBaseTotal = () => {
    if (!service) return 0;
    if (orderType === 'course') return 99;
    
    const baseMatch = service.price?.match(/\$?(\d+)/);
    const basePrice = baseMatch ? parseInt(baseMatch[1], 10) : 0;
    if (basePrice === 0) return 0;

    let packageMultiplier = 1.0;
    if (orderForm.packageType === 'standard') {
      packageMultiplier = 1.4;
    } else if (orderForm.packageType === 'premium') {
      packageMultiplier = 1.8;
    }

    let total = basePrice * packageMultiplier;

    if (orderForm.deliveryTime === 'fast') {
      total += (basePrice * packageMultiplier) * 0.25;
    } else if (orderForm.deliveryTime === 'very-fast') {
      total += (basePrice * packageMultiplier) * 0.50;
    }

    if (orderForm.packageType !== 'premium') {
      const additionalRevisions = parseInt(orderForm.revisions) || 0;
      if (additionalRevisions > 0) {
        total += basePrice * 0.10 * additionalRevisions;
      }
    }

    return Math.round(total);
  };

  const baseTotalUSD = calculateBaseTotal();
  const discountAmountUSD = hasDiscount ? Math.round(baseTotalUSD * 0.3) : 0;
  const totalPriceUSD = calculatePrice();
  const totalPrice = convertCurrency(totalPriceUSD, currency);
  const baseTotal = convertCurrency(baseTotalUSD, currency);
  const discountAmount = convertCurrency(discountAmountUSD, currency);

  return (
    <div className="order-page">
      <button className="order-back-btn" onClick={() => navigate(-1)}>
        {t('order.back')}
      </button>

      <div className="order-container">
        <div className="order-header">
          <h1 className="order-title">{orderType === 'course' ? t('order.enrollInCourse') : t('order.placeOrder')}</h1>
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
                <h3 className="order-summary-title">{t('order.enrollmentSummary')}</h3>
                <div className="order-summary-item">
                  <span>{t('order.course')}</span>
                  <span>{service.title}</span>
                </div>
                {service.level && (
                  <div className="order-summary-item">
                    <span>{t('order.level')}</span>
                    <span>{service.level}</span>
                  </div>
                )}
                {hasDiscount && (
                  <>
                    <div className="order-summary-item">
                      <span>{t('order.subtotal')}</span>
                      <span>{formatPrice(baseTotal, currency, locale)}</span>
                    </div>
                    <div className="order-summary-item order-discount">
                      <span>{t('order.achievementDiscount')}</span>
                      <span className="discount-amount">-{formatPrice(discountAmount, currency, locale)}</span>
                    </div>
                  </>
                )}
                <div className="order-summary-divider"></div>
                <div className="order-summary-total">
                  <span>{t('order.total')}</span>
                  <span className="order-total-price">{formatPrice(totalPrice, currency, locale)}</span>
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
                  {isSubmitting ? t('order.enrolling') : `${t('order.enrollNow')} - ${formatPrice(totalPrice, currency, locale)}`}
                </button>
              </form>

              <div className="order-info-card">
                <h4>{t('order.whatHappensNext')}</h4>
                <ul>
                  <li>{t('order.enrollmentConfirmed')}</li>
                  <li>{t('order.accessMaterials')}</li>
                  <li>{t('order.startLearning')}</li>
                  <li>{t('order.trackProgressAccount')}</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="order-content">
            <div className="order-form-section">
              <form onSubmit={handleSubmit} className="order-form">
                <div className="order-package-section">
                <h3 className="order-section-title">{t('order.selectPackage')}</h3>
                <div className="order-package-options">
                  <label className={`order-package-option ${orderForm.packageType === 'basic' ? 'selected' : ''} ${recommendedPackage === 'basic' ? 'ai-recommended' : ''}`}>
                    <input
                      type="radio"
                      name="packageType"
                      value="basic"
                      checked={orderForm.packageType === 'basic'}
                      onChange={(e) => setOrderForm({ ...orderForm, packageType: e.target.value })}
                    />
                    <div className="package-info">
                      <span className="package-name">{t('order.basic')}</span>
                      <span className="package-desc">{t('order.basicDesc')}</span>
                    </div>
                  </label>

                  <label className={`order-package-option ${orderForm.packageType === 'standard' ? 'selected' : ''} ${recommendedPackage === 'standard' ? 'ai-recommended' : ''}`}>
                    <input
                      type="radio"
                      name="packageType"
                      value="standard"
                      checked={orderForm.packageType === 'standard'}
                      onChange={(e) => setOrderForm({ ...orderForm, packageType: e.target.value })}
                    />
                    <div className="package-info">
                      <span className="package-name">{t('order.standard')}</span>
                      <span className="package-desc">{t('order.standardDesc')}</span>
                    </div>
                  </label>

                  <label className={`order-package-option ${orderForm.packageType === 'premium' ? 'selected' : ''} ${recommendedPackage === 'premium' ? 'ai-recommended' : ''}`}>
                    <input
                      type="radio"
                      name="packageType"
                      value="premium"
                      checked={orderForm.packageType === 'premium'}
                      onChange={(e) => setOrderForm({ ...orderForm, packageType: e.target.value })}
                    />
                    <div className="package-info">
                      <span className="package-name">{t('order.premium')}</span>
                      <span className="package-desc">{t('order.premiumDesc')}</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="order-delivery-section">
                <h3 className="order-section-title">{t('order.deliveryTime')}</h3>
                <select
                  className="order-select"
                  value={orderForm.deliveryTime}
                  onChange={(e) => setOrderForm({ ...orderForm, deliveryTime: e.target.value })}
                >
                  <option value="standard">{t('order.standardDelivery')}</option>
                  <option value="fast">{t('order.fastDelivery')}</option>
                  <option value="very-fast">{t('order.veryFastDelivery')}</option>
                </select>
              </div>

              <div className="order-revisions-section">
                <h3 className="order-section-title">{t('order.additionalRevisions')}</h3>
                <select
                  className="order-select"
                  value={orderForm.revisions}
                  onChange={(e) => setOrderForm({ ...orderForm, revisions: e.target.value })}
                >
                  <option value="0">0 {t('order.additionalRevisionsPlural')}</option>
                  <option value="1">1 {t('order.additionalRevision')} (+10%)</option>
                  <option value="2">2 {t('order.additionalRevisionsPlural')} (+20%)</option>
                  <option value="3">3 {t('order.additionalRevisionsPlural')} (+30%)</option>
                </select>
              </div>

              <div className="order-instructions-section">
                <h3 className="order-section-title">{t('order.specialInstructions')}</h3>
                <textarea
                  className="order-textarea"
                  value={orderForm.specialInstructions}
                  onChange={(e) => setOrderForm({ ...orderForm, specialInstructions: e.target.value })}
                  placeholder={t('order.instructionsPlaceholder')}
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
                {isSubmitting ? t('order.placingOrder') : `${t('order.placeOrder')} - ${formatPrice(totalPrice, currency, locale)}`}
              </button>
            </form>
            
            {aiRecommendation && (
              <OrderAIRecommendation 
                serviceTitle={service.title}
                serviceCategory={service.category}
                serviceDescription={service.description}
                servicePrice={service.price}
                basePriceUSD={orderType === 'service' ? (() => {
                  const baseMatch = service.price?.match(/\$?(\d+)/);
                  return baseMatch ? parseInt(baseMatch[1], 10) : 0;
                })() : 99}
                currency={currency}
                locale={locale}
                orderType={orderType}
                showOnlyRecommendation={true}
                recommendation={aiRecommendation}
                recommendedPackage={aiRecommendedPackage}
                recommendedTotal={aiRecommendedTotal}
              />
            )}
          </div>

          <div className="order-summary-section">
            <div className="order-summary-card">
              <h3 className="order-summary-title">{t('order.orderSummary')}</h3>
              <div className="order-summary-item">
                <span>{t('order.service')}</span>
                <span>{service.title}</span>
              </div>
              <div className="order-summary-item">
                <span>{t('order.package')}</span>
                <span className="order-capitalize">{t(`order.${orderForm.packageType}`)}</span>
              </div>
              <div className="order-summary-item">
                <span>{t('order.delivery')}</span>
                <span>{orderForm.deliveryTime === 'standard' ? '5-7 ' + t('order.days') : orderForm.deliveryTime === 'fast' ? '3-5 ' + t('order.days') : '1-3 ' + t('order.days')}</span>
              </div>
              <div className="order-summary-item">
                <span>{t('order.revisions')}</span>
                <span>{orderForm.revisions} {orderForm.revisions === '1' ? t('order.revision') : t('order.revisionsIncluded')}</span>
              </div>
              {hasDiscount && (
                <>
                  <div className="order-summary-item">
                    <span>{t('order.subtotal')}</span>
                    <span>{formatPrice(baseTotal, currency, locale)}</span>
                  </div>
                  <div className="order-summary-item order-discount">
                    <span>{t('order.achievementDiscount')}</span>
                    <span className="discount-amount">-{formatPrice(discountAmount, currency, locale)}</span>
                  </div>
                </>
              )}
              <div className="order-summary-divider"></div>
              <div className="order-summary-total">
                <span>{t('order.total')}</span>
                <span className="order-total-price">{formatPrice(totalPrice, currency, locale)}</span>
              </div>
            </div>

            <div className="order-info-card">
              <h4>{t('order.whatHappensNext')}</h4>
              <ul>
                <li>{t('order.orderReview')}</li>
                <li>{t('order.confirmationEmail')}</li>
                <li>{t('order.workBegins')}</li>
                <li>{t('order.trackProgress')}</li>
              </ul>
            </div>

            <OrderAIRecommendation 
              serviceTitle={service.title}
              serviceCategory={service.category}
              serviceDescription={service.description}
              servicePrice={service.price}
              basePriceUSD={orderType === 'service' ? (() => {
                const baseMatch = service.price?.match(/\$?(\d+)/);
                return baseMatch ? parseInt(baseMatch[1], 10) : 0;
              })() : 99}
              currency={currency}
              locale={locale}
              orderType={orderType}
              onRecommendationChange={(packageType) => {
                if (packageType && ['basic', 'standard', 'premium'].includes(packageType.toLowerCase())) {
                  setRecommendedPackage(packageType.toLowerCase());
                  setOrderForm({ ...orderForm, packageType: packageType.toLowerCase() });
                }
              }}
              onRecommendationGenerated={(rec, pkg, total) => {
                setAiRecommendation(rec);
                setAiRecommendedPackage(pkg);
                setAiRecommendedTotal(total);
              }}
            />
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default OrderPage;


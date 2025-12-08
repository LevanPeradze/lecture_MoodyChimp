import { useState, useEffect } from 'react';
import { useI18n } from './i18n/index.jsx';
import { convertCurrency, formatPrice } from './i18n/currency';
import { getApiUrl } from './config';
import './OrderAIRecommendation.css';

const OrderAIRecommendation = ({ 
  serviceTitle, 
  serviceCategory, 
  serviceDescription, 
  servicePrice,
  basePriceUSD,
  currency,
  locale,
  orderType,
  onRecommendationChange
}) => {
  const { t } = useI18n();
  const [userInput, setUserInput] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [recommendedPackage, setRecommendedPackage] = useState(null);
  const [recommendedTotal, setRecommendedTotal] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRecommendation = async (text) => {
    if (!text || !text.trim()) {
      setError(t('orderAI.emptyDescription'));
      setRecommendation('');
      return;
    }

    setIsLoading(true);
    setError('');
    setRecommendation('');
    setRecommendedPackage(null);
    setRecommendedTotal(null);

    try {
      const response = await fetch(getApiUrl('api/recommend-order'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: text.trim(),
          serviceTitle: serviceTitle || null,
          serviceCategory: serviceCategory || null,
          serviceDescription: serviceDescription || null,
          servicePrice: servicePrice || null,
          basePriceUSD: basePriceUSD || 0,
          currency: currency || 'USD',
          orderType: orderType || 'service'
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setRecommendation(data.recommendation);
        
        // Handle redirect or unrelated responses
        if (data.isRedirect || data.isUnrelated) {
          setRecommendedPackage(null);
          setRecommendedTotal(null);
          // Don't update package selection for redirects or unrelated requests
        } else {
          // Extract package type from recommendation
          const recText = data.recommendation.toLowerCase();
          let pkgType = null;
          if (recText.includes('premium')) {
            pkgType = 'premium';
          } else if (recText.includes('standard')) {
            pkgType = 'standard';
          } else if (recText.includes('basic')) {
            pkgType = 'basic';
          }
          setRecommendedPackage(pkgType);
          setRecommendedTotal(data.recommendedTotal || null);
          
          // Notify parent component to update package selection
          if (pkgType && onRecommendationChange) {
            onRecommendationChange(pkgType);
          }
        }
      } else {
        setError(data.error || t('orderAI.error'));
        if (data.details) {
          console.error('AI recommendation error details:', data.details);
        }
      }
    } catch (err) {
      console.error('Error getting AI recommendation:', err);
      setError(t('orderAI.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetRecommendation = () => {
    fetchRecommendation(userInput);
  };

  return (
    <div className="order-ai-recommendation">
      <div className="order-ai-header">
        <h4 className="order-ai-title">
          🤖 {t('orderAI.title')}
        </h4>
      </div>

      <div className="order-ai-input-section">
        <textarea
          className="order-ai-textarea"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={t('orderAI.placeholder')}
          rows="3"
          disabled={isLoading}
        />
        <button
          className="order-ai-btn"
          onClick={handleGetRecommendation}
          disabled={isLoading || !userInput || !userInput.trim()}
        >
          {isLoading ? (
            <>
              <span className="order-ai-spinner"></span>
              {t('orderAI.loading')}
            </>
          ) : (
            t('orderAI.getRecommendation')
          )}
        </button>
      </div>

      {error && (
        <div className="order-ai-error">
          {error}
        </div>
      )}

      {recommendation && (
        <div className="order-ai-card">
          <div className="order-ai-card-header">
            <span className="order-ai-icon">💡</span>
            <strong>{t('orderAI.recommendation')}</strong>
          </div>
          <div className="order-ai-recommendation-content">
            {recommendedPackage && (
              <div className="order-ai-package-badge">
                {t(`order.${recommendedPackage}`).toUpperCase()}
              </div>
            )}
            {recommendation.toLowerCase().includes('redirect:') && (
              <div className="order-ai-redirect-badge">
                ⚠️ REDIRECT
              </div>
            )}
            <div className="order-ai-text" dangerouslySetInnerHTML={{ 
              __html: recommendation
                .split('\n')
                .filter(line => {
                  // Remove lines that contain price information (we calculate it separately)
                  const lower = line.toLowerCase();
                  return !lower.includes('total price') && 
                         !lower.includes('estimated total') && 
                         !lower.startsWith('total:');
                })
                .map((line, i) => {
                  const trimmed = line.trim();
                  // Skip "RECOMMENDED:" line if package badge is shown
                  if (trimmed.toLowerCase().startsWith('recommended:') && recommendedPackage) {
                    return '';
                  }
                  // Format redirect messages
                  if (trimmed.toLowerCase().startsWith('redirect:')) {
                    return `<div class="order-ai-redirect-message">${trimmed.replace(/^redirect:\s*/i, '')}</div>`;
                  }
                  if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
                    return `<div class="order-ai-bullet-point">${trimmed}</div>`;
                  }
                  return trimmed ? `<p>${trimmed}</p>` : '';
                })
                .filter(html => html !== '')
                .join('')
            }} />
            {recommendedTotal && !recommendation.toLowerCase().includes('redirect:') && (
              <div className="order-ai-total">
                <strong>{t('order.total')}: {formatPrice(recommendedTotal, currency, locale)}</strong>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderAIRecommendation;


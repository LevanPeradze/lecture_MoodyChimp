// Currency conversion utilities
// Base currency: USD
// Last updated: 2025-01-XX
// Note: These rates should be updated periodically for accuracy

const EXCHANGE_RATES = {
  USD: 1.0,      // Base currency
  EUR: 0.92,     // 1 USD = 0.92 EUR (approximate)
  GEL: 2.65      // 1 USD = 2.65 GEL (approximate)
};

/**
 * Convert price from USD to target currency
 * @param {number} usdAmount - Price in USD
 * @param {string} targetCurrency - Target currency code (USD, EUR, GEL)
 * @returns {number} - Converted price
 */
export const convertCurrency = (usdAmount, targetCurrency) => {
  if (!usdAmount || isNaN(usdAmount)) return 0;
  
  const rate = EXCHANGE_RATES[targetCurrency] || EXCHANGE_RATES.USD;
  const converted = usdAmount * rate;
  
  // Round based on currency
  if (targetCurrency === 'GEL') {
    // Round to whole numbers for GEL
    return Math.round(converted);
  } else {
    // Round to 2 decimal places for USD and EUR
    return Math.round(converted * 100) / 100;
  }
};

/**
 * Format price with currency symbol
 * @param {number} amount - Price amount
 * @param {string} currency - Currency code (USD, EUR, GEL)
 * @param {string} locale - Locale code (en, ka, de)
 * @returns {string} - Formatted price string
 */
export const formatPrice = (amount, currency, locale = 'en') => {
  if (!amount || isNaN(amount)) return '0';
  
  // Map locale to Intl locale code
  const localeMap = {
    'en': 'en-US',
    'ka': 'ka-GE',
    'de': 'de-DE'
  };
  
  const intlLocale = localeMap[locale] || 'en-US';
  
  // Map currency codes to Intl currency codes
  const currencyMap = {
    'USD': 'USD',
    'EUR': 'EUR',
    'GEL': 'GEL'
  };
  
  const intlCurrency = currencyMap[currency] || 'USD';
  
  try {
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency: intlCurrency,
      minimumFractionDigits: currency === 'GEL' ? 0 : 2,
      maximumFractionDigits: currency === 'GEL' ? 0 : 2
    }).format(amount);
  } catch (error) {
    // Fallback formatting
    const symbols = {
      'USD': '$',
      'EUR': '€',
      'GEL': '₾'
    };
    
    const symbol = symbols[currency] || '$';
    const formatted = currency === 'GEL' 
      ? Math.round(amount).toString()
      : amount.toFixed(2);
    
    // Simple formatting: symbol + amount
    return `${symbol}${formatted}`;
  }
};

/**
 * Parse price string and extract numeric value
 * Handles formats like "$150", "Starting at $150", "€100", "₾265"
 * @param {string} priceStr - Price string
 * @returns {number} - Extracted numeric value (assumed to be in USD)
 */
export const parsePrice = (priceStr) => {
  if (!priceStr) return 0;
  
  // Remove currency symbols and extract number
  const cleaned = priceStr.replace(/[$€₾,]/g, '');
  const match = cleaned.match(/(\d+(?:\.\d+)?)/);
  
  return match ? parseFloat(match[1]) : 0;
};

/**
 * Convert and format price from USD string to target currency
 * @param {string} usdPriceStr - Price string in USD (e.g., "$150" or "Starting at $150")
 * @param {string} targetCurrency - Target currency code
 * @param {string} locale - Locale code
 * @returns {string} - Formatted price in target currency
 */
export const convertAndFormatPrice = (usdPriceStr, targetCurrency, locale = 'en') => {
  const usdAmount = parsePrice(usdPriceStr);
  const converted = convertCurrency(usdAmount, targetCurrency);
  return formatPrice(converted, targetCurrency, locale);
};

/**
 * Get currency symbol
 * @param {string} currency - Currency code
 * @returns {string} - Currency symbol
 */
export const getCurrencySymbol = (currency) => {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'GEL': '₾'
  };
  return symbols[currency] || '$';
};


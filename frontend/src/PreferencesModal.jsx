import { useState } from 'react';
import { useI18n } from './i18n/index.jsx';
import './PreferencesModal.css';

const PreferencesModal = ({ isOpen, onClose }) => {
  const { language, currency, setLanguage, setCurrency, t } = useI18n();
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [selectedCurrency, setSelectedCurrency] = useState(currency);

  if (!isOpen) return null;

  const handleSave = () => {
    setLanguage(selectedLanguage);
    setCurrency(selectedCurrency);
    onClose();
  };

  const handleClose = () => {
    // Reset to current values if cancelled
    setSelectedLanguage(language);
    setSelectedCurrency(currency);
    onClose();
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ka', name: 'ქართული' },
    { code: 'de', name: 'Deutsch' }
  ];

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GEL', name: 'Georgian Lari', symbol: '₾' }
  ];

  return (
    <div className="preferences-overlay" onClick={handleClose}>
      <div className="preferences-modal" onClick={(e) => e.stopPropagation()}>
        <div className="preferences-header">
          <h2 className="preferences-title">{t('preferences.title')}</h2>
          <button className="preferences-close-btn" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="preferences-content">
          <div className="preferences-section">
            <label className="preferences-label">{t('preferences.language')}</label>
            <div className="preferences-options">
              {languages.map((lang) => (
                <label
                  key={lang.code}
                  className={`preferences-option ${selectedLanguage === lang.code ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="language"
                    value={lang.code}
                    checked={selectedLanguage === lang.code}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                  />
                  <span>{lang.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="preferences-section">
            <label className="preferences-label">{t('preferences.currency')}</label>
            <div className="preferences-options">
              {currencies.map((curr) => (
                <label
                  key={curr.code}
                  className={`preferences-option ${selectedCurrency === curr.code ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="currency"
                    value={curr.code}
                    checked={selectedCurrency === curr.code}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                  />
                  <span>{curr.symbol} {curr.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="preferences-footer">
          <button className="preferences-cancel-btn" onClick={handleClose}>
            {t('preferences.close')}
          </button>
          <button className="preferences-save-btn" onClick={handleSave}>
            {t('preferences.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreferencesModal;


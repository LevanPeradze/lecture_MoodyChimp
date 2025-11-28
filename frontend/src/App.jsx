import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import logoImage from './assets/logo.png';
import LoginModal from './LoginModal';
import AccountPage from './AccountPage';
import Questionnaire from './Questionnaire';
import QuestionnaireResult from './QuestionnaireResult';
import BookmarksPage from './BookmarksPage';
import DetailsPage from './DetailsPage';
import OrderPage from './OrderPage';
import PreferencesModal from './PreferencesModal';
import BananaGame from './BananaGame';
import NotificationBell from './NotificationBell';
import RecentlyViewed from './RecentlyViewed';
import { trackRecentlyViewed } from './DetailsPage';
import { useI18n } from './i18n/index.jsx';
import { convertAndFormatPrice, formatPrice, convertCurrency, parsePrice } from './i18n/currency';

const highlightWords = [
  { text: 'creative', className: 'word-brutal' },
  { text: 'technical', className: 'word-tech' },
  { text: 'innovational', className: 'word-serif' },
  { text: 'smart', className: 'word-script' },
];

export default function App() {
  const { t, currency, language } = useI18n();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginInHeader, setShowLoginInHeader] = useState(false);
  const [showAccountPage, setShowAccountPage] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState('Learn');
  const [selectedCreateCategory, setSelectedCreateCategory] = useState(null);
  const [learnServices, setLearnServices] = useState([]);
  const [createServices, setCreateServices] = useState({});
  const [createCategories, setCreateCategories] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [showQuestionnaireResult, setShowQuestionnaireResult] = useState(false);
  const [optimalCourse, setOptimalCourse] = useState(null);
  const [userOptimalCourse, setUserOptimalCourse] = useState(null);
  const [bookmarkedCourses, setBookmarkedCourses] = useState([]);
  const [showBookmarksPage, setShowBookmarksPage] = useState(false);
  const [userAvatar, setUserAvatar] = useState(null);
  const [userData, setUserData] = useState(null); // Store user profile data for notifications
  const [pendingOrderServiceId, setPendingOrderServiceId] = useState(null);
  const [courseReviews, setCourseReviews] = useState({}); // Store reviews by course ID
  const [hoveredCourseId, setHoveredCourseId] = useState(null);

  // Filter states
  const [learnFilters, setLearnFilters] = useState(() => {
    const saved = localStorage.getItem('lastLearnFiltersUsed');
    return saved ? JSON.parse(saved) : { level: 'all', priceRange: 'all' };
  });
  const [createFilters, setCreateFilters] = useState(() => {
    const saved = localStorage.getItem('lastCreateFiltersUsed');
    return saved ? JSON.parse(saved) : { priceRange: 'all' };
  });

  // Initialize theme from LocalStorage immediately, default to 'dark' if not set
  const [themeMode, setThemeMode] = useState(() => {
    // Check LocalStorage immediately during initialization
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('themeMode');
      if (savedTheme) {
        return savedTheme;
      }
    }
    // Default to dark mode if nothing is saved
    return 'dark';
  });

  // Initialize color theme from LocalStorage, default to 'default'
  const [colorTheme, setColorTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedColorTheme = localStorage.getItem('colorTheme');
      return savedColorTheme || 'default';
    }
    return 'default';
  });

  const heroRef = useRef(null);

  // Apply theme classes to body on initial mount and whenever theme or colorTheme changes
  useEffect(() => {
    const themeClass = themeMode === 'light' ? 'light-mode' : 'dark-mode';
    const colorThemeClass = `theme-${colorTheme}`;
    document.body.className = `${themeClass} ${colorThemeClass}`;
    localStorage.setItem('themeMode', themeMode);
    localStorage.setItem('colorTheme', colorTheme);
  }, [themeMode, colorTheme]);

  // Apply initial theme on mount to prevent flicker
  useEffect(() => {
    const savedThemeMode = localStorage.getItem('themeMode') || 'dark';
    const savedColorTheme = localStorage.getItem('colorTheme') || 'default';
    const themeClass = savedThemeMode === 'light' ? 'light-mode' : 'dark-mode';
    const colorThemeClass = `theme-${savedColorTheme}`;
    document.body.className = `${themeClass} ${colorThemeClass}`;
  }, []);

  // Save filter states to LocalStorage
  useEffect(() => {
    localStorage.setItem('lastLearnFiltersUsed', JSON.stringify(learnFilters));
  }, [learnFilters]);

  useEffect(() => {
    localStorage.setItem('lastCreateFiltersUsed', JSON.stringify(createFilters));
  }, [createFilters]);


  // Check if this is first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited');
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const showLogin = localStorage.getItem('showLoginInHeader') === 'true';

    if (!hasVisited && !loggedIn) {
      setShowLoginModal(true);
    } else if ((hasVisited && !loggedIn) || showLogin) {
      // User has visited before but not logged in - show login option in header
      setShowLoginInHeader(true);
    }

    if (loggedIn) {
      setIsLoggedIn(true);
      setShowLoginInHeader(false);
      // Get user email from localStorage if available
      const savedEmail = localStorage.getItem('userEmail');
      if (savedEmail) {
        setUserEmail(savedEmail);
      }
    }
  }, []);

  // Fetch all services from database
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoadingServices(true);

        // Fetch Learn services (course services)
        const learnResponse = await fetch('http://localhost:4000/api/course-services');
        const learnData = await learnResponse.json();
        if (learnData.success) {
          setLearnServices(learnData.services);
        } else {
          console.error('Failed to fetch Learn services:', learnData);
        }

        // Fetch all Create services
        const createResponse = await fetch('http://localhost:4000/api/services');
        const createData = await createResponse.json();
        if (createData.success) {
          // Organize Create services by category
          const organized = {};
          const categories = new Set();

          createData.services.forEach(service => {
            if (!organized[service.category]) {
              organized[service.category] = [];
              categories.add(service.category);
            }
            organized[service.category].push({
              id: service.id,
              title: service.title,
              description: service.description,
              price: service.price
            });
          });

          setCreateServices(organized);
          setCreateCategories(Array.from(categories).sort());
        } else {
          console.error('Failed to fetch Create services:', createData);
        }
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  // Fetch reviews for courses when they're loaded
  useEffect(() => {
    const fetchCourseReviews = async () => {
      const reviewsMap = {};
      for (const course of learnServices) {
        try {
          const response = await fetch(`http://localhost:4000/api/reviews/course/${course.id}`);
          const data = await response.json();
          if (data.success) {
            reviewsMap[course.id] = {
              averageRating: data.averageRating || 0,
              totalReviews: data.totalReviews || 0,
              reviews: data.reviews.slice(0, 3) // Show only top 3 reviews on hover
            };
          }
        } catch (err) {
          console.error(`Error fetching reviews for course ${course.id}:`, err);
        }
      }
      setCourseReviews(reviewsMap);
    };

    if (learnServices.length > 0) {
      fetchCourseReviews();
    }
  }, [learnServices]);

  // Fetch user's optimal course and profile if logged in
  useEffect(() => {
    const fetchUserData = async () => {
      if (userEmail) {
        try {
          // Fetch optimal course
          const optimalResponse = await fetch(`http://localhost:4000/api/user-optimal/${encodeURIComponent(userEmail)}`);
          const optimalData = await optimalResponse.json();
          if (optimalData.success && optimalData.optimalCourse) {
            setUserOptimalCourse(optimalData.optimalCourse);
          }

          // Fetch user profile (for avatar and color theme)
          const profileResponse = await fetch(`http://localhost:4000/api/user/${encodeURIComponent(userEmail)}`);
          const profileData = await profileResponse.json();
          if (profileData.success && profileData.user) {
            setUserAvatar(profileData.user.avatar_url || null);
            setUserData(profileData.user); // Store user data for notifications
            // Load user's preferred color theme from database
            if (profileData.user.color_theme) {
              setColorTheme(profileData.user.color_theme);
              localStorage.setItem('colorTheme', profileData.user.color_theme);
            } else {
              // If no theme in database, use default
              setColorTheme('default');
              localStorage.setItem('colorTheme', 'default');
            }
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      } else {
        setUserAvatar(null);
      }
    };

    fetchUserData();
  }, [userEmail]);

  // Load bookmarked courses from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('bookmarkedCourses');
    if (saved) {
      try {
        setBookmarkedCourses(JSON.parse(saved));
      } catch (err) {
        console.error('Error loading bookmarked courses:', err);
      }
    }
  }, []);

  // Save bookmarked courses to LocalStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('bookmarkedCourses', JSON.stringify(bookmarkedCourses));
  }, [bookmarkedCourses]);

  // Toggle bookmark for a course
  const toggleBookmark = (courseId) => {
    setBookmarkedCourses(prev => {
      if (prev.includes(courseId)) {
        return prev.filter(id => id !== courseId);
      } else {
        return [...prev, courseId];
      }
    });
  };

  // Helper function to parse price from string (e.g., "$100" -> 100)
  const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    const match = priceStr.match(/\$?(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Helper function to get price filter thresholds in selected currency
  const getPriceThresholds = () => {
    // Base thresholds in USD
    const thresholds = {
      under: 50,
      low: 50,
      mid: 100,
      high: 200
    };

    // Convert to selected currency
    return {
      under: convertCurrency(thresholds.under, currency),
      low: convertCurrency(thresholds.low, currency),
      mid: convertCurrency(thresholds.mid, currency),
      high: convertCurrency(thresholds.high, currency)
    };
  };

  // Helper function to get price filter option labels
  const getPriceFilterOptions = () => {
    const thresholds = getPriceThresholds();

    // Replace price in text - handles different formats: "$50", "50€", "50₾", "50"
    const replacePriceInText = (text, oldPrice, newPriceFormatted) => {
      const newPriceNum = Math.round(convertCurrency(oldPrice, currency)).toString();
      // Remove spaces from formatted price for clean replacement
      const newPriceClean = newPriceFormatted.replace(/\s/g, '');

      // Replace patterns in order of specificity (most specific first)
      // 1. Currency symbol before number: $50
      // 2. Currency symbol after number: 50€, 50₾, 50$
      // 3. Standalone number (word boundary to avoid partial matches)
      let result = text;

      // Replace $50 pattern
      result = result.replace(new RegExp(`\\$${oldPrice}\\b`, 'g'), newPriceClean);

      // Replace 50€, 50₾, 50$ patterns (number before currency)
      result = result.replace(new RegExp(`\\b${oldPrice}€`, 'g'), newPriceClean);
      result = result.replace(new RegExp(`\\b${oldPrice}₾`, 'g'), newPriceClean);
      result = result.replace(new RegExp(`\\b${oldPrice}\\$`, 'g'), newPriceClean);

      // Replace standalone number (only if not already replaced)
      result = result.replace(new RegExp(`\\b${oldPrice}\\b`, 'g'), newPriceNum);

      return result;
    };

    const getUnderText = () => {
      const baseText = t('services.filters.under50');
      const convertedPrice = formatPrice(thresholds.under, currency, language);
      return replacePriceInText(baseText, 50, convertedPrice);
    };

    const getOverText = () => {
      const baseText = t('services.filters.over200');
      const convertedPrice = formatPrice(thresholds.high, currency, language);
      return replacePriceInText(baseText, 200, convertedPrice);
    };

    // For range options, replace both prices
    const getRangeText = (lowThreshold, highThreshold, translationKey) => {
      const baseText = t(translationKey);
      const lowPriceStr = formatPrice(lowThreshold, currency, language);
      const highPriceStr = formatPrice(highThreshold, currency, language);

      // Determine which USD values to replace (50/100 or 100/200)
      const lowUSD = lowThreshold === thresholds.low ? 50 : 100;
      const highUSD = highThreshold === thresholds.mid ? 100 : 200;

      // Replace low price first, then high price
      let result = replacePriceInText(baseText, lowUSD, lowPriceStr);
      result = replacePriceInText(result, highUSD, highPriceStr);

      return result;
    };

    return {
      all: t('services.filters.allPrices'),
      under50: getUnderText(),
      '50-100': getRangeText(thresholds.low, thresholds.mid, 'services.filters.50to100'),
      '100-200': getRangeText(thresholds.mid, thresholds.high, 'services.filters.100to200'),
      over200: getOverText()
    };
  };

  // Filter Learn services
  const getFilteredLearnServices = () => {
    const thresholds = getPriceThresholds();

    return learnServices.filter(service => {
      // Level filter - check if the selected level appears in the course's level string
      if (learnFilters.level !== 'all') {
        const courseLevel = service.level?.toLowerCase() || '';
        const filterLevel = learnFilters.level.toLowerCase();

        // Map filter values to database format
        // Database has: 'for beginners', 'beginner-intermediate', 'intermediate-advanced'
        // Filter has: 'Beginner', 'Intermediate', 'Advanced'
        let levelMatches = false;

        if (filterLevel === 'beginner') {
          // Match if course level contains 'beginner' (e.g., 'for beginners', 'beginner-intermediate')
          levelMatches = courseLevel.includes('beginner');
        } else if (filterLevel === 'intermediate') {
          // Match if course level contains 'intermediate' (e.g., 'beginner-intermediate', 'intermediate-advanced')
          levelMatches = courseLevel.includes('intermediate');
        } else if (filterLevel === 'advanced') {
          // Match if course level contains 'advanced' (e.g., 'intermediate-advanced')
          levelMatches = courseLevel.includes('advanced');
        }

        if (!levelMatches) {
          return false;
        }
      }

      // Price range filter (all courses are $99, but we'll support the filter anyway)
      if (learnFilters.priceRange !== 'all') {
        const price = 99; // All courses are $99 in USD
        const priceInCurrency = convertCurrency(price, currency);

        switch (learnFilters.priceRange) {
          case 'under-50':
            if (priceInCurrency >= thresholds.under) return false;
            break;
          case '50-100':
            if (priceInCurrency < thresholds.low || priceInCurrency > thresholds.mid) return false;
            break;
          case '100-200':
            if (priceInCurrency < thresholds.mid || priceInCurrency > thresholds.high) return false;
            break;
          case 'over-200':
            if (priceInCurrency <= thresholds.high) return false;
            break;
          default:
            break;
        }
      }

      return true;
    });
  };

  // Filter Create services
  const getFilteredCreateServices = () => {
    if (!selectedCreateCategory) return [];

    const services = createServices[selectedCreateCategory] || [];
    const thresholds = getPriceThresholds();

    return services.filter(service => {
      // Price range filter
      if (createFilters.priceRange !== 'all') {
        const priceUSD = parsePrice(service.price); // Price is in USD
        const priceInCurrency = convertCurrency(priceUSD, currency);

        switch (createFilters.priceRange) {
          case 'under-50':
            if (priceInCurrency >= thresholds.under) return false;
            break;
          case '50-100':
            if (priceInCurrency < thresholds.low || priceInCurrency > thresholds.mid) return false;
            break;
          case '100-200':
            if (priceInCurrency < thresholds.mid || priceInCurrency > thresholds.high) return false;
            break;
          case 'over-200':
            if (priceInCurrency <= thresholds.high) return false;
            break;
          default:
            break;
        }
      }

      return true;
    });
  };

  // Reset filters
  const resetLearnFilters = () => {
    setLearnFilters({ level: 'all', priceRange: 'all' });
  };

  const resetCreateFilters = () => {
    setCreateFilters({ priceRange: 'all' });
  };

  // Toggle theme between dark and light
  const toggleTheme = () => {
    setThemeMode(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowAccountPage(false);
    setShowLoginInHeader(true);
    setUserEmail('');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.setItem('showLoginInHeader', 'true');
    // Reset color theme to default on logout
    setColorTheme('default');
    localStorage.setItem('colorTheme', 'default');
  };

  // Callback to refresh avatar after profile update
  const handleProfileUpdate = async () => {
    if (userEmail) {
      try {
        const profileResponse = await fetch(`http://localhost:4000/api/user/${encodeURIComponent(userEmail)}`);
        const profileData = await profileResponse.json();
        if (profileData.success && profileData.user) {
          setUserAvatar(profileData.user.avatar_url || null);
        }
      } catch (err) {
        console.error('Error fetching updated profile:', err);
      }
    }
  };

  const location = useLocation();
  const navigate = useNavigate();

  // Don't show header on account/bookmarks/details/order pages
  const showHeader = !location.pathname.startsWith('/account') &&
    !location.pathname.startsWith('/bookmarks') &&
    !location.pathname.startsWith('/details') &&
    !location.pathname.startsWith('/order');

  return (
    <Routes>
      <Route path="/details/:type/:id" element={
        <DetailsPage
          isLoggedIn={isLoggedIn}
          bookmarkedCourses={bookmarkedCourses}
          onToggleBookmark={toggleBookmark}
          userOptimalCourse={userOptimalCourse}
          userEmail={userEmail}
        />
      } />
      <Route path="/order/:serviceId" element={
        <OrderPage
          userEmail={userEmail}
          isLoggedIn={isLoggedIn}
          orderType="service"
        />
      } />
      <Route path="/order/course/:courseId" element={
        <OrderPage
          userEmail={userEmail}
          isLoggedIn={isLoggedIn}
          orderType="course"
        />
      } />
      <Route path="/account" element={
        <AccountPage
          userEmail={userEmail}
          onBack={() => navigate('/')}
          onLogout={() => {
            handleLogout();
            setUserAvatar(null);
            navigate('/');
          }}
          onProfileUpdate={handleProfileUpdate}
          colorTheme={colorTheme}
          setColorTheme={setColorTheme}
        />
      } />
      <Route path="/bookmarks" element={
        <BookmarksPage
          bookmarkedCourses={bookmarkedCourses}
          learnServices={learnServices}
          onClose={() => navigate('/')}
          onToggleBookmark={toggleBookmark}
        />
      } />
      <Route path="*" element={
        <div className="moodychimp">
          {showHeader && (
            <header className="mc-header">
              <div className="header-logo-container">
                <div className="logo">MoodyChimp</div>
              </div>
              <nav className="mc-nav">
                {showLoginInHeader && (
                  <a href="#" onClick={(e) => { e.preventDefault(); setShowLoginModal(true); }}>
                    {t('header.login')}
                  </a>
                )}
                <a href="#about">{t('header.about')}</a>
                <a href="#contact">{t('header.contact')}</a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer">
                  {t('header.instagram')}
                </a>
                <button
                  className="preferences-toggle-btn"
                  onClick={() => setShowPreferencesModal(true)}
                  aria-label="Change preferences"
                  title="Language & Currency"
                >
                  🌐
                </button>
                <button
                  className="theme-toggle-btn"
                  onClick={toggleTheme}
                  aria-label={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {themeMode === 'dark' ? '☀️' : '🌙'}
                </button>
                {bookmarkedCourses.length > 0 && (
                  <button
                    className="saved-stuff-btn"
                    onClick={() => navigate('/bookmarks')}
                    aria-label={t('header.savedStuff')}
                  >
                    {t('header.savedStuff')} ({bookmarkedCourses.length})
                  </button>
                )}
                <NotificationBell
                  userEmail={userEmail}
                  isLoggedIn={isLoggedIn}
                  userData={userData}
                />
                {isLoggedIn && (
                  <button
                    className="account-btn"
                    onClick={() => navigate('/account')}
                    aria-label={t('header.account')}
                  >
                    {userAvatar ? (
                      <img src={userAvatar} alt="Profile" className="header-avatar-img" />
                    ) : (
                      '🍌'
                    )}
                  </button>
                )}
              </nav>
            </header>
          )}

          <main>
            <section className="hero" id="top" ref={heroRef}>
              <div className="hero-column">
                {highlightWords.slice(0, 2).map((word) => (
                  <span key={word.text} className={`hero-word ${word.className}`}>
                    {word.text}
                  </span>
                ))}
              </div>

              <div className="hero-core">
                <p className="hero-label">{t('hero.label')}</p>
                <img
                  src={logoImage}
                  alt="MoodyChimp Logo"
                  className="hero-logo"
                />
                <h1>MoodyChimp</h1>
                <div className="hero-actions">
                  <a className="mc-button" href="#services">
                    {t('hero.services')}
                  </a>
                  <a className="mc-button ghost" href="#contact">
                    {t('hero.contact')}
                  </a>
                </div>
              </div>

              <div className="hero-column align-end">
                {highlightWords.slice(2).map((word) => (
                  <span key={word.text} className={`hero-word ${word.className}`}>
                    {word.text}
                  </span>
                ))}
              </div>

              <RecentlyViewed />
            </section>

            <section id="services" className="services">
              <h2>{t('services.title')}</h2>

              <div className="services-main-categories">
                <button
                  className={`service-category-btn ${selectedMainCategory === 'Learn' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedMainCategory('Learn');
                    setSelectedCreateCategory(null);
                  }}
                >
                  {t('services.learn')}
                </button>
                <button
                  className={`service-category-btn ${selectedMainCategory === 'Create' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedMainCategory('Create');
                    setSelectedCreateCategory(null);
                  }}
                >
                  {t('services.create')}
                </button>
              </div>

              {selectedMainCategory === 'Learn' && (
                <div className="services-content">
                  {loadingServices ? (
                    <p className="services-loading">{t('services.loading')}</p>
                  ) : learnServices.length === 0 ? (
                    <p className="services-loading">{t('services.noServices')}</p>
                  ) : (
                    <div className="learn-services-container">
                      {/* Filters Section */}
                      <div className="filters-panel">
                        <div className="filters-header">
                          <h3 className="filters-title">{t('services.filters.title')}</h3>
                          <button className="filters-reset-btn" onClick={resetLearnFilters}>
                            {t('services.filters.reset')}
                          </button>
                        </div>
                        <div className="filters-content">
                          <div className="filter-group">
                            <label className="filter-label">{t('services.filters.level')}</label>
                            <select
                              className="filter-select"
                              value={learnFilters.level}
                              onChange={(e) => setLearnFilters({ ...learnFilters, level: e.target.value })}
                            >
                              <option value="all">{t('services.filters.allLevels')}</option>
                              <option value="Beginner">{t('services.filters.beginner')}</option>
                              <option value="Intermediate">{t('services.filters.intermediate')}</option>
                              <option value="Advanced">{t('services.filters.advanced')}</option>
                            </select>
                          </div>
                          <div className="filter-group">
                            <label className="filter-label">{t('services.filters.priceRange')}</label>
                            <select
                              className="filter-select"
                              value={learnFilters.priceRange}
                              onChange={(e) => setLearnFilters({ ...learnFilters, priceRange: e.target.value })}
                            >
                              {(() => {
                                const options = getPriceFilterOptions();
                                return (
                                  <>
                                    <option value="all">{options.all}</option>
                                    <option value="under-50">{options.under50}</option>
                                    <option value="50-100">{options['50-100']}</option>
                                    <option value="100-200">{options['100-200']}</option>
                                    <option value="over-200">{options.over200}</option>
                                  </>
                                );
                              })()}
                            </select>
                          </div>
                        </div>
                        <div className="filters-results">
                          {t('services.filters.showing')} {getFilteredLearnServices().length} {t('services.filters.of')} {learnServices.length} {t('services.filters.courses')}
                        </div>
                      </div>

                      <div className="learn-services-grid">
                        {getFilteredLearnServices().map((service) => {
                          const isOptimal = userOptimalCourse &&
                            ((userOptimalCourse === 'Game Dev' && service.title === 'Game Dev') ||
                              (userOptimalCourse === 'Animation' && service.title === 'Animation') ||
                              (userOptimalCourse === 'Simplifying the human figure' && service.title === 'Simplifying the human figure'));
                          const courseId = service.id || service.title;
                          const isBookmarked = bookmarkedCourses.includes(courseId);
                          const reviews = courseReviews[service.id] || null;
                          const isHovered = hoveredCourseId === service.id;

                          return (
                            <div
                              key={courseId}
                              className="learn-service-item"
                              onClick={() => navigate(`/details/course/${courseId}`)}
                              onMouseEnter={() => setHoveredCourseId(service.id)}
                              onMouseLeave={() => setHoveredCourseId(null)}
                              style={{ cursor: 'pointer' }}
                            >
                              {/* Reviews Hover Box */}
                              {isHovered && reviews && reviews.totalReviews > 0 && (
                                <div className="course-reviews-hover">
                                  <div className="course-reviews-header">
                                    <span className="course-reviews-rating">
                                      {reviews.averageRating.toFixed(1)} ⭐
                                    </span>
                                    <span className="course-reviews-count">
                                      {reviews.totalReviews} {reviews.totalReviews === 1 ? 'review' : 'reviews'}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {isOptimal && <span className="optimal-tag">Optimal!</span>}
                              <button
                                className={`bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleBookmark(courseId);
                                }}
                                aria-label={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
                              >
                                {isBookmarked ? '❤️' : '🤍'}
                              </button>
                              <div className="learn-service-illustration">{service.illustration || service.icon}</div>
                              <div className="learn-service-content">
                                <h3 className="learn-service-title">{service.title}</h3>
                                <span className="learn-service-level">{service.level}</span>
                                <span className="learn-service-price">{formatPrice(convertCurrency(99, currency), currency, language)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="questionnaire-box" lang={language}>
                        <h3 className="questionnaire-box-title">{t('services.questionnaire.notSure')}</h3>
                        <button
                          className="questionnaire-box-button"
                          onClick={() => {
                            if (isLoggedIn) {
                              setShowQuestionnaire(true);
                            } else {
                              setShowLoginModal(true);
                            }
                          }}
                        >
                          {t('services.questionnaire.findOut')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedMainCategory === 'Create' && (
                <div className="services-content">
                  {loadingServices ? (
                    <p className="services-loading">{t('services.loading')}</p>
                  ) : (
                    <>
                      <div className="create-categories-dropdown">
                        {createCategories.map((category) => (
                          <button
                            key={category}
                            className={`create-category-btn ${selectedCreateCategory === category ? 'active' : ''}`}
                            onClick={() => setSelectedCreateCategory(category)}
                          >
                            {category}
                          </button>
                        ))}
                      </div>

                      {selectedCreateCategory && (
                        <>
                          {/* Filters Section */}
                          <div className="filters-panel">
                            <div className="filters-header">
                              <h3 className="filters-title">{t('services.filters.title')}</h3>
                              <button className="filters-reset-btn" onClick={resetCreateFilters}>
                                {t('services.filters.reset')}
                              </button>
                            </div>
                            <div className="filters-content">
                              <div className="filter-group">
                                <label className="filter-label">{t('services.filters.priceRange')}</label>
                                <select
                                  className="filter-select"
                                  value={createFilters.priceRange}
                                  onChange={(e) => setCreateFilters({ ...createFilters, priceRange: e.target.value })}
                                >
                                  {(() => {
                                    const options = getPriceFilterOptions();
                                    return (
                                      <>
                                        <option value="all">{options.all}</option>
                                        <option value="under-50">{options.under50}</option>
                                        <option value="50-100">{options['50-100']}</option>
                                        <option value="100-200">{options['100-200']}</option>
                                        <option value="over-200">{options.over200}</option>
                                      </>
                                    );
                                  })()}
                                </select>
                              </div>
                            </div>
                            <div className="filters-results">
                              {t('services.filters.showing')} {getFilteredCreateServices().length} {t('services.filters.of')} {createServices[selectedCreateCategory]?.length || 0} {t('services.filters.services')}
                            </div>
                          </div>

                          <div className="create-services-list">
                            {getFilteredCreateServices().map((service) => (
                              <div
                                key={service.id || service.title}
                                className="create-service-item"
                                onClick={() => {
                                  // Track recently viewed for create services
                                  let thumbnail = service.details?.banner_image_url || null;
                                  if (!thumbnail || (typeof thumbnail === 'string' && thumbnail.trim() === '')) {
                                    thumbnail = null;
                                  }
                                  trackRecentlyViewed({
                                    id: service.id,
                                    type: 'service',
                                    title: service.title,
                                    thumbnail: thumbnail,
                                    isCreateService: true
                                  });

                                  if (isLoggedIn) {
                                    navigate(`/order/${service.id}`);
                                  } else {
                                    setPendingOrderServiceId(service.id);
                                    setShowLoginModal(true);
                                  }
                                }}
                                style={{ cursor: 'pointer' }}
                              >
                                <div className="create-service-header">
                                  <h3 className="create-service-title">{service.title}</h3>
                                  <span className="create-service-price">{convertAndFormatPrice(service.price, currency, language)}</span>
                                </div>
                                <p className="create-service-description">{service.description}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </section>

            <section id="about" className="about">
              <h2>{t('about.title')}</h2>
              <p>
                {t('about.description')}
              </p>
            </section>
          </main>

          <footer id="contact" className="mc-footer">
            <div>
              <p className="footer-label">{t('footer.email')}</p>
              <a href="mailto:hello@moodychimp.studio">hello@moodychimp.studio</a>
            </div>
            <div>
              <p className="footer-label">{t('footer.phone')}</p>
              <p>+44 20 1234 5678</p>
            </div>
            <div>
              <p className="footer-label">{t('footer.instagram')}</p>
              <a href="https://instagram.com" target="_blank" rel="noreferrer">
                instagram.com/MoodyChimp
              </a>
            </div>
          </footer>

          <LoginModal
            isOpen={showLoginModal}
            onClose={() => {
              setShowLoginModal(false);
              setPendingOrderServiceId(null);
              localStorage.setItem('hasVisited', 'true');
            }}
            onMaybeLater={() => {
              setShowLoginModal(false);
              setPendingOrderServiceId(null);
              setShowLoginInHeader(true);
              localStorage.setItem('hasVisited', 'true');
              localStorage.setItem('showLoginInHeader', 'true');
            }}
            onLoginSuccess={async (email) => {
              setIsLoggedIn(true);
              setShowLoginInHeader(false);
              setUserEmail(email);
              localStorage.setItem('isLoggedIn', 'true');
              localStorage.setItem('hasVisited', 'true');
              localStorage.setItem('userEmail', email);
              localStorage.removeItem('showLoginInHeader');

              // Fetch user's preferred color theme from database
              try {
                const profileResponse = await fetch(`http://localhost:4000/api/user/${encodeURIComponent(email)}`);
                const profileData = await profileResponse.json();
                if (profileData.success && profileData.user) {
                  setUserData(profileData.user); // Store user data for notifications
                  if (profileData.user.color_theme) {
                    setColorTheme(profileData.user.color_theme);
                    localStorage.setItem('colorTheme', profileData.user.color_theme);
                  }
                }
              } catch (err) {
                console.error('Error fetching user theme:', err);
              }

              // If user was trying to order a service, redirect to order page
              if (pendingOrderServiceId) {
                navigate(`/order/${pendingOrderServiceId}`);
                setPendingOrderServiceId(null);
              }
            }}
          />


          {showQuestionnaire && (
            <Questionnaire
              userEmail={userEmail || 'guest'}
              onComplete={(course) => {
                setOptimalCourse(course);
                setUserOptimalCourse(course);
                setShowQuestionnaire(false);
                setShowQuestionnaireResult(true);
              }}
              onClose={() => setShowQuestionnaire(false)}
            />
          )}

          {showQuestionnaireResult && optimalCourse && (
            <QuestionnaireResult
              optimalCourse={optimalCourse}
              onClose={() => {
                setShowQuestionnaireResult(false);
                // Refresh to show optimal tag
                window.location.reload();
              }}
            />
          )}

          <PreferencesModal
            isOpen={showPreferencesModal}
            onClose={() => setShowPreferencesModal(false)}
          />
          <BananaGame />
        </div>
      } />
    </Routes>
  );
}


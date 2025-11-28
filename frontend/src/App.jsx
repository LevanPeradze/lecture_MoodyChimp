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

const highlightWords = [
  { text: 'creative', className: 'word-brutal' },
  { text: 'technical', className: 'word-tech' },
  { text: 'innovational', className: 'word-serif' },
  { text: 'smart', className: 'word-script' },
];

export default function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);
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
        // Apply theme immediately to prevent flicker
        document.body.className = savedTheme === 'light' ? 'light-mode' : 'dark-mode';
        return savedTheme;
      }
    }
    // Default to dark mode if nothing is saved
    return 'dark';
  });
  const heroRef = useRef(null);

  // Apply theme class to body whenever theme changes and save to LocalStorage
  useEffect(() => {
    document.body.className = themeMode === 'light' ? 'light-mode' : 'dark-mode';
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

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

          // Fetch user profile (for avatar)
          const profileResponse = await fetch(`http://localhost:4000/api/user/${encodeURIComponent(userEmail)}`);
          const profileData = await profileResponse.json();
          if (profileData.success && profileData.user) {
            setUserAvatar(profileData.user.avatar_url || null);
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

  // Filter Learn services
  const getFilteredLearnServices = () => {
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
        const price = 99; // All courses are $99
        switch (learnFilters.priceRange) {
          case 'under-50':
            if (price >= 50) return false;
            break;
          case '50-100':
            if (price < 50 || price > 100) return false;
            break;
          case '100-200':
            if (price < 100 || price > 200) return false;
            break;
          case 'over-200':
            if (price <= 200) return false;
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
    return services.filter(service => {
      // Price range filter
      if (createFilters.priceRange !== 'all') {
        const price = parsePrice(service.price);
        switch (createFilters.priceRange) {
          case 'under-50':
            if (price >= 50) return false;
            break;
          case '50-100':
            if (price < 50 || price > 100) return false;
            break;
          case '100-200':
            if (price < 100 || price > 200) return false;
            break;
          case 'over-200':
            if (price <= 200) return false;
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
                    Log in
                  </a>
                )}
                <a href="#about">About us</a>
                <a href="#contact">Contact</a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer">
                  Instagram
                </a>
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
                    aria-label="Saved Stuff"
                  >
                    Saved Stuff ({bookmarkedCourses.length})
                  </button>
                )}
                {isLoggedIn && (
                  <button
                    className="account-btn"
                    onClick={() => navigate('/account')}
                    aria-label="Account"
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
                <p className="hero-label">creative studio / global</p>
                <img
                  src={logoImage}
                  alt="MoodyChimp Logo"
                  className="hero-logo"
                />
                <h1>MoodyChimp</h1>
                <div className="hero-actions">
                  <a className="mc-button" href="#services">
                    Services
                  </a>
                  <a className="mc-button ghost" href="#contact">
                    Contact
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
            </section>

            <section id="services" className="services">
              <h2>Services</h2>

              <div className="services-main-categories">
                <button
                  className={`service-category-btn ${selectedMainCategory === 'Learn' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedMainCategory('Learn');
                    setSelectedCreateCategory(null);
                  }}
                >
                  Learn
                </button>
                <button
                  className={`service-category-btn ${selectedMainCategory === 'Create' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedMainCategory('Create');
                    setSelectedCreateCategory(null);
                  }}
                >
                  Create
                </button>
              </div>

              {selectedMainCategory === 'Learn' && (
                <div className="services-content">
                  {loadingServices ? (
                    <p className="services-loading">Loading services...</p>
                  ) : learnServices.length === 0 ? (
                    <p className="services-loading">No services available.</p>
                  ) : (
                    <div className="learn-services-container">
                      {/* Filters Section */}
                      <div className="filters-panel">
                        <div className="filters-header">
                          <h3 className="filters-title">Filters</h3>
                          <button className="filters-reset-btn" onClick={resetLearnFilters}>
                            Reset
                          </button>
                        </div>
                        <div className="filters-content">
                          <div className="filter-group">
                            <label className="filter-label">Level</label>
                            <select
                              className="filter-select"
                              value={learnFilters.level}
                              onChange={(e) => setLearnFilters({ ...learnFilters, level: e.target.value })}
                            >
                              <option value="all">All Levels</option>
                              <option value="Beginner">Beginner</option>
                              <option value="Intermediate">Intermediate</option>
                              <option value="Advanced">Advanced</option>
                            </select>
                          </div>
                          <div className="filter-group">
                            <label className="filter-label">Price Range</label>
                            <select
                              className="filter-select"
                              value={learnFilters.priceRange}
                              onChange={(e) => setLearnFilters({ ...learnFilters, priceRange: e.target.value })}
                            >
                              <option value="all">All Prices</option>
                              <option value="under-50">Under $50</option>
                              <option value="50-100">$50 - $100</option>
                              <option value="100-200">$100 - $200</option>
                              <option value="over-200">Over $200</option>
                            </select>
                          </div>
                        </div>
                        <div className="filters-results">
                          Showing {getFilteredLearnServices().length} of {learnServices.length} courses
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
                                <span className="learn-service-price">$99</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="questionnaire-box">
                        <h3 className="questionnaire-box-title">not sure?</h3>
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
                          find out!
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedMainCategory === 'Create' && (
                <div className="services-content">
                  {loadingServices ? (
                    <p className="services-loading">Loading services...</p>
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
                              <h3 className="filters-title">Filters</h3>
                              <button className="filters-reset-btn" onClick={resetCreateFilters}>
                                Reset
                              </button>
                            </div>
                            <div className="filters-content">
                              <div className="filter-group">
                                <label className="filter-label">Price Range</label>
                                <select
                                  className="filter-select"
                                  value={createFilters.priceRange}
                                  onChange={(e) => setCreateFilters({ ...createFilters, priceRange: e.target.value })}
                                >
                                  <option value="all">All Prices</option>
                                  <option value="under-50">Under $50</option>
                                  <option value="50-100">$50 - $100</option>
                                  <option value="100-200">$100 - $200</option>
                                  <option value="over-200">Over $200</option>
                                </select>
                              </div>
                            </div>
                            <div className="filters-results">
                              Showing {getFilteredCreateServices().length} of {createServices[selectedCreateCategory]?.length || 0} services
                            </div>
                          </div>

                          <div className="create-services-list">
                            {getFilteredCreateServices().map((service) => (
                              <div
                                key={service.id || service.title}
                                className="create-service-item"
                                onClick={() => {
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
                                  <span className="create-service-price">{service.price}</span>
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
              <h2>About us</h2>
              <p>
                MoodyChimp is a creative studio powered by two generalists who love mixing code, cameras, and sketchbooks. We ship focused experiences, keep documentation tight, and leave room for playful discovery.
              </p>
            </section>
          </main>

          <footer id="contact" className="mc-footer">
            <div>
              <p className="footer-label">Email</p>
              <a href="mailto:hello@moodychimp.studio">hello@moodychimp.studio</a>
            </div>
            <div>
              <p className="footer-label">Phone</p>
              <p>+44 20 1234 5678</p>
            </div>
            <div>
              <p className="footer-label">Instagram</p>
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
            onLoginSuccess={(email) => {
              setIsLoggedIn(true);
              setShowLoginInHeader(false);
              setUserEmail(email);
              localStorage.setItem('isLoggedIn', 'true');
              localStorage.setItem('hasVisited', 'true');
              localStorage.setItem('userEmail', email);
              localStorage.removeItem('showLoginInHeader');

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
        </div>
      } />
    </Routes>
  );
}


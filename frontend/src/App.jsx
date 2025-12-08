import { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  DndContext, 
  DragOverlay, 
  useSensor, 
  useSensors, 
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  useDroppable
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import logoImage from './assets/logo.png';
import LoginModal from './LoginModal';
import AccountPage from './AccountPage';
import AdminPanel from './AdminPanel';
import Questionnaire from './Questionnaire';
import QuestionnaireResult from './QuestionnaireResult';
import BookmarksPage from './BookmarksPage';
import DetailsPage from './DetailsPage';
import OrderPage from './OrderPage';
import PreferencesModal from './PreferencesModal';
import BananaGame from './BananaGame';
import NotificationBell from './NotificationBell';
import RecentlyViewed from './RecentlyViewed';
import Sidebar from './Sidebar';
import DraggableServicesTitle from './DraggableServicesTitle';
import HeaderDropZone from './HeaderDropZone';
import ServicesDropTarget from './ServicesDropTarget';
import { trackRecentlyViewed } from './DetailsPage';
import './DraggableServicesTitle.css';
import { useI18n } from './i18n/index.jsx';
import { convertAndFormatPrice, formatPrice, convertCurrency, parsePrice } from './i18n/currency';
import { checkAchievements } from './achievements';
import { useWaveAnimation } from './hooks/useWaveAnimation';
import WaveAnimatedElement from './components/WaveAnimatedElement';
import { getApiUrl } from './config';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Drag and Drop states
  const [servicesInHeader, setServicesInHeader] = useState(() => {
    // Load from localStorage on mount
    try {
      return localStorage.getItem('moodychimp_services_in_header') === 'true';
    } catch (error) {
      console.error('Failed to load services header state:', error);
      return false;
    }
  });
  const [draggedServicePosition, setDraggedServicePosition] = useState(() => {
    try {
      const position = localStorage.getItem('moodychimp_services_position');
      return position ? parseInt(position) : null;
    } catch (error) {
      return null;
    }
  });
  const [isDragging, setIsDragging] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [activeDropZone, setActiveDropZone] = useState(null);

  // Wave animation hook
  const { waveTriggered, triggerWave, getPushAnimation, cancelWave } = useWaveAnimation();

  // DnD Kit sensors setup
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts (prevents accidental drags)
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms delay for touch to distinguish from tap
        tolerance: 5, // 5px tolerance for touch movement
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter states
  const [learnFilters, setLearnFilters] = useState(() => {
    const saved = localStorage.getItem('lastLearnFiltersUsed');
    return saved ? JSON.parse(saved) : { level: 'all', priceRange: 'all' };
  });
  const [createFilters, setCreateFilters] = useState(() => {
    const saved = localStorage.getItem('lastCreateFiltersUsed');
    return saved ? JSON.parse(saved) : { priceRange: 'all' };
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isServicesSectionVisible, setIsServicesSectionVisible] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchBarTimeoutRef = useRef(null);
  const servicesSectionRef = useRef(null);
  const lastScrollY = useRef(0);

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

  const location = useLocation();
  const navigate = useNavigate();

  // Don't show header on account/bookmarks/details/order/admin pages
  const showHeader = !location.pathname.startsWith('/account') &&
    !location.pathname.startsWith('/bookmarks') &&
    !location.pathname.startsWith('/details') &&
    !location.pathname.startsWith('/order') &&
    !location.pathname.startsWith('/admin');

  // Track scroll direction and services section visibility for smooth search bar animation
  useEffect(() => {
    if (!showHeader) {
      setIsSearchExpanded(false);
      setIsServicesSectionVisible(false);
      return;
    }

    const handleScroll = () => {
      if (!servicesSectionRef.current || !heroRef.current) return;

      const currentScrollY = window.scrollY;
      const servicesRect = servicesSectionRef.current.getBoundingClientRect();
      const heroRect = heroRef.current.getBoundingClientRect();

      // Check if services section is in viewport
      const servicesInView = servicesRect.top < window.innerHeight && servicesRect.bottom > 0;

      // Check if we've scrolled past the hero section (entering services)
      const pastHero = heroRect.bottom < window.innerHeight * 0.5;

      // Check if we've scrolled back up past services (returning to hero)
      const pastServices = servicesRect.bottom < 0;

      // Determine scroll direction
      const scrollingDown = currentScrollY > lastScrollY.current;
      const scrollingUp = currentScrollY < lastScrollY.current;

      lastScrollY.current = currentScrollY;

      // Expand search bar when scrolling down into services section
      if (servicesInView && pastHero && scrollingDown) {
        // Clear any pending hide timeout
        if (searchBarTimeoutRef.current) {
          clearTimeout(searchBarTimeoutRef.current);
          searchBarTimeoutRef.current = null;
        }
        setIsServicesSectionVisible(true);
        // Small delay to ensure smooth animation start from 0 width
        requestAnimationFrame(() => {
          setIsSearchExpanded(true);
        });
      }
      // Collapse search bar when scrolling up past services section
      else if ((pastServices || !servicesInView) && scrollingUp) {
        setIsSearchExpanded(false);
        // Hide completely after animation completes
        if (searchBarTimeoutRef.current) {
          clearTimeout(searchBarTimeoutRef.current);
        }
        searchBarTimeoutRef.current = setTimeout(() => {
          setIsServicesSectionVisible(false);
          searchBarTimeoutRef.current = null;
        }, 750); // Slightly longer than animation duration
      }
      // Also handle case when services section is already visible on load
      else if (servicesInView && pastHero && !isServicesSectionVisible) {
        setIsServicesSectionVisible(true);
        // Delay to prevent snappy appearance - start from 0
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsSearchExpanded(true);
          });
        });
      }
    };

    // Initial check
    handleScroll();

    // Throttle scroll events for better performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledScroll);
      if (searchBarTimeoutRef.current) {
        clearTimeout(searchBarTimeoutRef.current);
      }
    };
  }, [showHeader, location.pathname, isSearchExpanded, isServicesSectionVisible]);

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
        try {
          const learnResponse = await fetch(getApiUrl('api/course-services'));
          if (learnResponse.ok) {
            const learnData = await learnResponse.json();
            if (learnData.success && Array.isArray(learnData.services)) {
              setLearnServices(learnData.services);
            } else {
              console.error('Failed to fetch Learn services:', learnData);
              setLearnServices([]); // Set empty array on failure
            }
          } else {
            console.error('Failed to fetch Learn services: HTTP', learnResponse.status);
            setLearnServices([]); // Set empty array on failure
          }
        } catch (learnErr) {
          console.error('Error fetching Learn services:', learnErr);
          setLearnServices([]); // Set empty array on error
        }

        // Fetch all Create services
        try {
          const createResponse = await fetch(getApiUrl('api/services'));
          if (createResponse.ok) {
            const createData = await createResponse.json();
            if (createData.success && Array.isArray(createData.services)) {
              // Organize Create services by category
              const organized = {};
              const categories = new Set();

              createData.services.forEach(service => {
                if (service && service.category && service.title) {
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
                }
              });

              setCreateServices(organized);
              setCreateCategories(Array.from(categories).sort());
            } else {
              console.error('Failed to fetch Create services:', createData);
              setCreateServices({}); // Set empty object on failure
            }
          } else {
            console.error('Failed to fetch Create services: HTTP', createResponse.status);
            setCreateServices({}); // Set empty object on failure
          }
        } catch (createErr) {
          console.error('Error fetching Create services:', createErr);
          setCreateServices({}); // Set empty object on error
        }
      } catch (err) {
        console.error('Error fetching services:', err);
        // Ensure empty states are set
        setLearnServices([]);
        setCreateServices({});
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
          const response = await fetch(getApiUrl(`api/reviews/course/${course.id}`));
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
          const optimalResponse = await fetch(getApiUrl(`api/user-optimal/${encodeURIComponent(userEmail)}`));
          const optimalData = await optimalResponse.json();
          if (optimalData.success && optimalData.optimalCourse) {
            setUserOptimalCourse(optimalData.optimalCourse);
          }

          // Fetch user profile (for avatar and color theme)
          const profileResponse = await fetch(getApiUrl(`api/user/${encodeURIComponent(userEmail)}`));
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

  // Load bookmarked courses from database when user logs in, fallback to localStorage
  useEffect(() => {
    const loadBookmarks = async () => {
      if (userEmail) {
        // Load from database
        try {
          const response = await fetch(getApiUrl(`api/bookmarks/${encodeURIComponent(userEmail)}`));
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.bookmarks) {
              setBookmarkedCourses(data.bookmarks);
              // Also save to localStorage as backup
              localStorage.setItem('bookmarkedCourses', JSON.stringify(data.bookmarks));
              return;
            }
          }
        } catch (err) {
          console.error('Error loading bookmarks from database:', err);
        }
      }

      // Fallback to localStorage if not logged in or database fetch failed
    const saved = localStorage.getItem('bookmarkedCourses');
    if (saved) {
      try {
        setBookmarkedCourses(JSON.parse(saved));
      } catch (err) {
          console.error('Error loading bookmarked courses from localStorage:', err);
      }
    }
    };

    loadBookmarks();
  }, [userEmail]);

  // Save bookmarked courses to LocalStorage whenever it changes (as backup)
  useEffect(() => {
    localStorage.setItem('bookmarkedCourses', JSON.stringify(bookmarkedCourses));
  }, [bookmarkedCourses]);

  // Toggle bookmark for a course
  const toggleBookmark = async (courseId) => {
    const isAdding = !bookmarkedCourses.includes(courseId);

    // Update local state immediately for responsive UI
    setBookmarkedCourses(prev => {
      return isAdding
        ? [...prev, courseId]
        : prev.filter(id => id !== courseId);
    });

    // Sync with database if user is logged in
    if (userEmail) {
      try {
        if (isAdding) {
          // Add bookmark to database
          await fetch(getApiUrl('api/bookmarks'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userEmail,
              courseId: parseInt(courseId, 10)
            }),
          });

          // Get updated count from database for achievement checking
          const countResponse = await fetch(getApiUrl(`api/bookmarks/${encodeURIComponent(userEmail)}/count`));
          if (countResponse.ok) {
            const countData = await countResponse.json();
            const bookmarkCount = countData.count || 0;

            // Check achievements with database count
            checkAchievements(userEmail, 'bookmark', { count: bookmarkCount }).then(achievementNotifications => {
              if (achievementNotifications.length > 0) {
                // Add achievement notifications to notification system
                const existingNotifications = JSON.parse(localStorage.getItem('chimpNotifications') || '[]');
                const updatedNotifications = [...existingNotifications, ...achievementNotifications];
                localStorage.setItem('chimpNotifications', JSON.stringify(updatedNotifications));
                // Trigger a custom event to notify NotificationBell
                window.dispatchEvent(new CustomEvent('achievementsUpdated'));
              }
            });

            // Also check for bookmark-count trigger (for three-bookmarks achievement)
            checkAchievements(userEmail, 'bookmark-count', { count: bookmarkCount }).then(achievementNotifications => {
              if (achievementNotifications.length > 0) {
                const existingNotifications = JSON.parse(localStorage.getItem('chimpNotifications') || '[]');
                const updatedNotifications = [...existingNotifications, ...achievementNotifications];
                localStorage.setItem('chimpNotifications', JSON.stringify(updatedNotifications));
                window.dispatchEvent(new CustomEvent('achievementsUpdated'));
              }
            });
          }
      } else {
          // Remove bookmark from database
          await fetch(getApiUrl(`api/bookmarks/${encodeURIComponent(userEmail)}/${courseId}`), {
            method: 'DELETE',
          });
        }
      } catch (err) {
        console.error('Error syncing bookmark with database:', err);
        // Revert local state on error
        setBookmarkedCourses(prev => {
          return isAdding
            ? prev.filter(id => id !== courseId)
            : [...prev, courseId];
        });
      }
    } else {
      // If not logged in, check achievements with local count (fallback)
      if (isAdding) {
        const newBookmarks = [...bookmarkedCourses, courseId];
        checkAchievements(userEmail, 'bookmark', { count: newBookmarks.length }).then(achievementNotifications => {
          if (achievementNotifications.length > 0) {
            const existingNotifications = JSON.parse(localStorage.getItem('chimpNotifications') || '[]');
            const updatedNotifications = [...existingNotifications, ...achievementNotifications];
            localStorage.setItem('chimpNotifications', JSON.stringify(updatedNotifications));
            window.dispatchEvent(new CustomEvent('achievementsUpdated'));
          }
        });
      }
    }
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

  // Search function - searches in title, description, category, and level
  const matchesSearch = (item, query) => {
    if (!query || query.trim() === '') return true;
    const searchTerm = query.toLowerCase().trim();
    const title = (item.title || '').toLowerCase();
    const description = (item.description || '').toLowerCase();
    const category = (item.category || '').toLowerCase();
    const level = (item.level || '').toLowerCase();

    // Also check details if available (for services)
    const detailsDescription = (item.details?.description || '').toLowerCase();

    return title.includes(searchTerm) ||
      description.includes(searchTerm) ||
      category.includes(searchTerm) ||
      level.includes(searchTerm) ||
      detailsDescription.includes(searchTerm);
  };

  // Check if search results exist in Learn section
  const getSearchResultsInLearn = () => {
    if (!searchQuery || searchQuery.trim() === '') return [];
    return learnServices.filter(service => matchesSearch(service, searchQuery));
  };

  // Check if search results exist in Create section
  const getSearchResultsInCreate = () => {
    if (!searchQuery || searchQuery.trim() === '') return [];
    const allCreateServices = Object.values(createServices).flat();
    return allCreateServices.filter(service => matchesSearch(service, searchQuery));
  };

  // Auto-switch section if search result is in different section
  useEffect(() => {
    if (!searchQuery || searchQuery.trim() === '') return;

    const learnResults = getSearchResultsInLearn();
    const createResults = getSearchResultsInCreate();

    // If user is on Learn but search only finds Create results, switch to Create
    if (selectedMainCategory === 'Learn' && learnResults.length === 0 && createResults.length > 0) {
      setSelectedMainCategory('Create');
      // Find the category of the first result
      const firstResult = createResults[0];
      const resultCategory = Object.keys(createServices).find(cat =>
        createServices[cat].some(s => s.id === firstResult.id || s.title === firstResult.title)
      );
      if (resultCategory) {
        setSelectedCreateCategory(resultCategory);
      }
      // Scroll to services section if not visible
      if (servicesSectionRef.current && !isServicesSectionVisible) {
        servicesSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    // If user is on Create but search only finds Learn results, switch to Learn
    else if (selectedMainCategory === 'Create' && createResults.length === 0 && learnResults.length > 0) {
      setSelectedMainCategory('Learn');
      setSelectedCreateCategory(null);
      // Scroll to services section if not visible
      if (servicesSectionRef.current && !isServicesSectionVisible) {
        servicesSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [searchQuery, selectedMainCategory, learnServices, createServices]);

  const handleServiceClick = (service) => {
    if (service.type === 'course') {
      navigate(`/details/course/${service.id}`);
    } else {
      navigate(`/order/${service.id}`);
    }
  };

  // Handle Enter key in search - redirect if single result
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const learnResults = getSearchResultsInLearn();
      const createResults = getSearchResultsInCreate();
      const allResults = [...learnResults, ...createResults];

      if (allResults.length === 1) {
        const result = allResults[0];
        // Determine if it's a course or service
        const isCourse = learnResults.length === 1;
        const itemId = result.id || result.title;

        if (isCourse) {
          navigate(`/details/course/${itemId}`);
        } else {
          // Create services go directly to order page
          if (isLoggedIn) {
            navigate(`/order/${itemId}`);
          } else {
            setPendingOrderServiceId(itemId);
            setShowLoginModal(true);
          }
        }
        setSearchQuery(''); // Clear search after navigation
      }
    }
  };

  // Filter Learn services
  const getFilteredLearnServices = () => {
    const thresholds = getPriceThresholds();

    return learnServices.filter(service => {
      // Apply search filter first
      if (!matchesSearch(service, searchQuery)) {
        return false;
      }
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
      // Apply search filter first
      if (!matchesSearch(service, searchQuery)) {
        return false;
      }
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
    setSearchQuery(''); // Also clear search when resetting filters
  };

  const resetCreateFilters = () => {
    setCreateFilters({ priceRange: 'all' });
    setSearchQuery(''); // Also clear search when resetting filters
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
        const profileResponse = await fetch(getApiUrl(`api/user/${encodeURIComponent(userEmail)}`));
        const profileData = await profileResponse.json();
        if (profileData.success && profileData.user) {
          setUserAvatar(profileData.user.avatar_url || null);
        }
      } catch (err) {
        console.error('Error fetching updated profile:', err);
      }
    }
  };

  // Drag and Drop handlers
  const handleDragStart = useCallback((event) => {
    try {
      // Cancel wave animation if active (user started dragging quickly)
      cancelWave();
      
      setIsDragging(true);
      setActiveId(event.active.id);
      setActiveDropZone(null);
    } catch (error) {
      console.error('Drag start error:', error);
      setIsDragging(false);
    }
  }, [cancelWave]);

  const handleDragOver = useCallback((event) => {
    const { over } = event;
    if (over && over.id && over.id.startsWith('header-drop-')) {
      setActiveDropZone(over.id);
    } else {
      setActiveDropZone(null);
    }
  }, []);

  const handleDragEnd = useCallback((event) => {
    try {
      const { over, active } = event;
      const isFromHeader = active.id === 'services-section-header';
      
      // Check if dropping in a header drop zone
      if (over && over.id && over.id.startsWith('header-drop-')) {
        // Extract position from drop zone ID (e.g., "header-drop-0" -> 0)
        const position = parseInt(over.id.replace('header-drop-', ''));
        
        if (!isNaN(position)) {
          // Dropping in header (either from services section or reordering within header)
          setServicesInHeader(true);
          setDraggedServicePosition(position);
          
          // Save to localStorage
          try {
            localStorage.setItem('moodychimp_services_in_header', 'true');
            localStorage.setItem('moodychimp_services_position', position.toString());
          } catch (error) {
            if (error.name === 'QuotaExceededError') {
              console.warn('LocalStorage quota exceeded');
            } else {
              console.error('Failed to save drag state:', error);
            }
          }
        }
      } else if (over && over.id === 'services-section-drop' && isFromHeader) {
        // Dropping from header back to services section
        setServicesInHeader(false);
        setDraggedServicePosition(null);
        
        // Clear localStorage
        try {
          localStorage.setItem('moodychimp_services_in_header', 'false');
          localStorage.removeItem('moodychimp_services_position');
        } catch (error) {
          console.error('Failed to clear drag state:', error);
        }
        
        // Scroll to services section
        if (servicesSectionRef.current) {
          setTimeout(() => {
            servicesSectionRef.current?.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }, 100);
        }
      }
      
      setIsDragging(false);
      setActiveId(null);
      setActiveDropZone(null);
    } catch (error) {
      console.error('Drag end error:', error);
      setIsDragging(false);
      setActiveId(null);
      setActiveDropZone(null);
    }
  }, []);

  const handleDragCancel = useCallback(() => {
    setIsDragging(false);
    setActiveId(null);
    setActiveDropZone(null);
  }, []);

  const handleReturnToDefault = useCallback(() => {
    try {
      setServicesInHeader(false);
      setDraggedServicePosition(null);
      
      // Clear localStorage
      try {
        localStorage.setItem('moodychimp_services_in_header', 'false');
        localStorage.removeItem('moodychimp_services_position');
      } catch (error) {
        console.error('Failed to clear drag state:', error);
      }
      
      // Scroll to services section
      if (servicesSectionRef.current) {
        servicesSectionRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    } catch (error) {
      console.error('Failed to return services to default:', error);
    }
  }, []);

  // Navigate to services section with category pre-selected
  const handleNavigateToServices = useCallback((category) => {
    if (servicesInHeader) {
      // Scroll to services section
      if (servicesSectionRef.current) {
        servicesSectionRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
      // Set category after scroll
      setTimeout(() => {
        setSelectedMainCategory(category);
        if (category === 'Create') {
          setSelectedCreateCategory(null);
        }
      }, 300);
    } else {
      // Already in services section
      setSelectedMainCategory(category);
      if (category === 'Create') {
        setSelectedCreateCategory(null);
      }
    }
  }, [servicesInHeader]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
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
      <Route path="/admin" element={
        <AdminPanel
          userEmail={userEmail}
          onBack={() => navigate('/account')}
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
          <div className="aria-live-region" aria-live="polite" aria-atomic="true" style={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }}></div>
          {showHeader && (
            <header className="mc-header">
              <button
                className={`hamburger-btn ${sidebarOpen ? 'active' : ''}`}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle sidebar"
              >
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
              </button>
              <div className="header-logo-container">
                <div className="logo">MoodyChimp</div>
              </div>
              <nav className="mc-nav">
                {showLoginInHeader && (
                  <a href="#" onClick={(e) => { e.preventDefault(); setShowLoginModal(true); }}>
                    {t('header.login')}
                  </a>
                )}
                
                {/* Drop zone 0: Left of About Us */}
                <HeaderDropZone 
                  id={0}
                  position={0}
                  isOver={activeDropZone === 'header-drop-0'}
                />
                
                {/* Services at position 0 (left of About Us) */}
                {servicesInHeader && draggedServicePosition === 0 && (
                  <DraggableServicesTitle
                    isInHeader={true}
                    learnServices={learnServices}
                    createServices={createServices}
                    onServiceClick={handleServiceClick}
                    onReturnToDefault={handleReturnToDefault}
                    onNavigateToServices={handleNavigateToServices}
                  >
                    Services
                  </DraggableServicesTitle>
                )}
                
                <a href="#about">{t('header.about')}</a>
                
                {/* Drop zone 1: Between About Us and Contact */}
                <HeaderDropZone 
                  id={1}
                  position={1}
                  isOver={activeDropZone === 'header-drop-1'}
                />
                
                {/* Services at position 1 (between About Us and Contact) */}
                {servicesInHeader && draggedServicePosition === 1 && (
                  <DraggableServicesTitle
                    isInHeader={true}
                    learnServices={learnServices}
                    createServices={createServices}
                    onServiceClick={handleServiceClick}
                    onReturnToDefault={handleReturnToDefault}
                    onNavigateToServices={handleNavigateToServices}
                  >
                    Services
                  </DraggableServicesTitle>
                )}
                
                <a href="#contact">{t('header.contact')}</a>
                
                {/* Drop zone 2: Between Contact and Instagram */}
                <HeaderDropZone 
                  id={2}
                  position={2}
                  isOver={activeDropZone === 'header-drop-2'}
                />
                
                {/* Services at position 2 (between Contact and Instagram) */}
                {servicesInHeader && draggedServicePosition === 2 && (
                  <DraggableServicesTitle
                    isInHeader={true}
                    learnServices={learnServices}
                    createServices={createServices}
                    onServiceClick={handleServiceClick}
                    onReturnToDefault={handleReturnToDefault}
                    onNavigateToServices={handleNavigateToServices}
                  >
                    Services
                  </DraggableServicesTitle>
                )}
                
                <a href="https://instagram.com" target="_blank" rel="noreferrer">
                  {t('header.instagram')}
                </a>
                
                {/* Drop zone 3: Right of Instagram */}
                <HeaderDropZone 
                  id={3}
                  position={3}
                  isOver={activeDropZone === 'header-drop-3'}
                />
                
                {/* Services at position 3 (right of Instagram) */}
                {servicesInHeader && draggedServicePosition === 3 && (
                  <DraggableServicesTitle
                    isInHeader={true}
                    learnServices={learnServices}
                    createServices={createServices}
                    onServiceClick={handleServiceClick}
                    onReturnToDefault={handleReturnToDefault}
                    onNavigateToServices={handleNavigateToServices}
                  >
                    Services
                  </DraggableServicesTitle>
                )}
                
                {isServicesSectionVisible && (
                  <div className={`search-container ${isSearchExpanded ? 'expanded' : 'collapsed'}`}>
                    <input
                      type="text"
                      className="search-input"
                      placeholder={t('header.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      aria-label={t('header.searchAriaLabel')}
                    />
                    <span className="search-icon">⌕</span>
                    {searchQuery && (
                      <button
                        className="search-clear-btn"
                        onClick={() => setSearchQuery('')}
                        aria-label={t('header.clearSearch')}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}
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
                <NotificationBell
                  userEmail={userEmail}
                  isLoggedIn={isLoggedIn}
                  userData={userData}
                />
                {isLoggedIn && (
                  <button
                    className="account-btn"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'instant' });
                      navigate('/account');
                    }}
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

          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            bookmarkedCoursesCount={bookmarkedCourses.length}
            isLoggedIn={isLoggedIn}
            userEmail={userEmail}
          />

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

            <section 
              id="services" 
              className="services" 
              ref={servicesSectionRef}
            >
              {/* Drop target for returning from header */}
              <ServicesDropTarget 
                servicesInHeader={servicesInHeader}
                learnServices={learnServices}
                createServices={createServices}
                onServiceClick={handleServiceClick}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                waveTriggered={waveTriggered}
                triggerWave={triggerWave}
                getPushAnimation={getPushAnimation}
                t={t}
              />

              {/* Only show services content when NOT in header */}
              {!servicesInHeader && (
              <div className="services-content-wrapper">
              <div className="services-main-categories">
                <WaveAnimatedElement
                  waveTriggered={waveTriggered}
                  getPushAnimation={getPushAnimation}
                  elementId="learn-btn"
                >
                  <button
                    className={`service-category-btn ${selectedMainCategory === 'Learn' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedMainCategory('Learn');
                      setSelectedCreateCategory(null);
                    }}
                  >
                    {t('services.learn')}
                  </button>
                </WaveAnimatedElement>
                <WaveAnimatedElement
                  waveTriggered={waveTriggered}
                  getPushAnimation={getPushAnimation}
                  elementId="create-btn"
                >
                  <button
                    className={`service-category-btn ${selectedMainCategory === 'Create' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedMainCategory('Create');
                      setSelectedCreateCategory(null);
                    }}
                  >
                    {t('services.create')}
                  </button>
                </WaveAnimatedElement>
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
                      <WaveAnimatedElement
                        waveTriggered={waveTriggered}
                        getPushAnimation={getPushAnimation}
                        elementId="filters-panel"
                      >
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
                          {searchQuery ? (
                            <>
                              {t('services.filters.showing')} {getFilteredLearnServices().length} {t('services.filters.of')} {learnServices.length} {t('services.filters.courses')} {t('services.filters.matching')} "{searchQuery}"
                            </>
                          ) : (
                            <>
                              {t('services.filters.showing')} {getFilteredLearnServices().length} {t('services.filters.of')} {learnServices.length} {t('services.filters.courses')}
                            </>
                          )}
                        </div>
                      </div>
                      </WaveAnimatedElement>

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
                            <WaveAnimatedElement
                              key={courseId}
                              waveTriggered={waveTriggered}
                              getPushAnimation={getPushAnimation}
                              elementId={`service-${courseId}`}
                            >
                              <div
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
                              {service.thumbnail_image_url ? (
                                <div className="learn-service-banner">
                                  <img 
                                    src={service.thumbnail_image_url} 
                                    alt={service.title}
                                    className="learn-service-banner-img"
                                    onError={(e) => {
                                      // Fallback to emoji if image fails to load
                                      const parent = e.target.parentElement;
                                      parent.innerHTML = `<div class="learn-service-illustration">${service.illustration || service.icon || '📚'}</div>`;
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="learn-service-illustration">{service.illustration || service.icon || '📚'}</div>
                              )}
                              <div className="learn-service-content">
                                <h3 className="learn-service-title">{service.title}</h3>
                                <span className="learn-service-level">{service.level}</span>
                                <span className="learn-service-price">{formatPrice(convertCurrency(99, currency), currency, language)}</span>
                              </div>
                            </div>
                            </WaveAnimatedElement>
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
                        <div className="create-services-container">
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
                              {searchQuery ? (
                                <>
                                  {t('services.filters.showing')} {getFilteredCreateServices().length} {t('services.filters.of')} {createServices[selectedCreateCategory]?.length || 0} {t('services.filters.services')} {t('services.filters.matching')} "{searchQuery}"
                                </>
                              ) : (
                                <>
                                  {t('services.filters.showing')} {getFilteredCreateServices().length} {t('services.filters.of')} {createServices[selectedCreateCategory]?.length || 0} {t('services.filters.services')}
                                </>
                              )}
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
                        </div>
                      )}
                    </>
                  )}
                </div>
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
                const profileResponse = await fetch(getApiUrl(`api/user/${encodeURIComponent(email)}`));
                const profileData = await profileResponse.json();
                if (profileData.success && profileData.user) {
                  setUserData(profileData.user); // Store user data for notifications
                  if (profileData.user.color_theme) {
                    setColorTheme(profileData.user.color_theme);
                    localStorage.setItem('colorTheme', profileData.user.color_theme);
                  }

                  // Check for profile completion achievement
                  if (profileData.user.username && profileData.user.avatar_url && profileData.user.title) {
                    checkAchievements(email, 'profile').then(achievementNotifications => {
                      if (achievementNotifications.length > 0) {
                        const existingNotifications = JSON.parse(localStorage.getItem('chimpNotifications') || '[]');
                        const updatedNotifications = [...existingNotifications, ...achievementNotifications];
                        localStorage.setItem('chimpNotifications', JSON.stringify(updatedNotifications));
                        window.dispatchEvent(new CustomEvent('achievementsUpdated'));
                      }
                    });
                  }
                }
              } catch (err) {
                console.error('Error fetching user theme:', err);
              }

              // Check for first login achievement
              checkAchievements(email, 'login').then(achievementNotifications => {
                if (achievementNotifications.length > 0) {
                  const existingNotifications = JSON.parse(localStorage.getItem('chimpNotifications') || '[]');
                  const updatedNotifications = [...existingNotifications, ...achievementNotifications];
                  localStorage.setItem('chimpNotifications', JSON.stringify(updatedNotifications));
                  window.dispatchEvent(new CustomEvent('achievementsUpdated'));
                }
              });

              // Check for discount availability and notify user
              fetch(getApiUrl(`api/user/${encodeURIComponent(email)}/achievements`))
                .then(res => res.json())
                .then(data => {
                  if (data.success && data.discountAvailable && !data.discountGranted) {
                    const existingNotifications = JSON.parse(localStorage.getItem('chimpNotifications') || '[]');
                    const discountNotification = {
                      id: `discount-reminder-${email}`,
                      message: '🎉 You have a 30% discount available! Complete all achievements to unlock it on your next order!',
                      read: false,
                      timestamp: new Date().toISOString(),
                      type: 'achievement'
                    };
                    const notificationExists = existingNotifications.some(n => n.id === discountNotification.id);
                    if (!notificationExists) {
                      const updatedNotifications = [...existingNotifications, discountNotification];
                      localStorage.setItem('chimpNotifications', JSON.stringify(updatedNotifications));
                      window.dispatchEvent(new CustomEvent('achievementsUpdated'));
                    }
                  }
                })
                .catch(err => console.error('Error checking discount:', err));

              // Add one-time notification about more achievements to unlock
              const hasSeenAchievementHint = localStorage.getItem(`achievementHintSeen:${email}`);
              if (!hasSeenAchievementHint) {
                getUnlockedAchievements(email).then(unlocked => {
                  const totalAchievements = Object.keys(ACHIEVEMENTS).length;
                  const unlockedCount = Object.keys(unlocked).filter(key => unlocked[key] === true).length;
                  const remainingCount = totalAchievements - unlockedCount;

                  if (remainingCount > 0) {
                    const existingNotifications = JSON.parse(localStorage.getItem('chimpNotifications') || '[]');
                    const hintNotification = {
                      id: `achievement-hint-${email}`,
                      message: `🏆 You have ${remainingCount} more achievement${remainingCount > 1 ? 's' : ''} to unlock!`,
                      read: false,
                      timestamp: new Date().toISOString(),
                      type: 'achievement'
                    };

                    // Check if hint notification already exists
                    const hintExists = existingNotifications.some(n => n.id === hintNotification.id);
                    if (!hintExists) {
                      const updatedNotifications = [...existingNotifications, hintNotification];
                      localStorage.setItem('chimpNotifications', JSON.stringify(updatedNotifications));
                      localStorage.setItem(`achievementHintSeen:${email}`, 'true');
                      window.dispatchEvent(new CustomEvent('achievementsUpdated'));
                    }
                  }
                });
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

                // Check for quiz completion achievement
                if (userEmail) {
                  checkAchievements(userEmail, 'quiz').then(achievementNotifications => {
                    if (achievementNotifications.length > 0) {
                      const existingNotifications = JSON.parse(localStorage.getItem('chimpNotifications') || '[]');
                      const updatedNotifications = [...existingNotifications, ...achievementNotifications];
                      localStorage.setItem('chimpNotifications', JSON.stringify(updatedNotifications));
                      window.dispatchEvent(new CustomEvent('achievementsUpdated'));
                    }
                  });
                }
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
          <BananaGame userEmail={userEmail} />
        </div>
      } />
      </Routes>
      <DragOverlay
        style={{
          zIndex: 10002,
          position: 'fixed',
        }}
      >
        {(isDragging && (activeId === 'services-section' || activeId === 'services-section-header')) ? (
          <div className="drag-overlay-services">
            <span className="services-module-text">Services</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}


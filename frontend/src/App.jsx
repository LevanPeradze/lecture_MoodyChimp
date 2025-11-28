import { useState, useEffect, useRef } from 'react';
import logoImage from './assets/logo.png';
import LoginModal from './LoginModal';
import AccountPage from './AccountPage';
import Questionnaire from './Questionnaire';
import QuestionnaireResult from './QuestionnaireResult';

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
  const heroRef = useRef(null);

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

  // Fetch user's optimal course if logged in
  useEffect(() => {
    const fetchUserOptimalCourse = async () => {
      if (userEmail) {
        try {
          const response = await fetch(`http://localhost:4000/api/user-optimal/${encodeURIComponent(userEmail)}`);
          const data = await response.json();
          if (data.success && data.optimalCourse) {
            setUserOptimalCourse(data.optimalCourse);
          }
        } catch (err) {
          console.error('Error fetching user optimal course:', err);
        }
      }
    };

    fetchUserOptimalCourse();
  }, [userEmail]);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowAccountPage(false);
    setShowLoginInHeader(true);
    setUserEmail('');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.setItem('showLoginInHeader', 'true');
  };

  if (showAccountPage) {
    return (
      <AccountPage 
        userEmail={userEmail}
        onBack={() => setShowAccountPage(false)}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="moodychimp">
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
          {isLoggedIn && (
            <button 
              className="account-btn"
              onClick={() => setShowAccountPage(true)}
              aria-label="Account"
            >
              🍌
            </button>
          )}
        </nav>
      </header>

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
                <p className="services-loading">No Learn services available.</p>
              ) : (
                <div className="learn-services-container">
                  <div className="learn-services-grid">
                    {learnServices.map((service) => {
                      const isOptimal = userOptimalCourse && 
                        ((userOptimalCourse === 'Game Dev' && service.title === 'Game Dev') ||
                         (userOptimalCourse === 'Animation' && service.title === 'Animation') ||
                         (userOptimalCourse === 'Simplifying the human figure' && service.title === 'Simplifying the human figure'));
                      return (
                        <div key={service.id || service.title} className="learn-service-item">
                          {isOptimal && <span className="optimal-tag">Optimal!</span>}
                          <div className="learn-service-illustration">{service.illustration || service.icon}</div>
                          <div className="learn-service-content">
                            <h3 className="learn-service-title">{service.title}</h3>
                            <span className="learn-service-level">{service.level}</span>
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
                    <div className="create-services-list">
                      {createServices[selectedCreateCategory]?.map((service) => (
                        <div key={service.id || service.title} className="create-service-item">
                          <div className="create-service-header">
                            <h3 className="create-service-title">{service.title}</h3>
                            <span className="create-service-price">{service.price}</span>
                          </div>
                          <p className="create-service-description">{service.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </section>

        <section id="about" className="about">
          <h2>About us</h2>
          <p>
            MoodyChimp is a creative studio powered by two generalists who love mixing code, cameras,
            and sketchbooks. We ship focused experiences, keep documentation tight, and leave room
            for playful discovery.
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
          localStorage.setItem('hasVisited', 'true');
        }}
        onMaybeLater={() => {
          setShowLoginModal(false);
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
  );
}


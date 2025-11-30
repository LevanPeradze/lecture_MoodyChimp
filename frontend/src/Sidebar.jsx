import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoImage from './assets/logo.png';
import { useI18n } from './i18n/index.jsx';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose, bookmarkedCoursesCount, isLoggedIn, userEmail }) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef(null);
  const [notes, setNotes] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [savedNotes, setSavedNotes] = useState([]);
  const [wordCount, setWordCount] = useState(0);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        // Check if click is not on the hamburger button
        const hamburgerBtn = document.querySelector('.hamburger-btn');
        // Check if click is on the notes modal (don't close sidebar if modal is open)
        const notesModal = document.querySelector('.notes-modal-overlay');
        if (hamburgerBtn && !hamburgerBtn.contains(event.target) && 
            (!notesModal || !notesModal.contains(event.target))) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Helper function to count words
  const countWords = (text) => {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Update word count when notes change
  useEffect(() => {
    setWordCount(countWords(notes));
  }, [notes]);

  // Fetch notes from API on mount or when userEmail changes
  useEffect(() => {
    const fetchNotes = async () => {
      if (userEmail) {
        try {
          const response = await fetch(`http://localhost:4000/api/user/${encodeURIComponent(userEmail)}/notes`);
          if (response.ok) {
            const data = await response.json();
            setSavedNotes(data);
          } else {
            console.error('Failed to fetch notes');
          }
        } catch (error) {
          console.error('Error fetching notes:', error);
        }
      } else {
        setSavedNotes([]);
      }
    };
    fetchNotes();
  }, [userEmail]);

  // Save notes to API
  const handleSaveNotes = async () => {
    if (!userEmail || !notes.trim()) {
      setSaveMessage(t('sidebar.notes.emptyNote'));
      setTimeout(() => setSaveMessage(''), 2000);
      return;
    }

    const currentWordCount = countWords(notes);
    if (currentWordCount > 50) {
      setSaveMessage(t('sidebar.notes.wordLimitExceeded'));
      setTimeout(() => setSaveMessage(''), 2000);
      return;
    }

    try {
      const response = await fetch(`http://localhost:4000/api/user/${encodeURIComponent(userEmail)}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note_text: notes.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setSavedNotes(prev => [data.note, ...prev]);
        setNotes(''); // Clear textarea after saving
        setSaveMessage(t('sidebar.notes.saved'));
        setTimeout(() => setSaveMessage(''), 2000);
      } else {
        const errorData = await response.json();
        setSaveMessage(errorData.error || t('sidebar.notes.saveError'));
        setTimeout(() => setSaveMessage(''), 2000);
      }
    } catch (err) {
      console.error('Error saving notes:', err);
      setSaveMessage(t('sidebar.notes.saveError'));
      setTimeout(() => setSaveMessage(''), 2000);
    }
  };

  // Clear all notes
  const handleClearNotes = async () => {
    if (!userEmail) return;

    if (!window.confirm(t('sidebar.notes.confirmClear'))) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:4000/api/user/${encodeURIComponent(userEmail)}/notes`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSavedNotes([]);
        setSaveMessage(t('sidebar.notes.cleared'));
        setTimeout(() => setSaveMessage(''), 2000);
      } else {
        setSaveMessage(t('sidebar.notes.clearError'));
        setTimeout(() => setSaveMessage(''), 2000);
      }
    } catch (err) {
      console.error('Error clearing notes:', err);
      setSaveMessage(t('sidebar.notes.clearError'));
      setTimeout(() => setSaveMessage(''), 2000);
    }
  };

  const handleViewNotesClick = () => {
    setShowNotesModal(true);
  };

  const handleHomeClick = () => {
    navigate('/');
    onClose();
  };

  const handleMyOrdersClick = () => {
    if (isLoggedIn) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      navigate('/account?section=myorders');
    } else {
      // If not logged in, could show login modal or navigate to login
      navigate('/');
    }
    onClose();
  };

  const handleSavedCoursesClick = () => {
    navigate('/bookmarks');
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      
      {/* Sidebar */}
      <aside ref={sidebarRef} className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <img src={logoImage} alt="MoodyChimp Logo" className="sidebar-logo" />
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
            ×
          </button>
        </div>

        {/* Sidebar Menu */}
        <nav className="sidebar-menu">
          <button 
            className="sidebar-menu-item" 
            onClick={handleHomeClick}
            aria-label={t('sidebar.home')}
          >
            <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>{t('sidebar.home')}</span>
          </button>

          <button 
            className="sidebar-menu-item" 
            onClick={handleMyOrdersClick}
            aria-label={t('sidebar.myOrders')}
            disabled={!isLoggedIn}
          >
            <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span>{t('sidebar.myOrders')}</span>
          </button>

          <button 
            className="sidebar-menu-item" 
            onClick={handleSavedCoursesClick}
            aria-label={t('sidebar.savedCourses')}
          >
            <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <span>{t('sidebar.savedCourses')}</span>
            {bookmarkedCoursesCount > 0 && (
              <span className="sidebar-badge">{bookmarkedCoursesCount}</span>
            )}
          </button>

          <button 
            className="sidebar-menu-item" 
            onClick={handleViewNotesClick}
            aria-label={t('sidebar.viewNotes')}
            disabled={!isLoggedIn}
          >
            <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>{t('sidebar.viewNotes')}</span>
          </button>
        </nav>

        {/* Notes Section */}
        <div className="sidebar-notes-section">
          <div className="sidebar-notes-header">
            <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <h3 className="sidebar-notes-title">{t('sidebar.notes.title')}</h3>
          </div>
          <textarea
            className="sidebar-notes-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (isLoggedIn && userEmail && wordCount > 0 && wordCount <= 50) {
                  handleSaveNotes();
                }
              }
            }}
            placeholder={t('sidebar.notes.placeholder')}
            disabled={!isLoggedIn}
            maxLength={500}
          />
          <div className="sidebar-notes-word-count">
            <span className={wordCount > 50 ? 'word-count-error' : ''}>
              {wordCount}/50 {t('sidebar.notes.words')}
            </span>
          </div>
          <div className="sidebar-notes-footer">
            {saveMessage && (
              <span className={`sidebar-notes-message ${saveMessage.includes('Error') || saveMessage.includes('exceeded') || saveMessage.includes('empty') ? 'error' : 'success'}`}>
                {saveMessage}
              </span>
            )}
            {!saveMessage && (
              <button
                className="sidebar-notes-save-btn"
                onClick={handleSaveNotes}
                disabled={!isLoggedIn || !userEmail || wordCount === 0 || wordCount > 50}
              >
                {t('sidebar.notes.save')}
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* My Notes Modal */}
      {showNotesModal && (
        <div className="notes-modal-overlay" onClick={(e) => {
          e.stopPropagation();
          setShowNotesModal(false);
        }}>
          <div className="notes-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notes-modal-header">
              <h2 className="notes-modal-title">{t('sidebar.notes.myNotes')}</h2>
              <button 
                className="notes-modal-close-btn" 
                onClick={() => setShowNotesModal(false)}
                aria-label="Close notes"
              >
                ×
              </button>
            </div>
            <div className="notes-modal-content">
              {savedNotes.length > 0 ? (
                <>
                  <div className="notes-modal-list">
                    {savedNotes.map((note) => (
                      <div key={note.id} className="notes-modal-item">
                        <div className="notes-modal-item-text">{note.note_text}</div>
                        <div className="notes-modal-item-meta">
                          <span className="notes-modal-item-date">
                            {new Date(note.created_at).toLocaleDateString()}
                          </span>
                          <span className="notes-modal-item-word-count">
                            {note.word_count} {t('sidebar.notes.words')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="notes-modal-actions">
                    <button 
                      className="notes-modal-clear-btn"
                      onClick={handleClearNotes}
                    >
                      {t('sidebar.notes.clearAll')}
                    </button>
                  </div>
                </>
              ) : (
                <div className="notes-modal-empty">{t('sidebar.notes.noNotes')}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;


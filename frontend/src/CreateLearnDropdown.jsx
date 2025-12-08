import { useState, useEffect, useRef } from 'react';
import './CreateLearnDropdown.css';

const CreateLearnDropdown = ({ 
  learnServices, 
  createServices, 
  onServiceClick,
  onNavigateToServices,
  containerRef 
}) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const dropdownRef = useRef(null);

  // Calculate dropdown position when in header - keep it fixed near Services link
  useEffect(() => {
    if (containerRef && containerRef.current && dropdownRef.current) {
      const updatePosition = () => {
        if (containerRef.current && dropdownRef.current) {
          // Get the position relative to viewport (since header is fixed)
          // getBoundingClientRect() returns viewport coordinates
          const rect = containerRef.current.getBoundingClientRect();
          // Use viewport coordinates directly - no need to add scrollY/scrollX for fixed positioning
          dropdownRef.current.style.top = `${rect.bottom + 5}px`;
          dropdownRef.current.style.left = `${rect.left}px`;
          dropdownRef.current.style.position = 'fixed';
        }
      };
      
      // Initial positioning
      updatePosition();
      
      // Update on scroll and resize to keep it aligned with Services link
      // Even though header is fixed, we update on scroll to handle any edge cases
      const handleScroll = () => {
        updatePosition();
      };
      
      const handleResize = () => {
        updatePosition();
      };
      
      // Listen to scroll events to keep dropdown aligned
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [containerRef]);

  const handleCreateClick = () => {
    setSelectedType('create');
    setExpanded(true);
    // Scroll to services section if not already there
    if (onNavigateToServices) {
      onNavigateToServices('Create');
    }
  };

  const handleLearnClick = () => {
    setSelectedType('learn');
    setExpanded(true);
    // Scroll to services section if not already there
    if (onNavigateToServices) {
      onNavigateToServices('Learn');
    }
  };

  // Close dropdown when clicking outside - this will be handled by parent component
  // We just reset the expanded state here
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          containerRef && containerRef.current && !containerRef.current.contains(event.target)) {
        setExpanded(false);
        setSelectedType(null);
      }
    };

    // Always listen for clicks outside when dropdown is visible
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [containerRef]);

  // Focus trap for accessibility
  useEffect(() => {
    if (expanded && dropdownRef.current) {
      const firstButton = dropdownRef.current.querySelector('button');
      firstButton?.focus();
    }
  }, [expanded]);

  // Get services for selected type
  const getServicesForType = () => {
    try {
      if (selectedType === 'create') {
        // Flatten all create services from all categories
        if (!createServices || typeof createServices !== 'object') {
          return [];
        }
        return Object.values(createServices).flat().filter(service => service && service.title);
      } else if (selectedType === 'learn') {
        if (!Array.isArray(learnServices)) {
          return [];
        }
        return learnServices.filter(service => service && service.title);
      }
      return [];
    } catch (error) {
      console.error('Error getting services for type:', error);
      return [];
    }
  };

  const services = getServicesForType();

  return (
    <div 
      ref={dropdownRef}
      className={`create-learn-dropdown ${expanded ? 'expanded' : ''}`}
      role="menu"
      aria-label="Services menu"
    >
      {/* Always show Create/Learn buttons */}
      <div className="create-learn-options">
        <button 
          className={`create-learn-option ${selectedType === 'create' ? 'active' : ''}`}
          onClick={handleCreateClick}
          role="menuitem"
          aria-expanded={expanded && selectedType === 'create'}
        >
          Create
        </button>
        <button 
          className={`create-learn-option ${selectedType === 'learn' ? 'active' : ''}`}
          onClick={handleLearnClick}
          role="menuitem"
          aria-expanded={expanded && selectedType === 'learn'}
        >
          Learn
        </button>
      </div>
      
      {/* Show services list when a type is selected and expanded */}
      {expanded && selectedType && services.length > 0 && (
        <div className="create-learn-services-list">
          {services.map((service, index) => (
            <div
              key={service.id || service.title || index}
              className="create-learn-service-item"
              onClick={() => {
                if (onServiceClick && service && service.id) {
                  onServiceClick(service);
                }
                setExpanded(false);
                setSelectedType(null);
              }}
              role="menuitem"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (onServiceClick && service && service.id) {
                    onServiceClick(service);
                  }
                  setExpanded(false);
                  setSelectedType(null);
                }
              }}
            >
              <span className="create-learn-service-title">{service.title || 'Untitled Service'}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Show empty state when type is selected but no services */}
      {expanded && selectedType && services.length === 0 && (
        <div className="create-learn-empty">
          No {selectedType === 'create' ? 'create' : 'learn'} services available
        </div>
      )}
    </div>
  );
};

export default CreateLearnDropdown;


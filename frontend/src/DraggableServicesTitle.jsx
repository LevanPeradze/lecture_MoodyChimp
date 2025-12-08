import { useState, useEffect, useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import './DraggableServicesTitle.css';
import CreateLearnDropdown from './CreateLearnDropdown';

const DraggableServicesTitle = ({
  learnServices,
  createServices,
  onServiceClick,
  children,
  isInHeader = false,
  onDragStart,
  onDragEnd,
  onReturnToDefault,
  waveTriggered = 0,
  triggerWave,
  onNavigateToServices
}) => {
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  // DnD Kit drag functionality - different IDs for header vs services section
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isDnDDragging,
  } = useDraggable({
    id: isInHeader ? 'services-section-header' : 'services-section',
    disabled: false, // Enable dragging in both cases
    data: {
      type: 'services-section',
      isInHeader: isInHeader,
    },
  });

  const dragStyle = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  // Get all services for dropdown
  const allServices = [
    ...(learnServices || []).map(s => ({ ...s, type: 'course' })),
    ...(Object.values(createServices || {}).flat().map(s => ({ ...s, type: 'service' })))
  ];

  // Calculate dropdown position
  useEffect(() => {
    if (containerRef.current && dropdownRef.current && showServiceDropdown) {
      const updatePosition = () => {
        const rect = containerRef.current.getBoundingClientRect();
        dropdownRef.current.style.top = `${rect.bottom + 5}px`;
        dropdownRef.current.style.left = `${rect.left}px`;
      };
      
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [showServiceDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking on the Services title itself (in header)
      if (isInHeader && containerRef.current && containerRef.current.contains(event.target)) {
        // Check if clicking on the title link
        const titleElement = containerRef.current.querySelector('.services-title-text.clickable');
        if (titleElement && titleElement.contains(event.target)) {
          return; // Allow toggle on title click
        }
      }
      
      // Close if clicking outside both dropdown and container
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          containerRef.current && !containerRef.current.contains(event.target)) {
        setShowServiceDropdown(false);
      }
    };

    if (showServiceDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showServiceDropdown, isInHeader]);

  // Combine refs
  const combinedRef = (node) => {
    containerRef.current = node;
    setNodeRef(node); // Always set node ref for dragging
  };

  return (
    <div 
      ref={combinedRef}
      className={`draggable-services-title-container ${isInHeader ? 'in-header' : ''} ${isDnDDragging ? 'dragging' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={dragStyle}
    >
      <div className="draggable-services-title">
        {isInHeader ? (
          // In header: make title clickable to show Create/Learn dropdown
          <a
            href="#"
            className="services-title-text clickable"
            onClick={(e) => {
              e.preventDefault();
              setShowServiceDropdown(!showServiceDropdown);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowServiceDropdown(!showServiceDropdown);
              }
            }}
            aria-expanded={showServiceDropdown}
          >
            {children || 'Services'}
          </a>
        ) : (
          // In services section: regular title with wave animation wrapper
          <h2 className="services-title-text">{children || 'Services'}</h2>
        )}
        
        {/* Drag handle - show when hovered */}
        {isHovered && (
          <button
            className="services-drag-handle"
            {...listeners}
            {...attributes}
            aria-label={isInHeader ? "Drag services section back to original position" : "Drag services section to header"}
            title={isInHeader ? "Drag back to services section" : "Drag to header"}
            onClick={(e) => {
              e.stopPropagation();
              // Trigger wave animation when drag handle is clicked (only for services section)
              if (!isInHeader && triggerWave) {
                triggerWave(e);
              }
            }}
          >
            <div className="drag-handle-icon">⋮⋮</div>
          </button>
        )}
      </div>

      {showServiceDropdown && isInHeader ? (
        // In header: show CreateLearnDropdown
        <CreateLearnDropdown
          learnServices={learnServices}
          createServices={createServices}
          onServiceClick={onServiceClick}
          onNavigateToServices={onNavigateToServices}
          containerRef={containerRef}
        />
      ) : showServiceDropdown && !isInHeader ? (
        // In services section: show all services dropdown
        <div 
          ref={dropdownRef} 
          className="services-dropdown" 
          role="menu"
        >
          {allServices.length === 0 ? (
            <div className="services-dropdown-empty">No services available</div>
          ) : (
            <div className="services-dropdown-list">
              {allServices.map((service, index) => (
                <div
                  key={service.id || index}
                  className="services-dropdown-item"
                  onClick={() => {
                    if (onServiceClick) {
                      onServiceClick(service);
                    }
                    setShowServiceDropdown(false);
                  }}
                  role="menuitem"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (onServiceClick) {
                        onServiceClick(service);
                      }
                      setShowServiceDropdown(false);
                    }
                  }}
                >
                  <span className="services-dropdown-item-title">{service.title.toUpperCase()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default DraggableServicesTitle;

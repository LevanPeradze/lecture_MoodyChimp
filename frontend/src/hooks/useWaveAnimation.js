import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook for wave push animation effect
 * Optimized to only animate visible elements using IntersectionObserver
 */
export const useWaveAnimation = () => {
  const [waveTriggered, setWaveTriggered] = useState(0);
  const clickPointRef = useRef(null);
  const animationFrameRef = useRef(null);
  const visibleElementsRef = useRef([]);
  const observerRef = useRef(null);

  // Track visible elements for performance optimization
  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      visibleElementsRef.current = entries
        .filter(entry => entry.isIntersecting)
        .map(entry => entry.target);
    }, { 
      threshold: 0.1,
      rootMargin: '50px' // Preload nearby elements
    });

    // Function to observe all elements with data-wave-animate
    const observeElements = () => {
      const elements = document.querySelectorAll('[data-wave-animate]');
      elements.forEach(el => {
        if (observerRef.current && !visibleElementsRef.current.includes(el)) {
          observerRef.current.observe(el);
        }
      });
    };

    // Initial observation
    observeElements();

    // Re-observe when DOM changes (for dynamically added elements)
    const mutationObserver = new MutationObserver(() => {
      observeElements();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      mutationObserver.disconnect();
    };
  }, []);

  /**
   * Trigger wave animation from click point
   * @param {MouseEvent} event - Click event
   */
  const triggerWave = useCallback((event) => {
    // Cancel previous animation if still running
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Store click point for distance calculations
    clickPointRef.current = { 
      x: event.clientX, 
      y: event.clientY 
    };
    
    // Force re-observe elements to ensure visibility list is up to date
    if (observerRef.current) {
      const elements = document.querySelectorAll('[data-wave-animate]');
      elements.forEach(el => {
        if (observerRef.current) {
          observerRef.current.observe(el);
        }
      });
    }
    
    // Use requestAnimationFrame for smooth trigger
    animationFrameRef.current = requestAnimationFrame(() => {
      setWaveTriggered(prev => prev + 1);
    });
  }, []);

  /**
   * Calculate push animation for an element based on distance from click point
   * @param {React.RefObject} elementRef - Reference to the element
   * @returns {Object} Animation properties for motion component
   */
  const getPushAnimation = useCallback((elementRef) => {
    if (!clickPointRef.current || !elementRef || !elementRef.current) {
      return {};
    }
    
    // Only animate visible elements for performance
    // Check if element is in visible list OR if it's in viewport (fallback)
    const isVisible = visibleElementsRef.current.includes(elementRef.current);
    if (!isVisible) {
      // Fallback: check if element is actually in viewport
      const rect = elementRef.current.getBoundingClientRect();
      const inViewport = rect.top < window.innerHeight + 50 && 
                        rect.bottom > -50 && 
                        rect.left < window.innerWidth + 50 && 
                        rect.right > -50;
      if (!inViewport) {
        return {};
      }
    }

    const rect = elementRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate distance and angle from click point
    const dx = centerX - clickPointRef.current.x;
    const dy = centerY - clickPointRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    // Calculate push strength (closer = stronger, max 60px, min 10px)
    const strength = Math.max(60 - distance * 0.5, 10);
    // Calculate delay (closer = earlier reaction)
    const delay = distance * 0.002;
    
    // Calculate push direction
    const pushX = Math.cos(angle) * strength;
    const pushY = Math.sin(angle) * strength;
    
    return {
      x: [0, pushX, 0],
      y: [0, pushY, 0],
      scale: [1, 0.95, 1],
      transition: {
        duration: 0.6,
        delay: delay,
        times: [0, 0.3, 1],
        ease: [0.34, 1.56, 0.64, 1], // Spring effect
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    };
  }, []);

  /**
   * Cancel wave animation
   */
  const cancelWave = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setWaveTriggered(0);
    clickPointRef.current = null;
  }, []);

  return { 
    waveTriggered, 
    triggerWave, 
    getPushAnimation, 
    cancelWave 
  };
};


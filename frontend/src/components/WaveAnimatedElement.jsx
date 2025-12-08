import { useRef, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';

/**
 * Wrapper component that applies wave push animation to its children
 */
const WaveAnimatedElement = ({ 
  children, 
  waveTriggered, 
  getPushAnimation, 
  elementId 
}) => {
  const elementRef = useRef(null);

  // Register element for IntersectionObserver
  useEffect(() => {
    if (elementRef.current) {
      // Add data attribute so IntersectionObserver can find it
      elementRef.current.setAttribute('data-wave-animate', 'true');
    }
  }, []);

  // Calculate animation props when wave is triggered
  // Use useMemo to recalculate when waveTriggered changes
  const animationProps = useMemo(() => {
    if (waveTriggered > 0 && getPushAnimation && elementRef.current) {
      const props = getPushAnimation(elementRef);
      // Always return a new object reference to trigger motion
      if (Object.keys(props).length > 0) {
        return { ...props };
      }
    }
    // Return new object reference even for reset
    return { x: 0, y: 0, scale: 1 };
  }, [waveTriggered, getPushAnimation]);

  return (
    <motion.div
      ref={elementRef}
      key={elementId}
      animate={animationProps}
      initial={{ x: 0, y: 0, scale: 1 }}
      style={{ display: 'inline-block' }}
      data-wave-animate="true"
    >
      {children}
    </motion.div>
  );
};

export default WaveAnimatedElement;


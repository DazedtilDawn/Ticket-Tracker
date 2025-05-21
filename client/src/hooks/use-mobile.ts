import { useState, useEffect } from 'react';

// Define a consistent breakpoint size that matches Tailwind's md breakpoint
const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if the window is available (not during SSR)
    if (typeof window !== 'undefined') {
      // Initial check
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

      // Add event listener for window resize
      const handleResize = () => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      };

      window.addEventListener('resize', handleResize);

      // Clean up
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  return { isMobile };
};

// Provide an alias for backward compatibility
export const useMobile = useIsMobile;
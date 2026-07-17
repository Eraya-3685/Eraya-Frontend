import { useState, useEffect } from 'react';

const BREAKPOINTS = {
  mobile: '(max-width: 768px)',
  tablet: '(max-width: 1024px)',
  smallMobile: '(max-width: 480px)',
};

export default function useMediaQuery() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(BREAKPOINTS.mobile).matches : false
  );
  const [isTablet, setIsTablet] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(BREAKPOINTS.tablet).matches : false
  );
  const [isSmallMobile, setIsSmallMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(BREAKPOINTS.smallMobile).matches : false
  );

  useEffect(() => {
    const mobileQuery = window.matchMedia(BREAKPOINTS.mobile);
    const tabletQuery = window.matchMedia(BREAKPOINTS.tablet);
    const smallQuery = window.matchMedia(BREAKPOINTS.smallMobile);

    const handleMobile = (e) => setIsMobile(e.matches);
    const handleTablet = (e) => setIsTablet(e.matches);
    const handleSmall = (e) => setIsSmallMobile(e.matches);

    mobileQuery.addEventListener('change', handleMobile);
    tabletQuery.addEventListener('change', handleTablet);
    smallQuery.addEventListener('change', handleSmall);

    return () => {
      mobileQuery.removeEventListener('change', handleMobile);
      tabletQuery.removeEventListener('change', handleTablet);
      smallQuery.removeEventListener('change', handleSmall);
    };
  }, []);

  return { isMobile, isTablet, isSmallMobile };
}

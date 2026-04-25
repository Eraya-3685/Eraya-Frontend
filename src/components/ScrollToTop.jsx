import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop component ensures that the window scrolls to the top
 * whenever the route changes. This is essential for a smooth UX in SPAs.
 */
const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Reset scroll position to top
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant", // We use instant for a clean page jump, or "smooth" for animation
    });
  }, [pathname, search]); // Trigger on path or query parameter change

  return null;
};

export default ScrollToTop;

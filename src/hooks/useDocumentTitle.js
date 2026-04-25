import { useEffect } from 'react';

/**
 * Custom hook to update the browser document title dynamically.
 * @param {string} title - The title for the current page.
 */
const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = title ? `Eraya | ${title}` : 'Eraya';
  }, [title]);
};

export default useDocumentTitle;

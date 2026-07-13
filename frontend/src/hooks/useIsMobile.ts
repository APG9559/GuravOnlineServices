import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if the current screen width is below a given breakpoint.
 * Reacts dynamically to screen resizing.
 *
 * @param breakpoint The max width threshold in pixels (defaults to 768px).
 * @returns Boolean flag indicating if the viewport is mobile-sized.
 */
export default function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= breakpoint);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [breakpoint]);

  return isMobile;
}

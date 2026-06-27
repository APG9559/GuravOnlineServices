import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce updates to a value.
 * Useful for limiting the frequency of API calls or heavy UI computations
 * in response to rapid state changes (e.g., search input typing).
 * 
 * @param value The value to be debounced.
 * @param delay The delay in milliseconds (defaults to 300ms).
 * @returns The debounced value.
 */
export default function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOnlineStatus, setShowOnlineStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineStatus(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-hide the "Connection restored" banner after 3 seconds
  useEffect(() => {
    if (isOnline && showOnlineStatus) {
      const timer = setTimeout(() => {
        setShowOnlineStatus(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, showOnlineStatus]);

  return { isOnline, showOnlineStatus };
}

import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface SwipeRefreshProps {
  children: React.ReactNode;
}

export default function SwipeRefresh({ children }: SwipeRefreshProps) {
  const queryClient = useQueryClient();
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isPullingRef = useRef(false);

  const pullThreshold = 70; // drag threshold in pixels to trigger refresh
  const maxPullDistance = 120; // maximum drag limit

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Only capture touch if we are at the top of the page scroll and not already refreshing
      if (window.scrollY > 0 || refreshing) return;
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current || refreshing) return;

      const touch = e.touches[0];
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaX = touch.clientX - touchStartRef.current.x;

      // Check if user is scrolled to the top and is pulling downwards vertically
      if (window.scrollY === 0 && deltaY > 0 && Math.abs(deltaY) > Math.abs(deltaX)) {
        isPullingRef.current = true;

        // Calculate drag distance with simple dampening resistance
        const resistanceDistance = Math.min(deltaY * 0.4, maxPullDistance);
        setPullDistance(resistanceDistance);

        // Prevent default browser-level pull-to-refresh behavior
        if (e.cancelable) {
          e.preventDefault();
        }
      } else {
        // Cancel the pull if they scroll back up or pull horizontally
        isPullingRef.current = false;
        setPullDistance(0);
        touchStartRef.current = null;
      }
    };

    const handleTouchEnd = async () => {
      if (!isPullingRef.current || refreshing) {
        touchStartRef.current = null;
        isPullingRef.current = false;
        return;
      }

      touchStartRef.current = null;
      isPullingRef.current = false;

      // If dragged past the threshold, initiate refresh
      if (pullDistance >= pullThreshold) {
        setRefreshing(true);
        setPullDistance(pullThreshold); // keep indicator at threshold height during loading

        try {
          // Refetch active React Query queries
          await queryClient.refetchQueries({ type: 'active' });
          // Add brief visual delay for smooth transition feedback
          await new Promise((resolve) => setTimeout(resolve, 600));
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Pull to refresh failed:', error);
        } finally {
          setRefreshing(false);
          setPullDistance(0);
        }
      } else {
        // Cancel and animate/snap back
        setPullDistance(0);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, refreshing, queryClient]);

  const showIndicator = pullDistance > 0 || refreshing;

  return (
    <>
      {/* Pull Indicator Widget */}
      <div
        style={{
          position: 'fixed',
          top: 80, // Positioned below the sticky top nav bar (64px) + margin
          left: '50%',
          zIndex: 99,
          pointerEvents: 'none',
          opacity: showIndicator ? 1 : 0,
          transform: `translate3d(-50%, ${refreshing ? 15 : Math.max(0, pullDistance - 25)}px, 0) scale(${refreshing ? 1 : Math.min(1, pullDistance / pullThreshold)})`,
          transition: refreshing
            ? 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            : 'transform 0.1s ease-out, opacity 0.1s ease-out',
          background: 'var(--accent)', // Neo yellow primary accent
          color: '#000000',
          border: '3px solid var(--border)',
          borderRadius: '50%',
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '3px 3px 0px var(--border)',
        }}
      >
        {refreshing ? (
          <svg
            style={{
              animation: 'swipe-spin 0.8s linear infinite',
            }}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
        ) : (
          <svg
            style={{
              transform: `rotate(${Math.min(180, (pullDistance / pullThreshold) * 180)}deg)`,
              transition: 'transform 0.1s ease-out',
            }}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <polyline points="19 12 12 19 5 12"></polyline>
          </svg>
        )}
      </div>

      <style>{`
        @keyframes swipe-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      {/* Children elements (Main content layout) */}
      {children}
    </>
  );
}

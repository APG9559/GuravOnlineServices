import { useState, useEffect, useRef } from 'react';

interface UseTableVirtualizerProps {
  itemCount: number;
  itemHeight?: number;
  containerHeight?: number;
  buffer?: number;
}

/**
 * Custom hook for rendering large lists or tables virtually.
 * Only renders a subset of rows within the visible container to maximize performance.
 * 
 * @param itemCount Total number of items in the list.
 * @param itemHeight Individual row height in pixels (defaults to 52px).
 * @param containerHeight Scroll container height in pixels (defaults to 450px).
 * @param buffer Additional rows to render above and below the visible region to prevent flicker (defaults to 2).
 * @returns Object containing the scroll container ref, start/end indices, and top/bottom paddings for layout offset.
 */
export default function useTableVirtualizer({
  itemCount,
  itemHeight = 52, // average height of a tr in pixels
  containerHeight = 450,
  buffer = 2,
}: UseTableVirtualizerProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLDivElement;
      setScrollTop(target.scrollTop);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      setScrollTop(container.scrollTop);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [itemCount]); // re-bind or reset scroll tracking if items size changes

  const totalHeight = itemCount * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
  const endIndex = Math.min(itemCount - 1, startIndex + visibleCount + buffer * 2);

  const topPadding = startIndex * itemHeight;
  const bottomPadding = Math.max(0, totalHeight - (endIndex + 1) * itemHeight);

  return {
    containerRef,
    startIndex,
    endIndex,
    topPadding,
    bottomPadding,
  };
}

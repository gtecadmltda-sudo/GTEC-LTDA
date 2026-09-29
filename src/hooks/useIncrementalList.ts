import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Hook to render initial 10 items in a list and incrementally load more on scroll
 * to optimize render time and responsiveness.
 */
export function useIncrementalList<T>(
  items: T[],
  initialCount = 10,
  batchSize = 10
) {
  const [displayedCount, setDisplayedCount] = useState(initialCount);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset to initial count whenever the underlying items array length changes (e.g. search filter applied)
  useEffect(() => {
    setDisplayedCount(initialCount);
  }, [items.length, initialCount]);

  const hasMore = displayedCount < items.length;

  const loadMore = useCallback(() => {
    if (hasMore) {
      setDisplayedCount((prev) => Math.min(prev + batchSize, items.length));
    }
  }, [hasMore, batchSize, items.length]);

  // IntersectionObserver to automatically load more as the sentinel is scrolled into view
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { root: null, rootMargin: '200px', threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadMore]);

  const visibleItems = useMemo(
    () => items.slice(0, displayedCount),
    [items, displayedCount]
  );

  return {
    visibleItems,
    hasMore,
    totalCount: items.length,
    displayedCount: Math.min(displayedCount, items.length),
    loadMore,
    sentinelRef,
  };
}

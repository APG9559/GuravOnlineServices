import { renderHook, act } from '@testing-library/react';
import useIsMobile from '../useIsMobile';

describe('useIsMobile', () => {
  it('returns true for mobile-sized viewport', () => {
    window.innerWidth = 500;
    const { result } = renderHook(() => useIsMobile(768));
    expect(result.current).toBe(true);
  });

  it('returns false for desktop-sized viewport', () => {
    window.innerWidth = 1024;
    const { result } = renderHook(() => useIsMobile(768));
    expect(result.current).toBe(false);
  });

  it('updates when matchMedia fires change event', () => {
    window.innerWidth = 1024;
    const { result } = renderHook(() => useIsMobile(768));
    expect(result.current).toBe(false);

    act(() => {
      const handler = (window as unknown as Record<string, unknown>).__matchMediaHandler;
      handler({ matches: true });
    });
    expect(result.current).toBe(true);
  });
});

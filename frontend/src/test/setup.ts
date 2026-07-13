import '@testing-library/jest-dom';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('max-width'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn((_event: string, handler: (...args: unknown[]) => void) => {
      (window as unknown as Record<string, unknown>).__matchMediaHandler = handler;
    }),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Image to fire onload immediately when src is set (needed for QR code, etc.)
const _OriginalImage = Image;
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  _src = '';
  width = 0;
  height = 0;
  constructor(width?: number, height?: number) {
    this.width = width ?? 0;
    this.height = height ?? 0;
  }
  get src() {
    return this._src;
  }
  set src(value: string) {
    this._src = value;
    if (this.onload) {
      setTimeout(() => this.onload!(), 0);
    }
  }
}
Object.defineProperty(globalThis, 'Image', {
  writable: true,
  value: MockImage,
});

import { nullifyEmptyStrings } from '../client';

describe('nullifyEmptyStrings', () => {
  it('returns null as-is', () => {
    expect(nullifyEmptyStrings(null)).toBeNull();
  });

  it('returns undefined as-is', () => {
    expect(nullifyEmptyStrings(undefined)).toBeUndefined();
  });

  it('converts empty string to null', () => {
    expect(nullifyEmptyStrings('')).toBeNull();
  });

  it('keeps non-empty string', () => {
    expect(nullifyEmptyStrings('hello')).toBe('hello');
  });

  it('keeps numbers and booleans', () => {
    expect(nullifyEmptyStrings(0)).toBe(0);
    expect(nullifyEmptyStrings(42)).toBe(42);
    expect(nullifyEmptyStrings(true)).toBe(true);
    expect(nullifyEmptyStrings(false)).toBe(false);
  });

  it('processes flat objects', () => {
    const input = { a: '', b: 'hello', c: null, d: undefined };
    const output = nullifyEmptyStrings(input);
    expect(output).toEqual({ a: null, b: 'hello', c: null, d: undefined });
  });

  it('processes arrays', () => {
    const input = ['', 'hello', '', null];
    const output = nullifyEmptyStrings(input);
    expect(output).toEqual([null, 'hello', null, null]);
  });

  it('processes nested objects', () => {
    const input = {
      user: { name: '', email: 'test@test.com' },
      tags: ['', 'active'],
    };
    const output = nullifyEmptyStrings(input);
    expect(output).toEqual({
      user: { name: null, email: 'test@test.com' },
      tags: [null, 'active'],
    });
  });
});

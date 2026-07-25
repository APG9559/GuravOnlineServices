/**
 * Shared formatting utilities for dates, currency, and API error messages.
 * Consolidates duplicated formatting logic from across the codebase.
 */

/**
 * Format a date string to DD-MM-YYYY display format.
 * Handles YYYY-MM-DD, YYYY/MM/DD, and ISO 8601 datetime strings.
 *
 * @param dateStr - A date string (e.g. "2024-05-15" or "2024-05-15T10:30:00Z")
 * @returns Formatted date string (e.g. "15-05-2024") or "—" if empty
 */
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';

  // Try YYYY-MM-DD or YYYY/MM/DD directly
  const matches = dateStr.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
  if (matches) {
    const [, year, month, day] = matches;
    return `${day}-${month}-${year}`;
  }

  // Handle ISO 8601 datetime strings (e.g. "2024-05-15T10:30:00Z")
  if (dateStr.includes('T')) {
    const datePart = dateStr.split('T')[0];
    const dateMatches = datePart.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
    if (dateMatches) {
      const [, year, month, day] = dateMatches;
      return `${day}-${month}-${year}`;
    }
  }

  return dateStr;
}

/**
 * Format a number as Indian Rupee currency (₹).
 *
 * @param amount - The numeric value to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted string (e.g. "₹1,50,000" or "₹1,500.00")
 */
export function formatINR(amount: number | string | null | undefined, decimals = 0): string {
  return `₹${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Extract a user-friendly error message from an API error (typically AxiosError).
 *
 * @param err - The caught error object
 * @param fallback - Fallback message if no meaningful message is found
 * @returns The extracted error message string
 */
export function getApiErrorMessage(err: unknown, fallback = 'An error occurred'): string {
  const e = err as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
  };
  const msg = e.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  return msg || e.message || fallback;
}

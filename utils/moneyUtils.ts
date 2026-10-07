/**
 * Money Input/Display Utilities for Supplier Accounting
 * Excel-like UX: raw edit on focus, formatted display on blur
 */

/**
 * Parse raw user input to number
 * Handles: "500", "1,234.56", "1.234,56" (European), empty string
 * Returns: number or null for empty/invalid input
 */
export function parseMoneyInput(raw: string): number | null {
  if (!raw || raw.trim() === '') {
    return null;
  }

  // Remove all whitespace
  const cleaned = raw.replace(/\s/g, '');

  // Handle empty after cleanup
  if (cleaned === '') {
    return null;
  }

  // Replace European decimal comma with dot if it's the last comma
  // "1.234,56" → "1234.56", but "1,234" → "1234"
  let normalized = cleaned;
  const lastCommaIndex = cleaned.lastIndexOf(',');
  const lastDotIndex = cleaned.lastIndexOf('.');

  if (lastCommaIndex > lastDotIndex && lastCommaIndex === cleaned.length - 3) {
    // Last comma is likely decimal separator (2 digits after)
    normalized = cleaned.substring(0, lastCommaIndex) + '.' + cleaned.substring(lastCommaIndex + 1);
  }

  // Remove all remaining commas (thousands separators)
  normalized = normalized.replace(/,/g, '');

  const parsed = parseFloat(normalized);

  // Return null for invalid numbers, 0 for valid zero
  return isNaN(parsed) ? null : parsed;
}

/**
 * Format number for display with thousands separators and 2 decimals
 * null/undefined → empty string, 0 → "0.00", 1234.56 → "1,234.56"
 */
export function formatMoneyDisplay(value: number | null | undefined): string {
  if (value == null) {
    return '';
  }

  // Ensure value is a valid number before calling toFixed
  const numValue = Number(value);
  if (!Number.isFinite(numValue)) {
    return '';
  }

  // Always show 2 decimals and add thousands separators
  return numValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Get display value for edit mode (raw user input)
 * For focus events - show what user actually typed
 */
export function getRawDisplayValue(value: number | null | undefined, lastUserInput?: string): string {
  // If we have the last user input and it parses to the same value, show that
  if (lastUserInput && parseMoneyInput(lastUserInput) === value) {
    return lastUserInput;
  }

  // Otherwise show formatted or empty
  if (value == null) {
    return '';
  }

  return value.toString();
}

/**
 * Prepare value for backend PATCH request
 * 0 → 0 (not null), null/undefined → null, invalid → null
 */
export function prepareMoneyForBackend(value: number | null | undefined): number | null {
  if (value == null || isNaN(value)) {
    return null;
  }

  // Explicitly preserve 0 as 0 (not null)
  return value;
}

/**
 * Format for readonly display cells (Remaining, Not Ordered)
 * Includes currency symbol and handles zero/negative values
 */
export function formatReadonlyMoney(value: number, currency: 'USD' | 'TL'): string {
  if (value <= 0) {
    return '-';
  }

  const formatted = formatMoneyDisplay(value);
  return currency === 'USD' ? `$${formatted}` : `₺${formatted}`;
}

/**
 * Format as user types - Excel-like behavior
 * Only format thousands separators, don't auto-add decimals
 * User must explicitly type "," or "." to enter decimal mode
 */
/**
 * Convert a Money2-like object { usd, tl } to a single USD-equivalent value.
 * totalDolar = usd + (tl / rate).  Returns null when rate <= 0.
 */
export function calcTotalDolar(
  m: { usd: number; tl: number },
  rate: number,
): number | null {
  if (!rate || rate <= 0) return null;
  return m.usd + m.tl / rate;
}

export function formatAsYouType(input: string, _previousValue: string = ''): string {
  if (!input || input.trim() === '') return '';

  // Remove existing thousands separators to work with raw numbers
  let cleaned = input.replace(/,/g, '');

  // Check if user typed a decimal separator (. or ,)
  const hasDecimalSeparator = cleaned.includes('.') || input.includes(',');

  if (hasDecimalSeparator) {
    // User wants decimal mode - convert comma to dot and handle decimals
    cleaned = cleaned.replace(/,/g, '.');

    // Handle multiple decimal points - keep only first one
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }

    // Split integer and decimal parts
    const [integerPart, decimalPart] = cleaned.split('.');

    // Format integer part with thousands separators
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    // Limit decimal part to 2 digits
    let formattedDecimal = decimalPart || '';
    if (formattedDecimal.length > 2) {
      formattedDecimal = formattedDecimal.substring(0, 2);
    }

    // Return with decimal point
    return formattedInteger + '.' + formattedDecimal;
  } else {
    // Integer mode only - just add thousands separators
    // Remove non-numeric characters
    cleaned = cleaned.replace(/[^0-9]/g, '');

    if (!cleaned) return '';

    // Add thousands separators
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}
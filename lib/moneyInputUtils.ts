/**
 * Money Input Utility Functions
 * Handles parsing and validation of monetary input values
 */

/**
 * Parse money input string to number or null
 * Handles various formats: $123, 123.45, 1,234.56, 1.234,56 (Turkish), etc.
 * 
 * @param raw - Raw input string
 * @returns Parsed number or null if invalid/empty
 */
export function parseMoneyInput(raw: string | number | null | undefined): number | null {
  // Handle null/undefined
  if (raw === null || raw === undefined) return null;
  
  // If already a number, return it if valid
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : null;
  }
  
  // Convert to string and trim
  const s = String(raw).trim();
  
  // Empty string returns null
  if (!s || s === '') return null;
  
  // Remove currency symbols, spaces, and keep only digits, comma, dot, minus
  const cleaned = s.replace(/[$₺\s]/g, '').trim();
  
  // If nothing left after cleaning, return null
  if (!cleaned) return null;
  
  // Handle different decimal separators
  // Turkish format: 1.234,56 -> 1234.56
  // US format: 1,234.56 -> 1234.56
  let normalized = cleaned;
  
  // Detect format by checking if comma comes after dot
  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');
  
  if (hasComma && hasDot) {
    // Both present - determine which is decimal separator
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    
    if (lastComma > lastDot) {
      // Turkish format: 1.234,56
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 1,234.56
      normalized = cleaned.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Only comma - assume decimal separator
    normalized = cleaned.replace(',', '.');
  }
  // If only dot, keep as is
  
  // Parse to number
  const num = Number(normalized);
  
  // Return null if NaN or not finite
  return Number.isFinite(num) ? num : null;
}

/**
 * Format money value for display
 * 
 * @param value - Number value to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string
 */
export function formatMoneyDisplay(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '';
  }
  
  return value.toFixed(decimals);
}

/**
 * Sanitize input while typing (allows only valid characters)
 * 
 * @param value - Current input value
 * @returns Sanitized value
 */
export function sanitizeMoneyInput(value: string): string {
  // Allow only numbers, single decimal point, and minus at start
  let sanitized = value.replace(/[^0-9.-]/g, '');
  
  // Ensure only one decimal point
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Ensure minus only at start
  if (sanitized.includes('-')) {
    const isNegative = sanitized.startsWith('-');
    sanitized = sanitized.replace(/-/g, '');
    if (isNegative) {
      sanitized = '-' + sanitized;
    }
  }
  
  return sanitized;
}

/**
 * Date formatting utilities for Projects-table
 * Ensures consistent date display across all components
 */

/**
 * Format date for cell display as dd/MM/yyyy
 * @param value - ISO date string or null/undefined
 * @returns Formatted date string or empty string
 */
export const formatDateCell = (value: string | null | undefined): string => {
  if (!value) {
    return '';
  }

  try {
    const date = new Date(value);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date value:', value);
      return '';
    }

    // Format as dd/MM/yyyy
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error, 'value:', value);
    return '';
  }
};

/**
 * Format date for API input (ISO format)
 * @param dateString - Date in dd/MM/yyyy format
 * @returns ISO date string for backend
 */
export const formatDateForAPI = (dateString: string): string => {
  if (!dateString) return '';

  try {
    // Parse dd/MM/yyyy format
    const parts = dateString.split('/');
    if (parts.length !== 3) return dateString; // Return as-is if not in expected format

    const [day, month, year] = parts;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    if (isNaN(date.getTime())) return dateString;

    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
  } catch (error) {
    console.error('Error formatting date for API:', error);
    return dateString;
  }
};
// Container utilities for parsing and formatting container names

export interface ContainerData {
  selectedNumbers: number[];
  displayText: string;
}

/**
 * Parse a container string like "CONTAINER 1, 2, 5" into an array of numbers [1, 2, 5]
 * Also handles free-text names (returns empty array for non-standard names)
 */
export function parseContainerString(containerStr: string | null | undefined): number[] {
  if (!containerStr || typeof containerStr !== 'string') {
    return [];
  }

  // Check if it matches the "CONTAINER N" pattern
  const match = containerStr.match(/^CONTAINER\s+(.+)$/i);
  if (!match) {
    return []; // Free-text name, not parseable as numbers
  }

  const numbersStr = match[1].trim();
  const numbers = numbersStr
    .split(',')
    .map(str => parseInt(str.trim(), 10))
    .filter(num => !isNaN(num) && num > 0);

  return numbers.sort((a, b) => a - b);
}

/**
 * Format an array of numbers into a container string like "CONTAINER 1, 2, 5"
 */
export function formatContainerString(numbers: number[]): string {
  if (!numbers || numbers.length === 0) {
    return '';
  }

  const sortedNumbers = [...numbers].sort((a, b) => a - b);
  return `CONTAINER ${sortedNumbers.join(', ')}`;
}

/**
 * Get container display text for UI
 * Returns the container name as-is (supports free-text names)
 */
export function getContainerDisplayText(containerStr: string | null | undefined): string {
  if (!containerStr || typeof containerStr !== 'string' || !containerStr.trim()) {
    return '';
  }
  return containerStr;
}

/**
 * Validate container numbers (1-20 range)
 */
export function isValidContainerNumber(num: number): boolean {
  return Number.isInteger(num) && num >= 1 && num <= 20;
}

/**
 * Generate available container options (1-20)
 */
export function getAvailableContainerNumbers(): number[] {
  return Array.from({ length: 20 }, (_, i) => i + 1);
}

/**
 * Toggle a number in the selection
 */
export function toggleContainerNumber(selectedNumbers: number[], numberToToggle: number): number[] {
  const currentIndex = selectedNumbers.indexOf(numberToToggle);

  if (currentIndex === -1) {
    return [...selectedNumbers, numberToToggle].sort((a, b) => a - b);
  } else {
    return selectedNumbers.filter(num => num !== numberToToggle);
  }
}

/**
 * Excel Status Color Utility
 *
 * Maps status values to Excel ARGB fill colors.
 * Source of truth: statusStyles.ts (same colors, adapted for ExcelJS)
 */

export interface ExcelFillColor {
  bg: string;  // ARGB hex without #
  fg: string;  // Font color ARGB hex without #
}

/** Convert CSS hex color (#dc2626) to Excel ARGB (dc2626) */
function cssToArgb(hex: string): string {
  return hex.replace('#', '');
}

/**
 * Returns Excel fill colors for a given status string.
 * Returns null if status has no special color (white/default).
 */
export function getStatusExcelFill(status: string | null | undefined): ExcelFillColor | null {
  if (!status) return null;

  const s = status.toString().toUpperCase().trim();

  switch (s) {
    case 'NOT ORDERED':
    case 'NOT_ORDERED':
      return { bg: cssToArgb('#dc2626'), fg: 'FFFFFF' };

    case 'TO ORDER':
    case 'TO_ORDER':
      return { bg: cssToArgb('#fb7185'), fg: '000000' };

    case 'HOLD BOOKS':
    case 'HOLD_BOOKS':
      return { bg: cssToArgb('#ea580c'), fg: 'FFFFFF' };

    case 'BOOKS IN PROGRESS':
    case 'BOOKS_IN_PROGRESS':
      return { bg: cssToArgb('#0ea5e9'), fg: 'FFFFFF' };

    case 'ORDERED':
      return { bg: cssToArgb('#2563eb'), fg: 'FFFFFF' };

    case 'WAITING PAYMENT':
    case 'WAITING_PAYMENT':
      return { bg: cssToArgb('#a855f7'), fg: 'FFFFFF' };

    case 'ASSEMBLY':
      return { bg: cssToArgb('#fbbf24'), fg: '000000' };

    case 'READY TO RECEIVE':
    case 'READY_TO_RECEIVE':
      return { bg: cssToArgb('#f97316'), fg: 'FFFFFF' };

    case 'RECEIVED':
      return { bg: cssToArgb('#fb923c'), fg: '000000' };

    case 'READY':
      return { bg: cssToArgb('#86efac'), fg: '000000' };

    case 'SENT TO TLINES':
    case 'SENT_TO_TLINES':
    case 'SENT':
      return { bg: cssToArgb('#15803d'), fg: 'FFFFFF' };

    case 'NOT SIGNED':
    case 'NOT_SIGNED':
      return { bg: cssToArgb('#ff0000'), fg: '000000' };

    case 'READY TO SIGN':
    case 'READY_TO_SIGN':
      return { bg: cssToArgb('#ffff00'), fg: '000000' };

    case 'SIGNED':
      return { bg: cssToArgb('#92d050'), fg: '000000' };

    case 'WAITING TLINES TO SIGN':
    case 'WAITING_TLINES_TO_SIGN':
      return { bg: cssToArgb('#fb923c'), fg: '000000' };

    case 'WAITING T TO SIGN':
    case 'WAITING_T_TO_SIGN':
      return { bg: cssToArgb('#a78bfa'), fg: '000000' };

    case 'SIGNED WITH EST PRICE':
    case 'SIGNED_WITH_EST_PRICE':
      return { bg: cssToArgb('#4ade80'), fg: '000000' };

    default:
      return null;
  }
}

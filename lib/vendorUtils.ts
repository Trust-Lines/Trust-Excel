/**
 * Vendor Utilities
 * 
 * Canonical functions for extracting and comparing vendor codes
 */

/**
 * Extract vendor code from various vendor formats
 * 
 * Handles:
 * - Object: { code: "YSM", ... } or { vendorCode: "YSM", ... }
 * - String: "YSM - Yaşam Plus" → extracts "YSM"
 * - String: "YSM" → returns "YSM"
 * 
 * @param vendor - Vendor in any format
 * @returns Uppercase vendor code or null
 */
export function extractVendorCode(vendor: any): string | null {
  if (!vendor) return null;

  // 1) vendor object from backend include
  if (typeof vendor === 'object') {
    if (vendor.code) return String(vendor.code).trim().toUpperCase();
    if (vendor.vendorCode) return String(vendor.vendorCode).trim().toUpperCase();
  }

  // 2) string form: "YSM - Yaşam Plus" or just "YSM"
  if (typeof vendor === 'string') {
    const s = vendor.trim();
    // Split by " - " and take first part (vendor code)
    const code = s.split(' - ')[0]?.trim();
    return code ? code.toUpperCase() : null;
  }

  return null;
}

/**
 * Check if vendor matches the target vendor code (exact match, case-insensitive)
 * 
 * @param vendor - Vendor in any format
 * @param targetCode - Target vendor code (e.g., "YSM")
 * @returns true if vendor matches target code exactly
 */
export function vendorMatches(vendor: any, targetCode: string): boolean {
  const extracted = extractVendorCode(vendor);
  const target = targetCode.trim().toUpperCase();
  return extracted === target;
}

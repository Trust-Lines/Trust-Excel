/**
 * Payload Sanitization Helper
 *
 * Removes UI-only fields that should not be sent to the backend API.
 * Provides protection against validation errors from unknown fields.
 */

// Fields that should be removed before sending to API
const UI_ONLY_FIELDS = [
  'customTypeLabel',    // UI display name for custom types
  'uiId',              // Frontend-only unique identifier
  'tempId',            // Temporary ID for optimistic updates
  '__source',          // Debug tracking property
  'createdAt',         // Should be set by backend
  'updatedAt',         // Should be set by backend
] as const;

/**
 * Removes UI-only fields from payload before API calls
 * @param payload - Object to sanitize
 * @returns Cleaned payload without UI-only fields
 */
export function sanitizePayload<T extends Record<string, any>>(payload: T): Omit<T, typeof UI_ONLY_FIELDS[number]> {
  const cleaned = { ...payload };

  // Remove UI-only fields
  for (const field of UI_ONLY_FIELDS) {
    delete cleaned[field];
  }

  return cleaned;
}

/**
 * Sanitizes payload for project item creation/updates
 * Handles both standard and custom type items
 * @param payload - Project item payload
 * @returns Sanitized payload ready for API
 */
export function sanitizeProjectItemPayload<T extends Record<string, any>>(payload: T): T {
  const cleaned = { ...payload };

  // Remove UI-only fields
  for (const field of UI_ONLY_FIELDS) {
    delete cleaned[field];
  }

  // Ensure proper type/customTypeId handling if these fields exist
  const typedCleaned = cleaned as any;
  if (typedCleaned.customTypeId) {
    // For custom types: ensure type is null
    typedCleaned.type = null;
  } else if (typedCleaned.type) {
    // For standard types: ensure customTypeId is null
    typedCleaned.customTypeId = null;
  }

  return cleaned;
}

/**
 * Type guard to check if payload contains UI-only fields
 * @param payload - Object to check
 * @returns True if payload has any UI-only fields
 */
export function hasUIOnlyFields(payload: Record<string, any>): boolean {
  return UI_ONLY_FIELDS.some(field => field in payload);
}
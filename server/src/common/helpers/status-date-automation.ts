/**
 * Sequential Status → Date Engine.
 *
 * Centralises status-driven date automation so every item service
 * uses exactly the same rules.
 *
 * STATUS SEQUENCE (ordered):
 *   ORDERED → WAITING_PAYMENT → READY_TO_RECEIVE → RECEIVED →
 *   READY → SENT_TO_TLINES → PARTIAL_SENT → SENT
 *
 * FORWARD JUMP:  All dates from index 0 up to target are auto-filled
 *                (only if not already set).
 * BACKWARD JUMP: Dates up to new target are kept/filled,
 *                all dates AFTER the target are CLEARED.
 *
 * Non-sequence statuses (HOLD_T, HOLD_PM, NOT_ORDERED, ASSEMBLY)
 * produce no date changes.
 *
 * ETD is NEVER touched (manual-only).
 */

export interface StatusDateItem {
  std?: Date | null;
  etd?: Date | null;
  rtr?: Date | null;
  rtrd?: Date | null;
  rtd?: Date | null;
  rdy?: Date | null;
  ftd?: Date | null;
  snd?: Date | null;
  [key: string]: any;
}

export interface StatusDateOptions {
  /** Which field the model uses for "ready-to-receive" date */
  rtrField?: 'rtr' | 'rtrd';
  /** Whether the model has an rtd column at all */
  hasRtd?: boolean;
}

/**
 * Ordered statuses that participate in date automation.
 * dateField is the DB column auto-set when entering that status.
 * null means no date is tied to that status.
 */
const STATUS_SEQUENCE: Array<{ status: string; dateField: string | null }> = [
  { status: 'ORDERED',           dateField: 'std' },
  { status: 'WAITING_PAYMENT',   dateField: null },
  { status: 'READY_TO_RECEIVE',  dateField: '__rtr__' }, // placeholder, resolved via opts
  { status: 'RECEIVED',          dateField: 'rtd' },
  { status: 'READY',             dateField: 'rdy' },
  { status: 'SENT_TO_TLINES',    dateField: 'ftd' },
  { status: 'PARTIAL_SENT',      dateField: null },
  { status: 'SENT',              dateField: 'snd' },
];

/**
 * Resolve the actual date field for a sequence entry, taking model-specific
 * options into account.
 */
function resolveDateField(
  entry: (typeof STATUS_SEQUENCE)[0],
  rtrField: string,
  hasRtd: boolean,
): string | null {
  if (entry.status === 'READY_TO_RECEIVE') return rtrField;
  if (entry.status === 'RECEIVED' && !hasRtd) return null;
  return entry.dateField;
}

export function applySequentialStatusEngine(
  prevStatus: string | null | undefined,
  newStatus: string | null | undefined,
  existingItem: StatusDateItem,
  opts?: StatusDateOptions,
): Record<string, Date | null> {
  if (!newStatus) return {};

  // Same status re-selected: still fill any missing dates up to that level
  // (handles cases where dates were never set, e.g. status was set before automation existed)

  const rtrField = opts?.rtrField ?? 'rtr';
  const hasRtd = opts?.hasRtd ?? true;

  const newIndex = STATUS_SEQUENCE.findIndex(s => s.status === newStatus);

  // NOT_ORDERED or PRE_PROJECT: Clear ALL sequential dates (full reset)
  if (newStatus === 'NOT_ORDERED' || newStatus === 'PRE_PROJECT') {
    const result: Record<string, Date | null> = {};
    for (const entry of STATUS_SEQUENCE) {
      const field = resolveDateField(entry, rtrField, hasRtd);
      if (field) {
        result[field] = null;
      }
    }
    return result;
  }

  // Other non-sequence statuses (HOLD_T, HOLD_PM, ASSEMBLY) → no date changes
  if (newIndex < 0) return {};

  const prevIndex = STATUS_SEQUENCE.findIndex(s => s.status === prevStatus);
  const now = new Date();
  const result: Record<string, Date | null> = {};

  const isBackward = prevIndex >= 0 && newIndex < prevIndex;

  // Fill dates from index 0 up to newIndex (if not already set)
  for (let i = 0; i <= newIndex; i++) {
    const field = resolveDateField(STATUS_SEQUENCE[i], rtrField, hasRtd);
    if (field && !existingItem[field]) {
      result[field] = now;
    }
  }

  // BACKWARD: Clear all dates AFTER newIndex (unconditionally)
  if (isBackward) {
    for (let i = newIndex + 1; i < STATUS_SEQUENCE.length; i++) {
      const field = resolveDateField(STATUS_SEQUENCE[i], rtrField, hasRtd);
      if (field) {
        result[field] = null;
      }
    }
  }

  return result;
}

/** Backward-compatible alias — all existing call sites continue to work. */
export const applyStatusDateAutomation = applySequentialStatusEngine;

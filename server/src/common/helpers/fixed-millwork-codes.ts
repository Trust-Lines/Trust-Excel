/**
 * Millwork PF codes for vendors with `fixedMillworkCodes` (GOS, TDR, YSM — set in vendor settings).
 *
 * M01–M03 are reserved for the three standard order types, even when a project
 * doesn't use them; every other Millwork item for that vendor+project numbers
 * from M04 upwards:
 *   STANDARD / BASIC                         → M01
 *   STANDARD / SELECTIVE                     → M02
 *   CUSTOM / SELECTIVE (or SELECTIVE / CUSTOM) → M03
 *   anything else (IMAGE, FURNITURE, no order type, …) → M04, M05, …
 *
 * Items sharing one of the three standard order types share its code on purpose.
 */

export const FIRST_OPEN_MILLWORK_INDEX = 4;

/** Reserved index (1–3) for a standard order type, or null for everything else. */
export function reservedMillworkIndex(orderType?: string | null): number | null {
  if (!orderType) return null;
  // Compare on letters only, so "STANDARD / BASIC", "Standard/Basic", "STANDARD BASIC" all match,
  // while e.g. "CUSTOM ITEMS" does not.
  const key = orderType.toUpperCase().replace(/[^A-Z]/g, '');
  switch (key) {
    case 'STANDARDBASIC': return 1;
    case 'STANDARDSELECTIVE': return 2;
    case 'CUSTOMSELECTIVE':
    case 'SELECTIVECUSTOM': return 3;
    default: return null;
  }
}

/**
 * Lowest unused index (≥ 4) among the codes that end in `<letter><digits>`, so a number
 * freed by deleting or re-typing an item is handed out again.
 * `existingCodes` should be limited to the same vendor + project + Millwork and to
 * items that are NOT in the trash (deleted items don't hold their number).
 */
export function nextOpenMillworkIndex(existingCodes: Array<string | null | undefined>, letter = 'M'): number {
  const re = new RegExp(`-${letter}(\\d+)$`);
  const used = new Set<number>();
  for (const code of existingCodes) {
    const m = code?.match(re);
    if (m) used.add(parseInt(m[1], 10));
  }
  let n = FIRST_OPEN_MILLWORK_INDEX;
  while (used.has(n)) n++;
  return n;
}

/**
 * An item that already holds its own open code (M04+) under `prefix` keeps it when it
 * moves between non-standard order types, instead of jumping to a new number.
 */
export function keepOwnOpenCode(currentPfCode: string | null | undefined, prefix: string): string | null {
  if (!currentPfCode?.startsWith(prefix)) return null;
  const m = currentPfCode.slice(prefix.length).match(/^(\d+)$/);
  return m && parseInt(m[1], 10) >= FIRST_OPEN_MILLWORK_INDEX ? currentPfCode : null;
}

export function formatIndex(n: number): string {
  return n.toString().padStart(2, '0');
}

# Trust System — Projects page source (for T-ERP)

Generated 2026-10-30 from the Trust-Lines/Trust-Excel repo.
Every file the Projects page (`pages/OperationalBoard.tsx`) imports, plus the global `styles.css`.
Paths are relative to the repo root; recreate them as they are so the relative imports keep working.

Third-party packages used by these files: `react` 18, `react-dom`, `react-router-dom` 7,
`@supabase/supabase-js` 2 (live updates), `exceljs` 4 + `file-saver` 2 (Excel export), `lodash`, `lucide-react`, `uuid`.

## Index

| File | Line in this document | Size |
|---|---|---|
| `components/AccessDenied.tsx` | 92 | 1.9 KB |
| `components/AccountingColumns.tsx` | 164 | 8.1 KB |
| `components/AddProjectDrawer.tsx` | 476 | 27.0 KB |
| `components/AddToGroupModal.tsx` | 1244 | 8.7 KB |
| `components/AddVendorModal.tsx` | 1449 | 10.5 KB |
| `components/CellOrderTypeAutocomplete.tsx` | 1806 | 11.0 KB |
| `components/CellStatusAutocomplete.tsx` | 2176 | 11.4 KB |
| `components/CellVendorAutocomplete.tsx` | 2526 | 19.5 KB |
| `components/ContainerCellEditor.tsx` | 3073 | 15.5 KB |
| `components/FilterBar.tsx` | 3501 | 26.6 KB |
| `components/FilterEditMenu.tsx` | 4318 | 3.0 KB |
| `components/GroupedPfTable.tsx` | 4412 | 4.4 KB |
| `components/HalfAssignmentToolbar.tsx` | 4524 | 4.1 KB |
| `components/InlineEditPanel.tsx` | 4672 | 22.6 KB |
| `components/InlineEditors.tsx` | 5346 | 12.6 KB |
| `components/OperationalBoardGrid.tsx` | 5768 | 38.2 KB |
| `components/OrderTypeDropdownField.tsx` | 6713 | 10.7 KB |
| `components/PaymentRuleDropdownEditor.tsx` | 7053 | 8.6 KB |
| `components/PfGroupFilterControl.tsx` | 7333 | 2.3 KB |
| `components/PfGroupManageModal.tsx` | 7412 | 10.4 KB |
| `components/ProjectBlock.tsx` | 7614 | 206.0 KB |
| `components/ProjectHeader.tsx` | 11934 | 0.9 KB |
| `components/ProjectMenu.tsx` | 11974 | 18.0 KB |
| `components/SectionSeparator.tsx` | 12423 | 0.3 KB |
| `components/SignWaitingFilters.tsx` | 12445 | 2.2 KB |
| `components/StockUsageModal.tsx` | 12503 | 16.7 KB |
| `components/TodayPfControl.tsx` | 12803 | 3.2 KB |
| `components/TodayPfManageModal.tsx` | 12911 | 24.4 KB |
| `components/TrustStockContentsModal.tsx` | 13419 | 22.1 KB |
| `components/VendorDropdownField.tsx` | 13775 | 13.8 KB |
| `components/ui/AnchoredDropdown.tsx` | 14205 | 8.7 KB |
| `constants.ts` | 14475 | 0.2 KB |
| `contexts/AuthContext.tsx` | 14485 | 8.3 KB |
| `contexts/PaymentRulesContext.tsx` | 14755 | 2.3 KB |
| `contexts/SocketContext.tsx` | 14838 | 6.1 KB |
| `hooks/useColumnPermissions.ts` | 15050 | 5.8 KB |
| `hooks/useLivePatchStore.ts` | 15229 | 8.7 KB |
| `hooks/usePagePermissions.ts` | 15485 | 2.2 KB |
| `hooks/useSocketEvent.ts` | 15558 | 0.6 KB |
| `hooks/useUndoStack.ts` | 15588 | 5.6 KB |
| `lib/api.ts` | 15783 | 3.6 KB |
| `lib/auth.ts` | 15916 | 6.5 KB |
| `lib/columns.ts` | 16180 | 7.2 KB |
| `lib/containers.ts` | 16481 | 4.6 KB |
| `lib/dateUtils.ts` | 16669 | 1.7 KB |
| `lib/direct-orders.ts` | 16736 | 5.4 KB |
| `lib/displayHelpers.ts` | 16925 | 1.8 KB |
| `lib/expenses-direct-order.ts` | 16988 | 5.3 KB |
| `lib/expenses-missing-extra.ts` | 17149 | 5.3 KB |
| `lib/expenses-p.ts` | 17310 | 5.5 KB |
| `lib/gridWidth.ts` | 17479 | 2.4 KB |
| `lib/missing-extra.ts` | 17595 | 9.9 KB |
| `lib/payment-rules.ts` | 17901 | 1.1 KB |
| `lib/pf-groups.ts` | 17954 | 3.7 KB |
| `lib/projectColor.ts` | 18077 | 10.0 KB |
| `lib/projectTotalApi.ts` | 18411 | 4.0 KB |
| `lib/projects.ts` | 18539 | 27.0 KB |
| `lib/sanitizePayload.ts` | 19384 | 2.1 KB |
| `lib/today-pf.ts` | 19459 | 2.5 KB |
| `lib/trust-stock.ts` | 19536 | 14.9 KB |
| `pages/OperationalBoard.tsx` | 19951 | 36.9 KB |
| `types.ts` | 20976 | 9.7 KB |
| `types/expensesDirectOrder.ts` | 21267 | 1.4 KB |
| `types/expensesMissingExtra.ts` | 21324 | 1.4 KB |
| `types/expensesP.ts` | 21382 | 1.3 KB |
| `types/projectTotal.ts` | 21439 | 0.4 KB |
| `utils/containerUtils.ts` | 21469 | 2.3 KB |
| `utils/excel/exportProjectTotalExcel.ts` | 21556 | 11.0 KB |
| `utils/excel/exportProjectsAllTabsExcel.ts` | 21848 | 8.0 KB |
| `utils/excel/exportProjectsExcel.ts` | 22079 | 19.2 KB |
| `utils/excel/statusColorsExcel.ts` | 22549 | 2.6 KB |
| `utils/filterUtils.ts` | 22651 | 7.1 KB |
| `utils/moneyUtils.ts` | 22853 | 5.1 KB |
| `utils/statusStyles.ts` | 23027 | 4.2 KB |
| `styles.css` | 23220 | 101.0 KB |

---

## FILE: components/AccessDenied.tsx

```tsx
import React from 'react';

interface AccessDeniedProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  title = 'Access Denied',
  message = 'You do not have permission to access this page. Please contact your administrator if you believe this is an error.',
  icon,
}) => {
  const defaultIcon = (
    <svg
      className="w-16 h-16 text-red-500 mx-auto mb-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-6V9m0 0V7m0 2h2m-2 0H10m7-1a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {icon || defaultIcon}

        <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>

        <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>

        <div className="space-y-3">
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>

          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Need access? Contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
```

---

## FILE: components/AccountingColumns.tsx

```tsx
import React, { useState, useCallback } from 'react';

/**
 * Accounting data per item (row-level)
 */
export interface RowAccountingData {
  itemId: string;
  paidUsd1: number;
  paidUsd2: number;
  paidTl1: number;
  paidTl2: number;
  // Calculated fields
  remainingUsd: number;
  remainingTl: number;
  notOrderedUsd: number;
  notOrderedTl: number;
  showNotSignedRemaining: boolean;
}

/**
 * Calculate accounting values for a single row
 */
export function calculateRowAccounting(
  itemId: string,
  _pfUsd: number,
  pfTl: number,
  status: string,
  pfSignStatus: string,
  paidUsd1: number,
  paidUsd2: number,
  paidTl1: number,
  paidTl2: number,
  invoice: number = 0,
): RowAccountingData {
  const paidUsdTotal = paidUsd1 + paidUsd2;
  const paidTlTotal = paidTl1 + paidTl2;

  // Invoice replaces pfUsd/pfTl as the base amount.
  // Determine currency from pf values: if pfTl > 0 it's a TL deal, otherwise USD.
  const invoiceAsTl = pfTl > 0 ? invoice : 0;
  const invoiceAsUsd = pfTl > 0 ? 0 : invoice;

  let remainingUsd = Math.max(invoiceAsUsd - paidUsdTotal, 0);
  let remainingTl = Math.max(invoiceAsTl - paidTlTotal, 0);
  let notOrderedUsd = 0;
  let notOrderedTl = 0;
  let showNotSignedRemaining = false;

  // Classification logic
  if (status === 'NOT ORDERED') {
    // Rule 1: NOT_ORDERED -> amounts go to Not Ordered columns
    notOrderedUsd = remainingUsd;
    notOrderedTl = remainingTl;
    remainingUsd = 0;
    remainingTl = 0;
  } else if (pfSignStatus !== 'SIGNED') {
    // Rule 2: Not signed -> show indicator in Remaining
    showNotSignedRemaining = true;
  }
  // Rule 3: Signed and not NOT_ORDERED -> show in Remaining (default)

  return {
    itemId,
    paidUsd1,
    paidUsd2,
    paidTl1,
    paidTl2,
    remainingUsd,
    remainingTl,
    notOrderedUsd,
    notOrderedTl,
    showNotSignedRemaining
  };
}

/**
 * Format currency value with thousands separator and 2 decimals
 */
export function formatAccountingValue(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) {
    return '-';
  }
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Accounting cell - editable numeric input for paid amounts (Excel gold style)
 */
export const EditableAccountingCell: React.FC<{
  value: number;
  currency: string;
  onSave: (value: number) => void;
  editable: boolean;
}> = ({ value, currency, onSave, editable }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());

  const handleClick = () => {
    if (editable) {
      setIsEditing(true);
      setEditValue(value.toString());
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    const trimmed = editValue.trim();
    const numValue = trimmed === '' ? 0 : (parseFloat(trimmed) || 0);
    if (numValue !== value) {
      onSave(numValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value.toString());
    }
  };

  if (isEditing) {
    return (
      <input
        type="number"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        style={{
          width: '100%',
          height: '100%',
          border: '2px solid #d4af37',
          padding: '4px 8px',
          fontSize: '13px',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
          backgroundColor: '#fef3c7'
        }}
      />
    );
  }

  return (
    <div
      onClick={handleClick}
      className={editable ? 'accounting-data-cell accounting-data-cell-editable' : 'accounting-data-cell'}
    >
      <span className="accounting-currency-icon">{currency}</span>
      <span>{formatAccountingValue(value)}</span>
    </div>
  );
};

/**
 * Read-only accounting cell for calculated values (Excel gold style)
 */
export const ReadOnlyAccountingCell: React.FC<{
  value: number;
  currency: string;
  showNotSigned?: boolean;
}> = ({ value, currency, showNotSigned = false }) => {
  if (showNotSigned) {
    return (
      <div className="accounting-not-signed">
        NOT SIGNED
      </div>
    );
  }

  return (
    <div className="accounting-data-cell">
      <span className="accounting-currency-icon">{currency}</span>
      <span>{formatAccountingValue(value)}</span>
    </div>
  );
};

/**
 * Accounting row cells - renders all 8 accounting columns for a single row
 */
export const AccountingRowCells: React.FC<{
  rowData: RowAccountingData;
  onPaidUpdate: (field: 'paidUsd1' | 'paidUsd2' | 'paidTl1' | 'paidTl2', value: number) => void;
  editable: boolean;
}> = ({ rowData, onPaidUpdate, editable }) => {
  return (
    <>
      {/* Paid USD 1st */}
      <div className="row-cell col-accounting-paid-usd-1">
        <EditableAccountingCell
          value={rowData.paidUsd1}
          currency="$"
          onSave={(val) => onPaidUpdate('paidUsd1', val)}
          editable={editable}
        />
      </div>

      {/* Paid USD 2nd */}
      <div className="row-cell col-accounting-paid-usd-2">
        <EditableAccountingCell
          value={rowData.paidUsd2}
          currency="$"
          onSave={(val) => onPaidUpdate('paidUsd2', val)}
          editable={editable}
        />
      </div>

      {/* Paid TL 1st */}
      <div className="row-cell col-accounting-paid-tl-1">
        <EditableAccountingCell
          value={rowData.paidTl1}
          currency="₺"
          onSave={(val) => onPaidUpdate('paidTl1', val)}
          editable={editable}
        />
      </div>

      {/* Paid TL 2nd */}
      <div className="row-cell col-accounting-paid-tl-2">
        <EditableAccountingCell
          value={rowData.paidTl2}
          currency="₺"
          onSave={(val) => onPaidUpdate('paidTl2', val)}
          editable={editable}
        />
      </div>

      {/* Remaining USD */}
      <div className="row-cell col-accounting-remaining-usd">
        <ReadOnlyAccountingCell
          value={rowData.remainingUsd}
          currency="$"
          showNotSigned={rowData.showNotSignedRemaining}
        />
      </div>

      {/* Remaining TL */}
      <div className="row-cell col-accounting-remaining-tl">
        <ReadOnlyAccountingCell
          value={rowData.remainingTl}
          currency="₺"
          showNotSigned={rowData.showNotSignedRemaining}
        />
      </div>

      {/* Not Ordered USD */}
      <div className="row-cell col-accounting-not-ordered-usd">
        <ReadOnlyAccountingCell
          value={rowData.notOrderedUsd}
          currency="$"
        />
      </div>

      {/* Not Ordered TL */}
      <div className="row-cell col-accounting-not-ordered-tl">
        <ReadOnlyAccountingCell
          value={rowData.notOrderedTl}
          currency="₺"
        />
      </div>
    </>
  );
};

/**
 * Hook to manage paid amounts state
 */
export function useAccountingState() {
  const [paidAmounts, setPaidAmounts] = useState<Map<string, {
    paidUsd1: number;
    paidUsd2: number;
    paidTl1: number;
    paidTl2: number;
  }>>(new Map());

  const getPaidAmounts = useCallback((itemId: string) => {
    return paidAmounts.get(itemId) || {
      paidUsd1: 0,
      paidUsd2: 0,
      paidTl1: 0,
      paidTl2: 0
    };
  }, [paidAmounts]);

  const updatePaidAmount = useCallback((
    itemId: string,
    field: 'paidUsd1' | 'paidUsd2' | 'paidTl1' | 'paidTl2',
    value: number
  ) => {
    setPaidAmounts(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(itemId) || { paidUsd1: 0, paidUsd2: 0, paidTl1: 0, paidTl2: 0 };
      newMap.set(itemId, { ...current, [field]: value });
      return newMap;
    });
  }, []);

  return { getPaidAmounts, updatePaidAmount };
}
```

---

## FILE: components/AddProjectDrawer.tsx

```tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ProjectType } from '../types';

const SECTION_OPTIONS = [
  { value: 'TLINES_NE', label: 'TLines NE' },
  { value: 'TLINES_SE', label: 'TLines SE' },
  { value: 'TLINES_NW', label: 'TLines NW' },
  { value: 'CVW', label: 'TLines CVW' },
  { value: 'TLINES_HQ', label: 'TLines HQ' },
  { value: 'TLINES_TC', label: 'TLines TC' }
];

const DROPBOX_SECTIONS = ['1-Store Maker', '2-Premium Store Fitout', '3-Design & Build', '4-T Shop'];
const DROPBOX_REGIONS = ['T Lines CVW Projects', 'T Lines NE Projects', 'T Lines NW Projects', 'T Lines SE Projects'];
const DROPBOX_STATUSES = ['Under Working', 'Done'];
const DROPBOX_CLIENT_TYPES = ['Clients', 'Individuals'];

const TYPE_OPTIONS: { value: ProjectType; label: string }[] = [
  { value: 'Millwork', label: 'Millwork' },
  { value: 'Shelving', label: 'Shelving' },
  { value: 'Ceiling', label: 'Ceiling' },
  { value: 'Furniture', label: 'Furniture' },
  { value: 'Image', label: 'Image' },
  { value: 'Decoration', label: 'Decoration' }
];

export interface NewProjectData {
  sectionId: string;
  projectNumber: number | string;
  projectName: string;
  address: string;
  selectedTypes: ProjectType[];
  customTypes: string[];
  dropboxSection?: string;
  dropboxRegion?: string;
  dropboxStatus?: string;
  dropboxClientType?: string;
  clientName?: string;
}

interface AddProjectDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (data: NewProjectData) => Promise<{ success: boolean; error?: string }>;
  existingProjectNumbers: Record<string, number[]>; // sectionId -> project numbers
  mode?: 'projects' | 'directOrder'; // NEW: for Direct Order, allow text input
}

const AddProjectDrawer: React.FC<AddProjectDrawerProps> = ({
  isOpen,
  onClose,
  onCreateProject,
  existingProjectNumbers,
  mode = 'projects'
}) => {
  const [formData, setFormData] = useState({
    sectionId: 'TLINES_SE',
    projectNumber: '',
    projectName: '',
    address: '',
    selectedTypes: [] as ProjectType[],
    customTypes: [] as string[],
    selectedCustomTypes: [] as string[],
    customTypeInput: '',
    dropboxSection: '',
    dropboxRegion: '',
    dropboxStatus: '',
    dropboxClientType: '',
    clientName: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOverlayClick = (_event: React.MouseEvent) => {
    // Do nothing — only close via X button or Cancel
  };

  const handleTypeToggle = (type: ProjectType) => {
    setFormData(prev => ({
      ...prev,
      selectedTypes: prev.selectedTypes.includes(type)
        ? prev.selectedTypes.filter(t => t !== type)
        : [...prev.selectedTypes, type]
    }));
  };

  const handleCustomTypeToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      selectedCustomTypes: prev.selectedCustomTypes.includes(type)
        ? prev.selectedCustomTypes.filter(t => t !== type)
        : [...prev.selectedCustomTypes, type]
    }));
  };

  const handleAddCustomType = () => {
    const customType = formData.customTypeInput.trim();
    if (!customType) return;

    // Case-insensitive duplicate check
    const existingCustomTypes = formData.customTypes.map(t => t.toLowerCase());
    if (existingCustomTypes.includes(customType.toLowerCase())) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      customTypes: [...prev.customTypes, customType],
      selectedCustomTypes: [...prev.selectedCustomTypes, customType],
      customTypeInput: ''
    }));

    // Focus back to input for quick adding
    setTimeout(() => {
      const input = document.querySelector('input[placeholder="Add custom type..."]') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 0);
  };

  const handleRemoveCustomType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      customTypes: prev.customTypes.filter(t => t !== type),
      selectedCustomTypes: prev.selectedCustomTypes.filter(t => t !== type)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Project number validation
    if (mode === 'directOrder') {
      // Direct Order: Accept text input (e.g., "DO-01")
      if (!formData.projectNumber || formData.projectNumber.trim() === '') {
        newErrors.projectNumber = 'Project number is required';
      }
    } else {
      // Projects: Accept any non-empty string (e.g. "301", "234-per", etc.)
      if (!formData.projectNumber || formData.projectNumber.trim() === '') {
        newErrors.projectNumber = 'Project number is required';
      } else {
        // Check for duplicate project number in the selected section
        const existingNumbers = existingProjectNumbers[formData.sectionId] || [];
        const trimmed = formData.projectNumber.trim();
        const asNum = parseInt(trimmed);
        if (!isNaN(asNum) && existingNumbers.includes(asNum)) {
          newErrors.projectNumber = `Project number ${trimmed} already exists in ${SECTION_OPTIONS.find(s => s.value === formData.sectionId)?.label}`;
        }
      }
    }

    // Project name validation
    if (!formData.projectName.trim()) {
      newErrors.projectName = 'Project name is required';
    }

    // Types validation
    const totalTypes = formData.selectedTypes.length + formData.selectedCustomTypes.length;
    if (totalTypes === 0) {
      newErrors.types = 'At least one type must be selected or added';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await onCreateProject({
        sectionId: formData.sectionId,
        projectNumber: formData.projectNumber.trim(),
        projectName: formData.projectName.trim(),
        address: formData.address.trim(),
        selectedTypes: formData.selectedTypes,
        customTypes: formData.selectedCustomTypes,
        dropboxSection: formData.dropboxSection || undefined,
        dropboxRegion: formData.dropboxRegion || undefined,
        dropboxStatus: formData.dropboxStatus || undefined,
        dropboxClientType: formData.dropboxClientType || undefined,
        clientName: formData.clientName.trim() || undefined,
      });

      // Debug log for backend payload

      if (result.success) {
        // Reset form and close drawer
        setFormData({
          sectionId: 'TLINES_SE',
          projectNumber: '',
          projectName: '',
          address: '',
          selectedTypes: [],
          customTypes: [],
          selectedCustomTypes: [],
          customTypeInput: '',
          dropboxSection: '',
          dropboxRegion: '',
          dropboxStatus: '',
          dropboxClientType: '',
          clientName: '',
        });
        setErrors({});
        onClose();
      } else {
        setErrors({ submit: result.error || 'Failed to create project' });
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' });
    }

    setIsSubmitting(false);
  };

  const handleCancel = () => {
    setFormData({
      sectionId: 'TLINES_SE',
      projectNumber: '',
      projectName: '',
      address: '',
      selectedTypes: [],
      customTypes: [],
      selectedCustomTypes: [],
      customTypeInput: '',
      dropboxSection: '',
      dropboxRegion: '',
      dropboxStatus: '',
      dropboxClientType: '',
      clientName: '',
    });
    setErrors({});
    onClose();
  };

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 15000,
        padding: '16px'
      }}
      onClick={handleOverlayClick}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '600',
              color: '#2c3e50'
            }}
          >
            Add New Project
          </h2>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#999',
              padding: '0',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content - Scrollable */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1
          }}
        >
          <form onSubmit={handleSubmit} id="add-project-form">
            {/* Section Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}
              >
                Section <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: '#fff'
                }}
                value={formData.sectionId}
                onChange={(e) => setFormData(prev => ({ ...prev, sectionId: e.target.value }))}
              >
                {SECTION_OPTIONS.map(section => (
                  <option key={section.value} value={section.value}>
                    {section.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Project Number */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}
              >
                Project Number <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${errors.projectNumber ? '#dc2626' : '#d1d5db'}`,
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: '#fff'
                }}
                value={formData.projectNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, projectNumber: e.target.value }))}
                placeholder={mode === 'directOrder' ? 'e.g. DO-01, DO-02' : 'e.g. 301, 234-per'}
              />
              {errors.projectNumber && (
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#dc2626' }}>
                  {errors.projectNumber}
                </div>
              )}
              {mode === 'directOrder' && (
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
                  Enter manually (e.g., DO-01, DO-02)
                </div>
              )}
            </div>

            {/* Project Name */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}
              >
                Project Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${errors.projectName ? '#dc2626' : '#d1d5db'}`,
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: '#fff'
                }}
                value={formData.projectName}
                onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                placeholder="e.g. Office Complex Renovation"
              />
              {errors.projectName && (
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#dc2626' }}>
                  {errors.projectName}
                </div>
              )}
            </div>

            {/* Address */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}
              >
                Address
              </label>
              <input
                type="text"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: '#fff'
                }}
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="e.g. 1234 Business Drive, City, State"
              />
            </div>

            {/* Types Multi-select */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}
              >
                Types <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '8px',
                  marginBottom: '12px'
                }}
              >
                {TYPE_OPTIONS.map(type => (
                  <label
                    key={type.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedTypes.includes(type.value)}
                      onChange={() => handleTypeToggle(type.value)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>{type.label}</span>
                  </label>
                ))}

                {/* Custom Types as Checkboxes */}
                {formData.customTypes.map(type => (
                  <label
                    key={`custom-${type}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#059669' // Green color to distinguish custom types
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedCustomTypes.includes(type)}
                      onChange={() => handleCustomTypeToggle(type)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>{type}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveCustomType(type);
                      }}
                      style={{
                        border: 'none',
                        background: 'none',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: '0',
                        marginLeft: '4px'
                      }}
                      title="Remove custom type"
                    >
                      ✕
                    </button>
                  </label>
                ))}
              </div>


              {/* Add Custom Type */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: '#fff'
                  }}
                  value={formData.customTypeInput}
                  onChange={(e) => setFormData(prev => ({ ...prev, customTypeInput: e.target.value }))}
                  placeholder="Add custom type..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomType())}
                />
                <button
                  type="button"
                  onClick={handleAddCustomType}
                  disabled={!formData.customTypeInput.trim()}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: formData.customTypeInput.trim() ? '#2563eb' : '#f3f4f6',
                    color: formData.customTypeInput.trim() ? '#fff' : '#9ca3af',
                    fontSize: '14px',
                    cursor: formData.customTypeInput.trim() ? 'pointer' : 'not-allowed',
                    fontWeight: '500'
                  }}
                >
                  Add
                </button>
              </div>

              {errors.types && (
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#dc2626' }}>
                  {errors.types}
                </div>
              )}
            </div>

            {/* Dropbox Folder (Optional) */}
            <div style={{ marginBottom: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
              <div style={{ marginBottom: '12px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                Dropbox Folder
                <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: '400', color: '#9ca3af' }}>
                  (optional — fill all fields to auto-create)
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#374151' }}>Section</label>
                  <select
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', backgroundColor: '#fff' }}
                    value={formData.dropboxSection}
                    onChange={(e) => setFormData(prev => ({ ...prev, dropboxSection: e.target.value }))}
                  >
                    <option value="">— select —</option>
                    {DROPBOX_SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#374151' }}>Region</label>
                  <select
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', backgroundColor: '#fff' }}
                    value={formData.dropboxRegion}
                    onChange={(e) => setFormData(prev => ({ ...prev, dropboxRegion: e.target.value }))}
                  >
                    <option value="">— select —</option>
                    {DROPBOX_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#374151' }}>Status</label>
                  <select
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', backgroundColor: '#fff' }}
                    value={formData.dropboxStatus}
                    onChange={(e) => setFormData(prev => ({ ...prev, dropboxStatus: e.target.value }))}
                  >
                    <option value="">— select —</option>
                    {DROPBOX_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#374151' }}>Client Type</label>
                  <select
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', backgroundColor: '#fff' }}
                    value={formData.dropboxClientType}
                    onChange={(e) => setFormData(prev => ({ ...prev, dropboxClientType: e.target.value }))}
                  >
                    <option value="">— select —</option>
                    {DROPBOX_CLIENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#374151' }}>Client Name</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', backgroundColor: '#fff' }}
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="e.g. Acme Corp"
                />
              </div>

              {formData.dropboxSection && formData.dropboxRegion && formData.dropboxStatus && formData.dropboxClientType &&
                (formData.dropboxClientType !== 'Clients' || formData.clientName.trim()) && (
                <div style={{ marginTop: '10px', padding: '8px 10px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace', color: '#0369a1', wordBreak: 'break-all' }}>
                  📁 /D-Projects/T LINES/{formData.dropboxSection}/{formData.dropboxRegion}/{formData.dropboxStatus}/
                  {formData.dropboxClientType === 'Individuals' ? 'Individiuals' : formData.dropboxClientType}
                  {formData.dropboxClientType === 'Clients' && formData.clientName.trim() ? `/${formData.clientName}` : ''}/...
                </div>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '4px',
                  color: '#dc2626',
                  fontSize: '14px',
                  marginBottom: '20px'
                }}
              >
                {errors.submit}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #eee',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            flexShrink: 0
          }}
        >
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            style={{
              padding: '10px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: '#fff',
              color: '#374151',
              fontSize: '14px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-project-form"
            disabled={isSubmitting}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: isSubmitting ? '#9ca3af' : '#2563eb',
              color: '#fff',
              fontSize: '14px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: '500'
            }}
          >
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddProjectDrawer;
```

---

## FILE: components/AddToGroupModal.tsx

```tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PfGroup, createPfGroup, addPfGroupMember } from '../lib/pf-groups';

interface AddToGroupModalProps {
  projectId: string;
  projectName: string;
  projectTypes: string[]; // types that actually exist in this project
  pfGroups: PfGroup[];
  onClose: () => void;
}

const selectStyle: React.CSSProperties = {
  width: '100%', height: '38px', padding: '0 10px', border: '1px solid #d1d5db',
  borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', background: '#fff',
};
const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px', display: 'block' };

/**
 * One-screen "Add to Group" form — replaces the old click-through-a-nested-menu
 * flow (target → type → rank as three separate menu steps) with three dropdowns
 * shown at once. Stays open after each add (only the ✕ or backdrop closes it) so
 * several types can be added to the same group in a row without reopening it.
 */
const AddToGroupModal: React.FC<AddToGroupModalProps> = ({ projectId, projectName, projectTypes, pfGroups, onClose }) => {
  const [type, setType] = useState(projectTypes[0] || '');
  const [target, setTarget] = useState<string>('new'); // 'new' or a groupId
  const [rank, setRank] = useState<string>('1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justAddedFlash, setJustAddedFlash] = useState<string | null>(null);
  // Locally tracked so a type just added shows as "already in" immediately,
  // without waiting on the socket round-trip that refreshes the `pfGroups` prop.
  const [locallyAdded, setLocallyAdded] = useState<Set<string>>(new Set());
  const pressedOnBackdrop = useRef(false);

  const targetGroup = target === 'new' ? null : pfGroups.find(g => g.id === target) || null;

  const existingRanksForTarget = useMemo(() => {
    if (!targetGroup) return [];
    return [...new Set(targetGroup.members.map(m => m.rank))].sort((a, b) => a - b);
  }, [targetGroup]);

  const nextNewRank = useMemo(
    () => (existingRanksForTarget.length ? Math.max(...existingRanksForTarget) + 1 : 1),
    [existingRanksForTarget],
  );

  // Reset the rank choice and the local "just added" tracking whenever the target group changes.
  const handleTargetChange = (value: string) => {
    setTarget(value);
    setLocallyAdded(new Set());
    const grp = value === 'new' ? null : pfGroups.find(g => g.id === value) || null;
    const ranks = grp ? [...new Set(grp.members.map(m => m.rank))].sort((a, b) => a - b) : [];
    setRank(String(ranks[0] ?? 1));
  };

  const alreadyInTarget = locallyAdded.has(type) || !!targetGroup?.members.some(m => m.projectId === projectId && m.typeLabel === type);

  // Once the server confirms (pfGroups prop refreshes via socket), drop it from the
  // local set too — the real data has caught up, no need to track it ourselves anymore.
  useEffect(() => {
    if (!targetGroup) return;
    const confirmed = new Set(targetGroup.members.filter(m => m.projectId === projectId).map(m => m.typeLabel));
    setLocallyAdded(prev => {
      const next = new Set([...prev].filter(t => !confirmed.has(t)));
      return next.size === prev.size ? prev : next;
    });
  }, [targetGroup, projectId]);

  const handleAdd = async () => {
    if (busy || !type || alreadyInTarget) return;
    setBusy(true);
    setError(null);
    try {
      if (target === 'new') {
        const newGroup = await createPfGroup({ projectId, type: type.toUpperCase() });
        // Further adds in this session join the group we just started, not another new one.
        setTarget(newGroup.id);
        setRank('1');
      } else {
        await addPfGroupMember(target, { projectId, type: type.toUpperCase(), rank: Number(rank) });
      }
      setLocallyAdded(prev => new Set(prev).add(type));
      setJustAddedFlash(type);
      // Jump to the next type not yet in this group, if there is one.
      const remaining = projectTypes.filter(t => t !== type && !locallyAdded.has(t));
      if (remaining.length > 0) setType(remaining[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to group');
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div
      onMouseDown={e => { pressedOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => { if (pressedOnBackdrop.current && e.target === e.currentTarget) onClose(); pressedOnBackdrop.current = false; }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(15,23,42,0.55)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: 2100,
        padding: '20px',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: '14px', width: '420px', maxWidth: '100%',
        boxShadow: '0 24px 60px rgba(0,0,0,0.3)', overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px', background: 'linear-gradient(135deg, #f87171, #b91c1c)', color: '#fff',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>Add to Group</div>
            <div style={{ fontSize: '12px', opacity: 0.85 }}>{projectName}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', width: '28px', height: '28px',
              borderRadius: '50%', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && (
            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '9px 12px', borderRadius: '8px', fontSize: '13px', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          {justAddedFlash && (
            <div style={{ background: '#f0fdf4', color: '#15803d', padding: '9px 12px', borderRadius: '8px', fontSize: '13px', border: '1px solid #bbf7d0' }}>
              ✓ {justAddedFlash} added{target !== 'new' ? '' : ' — new group created'}. Add another, or close when done.
            </div>
          )}

          {projectTypes.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>This project has no items yet.</div>
          ) : (
            <>
              <div>
                <label style={labelStyle}>Type</label>
                <select value={type} onChange={e => { setType(e.target.value); setJustAddedFlash(null); }} style={selectStyle}>
                  {projectTypes.map(t => (
                    <option key={t} value={t}>{t}{locallyAdded.has(t) ? ' (already added)' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Group</label>
                <select value={target} onChange={e => handleTargetChange(e.target.value)} style={selectStyle}>
                  <option value="new">+ Create New Group</option>
                  {pfGroups.map(g => <option key={g.id} value={g.id}>Group {g.number}</option>)}
                </select>
              </div>

              {target !== 'new' && (
                <div>
                  <label style={labelStyle}>Rank</label>
                  <select value={rank} onChange={e => setRank(e.target.value)} style={selectStyle}>
                    {existingRanksForTarget.map(r => <option key={r} value={r}>Rank {r}</option>)}
                    <option value={nextNewRank}>+ New rank ({nextNewRank})</option>
                  </select>
                </div>
              )}

              {alreadyInTarget && (
                <div style={{ fontSize: '12px', color: '#b91c1c' }}>This type is already in that group.</div>
              )}

              <button
                onClick={handleAdd}
                disabled={busy || !type || alreadyInTarget}
                style={{
                  marginTop: '4px', height: '40px', border: 'none', borderRadius: '8px',
                  background: busy || !type || alreadyInTarget ? '#fca5a5' : '#b91c1c', color: '#fff',
                  fontSize: '14px', fontWeight: 700, cursor: busy || !type || alreadyInTarget ? 'not-allowed' : 'pointer',
                }}
              >
                {busy ? 'Adding…' : 'Add'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddToGroupModal;
```

---

## FILE: components/AddVendorModal.tsx

```tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createVendor } from '../lib/projects';
import { Vendor } from '../types';

interface AddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVendorAdded: (vendor: Vendor) => void;
  prefilledName?: string; // ADDED: Prefill vendor name from autocomplete
}

const AddVendorModal: React.FC<AddVendorModalProps> = ({
  isOpen,
  onClose,
  onVendorAdded,
  prefilledName = ''
}) => {
  const [name, setName] = useState(prefilledName);
  const [code, setCode] = useState('');
  const [fixedMillworkCodes, setFixedMillworkCodes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update name when prefilledName changes
  useEffect(() => {
    if (prefilledName) {
      setName(prefilledName);
    }
  }, [prefilledName]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Vendor name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const vendorData = {
        name: name.trim(),
        ...(code.trim() && { code: code.trim() }),
        fixedMillworkCodes,
      };

      const newVendor = await createVendor(vendorData);
      onVendorAdded(newVendor);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vendor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setCode('');
    setFixedMillworkCodes(false);
    setError(null);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20000,
        padding: '16px'
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              color: '#2c3e50'
            }}
          >
            Add New Vendor
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            style={{
              border: 'none',
              background: 'none',
              fontSize: '24px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              color: '#999',
              padding: '0',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '24px' }}>
            {/* Error Message */}
            {error && (
              <div
                style={{
                  marginBottom: '16px',
                  padding: '12px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '4px',
                  color: '#dc2626',
                  fontSize: '14px'
                }}
              >
                {error}
              </div>
            )}

            {/* Name Field */}
            <div style={{ marginBottom: '20px' }}>
              <label
                htmlFor="vendorName"
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                Vendor Name *
              </label>
              <input
                id="vendorName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Premier Millwork Solutions"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: isSubmitting ? '#f9fafb' : '#fff'
                }}
                autoFocus
              />
            </div>

            {/* Code Field */}
            <div style={{ marginBottom: '20px' }}>
              <label
                htmlFor="vendorCode"
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                Vendor Code
              </label>
              <input
                id="vendorCode"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g., PMS (optional - auto-generated if empty)"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: isSubmitting ? '#f9fafb' : '#fff'
                }}
                maxLength={10}
              />
              <div
                style={{
                  marginTop: '4px',
                  fontSize: '12px',
                  color: '#6b7280'
                }}
              >
                Leave empty to auto-generate from vendor name
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={fixedMillworkCodes}
                  onChange={(e) => setFixedMillworkCodes(e.target.checked)}
                  disabled={isSubmitting}
                />
                Millwork PF kodu sipariş tipine göre (Basic → M01, Selective → M02, Custom → M03)
              </label>
            </div>

            {/* Info Text */}
            <div
              style={{
                padding: '12px',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#0369a1',
                marginBottom: '24px'
              }}
            >
              <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                About PF Codes
              </div>
              <div>
                When you assign this vendor to project items, PF codes will be automatically
                generated using the format: <code style={{ fontFamily: 'monospace' }}>
                {code.trim() || '[CODE]'}-P[PROJECT_NO]-[TYPE][NUM]
                </code>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid #eee',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              style={{
                padding: '10px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: '#fff',
                color: '#374151',
                fontSize: '14px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              style={{
                padding: '10px 16px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: isSubmitting || !name.trim() ? '#9ca3af' : '#2563eb',
                color: '#fff',
                fontSize: '14px',
                cursor: isSubmitting || !name.trim() ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                position: 'relative',
                zIndex: 21000,
                pointerEvents: 'auto'
              }}
            >
              {isSubmitting && (
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #fff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}
                />
              )}
              {isSubmitting ? 'Creating...' : 'Create Vendor'}
            </button>
          </div>
        </form>
      </div>

      {/* Inline keyframes for loading spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default AddVendorModal;
```

---

## FILE: components/CellOrderTypeAutocomplete.tsx

```tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import AnchoredDropdown from './ui/AnchoredDropdown';
import { getOrderTypes, createOrderType, OrderType } from '../lib/projects';

interface CellOrderTypeAutocompleteProps {
  value: string;
  onSave: (orderType: string) => void;
  onCancel: () => void;
  triggerRef: React.RefObject<HTMLDivElement>;
  itemId: string;
  projectId: string;
}

interface OrderTypeOption {
  value: string;
  label: string;
  isCustom?: boolean;
}

const CellOrderTypeAutocomplete: React.FC<CellOrderTypeAutocompleteProps> = ({
  value,
  onSave,
  onCancel,
  triggerRef,
  itemId: _itemId,
  projectId: _projectId
}) => {
  // ✨ FIXED: Separate display value from search query
  const [searchTerm, setSearchTerm] = useState(value || ''); // What shows in input
  const [searchQuery, setSearchQuery] = useState(''); // What actually filters the list
  const [isDropdownOpen, setIsDropdownOpen] = useState(true); // ✨ Open immediately
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [orderTypeOptions, setOrderTypeOptions] = useState<OrderTypeOption[]>([]);
  const [backendOrderTypes, setBackendOrderTypes] = useState<OrderType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUserTyped, setHasUserTyped] = useState(false); // Track if user has actually typed

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  // Focus input on mount and select existing text
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  // Load order types on mount
  useEffect(() => {
    loadOrderTypes();
  }, []);

  // Load order types from backend
  const loadOrderTypes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const orderTypes = await getOrderTypes();
      setBackendOrderTypes(orderTypes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order types');
      console.error('❌ Failed to load order types:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ✨ FIXED: Only filter when user has actually typed, not on initial value
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // ✨ Filter based on searchQuery (what user typed), not searchTerm (display value)
    debounceTimeoutRef.current = setTimeout(() => {
      filterOrderTypes(searchQuery);
    }, 50);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery, backendOrderTypes]);

  // ✨ FIXED: Highlight currently selected option in dropdown on open
  useEffect(() => {
    if (isDropdownOpen && !hasUserTyped && orderTypeOptions.length > 0) {
      // Find current value in the options list
      const currentIndex = orderTypeOptions.findIndex(option =>
        option.label === value || option.value === value
      );
      if (currentIndex >= 0) {
        setSelectedIndex(currentIndex);
      }
    }
  }, [isDropdownOpen, hasUserTyped, orderTypeOptions, value]);

  // ✨ IMPROVED: Filter order types, showing all when query is empty
  const filterOrderTypes = useCallback((query: string) => {
    // Use only backend order types (persistent, tenant-scoped)
    const allOrderTypeNames = backendOrderTypes.map(ot => ot.name);

    let filteredNames: string[];

    if (!query || query.trim() === '') {
      // ✨ Show ALL options when no search term (proper dropdown behavior)
      filteredNames = allOrderTypeNames;
    } else {
      // Filter by search term
      filteredNames = allOrderTypeNames.filter(name =>
        name.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Create options from filtered list
    const standardOptions: OrderTypeOption[] = filteredNames.map(name => ({
      value: name,
      label: name
    }));

    // Check if current search matches exactly
    const exactMatch = standardOptions.find(option =>
      option.value.toLowerCase() === query.toLowerCase()
    );

    const finalOptions = [...standardOptions];

    // Add "Create order type" option if no exact match and query length >= 2
    if (!exactMatch && query.length >= 2) {
      finalOptions.push({
        value: query,
        label: `+ Add order type "${query}"`,
        isCustom: true
      });
    }

    setOrderTypeOptions(finalOptions);
    setSelectedIndex(-1);

  }, [backendOrderTypes]);

  // ✨ FIXED: Handle input change - separate display from search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue); // Update display value
    setSearchQuery(newValue); // Update search filter
    setHasUserTyped(true); // Mark that user has typed
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsDropdownOpen(false);
        onCancel();
        break;

      case 'Enter':
        e.preventDefault();
        if (isDropdownOpen && selectedIndex >= 0 && orderTypeOptions[selectedIndex]) {
          handleOptionSelect(orderTypeOptions[selectedIndex]);
        } else {
          onCancel();
        }
        break;

      case 'Tab':
        e.preventDefault();
        if (isDropdownOpen && selectedIndex >= 0 && orderTypeOptions[selectedIndex]) {
          handleOptionSelect(orderTypeOptions[selectedIndex]);
        } else {
          onCancel();
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (isDropdownOpen) {
          const maxIndex = orderTypeOptions.length - 1;
          setSelectedIndex(prev => Math.min(prev + 1, maxIndex));
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (isDropdownOpen) {
          setSelectedIndex(prev => Math.max(prev - 1, -1));
        }
        break;

      default:
        // Continue typing
        break;
    }
  };

  // ✨ FIXED: Handle option selection - reset search state
  const handleOptionSelect = async (option: OrderTypeOption) => {

    setIsDropdownOpen(false);
    setSelectedIndex(-1);
    setSearchQuery(''); // ✨ Reset search query
    setHasUserTyped(false); // ✨ Reset user typing flag
    setSearchTerm(option.label); // ✨ Update display value

    if (option.isCustom) {
      try {
        await createOrderType({ name: option.value });

        // Refresh order types list
        await loadOrderTypes();
      } catch (err) {
        console.error('❌ Failed to create order type:', err);

      }
    }

    // Save the order type value
    onSave(option.value);
  };

  // Handle input blur
  const handleBlur = (e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;


    // Don't close if clicking on dropdown, modal, or any order-type-related element
    if (relatedTarget && (
      relatedTarget.closest('[data-order-type-autocomplete]') ||
      relatedTarget.closest('[role="dialog"]') ||
      relatedTarget.closest('.order-type-dropdown') ||
      relatedTarget.closest('.anchored-dropdown')
    )) {
      return;
    }

    // Delay and check if dropdown is still open to avoid interfering
    setTimeout(() => {
      if (!isDropdownOpen) {
        onCancel();
      } else {
      }
    }, 150);
  };

  return (
    <>
      {/* INLINE INPUT for order type */}
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="cell-order-type-autocomplete"
        placeholder="Select or type to filter..."
        data-order-type-autocomplete="input"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          outline: 'none',
          padding: '8px 12px',
          fontSize: '14px',
          background: 'white',
          borderRadius: '2px',
          boxShadow: '0 0 0 2px #059669',
          boxSizing: 'border-box',
          fontFamily: 'inherit'
        }}
      />

      {/* SHARED ANCHORED DROPDOWN for order type options */}
      <AnchoredDropdown
        isOpen={isDropdownOpen}
        onClose={() => {
          setIsDropdownOpen(false);
        }}
        triggerRef={triggerRef}
        field="orderType"
        minWidth={200}
        maxHeight={280}
        className="order-type-dropdown"
      >
        <div data-order-type-autocomplete="dropdown" style={{ padding: '4px 0' }}>
          {/* Loading state */}
          {isLoading && (
            <div style={{
              padding: '12px 16px',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '14px'
            }}>
              Loading order types...
            </div>
          )}

          {/* Error state */}
          {error && (
            <div style={{
              padding: '12px 16px',
              textAlign: 'center',
              color: '#dc2626',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* No results */}
          {!isLoading && !error && orderTypeOptions.length === 0 && (
            <div style={{
              padding: '12px 16px',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '14px'
            }}>
              No matching order types found
            </div>
          )}

          {/* Order type options */}
          {!isLoading && !error && orderTypeOptions.map((option, index) => (
            <div
              key={`${option.value}-${index}`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleOptionSelect(option);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                backgroundColor: selectedIndex === index ? '#ecfdf5' : 'transparent',
                color: option.isCustom ? '#059669' : '#374151',
                fontWeight: option.isCustom ? '500' : 'normal',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {option.isCustom && (
                <span style={{ color: '#059669', fontWeight: 'bold' }}>+</span>
              )}
              <span>{option.label}</span>
            </div>
          ))}
        </div>
      </AnchoredDropdown>
    </>
  );
};

export default CellOrderTypeAutocomplete;
```

---

## FILE: components/CellStatusAutocomplete.tsx

```tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import AnchoredDropdown from './ui/AnchoredDropdown';
import { getStatusStyle } from '../utils/statusStyles';

interface CellStatusAutocompleteProps {
  value: string;
  onSave: (status: string) => void;
  onCancel: () => void;
  triggerRef: React.RefObject<HTMLDivElement>;
  itemId: string;
  projectId: string;
}

interface StatusOption {
  value: string;
  label: string;
  description?: string;
}

// Status options - matching backend enum values
const STATUS_OPTIONS: StatusOption[] = [
  { value: 'HOLD_T', label: 'HOLD / T', description: 'Hold - MR.T' },
  { value: 'HOLD_PM', label: 'HOLD / PM', description: 'Hold - Project Management' },
  { value: 'HOLD_BOOKS', label: 'HOLD BOOKS', description: 'Hold - books' },
  { value: 'NOT_ORDERED', label: 'NOT ORDERED', description: 'Not yet ordered' },
  { value: 'TO_ORDER', label: 'TO ORDER', description: 'Queued to be ordered' },
  { value: 'BOOKS_IN_PROGRESS', label: 'BOOKS IN PROGRESS', description: 'Order books being prepared' },
  { value: 'ORDERED', label: 'ORDERED', description: 'Ordered - STD will be set to today' },
  { value: 'WAITING_PAYMENT', label: 'WAITING PAYMENT', description: 'Waiting for payment' },
  { value: 'ASSEMBLY', label: 'ASSEMBLY', description: 'In assembly' },
  { value: 'READY_TO_RECEIVE', label: 'READY TO RECEIVE', description: 'Ready for delivery' },
  { value: 'RECEIVED', label: 'RECEIVED', description: 'Received at facility' },
  { value: 'READY', label: 'READY', description: 'Ready for installation - RDY will be set to today' },
  { value: 'SENT_TO_TLINES', label: 'SENT TO TLINES', description: 'Sent to TLines' },
  { value: 'PARTIAL_SENT', label: 'PARTIAL SENT', description: 'Partially sent' },
  { value: 'SENT', label: 'SENT', description: 'Fully sent' }
];

const CellStatusAutocomplete: React.FC<CellStatusAutocompleteProps> = ({
  value,
  onSave,
  onCancel,
  triggerRef,
  itemId: _itemId,
  projectId: _projectId
}) => {
  // ✨ FIXED: Separate display value from search query
  const [searchTerm, setSearchTerm] = useState(value || ''); // What shows in input
  const [searchQuery, setSearchQuery] = useState(''); // What actually filters the list
  const [isDropdownOpen, setIsDropdownOpen] = useState(true); // ✨ Open immediately
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>(STATUS_OPTIONS); // ✨ Show all options initially
  const [hasUserTyped, setHasUserTyped] = useState(false); // Track if user has actually typed

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  // Focus input on mount and select existing text
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  // ✨ FIXED: Highlight currently selected option in dropdown on open
  useEffect(() => {
    if (isDropdownOpen && !hasUserTyped) {
      // Find current value in the options list (check both value and label)
      const currentIndex = statusOptions.findIndex(option =>
        option.label === value || option.value === value
      );
      if (currentIndex >= 0) {
        setSelectedIndex(currentIndex);
      }
    }
  }, [isDropdownOpen, hasUserTyped, statusOptions, value]);

  // ✨ FIXED: Only filter when user has actually typed, not on initial value
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // ✨ Filter based on searchQuery (what user typed), not searchTerm (display value)
    debounceTimeoutRef.current = setTimeout(() => {
      filterStatuses(searchQuery);
    }, 50);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // ✨ IMPROVED: Filter status options, showing all when query is empty
  const filterStatuses = useCallback((query: string) => {
    let filtered: StatusOption[];

    if (!query || query.trim() === '') {
      // ✨ Show ALL options when no search term (proper dropdown behavior)
      filtered = STATUS_OPTIONS;
    } else {
      // Filter based on search term
      filtered = STATUS_OPTIONS.filter(status =>
        status.label.toLowerCase().includes(query.toLowerCase()) ||
        status.value.toLowerCase().includes(query.toLowerCase()) ||
        (status.description && status.description.toLowerCase().includes(query.toLowerCase()))
      );
    }

    setStatusOptions(filtered);
    setSelectedIndex(-1);

  }, []);

  // ✨ FIXED: Handle input change - separate display from search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue); // Update display value
    setSearchQuery(newValue); // Update search filter
    setHasUserTyped(true); // Mark that user has typed
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsDropdownOpen(false);
        onCancel();
        break;

      case 'Enter':
        e.preventDefault();
        if (isDropdownOpen && selectedIndex >= 0 && statusOptions[selectedIndex]) {
          handleStatusSelect(statusOptions[selectedIndex]);
        } else {
          onCancel();
        }
        break;

      case 'Tab':
        e.preventDefault();
        if (isDropdownOpen && selectedIndex >= 0 && statusOptions[selectedIndex]) {
          handleStatusSelect(statusOptions[selectedIndex]);
        } else {
          onCancel();
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (isDropdownOpen) {
          const maxIndex = statusOptions.length - 1;
          setSelectedIndex(prev => Math.min(prev + 1, maxIndex));
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (isDropdownOpen) {
          setSelectedIndex(prev => Math.max(prev - 1, -1));
        }
        break;

      default:
        // Continue typing
        break;
    }
  };

  // ✨ FIXED: Handle status selection - reset search state
  const handleStatusSelect = (option: StatusOption) => {

    setIsDropdownOpen(false);
    setSelectedIndex(-1);
    setSearchQuery(''); // ✨ Reset search query
    setHasUserTyped(false); // ✨ Reset user typing flag
    setSearchTerm(option.label); // ✨ Update display value

    // CRITICAL: ORDERED status auto-sets STD to today
    if (option.value === 'ORDERED') {
    }

    // Save the status value (backend will handle STD auto-set)
    onSave(option.value);
  };

  // Handle input blur
  const handleBlur = (e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;


    // Don't close if clicking on dropdown, modal, or any status-related element
    if (relatedTarget && (
      relatedTarget.closest('[data-status-autocomplete]') ||
      relatedTarget.closest('[role="dialog"]') ||
      relatedTarget.closest('.status-dropdown') ||
      relatedTarget.closest('.anchored-dropdown')
    )) {
      return;
    }

    // Use setTimeout(0) to check activeElement AFTER event cycle
    setTimeout(() => {
      const currentActiveElement = document.activeElement;

      // Check if focus moved to status-related elements
      const isInsideStatusUI = currentActiveElement && (
        inputRef.current?.contains(currentActiveElement) ||
        triggerRef.current?.contains(currentActiveElement) ||
        currentActiveElement.closest('[data-status-autocomplete]') ||
        currentActiveElement.closest('.status-dropdown') ||
        currentActiveElement.closest('.anchored-dropdown')
      );

      if (isInsideStatusUI) {
        return;
      }

      if (!isDropdownOpen) {
        onCancel();
      } else {
      }
    }, 0);
  };

  // Get status style using centralized system
  const getStatusStyleForOption = (statusLabel: string) => {
    return getStatusStyle(statusLabel);
  };

  return (
    <>
      {/* INLINE INPUT for status */}
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="cell-status-autocomplete"
        placeholder="Select or type to filter..."
        data-status-autocomplete="input"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          outline: 'none',
          padding: '8px 12px',
          fontSize: '14px',
          background: 'white',
          borderRadius: '2px',
          boxShadow: '0 0 0 2px #2563eb',
          boxSizing: 'border-box',
          fontFamily: 'inherit'
        }}
      />

      {/* SHARED ANCHORED DROPDOWN for status options */}
      <AnchoredDropdown
        isOpen={isDropdownOpen}
        onClose={() => {
          setIsDropdownOpen(false);
        }}
        triggerRef={triggerRef}
        field="status"
        minWidth={250}
        maxHeight={300}
        className="status-dropdown"
      >
        <div data-status-autocomplete="dropdown" style={{ padding: '4px 0' }}>
          {/* No results */}
          {statusOptions.length === 0 && (
            <div style={{
              padding: '12px 16px',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '14px'
            }}>
              No matching status found
            </div>
          )}

          {/* Status options */}
          {statusOptions.map((option, index) => (
            <div
              key={option.value}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleStatusSelect(option);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                backgroundColor: selectedIndex === index ? '#eff6ff' : 'transparent',
                borderLeft: `4px solid ${getStatusStyleForOption(option.label).backgroundColor}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{
                fontWeight: '500',
                color: 'black' // 🎨 YAZI HEP SİYAH
              }}>
                {option.label}
                {option.value === 'ORDERED' && (
                  <span style={{
                    marginLeft: '8px',
                    fontSize: '12px',
                    fontWeight: 'normal',
                    color: 'black' // 🎨 YAZI HEP SİYAH
                  }}>
                    📅 (Sets STD to today)
                  </span>
                )}
              </div>
              {option.description && (
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  {option.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </AnchoredDropdown>
    </>
  );
};

export default CellStatusAutocomplete;
```

---

## FILE: components/CellVendorAutocomplete.tsx

```tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import AddVendorModal from './AddVendorModal';
import AnchoredDropdown from './ui/AnchoredDropdown';
import { Vendor, VendorOption, createVendorOptions } from '../types';
import { getVendors, updateVendor } from '../lib/projects';

interface CellVendorAutocompleteProps {
  value: string;                    // Current vendor display name
  onSave: (vendorId: string) => void;
  onCancel: () => void;
  onVendorEdited?: (vendorId: string, newCode: string, newName: string) => void;
  triggerRef: React.RefObject<HTMLDivElement>;
  itemId: string;                   // Backend item ID for updates
  projectId: string;
}

const CellVendorAutocomplete: React.FC<CellVendorAutocompleteProps> = ({
  value,
  onSave,
  onCancel,
  onVendorEdited,
  triggerRef,
  itemId: _itemId,
  projectId: _projectId
}) => {
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorOptions, setVendorOptions] = useState<VendorOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUserTyped, setHasUserTyped] = useState(false);

  // Create vendor modal state
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);
  const [prefilledVendorName, setPrefilledVendorName] = useState('');

  // Inline edit state
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const editCodeRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  // Focus edit code input when editing starts
  useEffect(() => {
    if (editingVendorId && editCodeRef.current) {
      editCodeRef.current.focus();
      editCodeRef.current.select();
    }
  }, [editingVendorId]);

  const handleFocus = () => {
    if (!isDropdownOpen) {
      if (searchTerm.length >= 3) {
        filterVendors(searchTerm);
      } else if (vendors.length > 0) {
        setVendorOptions(createVendorOptions(vendors));
      }
      requestAnimationFrame(() => setIsDropdownOpen(true));
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isDropdownOpen) {
      e.preventDefault();
      if (searchTerm.length >= 3) {
        filterVendors(searchTerm);
      } else if (vendors.length > 0) {
        setVendorOptions(createVendorOptions(vendors));
      }
      requestAnimationFrame(() => setIsDropdownOpen(true));
      if (inputRef.current) inputRef.current.focus();
    }
    // When dropdown is already open, don't preventDefault - allow native text selection
  };

  // Load vendors on mount
  useEffect(() => { loadVendors(); }, []);

  // Debounced search
  useEffect(() => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

    if (isDropdownOpen) {
      debounceTimeoutRef.current = setTimeout(() => {
        if (searchQuery.length >= 3) {
          filterVendors(searchQuery);
        } else if (vendors.length > 0) {
          setVendorOptions(createVendorOptions(vendors));
        }
      }, 50);
    }

    return () => { if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current); };
  }, [searchQuery, vendors, isDropdownOpen]);

  // Highlight current vendor
  useEffect(() => {
    if (isDropdownOpen && !hasUserTyped && vendorOptions.length > 0) {
      const currentIndex = vendorOptions.findIndex(option =>
        option.displayName === value || option.name === value || option.code === value
      );
      if (currentIndex >= 0) setSelectedIndex(currentIndex);
    }
  }, [isDropdownOpen, hasUserTyped, vendorOptions, value]);

  const loadVendors = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const vendorList = await getVendors();
      setVendors(vendorList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vendors');
    } finally {
      setIsLoading(false);
    }
  };

  const filterVendors = useCallback((query: string) => {
    if (!vendors.length) return;
    const allOptions = createVendorOptions(vendors);
    const filtered = allOptions.filter(vendor =>
      vendor.displayName.toLowerCase().includes(query.toLowerCase()) ||
      vendor.code.toLowerCase().includes(query.toLowerCase()) ||
      vendor.name.toLowerCase().includes(query.toLowerCase())
    );

    // YSM always at top
    const finalOptions: VendorOption[] = [];
    const ysmVendor = filtered.find(v => v.code === 'YSM');
    if (ysmVendor) finalOptions.push(ysmVendor);
    filtered.forEach(vendor => { if (vendor.code !== 'YSM') finalOptions.push(vendor); });

    setVendorOptions(finalOptions);
    setSelectedIndex(-1);
  }, [vendors]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setSearchQuery(newValue);
    setHasUserTyped(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editingVendorId) return; // Don't interfere with edit inputs

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsDropdownOpen(false);
        onCancel();
        break;
      case 'Enter':
        e.preventDefault();
        if (isDropdownOpen && selectedIndex >= 0) {
          const allOptions = createDropdownOptions();
          if (allOptions[selectedIndex]) handleOptionSelect(allOptions[selectedIndex]);
        } else {
          onCancel();
        }
        break;
      case 'Tab':
        e.preventDefault();
        if (isDropdownOpen && selectedIndex >= 0) {
          const allOptions = createDropdownOptions();
          if (allOptions[selectedIndex]) handleOptionSelect(allOptions[selectedIndex]);
        } else {
          onCancel();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (isDropdownOpen) {
          const allOptions = createDropdownOptions();
          setSelectedIndex(prev => Math.min(prev + 1, allOptions.length - 1));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isDropdownOpen) setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
    }
  };

  const shouldShowCreateOption = (): boolean => {
    if (!searchTerm || searchTerm.length < 2) return false;
    // Show create option when no exact match exists
    const exactMatch = vendorOptions.find(v =>
      v.name.toLowerCase() === searchTerm.toLowerCase() ||
      v.code.toLowerCase() === searchTerm.toLowerCase() ||
      v.displayName.toLowerCase() === searchTerm.toLowerCase()
    );
    return !exactMatch;
  };

  const createDropdownOptions = () => {
    const options = [...vendorOptions];
    if (shouldShowCreateOption()) {
      const vendorName = searchTerm.trim();
      options.push({
        id: 'create-vendor',
        code: 'CREATE',
        name: vendorName,
        displayName: `+ Create new vendor "${vendorName}"`,
      } as VendorOption);
    }
    return options;
  };

  const handleOptionSelect = (option: VendorOption) => {
    if (editingVendorId) return; // Don't select while editing

    setIsDropdownOpen(false);
    setSelectedIndex(-1);
    setSearchQuery('');
    setHasUserTyped(false);
    setSearchTerm(option.displayName);

    if (option.id === 'create-vendor') {
      const vendorName = option.name;
      setPrefilledVendorName(vendorName);
      setIsAddVendorModalOpen(true);
    } else {
      onSave(option.id);
    }
  };

  const handleVendorAdded = async (newVendor: Vendor) => {
    setIsAddVendorModalOpen(false);
    setPrefilledVendorName('');
    await loadVendors();
    setSearchTerm(`${newVendor.code} - ${newVendor.name}`);
    setIsDropdownOpen(false);
    onSave(newVendor.id);
  };

  // Start editing a vendor
  const startEdit = (vendor: VendorOption, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const fullVendor = vendors.find(v => v.id === vendor.id);
    if (!fullVendor) return;
    setEditingVendorId(vendor.id);
    setEditCode(fullVendor.code);
    setEditName(fullVendor.name);
  };

  // Save vendor edit
  const saveEdit = async () => {
    if (!editingVendorId || isSavingEdit) return;
    const trimCode = editCode.trim().toUpperCase();
    const trimName = editName.trim();
    if (!trimCode || !trimName) { setEditingVendorId(null); return; }

    const original = vendors.find(v => v.id === editingVendorId);
    if (original && original.code === trimCode && original.name === trimName) {
      setEditingVendorId(null);
      return;
    }

    setIsSavingEdit(true);
    try {
      await updateVendor(editingVendorId, { code: trimCode, name: trimName });

      // Update local vendors list
      setVendors(prev => prev.map(v => v.id === editingVendorId ? { ...v, code: trimCode, name: trimName } : v));

      // Refresh options
      const updatedOptions = createVendorOptions(
        vendors.map(v => v.id === editingVendorId ? { ...v, code: trimCode, name: trimName } : v)
      );
      setVendorOptions(updatedOptions);

      setEditingVendorId(null);

      // Notify parent for instant UI refresh
      if (onVendorEdited) onVendorEdited(editingVendorId, trimCode, trimName);
    } catch (error) {
      console.error('Failed to update vendor:', error);
      alert(error instanceof Error ? error.message : 'Failed to update vendor');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && (
      relatedTarget.closest('[data-vendor-autocomplete]') ||
      relatedTarget.closest('[role="dialog"]') ||
      relatedTarget.closest('.vendor-dropdown') ||
      relatedTarget.closest('.vendor-modal') ||
      relatedTarget.closest('.anchored-dropdown')
    )) return;

    setTimeout(() => {
      const currentActiveElement = document.activeElement;
      const isInsideVendorUI = currentActiveElement && (
        inputRef.current?.contains(currentActiveElement) ||
        triggerRef.current?.contains(currentActiveElement) ||
        currentActiveElement.closest('[data-vendor-autocomplete]') ||
        currentActiveElement.closest('.vendor-dropdown') ||
        currentActiveElement.closest('.anchored-dropdown') ||
        currentActiveElement.closest('.vendor-modal')
      );
      if (isInsideVendorUI) return;
      if (!isDropdownOpen && !isAddVendorModalOpen) onCancel();
    }, 0);
  };

  const dropdownOptions = createDropdownOptions();

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onPointerDown={handlePointerDown}
        className="cell-vendor-autocomplete"
        placeholder="Select or type to filter..."
        data-vendor-autocomplete="input"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          outline: 'none',
          padding: '8px 12px',
          fontSize: '14px',
          background: 'white',
          borderRadius: '2px',
          boxShadow: '0 0 0 2px #007bff',
          boxSizing: 'border-box',
          fontFamily: 'inherit'
        }}
      />

      <AnchoredDropdown
        isOpen={isDropdownOpen}
        onClose={() => {
          if (editingVendorId) return; // Don't close while editing
          setIsDropdownOpen(false);
        }}
        triggerRef={triggerRef}
        field="vendor"
        minWidth={320}
        maxHeight={350}
        className="vendor-dropdown"
      >
        <div data-vendor-autocomplete="dropdown" style={{ padding: '4px 0' }}>
          {isLoading && (
            <div style={{ padding: '12px 16px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
              Loading vendors...
            </div>
          )}

          {error && (
            <div style={{ padding: '12px 16px', textAlign: 'center', color: '#dc2626', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {!isLoading && !error && dropdownOptions.length === 0 && (
            <div style={{ padding: '12px 16px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
              {vendors.length === 0 ? 'Loading vendors...' : 'No vendors available'}
            </div>
          )}

          {!isLoading && !error && dropdownOptions.map((option, index) => {
            const isEditing = editingVendorId === option.id;

            if (isEditing) {
              return (
                <div
                  key={option.id}
                  data-vendor-autocomplete="edit-row"
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#fffbeb',
                    borderLeft: '4px solid #f59e0b',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      ref={editCodeRef}
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
                        else if (e.key === 'Escape') { e.preventDefault(); setEditingVendorId(null); }
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      disabled={isSavingEdit}
                      placeholder="Code"
                      style={{
                        width: '70px',
                        padding: '3px 6px',
                        border: '1px solid #d1d5db',
                        borderRadius: '3px',
                        fontSize: '12px',
                        fontWeight: '600',
                        outline: 'none',
                      }}
                    />
                    <span style={{ color: '#9ca3af' }}>-</span>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
                        else if (e.key === 'Escape') { e.preventDefault(); setEditingVendorId(null); }
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      disabled={isSavingEdit}
                      placeholder="Name"
                      style={{
                        flex: 1,
                        padding: '3px 6px',
                        border: '1px solid #d1d5db',
                        borderRadius: '3px',
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                    <button
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); saveEdit(); }}
                      disabled={isSavingEdit}
                      style={{
                        padding: '2px 8px', border: '1px solid #16a34a', borderRadius: '3px',
                        fontSize: '11px', backgroundColor: '#16a34a', color: 'white',
                        cursor: isSavingEdit ? 'wait' : 'pointer', opacity: isSavingEdit ? 0.6 : 1,
                      }}
                    >
                      {isSavingEdit ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setEditingVendorId(null); }}
                      disabled={isSavingEdit}
                      style={{
                        padding: '2px 8px', border: '1px solid #d1d5db', borderRadius: '3px',
                        fontSize: '11px', backgroundColor: 'white', color: '#6b7280', cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={option.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOptionSelect(option);
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  backgroundColor: selectedIndex === index ? '#e5f3ff' : 'transparent',
                  color: option.id === 'create-vendor' ? '#059669' : '#374151',
                  fontWeight: option.code === 'YSM' ? '600' : 'normal',
                  borderLeft: option.code === 'YSM' ? '4px solid #fbbf24' : '4px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {option.id === 'create-vendor' ? (
                  <>
                    <span style={{ color: '#059669', fontWeight: 'bold' }}>+</span>
                    <span style={{ flex: 1 }}>{option.displayName}</span>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1 }}>{option.displayName}</span>
                    <button
                      onMouseDown={(e) => startEdit(option, e)}
                      title="Edit vendor code/name"
                      style={{
                        padding: '2px 6px', border: '1px solid #d1d5db', borderRadius: '3px',
                        fontSize: '10px', backgroundColor: 'white', color: '#6b7280',
                        cursor: 'pointer', opacity: 0.5, lineHeight: 1,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; }}
                    >
                      ✎
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </AnchoredDropdown>

      <AddVendorModal
        isOpen={isAddVendorModalOpen}
        onClose={() => { setIsAddVendorModalOpen(false); setPrefilledVendorName(''); }}
        onVendorAdded={handleVendorAdded}
        prefilledName={prefilledVendorName}
      />
    </>
  );
};

export default CellVendorAutocomplete;
```

---

## FILE: components/ContainerCellEditor.tsx

```tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import AnchoredDropdown from './ui/AnchoredDropdown';
import { renameContainerGlobally, getContainerNames } from '../lib/containers';

interface ContainerCellEditorProps {
  value: string;
  onSave: (value: string) => void;
  onCancel: () => void;
  onRename?: (oldName: string, newName: string) => void;
  triggerRef?: React.RefObject<HTMLElement>;
}

// Default 20 container names
const DEFAULT_CONTAINERS = Array.from({ length: 20 }, (_, i) => `CONTAINER ${i + 1}`);

const ContainerCellEditor: React.FC<ContainerCellEditorProps> = ({
  value,
  onSave,
  onCancel,
  onRename,
  triggerRef
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [containerList, setContainerList] = useState<string[]>(DEFAULT_CONTAINERS);
  const [selectedNames, setSelectedNames] = useState<Set<string>>(() => {
    if (!value || !value.trim()) return new Set();
    return new Set(value.split(',').map(s => s.trim()).filter(Boolean));
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  // The cell itself is a real text input now — type directly instead of only
  // picking from the dropdown. A bare number ("23") shorthands to "CONTAINER 23".
  const [typedValue, setTypedValue] = useState(value || '');
  const normalizeContainers = (raw: string): string =>
    raw.split(',').map(s => s.trim()).filter(Boolean)
      .map(t => (/^\d+$/.test(t) ? `CONTAINER ${t}` : t.toUpperCase()))
      .join(', ');

  const localTriggerRef = useRef<HTMLInputElement>(null);
  const effectiveTriggerRef = triggerRef || localTriggerRef;
  const dropdownOpenedRef = useRef(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Open dropdown immediately
  useEffect(() => {
    setIsDropdownOpen(true);
    dropdownOpenedRef.current = true;
  }, []);

  // Pull in every container name actually in use (e.g. "CONTAINER 23" typed on
  // some other row) so the picker list isn't stuck at the fixed 1–20 defaults.
  useEffect(() => {
    getContainerNames().then(names => {
      if (!names.length) return;
      setContainerList(prev => [...new Set([...prev, ...names])]);
    });
  }, []);

  // This editor only exists because the cell click already fired — the browser's
  // native click-to-focus can't reach an input that didn't exist yet at click time,
  // so it has to be focused explicitly once it mounts.
  useEffect(() => {
    localTriggerRef.current?.focus();
    localTriggerRef.current?.select();
  }, []);

  // Focus edit input when editing
  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingIndex]);

  const toggleContainer = useCallback((name: string) => {
    setSelectedNames(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      setTypedValue(Array.from(next).join(', ')); // keep the typed-text box in sync with checkbox picks
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    setIsDropdownOpen(false);
    dropdownOpenedRef.current = false;
    onSave(normalizeContainers(typedValue));
  }, [typedValue, onSave]);

  const handleCancel = useCallback(() => {
    setIsDropdownOpen(false);
    dropdownOpenedRef.current = false;
    onCancel();
  }, [onCancel]);

  const handleDropdownClose = useCallback((reason?: string) => {
    if (!dropdownOpenedRef.current) return;
    if (editingIndex !== null || isRenaming) return;

    if (reason === 'escape' || reason === 'cancel') {
      handleCancel();
    } else {
      setTimeout(() => {
        if (dropdownOpenedRef.current && editingIndex === null && !isRenaming) {
          handleSave();
        }
      }, 100);
    }
  }, [handleSave, handleCancel, editingIndex, isRenaming]);

  const startRename = useCallback((index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingIndex(index);
    setEditValue(containerList[index]);
  }, [containerList]);

  const executeRename = useCallback(async () => {
    if (editingIndex === null) return;

    const rawEdit = editValue.trim();
    // Typing just a number ("23") is shorthand for "CONTAINER 23" — no need to type the full name.
    const newName = /^\d+$/.test(rawEdit) ? `CONTAINER ${rawEdit}` : rawEdit.toUpperCase();
    const oldName = containerList[editingIndex];

    if (!newName || newName === oldName) {
      setEditingIndex(null);
      return;
    }

    setIsRenaming(true);
    try {
      await renameContainerGlobally(oldName, newName);

      // Update local list
      setContainerList(prev => {
        const next = [...prev];
        next[editingIndex] = newName;
        return next;
      });

      // Update selection if old name was selected
      setSelectedNames(prev => {
        if (prev.has(oldName)) {
          const next = new Set(prev);
          next.delete(oldName);
          next.add(newName);
          return next;
        }
        return prev;
      });

      setEditingIndex(null);

      // Notify parent for instant UI refresh
      if (onRename) onRename(oldName, newName);
    } catch (error) {
      console.error('Failed to rename container:', error);
    } finally {
      setIsRenaming(false);
    }
  }, [editingIndex, editValue, containerList, onRename]);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDropdownOpen || editingIndex !== null) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handleSave();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDropdownOpen, handleSave, handleCancel, editingIndex]);

  return (
    <div className="container-cell-editor">
      <input
        ref={localTriggerRef}
        value={typedValue}
        placeholder="CONTAINER"
        onChange={(e) => setTypedValue(e.target.value)}
        onFocus={() => {
          if (!dropdownOpenedRef.current) {
            setIsDropdownOpen(true);
            dropdownOpenedRef.current = true;
          }
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            e.preventDefault();
            const normalized = normalizeContainers(typedValue);
            setIsDropdownOpen(false);
            dropdownOpenedRef.current = false;
            onSave(normalized);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
          }
        }}
        style={{
          width: '100%',
          padding: '6px 8px',
          backgroundColor: 'white',
          color: typedValue ? '#000' : '#9ca3af',
          fontWeight: typedValue ? 500 : 400,
          cursor: 'text',
          border: '2px solid #2196f3',
          borderRadius: '2px',
          fontSize: '12px',
          fontFamily: 'inherit',
          minHeight: '28px',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />

      <AnchoredDropdown
        isOpen={isDropdownOpen}
        onClose={handleDropdownClose}
        triggerRef={effectiveTriggerRef}
        field="containerNo"
        minWidth={280}
        maxHeight={400}
        className="container-dropdown"
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '400px' }}>
          {/* Header */}
          <div style={{
            padding: '8px 12px',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #e9ecef',
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase',
            color: '#6c757d',
            letterSpacing: '0.5px',
            flex: '0 0 auto'
          }}>
            Select Containers
          </div>

          {/* Container list */}
          <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: '4px 0', minHeight: 0 }}>
            {containerList.map((name, index) => {
              const isSelected = selectedNames.has(name);
              const isEditing = editingIndex === index;

              return (
                <div
                  key={index}
                  style={{
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
                    borderLeft: isSelected ? '3px solid #1976d2' : '3px solid transparent',
                    userSelect: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !isEditing) e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected && !isEditing) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {/* Checkbox */}
                  <div
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (!isEditing) toggleContainer(name);
                    }}
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid',
                      borderColor: isSelected ? '#1976d2' : '#d1d5db',
                      borderRadius: '3px',
                      backgroundColor: isSelected ? '#1976d2' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      color: 'white',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      flex: '0 0 16px',
                    }}
                  >
                    {isSelected && '✓'}
                  </div>

                  {/* Name or edit input */}
                  {isEditing ? (
                    <input
                      ref={editInputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') { e.preventDefault(); executeRename(); }
                        else if (e.key === 'Escape') { e.preventDefault(); setEditingIndex(null); }
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      disabled={isRenaming}
                      style={{
                        flex: 1,
                        padding: '2px 6px',
                        border: '1px solid #1976d2',
                        borderRadius: '3px',
                        fontSize: '12px',
                        outline: 'none',
                        backgroundColor: isRenaming ? '#f0f0f0' : 'white',
                      }}
                    />
                  ) : (
                    <span
                      onMouseDown={(e) => { e.preventDefault(); toggleContainer(name); }}
                      style={{
                        flex: 1,
                        cursor: 'pointer',
                        color: isSelected ? '#1976d2' : '#333',
                        fontWeight: isSelected ? '600' : 'normal',
                      }}
                    >
                      {name}
                    </span>
                  )}

                  {/* Edit / Save button */}
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '4px', flex: '0 0 auto' }}>
                      <button
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); executeRename(); }}
                        disabled={isRenaming}
                        style={{
                          padding: '2px 6px', border: '1px solid #16a34a', borderRadius: '3px',
                          fontSize: '10px', backgroundColor: '#16a34a', color: 'white',
                          cursor: isRenaming ? 'wait' : 'pointer', opacity: isRenaming ? 0.6 : 1,
                        }}
                      >
                        {isRenaming ? '...' : 'Save'}
                      </button>
                      <button
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setEditingIndex(null); }}
                        disabled={isRenaming}
                        style={{
                          padding: '2px 6px', border: '1px solid #d1d5db', borderRadius: '3px',
                          fontSize: '10px', backgroundColor: 'white', color: '#6b7280', cursor: 'pointer',
                        }}
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <button
                      onMouseDown={(e) => startRename(index, e)}
                      title="Rename"
                      style={{
                        padding: '2px 6px', border: '1px solid #d1d5db', borderRadius: '3px',
                        fontSize: '10px', backgroundColor: 'white', color: '#6b7280',
                        cursor: 'pointer', flex: '0 0 auto', opacity: 0.6,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; }}
                    >
                      ✎
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{
            padding: '8px 12px',
            backgroundColor: '#f8f9fa',
            borderTop: '1px solid #e9ecef',
            display: 'flex', gap: '8px', justifyContent: 'flex-end',
            flex: '0 0 auto', position: 'sticky', bottom: 0, zIndex: 1,
          }}>
            <button
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleCancel(); }}
              style={{
                padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px',
                fontSize: '11px', backgroundColor: 'white', color: '#6b7280',
                cursor: 'pointer', fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleSave(); }}
              style={{
                padding: '4px 8px', border: '1px solid #1976d2', borderRadius: '4px',
                fontSize: '11px', backgroundColor: '#1976d2', color: 'white',
                cursor: 'pointer', fontWeight: '500'
              }}
            >
              Apply ({selectedNames.size})
            </button>
          </div>
        </div>
      </AnchoredDropdown>
    </div>
  );
};

export default ContainerCellEditor;
```

---

## FILE: components/FilterBar.tsx

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { ProjectType, TYPE_ORDER } from '../types';
import { getVendors } from '../lib/projects';
import TodayPfControl from './TodayPfControl';
import SignWaitingFilters, { SignWaitingToken, SIGN_WAITING_OPTIONS } from './SignWaitingFilters';
import PfGroupFilterControl from './PfGroupFilterControl';
import FilterEditMenu from './FilterEditMenu';
import { TodayPfFlag } from '../lib/today-pf';
import { PfGroup } from '../lib/pf-groups';
import { useAuth } from '../contexts/AuthContext';

export interface FilterConfig {
  vendors: string[];
  vendorCodes?: string[];
  types: ProjectType[];
  statuses: string[];
  containers: string[];
  halves?: string[]; // Tokens like "2026:FIRST_HALF" or "UNASSIGNED"
  todayPfOnly?: boolean; // Only show projects/types flagged in "Today's PFs"
  followUpOnly?: boolean; // Only show PFs flagged in "Follow Up" (combines with the other flag lists)
  signWaiting?: SignWaitingToken[]; // PO/PF "waiting to sign" quick filters (any-of)
  groupViewOnly?: boolean; // Only show projects/types that belong to a group (same table, group/rank badges added)
}

interface FilterBarProps {
  filterConfig: FilterConfig;
  onFilterChange: (config: FilterConfig) => void;
  totalItems: number;
  filteredItems: number;
  availableContainers?: string[]; // When provided, use these instead of fetching from DB
  availableHalves?: string[]; // Distinct "year:half" tokens present in the data
  matchingProjectCount?: number; // Projects passing all active filters (drives the Half badge count)
  showTodayPf?: boolean; // Projects tab only
  onTodayPfFlagsChange?: (flags: TodayPfFlag[]) => void;
  pfGroups?: PfGroup[];
}

const HALF_LABELS: Record<string, string> = {
  FIRST_HALF: 'First Half',
  SECOND_HALF: 'Second Half',
};

export const formatHalfToken = (token: string): string => {
  if (token === 'UNASSIGNED') return 'Unassigned';
  const [year, half] = token.split(':');
  return `${year} ${HALF_LABELS[half] || half}`;
};

interface Vendor {
  id: string;
  name: string;
  code: string;
}

const STATUS_OPTIONS = [
  'HOLD / T',
  'HOLD / PM',
  'HOLD BOOKS',
  'NOT ORDERED',
  'TO ORDER',
  'BOOKS IN PROGRESS',
  'ORDERED',
  'WAITING PAYMENT',
  'ASSEMBLY',
  'READY TO RECEIVE',
  'RECEIVED',
  'READY',
  'SENT TO TLINES',
  'PARTIAL SENT',
  'SENT'
];


// Color schemes for each filter category
const CHIP_COLORS: Record<string, { bg: string; border: string; text: string; hoverBg: string }> = {
  vendor: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', hoverBg: '#dbeafe' },
  type: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', hoverBg: '#dcfce7' },
  status: { bg: '#fffbeb', border: '#fde68a', text: '#b45309', hoverBg: '#fef3c7' },
  container: { bg: '#fdf4ff', border: '#e9d5ff', text: '#7e22ce', hoverBg: '#f3e8ff' },
  half: { bg: '#ecfeff', border: '#a5f3fc', text: '#0e7490', hoverBg: '#cffafe' },
  todayPf: { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c', hoverBg: '#ffedd5' },
  followUp: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', hoverBg: '#dcfce7' },
  signWait: { bg: '#f5f3ff', border: '#ddd6fe', text: '#6d28d9', hoverBg: '#ede9fe' },
  pfGroup: { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c', hoverBg: '#fee2e2' },
};

// Dropdown component with search and multi-select
const FilterDropdown: React.FC<{
  label: string;
  icon: string;
  options: { value: string; label: string; selected: boolean }[];
  colorKey: string;
  selectedCount: number;
  onToggle: (value: string) => void;
  onClear: () => void;
}> = ({ label, icon, options, colorKey, selectedCount, onToggle, onClear }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const colors = CHIP_COLORS[colorKey];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          height: '34px',
          padding: '0 12px',
          border: selectedCount > 0 ? `1.5px solid ${colors.border}` : '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: selectedCount > 0 ? 600 : 400,
          color: selectedCount > 0 ? colors.text : '#4b5563',
          backgroundColor: selectedCount > 0 ? colors.bg : '#fff',
          cursor: 'pointer',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: '14px' }}>{icon}</span>
        <span>{label}</span>
        {selectedCount > 0 && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: colors.text,
            color: '#fff',
            fontSize: '11px',
            fontWeight: 700,
          }}>
            {selectedCount}
          </span>
        )}
        <span style={{ fontSize: '10px', marginLeft: '2px', opacity: 0.6 }}>
          {open ? '\u25B2' : '\u25BC'}
        </span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '4px',
          width: '240px',
          maxHeight: '320px',
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
          zIndex: 1000,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Search input */}
          <div style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              style={{
                width: '100%',
                height: '30px',
                padding: '0 8px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Clear all */}
          {selectedCount > 0 && (
            <button
              onClick={() => { onClear(); setSearch(''); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                width: '100%',
                padding: '7px 12px',
                border: 'none',
                borderBottom: '1px solid #f3f4f6',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              Clear all ({selectedCount})
            </button>
          )}

          {/* Options list */}
          <div style={{ overflowY: 'auto', maxHeight: '240px' }}>
            {filtered.map(opt => (
              <button
                key={opt.value}
                onClick={() => onToggle(opt.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '7px 12px',
                  border: 'none',
                  backgroundColor: opt.selected ? colors.bg : 'transparent',
                  color: '#1f2937',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => {
                  if (!opt.selected) (e.target as HTMLElement).style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={e => {
                  (e.target as HTMLElement).style.backgroundColor = opt.selected ? colors.bg : 'transparent';
                }}
              >
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '16px',
                  height: '16px',
                  borderRadius: '3px',
                  border: opt.selected ? `2px solid ${colors.text}` : '2px solid #d1d5db',
                  backgroundColor: opt.selected ? colors.text : '#fff',
                  flexShrink: 0,
                  transition: 'all 0.1s',
                }}>
                  {opt.selected && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5L4.5 7.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {opt.label}
                </span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                No results
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const FilterBar: React.FC<FilterBarProps> = ({
  filterConfig,
  onFilterChange,
  availableContainers,
  availableHalves,
  matchingProjectCount,
  showTodayPf,
  onTodayPfFlagsChange,
  pfGroups = [],
}) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [containerNames, setContainerNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Single combined "Edit" entry point for Today's PFs/Follow Up and Groups —
  // each modal's open state lives here now instead of inside its own chip control.
  const { canAccessPage } = useAuth();
  const canManageTodayPf = canAccessPage('todays_pf_manage');
  const [todayManageOpen, setTodayManageOpen] = useState(false);
  const [groupManageOpen, setGroupManageOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const vendorList = await getVendors();
        setVendors(vendorList);
      } catch (error) {
        console.error('Failed to load filter data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Build container list: use availableContainers from table rows (case-insensitive deduplicated)
  useEffect(() => {
    if (availableContainers !== undefined) {
      // Deduplicate case-insensitively, keep the first occurrence's original casing
      const seen = new Map<string, string>(); // lowercase → original
      for (const c of availableContainers) {
        if (!c || !c.trim()) continue;
        const key = c.trim().toLowerCase();
        if (!seen.has(key)) seen.set(key, c.trim());
      }
      const sorted = [...seen.values()].sort((a, b) => {
        const aMatch = a.match(/^Container (\d+)$/i);
        const bMatch = b.match(/^Container (\d+)$/i);
        if (aMatch && bMatch) return parseInt(aMatch[1]) - parseInt(bMatch[1]);
        if (aMatch) return -1;
        if (bMatch) return 1;
        return a.localeCompare(b);
      });
      setContainerNames(sorted);
    }
  }, [availableContainers]);

  // Vendor toggle
  const handleVendorToggle = (vendorId: string) => {
    const newVendors = filterConfig.vendors.includes(vendorId)
      ? filterConfig.vendors.filter(id => id !== vendorId)
      : [...filterConfig.vendors, vendorId];
    const selectedVendorCodes = newVendors
      .map(id => vendors.find(v => v.id === id)?.code)
      .filter(Boolean) as string[];
    onFilterChange({ ...filterConfig, vendors: newVendors, vendorCodes: selectedVendorCodes });
  };

  // Type toggle
  const handleTypeToggle = (type: string) => {
    const t = type as ProjectType;
    const newTypes = filterConfig.types.includes(t)
      ? filterConfig.types.filter(x => x !== t)
      : [...filterConfig.types, t];
    onFilterChange({ ...filterConfig, types: newTypes });
  };

  // Status toggle
  const handleStatusToggle = (status: string) => {
    const newStatuses = filterConfig.statuses.includes(status)
      ? filterConfig.statuses.filter(s => s !== status)
      : [...filterConfig.statuses, status];
    onFilterChange({ ...filterConfig, statuses: newStatuses });
  };

  // Container toggle
  const handleContainerToggle = (container: string) => {
    const containers = filterConfig.containers || [];
    const newContainers = containers.includes(container)
      ? containers.filter(c => c !== container)
      : [...containers, container];
    onFilterChange({ ...filterConfig, containers: newContainers });
  };

  // Half toggle
  const handleHalfToggle = (half: string) => {
    const halves = filterConfig.halves || [];
    const newHalves = halves.includes(half)
      ? halves.filter(h => h !== half)
      : [...halves, half];
    onFilterChange({ ...filterConfig, halves: newHalves });
  };

  const hasActiveFilters = filterConfig.vendors.length > 0 ||
    filterConfig.types.length > 0 ||
    filterConfig.statuses.length > 0 ||
    (filterConfig.containers?.length || 0) > 0 ||
    (filterConfig.halves?.length || 0) > 0 ||
    !!filterConfig.todayPfOnly ||
    !!filterConfig.followUpOnly ||
    !!filterConfig.groupViewOnly ||
    (filterConfig.signWaiting?.length || 0) > 0;

  const totalActiveCount = filterConfig.vendors.length +
    filterConfig.types.length +
    filterConfig.statuses.length +
    (filterConfig.containers?.length || 0) +
    (filterConfig.halves?.length || 0) +
    (filterConfig.todayPfOnly ? 1 : 0) +
    (filterConfig.followUpOnly ? 1 : 0) +
    (filterConfig.groupViewOnly ? 1 : 0) +
    (filterConfig.signWaiting?.length || 0);

  // Build vendor options
  const vendorOptions = vendors.map(v => ({
    value: v.id,
    label: `${v.code} - ${v.name}`,
    selected: filterConfig.vendors.includes(v.id),
  }));

  // Build type options
  const typeOptions = TYPE_ORDER.map(t => ({
    value: t,
    label: t,
    selected: filterConfig.types.includes(t),
  }));

  // Build status options
  const statusOptions = STATUS_OPTIONS.map(s => ({
    value: s,
    label: s,
    selected: filterConfig.statuses.includes(s),
  }));

  // Build container options (defaults + renamed ones from backend)
  const containerOptions = containerNames.map(c => ({
    value: c,
    label: c,
    selected: (filterConfig.containers || []).includes(c),
  }));

  // Build half options from distinct year/half tokens present in the data
  const halfOptions = (availableHalves || []).map(token => ({
    value: token,
    label: formatHalfToken(token),
    selected: (filterConfig.halves || []).includes(token),
  }));

  // Badge shows how many projects match the active Half filter (not how many
  // half values are selected) — e.g. "14" projects, not "1" selected option.
  const halfSelectedCount = (filterConfig.halves || []).length > 0
    ? (matchingProjectCount ?? (filterConfig.halves || []).length)
    : 0;

  // Remove single chip helpers
  const removeVendorChip = (vendorId: string) => {
    const newVendors = filterConfig.vendors.filter(id => id !== vendorId);
    const selectedVendorCodes = newVendors
      .map(id => vendors.find(v => v.id === id)?.code)
      .filter(Boolean) as string[];
    onFilterChange({ ...filterConfig, vendors: newVendors, vendorCodes: selectedVendorCodes });
  };

  const removeTypeChip = (type: ProjectType) => {
    onFilterChange({ ...filterConfig, types: filterConfig.types.filter(t => t !== type) });
  };

  const removeStatusChip = (status: string) => {
    onFilterChange({ ...filterConfig, statuses: filterConfig.statuses.filter(s => s !== status) });
  };

  const removeContainerChip = (container: string) => {
    onFilterChange({ ...filterConfig, containers: (filterConfig.containers || []).filter(c => c !== container) });
  };

  const removeHalfChip = (half: string) => {
    onFilterChange({ ...filterConfig, halves: (filterConfig.halves || []).filter(h => h !== half) });
  };

  const clearAllFilters = () => {
    onFilterChange({ vendors: [], vendorCodes: [], types: [], statuses: [], containers: [], halves: [], todayPfOnly: false, followUpOnly: false, signWaiting: [], groupViewOnly: false });
  };

  return (
    <div style={{
      backgroundColor: '#fff',
      borderBottom: '1px solid #e5e7eb',
      position: 'sticky',
      top: 'var(--filterbar-top)',
      zIndex: 'var(--z-filterbar)' as any,
      padding: '10px 20px',
    }}>
      {/* Top row: dropdowns + count */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap',
      }}>
        {/* Filter icon + label */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#6b7280',
          fontSize: '13px',
          fontWeight: 500,
          userSelect: 'none',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1.5 3h13M3.5 6.5h9M5.5 10h5M7 13.5h2" strokeLinecap="round"/>
          </svg>
          Filters
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '20px', backgroundColor: '#e5e7eb' }} />

        {/* Filter dropdowns */}
        <FilterDropdown
          label={isLoading ? 'Loading...' : 'Vendor'}
          icon=""
          colorKey="vendor"
          options={vendorOptions}
          selectedCount={filterConfig.vendors.length}
          onToggle={handleVendorToggle}
          onClear={() => onFilterChange({ ...filterConfig, vendors: [], vendorCodes: [] })}
        />

        <FilterDropdown
          label="Type"
          icon=""
          colorKey="type"
          options={typeOptions}
          selectedCount={filterConfig.types.length}
          onToggle={handleTypeToggle}
          onClear={() => onFilterChange({ ...filterConfig, types: [] })}
        />

        <FilterDropdown
          label="Status"
          icon=""
          colorKey="status"
          options={statusOptions}
          selectedCount={filterConfig.statuses.length}
          onToggle={handleStatusToggle}
          onClear={() => onFilterChange({ ...filterConfig, statuses: [] })}
        />

        <FilterDropdown
          label="Container"
          icon=""
          colorKey="container"
          options={containerOptions}
          selectedCount={(filterConfig.containers || []).length}
          onToggle={handleContainerToggle}
          onClear={() => onFilterChange({ ...filterConfig, containers: [] })}
        />

        <FilterDropdown
          label="Half"
          icon=""
          colorKey="half"
          options={halfOptions}
          selectedCount={halfSelectedCount}
          onToggle={handleHalfToggle}
          onClear={() => onFilterChange({ ...filterConfig, halves: [] })}
        />

        {showTodayPf && (
          <FilterEditMenu
            items={[
              ...(canManageTodayPf ? [{ key: 'todayPf', label: "Today's PFs & Follow Up", onClick: () => setTodayManageOpen(true) }] : []),
              { key: 'groups', label: 'Groups', onClick: () => setGroupManageOpen(true) },
            ]}
          />
        )}

        {showTodayPf && (
          <TodayPfControl
            pfActive={!!filterConfig.todayPfOnly}
            onTogglePf={() => onFilterChange({ ...filterConfig, todayPfOnly: !filterConfig.todayPfOnly })}
            followActive={!!filterConfig.followUpOnly}
            onToggleFollow={() => onFilterChange({ ...filterConfig, followUpOnly: !filterConfig.followUpOnly })}
            onFlagsChange={onTodayPfFlagsChange}
            manageOpen={todayManageOpen}
            onManageOpenChange={setTodayManageOpen}
          />
        )}

        <SignWaitingFilters
          value={filterConfig.signWaiting || []}
          onChange={next => onFilterChange({ ...filterConfig, signWaiting: next })}
        />

        {showTodayPf && (
          <PfGroupFilterControl
            active={!!filterConfig.groupViewOnly}
            onToggle={() => onFilterChange({ ...filterConfig, groupViewOnly: !filterConfig.groupViewOnly })}
            groups={pfGroups}
            manageOpen={groupManageOpen}
            onManageOpenChange={setGroupManageOpen}
          />
        )}

        {/* Clear all button */}
        {hasActiveFilters && (
          <>
            <div style={{ width: '1px', height: '20px', backgroundColor: '#e5e7eb' }} />
            <button
              onClick={clearAllFilters}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                height: '34px',
                padding: '0 12px',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#dc2626',
                backgroundColor: '#fef2f2',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              Clear all
            </button>
          </>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Result count */}
        {hasActiveFilters && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: '#6b7280',
            whiteSpace: 'nowrap',
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '20px',
              height: '20px',
              padding: '0 6px',
              borderRadius: '10px',
              backgroundColor: '#f3f4f6',
              fontSize: '12px',
              fontWeight: 600,
              color: '#374151',
            }}>
              {totalActiveCount}
            </span>
            active filters
          </div>
        )}
      </div>

      {/* Active filter chips row */}
      {hasActiveFilters && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid #f3f4f6',
        }}>
          {/* Vendor chips */}
          {filterConfig.vendors.map(vendorId => {
            const vendor = vendors.find(v => v.id === vendorId);
            if (!vendor) return null;
            return (
              <ChipTag
                key={`v-${vendorId}`}
                label={vendor.code}
                colorKey="vendor"
                onRemove={() => removeVendorChip(vendorId)}
              />
            );
          })}

          {/* Type chips */}
          {filterConfig.types.map(type => (
            <ChipTag
              key={`t-${type}`}
              label={type}
              colorKey="type"
              onRemove={() => removeTypeChip(type)}
            />
          ))}

          {/* Status chips */}
          {filterConfig.statuses.map(status => (
            <ChipTag
              key={`s-${status}`}
              label={status}
              colorKey="status"
              onRemove={() => removeStatusChip(status)}
            />
          ))}

          {/* Container chips */}
          {(filterConfig.containers || []).map(container => (
            <ChipTag
              key={`c-${container}`}
              label={container}
              colorKey="container"
              onRemove={() => removeContainerChip(container)}
            />
          ))}

          {/* Half chips */}
          {(filterConfig.halves || []).map(half => (
            <ChipTag
              key={`h-${half}`}
              label={formatHalfToken(half)}
              colorKey="half"
              onRemove={() => removeHalfChip(half)}
            />
          ))}

          {/* Today's PFs chip */}
          {filterConfig.todayPfOnly && (
            <ChipTag
              label="ToDo"
              colorKey="todayPf"
              onRemove={() => onFilterChange({ ...filterConfig, todayPfOnly: false })}
            />
          )}
          {filterConfig.followUpOnly && (
            <ChipTag
              label="Receive Follow Up"
              colorKey="followUp"
              onRemove={() => onFilterChange({ ...filterConfig, followUpOnly: false })}
            />
          )}
          {(filterConfig.signWaiting || []).map(tok => (
            <ChipTag
              key={tok}
              label={SIGN_WAITING_OPTIONS.find(o => o.token === tok)?.label || tok}
              colorKey="signWait"
              onRemove={() => onFilterChange({ ...filterConfig, signWaiting: (filterConfig.signWaiting || []).filter(t => t !== tok) })}
            />
          ))}
          {filterConfig.groupViewOnly && (
            <ChipTag
              label="Groups"
              colorKey="pfGroup"
              onRemove={() => onFilterChange({ ...filterConfig, groupViewOnly: false })}
            />
          )}
        </div>
      )}
    </div>
  );
};

// Compact chip tag for active filters
const ChipTag: React.FC<{
  label: string;
  colorKey: string;
  onRemove: () => void;
}> = ({ label, colorKey, onRemove }) => {
  const colors = CHIP_COLORS[colorKey];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '3px 8px 3px 10px',
      backgroundColor: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: '14px',
      fontSize: '12px',
      fontWeight: 500,
      color: colors.text,
      whiteSpace: 'nowrap',
    }}>
      {label}
      <button
        onClick={onRemove}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: 'transparent',
          color: colors.text,
          cursor: 'pointer',
          fontSize: '13px',
          lineHeight: 1,
          padding: 0,
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = colors.border)}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        {'\u00d7'}
      </button>
    </span>
  );
};

export default FilterBar;
```

---

## FILE: components/FilterEditMenu.tsx

```tsx
import React, { useState, useRef, useEffect } from 'react';

interface EditMenuItem {
  key: string;
  label: string;
  onClick: () => void;
}

interface FilterEditMenuProps {
  items: EditMenuItem[];
}

/**
 * One combined "Edit" entry point for the filter bar, instead of a separate
 * bare pencil icon next to every manageable chip cluster (Today's PFs / Follow
 * Up, Groups, ...). Clicking it opens a small menu listing whichever of those
 * the current user can manage; each item opens that feature's own modal.
 */
const FilterEditMenu: React.FC<FilterEditMenuProps> = ({ items }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Edit"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          height: '34px',
          padding: '0 12px',
          border: open ? '1.5px solid #93c5fd' : '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 600,
          color: open ? '#1d4ed8' : '#374151',
          backgroundColor: open ? '#eff6ff' : '#fff',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Edit</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: '4px',
          minWidth: '220px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.12)', zIndex: 1000, overflow: 'hidden',
        }}>
          {items.map(item => (
            <button
              key={item.key}
              onClick={() => { setOpen(false); item.onClick(); }}
              style={{
                display: 'block', width: '100%', padding: '10px 14px', border: 'none', background: 'none',
                textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: '#374151',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterEditMenu;
```

---

## FILE: components/GroupedPfTable.tsx

```tsx
import React, { useMemo } from 'react';
import ProjectBlock from './ProjectBlock';
import { ApiSection, BackendProjectItem } from '../lib/projects';
import { Project } from '../types';
import { PfGroup, tiersOfGroup } from '../lib/pf-groups';

interface GroupedPfTableProps {
  groups: PfGroup[];
  sections: ApiSection[]; // UNFILTERED — source of the real, full, editable project data
  globalItemsById: Map<string, BackendProjectItem>;
  updateGlobalItem: (itemId: string, patch: Partial<BackendProjectItem>) => void;
  onProjectUpdate: (projectId: string) => Promise<void>;
  onItemCreated: (projectId: string, item: BackendProjectItem) => void;
  onDeleteProject: (projectId: string) => Promise<void>;
  highlightedItemId?: string | null;
  highlightField?: string | null;
}

/**
 * "Grouped view": the SAME editable Projects table (real ProjectBlock, full
 * inline editing — vendor, PF code, statuses, dates, everything) reorganized
 * by PF group instead of by region. One big banner per group ("Group N").
 * A project appears ONCE per group even if several of its types belong to
 * that group (at the same or different tiers) — no repeated project header;
 * each type's own "G{n} R{rank}" badge (rendered by ProjectBlock itself)
 * carries the rank, so it's still clear which tier each type belongs to.
 */
const GroupedPfTable: React.FC<GroupedPfTableProps> = ({
  groups, sections, globalItemsById, updateGlobalItem, onProjectUpdate, onItemCreated, onDeleteProject,
  highlightedItemId, highlightField,
}) => {
  const projectsById = useMemo(() => {
    const map = new Map<string, Project>();
    sections.forEach(section => (section.projects || []).forEach(p => map.set(p.projectId, p as unknown as Project)));
    return map;
  }, [sections]);

  if (groups.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        No groups yet. Right-click a project number to create one.
      </div>
    );
  }

  return (
    <div>
      {groups.map(group => {
        // Members in rank order, then bucketed by project so each project renders
        // as ONE block (with all its group-included types inside it).
        const membersInRankOrder = tiersOfGroup(group).flatMap(([, members]) => members);
        const projectOrder: string[] = [];
        const typesByProject = new Map<string, Set<string>>();
        membersInRankOrder.forEach(m => {
          if (!typesByProject.has(m.projectId)) { typesByProject.set(m.projectId, new Set()); projectOrder.push(m.projectId); }
          typesByProject.get(m.projectId)!.add(m.typeLabel);
        });

        return (
          <section key={group.id} style={{ marginBottom: '28px' }}>
            {/* Big banner strip */}
            <div style={{
              padding: '16px 22px', borderRadius: '10px', margin: '0 16px 10px',
              background: 'linear-gradient(135deg, #f87171, #b91c1c)', color: '#fff',
              fontSize: '22px', fontWeight: 800, letterSpacing: '0.4px',
            }}>
              Group {group.number}
            </div>

            {projectOrder.map(projectId => {
              const fullProject = projectsById.get(projectId);
              if (!fullProject) return null;
              const types = typesByProject.get(projectId)!;
              const virtualProject: Project = { ...fullProject, rows: fullProject.rows.filter(r => types.has(r.type)) };
              if (virtualProject.rows.length === 0) return null; // none of these types have items yet

              return (
                <div key={projectId} style={{ margin: '0 16px 10px' }}>
                  <ProjectBlock
                    mode="projects"
                    project={virtualProject}
                    sectionLabel={`Group ${group.number}`}
                    backendItems={(fullProject as any).backendItems}
                    globalItemsById={globalItemsById}
                    updateGlobalItem={updateGlobalItem}
                    onProjectUpdate={onProjectUpdate}
                    onItemCreated={onItemCreated}
                    onDeleteProject={onDeleteProject}
                    showSectionHeader={false}
                    highlightedItemId={highlightedItemId}
                    highlightField={highlightField}
                    enableGrouping={true}
                    pfGroups={groups}
                  />
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
};

export default GroupedPfTable;
```

---

## FILE: components/HalfAssignmentToolbar.tsx

```tsx
import React, { useState } from 'react';
import { ProjectHalf } from '../lib/projects';

interface HalfAssignmentToolbarProps {
  selectedCount: number;
  allVisibleSelected: boolean;
  visibleCount: number;
  onToggleSelectAll: () => void;
  selectedIds: string[];
  onAssign: (ids: string[], halfOfYear: ProjectHalf | null, halfYear: number | null) => Promise<any>;
  onAssigned: () => void;
}

const HalfAssignmentToolbar: React.FC<HalfAssignmentToolbarProps> = ({
  selectedCount,
  allVisibleSelected,
  visibleCount,
  onToggleSelectAll,
  selectedIds,
  onAssign,
  onAssigned,
}) => {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasSelection = selectedCount > 0;

  const handleAssign = async (half: ProjectHalf | null) => {
    if (!hasSelection || isAssigning) return;
    setIsAssigning(true);
    setError(null);
    try {
      await onAssign(selectedIds, half, half ? year : null);
      onAssigned();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign half');
    } finally {
      setIsAssigning(false);
    }
  };

  const buttonBaseStyle: React.CSSProperties = {
    height: '34px',
    padding: '0 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: hasSelection && !isAssigning ? 'pointer' : 'not-allowed',
    opacity: hasSelection && !isAssigning ? 1 : 0.5,
    whiteSpace: 'nowrap',
    border: 'none',
  };

  return (
    <div style={{
      backgroundColor: '#fff',
      borderBottom: '1px solid #e5e7eb',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      flexWrap: 'wrap',
    }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={allVisibleSelected && visibleCount > 0}
          onChange={onToggleSelectAll}
          style={{ width: '15px', height: '15px', cursor: 'pointer' }}
        />
        Select All ({visibleCount})
      </label>

      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '20px',
        height: '20px',
        padding: '0 6px',
        borderRadius: '10px',
        backgroundColor: hasSelection ? '#eff6ff' : '#f3f4f6',
        color: hasSelection ? '#1d4ed8' : '#6b7280',
        fontSize: '12px',
        fontWeight: 600,
      }}>
        {selectedCount} selected
      </span>

      <div style={{ width: '1px', height: '20px', backgroundColor: '#e5e7eb' }} />

      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280' }}>
        Year
        <input
          type="number"
          value={year}
          onChange={e => setYear(parseInt(e.target.value, 10) || new Date().getFullYear())}
          style={{
            width: '70px',
            height: '30px',
            padding: '0 8px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '13px',
          }}
        />
      </label>

      <button
        onClick={() => handleAssign('FIRST_HALF')}
        disabled={!hasSelection || isAssigning}
        style={{ ...buttonBaseStyle, backgroundColor: '#dbeafe', color: '#1d4ed8' }}
      >
        Assign to First Half
      </button>

      <button
        onClick={() => handleAssign('SECOND_HALF')}
        disabled={!hasSelection || isAssigning}
        style={{ ...buttonBaseStyle, backgroundColor: '#dcfce7', color: '#15803d' }}
      >
        Assign to Second Half
      </button>

      <button
        onClick={() => handleAssign(null)}
        disabled={!hasSelection || isAssigning}
        style={{ ...buttonBaseStyle, backgroundColor: '#fef2f2', color: '#dc2626' }}
      >
        Clear Half
      </button>

      {error && (
        <span style={{ fontSize: '12px', color: '#dc2626' }}>{error}</span>
      )}
    </div>
  );
};

export default HalfAssignmentToolbar;
```

---

## FILE: components/InlineEditPanel.tsx

```tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import VendorDropdownField from './VendorDropdownField';
import OrderTypeDropdownField from './OrderTypeDropdownField';
import AddVendorModal from './AddVendorModal';
import { Vendor } from '../types';
import { BackendProjectItem, updateProjectItem, createProjectItem } from '../lib/projects';
import { createMissingExtraItem, updateMissingExtraItem } from '../lib/missing-extra';
import { updateDirectOrderItem, createDirectOrderItem } from '../lib/direct-orders';
import { createExpensesPItem, updateExpensesPItem } from '../lib/expenses-p';
import { createExpensesDirectOrderItem, updateExpensesDirectOrderItem } from '../lib/expenses-direct-order';
import { createExpensesMissingExtraItem, updateExpensesMissingExtraItem } from '../lib/expenses-missing-extra';
import { createTrustStockItem, updateTrustStockItem } from '../lib/trust-stock';
import { usePagePermissions } from '../hooks/usePagePermissions';

interface InlineEditPanelProps {
  isOpen: boolean;
  onClose: () => void;
  clickedCellRect: DOMRect; // ✅ CRITICAL FIX: Exact clicked cell position
  mode?: 'projects' | 'missingExtra' | 'directOrder' | 'expenses-p' | 'expenses-do' | 'expenses-me' | 'trust-stock'; // Add mode prop for endpoint switching
  projectId: string;
  projectItems: BackendProjectItem[]; // All items in the type group
  currentItemId: string; // ✅ ID-based instead of index
  itemsById: Map<string, BackendProjectItem>; // ✅ Fast lookup map
  onItemUpdated: (updatedItem: BackendProjectItem | any) => void;
  onItemAdded?: (newItem: BackendProjectItem | any) => void; // Optional callback for new items
  onNavigate: (newIndex: number) => void;
}

const InlineEditPanel: React.FC<InlineEditPanelProps> = ({
  isOpen,
  onClose,
  clickedCellRect,
  mode = 'projects',
  projectId,
  projectItems,
  currentItemId,
  itemsById,
  onItemUpdated,
  onItemAdded,
  onNavigate,
}) => {
  const { canAddItems } = usePagePermissions();

  // Helper functions for mode-based API calls
  const createItem = async (itemData: any) => {

    if (mode === 'missingExtra') {
      return await createMissingExtraItem(projectId, itemData);
    } else if (mode === 'directOrder') {
      return await createDirectOrderItem(projectId, itemData);
    } else if (mode === 'expenses-p') {
      return await createExpensesPItem(projectId, itemData);
    } else if (mode === 'expenses-do') {
      return await createExpensesDirectOrderItem(projectId, itemData);
    } else if (mode === 'expenses-me') {
      return await createExpensesMissingExtraItem(projectId, itemData);
    } else if (mode === 'trust-stock') {
      return await createTrustStockItem(projectId, itemData);
    } else {
      return await createProjectItem(projectId, itemData);
    }
  };

  const updateItem = async (itemId: string, itemData: any) => {
    if (mode === 'missingExtra') {
      return await updateMissingExtraItem(itemId, itemData);
    } else if (mode === 'directOrder') {
      return await updateDirectOrderItem(projectId, itemId, itemData);
    } else if (mode === 'expenses-p') {
      return await updateExpensesPItem(itemId, itemData);
    } else if (mode === 'expenses-do') {
      return await updateExpensesDirectOrderItem(itemId, itemData);
    } else if (mode === 'expenses-me') {
      return await updateExpensesMissingExtraItem(itemId, itemData);
    } else if (mode === 'trust-stock') {
      return await updateTrustStockItem(itemId, itemData);
    } else {
      return await updateProjectItem(itemId, itemData);
    }
  };

  const panelRef = useRef<HTMLDivElement>(null);
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);

  // Compute position synchronously from clickedCellRect — no useEffect, no flash
  const panelPosition = useMemo(() => {
    if (!isOpen || !clickedCellRect) return { top: -9999, left: -9999 };

    const panelWidth = 400;
    const panelHeight = 320;
    const gap = 8;

    let top = clickedCellRect.bottom + gap;
    let left = clickedCellRect.right + gap;

    if (top + panelHeight > window.innerHeight) {
      top = clickedCellRect.top - panelHeight - gap;
    }
    if (left + panelWidth > window.innerWidth) {
      left = clickedCellRect.left - panelWidth - gap;
    }

    top = Math.max(10, Math.min(top, window.innerHeight - panelHeight - 10));
    left = Math.max(10, Math.min(left, window.innerWidth - panelWidth - 10));

    return { top, left };
  }, [isOpen, clickedCellRect, currentItemId]);

  // Form state
  const [vendorId, setVendorId] = useState<string>('');
  const [orderType, setOrderType] = useState<string>('');
  const isSavingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Removed unused isUserInteracting state

  // Note: Order types are now handled internally by OrderTypeDropdownField

  const currentItem = itemsById.get(currentItemId); // ✅ ID-based lookup instead of index

  // Calculate current index for navigation and display (backward compatibility)
  const currentItemIndex = projectItems.findIndex(item => item.id === currentItemId);

  // ✨ DEBUG: Log permissions when component renders
  useEffect(() => {
    if (!canAddItems) {
    } else {
    }
  }, [canAddItems, currentItem?.type]);

  // Initialize form data when item changes
  useEffect(() => {
    if (currentItem) {
      setVendorId(currentItem.vendorId || '');
      setOrderType(currentItem.orderType || '');
      setError(null);
      setHasChanges(false);
    }
  }, [currentItem]);

  // Order types loading is now handled by OrderTypeDropdownField

  // Track changes
  useEffect(() => {
    if (currentItem) {
      const vendorChanged = vendorId !== (currentItem.vendorId || '');
      const orderTypeChanged = orderType !== (currentItem.orderType || '');
      setHasChanges(vendorChanged || orderTypeChanged);
    }
  }, [vendorId, orderType, currentItem]);

  // Autosave with debouncing
  useEffect(() => {
    if (hasChanges && autoSaveEnabled && !isSavingRef.current) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      const timeoutId = setTimeout(async () => {
        try {
          await handleSave();
        } catch (err) {
          // Error handling is done within handleSave
        }
      }, 300);

      autoSaveTimeoutRef.current = timeoutId;

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [hasChanges, autoSaveEnabled, vendorId, orderType]);

  // Cleanup autosave timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Handle outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      // Don't close if clicking inside the panel
      if (panelRef.current?.contains(target)) {
        return;
      }

      // Don't close if clicking on the original TYPE cell area (using clickedCellRect)
      if (clickedCellRect && target instanceof Element) {
        const elementRect = target.getBoundingClientRect();
        const clickX = elementRect.left + elementRect.width / 2;
        const clickY = elementRect.top + elementRect.height / 2;

        // Check if click is near the original TYPE cell
        if (clickX >= clickedCellRect.left - 10 && clickX <= clickedCellRect.right + 10 &&
            clickY >= clickedCellRect.top - 10 && clickY <= clickedCellRect.bottom + 10) {
          return;
        }
      }

      // Don't close during active save
      if (isSavingRef.current) return;

      // Don't close while there are unsaved changes
      if (hasChanges) return;

      onClose();
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose, clickedCellRect, hasChanges]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {

        if (isSavingRef.current) return;

        if (!hasChanges) {
          onClose();
        } else {
          if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
            onClose();
          }
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, hasChanges]);

  const handleSave = async () => {
    if (!currentItem || !hasChanges) return;
    if (isSavingRef.current) return;

    try {
      isSavingRef.current = true;
      setError(null);

      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }

      const updateData: any = {};
      if (vendorId !== (currentItem.vendorId || '')) {
        updateData.vendorId = vendorId || null;
      }
      if (orderType !== (currentItem.orderType || '')) {
        updateData.orderType = orderType || null;
      }

      const optimisticItem = {
        ...currentItem,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      onItemUpdated(optimisticItem);

      const updatedItem = await updateItem(currentItem.id, updateData);

      onItemUpdated(updatedItem);
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      isSavingRef.current = false;
    }
  };

  const handleNavigatePrevious = () => {
    if (currentItemIndex > 0 && currentItemIndex !== -1) {
      const newIndex = currentItemIndex - 1;
      if (newIndex >= 0 && newIndex < projectItems.length) {
        onNavigate(newIndex);
      }
    }
  };

  const handleNavigateNext = () => {
    if (currentItemIndex < projectItems.length - 1 && currentItemIndex !== -1) {
      const newIndex = currentItemIndex + 1;
      if (newIndex >= 0 && newIndex < projectItems.length) {
        onNavigate(newIndex);
      }
    }
  };

  const handleVendorChange = (vendorId: string | null, _vendor: Vendor | null) => {
    setVendorId(vendorId || '');
    // Removed setIsUserInteracting call
  };

  const handleVendorAdded = (newVendor: Vendor) => {
    setVendorId(newVendor.id);
    // Removed setIsUserInteracting call
    // The VendorDropdownField will reload its vendor list automatically
  };

  const handleAddItem = async () => {
    if (!currentItem) return;

    try {
      isSavingRef.current = true;
      setError(null);

      const newItemData: any = {};

      if (currentItem.customTypeId) {
        // For custom types: pass customTypeId (type should be null for custom types)
        newItemData.customTypeId = currentItem.customTypeId;
        newItemData.type = null;
      } else {
        // For standard types: pass the type enum value
        newItemData.type = currentItem.type;
        newItemData.customTypeId = null;
      }


      const newItem = await createItem(newItemData);

      if (onItemAdded) {
        await onItemAdded(newItem);
      }

      // No full project refresh — handleItemAdded updates local state.
      // Full refresh causes scroll-to-top.

      // Parent component (ProjectBlock) will handle switching to the new item
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add new item');
    } finally {
      isSavingRef.current = false;
    }
  };

  if (!isOpen || !currentItem) return null;

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: `${panelPosition.top}px`,
    left: `${panelPosition.left}px`,
    zIndex: 15000,
    minWidth: '300px',
    maxWidth: '400px'
  };

  return createPortal(
    <>
      <div
        ref={panelRef}
        style={panelStyle}
      >
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#f9fafb',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                Edit {currentItem.type} Item
              </h3>
              {projectItems.length > 1 && (
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  {currentItemIndex + 1} of {projectItems.length}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {/* Add Item Button - only show if user has canAddItems permission */}
              {canAddItems ? (
                <button
                  onClick={handleAddItem}
                  style={{
                    border: '1px solid #059669',
                    backgroundColor: '#ffffff',
                    borderRadius: '4px',
                    color: '#059669',
                    fontSize: '12px',
                    padding: '4px 8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                  }}
                  title="Add another item of the same type"
                >
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>+</span>
                  Add Item
                </button>
              ) : (
                <div style={{
                  fontSize: '10px',
                  color: '#ef4444',
                  fontWeight: '600',
                  padding: '2px 4px',
                  backgroundColor: '#fef2f2',
                  borderRadius: '2px'
                }}>
                  [Add Item Hidden - No Permission]
                </div>
              )}

              {/* Autosave Toggle */}
              <button
                onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: autoSaveEnabled ? '#059669' : '#6b7280',
                  fontSize: '12px',
                  padding: '2px 4px',
                  fontWeight: '500'
                }}
                title={autoSaveEnabled ? 'Disable autosave' : 'Enable autosave'}
              >
                Auto: {autoSaveEnabled ? 'ON' : 'OFF'}
              </button>

              {/* Save Status Indicator */}
              {autoSaveEnabled && hasChanges && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '1px', height: '12px', backgroundColor: '#e5e7eb' }} />
                  <div style={{ color: '#d97706', fontSize: '11px', fontWeight: '500' }}>
                    ● Unsaved
                  </div>
                </div>
              )}

              {/* Navigation */}
              {projectItems.length > 1 && (
                <>
                  <div style={{ width: '1px', height: '16px', backgroundColor: '#e5e7eb', margin: '0 4px' }} />
                  <button
                    onClick={handleNavigatePrevious}
                    disabled={currentItemIndex === 0}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: currentItemIndex === 0 ? 'not-allowed' : 'pointer',
                      color: currentItemIndex === 0 ? '#d1d5db' : '#6b7280',
                      fontSize: '16px',
                      padding: '2px 4px'
                    }}
                    title="Previous item"
                  >
                    ‹
                  </button>
                  <button
                    onClick={handleNavigateNext}
                    disabled={currentItemIndex === projectItems.length - 1}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: currentItemIndex === projectItems.length - 1 ? 'not-allowed' : 'pointer',
                      color: currentItemIndex === projectItems.length - 1 ? '#d1d5db' : '#6b7280',
                      fontSize: '16px',
                      padding: '2px 4px'
                    }}
                    title="Next item"
                  >
                    ›
                  </button>
                  <div style={{ width: '1px', height: '16px', backgroundColor: '#e5e7eb', margin: '0 4px' }} />
                </>
              )}

              {/* Close button */}
              <button
                onClick={onClose}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: '16px',
                  padding: '2px 4px'
                }}
                title="Close"
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '16px' }}>
            {/* Error Message */}
            {error && (
              <div
                style={{
                  marginBottom: '12px',
                  padding: '8px 10px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '4px',
                  color: '#dc2626',
                  fontSize: '12px'
                }}
              >
                {error}
              </div>
            )}

            {/* Current PF Code */}
            {currentItem.pfCode && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>
                  Current PF Code
                </label>
                <div
                  style={{
                    padding: '8px 10px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    color: '#374151'
                  }}
                >
                  {currentItem.pfCode}
                </div>
              </div>
            )}

            {/* Vendor Field */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Vendor
              </label>
              <VendorDropdownField
                value={vendorId}
                onChange={handleVendorChange}
                onAddVendorClick={() => setIsAddVendorModalOpen(true)}
                placeholder="Select vendor..."
                />
            </div>

            {/* Order Type Field */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Order Type
              </label>
              <OrderTypeDropdownField
                value={orderType}
                onChange={(orderTypeName) => {
                  setOrderType(orderTypeName || '');
                }}
                placeholder="Select order type..."
              />
            </div>

            {/* Autosave Status */}
            {hasChanges && autoSaveEnabled && (
              <div
                style={{
                  padding: '8px 10px',
                  backgroundColor: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#ea580c',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#ea580c',
                    borderRadius: '50%',
                    animation: 'pulse 2s infinite'
                  }}
                />
                Changes will be auto-saved in 300ms...
              </div>
            )}

            {/* Info */}
            {vendorId && (
              <div
                style={{
                  padding: '8px 10px',
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#0369a1',
                  marginBottom: '16px'
                }}
              >
                PF code will be automatically generated when you save
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Add Vendor Modal */}
      <AddVendorModal
        isOpen={isAddVendorModalOpen}
        onClose={() => setIsAddVendorModalOpen(false)}
        onVendorAdded={handleVendorAdded}
      />

      {/* Inline keyframes for loading spinner and pulse animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>,
    document.body
  );
};

export default InlineEditPanel;
```

---

## FILE: components/InlineEditors.tsx

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { Status, PfSignStatus, PoSignStatus, ORDER_TYPE_OPTIONS } from '../types';
import PaymentRuleDropdownEditor from './PaymentRuleDropdownEditor';
import { PaymentRule } from '../lib/payment-rules';
import AnchoredDropdown from './ui/AnchoredDropdown';
import { getStatusStyle } from '../utils/statusStyles';

// Import and re-export inline autocomplete components
export { default as CellVendorAutocomplete } from './CellVendorAutocomplete';
export { default as CellOrderTypeAutocomplete } from './CellOrderTypeAutocomplete';
export { default as CellStatusAutocomplete } from './CellStatusAutocomplete';

interface BaseEditorProps {
  value: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}

interface PaymentRuleEditorProps extends BaseEditorProps {
  triggerRef: React.RefObject<HTMLDivElement>;
  paymentRules?: PaymentRule[];
  onRulesUpdated?: (rules: PaymentRule[]) => void;
}

// Text Input Editor
export const TextEditor: React.FC<BaseEditorProps> = ({ value, onSave, onCancel }) => {
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave(inputValue);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleBlur = () => {
    onSave(inputValue);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className="inline-text-editor"
    />
  );
};

// Payment Rule Editor with dropdown selection and global rule creation
export const PaymentRuleEditor: React.FC<PaymentRuleEditorProps> = ({
  value,
  onSave,
  onCancel,
  triggerRef,
  paymentRules = [],
  onRulesUpdated
}) => {
  return (
    <PaymentRuleDropdownEditor
      value={value}
      onSave={onSave}
      onCancel={onCancel}
      triggerRef={triggerRef}
      paymentRules={paymentRules}
      onRulesUpdated={onRulesUpdated}
    />
  );
};

// Date Input Editor
export const DateEditor: React.FC<BaseEditorProps> = ({ value, onSave, onCancel }) => {
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave(inputValue);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleBlur = () => {
    onSave(inputValue);
  };

  return (
    <input
      ref={inputRef}
      type="date"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className="inline-date-editor"
    />
  );
};

// Select Dropdown Editor
interface SelectEditorProps extends BaseEditorProps {
  options: string[];
}

export const SelectEditor: React.FC<SelectEditorProps> = ({ value, options, onSave, onCancel }) => {
  const [isOpen, setIsOpen] = useState(true);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (selectRef.current) {
      selectRef.current.focus();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSave(e.target.value);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
      setIsOpen(false);
    }
  };

  const handleBlur = () => {
    onCancel();
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <select
      ref={selectRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className="inline-select-editor"
      size={Math.min(options.length + 1, 8)}
    >
      <option value={value}>{value}</option>
      {options.filter(option => option !== value).map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
};

// Vendor Select Editor
// Legacy vendor options for backwards compatibility
const LEGACY_VENDOR_OPTIONS = [
  'Premier Millwork Solutions',
  'Elite Storage Systems',
  'Architectural Ceilings Inc',
  'Custom Wood Crafters',
  'Office Furnishings Pro'
];

export const VendorEditor: React.FC<BaseEditorProps> = (props) => {
  return <SelectEditor {...props} options={LEGACY_VENDOR_OPTIONS} />;
};

// Order Type Select Editor
export const OrderTypeEditor: React.FC<BaseEditorProps> = (props) => {
  return <SelectEditor {...props} options={ORDER_TYPE_OPTIONS} />;
};

// Status Select Editor with Portal
interface StatusEditorProps extends BaseEditorProps {
  triggerRef: React.RefObject<HTMLDivElement>;
}

export const StatusEditor: React.FC<StatusEditorProps> = ({ value, onSave, onCancel, triggerRef }) => {
  const allStatusOptions: Status[] = [
    'HOLD / T',
    'HOLD / PM',
    'HOLD BOOKS',
    'NOT ORDERED',
    'TO ORDER',
    'BOOKS IN PROGRESS',
    'ORDERED',
    'ASSEMBLY',
    'READY TO RECEIVE',
    'RECEIVED',
    'READY',
    'SENT TO TLINES',
    'PARTIAL SENT',
    'SENT'
  ];

  // Reorder options: current status first, then others in fixed order
  const orderedOptions = [
    value,
    ...allStatusOptions.filter(option => option !== value)
  ];

  const handleSelect = (selectedValue: string) => {
    onSave(selectedValue); // This triggers parent's handleCellSave -> setEditingCell(null) -> editor unmounts
  };

  const handleClose = () => {
    onCancel(); // This triggers parent's handleCellCancel -> setEditingCell(null) -> editor unmounts
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave(value); // This triggers parent's handleCellSave -> setEditingCell(null) -> editor unmounts
    }
  };

  return (
    <AnchoredDropdown
      isOpen={true} // Always open when editor is mounted
      onClose={handleClose}
      triggerRef={triggerRef}
      className="status-dropdown-editor"
      field="status"
      minWidth={150}
      maxHeight={250}
    >
      <div onKeyDown={handleKeyDown} style={{ padding: '4px 0' }}>
        {orderedOptions.map((option, index) => {
          const statusStyle = getStatusStyle(option);

          return (
            <div
              key={option}
              className={`status-option ${index === 0 ? 'current-status' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent focus changes
                e.stopPropagation(); // Prevent outside click detection
                handleSelect(option); // Select immediately on mousedown
              }}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                backgroundColor: index === 0 ? '#e5f3ff' : 'transparent',
                color: 'black', // 🎨 YAZI HEP SİYAH, BORDER RENKLİ
                fontWeight: index === 0 ? '600' : 'normal',
                borderLeft: `4px solid ${statusStyle.backgroundColor}` // 🎨 MERKEZI STATUS RENK
              }}
            >
              {option}
            </div>
          );
        })}
      </div>
    </AnchoredDropdown>
  );
};

// PF Sign Status Select Editor with Portal
interface PfSignStatusEditorProps extends BaseEditorProps {
  triggerRef: React.RefObject<HTMLDivElement>;
}

export const PfSignStatusEditor: React.FC<PfSignStatusEditorProps> = ({ value, onSave, onCancel, triggerRef }) => {
  const allPfStatusOptions: PfSignStatus[] = ['NOT SIGNED', 'READY TO SIGN', 'SIGNED', 'WAITING T TO SIGN', 'SIGNED WITH EST PRICE'];

  // Reorder options: current status first
  const orderedOptions = [
    value,
    ...allPfStatusOptions.filter(option => option !== value)
  ];

  const handleSelect = (selectedValue: string) => {
    onSave(selectedValue); // This triggers parent's handleCellSave -> setEditingCell(null) -> editor unmounts
  };

  const handleClose = () => {
    onCancel(); // This triggers parent's handleCellCancel -> setEditingCell(null) -> editor unmounts
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave(value); // This triggers parent's handleCellSave -> setEditingCell(null) -> editor unmounts
    }
  };

  return (
    <AnchoredDropdown
      isOpen={true} // Always open when editor is mounted
      onClose={handleClose}
      triggerRef={triggerRef}
      className="status-dropdown-editor"
      field="pfSignStatus"
      minWidth={140}
      maxHeight={180}
    >
      <div onKeyDown={handleKeyDown} style={{ padding: '4px 0' }}>
        {orderedOptions.map((option, index) => {
          const statusStyle = getStatusStyle(option);

          return (
            <div
              key={option}
              className={`status-option ${index === 0 ? 'current-status' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent focus changes
                e.stopPropagation(); // Prevent outside click detection
                handleSelect(option); // Select immediately on mousedown
              }}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                backgroundColor: index === 0 ? '#e5f3ff' : 'transparent',
                color: 'black', // 🎨 YAZI HEP SİYAH, BORDER RENKLİ
                fontWeight: index === 0 ? '600' : 'normal',
                borderLeft: `4px solid ${statusStyle.backgroundColor}` // 🎨 MERKEZI STATUS RENK
              }}
            >
              {option}
            </div>
          );
        })}
      </div>
    </AnchoredDropdown>
  );
};

// PO Sign Status Select Editor with Portal
interface PoSignStatusEditorProps extends BaseEditorProps {
  triggerRef: React.RefObject<HTMLDivElement>;
}

export const PoSignStatusEditor: React.FC<PoSignStatusEditorProps> = ({ value, onSave, onCancel, triggerRef }) => {
  const allPoStatusOptions: PoSignStatus[] = ['NOT SIGNED', 'READY TO SIGN', 'SIGNED', 'WAITING TLINES TO SIGN', 'WAITING T TO SIGN'];

  // Reorder options: current status first
  const orderedOptions = [
    value,
    ...allPoStatusOptions.filter(option => option !== value)
  ];

  const handleSelect = (selectedValue: string) => {
    onSave(selectedValue); // This triggers parent's handleCellSave -> setEditingCell(null) -> editor unmounts
  };

  const handleClose = () => {
    onCancel(); // This triggers parent's handleCellCancel -> setEditingCell(null) -> editor unmounts
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave(value); // This triggers parent's handleCellSave -> setEditingCell(null) -> editor unmounts
    }
  };

  return (
    <AnchoredDropdown
      isOpen={true} // Always open when editor is mounted
      onClose={handleClose}
      triggerRef={triggerRef}
      className="status-dropdown-editor"
      field="poSignStatus"
      minWidth={140}
      maxHeight={180}
    >
      <div onKeyDown={handleKeyDown} style={{ padding: '4px 0' }}>
        {orderedOptions.map((option, index) => {
          const statusStyle = getStatusStyle(option);

          return (
            <div
              key={option}
              className={`status-option ${index === 0 ? 'current-status' : ''}`}
              onClick={(e) => {
                e.preventDefault(); // Prevent focus changes
                e.stopPropagation(); // Prevent outside click detection
                handleSelect(option); // Select immediately on click
              }}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                backgroundColor: index === 0 ? '#e5f3ff' : 'transparent',
                color: 'black', // 🎨 YAZI HEP SİYAH, BORDER RENKLİ
                fontWeight: index === 0 ? '600' : 'normal',
                borderLeft: `4px solid ${statusStyle.backgroundColor}` // 🎨 MERKEZI STATUS RENK
              }}
            >
              {option}
            </div>
          );
        })}
      </div>
    </AnchoredDropdown>
  );
};
```

---

## FILE: components/OperationalBoardGrid.tsx

```tsx
import React, { useState, useMemo, useEffect, useImperativeHandle, forwardRef, useRef, useCallback } from 'react';
import { useLivePatchStore, PatchEventPayload } from '../hooks/useLivePatchStore';
import ProjectBlock from './ProjectBlock';
import { getProjects, mapBackendProjectsToSections, ApiSection, BackendProjectItem, deleteProject, mapBackendTypeToFrontend, mapItemStatusToFrontend, mapSignStatusToFrontend } from '../lib/projects';
import { getMissingExtraCases, BackendMissingExtraCase, deleteMissingExtraCase } from '../lib/missing-extra';
import { deleteDirectOrder } from '../lib/direct-orders';
import { filterProjects } from '../utils/filterUtils';
import { Project } from '../types';
import { useColumnPermissions } from '../hooks/useColumnPermissions';
import { FilterConfig } from './FilterBar';
import { getGridWidthPx, COLUMN_WIDTHS, SCROLLABLE_COLUMNS } from '../lib/gridWidth';
import { getProjectColor } from '../lib/projectColor';
import { useSocket } from '../contexts/SocketContext';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { useAuth } from '../contexts/AuthContext';
import { PfGroup } from '../lib/pf-groups';
import GroupedPfTable from './GroupedPfTable';

// Section Total Row Component
const SectionTotalRow: React.FC<{
  sectionLabel: string;
  totals: { pfUsd: number; pfTl: number; invoice: number; invoiceTl: number; hasData: boolean };
  isColumnVisible: (columnKey: string) => boolean;
  shouldShowMoneyTotals: () => boolean;
  gridWidthPx: string;
}> = ({ sectionLabel, totals, isColumnVisible, shouldShowMoneyTotals, gridWidthPx }) => {
  if (!totals.hasData || !shouldShowMoneyTotals()) {
    return null;
  }

  const sectionName = sectionLabel.replace('TLines ', '').toUpperCase();
  const showUsdTotal = isColumnVisible('pfUsd');
  const showTlTotal = isColumnVisible('pfTl');
  const showInvoiceTotal = isColumnVisible('invoice');
  const showInvoiceTlTotal = isColumnVisible('invoiceTl');

  if (!showUsdTotal && !showTlTotal && !showInvoiceTotal && !showInvoiceTlTotal) {
    return null;
  }

  // Calculate right offset to the right edge of a target column
  const getColumnRightOffset = (targetColumn: string): number => {
    const idx = SCROLLABLE_COLUMNS.findIndex(col => col === targetColumn);
    if (idx === -1) return 0;
    return SCROLLABLE_COLUMNS.slice(idx + 1)
      .filter(col => isColumnVisible(col))
      .reduce((sum, col) => sum + (COLUMN_WIDTHS[col] || 0), 0);
  };

  const moneyBoxStyle: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: '#1d4ed8',
    color: 'white',
    padding: '6px 8px',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '14px',
    border: '1px solid #1e40af',
    width: '150px',
    textAlign: 'center',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      position: 'relative',
      width: gridWidthPx,
      minWidth: gridWidthPx,
      maxWidth: gridWidthPx,
      height: '45px',
      backgroundColor: '#2563eb',
      color: 'white',
      borderRadius: '6px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #1e40af'
    }}>
      <div style={{
        textAlign: 'center',
        fontWeight: '700',
        fontSize: '16px',
        letterSpacing: '0.5px'
      }}>
        {sectionName} TOTALS
      </div>
      {showUsdTotal && (
        <div style={{ ...moneyBoxStyle, right: `${getColumnRightOffset('pfUsd') + 5}px` }}>
          ${totals.pfUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      )}
      {showTlTotal && (
        <div style={{ ...moneyBoxStyle, right: `${getColumnRightOffset('pfTl') + 5}px` }}>
          ₺{totals.pfTl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      )}
      {showInvoiceTotal && (
        <div style={{ ...moneyBoxStyle, right: `${getColumnRightOffset('invoice') + 5}px` }}>
          INV/USD {totals.invoice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      )}
      {showInvoiceTlTotal && (
        <div style={{ ...moneyBoxStyle, right: `${getColumnRightOffset('invoiceTl') + 5}px` }}>
          INV/TL {totals.invoiceTl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      )}
    </div>
  );
};

interface OperationalBoardGridProps {
  mode?: 'projects' | 'missingExtra' | 'directOrder' | 'expenses-p';
  vendorCodeFilter?: string;
  filterConfig?: FilterConfig;
  readOnly?: boolean;
  enableAccountingColumns?: boolean; // SUPPLIER MODE: Show accounting columns inline
  onDataRefresh?: () => void; // Callback for when data is refreshed
  onSectionsChange?: (sections: ApiSection[]) => void; // Callback to expose sections data
  onAllSectionsChange?: (sections: ApiSection[]) => void; // Callback to expose UNFILTERED sections (before filterConfig is applied)
  onItemUpdate?: () => void; // ✅ ADD: Callback when any item is updated
  // NEW: Allow external projects to be passed (for Direct Orders)
  projects?: any[];
  externalLoading?: boolean;
  // Dashboard highlighting
  highlightedItemId?: string | null;
  highlightField?: string | null;
  // Project number search
  projectSearch?: string;
  // DirectOrder: callback for surgical item insert into external state
  onExternalItemCreated?: (projectId: string, item: BackendProjectItem) => void;
  // HALF-YEAR ASSIGNMENT: project selection (Projects page only)
  selectedProjectIds?: Set<string>;
  onToggleProjectSelect?: (projectId: string) => void;
  // TODAY'S PFs: active (projectId:typeLabel) tokens, for the todayPfOnly filter
  todayPfActiveKeys?: Set<string> | null;
  // PF GROUPS: passed through to each ProjectBlock's right-click menu, and used
  // to render the grouped-view table when filterConfig.groupViewOnly is active.
  pfGroups?: PfGroup[];
  allSectionsData?: ApiSection[];
}

export interface OperationalBoardGridHandle {
  refreshData: () => Promise<void>;
}

const OperationalBoardGrid = forwardRef<OperationalBoardGridHandle, OperationalBoardGridProps>(({
  mode = 'projects',
  vendorCodeFilter,
  filterConfig,
  enableAccountingColumns = false,
  onDataRefresh,
  onSectionsChange,
  onAllSectionsChange,
  onItemUpdate,
  projects: externalProjects,
  highlightedItemId,
  highlightField,
  projectSearch = '',
  onExternalItemCreated,
  selectedProjectIds,
  onToggleProjectSelect,
  todayPfActiveKeys,
  pfGroups = [],
  allSectionsData,
}, ref) => {
  const { isColumnVisible: baseIsColumnVisible, shouldShowMoneyTotals } = useColumnPermissions();
  const { userAccessPolicy, isAdmin } = useAuth();
  const allowedTypes = userAccessPolicy?.allowedTypes;

  // Wrap isColumnVisible to exclude expenses columns in non-expenses modes (matching ProjectBlock logic)
  const isExpensesMode = mode === 'expenses-p';
  const EXPENSES_SHOW_COLS = ['expensesUsd', 'expensesTl'];
  const EXPENSES_HIDE_COLS = ['pfCode', 'pfSignStatus', 'poSignStatus', 'pfUsd', 'pfTl', 'rtd', 'containerDate'];
  const isColumnVisible = useCallback((key: string) => {
    if (isExpensesMode) {
      if (EXPENSES_HIDE_COLS.includes(key)) return false;
      if (EXPENSES_SHOW_COLS.includes(key)) return true;
    } else {
      if (EXPENSES_SHOW_COLS.includes(key)) return false;
    }
    return baseIsColumnVisible(key);
  }, [baseIsColumnVisible, isExpensesMode]);

  // Calculate dynamic grid width based on visible columns
  const gridWidthPx = useMemo(() => {
    return getGridWidthPx(isColumnVisible);
  }, [isColumnVisible]);

  const [projectSections, setProjectSections] = useState<ApiSection[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [globalItemsById, setGlobalItemsById] = useState<Map<string, BackendProjectItem>>(new Map());

  // Missing/Extra state
  const [missingExtraCases, setMissingExtraCases] = useState<Record<string, BackendMissingExtraCase[]>>({});
  const [isLoadingMissingExtra, setIsLoadingMissingExtra] = useState(false);
  const [missingExtraError, setMissingExtraError] = useState<string | null>(null);

  // Define fallback sections that always show, even when APIs fail
  const fallbackSections = [
    { id: 'TLINES_NE', label: 'TLines NE' },
    { id: 'TLINES_SE', label: 'TLines SE' },
    { id: 'TLINES_NW', label: 'TLines NW' },
    { id: 'CVW', label: 'TLines CVW' },
    { id: 'TLINES_HQ', label: 'TLines HQ' },
    { id: 'TLINES_TC', label: 'TLines TC' },
  ];

  // SUPPLIER MODE: Strict vendor code filtering - completely isolated from normal filtering
  const supplierMode = Boolean(vendorCodeFilter);
  const effectiveFilterConfig = useMemo(() => {
    if (supplierMode) {
      // SUPPLIER VIEW: STRICT vendor code filtering ONLY
      const config: FilterConfig = {
        vendors: [],                            // MUST be empty - no UUID filtering in supplier view
        vendorCodes: [vendorCodeFilter!],       // e.g., ["YSM"] - string codes only (non-null asserted since supplierMode checks vendorCodeFilter)
        types: [],                              // Supplier view shows all types
        statuses: [],                           // Supplier view shows all statuses
        containers: []                          // Supplier view shows all containers
      };

      // PROOF LOGGING - confirm strict vendor code mode

      return config;
    } else {
      // NORMAL BOARD VIEW: Use FilterBar config for row-level filtering (C) FIXED - was using empty config
      const config = filterConfig || { vendors: [], vendorCodes: [], types: [], statuses: [], containers: [] };

      // PROOF LOGGING - confirm normal filtering mode is using FilterBar config
      if (filterConfig && (filterConfig.vendors.length > 0 || (filterConfig.vendorCodes?.length ?? 0) > 0 || filterConfig.types.length > 0 || filterConfig.statuses.length > 0)) {
      }

      return config;
    }
  }, [vendorCodeFilter, supplierMode, filterConfig, mode]);

  // Convert Missing/Extra cases to sections for display
  const missingExtraSections = useMemo(() => {
    if (mode !== 'missingExtra') return [];

    return fallbackSections.map(fallbackSection => {
      const casesInSection = missingExtraCases[fallbackSection.id] || [];

      // Convert cases to projects for ProjectBlock compatibility
      const projects = casesInSection.map(caseItem => ({
        projectId: caseItem.id,
        projectNo: caseItem.derivedProjectCode,
        projectNumber: caseItem.derivedProjectCode, // Use derived project code (e.g., "301-MS-1")
        projectNumberColor: getProjectColor(caseItem),
        projectName: `${caseItem.baseProjectName} (${caseItem.caseType})`,
        address: '',
        region: '',
        bucket: caseItem.section,
        poSignStatusByType: {},
        derivedProjectCode: caseItem.derivedProjectCode, // STEP 2 FIX: Pass derivedProjectCode to ProjectBlock
        isUrgent: caseItem.isUrgent || false, // ✅ ADD: Preserve urgent status from backend
        containerDate: caseItem.containerDate || null, // ✅ ADD: Preserve container date from backend
        halfOfYear: (caseItem as any).halfOfYear || null,
        halfYear: (caseItem as any).halfYear || null,
        rows: (caseItem.items || []).map(item => ({
          itemId: item.id,
          type: mapBackendTypeToFrontend(item.type, item.customType) as any,
          vendor: item.vendor
            ? (item.vendor.code ? `${item.vendor.code} - ${item.vendor.name}` : item.vendor.name)
            : '',
          vendorId: item.vendorId,
          orderType: item.orderType || '',
          pfSignStatus: item.pfSignStatus,
          poSignStatus: item.poSignStatus,
          status: mapItemStatusToFrontend(item.status || ''),
          std: item.std,
          etd: item.etd,
          rtd: item.rtd,
          rtr: item.rtr,
          rdy: item.rdy,
          ftd: item.ftd,
          snd: item.snd,
          pfUsd: (item.pfUsd || 0).toString(),
          pfTl: (item.pfTl || 0).toString(),
          invoice: (item.invoice || 0).toString(),
          invoiceTl: (item.invoiceTl || 0).toString(),
          paymentRule: item.paymentRule || '',
          containerNo: item.containerNo,
          containerDate: item.containerDate ? new Date(item.containerDate).toISOString().split('T')[0] : '',
          pfCode: item.pfCode || ''
        })),
        backendItems: caseItem.items || []
      }));

      return {
        id: fallbackSection.id,
        label: fallbackSection.label,
        projects
      } as unknown as ApiSection;
    });
  }, [missingExtraCases, mode]);

  // Project number search helper: exact → startsWith → contains priority
  const applyProjectSearch = (projects: any[]): any[] => {
    const q = (projectSearch || '').trim().toLowerCase();
    if (!q) return projects;
    const exact: any[] = [];
    const starts: any[] = [];
    const contains: any[] = [];
    projects.forEach(p => {
      const num = String(p.projectNumber ?? p.projectNo ?? '').toLowerCase();
      if (num === q) exact.push(p);
      else if (num.startsWith(q)) starts.push(p);
      else if (num.includes(q)) contains.push(p);
    });
    return [...exact, ...starts, ...contains];
  };

  // Sign "waiting" filters must react instantly to edits: row.poSignStatus/pfSignStatus come from the
  // last fetch, so overlay the live values kept in globalItemsById before filtering.
  const withLiveSignStatus = useCallback((projects: Project[]): Project[] => {
    if (!effectiveFilterConfig.signWaiting?.length) return projects;
    return projects.map(pr => ({
      ...pr,
      rows: pr.rows.map(r => {
        const live = r.itemId ? globalItemsById.get(r.itemId) : undefined;
        return live
          ? { ...r, pfSignStatus: mapSignStatusToFrontend(live.pfSignStatus), poSignStatus: mapSignStatusToFrontend(live.poSignStatus) } as typeof r
          : r;
      }),
    }));
  }, [effectiveFilterConfig.signWaiting, globalItemsById]);

  const filteredSections = useMemo(() => {
    if (mode === 'missingExtra') {
      return missingExtraSections
        .map((section) => ({
          ...section,
          projects: applyProjectSearch(filterProjects(withLiveSignStatus((section.projects || []) as Project[]), effectiveFilterConfig, true))
        }))
        .filter((section) => section.projects.length > 0);
    } else if (mode === 'directOrder') {
      return (projectSections || []).map(section => ({
        ...section,
        projects: applyProjectSearch(section.projects || [])
      })).filter(section => !(projectSearch?.trim()) || section.projects.length > 0);
    } else {
      const result = (projectSections || []).map((section) => ({
        ...section,
        projects: applyProjectSearch(filterProjects(withLiveSignStatus((section.projects || []) as Project[]), effectiveFilterConfig, false, todayPfActiveKeys))
      }));

      if (supplierMode) {
      }

      return result;
    }
  }, [mode, projectSections, missingExtraSections, effectiveFilterConfig, supplierMode, vendorCodeFilter, projectSearch, todayPfActiveKeys, withLiveSignStatus]);

  // Notify parent about sections data changes
  useEffect(() => {
    if (onSectionsChange && filteredSections.length > 0) {
      onSectionsChange(filteredSections);
    }
  }, [filteredSections, onSectionsChange]);

  // Notify parent about the UNFILTERED sections (before filterConfig narrows them) —
  // used to build filter-dropdown option lists so selecting one Half doesn't make
  // the other Half's option disappear from the list.
  useEffect(() => {
    if (onAllSectionsChange && projectSections.length > 0) {
      onAllSectionsChange(projectSections);
    }
  }, [projectSections, onAllSectionsChange]);

  const parseMoney = (value: any): number => {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const cleaned = value.replace(/,/g, '');
      const num = Number(cleaned);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  // Helper: check if a backend item is restricted for current user
  const isItemRestricted = useCallback((item: BackendProjectItem): boolean => {
    if (isAdmin || !allowedTypes) return false;
    if (item.customTypeId) {
      return !(allowedTypes.customTypeIds ?? []).includes(item.customTypeId);
    }
    if (item.type) {
      return !(allowedTypes.enumTypes ?? []).includes(item.type);
    }
    return false;
  }, [isAdmin, allowedTypes]);

  const calculateSectionTotals = useMemo(() => {
    return (section: ApiSection) => {
      let totalUsd = 0;
      let totalTl = 0;
      let totalInvoice = 0;
      let totalInvoiceTl = 0;
      let itemsCount = 0;

      section.projects.forEach(project => {
        if (project.rows) {
          project.rows.forEach(row => {
            // Skip restricted items from totals
            if (row.itemId && globalItemsById.has(row.itemId)) {
              const liveItem = globalItemsById.get(row.itemId)!;
              if (isItemRestricted(liveItem)) return;
              itemsCount++;
              totalUsd += parseMoney(liveItem.pfUsd);
              totalTl += parseMoney(liveItem.pfTl);
              totalInvoice += parseMoney((liveItem as any).invoice);
              totalInvoiceTl += parseMoney((liveItem as any).invoiceTl);
            } else {
              // Row without live item - check isRestricted flag if available
              if ((row as any).isRestricted) return;
              itemsCount++;
              totalUsd += parseMoney(row.pfUsd);
              totalTl += parseMoney(row.pfTl);
              totalInvoice += parseMoney((row as any).invoice);
              totalInvoiceTl += parseMoney((row as any).invoiceTl);
            }
          });
        }
      });

      return { pfUsd: totalUsd, pfTl: totalTl, invoice: totalInvoice, invoiceTl: totalInvoiceTl, hasData: itemsCount > 0 };
    };
  }, [globalItemsById, isItemRestricted]);

  // Load data functions
  const loadProjects = async () => {
    // CRITICAL FIX: If external projects are provided (e.g., from DirectOrder page), use them
    if (externalProjects !== undefined) {
      setProjectSections(externalProjects as ApiSection[]);
      setIsLoadingProjects(false);
      return;
    }

    try {
      setIsLoadingProjects(true);
      setProjectsError(null);
      const response = await getProjects();
      const sections = mapBackendProjectsToSections(response.data);
      setProjectSections(sections);

      const globalMap = new Map<string, BackendProjectItem>();
      sections.forEach(section => {
        section.projects.forEach(project => {
          if (project.backendItems) {
            project.backendItems.forEach(item => {
              globalMap.set(item.id, item);
            });
          }
        });
      });
      setGlobalItemsById(globalMap);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setProjectsError(error instanceof Error ? error.message : 'Unknown error occurred');
      // Even on error, we can show fallback sections in Missing/Extra mode
      if (mode === 'missingExtra') {
      }
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const loadMissingExtraCases = async () => {
    try {
      setIsLoadingMissingExtra(true);
      setMissingExtraError(null);

      const cases = await getMissingExtraCases();
      setMissingExtraCases(cases as Record<string, BackendMissingExtraCase[]>);

      if (onDataRefresh) {
        onDataRefresh();
      }
    } catch (error) {
      console.error('❌ Failed to load Missing/Extra cases:', error);
      setMissingExtraError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoadingMissingExtra(false);
    }
  };

  // Expose refresh function for optimistic updates
  const refreshData = async () => {
    if (mode === 'projects') {
      await loadProjects();
    } else if (mode === 'missingExtra') {
      await loadMissingExtraCases();
    }
  };

  // Expose refresh function to parent component
  useImperativeHandle(ref, () => ({
    refreshData
  }), [refreshData]);

  // Load data based on mode
  useEffect(() => {

    if (mode === 'directOrder' && externalProjects !== undefined) {
      // Direct Order mode with external data - skip fetch
      loadProjects();
      return;
    }

    if (mode === 'projects') {
      loadProjects();
    } else if (mode === 'missingExtra') {
      loadMissingExtraCases();
    }
  }, [mode, externalProjects]);

  // Socket.IO: real-time updates (only for projects/missingExtra modes)
  // DirectOrder mode: parent DirectOrder.tsx handles socket events
  const { joinRooms, leaveRooms, isConnected, userId: myUserId } = useSocket();
  const prevConnected = useRef(isConnected);
  const livePatch = useLivePatchStore();

  useEffect(() => {
    if (mode === 'directOrder') return; // Parent handles socket
    const room = mode === 'missingExtra' ? 'missing-extra' : 'projects';
    joinRooms([room]);
    return () => { leaveRooms([room]); };
  }, [mode, joinRooms, leaveRooms]);

  useEffect(() => {
    if (mode === 'directOrder') return;
    if (isConnected && !prevConnected.current) {
      refreshData();
    }
    prevConnected.current = isConnected;
  }, [isConnected]);

  // Coalesce bursts of structural events (e.g. several creates in quick succession)
  // into one paginated refresh. The originating user is already excluded server-side
  // via `excludeUserId` (see EventsGateway.emitToRooms), so this only fires when
  // OTHER users are mutating the data set.
  const REFRESH_DEBOUNCE_MS = 750;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRefreshRef = useRef(false);
  const noop = useCallback(() => { }, []);

  // Execute pending refresh when user leaves an input (blur).
  // This means a structural WebSocket event that arrived mid-edit
  // will wait until the user finishes typing before reloading.
  useEffect(() => {
    const onFocusOut = (e: FocusEvent) => {
      const leaving = e.target as HTMLElement;
      if (
        pendingRefreshRef.current &&
        (leaving.tagName === 'INPUT' || leaving.tagName === 'TEXTAREA' || leaving.isContentEditable)
      ) {
        // Small delay so the save handler fires first
        setTimeout(() => {
          pendingRefreshRef.current = false;
          refreshData();
        }, 300);
      }
    };
    document.addEventListener('focusout', onFocusOut);
    return () => document.removeEventListener('focusout', onFocusOut);
  }, [refreshData]);

  const debouncedRefresh = useCallback(() => {
    const activeEl = document.activeElement as HTMLElement | null;
    const isTyping = activeEl && (
      activeEl.tagName === 'INPUT' ||
      activeEl.tagName === 'TEXTAREA' ||
      activeEl.isContentEditable
    );

    if (isTyping) {
      // Mark refresh as pending — will fire in the focusout handler above.
      pendingRefreshRef.current = true;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => refreshData(), REFRESH_DEBOUNCE_MS);
  }, [refreshData]);

  // Only react to events matching current mode
  const projectStructuralHandler = mode === 'projects' ? debouncedRefresh : noop;
  const meHandler = mode === 'missingExtra' ? debouncedRefresh : noop;

  // project-item:created → surgical insert (no full refresh, no scroll reset).
  // Shared logic: surgically insert a new item without full reload — works for all modes
  const insertNewItemIntoProject = useCallback((projectId: string, item: BackendProjectItem) => {
    const newRow = {
      type: mapBackendTypeToFrontend(item.type, (item as any).customType),
      pfCode: item.pfCode || '',
      vendor: item.vendor
        ? (item.vendor.code ? `${item.vendor.code} - ${item.vendor.name}` : item.vendor.name)
        : '',
      vendorId: item.vendorId || '',
      orderType: item.orderType || '',
      pfSignStatus: mapSignStatusToFrontend(item.pfSignStatus),
      poSignStatus: mapSignStatusToFrontend(item.poSignStatus),
      status: mapItemStatusToFrontend(item.status || 'NOT_ORDERED'),
      std: item.std || '', etd: item.etd || '', rtd: item.rtd || '',
      rtr: item.rtr || '', rdy: item.rdy || '', ftd: item.ftd || '', snd: item.snd || '',
      statusNote: item.statusNote || '',
      pfUsd: item.pfUsd ? item.pfUsd.toString() : '',
      pfTl: item.pfTl ? item.pfTl.toString() : '',
      invoice: item.invoice ? item.invoice.toString() : '',
      invoiceTl: (item as any).invoiceTl ? (item as any).invoiceTl.toString() : '',
      paymentRule: item.paymentRule || '',
      containerNo: item.containerNo || '',
      containerDate: item.containerDate ? new Date(item.containerDate).toISOString().split('T')[0] : '',
      itemId: item.id,
    };

    if (mode === 'missingExtra') {
      // ME mode: add item to the matching case's items list
      setMissingExtraCases(prev => {
        const updated: Record<string, any[]> = {};
        for (const [sectionId, cases] of Object.entries(prev)) {
          updated[sectionId] = (cases as any[]).map((caseItem: any) => {
            if (caseItem.id !== projectId) return caseItem;
            const alreadyExists = (caseItem.items || []).some((i: any) => i.id === item.id);
            if (alreadyExists) return caseItem;
            return { ...caseItem, items: [...(caseItem.items || []), item] };
          });
        }
        return updated;
      });
    } else if (mode === 'directOrder' && onExternalItemCreated) {
      // DirectOrder: delegate to parent so it updates its own state
      onExternalItemCreated(projectId, item);
    } else {
      // Projects mode: update projectSections
      setProjectSections(prev => prev.map(section => ({
        ...section,
        projects: section.projects.map(project => {
          if (project.projectId !== projectId) return project;
          const alreadyExists = project.backendItems?.some(i => i.id === item.id);
          if (alreadyExists) return project;
          const filteredRows = (project.rows || []).filter(r => !(!r.itemId && r.type === newRow.type));
          return {
            ...project,
            backendItems: [...(project.backendItems ?? []), item],
            rows: [...filteredRows, newRow],
          };
        }),
      })));
    }

    setGlobalItemsById(prev => {
      if (prev.has(item.id)) return prev;
      const next = new Map(prev);
      next.set(item.id, item);
      return next;
    });
  }, [mode, onExternalItemCreated]);

  const handleItemCreated = useCallback((data: { item: BackendProjectItem; projectId: string }) => {
    if (mode !== 'projects') return;
    insertNewItemIntoProject(data.projectId, data.item);
  }, [mode, insertNewItemIntoProject]);

  // Socket-event contract:
  //   • project-item:created → surgical insert above (no scroll reset)
  //   • project-item:deleted / project:* → structural change, need fresh fetch
  //   • entity:patched → cell-level surgical update (handled by handlePatchEvent below)
  useSocketEvent('project-item:created', handleItemCreated);
  useSocketEvent('project-item:deleted', projectStructuralHandler);
  useSocketEvent('project:created', projectStructuralHandler);
  useSocketEvent('project:updated', projectStructuralHandler);
  useSocketEvent('project:deleted', projectStructuralHandler);
  useSocketEvent('me-item:created', meHandler);
  useSocketEvent('me-item:deleted', meHandler);
  useSocketEvent('me-case:created', meHandler);
  useSocketEvent('me-case:updated', meHandler);
  useSocketEvent('me-case:deleted', meHandler);


  // Fixed bottom scrollbar refs and sync
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);
  const bottomBarInnerRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);

  const handleMainScroll = useCallback(() => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    if (bottomBarRef.current && mainScrollRef.current) {
      bottomBarRef.current.scrollLeft = mainScrollRef.current.scrollLeft;
    }
    requestAnimationFrame(() => { isSyncingRef.current = false; });
  }, []);

  const handleBottomBarScroll = useCallback(() => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    if (mainScrollRef.current && bottomBarRef.current) {
      mainScrollRef.current.scrollLeft = bottomBarRef.current.scrollLeft;
    }
    requestAnimationFrame(() => { isSyncingRef.current = false; });
  }, []);

  // Keep bottom scrollbar width in sync with content scroll width
  useEffect(() => {
    const main = mainScrollRef.current;
    const inner = bottomBarInnerRef.current;
    if (!main || !inner) return;

    const updateWidth = () => {
      inner.style.width = `${main.scrollWidth}px`;
    };
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(main);
    if (main.firstElementChild) observer.observe(main.firstElementChild);
    const interval = setInterval(updateWidth, 1000);

    return () => { observer.disconnect(); clearInterval(interval); };
  }, [mode, filteredSections]);

  const updateGlobalItem = useCallback((itemId: string, patch: Partial<BackendProjectItem>) => {
    setGlobalItemsById(prev => {
      const newMap = new Map(prev);
      const existingItem = newMap.get(itemId);
      if (existingItem) {
        newMap.set(itemId, { ...existingItem, ...patch });
      }
      return newMap;
    });
  }, []);

  // Patch-based handler: apply cell-level updates without full refetch
  // This prevents wiping in-progress edits when another user saves
  const handlePatchEvent = useCallback((data: PatchEventPayload) => {
    // Only handle entities relevant to current mode
    if (mode === 'projects' && data.entity !== 'projectItem') return;
    if (mode === 'missingExtra' && data.entity !== 'meItem') return;
    if (mode === 'directOrder') return; // Parent handles this
    if (!myUserId) return;

    const result = livePatch.handlePatchEvent(data, myUserId);
    if (result.apply && result.patch && result.entityId) {
      // Update globalItemsById for totals
      updateGlobalItem(result.entityId, result.patch);

      // Surgically update projectSections so ProjectBlock gets new backendItems & rows
      if (mode === 'projects') {
        setProjectSections(prev => prev.map(section => ({
          ...section,
          projects: section.projects.map(project => ({
            ...project,
            backendItems: project.backendItems?.map(item =>
              item.id === result.entityId ? { ...item, ...result.patch } : item
            ),
            rows: project.rows.map(row =>
              row.itemId === result.entityId ? { ...row, ...result.patch } : row
            ),
          }))
        })));
      }

      // Surgically update missingExtraCases for ME mode
      if (mode === 'missingExtra') {
        setMissingExtraCases(prev => {
          const updated: Record<string, BackendMissingExtraCase[]> = {};
          for (const [sectionId, cases] of Object.entries(prev)) {
            updated[sectionId] = cases.map(caseItem => ({
              ...caseItem,
              items: caseItem.items?.map(item =>
                item.id === result.entityId ? { ...item, ...result.patch } : item
              ),
            }));
          }
          return updated;
        });
      }
    }
  }, [mode, myUserId, livePatch, updateGlobalItem]);

  useSocketEvent('entity:patched', handlePatchEvent);

  const handleProjectItemUpdate = useCallback(async (_projectId: string) => {
    await loadProjects();
    if (onItemUpdate) onItemUpdate();
  }, [onItemUpdate]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    try {
      if (mode === 'directOrder') {
        await deleteDirectOrder(projectId);
      } else if (mode === 'missingExtra') {
        await deleteMissingExtraCase(projectId);
      } else {
        await deleteProject(projectId);
      }
      if (mode === 'projects') {
        loadProjects();
      } else if (mode === 'missingExtra') {
        loadMissingExtraCases();
      } else if (mode === 'directOrder') {
        if (onDataRefresh) onDataRefresh();
      }
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      alert(`Proje silinirken hata oluştu: ${errorMessage}`);
      throw error;
    }
  }, [mode, onDataRefresh]);

  // Determine loading and error states based on mode
  const isLoading = mode === 'projects' ? isLoadingProjects : isLoadingMissingExtra;
  const dataError = mode === 'projects' ? projectsError : missingExtraError;

  // RESILIENCE: Always show section bars in Missing/Extra mode, even if APIs fail
  const shouldShowFallbackSections = mode === 'missingExtra' && (missingExtraError || projectsError);
  const sectionsToRender = shouldShowFallbackSections
    ? fallbackSections.map(section => ({ ...section, projects: [] as any[] }))
    : filteredSections;

  return (
    <>
      <div ref={mainScrollRef} onScroll={handleMainScroll} className="operational-board-grid global-scroll-container">
        {isLoading && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            Loading {mode === 'missingExtra' ? 'Missing & Extra cases' : 'projects'}...
          </div>
        )}

        {/* Show error for projects mode, but not for Missing/Extra (we show fallback sections) */}
        {dataError && !isLoading && mode === 'projects' && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#dc3545' }}>
            Error: {dataError}
          </div>
        )}

        {/* Show error notice for Missing/Extra mode but still render fallback sections */}
        {missingExtraError && !isLoadingMissingExtra && mode === 'missingExtra' && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#fff3cd',
            color: '#856404',
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            margin: '16px',
            fontSize: '14px'
          }}>
            ⚠️ Missing & Extra data unavailable: {missingExtraError}. Showing section structure.
          </div>
        )}

        {!isLoading && mode === 'projects' && filterConfig?.groupViewOnly ? (
          <GroupedPfTable
            groups={pfGroups}
            sections={allSectionsData || []}
            globalItemsById={globalItemsById}
            updateGlobalItem={updateGlobalItem}
            onProjectUpdate={handleProjectItemUpdate}
            onItemCreated={insertNewItemIntoProject}
            onDeleteProject={handleDeleteProject}
            highlightedItemId={highlightedItemId}
            highlightField={highlightField}
          />
        ) : !isLoading && (
          sectionsToRender.length > 0 ? (
            sectionsToRender.map((section) => {
              // Always show section separator, even if no projects
              const sectionTotals = section.projects?.length > 0
                ? calculateSectionTotals(section)
                : { pfUsd: 0, pfTl: 0, invoice: 0, invoiceTl: 0, hasData: false };

              return (
                <section key={section.id}>
                  {/* Show projects if available */}
                  {section.projects?.map((project) => (
                    <ProjectBlock
                      key={project.projectId}
                      mode={mode}
                      project={project}
                      sectionLabel={section.label}
                      backendItems={project.backendItems}
                      globalItemsById={globalItemsById}
                      updateGlobalItem={updateGlobalItem}
                      onProjectUpdate={handleProjectItemUpdate}
                      onItemCreated={insertNewItemIntoProject}
                      onDeleteProject={handleDeleteProject}
                      supplierVendorCodeFilter={vendorCodeFilter}
                      enableAccountingColumns={enableAccountingColumns}
                      showSectionHeader={section.projects.indexOf(project) === 0}
                      highlightedItemId={highlightedItemId}
                      highlightField={highlightField}
                      selectable={(mode === 'projects' || mode === 'missingExtra' || mode === 'directOrder') && !!onToggleProjectSelect}
                      isSelected={!!selectedProjectIds?.has(project.projectId)}
                      onToggleSelect={onToggleProjectSelect}
                      enableGrouping={mode === 'projects'}
                      pfGroups={pfGroups}
                    />
                  ))}

                  {/* Show totals if there's data */}
                  {section.projects?.length > 0 && (
                    <SectionTotalRow
                      sectionLabel={section.label}
                      totals={sectionTotals}
                      isColumnVisible={isColumnVisible}
                      shouldShowMoneyTotals={shouldShowMoneyTotals}
                      gridWidthPx={gridWidthPx}
                    />
                  )}
                </section>
              );
            })
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              {vendorCodeFilter ? 'No items found for this vendor' : (
                mode === 'missingExtra' ? 'No Missing & Extra cases found' : 'No projects found'
              )}
            </div>
          )
        )}
      </div>

      {/* Fixed bottom scrollbar - always visible at viewport bottom */}
      <div ref={bottomBarRef} onScroll={handleBottomBarScroll} className="global-scroll-bottom-bar">
        <div ref={bottomBarInnerRef} className="global-scroll-bottom-content" />
      </div>
    </>
  );
});

OperationalBoardGrid.displayName = 'OperationalBoardGrid';
export default OperationalBoardGrid;
```

---

## FILE: components/OrderTypeDropdownField.tsx

```tsx
import React, { useState, useRef, useEffect } from 'react';
import AnchoredDropdown from './ui/AnchoredDropdown';
import { getOrderTypes, createOrderType, OrderType } from '../lib/projects';
import { usePagePermissions } from '../hooks/usePagePermissions';

interface OrderTypeDropdownFieldProps {
  value?: string; // Selected order type name
  onChange: (orderTypeName: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const OrderTypeDropdownField: React.FC<OrderTypeDropdownFieldProps> = ({
  value,
  onChange,
  placeholder = 'Select order type...',
  className = '',
  disabled = false
}) => {
  const { canManageMasterData } = usePagePermissions();
  const [isOpen, setIsOpen] = useState(false);
  const [orderTypes, setOrderTypes] = useState<OrderType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter order types based on search term
  const filteredOrderTypes = searchTerm
    ? orderTypes.filter(orderType =>
        orderType.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : orderTypes;

  // Load order types on mount
  useEffect(() => {
    loadOrderTypes();
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const loadOrderTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const orderTypeData = await getOrderTypes();
      setOrderTypes(orderTypeData);
    } catch (err) {
      console.error('❌ Failed to load order types:', err);
      setError(err instanceof Error ? err.message : 'Failed to load order types');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerClick = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    setSearchTerm('');
  };

  const handleOrderTypeSelect = (orderType: OrderType) => {

    // Close dropdown immediately
    setIsOpen(false);
    setSearchTerm('');

    // Apply selection immediately
    onChange(orderType.name);
  };

  const handleCreateOrderType = async (name: string) => {
    if (!canManageMasterData) {
      setError('You do not have permission to create order types');
      return;
    }

    try {
      setCreating(true);
      setError(null);


      const newOrderType = await createOrderType({ name: name.trim() });


      // Refresh order types list
      await loadOrderTypes();

      // Close dropdown and apply selection
      setIsOpen(false);
      setSearchTerm('');

      // Select the newly created order type
      onChange(newOrderType.name);

    } catch (err) {
      console.error('❌ Failed to create order type:', err);
      setError(err instanceof Error ? err.message : 'Failed to create order type');
    } finally {
      setCreating(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  // Check if search term matches any existing order type
  const searchTermExistsAsOrderType = (term: string): boolean => {
    if (!term || !term.trim()) return false;
    const normalizedTerm = term.toLowerCase().trim();
    return orderTypes.some(orderType =>
      orderType.name.toLowerCase() === normalizedTerm
    );
  };

  // Get display text for selected order type
  const displayText = value || placeholder;

  return (
    <div className={`order-type-dropdown-field ${className}`}>
      {/* Trigger */}
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        className={`order-type-dropdown-trigger ${disabled ? 'disabled' : ''} ${isOpen ? 'open' : ''}`}
        style={{
          padding: '8px 12px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: disabled ? '#f5f5f5' : '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '36px'
        }}
      >
        <span
          style={{
            color: value ? '#000' : '#999',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {displayText}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {value && !disabled && (
            <button
              onClick={handleClear}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: '2px',
                color: '#999',
                fontSize: '14px'
              }}
              title="Clear selection"
            >
              ✕
            </button>
          )}
          <span style={{ color: '#999', fontSize: '12px' }}>
            {isOpen ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Shared Anchored Dropdown */}
      <AnchoredDropdown
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
        triggerRef={triggerRef}
        field="orderType"
        minWidth={250}
        maxHeight={280}
        className="order-type-dropdown-field"
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '0'
          }}
        >
          {/* Search Input */}
          <div style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search order types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #ddd',
                borderRadius: '2px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Content */}
          <div style={{ overflow: 'auto', maxHeight: '180px', flex: 1 }}>
            {loading && (
              <div style={{ padding: '12px', textAlign: 'center', color: '#999' }}>
                Loading order types...
              </div>
            )}

            {error && (
              <div style={{ padding: '12px', color: '#dc3545', fontSize: '14px' }}>
                {error}
                <button
                  onClick={loadOrderTypes}
                  style={{
                    marginLeft: '8px',
                    padding: '2px 8px',
                    border: '1px solid #dc3545',
                    background: 'none',
                    color: '#dc3545',
                    borderRadius: '2px',
                    cursor: 'pointer'
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Create New Option - Show when user typed something that doesn't match existing order types */}
            {!loading && !error && canManageMasterData && searchTerm && filteredOrderTypes.length === 0 && !searchTermExistsAsOrderType(searchTerm) && (
              <div
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCreateOrderType(searchTerm);
                }}
                style={{
                  padding: '10px 12px',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  backgroundColor: '#f0f9ff',
                  borderLeft: '3px solid #1976d2',
                  color: creating ? '#999' : '#1976d2',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  if (!creating) {
                    e.currentTarget.style.backgroundColor = '#e3f2fd';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f9ff';
                }}
              >
                {creating ? (
                  <span>Creating...</span>
                ) : (
                  <>
                    <span style={{ fontSize: '16px' }}>+</span>
                    Create new: "{searchTerm}"
                  </>
                )}
              </div>
            )}

            {!loading && !error && filteredOrderTypes.length === 0 && searchTerm && (searchTermExistsAsOrderType(searchTerm) || !canManageMasterData) && (
              <div style={{ padding: '12px', color: '#999', fontSize: '14px' }}>
                No order types found matching "{searchTerm}"
              </div>
            )}

            {!loading && !error && filteredOrderTypes.length === 0 && !searchTerm && (
              <div style={{ padding: '12px', color: '#999', fontSize: '14px' }}>
                No order types available
              </div>
            )}

            {/* Order Type Options */}
            {filteredOrderTypes.map((orderType) => (
              <div
                key={orderType.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOrderTypeSelect(orderType);
                }}
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  backgroundColor: value === orderType.name ? '#e3f2fd' : 'transparent',
                  borderLeft: value === orderType.name ? '3px solid #1976d2' : '3px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = value === orderType.name ? '#e3f2fd' : '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = value === orderType.name ? '#e3f2fd' : 'transparent';
                }}
              >
                <div style={{ fontWeight: '500', fontSize: '14px' }}>
                  {orderType.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </AnchoredDropdown>
    </div>
  );
};

export default OrderTypeDropdownField;
```

---

## FILE: components/PaymentRuleDropdownEditor.tsx

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { PaymentRule, getPaymentRules, createPaymentRule } from '../lib/payment-rules';
import AnchoredDropdown from './ui/AnchoredDropdown';

interface PaymentRuleDropdownEditorProps {
  value: string;
  onSave: (value: string) => void;
  onCancel: () => void;
  triggerRef: React.RefObject<HTMLDivElement>;
  paymentRules?: PaymentRule[];
  onRulesUpdated?: (rules: PaymentRule[]) => void;
}

const PaymentRuleDropdownEditor: React.FC<PaymentRuleDropdownEditorProps> = ({
  value,
  onSave,
  onCancel,
  triggerRef,
  paymentRules = [],
  onRulesUpdated
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [localRules, setLocalRules] = useState<PaymentRule[]>(paymentRules);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load rules if not provided
  useEffect(() => {
    if (paymentRules.length === 0) {
      loadRules();
    } else {
      setLocalRules(paymentRules);
    }
  }, [paymentRules]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (inputRef.current) {
      // Small delay to ensure the dropdown is positioned
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, []);

  const loadRules = async () => {
    try {
      const rules = await getPaymentRules();
      setLocalRules(rules);
      onRulesUpdated?.(rules);
    } catch (error) {
      console.error('Failed to load payment rules:', error);
    }
  };

  // Default payment rule options - percentage values
  const defaultOptions = ['10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%', '100%'];

  // Combine default options with loaded rules (remove duplicates)
  const allRules = [...defaultOptions.map((value, index) => ({
    id: `default-${index}`,
    value,
    createdAt: '',
    updatedAt: ''
  })), ...localRules.filter(rule => !defaultOptions.includes(rule.value))];

  // Filter rules based on search term - show all if no search term
  const filteredRules = searchTerm.trim()
    ? allRules.filter(rule => rule.value.toLowerCase().includes(searchTerm.toLowerCase()))
    : allRules;

  // Check if current search term matches any existing rule exactly
  const exactMatch = allRules.find(rule =>
    rule.value.toLowerCase() === searchTerm.toLowerCase()
  );

  // Show "Create new" option if search term doesn't match existing rules exactly
  const showCreateOption = searchTerm.trim() && !exactMatch;

  // Auto-format input with % for numeric values
  const formatInput = (input: string): string => {
    const trimmed = input.trim();

    // If input is just a number (like "50", "100"), auto-add %
    if (/^\d+$/.test(trimmed)) {
      return trimmed + '%';
    }

    return trimmed;
  };

  const handleRuleSelect = (selectedValue: string) => {
    // Apply auto-formatting
    const formattedValue = formatInput(selectedValue);
    onSave(formattedValue);
  };

  const handleCreateNew = async () => {
    if (!searchTerm.trim() || exactMatch || isCreating) return;

    setIsCreating(true);
    try {
      // Apply auto-formatting before creating
      const formattedValue = formatInput(searchTerm);

      // Create the new rule with formatted value
      const newRule = await createPaymentRule({ value: formattedValue });

      // Add to local state immediately
      const updatedRules = [...localRules, newRule];
      setLocalRules(updatedRules);
      onRulesUpdated?.(updatedRules);

      // Select the new rule
      onSave(formattedValue);
    } catch (error) {
      console.error('Failed to create payment rule:', error);
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showCreateOption) {
        handleCreateNew();
      } else if (filteredRules.length > 0) {
        handleRuleSelect(filteredRules[0].value);
      } else if (searchTerm.trim()) {
        // Apply auto-formatting for direct input
        const formattedValue = formatInput(searchTerm);
        onSave(formattedValue);
      }
    } else if (e.key === 'Enter') {
      onSave(value); // This triggers parent's handleCellSave -> setEditingCell(null) -> editor unmounts
    }
  };

  const handleClose = () => {
    onCancel(); // This triggers parent's handleCellCancel -> setEditingCell(null) -> editor unmounts
  };

  return (
    <AnchoredDropdown
      isOpen={true} // Always open when editor is mounted
      onClose={handleClose}
      triggerRef={triggerRef}
      className="payment-rule-dropdown-editor"
      field="paymentRule"
      minWidth={200}
      maxHeight={300}
    >
      <div style={{ padding: '4px 0' }}>
        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search or type new rule..."
          style={{
            width: '100%',
            padding: '8px 12px',
            border: 'none',
            borderBottom: '1px solid #eee',
            outline: 'none',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        />

        {/* Dropdown Options */}
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {/* Clear Option - only show when a value is currently set */}
          {value && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSave('');
              }}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#dc2626',
                backgroundColor: 'transparent',
                borderLeft: '4px solid transparent',
                borderBottom: '1px solid #f0f0f0'
              }}
            >
              ✕ Clear
            </div>
          )}

          {/* Existing Rules */}
          {filteredRules.map(rule => (
            <div
              key={rule.id}
              className="payment-rule-option"
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent focus changes
                e.stopPropagation(); // Prevent outside click detection
                handleRuleSelect(rule.value); // Select immediately on mousedown
              }}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                backgroundColor: rule.value === value ? '#e5f3ff' : 'transparent',
                color: '#374151',
                fontWeight: rule.value === value ? '600' : 'normal',
                borderLeft: rule.value === value ? '4px solid #3b82f6' : '4px solid transparent'
              }}
            >
              {rule.value}
            </div>
          ))}

          {/* Create New Option */}
          {showCreateOption && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isCreating) {
                  handleCreateNew();
                }
              }}
              style={{
                padding: '10px 16px',
                cursor: isCreating ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                color: '#007bff',
                backgroundColor: 'transparent',
                fontStyle: 'italic',
                borderLeft: '4px solid transparent'
              }}
            >
              {isCreating ? 'Creating...' : `Create new: "${searchTerm}"`}
            </div>
          )}

          {/* No Results Message */}
          {filteredRules.length === 0 && !showCreateOption && (
            <div style={{
              padding: '10px 16px',
              fontSize: '14px',
              color: '#666',
              fontStyle: 'italic'
            }}>
              {searchTerm ? 'No matching rules found' : 'No payment rules available'}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div style={{
          padding: '6px 12px',
          fontSize: '12px',
          color: '#666',
          borderTop: '1px solid #f5f5f5',
          backgroundColor: '#f9f9f9'
        }}>
          Type to search or create new • Enter to select • Esc to cancel
        </div>
      </div>
    </AnchoredDropdown>
  );
};

export default PaymentRuleDropdownEditor;
```

---

## FILE: components/PfGroupFilterControl.tsx

```tsx
import React from 'react';
import { PfGroup } from '../lib/pf-groups';
import PfGroupManageModal from './PfGroupManageModal';

interface PfGroupFilterControlProps {
  active: boolean;
  onToggle: () => void;
  groups: PfGroup[];
  // The manage modal's open state is owned by FilterBar, which puts a single
  // combined "Edit" button in front of every chip cluster instead of each one
  // having its own pencil icon.
  manageOpen: boolean;
  onManageOpenChange: (open: boolean) => void;
}

const colors = { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c' };

/** "Groups" filter chip — open to everyone, no permission gate (grouping is a
 * general Projects-tab tool, like the right-click project menu it's driven from). */
const PfGroupFilterControl: React.FC<PfGroupFilterControlProps> = ({ active, onToggle, groups, manageOpen, onManageOpenChange }) => {
  const count = groups.length;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <button
        onClick={onToggle}
        title="Show the grouped-view table"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          height: '34px',
          padding: '0 12px',
          border: active ? `1.5px solid ${colors.border}` : '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: active ? 600 : 400,
          color: active ? colors.text : '#4b5563',
          backgroundColor: active ? colors.bg : '#fff',
          cursor: 'pointer',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        <span>Groups</span>
        {count > 0 && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '18px',
            height: '18px',
            padding: '0 4px',
            borderRadius: '9px',
            backgroundColor: active ? colors.text : '#9ca3af',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 700,
          }}>
            {count}
          </span>
        )}
      </button>

      {manageOpen && (
        <PfGroupManageModal groups={groups} onClose={() => onManageOpenChange(false)} />
      )}
    </div>
  );
};

export default PfGroupFilterControl;
```

---

## FILE: components/PfGroupManageModal.tsx

```tsx
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { PfGroup, PfGroupMember, reorderPfGroupMember, removePfGroupMember, deletePfGroup, tiersOfGroup } from '../lib/pf-groups';

/** Within one tier, members from the SAME project are shown as one merged card
 * (no need to repeat the project number) — each type still keeps its own rank
 * tag and its own controls, since it can be moved/removed independently. */
const byProject = (members: PfGroupMember[]): [string, PfGroupMember[]][] => {
  const map = new Map<string, PfGroupMember[]>();
  members.forEach(m => {
    const arr = map.get(m.projectId) || [];
    arr.push(m);
    map.set(m.projectId, arr);
  });
  return [...map.entries()];
};

interface PfGroupManageModalProps {
  groups: PfGroup[];
  onClose: () => void;
}

const PfGroupManageModal: React.FC<PfGroupManageModalProps> = ({ groups, onClose }) => {
  const [busy, setBusy] = useState<string | null>(null); // key of the button currently in flight
  const [error, setError] = useState<string | null>(null);
  const pressedOnBackdrop = useRef(false);

  const guard = async (key: string, fn: () => Promise<any>) => {
    if (busy) return;
    setBusy(key);
    setError(null);
    try {
      await fn();
      // The backend's socket event refreshes `groups` from the parent; nothing else to do here.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  return createPortal(
    <div
      onMouseDown={e => { pressedOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => { if (pressedOnBackdrop.current && e.target === e.currentTarget) onClose(); pressedOnBackdrop.current = false; }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(15,23,42,0.6)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: 2000,
        padding: '24px',
      }}
    >
      <div
        style={{
          background: '#f9fafb', borderRadius: '16px', width: '96vw', maxWidth: '1300px',
          maxHeight: '94vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 30px 80px rgba(0,0,0,0.35)', overflow: 'hidden',
        }}
      >
        <div style={{
          padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(135deg, #f87171, #b91c1c)', color: '#fff', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>Manage Groups</h3>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', width: '34px', height: '34px',
              borderRadius: '50%', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '24px 28px', overflowY: 'auto' }}>
          {error && (
            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', marginBottom: '18px', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          {groups.length === 0 ? (
            <div style={{ fontSize: '14px', color: '#9ca3af', padding: '16px', background: '#fff', borderRadius: '10px', border: '1px dashed #e5e7eb' }}>
              No groups yet. Right-click a project number in the Projects grid to create one.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {groups.map(group => (
                <div key={group.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 20px',
                    background: 'linear-gradient(135deg, #f87171, #b91c1c)', color: '#fff',
                  }}>
                    <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '0.3px' }}>
                      Group {group.number}
                    </div>
                    <button
                      onClick={() => guard(`del-group-${group.id}`, () => deletePfGroup(group.id))}
                      disabled={!!busy}
                      title="Delete this entire group"
                      style={{ border: 'none', background: 'rgba(255,255,255,0.18)', color: '#fff', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '999px' }}
                    >
                      {busy === `del-group-${group.id}` ? '…' : '🗑️ Delete group'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px 20px' }}>
                    {tiersOfGroup(group).map(([rank, members], tierIdx) => (
                      <div key={rank} style={{ display: 'flex', gap: '14px', alignItems: 'stretch' }}>
                        <div style={{
                          width: '38px', flexShrink: 0, borderRadius: '10px', background: '#fef2f2', color: '#b91c1c',
                          fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {rank}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '8px' }}>
                          {byProject(members).map(([projectId, projectMembers]) => (
                            <div key={projectId} style={{
                              padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fafafa',
                            }}>
                              <strong style={{ fontSize: '14px' }}>{projectMembers[0].projectNo}</strong>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                                {projectMembers.map(m => (
                                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{
                                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                      width: '16px', height: '16px', borderRadius: '4px', background: '#fef2f2', color: '#b91c1c',
                                      fontSize: '10px', fontWeight: 800, flexShrink: 0,
                                    }}>
                                      {rank}
                                    </span>
                                    <span style={{ flex: 1, minWidth: 0, fontSize: '13px', color: '#374151' }}>{m.typeLabel}</span>
                                    <button
                                      onClick={() => guard(`up-${m.id}`, () => reorderPfGroupMember(m.id, 'up'))}
                                      disabled={!!busy || tierIdx === 0}
                                      title="Move up a tier (joins whatever is already there)"
                                      style={{ border: 'none', background: 'transparent', cursor: tierIdx === 0 ? 'default' : 'pointer', color: tierIdx === 0 ? '#d1d5db' : '#374151', fontSize: '14px', width: '20px' }}
                                    >
                                      ▲
                                    </button>
                                    <button
                                      onClick={() => guard(`down-${m.id}`, () => reorderPfGroupMember(m.id, 'down'))}
                                      disabled={!!busy}
                                      title="Move down a tier (joins the next one, or starts a new one)"
                                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#374151', fontSize: '14px', width: '20px' }}
                                    >
                                      ▼
                                    </button>
                                    <button
                                      onClick={() => guard(`rm-${m.id}`, () => removePfGroupMember(m.id))}
                                      disabled={!!busy}
                                      title="Remove from group"
                                      style={{
                                        border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer',
                                        width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px',
                                      }}
                                    >
                                      {busy === `rm-${m.id}` ? '…' : '×'}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '20px' }}>
            To add a new group or a new member, right-click a project number in the Projects grid.
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PfGroupManageModal;
```

---

## FILE: components/ProjectBlock.tsx

```tsx
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Project, TYPE_ORDER, ProjectType, TypeGroup, createItemsMap, sortProjectItemsInTypeGroup, sortItemsForDisplay } from '../types';
import { ROW_HEIGHT, TOTAL_ROW_HEIGHT } from '../constants';
import ProjectHeader from './ProjectHeader';
import SectionSeparator from './SectionSeparator';
import InlineEditPanel from './InlineEditPanel';
import ProjectMenu from './ProjectMenu';
import AddToGroupModal from './AddToGroupModal';
import { getGridWidthPx, COLUMN_WIDTHS } from '../lib/gridWidth';
import { apiFetch } from '../lib/auth';
import { getProjectColorFromMap, ProjectColor } from '../lib/projectColor';
import { displayProjectNo, parseDuplicateMarker } from '../lib/displayHelpers';
import {
  TextEditor,
  DateEditor,
  VendorEditor,
  OrderTypeEditor,
  StatusEditor,
  PfSignStatusEditor,
  PoSignStatusEditor,
  PaymentRuleEditor,
  CellVendorAutocomplete,
  CellOrderTypeAutocomplete,
  CellStatusAutocomplete
} from './InlineEditors';
import ContainerCellEditor from './ContainerCellEditor';
import { BackendProjectItem, updateProjectItem, createProjectItem, deleteProjectItem, mapBackendTypeToFrontend, mapTypeToEnum, mapSignStatusToFrontend } from '../lib/projects';
import { createMissingExtraItem, updateMissingExtraItem, deleteMissingExtraItem } from '../lib/missing-extra';
import { PfGroup } from '../lib/pf-groups';
import { updateDirectOrderItem, createDirectOrderItem, deleteDirectOrderItem } from '../lib/direct-orders';
import { updateExpensesPItem, createExpensesPItem, deleteExpensesPItem } from '../lib/expenses-p';
import { updateExpensesDirectOrderItem, createExpensesDirectOrderItem, deleteExpensesDirectOrderItem } from '../lib/expenses-direct-order';
import { updateExpensesMissingExtraItem, createExpensesMissingExtraItem, deleteExpensesMissingExtraItem } from '../lib/expenses-missing-extra';
import { formatDateCell } from '../lib/dateUtils';
import { getContainerDisplayText } from '../utils/containerUtils';
import { useColumnPermissions } from '../hooks/useColumnPermissions';
import { ColumnKey } from '../lib/columns';
import { usePaymentRules } from '../contexts/PaymentRulesContext';
import {
  useAccountingState,
  calculateRowAccounting,
  EditableAccountingCell,
  ReadOnlyAccountingCell,
  formatAccountingValue
} from './AccountingColumns';
import { getStatusStyle } from '../utils/statusStyles';
import { useUndoStack } from '../hooks/useUndoStack';
import { createTrustStockItem, updateTrustStockItem, deleteTrustStockItem, isStockVendorCode } from '../lib/trust-stock';
import StockUsageModal from './StockUsageModal';

// Trust Stock page: columns shown (plus the Trust-Stock-only ORDER NO column)
const TRUST_STOCK_COLS = ['projectNo', 'type', 'pfCode', 'vendor', 'pfSignStatus', 'status', 'std', 'etd', 'rtr', 'rtd', 'pfUsd', 'pfTl', 'invoice', 'invoiceTl', 'paymentRule'];
const ORDER_NO_WIDTH = 160; // keep in sync with .col-order-no in styles.css
import { useAuth } from '../contexts/AuthContext';

// Error Boundary to prevent white screen crashes
class InlineEditPanelErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _errorInfo: React.ErrorInfo) {
    // Error handling for InlineEditPanel crashes
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '20px',
          backgroundColor: '#fee2e2',
          border: '1px solid #dc2626',
          borderRadius: '8px',
          color: '#dc2626',
          zIndex: 50000
        }}>
          <h3>Panel Error</h3>
          <p>The edit panel encountered an error and has been closed to prevent crashes.</p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onError();
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface EditingState {
  projectId: string;
  itemId: string; // CRITICAL FIX: Use itemId instead of __rowIndex
  field: string;
  typeGroup?: ProjectType;
}

interface VendorEditState {
  typeGroup: ProjectType;
  projectItems: BackendProjectItem[];
  currentItemId: string; // ✅ ID-based instead of index
  itemsById: Map<string, BackendProjectItem>; // ✅ Fast lookup map
  clickedCellRect: DOMRect; // ✅ CRITICAL FIX: Store exact clicked cell position
}

interface ProjectBlockProps {
  mode?: 'projects' | 'missingExtra' | 'directOrder' | 'expenses-p' | 'expenses-do' | 'expenses-me' | 'trust-stock';
  project: Project;
  sectionLabel: string; // Section label (e.g., "TLines NE", "CVW") - required for section header
  backendItems?: BackendProjectItem[]; // Optional backend items for vendor editing
  globalItemsById?: Map<string, BackendProjectItem>; // Global items state for reactive totals
  updateGlobalItem?: (itemId: string, patch: Partial<BackendProjectItem>) => void; // Global item update function
  onProjectUpdate?: (projectId: string) => Promise<void>; // Callback to refresh project data
  onItemCreated?: (projectId: string, item: BackendProjectItem) => void; // Surgical row insert after create
  onDeleteProject?: (projectId: string) => Promise<void>; // Callback to delete project
  supplierVendorCodeFilter?: string; // SUPPLIER MODE: Filter rows by vendor code at render time
  enableAccountingColumns?: boolean; // SUPPLIER MODE: Show accounting columns (Paid, Remaining, Not Ordered)
  showSectionHeader?: boolean; // Show section separator header (only for first project in section)
  onSupplierItemUpdated?: (updatedItem: BackendProjectItem) => void; // SUPPLIER MODE: Callback for immediate UI updates
  isSupplierMode?: boolean; // SUPPLIER MODE: Hide PO Sign Status column when true
  // Dashboard highlighting
  highlightedItemId?: string | null;
  highlightField?: string | null;
  // 🚨 PERMISSION OVERRIDES: Allow supplier components to override column permissions
  permissionOverrides?: {
    isColumnVisible?: (columnKey: string) => boolean;
    isColumnEditable?: (columnKey: string) => boolean;
    isColumnReadOnly?: (columnKey: string) => boolean;
  };
  // HALF-YEAR ASSIGNMENT: project selection checkbox (Projects page only)
  selectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (projectId: string) => void;
  // PF GROUPS: right-click "Add to Group" menu (Projects tab only)
  enableGrouping?: boolean;
  pfGroups?: PfGroup[];
}

const ProjectBlock: React.FC<ProjectBlockProps> = ({ mode = 'projects', project, sectionLabel, backendItems, globalItemsById: _globalItemsById, updateGlobalItem, onProjectUpdate, onItemCreated, onDeleteProject, supplierVendorCodeFilter, enableAccountingColumns = false, showSectionHeader = false, onSupplierItemUpdated, isSupplierMode = false, permissionOverrides, highlightedItemId: highlightedItemIdProp, highlightField: highlightFieldProp, selectable = false, isSelected = false, onToggleSelect, enableGrouping = false, pfGroups = [] }) => {

  // Access control: get allowedTypes for restricted row detection
  const { userAccessPolicy, isAdmin } = useAuth();
  const allowedTypes = userAccessPolicy?.allowedTypes;

  // FIXED: Single source of truth - store items by itemId to prevent data loss
  const [itemsById, setItemsById] = useState<Map<string, BackendProjectItem>>(new Map());
  
  // Accounting state management (supplier mode only)
  const { getPaidAmounts, updatePaidAmount } = useAccountingState();

  // Undo stack - CTRL+Z support for last 3 mutations (global singleton)
  const undoEntityType = mode === 'directOrder' ? 'directOrderItem' as const
    : mode === 'missingExtra' ? 'missingExtraItem' as const
    : (mode === 'expenses-p' || mode === 'expenses-do' || mode === 'expenses-me') ? 'expensesPItem' as const
    : mode === 'trust-stock' ? 'trustStockItem' as const
    : 'projectItem' as const;
  const undoCallback = useCallback(() => {
    if (onProjectUpdate) onProjectUpdate(project.projectId);
  }, [onProjectUpdate, project.projectId]);
  const { push: pushUndo } = useUndoStack(undoCallback, project.projectId);


  // ✅ GLOBAL SMART PRE-FILL: Find latest container date across ALL projects
  const getLatestContainerDate = async (containerNo: string): Promise<string | null> => {
    if (!containerNo) return null;

    const trimmedContainerNo = containerNo.trim().toUpperCase();


    try {
      // Use new global API to search across all projects
      const { getLatestContainerDate: fetchLatestDate } = await import('../lib/containers');
      const latestDateISO = await fetchLatestDate(trimmedContainerNo);

      if (latestDateISO) {
        // Convert ISO date to YYYY-MM-DD format for frontend
        const dateObj = new Date(latestDateISO);
        const formattedDate = dateObj.toISOString().split('T')[0];
        return formattedDate;
      } else {
        return null;
      }
    } catch (error) {
      console.error(`❌ GLOBAL_SEARCH_ERROR for ${trimmedContainerNo}:`, error);
      return null;
    }
  };

  // Helper functions for mode-based API calls
  const createItem = async (itemData: any) => {
    if (mode === 'missingExtra') {
      return await createMissingExtraItem(project.projectId, itemData);
    } else if (mode === 'directOrder') {
      return await createDirectOrderItem(project.projectId, itemData);
    } else if (mode === 'expenses-p') {
      return await createExpensesPItem(project.projectId, itemData);
    } else if (mode === 'expenses-do') {
      return await createExpensesDirectOrderItem(project.projectId, itemData);
    } else if (mode === 'expenses-me') {
      return await createExpensesMissingExtraItem(project.projectId, itemData);
    } else if (mode === 'trust-stock') {
      return await createTrustStockItem(project.projectId, itemData);
    } else {
      return await createProjectItem(project.projectId, itemData);
    }
  };

  const updateItem = async (itemId: string, itemData: any) => {
    if (mode === 'missingExtra') {
      return await updateMissingExtraItem(itemId, itemData);
    } else if (mode === 'directOrder') {
      return await updateDirectOrderItem(project.projectId, itemId, itemData);
    } else if (mode === 'expenses-p') {
      return await updateExpensesPItem(itemId, itemData);
    } else if (mode === 'expenses-do') {
      return await updateExpensesDirectOrderItem(itemId, itemData);
    } else if (mode === 'expenses-me') {
      return await updateExpensesMissingExtraItem(itemId, itemData);
    } else if (mode === 'trust-stock') {
      return await updateTrustStockItem(itemId, itemData);
    } else {
      return await updateProjectItem(itemId, itemData);
    }
  };

  const deleteItemApi = async (itemId: string) => {
    if (mode === 'missingExtra') {
      await deleteMissingExtraItem(itemId);
    } else if (mode === 'directOrder') {
      await deleteDirectOrderItem(project.projectId, itemId);
    } else if (mode === 'expenses-p') {
      await deleteExpensesPItem(itemId);
    } else if (mode === 'expenses-do') {
      await deleteExpensesDirectOrderItem(itemId);
    } else if (mode === 'expenses-me') {
      await deleteExpensesMissingExtraItem(itemId);
    } else if (mode === 'trust-stock') {
      await deleteTrustStockItem(itemId);
    } else {
      await deleteProjectItem(project.projectId, itemId);
    }
  };

  // ============================================================
  // STATE DECLARATIONS FIRST
  // ============================================================

  // Removed unused tempRows state
  const [projectMetadata, setProjectMetadata] = useState<Omit<Project, 'rows'>>({
    projectId: project.projectId,
    projectNumber: project.projectNumber,
    projectName: project.projectName,
    projectNumberColor: project.projectNumberColor, // Initial from prop
    address: project.address || '',
    region: project.region || '',
    poSignStatusByType: project.poSignStatusByType
  });

  // ✅ DEBUG: Log when ProjectBlock receives new project prop
  useEffect(() => {
  }, [JSON.stringify(project.poSignStatusByType), project.projectId]);

  const [editingCell, setEditingCell] = useState<EditingState | null>(null);
  const [vendorEditState, setVendorEditState] = useState<VendorEditState | null>(null);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [addToGroupOpen, setAddToGroupOpen] = useState(false);
  const [rowContextMenu, setRowContextMenu] = useState<{ x: number; y: number; itemId: string; type: string } | null>(null);
  // Projects rows with vendor TR-STOCK: take products out of Trust Stock
  const [stockUsageFor, setStockUsageFor] = useState<{ itemId: string; label: string } | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [colorRecalcTrigger, setColorRecalcTrigger] = useState(0); // Force color recalculation
  const cellRefs = useRef<Record<string, React.RefObject<HTMLDivElement>>>({});
  const typeClickRef = useRef<HTMLDivElement>(null);
  const projectHeaderRef = useRef<HTMLDivElement>(null);

  // ============================================================
  // ✅ COMPUTE COLOR AFTER STATE DECLARATIONS
  // ============================================================

  // 1. Extract data needed for color calculation
  // Use local isUrgent state for immediate updates, fall back to project prop
  const isUrgentManual = isUrgent || (project as any).isUrgent === true || (project as any).urgentManual === true;

  // 2. State for computed color - will be set by useEffect once itemsById is populated
  const [currentProjectColor, setCurrentProjectColor] = useState<ProjectColor>('orange'); // Default until items load

  // 🔧 PREVENT COLOR LOOP: Track last applied color
  const lastAppliedColorRef = useRef<string>('');

  // Track item statuses so color recalcs when a status changes (without size change)
  const itemStatusSignature = useMemo(
    () => Array.from(itemsById.values()).map(i => `${i.id}:${i.status ?? ''}`).join('|'),
    [itemsById]
  );

  // 3. Recalculate color after itemsById or isUrgent changes - MAP ONLY APPROACH
  useEffect(() => {
    // In Supplier mode project.rows is [], so build fallback rows from itemsById
    const effectiveRows = project.rows?.length > 0
      ? project.rows
      : Array.from(itemsById.values()).map(item => ({ itemId: item.id }));
    const projectForColor = effectiveRows === project.rows
      ? project
      : { ...project, rows: effectiveRows };

    const calculatedColor = getProjectColorFromMap({
      project: projectForColor,
      itemsById,
      isUrgentOverride: isUrgentManual
    });

    // 🔧 EXTRA PROTECTION: Early return if color unchanged
    if (calculatedColor === lastAppliedColorRef.current) {
      return;
    }

    setCurrentProjectColor(prev => {
      const newColor = prev === calculatedColor ? prev : calculatedColor;
      lastAppliedColorRef.current = newColor;
      return newColor;
    });
  }, [project.projectId, project.rows, itemsById.size, itemStatusSignature, isUrgent, colorRecalcTrigger]);

  // ✅ Update color when currentProjectColor changes
  useEffect(() => {

    setProjectMetadata(prev => ({
      ...prev,
      projectNumberColor: currentProjectColor
    }));
  }, [currentProjectColor, project.projectId]);

  // 🔍 RENDER DEBUG: Log every render with color info (temporarily disabled for performance)
  //
  const poSignStatusEditorRef = useRef<HTMLDivElement>(null);

  // ── Generic drag-to-select helper ──
  type DragField = 'containerNo' | 'pfSignStatus' | 'status';
  const [dragSelectedRowIds, setDragSelectedRowIds] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragField, setDragField] = useState<DragField>('containerNo');
  const [dragAnchorId, setDragAnchorId] = useState<string | null>(null);
  const dragRowIdsOrderRef = useRef<string[]>([]);
  // Refs for stale-closure-safe reads in async save handlers
  const dragFieldRef = useRef<DragField>('containerNo');
  const dragSelectedRowIdsRef = useRef<Set<string>>(new Set());

  const handleDragCellMouseDown = useCallback((e: React.MouseEvent, itemId: string, field: DragField) => {
    if (!itemId) return;
    e.preventDefault();
    setIsDragging(true);
    setDragField(field);
    dragFieldRef.current = field;
    setDragAnchorId(itemId);
    setDragSelectedRowIds(new Set([itemId]));
    dragSelectedRowIdsRef.current = new Set([itemId]);
  }, []);

  const handleDragCellMouseEnter = useCallback((itemId: string) => {
    if (!isDragging || !dragAnchorId || !itemId) return;
    const ids = dragRowIdsOrderRef.current;
    const anchorIdx = ids.indexOf(dragAnchorId);
    const curIdx = ids.indexOf(itemId);
    if (anchorIdx === -1 || curIdx === -1) return;
    const [start, end] = anchorIdx <= curIdx ? [anchorIdx, curIdx] : [curIdx, anchorIdx];
    const newSet = new Set(ids.slice(start, end + 1));
    setDragSelectedRowIds(newSet);
    dragSelectedRowIdsRef.current = newSet;
  }, [isDragging, dragAnchorId]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    const anchorId = dragAnchorId;
    const field = dragField;
    setDragAnchorId(null);
    if (anchorId && dragSelectedRowIds.size > 0) {
      setEditingCell({ projectId: project.projectId, itemId: anchorId, field });
    }
  }, [isDragging, dragAnchorId, dragField, dragSelectedRowIds, project.projectId]);

  useEffect(() => {
    if (!isDragging) return;
    const up = () => handleDragEnd();
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, [isDragging, handleDragEnd]);


  // Auth and permissions hooks
  // ✅ PERMISSION SYSTEM: Use overrides from supplier context or default to Projects permissions
  const defaultPermissions = useColumnPermissions();
  const baseIsColumnVisible = permissionOverrides?.isColumnVisible || defaultPermissions.isColumnVisible;
  const isExpensesPMode = mode === 'expenses-p' || mode === 'expenses-do' || mode === 'expenses-me';
  const EXPENSES_HIDE_COLS = ['pfCode', 'pfSignStatus', 'poSignStatus', 'pfUsd', 'pfTl', 'rtd', 'containerDate'];
  const EXPENSES_SHOW_COLS = ['expensesUsd', 'expensesTl'];
  const isTrustStockMode = mode === 'trust-stock';
  const isColumnVisible = useCallback((key: string) => {
    // Trust Stock shows a fixed column set (ORDER NO is rendered separately, see orderNo below)
    if (isTrustStockMode) {
      return TRUST_STOCK_COLS.includes(key) && baseIsColumnVisible(key);
    }
    if (isExpensesPMode) {
      if (EXPENSES_HIDE_COLS.includes(key)) return false;
      if (EXPENSES_SHOW_COLS.includes(key)) return true;
    } else {
      if (EXPENSES_SHOW_COLS.includes(key)) return false;
    }
    return baseIsColumnVisible(key);
  }, [baseIsColumnVisible, isExpensesPMode, isTrustStockMode]);
  const isColumnEditable = permissionOverrides?.isColumnEditable || defaultPermissions.isColumnEditable;
  const { paymentRules, addRule: addPaymentRule } = usePaymentRules();

  // Initialize isUrgent from project data
  useEffect(() => {
    const projectUrgent = (project as any).isUrgent === true || (project as any).urgentManual === true;
    setIsUrgent(projectUrgent);
  }, [project.projectId, (project as any).isUrgent, (project as any).urgentManual]);

  // Compute current project color including local urgent state and current items data
  const applyPatch = async (itemId: string, patchPayload: any, _field: string) => {
    try {
      // 🔍 PROOF LOG: Request being sent
      // expenses-p: remap 'rtr' → 'rtrd' for backend compatibility
      let apiPayload = patchPayload;
      if (isExpensesPMode && 'rtr' in patchPayload) {
        const { rtr, ...rest } = patchPayload;
        apiPayload = { ...rest, rtrd: rtr };
      }

      // 1. Update backend via API
      const updatedItem = await updateItem(itemId, apiPayload);

      // Vendor set to TR-STOCK from the vendor cell → open "Use from Trust Stock"
      if ('vendorId' in patchPayload) openStockUsageIfNewStockRow(updatedItem as BackendProjectItem, itemsById.get(itemId));

      // 2. IMMEDIATELY update local state for instant UI feedback
      setItemsById(prev => {
        const newMap = new Map(prev);
        const currentItem = newMap.get(itemId);
        if (currentItem) {
          // Merge the updated fields with the current item
          // Preserve customType if not returned by backend to prevent "Unknown" type display
          const mergedItem = {
            ...currentItem,
            ...patchPayload,
            // Also update with the response data in case backend transforms anything
            ...updatedItem,
            customType: updatedItem.customType || currentItem.customType,
            // expenses-p: map backend 'rtrd' → frontend 'rtr'
            ...(isExpensesPMode && updatedItem.rtrd !== undefined ? { rtr: updatedItem.rtrd } : {}),
          };
          newMap.set(itemId, mergedItem);

          // 💰 CRITICAL: Also update global state for reactive section totals
          if (updateGlobalItem) {
            updateGlobalItem(itemId, mergedItem);
          }

          // 🔥 SUPPLIER FIX: Update parent state for immediate UI refresh
          if (onSupplierItemUpdated && 'projectId' in updatedItem) {
            onSupplierItemUpdated(updatedItem as BackendProjectItem);
          }
        }
        return newMap;
      });

    } catch (error) {
      throw error;
    }
  };
  // 🔧 STABLE DEPENDENCIES: Create signatures to prevent infinite re-renders
  // PF GROUPS: this project's own (typeLabel -> [{number, rank}]) badges — shown
  // on the TYPE cell whenever a type has been added to a group, regardless of
  // whether the Groups filter is active, so it's always clear at a glance.
  const groupBadgesByType = useMemo(() => {
    const map = new Map<string, { number: number; rank: number }[]>();
    if (!enableGrouping) return map;
    pfGroups.forEach(g => g.members.forEach(m => {
      if (m.projectId !== project.projectId) return;
      const arr = map.get(m.typeLabel) || [];
      arr.push({ number: g.number, rank: m.rank });
      map.set(m.typeLabel, arr);
    }));
    return map;
  }, [enableGrouping, pfGroups, project.projectId]);

  const stablePoSignSignature = useMemo(() => {
    if (!project.poSignStatusByType) return '';
    const sortedEntries = Object.entries(project.poSignStatusByType)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([type, status]) => `${type}=${status}`)
      .join('|');
    return sortedEntries;
  }, [project.poSignStatusByType]);

  // projectSignature used for memoization debugging when needed
  // `${project.projectId}:${project.projectNumber}:${project.projectName}:${isUrgent}:${project.address || ''}:${project.region || ''}:${stablePoSignSignature}:${project.rows.length}`

  const backendItemsSignature = useMemo(() => (
    (backendItems ?? []).map(i =>
      `${i.id}:${i.updatedAt ?? ''}:${i.vendorId ?? ''}:${i.type ?? ''}:${i.pfUsd ?? ''}:${i.pfTl ?? ''}:${i.status ?? ''}:${i.pfSignStatus ?? ''}:${i.poSignStatus ?? ''}:${i.orderType ?? ''}:${i.statusNote ?? ''}:${i.std ?? ''}:${i.etd ?? ''}:${i.rtr ?? ''}:${i.rtd ?? ''}:${i.rdy ?? ''}:${i.ftd ?? ''}:${i.snd ?? ''}:${i.containerNo ?? ''}:${i.containerDate ?? ''}:${i.pfCode ?? ''}:${i.paidUsd1 ?? ''}:${i.paidUsd2 ?? ''}:${i.paidTl1 ?? ''}:${i.paidTl2 ?? ''}:${i.paidUsd1Date ?? ''}:${i.paidUsd2Date ?? ''}:${i.paidTl1Date ?? ''}:${i.paidTl2Date ?? ''}:${i.invoiceDate ?? ''}:${i.invoice ?? ''}:${(i as any).invoiceTl ?? ''}`
    ).join('|')
  ), [backendItems]);

  // Stable signature for filtered row item IDs - triggers re-sync when filters change
  const rowItemIdsSignature = useMemo(() =>
    project.rows.map(r => r.itemId || '').join(','),
    [project.rows]
  );

  // 🔧 PREVENT REDUNDANT PARENT UPDATES: Track last sent metadata
  const lastSentMetadataRef = useRef<string>('');

  // CRITICAL FIX: Merge backend items with local state, preserving existing data
  useEffect(() => {

    // 🔧 GUARD: Only update parent when metadata actually changes
    const currentMetadataSignature = `${project.projectId}:${project.projectNumber}:${project.projectName}:${currentProjectColor}:${project.address || ''}:${project.region || ''}:${stablePoSignSignature}`;

    if (currentMetadataSignature !== lastSentMetadataRef.current) {
      setProjectMetadata({
        projectId: project.projectId,
        projectNumber: project.projectNumber,
        projectName: project.projectName,
        projectNumberColor: currentProjectColor,
        address: project.address || '',
        region: project.region || '',
        poSignStatusByType: project.poSignStatusByType
      });
      lastSentMetadataRef.current = currentMetadataSignature;
    }

    // 🔍 SUPPLIER MODE FIX: If backendItems is provided, use it as source of truth
    // This handles the case where project.rows is empty but backendItems has data
    if (backendItems && backendItems.length > 0) {
      setItemsById(currentItems => {
        const newItemsById = new Map(currentItems);

        // If project.rows is empty (Supplier P mode), backendItems already carries
        // the active supplier filters and is the full source of truth: add new
        // items AND drop the ones no longer present — otherwise items filtered
        // out (e.g. deselected types) keep rendering from stale itemsById state
        if (project.rows.length === 0) {
          const backendItemIds = new Set(backendItems.map(item => item.id));
          backendItems.forEach(backendItem => {
            newItemsById.set(backendItem.id, backendItem);
          });
          for (const [itemId] of newItemsById) {
            if (!backendItemIds.has(itemId)) {
              newItemsById.delete(itemId);
            }
          }
        } else {
          // Merge ALL backendItems into itemsById regardless of active filters.
          // Filtered-out items must stay in itemsById so computedRows can apply
          // filter logic at render time — deleting them here causes type sections
          // to permanently disappear when a status change removes an item from
          // the current filter match set.
          const backendItemIds = new Set(backendItems.map(item => item.id));

          backendItems.forEach(backendItem => {
            const existingItem = newItemsById.get(backendItem.id);
            const mergedItem = {
              ...backendItem,
              pfCode: backendItem.pfCode !== undefined
                ? backendItem.pfCode
                : existingItem?.pfCode || null,
              vendorId: backendItem.vendorId || existingItem?.vendorId || null,
              // Preserve locally-set containerDate when backendItems is stale (null)
              // but local state has a value (set via applyPatch before missingExtraCases was updated)
              containerDate: backendItem.containerDate !== null && backendItem.containerDate !== undefined
                ? backendItem.containerDate
                : (existingItem?.containerDate ?? null),
            };
            newItemsById.set(backendItem.id, mergedItem);
          });

          // Remove only items genuinely absent from the project (deleted server-side)
          for (const [itemId] of newItemsById) {
            if (!backendItemIds.has(itemId)) {
              newItemsById.delete(itemId);
            }
          }
        }

        return newItemsById;
      });
    }
  }, [project.projectId, backendItemsSignature, rowItemIdsSignature, currentProjectColor, stablePoSignSignature, project.projectNumber, project.projectName, project.address, project.region]);

  // DERIVED STATE: Convert itemsById to rows for rendering (SINGLE SOURCE OF TRUTH)
  const computedRows = useMemo(() => {
    // Apply the filter that project.rows already carries (type/status/vendor filters).
    // itemsById intentionally stores ALL project items; filtering happens here so
    // a status change that removes an item from the active filter set doesn't
    // permanently delete it from storage.
    const filteredRowIds = new Set(project.rows.map(r => r.itemId).filter(Boolean));
    const baseItems = filteredRowIds.size > 0
      ? Array.from(itemsById.values()).filter(item => filteredRowIds.has(item.id))
      : Array.from(itemsById.values()); // supplier P mode: project.rows is empty, show all

    // Shared display order (types.ts → sortItemsForDisplay)
    const sortedItems = sortItemsForDisplay(baseItems);

    // SUPPLIER MODE: Apply additional vendor filtering at final render stage
    let finalItems = sortedItems;
    if (supplierVendorCodeFilter) {
      const extractVendorCode = (item: BackendProjectItem): string | null => {
        if (item.vendor?.code) {
          return item.vendor.code;
        }
        // Fallback: extract from vendor display string if it exists as string
        const vendorStr = (item as any).vendorDisplay || (item as any).vendorString;
        if (typeof vendorStr === 'string' && vendorStr.includes(' - ')) {
          return vendorStr.split(' - ')[0];
        }
        return null;
      };

      finalItems = sortedItems.filter(item => {
        const itemVendorCode = extractVendorCode(item);
        return itemVendorCode === supplierVendorCodeFilter;
      });

      // PROOF LOGGING - Show which vendors are actually being rendered
    }

    // Helper: check if item type is restricted for current user
    const isItemRestricted = (item: BackendProjectItem): boolean => {
      // Admin or no allowedTypes config = no restrictions
      if (isAdmin || !allowedTypes) return false;
      // Custom type: check customTypeIds
      if (item.customTypeId) {
        return !(allowedTypes.customTypeIds ?? []).includes(item.customTypeId);
      }
      // Enum type: check enumTypes
      if (item.type) {
        return !(allowedTypes.enumTypes ?? []).includes(item.type);
      }
      return false;
    };

    // Map to frontend row format
    return finalItems.map(item => ({
      type: mapBackendTypeToFrontend(item.type, item.customType),
      pfCode: item.pfCode || '',
      vendor: item.vendor
        ? (item.vendor.code ? `${item.vendor.code} - ${item.vendor.name}` : item.vendor.name)
        : '',
      vendorId: item.vendorId || '',
      orderType: item.orderType || '',
      orderNo: (item as any).orderNo || '',
      pfSignStatus: mapSignStatusToFrontend(item.pfSignStatus),
      poSignStatus: mapSignStatusToFrontend(item.poSignStatus),
      status: item.status?.replace(/_/g, ' ') || '',
      statusNote: item.statusNote || '',
      std: item.std || '',
      etd: item.etd || '',
      rtd: item.rtd || '',
      rtr: item.rtr || '',
      rdy: item.rdy || '',
      ftd: item.ftd || '',
      snd: item.snd || '',
      pfUsd: item.pfUsd ? item.pfUsd.toString() : '',
      pfTl: item.pfTl ? item.pfTl.toString() : '',
      invoice: item.invoice != null ? item.invoice.toString() : '',
      invoiceTl: (item as any).invoiceTl != null ? (item as any).invoiceTl.toString() : '',
      paymentRule: item.paymentRule || '',
      containerNo: item.containerNo || '',
      containerDate: item.containerDate ? new Date(item.containerDate).toISOString().split('T')[0] : '', // ✅ ITEM-LEVEL: Container date from individual item
      expensesUsd: (item as any).expensesUsd ? (item as any).expensesUsd.toString() : '',
      expensesTl: (item as any).expensesTl ? (item as any).expensesTl.toString() : '',
      customTypeId: item.customTypeId || null,
      itemId: item.id, // Critical for updates
      isRestricted: isItemRestricted(item)
    }));
  }, [itemsById, project.rows, supplierVendorCodeFilter, isAdmin, allowedTypes]);

  // DERIVED STATE: Generate projectData from itemsById for backwards compatibility
  const projectData: Project = useMemo(() => ({
    ...projectMetadata,
    // ✅ FIXED: Use computed rows from itemsById (SINGLE SOURCE OF TRUTH)
    rows: computedRows,
    poSignStatusByType: projectMetadata.poSignStatusByType
  }), [projectMetadata, computedRows]); // 🔧 STABLE: Memoize to prevent recreation on every render

  // Dashboard highlighting: use prop and auto-clear after 3 seconds
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(highlightedItemIdProp || null);
  const [highlightField, setHighlightField] = useState<string | null>(highlightFieldProp || null);

  // Status note context menu + dialog state
  const [noteMenu, setNoteMenu] = useState<{ x: number; y: number; itemId: string; hasNote: boolean } | null>(null);
  const [noteDialog, setNoteDialog] = useState<{ itemId: string; text: string; mode: 'view' | 'edit' } | null>(null);

  // Price note context menu + dialog state
  const [priceNoteMenu, setPriceNoteMenu] = useState<{ x: number; y: number; itemId: string; field: string; hasNote: boolean } | null>(null);
  const [priceNoteDialog, setPriceNoteDialog] = useState<{ itemId: string; field: string; text: string; mode: 'view' | 'edit' } | null>(null);

  useEffect(() => {
    if (highlightedItemIdProp) {
      setHighlightedItemId(highlightedItemIdProp);
      setHighlightField(highlightFieldProp || null);

      // Scroll to the highlighted row after a short delay (allow DOM to render)
      const scrollTimer = setTimeout(() => {
        const row = document.querySelector(`[data-item-id="${highlightedItemIdProp}"]`);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);

      // Clear highlight after 3 seconds
      const clearTimer = setTimeout(() => {
        setHighlightedItemId(null);
        setHighlightField(null);
      }, 3500);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [highlightedItemIdProp, highlightFieldProp]);

  // Calculate dynamic grid width based on visible columns
  const gridWidthPx = useMemo(() => {
    const base = getGridWidthPx(isColumnVisible, isSupplierMode);
    return isTrustStockMode ? `${parseInt(base, 10) + ORDER_NO_WIDTH}px` : base;
  }, [isColumnVisible, isSupplierMode, isTrustStockMode]);

  // 💰 CALCULATE TOTALS for PF USD and PF TL (excluding restricted rows)
  const projectTotals = React.useMemo(() => {
    const visibleRows = computedRows.filter(row => !row.isRestricted);
    const totalUsd = visibleRows.reduce((sum, row) => {
      const value = parseFloat(row.pfUsd) || 0;
      return sum + value;
    }, 0);

    const totalTl = visibleRows.reduce((sum, row) => {
      const value = parseFloat(row.pfTl) || 0;
      return sum + value;
    }, 0);

    const totalExpensesUsd = visibleRows.reduce((sum, row) => {
      const value = parseFloat(row.expensesUsd || '') || 0;
      return sum + value;
    }, 0);

    const totalExpensesTl = visibleRows.reduce((sum, row) => {
      const value = parseFloat(row.expensesTl || '') || 0;
      return sum + value;
    }, 0);

    const totalInvoice = visibleRows.reduce((sum, row) => {
      const value = parseFloat(row.invoice || '') || 0;
      return sum + value;
    }, 0);

    const totalInvoiceTl = visibleRows.reduce((sum, row) => {
      const value = parseFloat((row as any).invoiceTl || '') || 0;
      return sum + value;
    }, 0);

    return {
      pfUsd: totalUsd,
      pfTl: totalTl,
      expensesUsd: totalExpensesUsd,
      expensesTl: totalExpensesTl,
      invoice: totalInvoice,
      invoiceTl: totalInvoiceTl
    };
  }, [computedRows]);

  // 💰 FORMAT CURRENCY with thousands separators and 2 decimals
  const formatCurrency = (value: number): string => {
    return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Update row to item mapping whenever derived projectData changes
  useEffect(() => {
    // 🚨 CRITICAL FIX: Only use backend items that correspond to filtered rows
    // The projectData.rows are already filtered by parent, so we need matching backend items
    const filteredBackendItems: BackendProjectItem[] = [];

    computedRows.forEach(row => {
      // Find the backend item that has the same id as this filtered row's itemId
      const backendItem = Array.from(itemsById.values()).find(item => item.id === row.itemId);
      if (backendItem) {
        filteredBackendItems.push(backendItem);
      }
    });

    buildRowToItemMapping(projectData, filteredBackendItems);
  }, [itemsById, computedRows]); // 🔧 STABLE: Use computedRows directly instead of projectData.rows



  // CRITICAL FIX: Helper to update only the specific item, preventing bulk apply bug
  // ⚠️ MUST BE DEFINED BEFORE useEffect that uses it (line 543-567)
  const updateItemInState = (itemId: string, patch: Partial<{ vendor: string; vendorId: string; pfCode: string; orderType: string; status: string; std: string | null; pfSignStatus: string; poSignStatus: string; etd: string | null; rtd: string | null; rtr: string | null; rdy: string | null; ftd: string | null; snd: string | null; containerNo: string; containerDate: string; paymentRule: string; pfUsd: string; pfTl: string; invoice: string; invoiceTl: string }>) => {


    setItemsById(currentItems => {
      const existingItem = currentItems.get(itemId);
      if (!existingItem) {
        console.error('❌ ITEM_NOT_FOUND_IN_STATE', { itemId, availableItemIds: Array.from(currentItems.keys()) });
        return currentItems;
      }


      const newItems = new Map(currentItems);

      // Apply patch to backend item structure
      const updatedItem: BackendProjectItem & { __source: string } = {
        ...existingItem,
        // Map frontend patch fields to backend fields
        pfCode: patch.pfCode ?? existingItem.pfCode,
        vendorId: patch.vendorId ?? existingItem.vendorId, // Update vendorId if provided
        orderType: patch.orderType ?? existingItem.orderType,
        pfSignStatus: (patch.pfSignStatus === 'NOT SIGNED' ? 'NOT_SIGNED' :
                      patch.pfSignStatus === 'READY TO SIGN' ? 'READY_TO_SIGN' :
                      patch.pfSignStatus === 'SIGNED' ? 'SIGNED' :
                      patch.pfSignStatus === 'WAITING TLINES TO SIGN' ? 'WAITING_TLINES_TO_SIGN' :
                      patch.pfSignStatus === 'WAITING T TO SIGN' ? 'WAITING_T_TO_SIGN' :
                      patch.pfSignStatus === 'SIGNED WITH EST PRICE' ? 'SIGNED_WITH_EST_PRICE' : existingItem.pfSignStatus),
        poSignStatus: (patch.poSignStatus === 'NOT SIGNED' ? 'NOT_SIGNED' :
                      patch.poSignStatus === 'READY TO SIGN' ? 'READY_TO_SIGN' :
                      patch.poSignStatus === 'SIGNED' ? 'SIGNED' :
                      patch.poSignStatus === 'WAITING TLINES TO SIGN' ? 'WAITING_TLINES_TO_SIGN' :
                      patch.poSignStatus === 'WAITING T TO SIGN' ? 'WAITING_T_TO_SIGN' : existingItem.poSignStatus),
        status: (patch.status === 'HOLD T' ? 'HOLD_T' :
                patch.status === 'HOLD PM' ? 'HOLD_PM' :
                patch.status ? patch.status.replace(/ /g, '_').toUpperCase() as any : existingItem.status),
        std: 'std' in patch ? (patch.std ?? null) : existingItem.std,
        etd: 'etd' in patch ? (patch.etd ?? null) : existingItem.etd,
        rtd: 'rtd' in patch ? (patch.rtd ?? null) : existingItem.rtd,
        rtr: 'rtr' in patch ? (patch.rtr ?? null) : existingItem.rtr,
        rdy: 'rdy' in patch ? (patch.rdy ?? null) : existingItem.rdy,
        ftd: 'ftd' in patch ? (patch.ftd ?? null) : existingItem.ftd,
        snd: 'snd' in patch ? (patch.snd ?? null) : existingItem.snd,
        containerNo: patch.containerNo ?? existingItem.containerNo,
        containerDate: patch.containerDate ? new Date(patch.containerDate + 'T00:00:00.000Z').toISOString() : existingItem.containerDate,
        paymentRule: patch.paymentRule ?? existingItem.paymentRule,
        // 💰 CRITICAL: Handle pfUsd and pfTl with proper number conversion
        pfUsd: patch.pfUsd !== undefined ? (patch.pfUsd === '' ? null : parseFloat(patch.pfUsd) || null) : existingItem.pfUsd,
        pfTl: patch.pfTl !== undefined ? (patch.pfTl === '' ? null : parseFloat(patch.pfTl) || null) : existingItem.pfTl,
        invoice: patch.invoice !== undefined ? (patch.invoice === '' ? null : parseFloat(patch.invoice) || null) : existingItem.invoice,
        invoiceTl: patch.invoiceTl !== undefined ? (patch.invoiceTl === '' ? null : parseFloat(patch.invoiceTl) || null) : (existingItem as any).invoiceTl,
        updatedAt: new Date().toISOString(),
        // 🧩 PROOF-BASED DEBUG: Track data source
        __source: "itemsById_after_patch"
      };

      // Update vendor display if patch includes vendor info
      if (patch.vendor && !patch.vendor.includes(' - ')) {
        // If vendor patch doesn't include code-name format, preserve existing vendor relation
      } else if (patch.vendor) {
        // Parse vendor display format "CODE - NAME" back to vendor relation structure
        const [code, ...nameParts] = patch.vendor.split(' - ');
        if (code && nameParts.length > 0) {
          updatedItem.vendor = {
            id: existingItem.vendor?.id || '',
            code: code,
            name: nameParts.join(' - ')
          };
        }
      }

      newItems.set(itemId, updatedItem);

      return newItems;
    });

    // 🎨 FORCE COLOR RECALCULATION: Trigger after item update
    setTimeout(() => {
      setColorRecalcTrigger(prev => prev + 1);
    }, 0);
  };

  // ✅ LISTEN FOR GLOBAL SYNC EVENTS: Update local state when other projects sync container dates
  useEffect(() => {
    const handleGlobalContainerSync = (event: CustomEvent) => {
      const { containerNo: _containerNo, containerDate: _containerDate, affectedItems } = event.detail;


      // Update any matching containers in this project
      if (affectedItems) {
        affectedItems.forEach((item: any) => {
          const localItem = itemsById.get(item.itemId);
          if (localItem) {
            // Convert ISO date to display format
            const displayDate = item.containerDate ? new Date(item.containerDate).toISOString().split('T')[0] : '';
            updateItemInState(item.itemId, {
              containerDate: displayDate
            });
          }
        });
      }
    };

    // Add event listener
    window.addEventListener('globalContainerSync', handleGlobalContainerSync as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('globalContainerSync', handleGlobalContainerSync as EventListener);
    };
  }, [itemsById, updateItemInState]);

  // CRITICAL FIX: Build precise row -> itemId mapping to prevent bulk apply bug
  const buildRowToItemMapping = (projectData: Project, backendItems?: BackendProjectItem[]) => {
    const newMap = new Map<number, string>();

    if (!backendItems) {
      return;
    }

    // Map each row to its corresponding backend item using position and type matching
    projectData.rows.forEach((row, __rowIndex) => {
      // Find the backend item that matches this row's position within its type group
      const rowsOfSameType = projectData.rows.filter(r => r.type === row.type);
      const positionInType = rowsOfSameType.indexOf(row);

      const itemsOfSameType = sortItemsForDisplay(backendItems
        .filter(item => mapBackendTypeToFrontend(item.type, item.customType) === row.type));

      const correspondingItem = itemsOfSameType[positionInType];
      if (correspondingItem) {
        newMap.set(__rowIndex, correspondingItem.id);
      }
    });

  };

  // Helper function to create type groups from project data
  const createTypeGroupsFromProject = (project: Project) => {
    const typeGroupMap = new Map();

    // If project has no rows, create empty type groups for proper layout
    if (project.rows.length === 0) {
      // No type groups to display - this is correct for projects with no line items
      return typeGroupMap;
    }

    // Group existing rows by type
    project.rows.forEach(row => {
      if (!typeGroupMap.has(row.type)) {
        // Use stored PO Sign Status from project's poSignStatusByType field
        const poSignStatus = project.poSignStatusByType[row.type] || '';
        typeGroupMap.set(row.type, { type: row.type, poSignStatus, rows: [] });
      }
      typeGroupMap.get(row.type).rows.push(row);
    });

    return typeGroupMap;
  };

  // Create type groups with PO Sign Status
  const typeGroupsMap = createTypeGroupsFromProject(projectData);

  // Include ALL types (enum + custom) while preserving order for known types
  const knownTypeGroups = TYPE_ORDER
    .filter(type => typeGroupsMap.has(type))
    .map(type => typeGroupsMap.get(type));

  // Add custom types that are not in TYPE_ORDER
  const allTypeNames = Array.from(typeGroupsMap.keys());
  const customTypeGroups = allTypeNames
    .filter(typeName => !TYPE_ORDER.includes(typeName))
    .map(typeName => typeGroupsMap.get(typeName));

  const typeGroups: TypeGroup[] = [...knownTypeGroups, ...customTypeGroups];

  // Keep drag-select row order ref in sync with current rows
  const allRowItemIds = typeGroups.flatMap(g => g.rows.map(r => r.itemId).filter((id): id is string => !!id));
  dragRowIdsOrderRef.current = allRowItemIds;

  // Helper to get or create cell ref
  const getCellRef = (cellKey: string) => {
    if (!cellRefs.current[cellKey]) {
      cellRefs.current[cellKey] = React.createRef<HTMLDivElement>();
    }
    return cellRefs.current[cellKey];
  };

  // Helper function for consistent header cell styling
  const getHeaderCellStyle = (columnKey: ColumnKey) => ({
    display: isColumnVisible(columnKey) ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    fontSize: '11px',
    fontWeight: '600',
    padding: '0 8px',
    minHeight: '32px',
    borderRight: '1px solid #333',
    backgroundColor: '#000000',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  });

  const handleProjectHeaderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Left click no longer opens delete menu - just log or do nothing
  };

  const handleProjectHeaderRightClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent browser context menu
    e.stopPropagation();
    setIsProjectMenuOpen(!isProjectMenuOpen);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (onDeleteProject) {
      try {
        await onDeleteProject(projectId);
      } catch (error) {
      }
    } else {
    }
  };

  const handleProjectMenuClose = () => {
    setIsProjectMenuOpen(false);
  };

  const handleRowContextMenu = (e: React.MouseEvent, itemId: string, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!itemId) return;
    setRowContextMenu({ x: e.clientX, y: e.clientY, itemId, type });
  };

  const handleDeleteRow = async () => {
    if (!rowContextMenu) return;
    const { itemId } = rowContextMenu;
    setRowContextMenu(null);
    try {
      await deleteItemApi(itemId);
      // Remove from local state
      if (updateGlobalItem) {
        updateGlobalItem(itemId, { __deleted: true } as any);
      }
      // Trigger refresh
      if (onProjectUpdate) {
        onProjectUpdate(project.projectId);
      }
    } catch (error) {
      console.error('Failed to delete row:', error);
    }
  };

  const handleToggleUrgent = async (projectId: string, shouldBeUrgent: boolean) => {
    try {
      // Optimistic UI update
      setIsUrgent(shouldBeUrgent);

      // Determine API endpoint based on mode
      let apiEndpoint: string;
      if (mode === 'directOrder') {
        apiEndpoint = `/api/direct-orders/${projectId}`;
      } else if (mode === 'missingExtra') {
        apiEndpoint = `/api/missing-extra/cases/${projectId}`;
      } else if (mode === 'expenses-p') {
        apiEndpoint = `/api/expenses-p/projects/${projectId}`;
      } else if (mode === 'expenses-do') {
        apiEndpoint = `/api/expenses-direct-order/projects/${projectId}`;
      } else if (mode === 'expenses-me') {
        apiEndpoint = `/api/expenses-missing-extra/projects/${projectId}`;
      } else if (mode === 'trust-stock') {
        apiEndpoint = `/api/trust-stock/groups/${projectId}`;
      } else {
        // Regular projects
        apiEndpoint = `/api/projects/${projectId}`;
      }

      // Call PATCH API
      await apiFetch(apiEndpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isUrgent: shouldBeUrgent }),
      });


      // Local state is already updated optimistically above; no full reload needed.
      // The WebSocket entity:patched event will sync other clients.
    } catch (error) {
      // Revert optimistic update on error
      setIsUrgent(!shouldBeUrgent);
      console.error('❌ Failed to update urgent status:', error);
      alert('Failed to update urgent status. Please try again.');
    }
  };

  const [isProjectEditing, setIsProjectEditing] = useState(false);
  const handleEditProject = async (projectId: string, field: 'name' | 'address' | 'types' | 'bucket', value: any) => {
    if (isProjectEditing) return; // Prevent double-save
    setIsProjectEditing(true);
    try {
      if (field === 'bucket') {
        const moveEndpoint = mode === 'directOrder' ? `/api/direct-orders/${projectId}/move-region`
          : mode === 'missingExtra' ? `/api/missing-extra/cases/${projectId}/move-region`
          : mode === 'expenses-p' ? `/api/expenses-p/projects/${projectId}/move-region`
          : mode === 'expenses-do' ? `/api/expenses-direct-order/projects/${projectId}/move-region`
          : mode === 'expenses-me' ? `/api/expenses-missing-extra/projects/${projectId}/move-region`
          : mode === 'trust-stock' ? `/api/trust-stock/groups/${projectId}`
          : `/api/projects/${projectId}/move-region`;
        const moveResponse = await apiFetch(moveEndpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bucket: value }),
        });
        if (!moveResponse.ok) {
          const errData = await moveResponse.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to move project to region');
        }
        setProjectMetadata(prev => ({ ...prev, region: value }));
      } else if (field === 'types') {
        const selectedTypes: string[] = value;
        const currentTypes = Array.from(typeGroupsMap.keys());
        const typesToRemove = currentTypes.filter(t => !selectedTypes.includes(t));
        const typesToAdd = selectedTypes.filter(t => !currentTypes.includes(t));

        const itemDeleteBase = mode === 'directOrder' ? `/api/direct-orders/${projectId}/items`
          : mode === 'missingExtra' ? `/api/missing-extra/items`
          : mode === 'expenses-p' ? `/api/expenses-p/items`
          : mode === 'expenses-do' ? `/api/expenses-direct-order/items`
          : mode === 'expenses-me' ? `/api/expenses-missing-extra/items`
          : mode === 'trust-stock' ? `/api/trust-stock/items`
          : `/api/projects/${projectId}/items`;
        const itemCreateBase = mode === 'directOrder' ? `/api/direct-orders/${projectId}/items`
          : mode === 'missingExtra' ? `/api/missing-extra/cases/${projectId}/items`
          : mode === 'expenses-p' ? `/api/expenses-p/projects/${projectId}/items`
          : mode === 'expenses-do' ? `/api/expenses-direct-order/projects/${projectId}/items`
          : mode === 'expenses-me' ? `/api/expenses-missing-extra/projects/${projectId}/items`
          : mode === 'trust-stock' ? `/api/trust-stock/groups/${projectId}/items`
          : `/api/projects/${projectId}/items`;

        // Remove items of unchecked types (in parallel — one round trip instead of N)
        const itemsToRemove = Array.from(itemsById.values()).filter(item =>
          typesToRemove.includes(mapBackendTypeToFrontend(item.type, item.customType))
        );
        const deleteResults = await Promise.all(itemsToRemove.map(item =>
          apiFetch(`${itemDeleteBase}/${item.id}`, { method: 'DELETE' })
            .then(res => (res.ok ? item.id : null))
            .catch(() => null)
        ));
        const removedItemIds = deleteResults.filter((id): id is string => !!id);

        // Optimistic: remove deleted items from local + global state immediately
        if (removedItemIds.length > 0) {
          setItemsById(prev => {
            const newMap = new Map(prev);
            removedItemIds.forEach(id => newMap.delete(id));
            return newMap;
          });
        }

        // Add empty items for newly checked types (in parallel) - parse response to get real items
        const standardTypes = ['MILLWORK', 'SHELVING', 'CEILING', 'IMAGE', 'FURNITURE', 'DECORATION'];
        const needsCustomTypes = typesToAdd.some(t => !standardTypes.includes(mapTypeToEnum(t)));
        let customTypes: Array<{ id: string; name: string; code?: string }> = [];
        if (needsCustomTypes) {
          const customRes = await apiFetch('/api/custom-types');
          customTypes = customRes.ok ? await customRes.json() : [];
        }
        const createResults = await Promise.all(typesToAdd.map(async (typeName): Promise<BackendProjectItem | null> => {
          const backendType = mapTypeToEnum(typeName);
          let body: Record<string, string>;
          let customType: { id: string; name: string; code?: string } | undefined;
          if (standardTypes.includes(backendType)) {
            body = { type: backendType };
          } else {
            // Custom type: create the item against the custom type's id
            customType = customTypes.find(ct => ct.name.toLowerCase() === typeName.toLowerCase());
            if (!customType) return null;
            body = { customTypeId: customType.id };
          }
          try {
            const response = await apiFetch(itemCreateBase, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            });
            if (!response.ok) return null;
            const newItem = await response.json();
            if (!newItem?.id) return null;
            // Make sure the row renders under the right custom type name right away
            if (customType && !newItem.customType) newItem.customType = customType;
            return newItem as BackendProjectItem;
          } catch {
            return null;
          }
        }));
        const createdItems = createResults.filter((i): i is BackendProjectItem => !!i);

        // Optimistic: add new items to local state immediately
        if (createdItems.length > 0) {
          setItemsById(prev => {
            const newMap = new Map(prev);
            createdItems.forEach(item => newMap.set(item.id, item));
            return newMap;
          });
        }

        // Update project metadata types
        const apiEndpoint = mode === 'directOrder' ? `/api/direct-orders/${projectId}`
          : mode === 'missingExtra' ? `/api/missing-extra/cases/${projectId}`
          : mode === 'expenses-p' ? `/api/expenses-p/projects/${projectId}`
          : mode === 'expenses-do' ? `/api/expenses-direct-order/projects/${projectId}`
          : mode === 'expenses-me' ? `/api/expenses-missing-extra/projects/${projectId}`
          : mode === 'trust-stock' ? `/api/trust-stock/groups/${projectId}`
          : `/api/projects/${projectId}`;
        await apiFetch(apiEndpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ types: selectedTypes }),
        });

        // The parent list decides which rows this block renders — tell it about the
        // change so the new type shows up without a page refresh. Our own socket
        // events are excluded by the server, so nothing else would do it.
        removedItemIds.forEach(id => updateGlobalItem?.(id, { __deleted: true } as any));
        createdItems.forEach(item => onItemCreated?.(projectId, item));
        // Background re-sync with the server (doesn't block closing the menu)
        if (onProjectUpdate) Promise.resolve(onProjectUpdate(projectId)).catch(() => {});
      } else {
        // name or address
        const apiEndpoint = mode === 'directOrder' ? `/api/direct-orders/${projectId}`
          : mode === 'missingExtra' ? `/api/missing-extra/cases/${projectId}`
          : mode === 'expenses-p' ? `/api/expenses-p/projects/${projectId}`
          : mode === 'expenses-do' ? `/api/expenses-direct-order/projects/${projectId}`
          : mode === 'expenses-me' ? `/api/expenses-missing-extra/projects/${projectId}`
          : mode === 'trust-stock' ? `/api/trust-stock/groups/${projectId}`
          : `/api/projects/${projectId}`;
        await apiFetch(apiEndpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: value }),
        });
        if (field === 'name') {
          setProjectMetadata(prev => ({ ...prev, projectName: value }));
        } else if (field === 'address') {
          setProjectMetadata(prev => ({ ...prev, address: value }));
        }
      }

      // projectMetadata already updated locally above; WebSocket syncs other clients.
    } catch (error) {
      console.error(`Failed to update project ${field}:`, error);
      alert(`Failed to update project ${field}. Please try again.`);
    } finally {
      setIsProjectEditing(false);
    }
  };

  // Handler for type cell click - CRITICAL FIX: Capture clicked cell position
  const handleTypeClick = (typeGroup: TypeGroup, e: React.MouseEvent) => {
    e.stopPropagation();

    // Check if 'type' column is editable before allowing editing
    if (!isColumnEditable('type')) {
      return; // Prevent editing
    }

    // Use actual click point — TYPE cell spans many rows so its element rect.bottom
    // is at the very bottom of all those rows, not where the user clicked.
    const clickedElement = e.currentTarget as HTMLElement;
    const rect = clickedElement.getBoundingClientRect();
    const clickedCellRect = {
      top: e.clientY - 2,
      left: rect.left,
      bottom: e.clientY + 2,
      right: rect.right,
      width: rect.width,
      height: 4,
      x: rect.left,
      y: e.clientY - 2
    } as DOMRect;

    // FIXED: Don't auto-create rows - only open edit panel
    if (!backendItems) {
      return;
    }

    // Filter items of this type
    const typeItems = backendItems.filter(item =>
      mapBackendTypeToFrontend(item.type, item.customType) === typeGroup.type
    );
    const sortedItems = sortProjectItemsInTypeGroup(typeItems);

    if (sortedItems.length === 0) {
      // TODO: Show a message or highlight "+ Add Item" button
      return;
    }

    // Open panel with first item selected + CLICKED CELL POSITION

    setVendorEditState({
      typeGroup: typeGroup.type as any,
      projectItems: sortedItems,
      currentItemId: sortedItems[0].id,
      itemsById: createItemsMap(sortedItems),
      clickedCellRect: clickedCellRect // ✅ CRITICAL FIX: Pass exact clicked position
    });

  };
  // Handler for item updates from vendor edit panel
  // A Projects row just switched to the TR-STOCK vendor → ask right away what it takes from stock.
  // (Only for the user who made the change; the server response carries the new vendor.)
  const openStockUsageIfNewStockRow = (item: BackendProjectItem, before?: BackendProjectItem) => {
    if (mode !== 'projects' || !isStockVendorCode(item.vendor?.code)) return;
    if (before && before.vendorId === item.vendorId && isStockVendorCode(before.vendor?.code)) return;
    const typeLabel = mapBackendTypeToFrontend(item.type, item.customType);
    setStockUsageFor({ itemId: item.id, label: `Project ${project.projectNumber} · ${typeLabel} · ${item.pfCode || 'no PF code'}` });
  };

  const handleItemUpdated = async (updatedItem: BackendProjectItem) => {
    openStockUsageIfNewStockRow(updatedItem, itemsById.get(updatedItem.id));

    // IMMEDIATE: Update main table state so changes appear instantly
    setItemsById(prevItemsById => {
      const newItemsById = new Map(prevItemsById);
      newItemsById.set(updatedItem.id, updatedItem);
      return newItemsById;
    });


    // itemsById already updated above with the full backend response (includes PF code, vendor).
    // WebSocket entity:patched event will sync other clients; no full reload needed here.

    // KEEP PANEL OPEN - do not close after autosave
    // Panel will only close when user explicitly closes it or navigates away
  };

  // Handler for new items added from vendor edit panel
  const handleItemAdded = async (newItem: BackendProjectItem) => {
    openStockUsageIfNewStockRow(newItem);

    // FIRST: Update vendorEditState immediately so user sees new item in panel
    if (vendorEditState && (
      vendorEditState.projectItems.length === 0 ||
      newItem.type === vendorEditState.projectItems[0]?.type ||
      // Handle custom types comparison
      (newItem.customTypeId && vendorEditState.projectItems[0]?.customTypeId === newItem.customTypeId)
    )) {
      const updatedProjectItems = [...vendorEditState.projectItems, newItem];
      const sortedItems = sortProjectItemsInTypeGroup(updatedProjectItems);
      setVendorEditState({
        ...vendorEditState,
        projectItems: sortedItems,
        currentItemId: newItem.id, // Switch to the newly created item
        itemsById: createItemsMap(sortedItems)
      });

    }

    // Inherit PO sign status from the type group if already signed
    // If existing items in this type are SIGNED/READY_TO_SIGN, new item inherits that status
    const newItemType = mapBackendTypeToFrontend(newItem.type, newItem.customType);
    const existingTypeItems = Array.from(itemsById.values()).filter(item =>
      mapBackendTypeToFrontend(item.type, item.customType) === newItemType
    );

    let inheritedPoStatus: 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED' | 'WAITING_TLINES_TO_SIGN' | 'WAITING_T_TO_SIGN' | null = null;
    if (existingTypeItems.length > 0) {
      // Priority: SIGNED variants > READY_TO_SIGN > NOT_SIGNED
      const inheritable = ['SIGNED', 'WAITING_TLINES_TO_SIGN', 'WAITING_T_TO_SIGN'] as const;
      const signedItem = inheritable
        .map(st => existingTypeItems.find(item => item.poSignStatus === st))
        .find(Boolean);
      if (signedItem) {
        inheritedPoStatus = signedItem.poSignStatus as any;
      } else if (existingTypeItems.some(item => item.poSignStatus === 'READY_TO_SIGN')) {
        inheritedPoStatus = 'READY_TO_SIGN';
      }
    }

    const itemWithInheritedStatus = inheritedPoStatus
      ? { ...newItem, poSignStatus: inheritedPoStatus }
      : newItem;

    // IMMEDIATE: Update main table state so user sees new item instantly in table
    setItemsById(prevItemsById => {
      const newItemsById = new Map(prevItemsById);
      newItemsById.set(newItem.id, itemWithInheritedStatus);
      return newItemsById;
    });

    // Also update global state so the item persists across re-renders
    if (updateGlobalItem) {
      updateGlobalItem(newItem.id, itemWithInheritedStatus);
    }

    // Update project.rows in parent so computedRows immediately includes the new item
    if (onItemCreated) {
      onItemCreated(project.projectId, itemWithInheritedStatus);
    }

    // If inherited a signed status, persist it to backend immediately
    if (inheritedPoStatus) {
      applyPatch(newItem.id, { poSignStatus: inheritedPoStatus }, 'poSignStatus').catch(err =>
        console.error('Failed to inherit PO sign status for new item:', err)
      );
    }

    // NOTE: No full project refresh here — local state is already updated above.
    // Full refresh (loadProjects) causes scroll-to-top. WebSocket events handle other clients.
  };

  // Handler for navigation in vendor edit panel
  const handleVendorEditNavigate = (newIndex: number) => {
    if (vendorEditState &&
        newIndex >= 0 &&
        newIndex < vendorEditState.projectItems.length &&
        vendorEditState.projectItems[newIndex]) {
      const newItemId = vendorEditState.projectItems[newIndex].id;
      setVendorEditState({
        ...vendorEditState,
        currentItemId: newItemId
      });
    } else {
    }
  };

  // Handler to close vendor edit panel
  const handleVendorEditClose = () => {
    setVendorEditState(null);
  };

  const handleCellEdit = (itemId: string, field: string, typeGroup?: ProjectType) => {
    setEditingCell({ projectId: projectData.projectId, itemId, field, typeGroup });
  };

  const handleCellClick = (
    e: React.MouseEvent,
    itemId: string,
    field: string,
    typeGroup?: ProjectType
  ) => {
    e.stopPropagation(); // Prevent event bubbling

    // Check if column is editable before allowing editing
    if (!isColumnEditable(field as ColumnKey)) {
      return; // Prevent editing
    }

    // Check if column is hidden
    if (!isColumnVisible(field as ColumnKey)) {
      return; // Prevent editing
    }

    // Check if itemId exists
    if (!itemId) {
      return; // Prevent editing
    }

    handleCellEdit(itemId, field, typeGroup);
  };


  const handleCellSave = async (value: string) => {
    if (!editingCell) return;


    // Push undo entry before mutation
    const currentItem = itemsById.get(editingCell.itemId);
    if (currentItem && !editingCell.itemId.startsWith('new-row-')) {
      pushUndo({
        entityType: undoEntityType,
        entityId: editingCell.itemId,
        parentId: project.projectId,
        previousValues: { [editingCell.field]: currentItem[editingCell.field as keyof typeof currentItem] ?? null },
        description: `Changed ${editingCell.field}`,
      });
    }

    if (editingCell.field === 'poSignStatus') {
      // Map display value to enum value
      const mapPoSignStatusToEnum = (displayValue: string): 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED' | 'WAITING_TLINES_TO_SIGN' | 'WAITING_T_TO_SIGN' => {
        switch (displayValue) {
          case 'NOT SIGNED': return 'NOT_SIGNED';
          case 'READY TO SIGN': return 'READY_TO_SIGN';
          case 'SIGNED': return 'SIGNED';
          case 'WAITING TLINES TO SIGN': return 'WAITING_TLINES_TO_SIGN';
          case 'WAITING T TO SIGN': return 'WAITING_T_TO_SIGN';
          default:
            return 'NOT_SIGNED';
        }
      };

      const enumValue = mapPoSignStatusToEnum(value);

      try {
        // Use applyPatch for full global sync
        await applyPatch(editingCell.itemId, { poSignStatus: enumValue }, 'poSignStatus');
      } catch (error) {
      }
    } else {
      // 💰 CRITICAL: Handle pfUsd/pfTl with backend persistence and immediate UI update
      if (editingCell.field === 'pfCode' || editingCell.field === 'orderNo') {
        const patchPayload = { [editingCell.field]: value || null };
        applyPatch(editingCell.itemId, patchPayload, editingCell.field)
          .then(() => {})
          .catch((_error) => {});
      } else if (editingCell.field === 'pfUsd' || editingCell.field === 'pfTl' || editingCell.field === 'expensesUsd' || editingCell.field === 'expensesTl' || editingCell.field === 'invoice' || editingCell.field === 'invoiceTl') {
        const parsed = parseFloat(value);
        const numericValue = value === '' ? null : (isNaN(parsed) ? null : parsed);
        const patchPayload = { [editingCell.field]: numericValue };
        // Use applyPatch for backend persistence + immediate UI update
        applyPatch(editingCell.itemId, patchPayload, editingCell.field)
          .then(() => {
          })
          .catch((_error) => {
          });
      } else {
        // CRITICAL FIX: Use updateItemInState instead of row index manipulation for other fields
        updateItemInState(editingCell.itemId, {
          [editingCell.field]: value
        });
      }
    }

    setEditingCell(null);
  };

  // Handler for PF Sign Status updates with backend persistence
  const handlePfSignStatusSave = async (itemId: string, pfSignStatus: string, ____rowIndex?: number) => {
    if (isMutating) return;
    setIsMutating(true);

    const mapPfSignStatusToEnum = (displayValue: string): 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED' | 'WAITING_TLINES_TO_SIGN' | 'WAITING_T_TO_SIGN' | 'SIGNED_WITH_EST_PRICE' => {
      switch (displayValue) {
        case 'NOT SIGNED': return 'NOT_SIGNED';
        case 'READY TO SIGN': return 'READY_TO_SIGN';
        case 'SIGNED': return 'SIGNED';
        case 'WAITING TLINES TO SIGN': return 'WAITING_TLINES_TO_SIGN';
        case 'WAITING T TO SIGN': return 'WAITING_T_TO_SIGN';
        case 'SIGNED WITH EST PRICE': return 'SIGNED_WITH_EST_PRICE';
        default: return 'NOT_SIGNED';
      }
    };

    setEditingCell(null);

    // If multiple rows are drag-selected, apply to all; otherwise just this one
    const activeDragIds = dragSelectedRowIdsRef.current;
    const activeDragField = dragFieldRef.current;
    const targetIds = activeDragIds.size > 1 && activeDragField === 'pfSignStatus'
      ? [...activeDragIds]
      : [itemId];
    setDragSelectedRowIds(new Set());
    dragSelectedRowIdsRef.current = new Set();

    try {
      for (const id of targetIds) {
        if (id.startsWith('new-row-')) continue;
        const oldItem = itemsById.get(id);
        if (oldItem) {
          pushUndo({
            entityType: undoEntityType, entityId: id, parentId: project.projectId,
            previousValues: { pfSignStatus: oldItem.pfSignStatus ?? null },
            description: 'Changed PF Sign Status',
          });
        }
        updateItemInState(id, { pfSignStatus });
        try {
          await applyPatch(id, { pfSignStatus: mapPfSignStatusToEnum(pfSignStatus) }, 'pfSignStatus');
        } catch (patchError) {
          console.error('PF Sign Status update failed, rolling back:', patchError);
          const oldEnum = oldItem?.pfSignStatus;
          if (oldEnum) {
            const oldDisplay = mapSignStatusToFrontend(oldEnum);
            updateItemInState(id, { pfSignStatus: oldDisplay });
          }
        }
      }
    } catch (error) {
      console.error('PF Sign Status handler error:', error);
    } finally {
      setIsMutating(false);
    }
  };


  // 🎯 TYPE-LEVEL PO SIGN STATUS: Handler for updating entire type group
  const handlePoSignStatusSaveByType = async (itemId: string, poSignStatus: string) => {

    if (isMutating) return;
    setIsMutating(true);

    try {
      // Map display values to backend enum values
      const mapPoSignStatusToEnum = (displayValue: string): 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED' | 'WAITING_TLINES_TO_SIGN' | 'WAITING_T_TO_SIGN' => {
        switch (displayValue) {
          case 'NOT SIGNED': return 'NOT_SIGNED';
          case 'READY TO SIGN': return 'READY_TO_SIGN';
          case 'SIGNED': return 'SIGNED';
          case 'WAITING TLINES TO SIGN': return 'WAITING_TLINES_TO_SIGN';
          case 'WAITING T TO SIGN': return 'WAITING_T_TO_SIGN';
          default: return 'NOT_SIGNED';
        }
      };

      const enumValue = mapPoSignStatusToEnum(poSignStatus);

      // Find the clicked item to get its type
      const clickedItem = itemsById.get(itemId);
      if (!clickedItem) {
        console.error('❌ CLICKED ITEM NOT FOUND', { itemId });
        return;
      }

      const clickedItemType = mapBackendTypeToFrontend(clickedItem.type, clickedItem.customType);

      // Find all items in the same type group
      const allItems = Array.from(itemsById.values());
      const typeItems = allItems.filter(item => {
        const itemType = mapBackendTypeToFrontend(item.type, item.customType);
        return itemType === clickedItemType;
      });


      // Push undo for each affected item
      typeItems.forEach(item => {
        pushUndo({ entityType: undoEntityType, entityId: item.id, parentId: project.projectId,
          previousValues: { poSignStatus: item.poSignStatus ?? null }, description: 'Changed PO Sign Status (type)' });
      });

      // Sequential on purpose: the backend issues/removes PF codes on PO status changes, and
      // parallel requests for the same project+type could pick the same next PF number.
      for (const item of typeItems) {
        await applyPatch(item.id, { poSignStatus: enumValue }, 'poSignStatus');
      }

    } catch (error) {
      console.error('❌ TYPE-LEVEL PO UPDATE ERROR', { itemId, error });
    } finally {
      setIsMutating(false);
    }

    setEditingCell(null);
  };

  // Handler for date fields (ETD/RTD/RTR/FTD) with backend persistence
  const handleDateSave = async (itemId: string, field: 'std' | 'etd' | 'rtd' | 'rtr' | 'ftd', dateValue: string, ___rowIndex?: number) => {
    // Guard against double-clicks
    if (isMutating) return;
    setIsMutating(true);

    try {
      if (itemId.startsWith('new-row-')) {
        // TODO: Handle new rows - temporarily disabled during state refactor
        setEditingCell(null);
        return;
      }

      // Push undo entry before mutation
      const oldItem = itemsById.get(itemId);
      if (oldItem) {
        pushUndo({
          entityType: undoEntityType,
          entityId: itemId,
          parentId: project.projectId,
          previousValues: { [field]: oldItem[field as keyof typeof oldItem] ?? null },
          description: `Changed ${field}`,
        });
      }

      const patchPayload = { [field]: dateValue || null };

      // 🎯 Use unified applyPatch function for immediate UI update
      await applyPatch(itemId, patchPayload, field);

    } catch (error) {
    } finally {
      setIsMutating(false);
    }

    // Close the editor AFTER state update
    setEditingCell(null);
  };

  // Handler for container number with backend persistence
  const handlePaymentRuleSave = async (itemId: string, paymentRule: string, ___rowIndex?: number) => {

    // Guard against double-clicks
    if (isMutating) {
      return;
    }

    setIsMutating(true);

    try {
      if (itemId.startsWith('new-row-')) {
        // TODO: Handle new rows - temporarily disabled during state refactor
        setEditingCell(null);
        return;
      } else {
        // Push undo entry before mutation
        const oldItem = itemsById.get(itemId);
        if (oldItem) {
          pushUndo({
            entityType: undoEntityType,
            entityId: itemId,
            parentId: project.projectId,
            previousValues: { paymentRule: oldItem.paymentRule ?? null },
            description: 'Changed payment rule',
          });
        }

        // Use applyPatch for full global sync (backend + local state + updateGlobalItem + onSupplierItemUpdated)
        await applyPatch(itemId, { paymentRule: paymentRule === '' ? null : paymentRule }, 'paymentRule');

      }
    } catch (error) {
    } finally {
      setIsMutating(false);
    }

    // Close the editor AFTER state update
    setEditingCell(null);
  };

  const handleContainerNoSave = async (itemId: string, containerNo: string, ___rowIndex?: number) => {
    if (isMutating) return;
    if (itemId.startsWith('new-row-')) { setEditingCell(null); return; }

    setEditingCell(null);

    // If multiple rows are drag-selected, apply to all; otherwise just this one
    const activeDragIds = dragSelectedRowIdsRef.current;
    const targetIds = activeDragIds.size > 1
      ? [...activeDragIds]
      : [itemId];
    setDragSelectedRowIds(new Set());
    dragSelectedRowIdsRef.current = new Set();

    // Fetch date once for the container number
    let previousDate: string | null = null;
    if (containerNo) {
      try { previousDate = await getLatestContainerDate(containerNo); } catch {}
    }

    for (const id of targetIds) {
      if (id.startsWith('new-row-')) continue;
      const oldItem = itemsById.get(id);
      if (oldItem) {
        pushUndo({ entityType: undoEntityType, entityId: id, parentId: project.projectId,
          previousValues: { containerNo: oldItem.containerNo ?? null }, description: 'Changed container' });
      }
      await applyPatch(id, { containerNo: containerNo || null }, 'containerNo');
      if (containerNo && previousDate) {
        try {
          await applyPatch(id, {
            containerDate: new Date(previousDate).toISOString()
          }, 'containerDate');
        } catch (err) {
          console.error('Container date sync failed:', err);
        }
      }
    }
  };

  // Handle container rename - update ALL items in this project that had the old name
  const handleContainerRename = useCallback((oldName: string, newName: string) => {
    setItemsById(prev => {
      const newMap = new Map(prev);
      newMap.forEach((item, id) => {
        if (item.containerNo && item.containerNo.toUpperCase() === oldName.toUpperCase()) {
          const updated = { ...item, containerNo: newName };
          newMap.set(id, updated);
          if (updateGlobalItem) updateGlobalItem(id, { containerNo: newName });
          if (onSupplierItemUpdated) onSupplierItemUpdated(updated as BackendProjectItem);
        }
      });
      return newMap;
    });
  }, [updateGlobalItem, onSupplierItemUpdated]);

  const handleContainerDateSave = async (itemId: string, containerDate: string, rowIndex?: number) => {
    // Guard against double-clicks
    if (isMutating) {
      return;
    }

    setIsMutating(true);

    try {
      // ✅ ITEM-LEVEL: Container date is now an item-level field
      // Check if this is a new row or existing item
      if (!itemId || itemId.startsWith('new-row-')) {
        // New item - use row creation logic
        if (rowIndex !== undefined) {
          const row = projectData.rows[rowIndex];
          if (!row) return;

          const newItemData = {
            type: row.type?.toUpperCase() as any,
            vendorId: row.vendorId || undefined,
            orderType: row.orderType || undefined,
            status: row.status || undefined,
            pfSignStatus: row.pfSignStatus || undefined,
            poSignStatus: row.poSignStatus || undefined,
            std: row.std || undefined,
            etd: row.etd || undefined,
            rtd: row.rtd || undefined,
            rtr: row.rtr || undefined,
            ftd: row.ftd || undefined,
            containerNo: row.containerNo || undefined,
            containerDate: containerDate ? new Date(containerDate + 'T00:00:00.000Z').toISOString() : undefined
          };

          await createItem(newItemData);
        }
      } else {
        // Push undo before mutation
        const oldItem = itemsById.get(itemId);
        if (oldItem) {
          pushUndo({ entityType: undoEntityType, entityId: itemId, parentId: project.projectId,
            previousValues: { containerDate: oldItem.containerDate ?? null }, description: 'Changed container date' });
        }

        // Use applyPatch for instant UI + global sync
        const isoDate = containerDate ? new Date(containerDate + 'T00:00:00.000Z').toISOString() : null;
        await applyPatch(itemId, { containerDate: isoDate }, 'containerDate');
      }


      // ✅ GLOBAL AUTO-ASSIGNMENT: If this is a single container number, apply to ALL matching containers across ALL projects
      await applyContainerDateToMatchingContainersGlobally(itemId, containerDate);
    } catch (error) {
      console.error('❌ Failed to update container date:', error);
      alert('Failed to update container date. Please try again.');
    } finally {
      setIsMutating(false);
    }

    // Close the editor
    setEditingCell(null);
  };

  // ✅ GLOBAL AUTO-ASSIGNMENT: Apply container date to ALL matching containers
  const applyContainerDateToMatchingContainersGlobally = async (sourceItemId: string, containerDate: string) => {
    try {
      const sourceItem = itemsById.get(sourceItemId);
      if (!sourceItem || !sourceItem.containerNo) return;

      const sourceContainerNo = sourceItem.containerNo.trim();
      if (!sourceContainerNo) return;

      const isoDate = containerDate ? new Date(containerDate + 'T00:00:00.000Z').toISOString() : null;
      const displayDate = containerDate || '';

      // 1. Immediately update ALL items in this project that share the same container (case-insensitive)
      const matchKey = sourceContainerNo.toLowerCase();
      itemsById.forEach((item, id) => {
        if (item.containerNo && item.containerNo.trim().toLowerCase() === matchKey) {
          updateItemInState(id, { containerDate: displayDate });
        }
      });

      // 2. Persist to backend for all projects via sync API
      const { syncContainerDate } = await import('../lib/containers');
      const syncResult = await syncContainerDate(sourceContainerNo, isoDate);

      // 3. Broadcast to other ProjectBlock instances (other projects on same page)
      const globalSyncEvent = new CustomEvent('globalContainerSync', {
        detail: { containerNo: sourceContainerNo, containerDate, affectedItems: syncResult?.details ?? [] }
      });
      window.dispatchEvent(globalSyncEvent);

    } catch (error) {
      console.error('❌ GLOBAL_CONTAINER_AUTO_ASSIGNMENT_ERROR:', error);
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
  };

  // Handle vendor code/name edit - update ALL items using this vendor instantly
  const handleVendorEdited = useCallback((vendorId: string, newCode: string, newName: string) => {
    setItemsById(prev => {
      const newMap = new Map(prev);
      // Find old vendor code from first matching item
      let oldCode = '';
      for (const item of prev.values()) {
        if (item.vendorId === vendorId && item.vendor?.code) {
          oldCode = item.vendor.code;
          break;
        }
      }
      newMap.forEach((item, id) => {
        if (item.vendorId === vendorId) {
          // Update PF code: replace old vendor code prefix with new one
          let newPfCode = item.pfCode;
          if (oldCode && newCode && item.pfCode && item.pfCode.startsWith(`${oldCode}-`)) {
            newPfCode = `${newCode}-${item.pfCode.slice(oldCode.length + 1)}`;
          }
          const updated = {
            ...item,
            pfCode: newPfCode,
            vendor: { ...(item.vendor || {}), id: vendorId, code: newCode, name: newName },
          };
          newMap.set(id, updated as any);
          if (updateGlobalItem) updateGlobalItem(id, updated as any);
          if (onSupplierItemUpdated) onSupplierItemUpdated(updated as BackendProjectItem);
        }
      });
      return newMap;
    });
  }, [updateGlobalItem, onSupplierItemUpdated]);

  // Status note save/delete handler
  const handleStatusNoteSave = useCallback(async (itemId: string, noteText: string) => {
    const value = noteText.trim();
    const oldItem = itemsById.get(itemId);
    if (oldItem) {
      pushUndo({ entityType: undoEntityType, entityId: itemId, parentId: project.projectId,
        previousValues: { statusNote: oldItem.statusNote ?? '' }, description: value ? 'Changed note' : 'Deleted note' });
    }
    try {
      await applyPatch(itemId, { statusNote: value }, 'statusNote');
    } catch (err) {
      console.error('Failed to save status note:', err);
    }
    setNoteDialog(null);
    setNoteMenu(null);
  }, [applyPatch, itemsById, pushUndo, undoEntityType, project.projectId]);

  // Price note save/delete handler
  const handlePriceNoteSave = useCallback(async (itemId: string, field: string, noteText: string) => {
    const value = noteText.trim();
    const oldItem = itemsById.get(itemId);
    const currentNotes = (oldItem?.priceNotes as Record<string, string> | null) || {};
    const updatedNotes = value
      ? { ...currentNotes, [field]: value }
      : (() => { const n = { ...currentNotes }; delete n[field]; return n; })();
    try {
      await applyPatch(itemId, { priceNotes: updatedNotes }, 'priceNotes');
      setItemsById(prev => {
        const newMap = new Map(prev);
        const item = newMap.get(itemId);
        if (item) newMap.set(itemId, { ...item, priceNotes: Object.keys(updatedNotes).length > 0 ? updatedNotes : null });
        return newMap;
      });
    } catch (err) {
      console.error('Failed to save price note:', err);
    }
    setPriceNoteDialog(null);
    setPriceNoteMenu(null);
  }, [applyPatch, itemsById, project.projectId]);

  // Handler for vendor selection from CellVendorAutocomplete - FIXED: ID-based updates
  const handleVendorSave = async (itemId: string, vendorId: string) => {
    // Guard against double-clicks
    if (isMutating) return;
    setIsMutating(true);

    try {

      // Push undo entry before mutation
      const oldItemForVendor = itemsById.get(itemId);
      if (oldItemForVendor) {
        pushUndo({
          entityType: undoEntityType,
          entityId: itemId,
          parentId: project.projectId,
          previousValues: { vendorId: oldItemForVendor.vendorId ?? null },
          description: 'Changed vendor',
        });
      }

      // Use applyPatch for full global sync (updateGlobalItem + onSupplierItemUpdated)
      await applyPatch(itemId, { vendorId: vendorId || undefined }, 'vendorId');

    } catch (error) {
    } finally {
      setIsMutating(false);
    }

    // Close the editor AFTER state update
    setEditingCell(null);
  };

  // Handler for vendor selection on new rows (creates new backend item) - FIXED: Type mapping
  const handleNewRowVendorSave = async (__rowIndex: number, vendorId: string) => {

    // ADDED: isMutating guard to prevent double-clicks
    if (isMutating) {
      return;
    }

    const row = projectData.rows[__rowIndex];
    if (!row) {
      return;
    }

    setIsMutating(true);

    try {
      // 1. FIXED: Proper frontend-to-backend type mapping with validation
      const frontendToBackendTypeMap: Record<string, string> = {
        'Millwork': 'MILLWORK',
        'Shelving': 'SHELVING',
        'Ceiling': 'CEILING',
        'Image': 'IMAGE',
        'Furniture': 'FURNITURE',
        'Decoration': 'DECORATION'
      };

      const backendType = frontendToBackendTypeMap[row.type];
      if (!backendType) {
        return;
      }
      // 2. Create new backend item via API with correct type
      const newItemData = {
        type: backendType as any, // Type assertion since we validated above
        vendorId: vendorId || undefined,
        orderType: row.orderType || undefined,
        pfSignStatus: 'NOT_SIGNED' as const,
        poSignStatus: 'NOT_SIGNED' as const,
        status: 'NOT_ORDERED' as const,
        std: row.std || undefined,
        etd: row.etd || undefined,
        rtd: row.rtd || undefined,
        rtr: row.rtr || undefined,
        ftd: row.ftd || undefined,
        containerNo: row.containerNo || undefined
      };
      // 3. IMMEDIATE backend creation
      const createdItem = await createItem(newItemData);
      if (createdItem) openStockUsageIfNewStockRow(createdItem as BackendProjectItem);

      // 4. Update local state immediately (no full refresh to preserve scroll)
      if (createdItem) {
        setItemsById(prev => {
          const newMap = new Map(prev);
          newMap.set(createdItem.id, createdItem);
          return newMap;
        });
        if (updateGlobalItem) {
          updateGlobalItem(createdItem.id, createdItem);
        }
        // Surgically add the new row to project.rows so computedRows picks it up instantly
        if (onItemCreated) {
          onItemCreated(project.projectId, createdItem);
        }
      }

    } catch (error) {
    } finally {
      // ADDED: Always reset isMutating flag
      setIsMutating(false);
    }

    // 6. Close the editor
    setEditingCell(null);
  };

  // Handler for order type selection - INLINE AUTOCOMPLETE
  const handleOrderTypeSave = async (itemId: string, orderType: string, ___rowIndex?: number) => {
    if (isMutating) return;
    if (itemId.startsWith('new-row-')) { setEditingCell(null); return; }

    // Push undo before mutation
    const oldItem = itemsById.get(itemId);
    if (oldItem) {
      pushUndo({ entityType: undoEntityType, entityId: itemId, parentId: project.projectId,
        previousValues: { orderType: oldItem.orderType ?? null }, description: 'Changed order type' });
    }

    setEditingCell(null);
    await applyPatch(itemId, { orderType: orderType || null }, 'orderType');
  };

  // Handler for status selection - INLINE AUTOCOMPLETE WITH STD AUTO-SET
  const handleStatusSave = async (itemId: string, status: string, ___rowIndex?: number) => {

    // Guard against double-clicks
    if (isMutating) {
      return;
    }

    // Determine target IDs — bulk if multiple drag-selected in status field
    const activeDragIds = dragSelectedRowIdsRef.current;
    const activeDragField = dragFieldRef.current;
    const targetIds = activeDragIds.size > 1 && activeDragField === 'status'
      ? [...activeDragIds]
      : [itemId];
    setDragSelectedRowIds(new Set());
    dragSelectedRowIdsRef.current = new Set();
    setEditingCell(null);

    // BUSINESS RULE: Check if user is selecting READY on already-READY item with RTD (single only)
    if (targetIds.length === 1 && status === 'READY' && !itemId.startsWith('new-row-')) {
      const existingItem = itemsById.get(itemId);
      if (existingItem && existingItem.status === 'READY' && existingItem.rtd) {
        const rtdDate = new Date(existingItem.rtd).toLocaleDateString();
        const confirmMessage = `This item is already READY. RTD was previously set on ${rtdDate} and will not change unless you edit RTD manually.\n\nDo you want to proceed with updating the status?`;
        if (!confirm(confirmMessage)) {
          return;
        }
      }
    }

    setIsMutating(true);

    for (const id of targetIds) {
      if (id.startsWith('new-row-')) continue;

      const existingItemForUndo = itemsById.get(id);
      const previousStatus = existingItemForUndo?.status;

      // Push undo entry before mutation
      if (existingItemForUndo) {
        pushUndo({
          entityType: undoEntityType,
          entityId: id,
          parentId: project.projectId,
          previousValues: {
            status: previousStatus ?? null,
            std: existingItemForUndo.std ?? null,
            etd: existingItemForUndo.etd ?? null,
            rtr: existingItemForUndo.rtr ?? null,
            rtd: existingItemForUndo.rtd ?? null,
            rdy: existingItemForUndo.rdy ?? null,
            ftd: existingItemForUndo.ftd ?? null,
            snd: existingItemForUndo.snd ?? null,
          },
          description: `Changed status to ${status}`,
        });
      }

      // OPTIMISTIC UPDATE
      updateItemInState(id, { status });

      try {
        const updatedItem = await updateItem(id, { status: status || undefined });
        const statusPatch: any = {
          status,
          std: updatedItem.std !== undefined ? updatedItem.std : undefined,
          etd: updatedItem.etd !== undefined ? updatedItem.etd : undefined,
          rtr: isExpensesPMode
            ? (updatedItem.rtrd !== undefined ? updatedItem.rtrd : undefined)
            : (updatedItem.rtr !== undefined ? updatedItem.rtr : undefined),
          rtd: updatedItem.rtd !== undefined ? updatedItem.rtd : undefined,
          rdy: updatedItem.rdy !== undefined ? updatedItem.rdy : undefined,
          ftd: updatedItem.ftd !== undefined ? updatedItem.ftd : undefined,
          snd: updatedItem.snd !== undefined ? updatedItem.snd : undefined,
          pfSignStatus: updatedItem.pfSignStatus,
          poSignStatus: updatedItem.poSignStatus,
          pfCode: updatedItem.pfCode || undefined,
          containerNo: updatedItem.containerNo || undefined
        };
        Object.keys(statusPatch).forEach(key => {
          if (statusPatch[key] === undefined) delete statusPatch[key];
        });
        updateItemInState(id, statusPatch);
        if (updateGlobalItem) {
          updateGlobalItem(id, { ...statusPatch, status: statusPatch.status?.replace(/ /g, '_').toUpperCase() });
        }
        if (onSupplierItemUpdated && 'projectId' in updatedItem) {
          onSupplierItemUpdated(updatedItem as BackendProjectItem);
        }
      } catch (error) {
        if (existingItemForUndo?.status) {
          updateItemInState(id, { status: existingItemForUndo.status.replace(/_/g, ' ') });
        }
      }
    }

    setIsMutating(false);
  };

  const isEditing = (itemId: string, field: string) => {
    return editingCell?.itemId === itemId && editingCell?.field === field;
  };

  // Removed unused function: isTypeGroupEditing

  // Handler for PF USD updates with backend persistence
  const handlePfUsdSave = async (itemId: string, pfUsdValue: string, ___rowIndex?: number) => {
    if (itemId.startsWith('new-row-')) { setEditingCell(null); return; }
    const cleaned = pfUsdValue.replace(/,/g, '').trim();
    const numericValue = cleaned === '' ? null : parseFloat(cleaned);
    const finalValue = numericValue !== null && isNaN(numericValue) ? null : numericValue;
    // Push undo
    const oldItem = itemsById.get(itemId);
    if (oldItem) {
      pushUndo({ entityType: undoEntityType, entityId: itemId, parentId: project.projectId,
        previousValues: { pfUsd: oldItem.pfUsd ?? null }, description: 'Changed PF USD' });
    }
    setEditingCell(null);
    await applyPatch(itemId, { pfUsd: finalValue }, 'pfUsd');
  };

  // Handler for PF TL updates with backend persistence
  const handlePfTlSave = async (itemId: string, pfTlValue: string, ___rowIndex?: number) => {
    if (itemId.startsWith('new-row-')) { setEditingCell(null); return; }
    const cleaned = pfTlValue.replace(/,/g, '').trim();
    const numericValue = cleaned === '' ? null : parseFloat(cleaned);
    const finalValue = numericValue !== null && isNaN(numericValue) ? null : numericValue;
    // Push undo
    const oldItem = itemsById.get(itemId);
    if (oldItem) {
      pushUndo({ entityType: undoEntityType, entityId: itemId, parentId: project.projectId,
        previousValues: { pfTl: oldItem.pfTl ?? null }, description: 'Changed PF TL' });
    }
    setEditingCell(null);
    await applyPatch(itemId, { pfTl: finalValue }, 'pfTl');
  };

  const handleExpensesUsdSave = async (itemId: string, value: string, ___rowIndex?: number) => {
    if (itemId.startsWith('new-row-')) { setEditingCell(null); return; }
    const cleaned = value.replace(/,/g, '');
    const numericValue = parseFloat(cleaned) || 0;
    const oldItem = itemsById.get(itemId);
    if (oldItem) {
      pushUndo({ entityType: undoEntityType, entityId: itemId, parentId: project.projectId,
        previousValues: { expensesUsd: (oldItem as any).expensesUsd ?? null }, description: 'Changed Expenses USD' });
    }
    setEditingCell(null);
    await applyPatch(itemId, { expensesUsd: numericValue || null }, 'expensesUsd');
  };

  const handleExpensesTlSave = async (itemId: string, value: string, ___rowIndex?: number) => {
    if (itemId.startsWith('new-row-')) { setEditingCell(null); return; }
    const cleaned = value.replace(/,/g, '');
    const numericValue = parseFloat(cleaned) || 0;
    const oldItem = itemsById.get(itemId);
    if (oldItem) {
      pushUndo({ entityType: undoEntityType, entityId: itemId, parentId: project.projectId,
        previousValues: { expensesTl: (oldItem as any).expensesTl ?? null }, description: 'Changed Expenses TL' });
    }
    setEditingCell(null);
    await applyPatch(itemId, { expensesTl: numericValue || null }, 'expensesTl');
  };

  const renderEditor = (field: string, value: string, cellRef?: React.RefObject<HTMLDivElement>, __rowIndex?: number) => {
    const commonProps = {
      value,
      onSave: handleCellSave,
      onCancel: handleCellCancel
    };

    const statusProps = {
      ...commonProps,
      triggerRef: cellRef!
    };

    switch (field) {
      case 'vendor':
        // Use inline vendor autocomplete for vendor fields
        if (__rowIndex !== undefined && cellRef) {
          // 🚨 CRITICAL FIX: Use editingCell.itemId instead of rowToItemMap to prevent wrong item updates
          const mappedItemId = editingCell?.itemId;

          if (mappedItemId) {
            // Existing item - use correct item ID from editingCell (prevents wrong item selection)
            return (
              <CellVendorAutocomplete
                value={value}
                onSave={(vendorId) => handleVendorSave(mappedItemId, vendorId)}
                onCancel={handleCellCancel}
                onVendorEdited={handleVendorEdited}
                triggerRef={cellRef}
                itemId={mappedItemId}
                projectId={projectData.projectId}
              />
            );
          } else {
            // New row without backend item - use temporary ID and create new item
            const tempItemId = `new-row-${__rowIndex}`;
            return (
              <CellVendorAutocomplete
                value={value}
                onSave={(vendorId) => handleNewRowVendorSave(__rowIndex, vendorId)}
                onCancel={handleCellCancel}
                onVendorEdited={handleVendorEdited}
                triggerRef={cellRef}
                itemId={tempItemId}
                projectId={projectData.projectId}
              />
            );
          }
        }
        // Final fallback to VendorEditor
        return <VendorEditor {...commonProps} />;
      case 'orderType':
        // Use inline order type autocomplete for order type fields
        if (__rowIndex !== undefined && cellRef) {
          // 🚨 CRITICAL FIX: Use editingCell.itemId instead of rowToItemMap to prevent wrong item updates
          const itemIdForOrderType = editingCell?.itemId || `new-row-${__rowIndex}`;
          return (
            <CellOrderTypeAutocomplete
              value={value}
              onSave={(orderType) => handleOrderTypeSave(itemIdForOrderType, orderType, __rowIndex)}
              onCancel={handleCellCancel}
              triggerRef={cellRef}
              itemId={itemIdForOrderType}
              projectId={projectData.projectId}
            />
          );
        }
        return <OrderTypeEditor {...commonProps} />;
      case 'status':
        // Use inline status autocomplete for status fields
        if (__rowIndex !== undefined && cellRef) {
          // 🚨 CRITICAL FIX: Use editingCell.itemId instead of rowToItemMap to prevent wrong item updates
          const itemIdForStatus = editingCell?.itemId || `new-row-${__rowIndex}`;
          return (
            <CellStatusAutocomplete
              value={value}
              onSave={(status) => handleStatusSave(itemIdForStatus, status, __rowIndex)}
              onCancel={handleCellCancel}
              triggerRef={cellRef}
              itemId={itemIdForStatus}
              projectId={projectData.projectId}
            />
          );
        }
        return <StatusEditor {...statusProps} />;
      case 'pfSignStatus':
        // Use dedicated handler for PF sign status with backend persistence
        if (__rowIndex !== undefined && cellRef) {
          // 🚨 CRITICAL FIX: Use editingCell.itemId instead of rowToItemMap to prevent wrong item updates
          const itemIdForPfSign = editingCell?.itemId || `new-row-${__rowIndex}`;
          return (
            <PfSignStatusEditor
              value={value}
              onSave={(pfSignStatus) => handlePfSignStatusSave(itemIdForPfSign, pfSignStatus, __rowIndex)}
              onCancel={handleCellCancel}
              triggerRef={cellRef}
            />
          );
        }
        return <PfSignStatusEditor {...statusProps} />;
      case 'poSignStatus':
        // 🎯 TYPE-LEVEL: Use type-level handler for PO sign status updates
        if (__rowIndex !== undefined && cellRef) {
          const itemIdForPoSign = editingCell?.itemId || `new-row-${__rowIndex}`;
          return (
            <PoSignStatusEditor
              value={value}
              onSave={(poSignStatus) => handlePoSignStatusSaveByType(itemIdForPoSign, poSignStatus)}
              onCancel={handleCellCancel}
              triggerRef={cellRef}
            />
          );
        }
        return <PoSignStatusEditor {...statusProps} />;
      case 'std':
      case 'etd':
      case 'rtd':
      case 'rtr':
      case 'ftd':
        // Use dedicated handler for date fields with backend persistence
        if (__rowIndex !== undefined && cellRef) {
          // 🚨 CRITICAL FIX: Use editingCell.itemId instead of rowToItemMap to prevent wrong item updates
          const itemIdForDate = editingCell?.itemId || `new-row-${__rowIndex}`;
          return (
            <DateEditor
              value={value}
              onSave={(dateValue) => handleDateSave(itemIdForDate, field as 'std' | 'etd' | 'rtd' | 'ftd', dateValue, __rowIndex)}
              onCancel={handleCellCancel}
            />
          );
        }
        return <DateEditor {...commonProps} />;
      case 'paymentRule':
        // Use dedicated payment rule editor for backend persistence
        if (__rowIndex !== undefined && cellRef) {
          // 🚨 CRITICAL FIX: Use editingCell.itemId instead of rowToItemMap to prevent wrong item updates
          const itemIdForPaymentRule = editingCell?.itemId || `new-row-${__rowIndex}`;
          return (
            <PaymentRuleEditor
              value={value}
              onSave={(paymentRule) => handlePaymentRuleSave(itemIdForPaymentRule, paymentRule, __rowIndex)}
              onCancel={handleCellCancel}
              triggerRef={cellRef}
              paymentRules={paymentRules}
              onRulesUpdated={(rules) => rules.forEach(addPaymentRule)}
            />
          );
        }
        return (
          <PaymentRuleEditor
            {...statusProps}
            paymentRules={paymentRules}
            onRulesUpdated={(rules) => rules.forEach(addPaymentRule)}
          />
        );
      case 'containerNo':
        // Use dedicated container cell editor with dropdown + rename functionality
        if (__rowIndex !== undefined && cellRef) {
          const itemIdForContainer = editingCell?.itemId || `new-row-${__rowIndex}`;
          return (
            <ContainerCellEditor
              value={value}
              onSave={(containerNo) => handleContainerNoSave(itemIdForContainer, containerNo, __rowIndex)}
              onCancel={handleCellCancel}
              onRename={handleContainerRename}
              triggerRef={cellRef}
            />
          );
        }
        return (
          <ContainerCellEditor
            value={value}
            onSave={(containerNo) => handleContainerNoSave('', containerNo)}
            onCancel={handleCellCancel}
            onRename={handleContainerRename}
          />
        );
      case 'containerDate':
        // ✅ ITEM-LEVEL: Container date is now an item-level field
        if (__rowIndex !== undefined && cellRef) {
          // Use editingCell.itemId for existing items, or new-row-X for new items
          const itemIdForContainerDate = editingCell?.itemId || `new-row-${__rowIndex}`;
          return (
            <DateEditor
              value={value}
              onSave={(dateValue) => handleContainerDateSave(itemIdForContainerDate, dateValue, __rowIndex)}
              onCancel={handleCellCancel}
            />
          );
        }
        return (
          <DateEditor
            value={value}
            onSave={(dateValue) => handleContainerDateSave('', dateValue)}
            onCancel={handleCellCancel}
          />
        );
      case 'pfCode':
      case 'orderNo':
        // Simple text input: PF code (custom types / Trust Stock) and Trust Stock ORDER NO
        return (
          <input
            type="text"
            defaultValue={value}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'white',
              padding: '4px',
              fontFamily: 'monospace'
            }}
            autoFocus
            onBlur={(e) => handleCellSave(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCellSave(e.currentTarget.value);
              } else if (e.key === 'Escape') {
                handleCellCancel();
              }
            }}
          />
        );
      case 'pfUsd':
        // Use numeric editor for PF USD field with currency formatting
        if (__rowIndex !== undefined && cellRef) {
          // 🚨 CRITICAL FIX: Use editingCell.itemId instead of rowToItemMap to prevent wrong item updates
          const itemIdForPfUsd = editingCell?.itemId || `new-row-${__rowIndex}`;
          return (
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              defaultValue={value}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'white',
                padding: '4px',
                fontFamily: 'monospace',
                textAlign: 'right'
              }}
              autoFocus
              onBlur={(e) => handlePfUsdSave(itemIdForPfUsd, e.target.value, __rowIndex)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handlePfUsdSave(itemIdForPfUsd, e.currentTarget.value, __rowIndex);
                } else if (e.key === 'Escape') {
                  handleCellCancel();
                }
              }}
            />
          );
        }
        return <TextEditor {...commonProps} />;
      case 'pfTl':
        // Use numeric editor for PF TL field with currency formatting
        if (__rowIndex !== undefined && cellRef) {
          // 🚨 CRITICAL FIX: Use editingCell.itemId instead of rowToItemMap to prevent wrong item updates
          const itemIdForPfTl = editingCell?.itemId || `new-row-${__rowIndex}`;
          return (
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              defaultValue={value}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'white',
                padding: '4px',
                fontFamily: 'monospace',
                textAlign: 'right'
              }}
              autoFocus
              onBlur={(e) => handlePfTlSave(itemIdForPfTl, e.target.value, __rowIndex)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handlePfTlSave(itemIdForPfTl, e.currentTarget.value, __rowIndex);
                } else if (e.key === 'Escape') {
                  handleCellCancel();
                }
              }}
            />
          );
        }
        return <TextEditor {...commonProps} />;
      case 'expensesUsd':
        if (__rowIndex !== undefined && cellRef) {
          const itemIdForExpUsd = editingCell?.itemId || `new-row-${__rowIndex}`;
          return (
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              defaultValue={value}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'white',
                padding: '4px',
                fontFamily: 'monospace',
                textAlign: 'right'
              }}
              autoFocus
              onBlur={(e) => handleExpensesUsdSave(itemIdForExpUsd, e.target.value, __rowIndex)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleExpensesUsdSave(itemIdForExpUsd, e.currentTarget.value, __rowIndex);
                } else if (e.key === 'Escape') {
                  handleCellCancel();
                }
              }}
            />
          );
        }
        return <TextEditor {...commonProps} />;
      case 'expensesTl':
        if (__rowIndex !== undefined && cellRef) {
          const itemIdForExpTl = editingCell?.itemId || `new-row-${__rowIndex}`;
          return (
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              defaultValue={value}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'white',
                padding: '4px',
                fontFamily: 'monospace',
                textAlign: 'right'
              }}
              autoFocus
              onBlur={(e) => handleExpensesTlSave(itemIdForExpTl, e.target.value, __rowIndex)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleExpensesTlSave(itemIdForExpTl, e.currentTarget.value, __rowIndex);
                } else if (e.key === 'Escape') {
                  handleCellCancel();
                }
              }}
            />
          );
        }
        return <TextEditor {...commonProps} />;
      default:
        return <TextEditor {...commonProps} />;
    }
  };

  const getSignStatusStyle = (value: string | undefined | null): { backgroundColor: string; color: string } => {
    if (!value) return { backgroundColor: 'white', color: 'black' };
    if (value === 'SIGNED') return { backgroundColor: '#92d050', color: 'black' };
    if (value === 'WAITING TLINES TO SIGN') return { backgroundColor: '#fb923c', color: 'black' };
    if (value === 'WAITING T TO SIGN') return { backgroundColor: '#a78bfa', color: 'black' };
    if (value === 'SIGNED WITH EST PRICE') return { backgroundColor: '#4ade80', color: 'black' };
    if (value === 'READY TO SIGN') return { backgroundColor: '#ffff00', color: 'black' };
    if (value === 'NOT SIGNED') return { backgroundColor: '#ff0000', color: 'black' };
    return { backgroundColor: 'white', color: 'black' };
  };

  const getStatusClass = (status: string | undefined | null) => {
    if (!status) return '';

    if (status === 'SIGNED') return 'status-approved';
    if (status === 'READY TO SIGN') return 'status-pending';
    if (status === 'NOT SIGNED') return 'status-review';
    if (status.includes('SENT')) return 'status-approved';
    if (status.includes('READY')) return 'status-approved';
    if (status.includes('HOLD')) return 'status-review';
    if (status.includes('ORDERED') || status.includes('ASSEMBLY')) return 'status-in-progress';
    return '';
  };

  // Calculate total height for project number spanning
  const dataRowsHeight = projectData.rows.length * ROW_HEIGHT;
  const minProjectHeight = ROW_HEIGHT; // Minimum height even with no line items
  // TOTAL row is now part of normal layout, so include it in the calculation
  const totalProjectHeight = Math.max(dataRowsHeight + TOTAL_ROW_HEIGHT, minProjectHeight);

  let globalRowIndex = 0;

  return (
    <>
    {/* Grid-width constrained wrapper for both section header and project header */}
    <div style={{ 
      width: gridWidthPx,
      minWidth: gridWidthPx,
      maxWidth: gridWidthPx
    }}>
      {/* Section Header - Only render for first project in section */}
      {showSectionHeader && <SectionSeparator title={sectionLabel} />}
      
      {/* Project Header */}
      <ProjectHeader
        ref={projectHeaderRef}
        project={projectData}
        onClick={handleProjectHeaderClick}
        onContextMenu={handleProjectHeaderRightClick}
      />
    </div>

    <div className="project-block">
      <div className="board-content">
        <div className="project-scroll">
          <div className="board">
            {/* Fixed Left Section - Sticky */}
            <div className="fixed-left">
              {/* Fixed Header */}
              <div className="header-fixed">
                <div
                  className="column-header-cell col-project-no"
                  style={getHeaderCellStyle('projectNo' as ColumnKey)}
                >
                  {isTrustStockMode ? 'STOCK' : 'PROJECT NO'}
                </div>
                <div
                  className="column-header-cell col-type"
                  style={getHeaderCellStyle('type' as ColumnKey)}
                >
                  TYPE
                </div>
              </div>

              {/* Fixed Body Rows */}
              <div className="rows-fixed">
                {/* Project Number Column */}
                <div
                  className={`projectno-cell project-number-${currentProjectColor}`}
                  onClick={handleProjectHeaderClick}
                  onContextMenu={handleProjectHeaderRightClick}
                  data-debug={`color-${currentProjectColor}-urgent-${isUrgent}-items-${itemsById.size}`}
                  style={{
                    position: 'relative',
                    height: `${totalProjectHeight}px`,
                    backgroundColor: currentProjectColor === 'orange' ? '#DE8244' :
                                   currentProjectColor === 'blue' ? '#6A99D1' :
                                   currentProjectColor === 'red' ? '#E53E3E' : '#9FCF63',
                    display: isColumnVisible('projectNo') ? 'flex' : 'none',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                >
                  {selectable && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => onToggleSelect?.(project.projectId)}
                      style={{
                        position: 'absolute',
                        top: '6px',
                        left: '6px',
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer',
                        zIndex: 2,
                      }}
                    />
                  )}
                  <span className="projectno-text" style={{
                    fontSize: mode === 'missingExtra' ? '14px' : '18px', // Smaller for derived codes
                    fontWeight: '800',
                    color: 'white',
                    textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                    letterSpacing: '0.5px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    {mode === 'missingExtra' && (project as any).derivedProjectCode
                      ? (project as any).derivedProjectCode
                      : displayProjectNo(projectData.projectNumber)}
                    {(() => {
                      const marker = parseDuplicateMarker(projectData.projectNumber);
                      if (marker.kind !== 'old') return null;
                      return (
                        <span
                          title={marker.timestamp
                            ? `Renamed on ${new Date(marker.timestamp).toLocaleString()} when this code was recreated`
                            : 'Kept as old duplicate'}
                          style={{
                            background: 'rgba(0,0,0,0.55)',
                            color: '#fff',
                            fontSize: '9px',
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            padding: '2px 6px',
                            borderRadius: '999px',
                            textShadow: 'none',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          OLD DUPLICATE
                        </span>
                      );
                    })()}
                  </span>
                </div>

                {/* Type Stack */}
                <div
                  className="type-stack"
                  style={{ display: isColumnVisible('type') ? 'block' : 'none' }}
                >
                  <div className="row-container">
                    {typeGroups.map((typeGroup) => {
                      const typeRowCount = typeGroup.rows.length;
                      // const typeGroupHeight = typeRowCount * ROW_HEIGHT; // Unused variable removed
                      globalRowIndex += typeRowCount;

                      const isTypeGroupRestricted = typeGroup.rows.length > 0 && typeGroup.rows[0].isRestricted;

                      // Turn type cell green when ALL rows in this type are SENT_TO_TLINES or SENT
                      const isAllSentToTlines = typeGroup.rows.length > 0 && typeGroup.rows.every(row => {
                        const s = ((row.status as string) || '').toUpperCase().replace(/[\s-]/g, '_');
                        return s === 'SENT_TO_TLINES' || s === 'SENT';
                      });

                      return (
                        <div key={typeGroup.type} className="type-group-container" style={{ position: 'relative' }}>
                          {/* Type Label - spans the exact height of the group */}
                          <div
                            ref={typeClickRef}
                            className={`type-cell spanning ${isTypeGroupRestricted ? '' : 'clickable'} ${isAllSentToTlines ? 'sent-to-tlines-complete' : ''}`}
                            style={{
                              height: `${typeRowCount * ROW_HEIGHT}px`,
                              position: 'absolute',
                              width: '140px',
                              zIndex: 1,
                              top: 0,
                              left: 0,
                              ...(isTypeGroupRestricted ? { filter: 'blur(4px)', opacity: 0.45, pointerEvents: 'none' } : {}),
                              ...(isAllSentToTlines ? {
                                backgroundColor: '#15803d',
                                color: 'white',
                                fontWeight: '700',
                                borderLeft: '3px solid #052e16',
                              } : {})
                            }}
                            onClick={(e) => !isTypeGroupRestricted && handleTypeClick(typeGroup, e)}
                          >
                            {groupBadgesByType.get(typeGroup.type) && (
                              <div style={{
                                position: 'absolute', top: '4px', left: '4px',
                                display: 'flex', flexDirection: 'column', gap: '2px', zIndex: 2,
                              }}>
                                {groupBadgesByType.get(typeGroup.type)!.map((b, i) => (
                                  <span
                                    key={`${b.number}-${b.rank}-${i}`}
                                    title={`Group ${b.number}, rank ${b.rank}`}
                                    style={{
                                      fontSize: '11px', fontWeight: 800, lineHeight: 1,
                                      background: '#b91c1c', color: '#fff',
                                      borderRadius: '5px', padding: '2px 5px', textShadow: 'none',
                                      whiteSpace: 'nowrap', boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
                                    }}
                                  >
                                    {b.rank}
                                  </span>
                                ))}
                              </div>
                            )}
                            {typeGroup.type}
                          </div>

                          {/* Placeholder rows for proper spacing */}
                          {typeGroup.rows.map((_, index) => (
                            <div key={index} className="row-item" style={{ background: 'transparent' }} />
                          ))}
                        </div>
                      );
                    })}

                    {/* TOTAL Row - Fixed Left Part (TYPE column - empty) */}
                    <div className="row-item total-row">
                      <div className="type-cell spanning" style={{
                        height: `${TOTAL_ROW_HEIGHT}px`,
                        backgroundColor: '#404040',
                        color: '#ffffff',
                        fontWeight: '700',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        borderRight: '1px solid #555'
                      }}>
                        {/* Empty - TOTAL label will be in FTD column */}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Scroll Right Section */}
            <div className="scroll-right">
              {/* Accounting Section Header Bar + Group Headers */}
              {enableAccountingColumns && false && (
                <>
                  <div style={{ display: 'flex', width: '100%' }}>
                    {/* Empty space for regular columns */}
                    <div style={{ 
                      flex: '1', 
                      minWidth: '1500px',
                      height: '40px'
                    }}></div>
                    
                    {/* Gold Accounting Section Header */}
                    <div className="accounting-section-header-row" style={{
                      width: '1116px',
                      flexShrink: 0
                    }}>
                      ACCOUNTING {sectionLabel.replace('TLines ', '').toUpperCase()}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', width: '100%' }}>
                    {/* Empty space for regular columns */}
                    <div style={{ 
                      flex: '1', 
                      minWidth: '1500px',
                      height: '28px'
                    }}></div>
                    
                    {/* Group headers for accounting columns */}
                    <div className="accounting-group-headers" style={{
                      width: '1116px',
                      flexShrink: 0
                    }}>
                      <div className="col-accounting-spacer"></div>
                      <div className="accounting-group-header accounting-group-header-paid-usd">
                        PAID USD
                        <div style={{ fontSize: '9px', marginLeft: '4px' }}>(1st / 2nd)</div>
                      </div>
                      <div className="col-accounting-gap-paid"></div>
                      <div className="accounting-group-header accounting-group-header-paid-tl">
                        PAID TL
                        <div style={{ fontSize: '9px', marginLeft: '4px' }}>(1st / 2nd)</div>
                      </div>
                      <div className="col-accounting-gap-group"></div>
                      <div className="accounting-group-header accounting-group-header-remaining">REMAINING</div>
                      <div className="col-accounting-gap-group"></div>
                      <div className="accounting-group-header accounting-group-header-not-ordered">NOT ORDERED</div>
                    </div>
                  </div>
                </>
              )}

              {/* Right Header */}
              <div className="header-right">
                <div className="column-header-cell col-pf-code" style={getHeaderCellStyle('pfCode' as ColumnKey)}>PF CODE</div>
                <div className="column-header-cell col-vendor" style={getHeaderCellStyle('vendor' as ColumnKey)}>VENDOR</div>
                {isTrustStockMode && (
                  <div className="column-header-cell col-order-no" style={{ ...getHeaderCellStyle('vendor' as ColumnKey), width: ORDER_NO_WIDTH }}>ORDER NO</div>
                )}
                <div className="column-header-cell col-order-type" style={getHeaderCellStyle('orderType' as ColumnKey)}>ORDER TYPE</div>
                {!isSupplierMode && (
                  <div className="column-header-cell col-po-sign-status" style={getHeaderCellStyle('poSignStatus' as ColumnKey)}>PO SIGN STATUS</div>
                )}
                <div className="column-header-cell col-pf-sign-status" style={getHeaderCellStyle('pfSignStatus' as ColumnKey)}>PF SIGN STATUS</div>
                <div className="column-header-cell col-status" style={getHeaderCellStyle('status' as ColumnKey)}>STATUS</div>
                <div className="column-header-cell col-std" style={getHeaderCellStyle('std' as ColumnKey)}>STD</div>
                <div className="column-header-cell col-etd" style={getHeaderCellStyle('etd' as ColumnKey)}>ETD</div>
                <div className="column-header-cell col-rtr" style={getHeaderCellStyle('rtr' as ColumnKey)}>RTR</div>
                <div className="column-header-cell col-rtd" style={getHeaderCellStyle('rtd' as ColumnKey)}>RTD</div>
                <div className="column-header-cell col-rdy" style={getHeaderCellStyle('rdy' as ColumnKey)}>RDY</div>
                <div className="column-header-cell col-ftd" style={getHeaderCellStyle('ftd' as ColumnKey)}>FTD</div>
                <div className="column-header-cell col-snd" style={getHeaderCellStyle('snd' as ColumnKey)}>SND</div>
                <div className="column-header-cell col-pf-usd" style={getHeaderCellStyle('pfUsd' as ColumnKey)}>PF / USD</div>
                <div className="column-header-cell col-pf-tl" style={getHeaderCellStyle('pfTl' as ColumnKey)}>PF / TL</div>
                <div className="column-header-cell col-invoice" style={getHeaderCellStyle('invoice' as ColumnKey)}>INV / USD</div>
                <div className="column-header-cell col-invoice-tl" style={getHeaderCellStyle('invoiceTl' as ColumnKey)}>INV / TL</div>
                <div className="column-header-cell col-expenses-usd" style={getHeaderCellStyle('expensesUsd' as ColumnKey)}>EXPENSES / USD</div>
                <div className="column-header-cell col-expenses-tl" style={getHeaderCellStyle('expensesTl' as ColumnKey)}>EXPENSES / TL</div>
                <div className="column-header-cell col-payment-rule" style={getHeaderCellStyle('paymentRule' as ColumnKey)}>PAYMENT RULE</div>
                <div className="column-header-cell col-container-no" style={getHeaderCellStyle('containerNo' as ColumnKey)}>CONTAINER NO</div>
                <div className="column-header-cell col-container-date" style={getHeaderCellStyle('containerDate' as ColumnKey)}>CONTAINER DATE</div>

                {/* Accounting Column Headers (Supplier Mode Only) - Black background with white text */}
                {enableAccountingColumns && (
                  <>
                    <div className="col-accounting-spacer"></div>
                    <div className="column-header-cell col-accounting-paid-usd-1 accounting-column-header">1st</div>
                    <div className="column-header-cell col-accounting-paid-usd-2 accounting-column-header">2nd</div>
                    <div className="col-accounting-gap-paid"></div>
                    <div className="column-header-cell col-accounting-paid-tl-1 accounting-column-header">1st</div>
                    <div className="column-header-cell col-accounting-paid-tl-2 accounting-column-header">2nd</div>
                    <div className="col-accounting-gap-group"></div>
                    <div className="column-header-cell col-accounting-remaining-usd accounting-column-header">USD</div>
                    <div className="column-header-cell col-accounting-remaining-tl accounting-column-header">TL</div>
                    <div className="col-accounting-gap-group"></div>
                    <div className="column-header-cell col-accounting-not-ordered-usd accounting-column-header">USD</div>
                    <div className="column-header-cell col-accounting-not-ordered-tl accounting-column-header">TL</div>
                  </>
                )}
              </div>

              {/* Right Body Rows */}
              <div className="rows-right">
                <div className="row-container">
                  {(() => {
                    globalRowIndex = 0; // Reset for scrollable section
                    return typeGroups.map((typeGroup) => {
                      const startRowIndex = globalRowIndex;
                      const typeRowCount = typeGroup.rows.length;
                      // const typeGroupHeight = typeRowCount * ROW_HEIGHT; // Unused variable removed
                      globalRowIndex += typeRowCount;

                      // Compute PO sign status for this type group
                      const typePoSignStatusForBg = (() => {
                        const typeItemIds = typeGroup.rows.map(r => r.itemId).filter((id): id is string => id != null);
                        const typeItems = typeItemIds.map(id => itemsById.get(id)).filter((item): item is NonNullable<typeof item> => item != null);
                        if (typeItems.length === 0) return '';
                        if (typeItems.every(item => item.poSignStatus === null || item.poSignStatus === undefined)) return '';
                        if (typeItems.every(item => item.poSignStatus === 'SIGNED')) return 'SIGNED';
                        if (typeItems.some(item => item.poSignStatus === 'WAITING_TLINES_TO_SIGN')) return 'WAITING TLINES TO SIGN';
                        if (typeItems.some(item => item.poSignStatus === 'WAITING_T_TO_SIGN')) return 'WAITING T TO SIGN';
                        if (typeItems.some(item => item.poSignStatus === 'READY_TO_SIGN')) return 'READY TO SIGN';
                        return 'NOT SIGNED';
                      })();

                      const isTypeGroupRestricted = typeGroup.rows.length > 0 && typeGroup.rows[0].isRestricted;

                      return (
                        <div key={`${typeGroup.type}-scrollable`} className="type-group-container" style={{ position: 'relative' }}>
                          {/* PO SIGN STATUS - Type level spanning cell */}
                          {!isSupplierMode && isColumnVisible('poSignStatus') && (
                            <div
                              className={`type-cell spanning ${isTypeGroupRestricted ? '' : 'clickable'}`}
                              style={{
                                height: `${typeRowCount * ROW_HEIGHT}px`,
                                position: 'absolute',
                                width: '140px', // PO SIGN STATUS column width
                                zIndex: 100,
                                top: 0,
                                left: `${(['pfCode', 'vendor', 'orderType'] as const).reduce((sum, key) => sum + (isColumnVisible(key) ? COLUMN_WIDTHS[key] : 0), 0)}px`,
                                backgroundColor: getSignStatusStyle(typePoSignStatusForBg).backgroundColor,
                                border: '1px solid #e5e7eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingLeft: '8px',
                                cursor: isTypeGroupRestricted ? 'default' : 'pointer',
                                pointerEvents: isTypeGroupRestricted ? 'none' : 'auto',
                                ...(isTypeGroupRestricted ? { filter: 'blur(4px)', opacity: 0.45 } : {})
                              }}
                              onClick={(e) => {
                                if (isTypeGroupRestricted) return;
                                e.preventDefault();
                                e.stopPropagation();

                                const firstRowId = typeGroup.rows[0]?.itemId || '';


                                if (firstRowId) {
                                  setEditingCell({
                                    projectId: project.projectId,
                                    itemId: firstRowId,
                                    field: 'poSignStatus'
                                  });
                                }
                              }}
                            >
                              {(() => {
                                // 🚀 CRITICAL FIX: Calculate PO status from actual updated items, not stale project metadata
                                const typeItemIds = typeGroup.rows
                                  .map(row => row.itemId)
                                  .filter((id): id is string => id != null);
                                const typeItems = typeItemIds
                                  .map(id => itemsById.get(id))
                                  .filter((item): item is NonNullable<typeof item> => item != null);

                                // Calculate the actual PO status based on current item states
                                let typePoSignStatus = '';
                                if (typeItems.length > 0) {
                                  const allNull = typeItems.every(item => item.poSignStatus === null || item.poSignStatus === undefined);
                                  const allSigned = typeItems.every(item => item.poSignStatus === 'SIGNED');
                                  const allReady = typeItems.every(item => item.poSignStatus === 'READY_TO_SIGN');
                                  const hasAnyReady = typeItems.some(item => item.poSignStatus === 'READY_TO_SIGN');

                                  if (allNull) {
                                    typePoSignStatus = '';
                                  } else if (allSigned) {
                                    typePoSignStatus = 'SIGNED';
                                  } else if (typeItems.some(item => item.poSignStatus === 'WAITING_TLINES_TO_SIGN')) {
                                    typePoSignStatus = 'WAITING TLINES TO SIGN';
                                  } else if (typeItems.some(item => item.poSignStatus === 'WAITING_T_TO_SIGN')) {
                                    typePoSignStatus = 'WAITING T TO SIGN';
                                  } else if (allReady || hasAnyReady) {
                                    typePoSignStatus = 'READY TO SIGN';
                                  } else {
                                    typePoSignStatus = 'NOT SIGNED';
                                  }
                                }
                                const firstRowId = typeGroup.rows[0]?.itemId || '';

                                // DEBUG: Force show editor when editing
                                const isEditing = editingCell?.field === 'poSignStatus' && editingCell?.itemId === firstRowId;

                                if (isEditing) {
                                }

                                return isEditing ? (
                                  <div style={{ position: 'relative', width: '100%' }}>
                                    <PoSignStatusEditor
                                      value={typePoSignStatus}
                                      triggerRef={poSignStatusEditorRef}
                                      onSave={(poSignStatus) => handlePoSignStatusSaveByType(firstRowId, poSignStatus)}
                                      onCancel={() => setEditingCell(null)}
                                    />
                                  </div>
                                ) : (
                                  <span
                                    style={{
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      color: 'black'
                                    }}
                                  >
                                    {typePoSignStatus}
                                  </span>
                                );
                              })()}
                            </div>
                          )}

                          {/* Individual rows */}
                          {typeGroup.rows.map((row, __rowIndex) => {
                            const actualRowIndex = startRowIndex + __rowIndex;
                            // const isFirstRowInType = __rowIndex === 0; // Unused variable

                            const scrollableFields = [
                              { field: 'pfCode', value: row.pfCode, className: 'col-pf-code', editable: (isTrustStockMode || !!row.customTypeId) && isColumnEditable('pfCode') },
                              { field: 'vendor', value: row.vendor, className: 'col-vendor', editable: isColumnEditable('vendor') },
                              ...(isTrustStockMode ? [{ field: 'orderNo', value: (row as any).orderNo, className: 'col-order-no', editable: isColumnEditable('vendor') }] : []),
                              { field: 'orderType', value: row.orderType, className: 'col-order-type', editable: isColumnEditable('orderType') },
                              // PO SIGN STATUS - show only on first row of type group
                              ...(isSupplierMode ? [] : [{
                                field: 'poSignStatus',
                                value: __rowIndex === 0 ? (project.poSignStatusByType[typeGroup.type] || '') : '',
                                className: 'col-po-sign-status',
                                editable: __rowIndex === 0 && isColumnEditable('poSignStatus'),
                                isFirstInTypeGroup: __rowIndex === 0,
                                typeRowCount: typeGroup.rows.length
                              }]),
                              { field: 'pfSignStatus', value: row.pfSignStatus, className: 'col-pf-sign-status', editable: isColumnEditable('pfSignStatus') },
                              { field: 'status', value: row.status, className: 'col-status', editable: isColumnEditable('status') },
                              { field: 'std', value: formatDateCell(row.std), className: 'col-std', editable: isColumnEditable('std') },
                              { field: 'etd', value: formatDateCell(row.etd), className: 'col-etd', editable: isColumnEditable('etd') },
                              { field: 'rtr', value: formatDateCell(row.rtr), className: 'col-rtr', editable: isColumnEditable('rtr') },
                              { field: 'rtd', value: formatDateCell(row.rtd), className: 'col-rtd', editable: isColumnEditable('rtd') },
                              { field: 'rdy', value: formatDateCell(row.rdy), className: 'col-rdy', editable: false },
                              { field: 'ftd', value: formatDateCell(row.ftd), className: 'col-ftd', editable: isColumnEditable('ftd') },
                              { field: 'snd', value: formatDateCell(row.snd), className: 'col-snd', editable: false },
                              { field: 'pfUsd', value: row.pfUsd, className: 'col-pf-usd', editable: isColumnEditable('pfUsd') },
                              { field: 'pfTl', value: row.pfTl, className: 'col-pf-tl', editable: isColumnEditable('pfTl') },
                              { field: 'invoice', value: row.invoice || '', className: 'col-invoice', editable: isColumnEditable('invoice') },
                              { field: 'invoiceTl', value: (row as any).invoiceTl || '', className: 'col-invoice-tl', editable: isColumnEditable('invoiceTl') },
                              { field: 'expensesUsd', value: row.expensesUsd || '', className: 'col-expenses-usd', editable: isColumnEditable('expensesUsd') },
                              { field: 'expensesTl', value: row.expensesTl || '', className: 'col-expenses-tl', editable: isColumnEditable('expensesTl') },
                              { field: 'paymentRule', value: row.paymentRule, className: 'col-payment-rule', editable: isColumnEditable('paymentRule') },
                              { field: 'containerNo', value: row.containerNo, className: 'col-container-no', editable: isColumnEditable('containerNo') },
                              { field: 'containerDate', value: row.containerDate, className: 'col-container-date', editable: isColumnEditable('containerDate') }
                            ];

                            // Override editable to false for restricted rows
                            if (row.isRestricted) {
                              scrollableFields.forEach(f => { f.editable = false; });
                            }

                            return (
                              <div
                                key={row.itemId || `${typeGroup.type}-${__rowIndex}`}
                                className={`row-item ${highlightedItemId === row.itemId ? 'dashboard-item-highlighted' : ''} ${row.isRestricted ? 'restricted-row' : ''}`}
                                data-item-id={row.itemId}
                                onContextMenu={(e) => !row.isRestricted && row.itemId && handleRowContextMenu(e, row.itemId, row.type || typeGroup.type)}
                                style={row.isRestricted ? { filter: 'blur(4px)', opacity: 0.45, pointerEvents: 'none', userSelect: 'none' } : undefined}
                              >
                                {scrollableFields.filter(cellData => isColumnVisible(cellData.field as ColumnKey)).map((cellData, cellIndex) => {
                                  // Regular cells
                                  const cellKey = `${actualRowIndex}-${cellData.field}`;
                                  const cellRef = getCellRef(cellKey);

                                  // Special handling for PO SIGN STATUS - spanning cell for first row
                                  if (cellData.field === 'poSignStatus') {
                                    if (cellData.isFirstInTypeGroup) {
                                      const isEditingPoStatus = editingCell?.field === 'poSignStatus' && editingCell?.itemId === (row.itemId || '');

                                      return (
                                        <div
                                          key={cellIndex}
                                          ref={cellRef}
                                          className={`row-cell ${cellData.className}`}
                                          style={{
                                            height: `${cellData.typeRowCount * ROW_HEIGHT}px`,
                                            backgroundColor: getSignStatusStyle(cellData.value).backgroundColor,
                                            border: '1px solid #e5e7eb',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'flex-start',
                                            paddingLeft: '8px',
                                            cursor: 'pointer',
                                            position: 'relative'
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (row.itemId && isColumnEditable('poSignStatus')) {
                                              setEditingCell({
                                                projectId: project.projectId,
                                                itemId: row.itemId,
                                                field: 'poSignStatus'
                                              });
                                            }
                                          }}
                                        >
                                          {isEditingPoStatus ? (
                                            <PoSignStatusEditor
                                              value={cellData.value}
                                              triggerRef={cellRef}
                                              onSave={(poSignStatus) => {
                                                return handlePoSignStatusSaveByType(row.itemId || '', poSignStatus);
                                              }}
                                              onCancel={handleCellCancel}
                                            />
                                          ) : (
                                            <span
                                              style={{
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                color: 'black'
                                              }}
                                            >
                                              {cellData.value}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    } else {
                                      // Empty cell for other rows in type group
                                      return (
                                        <div
                                          key={cellIndex}
                                          className={`row-cell ${cellData.className}`}
                                          style={{ visibility: 'hidden' }}
                                        />
                                      );
                                    }
                                  }

                                  const cellContent = isEditing(row.itemId || '', cellData.field) && cellData.editable ? (
                                    renderEditor(cellData.field, cellData.value, cellRef, actualRowIndex)
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                      {/* Currency icons for PF USD/TL fields */}
                                      {(cellData.field === 'pfUsd' || cellData.field === 'expensesUsd') && (
                                        <span style={{
                                          color: '#6b7280',
                                          fontSize: '14px',
                                          marginRight: '4px',
                                          fontWeight: '500'
                                        }}>
                                          $
                                        </span>
                                      )}
                                      {(cellData.field === 'pfTl' || cellData.field === 'expensesTl') && (
                                        <span style={{
                                          color: '#6b7280',
                                          fontSize: '14px',
                                          marginRight: '4px',
                                          fontWeight: '500'
                                        }}>
                                          ₺
                                        </span>
                                      )}
                                      {cellData.field === 'invoice' && (
                                        <span style={{
                                          color: '#6b7280',
                                          fontSize: '14px',
                                          marginRight: '4px',
                                          fontWeight: '500'
                                        }}>
                                          $
                                        </span>
                                      )}
                                      {cellData.field === 'invoiceTl' && (
                                        <span style={{
                                          color: '#6b7280',
                                          fontSize: '14px',
                                          marginRight: '4px',
                                          fontWeight: '500'
                                        }}>
                                          ₺
                                        </span>
                                      )}

                                      {/* ETD clear button */}
                                      {cellData.field === 'etd' && cellData.value && row.itemId && isColumnEditable('etd') && (
                                        <span
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDateSave(row.itemId!, 'etd', '', actualRowIndex);
                                          }}
                                          title="ETD tarihini sil"
                                          style={{
                                            cursor: 'pointer',
                                            color: '#ef4444',
                                            fontWeight: '700',
                                            fontSize: '13px',
                                            lineHeight: 1,
                                            marginRight: '4px',
                                            flexShrink: 0,
                                            userSelect: 'none',
                                          }}
                                        >×</span>
                                      )}

                                      {/* Cell value with right alignment for currency fields */}
                                      <span
                                        className={cellData.field === 'status' || cellData.field === 'pfSignStatus' ? '' : getStatusClass(cellData.value)}
                                        style={{
                                          flex: 1,
                                          ...(cellData.field === 'status'
                                            ? {
                                                // STATUS - text only, background on cell
                                                color: getStatusStyle(cellData.value).color,
                                                fontSize: '12px',
                                                fontWeight: '600',
                                              }
                                            : cellData.field === 'pfSignStatus'
                                            ? {
                                                // PF SIGN STATUS - text only, background on cell
                                                color: 'black',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                              }
                                            : cellData.field === 'pfUsd' || cellData.field === 'pfTl' || cellData.field === 'expensesUsd' || cellData.field === 'expensesTl' || cellData.field === 'invoice' || cellData.field === 'invoiceTl'
                                            ? {
                                                fontFamily: 'monospace',
                                                fontWeight: '500'
                                              }
                                            : cellData.field === 'containerNo' && (!cellData.value || cellData.value.trim() === '')
                                            ? {
                                                color: '#9ca3af', // Muted color for placeholder
                                                fontStyle: 'italic'
                                              }
                                            : {})
                                        }}
                                      >
                                        {(cellData.field === 'pfUsd' || cellData.field === 'pfTl' || cellData.field === 'expensesUsd' || cellData.field === 'expensesTl' || cellData.field === 'invoice' || cellData.field === 'invoiceTl')
                                          ? formatCurrency(parseFloat(cellData.value || '0') || 0)
                                          : cellData.field === 'containerNo'
                                          ? getContainerDisplayText(cellData.value)
                                          : cellData.value}
                                      </span>
                                    </div>
                                  );

                                  // Handle cell clicks for inline editing
                                  const handleClick = cellData.editable
                                    ? (e: React.MouseEvent) => {
                                        const itemId = row.itemId;
                                        if (itemId) {
                                          handleCellClick(e, itemId, cellData.field);
                                        }
                                      }
                                    : (_e: React.MouseEvent) => {
                                        // Non-editable cell click handler
                                      };

                                  const isCellHighlighted = highlightedItemId === row.itemId && highlightField === cellData.field;
                                  const isStatusCell = cellData.field === 'status';
                                  const hasStatusNote = isStatusCell && !!row.statusNote;

                                  const isPriceNoteCell = (cellData.field === 'pfUsd' || cellData.field === 'pfTl' || cellData.field === 'invoice' || cellData.field === 'invoiceTl' || cellData.field === 'expensesUsd' || cellData.field === 'expensesTl') && !!row.itemId;
                                  const backendItemForNote = isPriceNoteCell && row.itemId ? itemsById.get(row.itemId) : null;
                                  const hasPriceNote = isPriceNoteCell && !!((backendItemForNote?.priceNotes as Record<string, string> | null)?.[cellData.field]);

                                  const isContainerCell = cellData.field === 'containerNo';
                                  const isPfCell = cellData.field === 'pfSignStatus';
                                  const isStatusDragCell = cellData.field === 'status';
                                  const isDragCell = isContainerCell || isPfCell || isStatusDragCell;
                                  const isDragSelected = isDragCell && row.itemId != null && dragSelectedRowIds.has(row.itemId) && dragField === cellData.field;

                                  return (
                                    <div
                                      key={cellIndex}
                                      ref={cellRef}
                                      className={`row-cell ${cellData.className} ${cellData.editable ? 'clickable' : ''} ${isCellHighlighted ? 'dashboard-cell-highlighted' : ''}`}
                                      onClick={!isDragging ? handleClick : undefined}
                                      onMouseDown={isDragCell && row.itemId && cellData.editable
                                        ? (e) => handleDragCellMouseDown(e, row.itemId!, cellData.field as DragField)
                                        : undefined}
                                      onMouseEnter={isDragCell && row.itemId
                                        ? () => handleDragCellMouseEnter(row.itemId!)
                                        : undefined}
                                      onContextMenu={row.itemId && (isStatusCell || isPriceNoteCell) ? (e: React.MouseEvent) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (isStatusCell) {
                                          setNoteMenu({ x: e.clientX, y: e.clientY, itemId: row.itemId!, hasNote: hasStatusNote });
                                        } else if (isPriceNoteCell) {
                                          setPriceNoteMenu({ x: e.clientX, y: e.clientY, itemId: row.itemId!, field: cellData.field, hasNote: hasPriceNote });
                                        }
                                      } : undefined}
                                      style={{
                                        position: 'relative',
                                        cursor: isDragCell && cellData.editable ? (isDragging ? 'crosshair' : 'pointer') : cellData.editable ? 'pointer' : 'default',
                                        pointerEvents: cellData.editable ? 'auto' : 'auto',
                                        backgroundColor: isDragSelected
                                          ? '#bfdbfe'
                                          : isCellHighlighted
                                          ? undefined
                                          : isStatusCell
                                            ? getStatusStyle(cellData.value).backgroundColor
                                            : cellData.field === 'pfSignStatus'
                                              ? getSignStatusStyle(cellData.value).backgroundColor
                                              : (cellData.field === 'pfUsd' || cellData.field === 'pfTl' || cellData.field === 'expensesUsd' || cellData.field === 'expensesTl' || cellData.field === 'invoice' || cellData.field === 'invoiceTl')
                                                ? 'rgba(147, 197, 253, 0.1)'
                                                : undefined,
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '4px 8px',
                                        minHeight: '28px',
                                        userSelect: isDragCell ? 'none' : undefined,
                                      }}
                                    >
                                      {cellContent}
                                      {hasStatusNote && (
                                        <span style={{
                                          position: 'absolute',
                                          top: '3px',
                                          right: '3px',
                                          width: '8px',
                                          height: '8px',
                                          borderRadius: '50%',
                                          backgroundColor: '#22c55e',
                                          border: '1px solid rgba(255,255,255,0.8)',
                                          flexShrink: 0,
                                        }} title="Not mevcut" />
                                      )}
                                      {hasPriceNote && (
                                        <span style={{
                                          position: 'absolute',
                                          top: '3px',
                                          right: '3px',
                                          width: '8px',
                                          height: '8px',
                                          borderRadius: '50%',
                                          backgroundColor: '#22c55e',
                                          border: '1px solid rgba(255,255,255,0.8)',
                                          flexShrink: 0,
                                        }} title="Fiyat notu mevcut" />
                                      )}
                                    </div>
                                  );
                                })}
                                
                                {/* Accounting Columns (Supplier Mode / Expenses-P Mode) */}
                                {enableAccountingColumns && (() => {
                                  const itemId = row.itemId || '';
                                  const pfUsd = isExpensesPMode ? (parseFloat(row.expensesUsd || '') || 0) : (parseFloat(row.pfUsd) || 0);
                                  const pfTl = isExpensesPMode ? (parseFloat(row.expensesTl || '') || 0) : (parseFloat(row.pfTl) || 0);
                                  const invoiceAmount = parseFloat((row as any).invoice || '') || 0;
                                  const paidAmounts = getPaidAmounts(itemId);

                                  // In expenses-p mode, treat all as SIGNED (no PF signing concept)
                                  const effectivePfSignStatus = isExpensesPMode ? 'SIGNED' : row.pfSignStatus;

                                  // Calculate accounting data for this row
                                  const accountingData = calculateRowAccounting(
                                    itemId,
                                    pfUsd,
                                    pfTl,
                                    row.status,
                                    effectivePfSignStatus,
                                    paidAmounts.paidUsd1,
                                    paidAmounts.paidUsd2,
                                    paidAmounts.paidTl1,
                                    paidAmounts.paidTl2,
                                    invoiceAmount,
                                  );
                                  
                                  return (
                                    <>
                                      {/* Main spacer column */}
                                      <div className="row-cell col-accounting-spacer"></div>
                                      
                                      {/* Paid USD columns */}
                                      <div className="row-cell col-accounting-paid-usd-1">
                                        <EditableAccountingCell
                                          value={accountingData.paidUsd1}
                                          currency="$"
                                          onSave={(val) => updatePaidAmount(itemId, 'paidUsd1', val)}
                                          editable={true}
                                        />
                                      </div>
                                      <div className="row-cell col-accounting-paid-usd-2">
                                        <EditableAccountingCell
                                          value={accountingData.paidUsd2}
                                          currency="$"
                                          onSave={(val) => updatePaidAmount(itemId, 'paidUsd2', val)}
                                          editable={true}
                                        />
                                      </div>
                                      
                                      {/* Gap between USD and TL paid columns */}
                                      <div className="row-cell col-accounting-gap-paid"></div>
                                      
                                      {/* Paid TL columns */}
                                      <div className="row-cell col-accounting-paid-tl-1">
                                        <EditableAccountingCell
                                          value={accountingData.paidTl1}
                                          currency="₺"
                                          onSave={(val) => updatePaidAmount(itemId, 'paidTl1', val)}
                                          editable={true}
                                        />
                                      </div>
                                      <div className="row-cell col-accounting-paid-tl-2">
                                        <EditableAccountingCell
                                          value={accountingData.paidTl2}
                                          currency="₺"
                                          onSave={(val) => updatePaidAmount(itemId, 'paidTl2', val)}
                                          editable={true}
                                        />
                                      </div>
                                      
                                      {/* Gap before Remaining group */}
                                      <div className="row-cell col-accounting-gap-group"></div>
                                      
                                      {/* Remaining columns */}
                                      <div className="row-cell col-accounting-remaining-usd">
                                        <ReadOnlyAccountingCell
                                          value={accountingData.remainingUsd}
                                          currency="$"
                                          showNotSigned={accountingData.showNotSignedRemaining}
                                        />
                                      </div>
                                      <div className="row-cell col-accounting-remaining-tl">
                                        <ReadOnlyAccountingCell
                                          value={accountingData.remainingTl}
                                          currency="₺"
                                          showNotSigned={accountingData.showNotSignedRemaining}
                                        />
                                      </div>
                                      
                                      {/* Gap before Not Ordered group */}
                                      <div className="row-cell col-accounting-gap-group"></div>
                                      
                                      {/* Not Ordered columns */}
                                      <div className="row-cell col-accounting-not-ordered-usd">
                                        <ReadOnlyAccountingCell
                                          value={accountingData.notOrderedUsd}
                                          currency="$"
                                        />
                                      </div>
                                      <div className="row-cell col-accounting-not-ordered-tl">
                                        <ReadOnlyAccountingCell
                                          value={accountingData.notOrderedTl}
                                          currency="₺"
                                        />
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            );
                          })}
                        </div>
                      );
                    });
                  })()}

                  {/* TOTAL Row - Scrollable Right Part - DYNAMIC COLUMN FILTERING */}
                  <div className="row-item total-row">
                    {(() => {
                      // Define all scrollable columns in order
                      const allScrollableColumns = [
                        { field: 'pfCode', className: 'col-pf-code' },
                        { field: 'vendor', className: 'col-vendor' },
                        { field: 'orderType', className: 'col-order-type' },
                        ...(isSupplierMode ? [] : [{ field: 'poSignStatus', className: 'col-po-sign-status' }]),
                        { field: 'pfSignStatus', className: 'col-pf-sign-status' },
                        { field: 'status', className: 'col-status' },
                        { field: 'std', className: 'col-std' },
                        { field: 'etd', className: 'col-etd' },
                        { field: 'rtr', className: 'col-rtr' },
                        { field: 'rtd', className: 'col-rtd' },
                        { field: 'rdy', className: 'col-rdy' },
                        { field: 'ftd', className: 'col-ftd' },
                        { field: 'snd', className: 'col-snd' },
                        { field: 'pfUsd', className: 'col-pf-usd' },
                        { field: 'pfTl', className: 'col-pf-tl' },
                        { field: 'invoice', className: 'col-invoice' },
                        { field: 'invoiceTl', className: 'col-invoice-tl' },
                        { field: 'expensesUsd', className: 'col-expenses-usd' },
                        { field: 'expensesTl', className: 'col-expenses-tl' },
                        { field: 'paymentRule', className: 'col-payment-rule' },
                        { field: 'containerNo', className: 'col-container-no' },
                        { field: 'containerDate', className: 'col-container-date' }
                      ];

                      // Filter to only visible columns - TRUE COLUMN HIDING (no whitespace)
                      const visibleScrollableColumns = allScrollableColumns.filter(col =>
                        isColumnVisible(col.field as ColumnKey)
                      );

                      return visibleScrollableColumns.map((col) => {
                        // Special styling for money totals and SND label
                        if (col.field === 'snd') {
                          return (
                            <div key={col.field} className={`row-cell ${col.className}`} style={{
                              backgroundColor: '#1e40af',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '11px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              textAlign: 'right',
                              paddingRight: '12px',
                              borderRight: '1px solid #1e40af',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end'
                            }}>
                              TOTAL
                            </div>
                          );
                        } else if (col.field === 'pfUsd') {
                          return (
                            <div key={col.field} className={`row-cell ${col.className}`} style={{
                              textAlign: 'left',
                              backgroundColor: '#1e40af',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '11px',
                              paddingLeft: '12px',
                              borderRight: '1px solid #1e40af',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-start'
                            }}>
                              <span style={{ marginRight: '4px' }}>$</span>
                              {formatCurrency(projectTotals.pfUsd)}
                            </div>
                          );
                        } else if (col.field === 'pfTl') {
                          return (
                            <div key={col.field} className={`row-cell ${col.className}`} style={{
                              textAlign: 'left',
                              backgroundColor: '#1e40af',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '11px',
                              paddingLeft: '12px',
                              borderRight: '1px solid #1e40af',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-start'
                            }}>
                              <span style={{ marginRight: '4px' }}>₺</span>
                              {formatCurrency(projectTotals.pfTl)}
                            </div>
                          );
                        } else if (col.field === 'expensesUsd') {
                          return (
                            <div key={col.field} className={`row-cell ${col.className}`} style={{
                              textAlign: 'left',
                              backgroundColor: '#1e40af',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '11px',
                              paddingLeft: '12px',
                              borderRight: '1px solid #1e40af',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-start'
                            }}>
                              <span style={{ marginRight: '4px' }}>$</span>
                              {formatCurrency(projectTotals.expensesUsd)}
                            </div>
                          );
                        } else if (col.field === 'expensesTl') {
                          return (
                            <div key={col.field} className={`row-cell ${col.className}`} style={{
                              textAlign: 'left',
                              backgroundColor: '#1e40af',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '11px',
                              paddingLeft: '12px',
                              borderRight: '1px solid #1e40af',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-start'
                            }}>
                              <span style={{ marginRight: '4px' }}>₺</span>
                              {formatCurrency(projectTotals.expensesTl)}
                            </div>
                          );
                        } else if (col.field === 'invoice') {
                          return (
                            <div key={col.field} className={`row-cell ${col.className}`} style={{
                              textAlign: 'left',
                              backgroundColor: '#1e40af',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '11px',
                              paddingLeft: '12px',
                              borderRight: '1px solid #1e40af',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-start'
                            }}>
                              <span style={{ marginRight: '4px' }}>$</span>
                              {formatCurrency(projectTotals.invoice)}
                            </div>
                          );
                        } else if (col.field === 'invoiceTl') {
                          return (
                            <div key={col.field} className={`row-cell ${col.className}`} style={{
                              textAlign: 'left',
                              backgroundColor: '#1e40af',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '11px',
                              paddingLeft: '12px',
                              borderRight: '1px solid #1e40af',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-start'
                            }}>
                              <span style={{ marginRight: '4px' }}>₺</span>
                              {formatCurrency((projectTotals as any).invoiceTl || 0)}
                            </div>
                          );
                        } else {
                          // All other columns - grey background
                          return (
                            <div key={col.field} className={`row-cell ${col.className} total-grey`}></div>
                          );
                        }
                      });
                    })()}
                    
                    {/* Accounting Totals (Supplier Mode Only) */}
                    {enableAccountingColumns && (() => {
                      // Calculate accounting totals from all rows
                      let totalPaidUsd1 = 0;
                      let totalPaidUsd2 = 0;
                      let totalPaidTl1 = 0;
                      let totalPaidTl2 = 0;
                      let totalRemainingUsd = 0;
                      let totalRemainingTl = 0;
                      let totalNotOrderedUsd = 0;
                      let totalNotOrderedTl = 0;
                      
                      typeGroups.forEach(typeGroup => {
                        typeGroup.rows.forEach(row => {
                          const itemId = row.itemId || '';
                          const pfUsd = isExpensesPMode ? (parseFloat(row.expensesUsd || '') || 0) : (parseFloat(row.pfUsd) || 0);
                          const pfTl = isExpensesPMode ? (parseFloat(row.expensesTl || '') || 0) : (parseFloat(row.pfTl) || 0);
                          const invoiceAmount = parseFloat((row as any).invoice || '') || 0;
                          const paidAmounts = getPaidAmounts(itemId);
                          const effectivePfSignStatus = isExpensesPMode ? 'SIGNED' : row.pfSignStatus;

                          const accountingData = calculateRowAccounting(
                            itemId,
                            pfUsd,
                            pfTl,
                            row.status,
                            effectivePfSignStatus,
                            paidAmounts.paidUsd1,
                            paidAmounts.paidUsd2,
                            paidAmounts.paidTl1,
                            paidAmounts.paidTl2,
                            invoiceAmount,
                          );
                          
                          totalPaidUsd1 += accountingData.paidUsd1;
                          totalPaidUsd2 += accountingData.paidUsd2;
                          totalPaidTl1 += accountingData.paidTl1;
                          totalPaidTl2 += accountingData.paidTl2;
                          totalRemainingUsd += accountingData.remainingUsd;
                          totalRemainingTl += accountingData.remainingTl;
                          totalNotOrderedUsd += accountingData.notOrderedUsd;
                          totalNotOrderedTl += accountingData.notOrderedTl;
                        });
                      });
                      
                      const totalCellStyle = {
                        backgroundColor: '#D4AF37',
                        color: '#000',
                        fontWeight: '700' as const,
                        fontSize: '11px',
                        paddingRight: '12px',
                        borderRight: '1px solid #000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        textAlign: 'right' as const
                      };

                      return (
                        <>
                          <div className="row-cell col-accounting-spacer" style={{ backgroundColor: '#D4AF37' }}></div>
                          <div className="row-cell col-accounting-paid-usd-1" style={totalCellStyle}>
                            <span style={{ marginRight: '4px' }}>$</span>
                            {formatAccountingValue(totalPaidUsd1)}
                          </div>
                          <div className="row-cell col-accounting-paid-usd-2" style={totalCellStyle}>
                            <span style={{ marginRight: '4px' }}>$</span>
                            {formatAccountingValue(totalPaidUsd2)}
                          </div>
                          <div className="row-cell col-accounting-gap-paid" style={{ backgroundColor: '#D4AF37' }}></div>
                          <div className="row-cell col-accounting-paid-tl-1" style={totalCellStyle}>
                            <span style={{ marginRight: '4px' }}>₺</span>
                            {formatAccountingValue(totalPaidTl1)}
                          </div>
                          <div className="row-cell col-accounting-paid-tl-2" style={totalCellStyle}>
                            <span style={{ marginRight: '4px' }}>₺</span>
                            {formatAccountingValue(totalPaidTl2)}
                          </div>
                          <div className="row-cell col-accounting-gap-group" style={{ backgroundColor: '#D4AF37' }}></div>
                          <div className="row-cell col-accounting-remaining-usd" style={totalCellStyle}>
                            <span style={{ marginRight: '4px' }}>$</span>
                            {formatAccountingValue(totalRemainingUsd)}
                          </div>
                          <div className="row-cell col-accounting-remaining-tl" style={totalCellStyle}>
                            <span style={{ marginRight: '4px' }}>₺</span>
                            {formatAccountingValue(totalRemainingTl)}
                          </div>
                          <div className="row-cell col-accounting-gap-group" style={{ backgroundColor: '#D4AF37' }}></div>
                          <div className="row-cell col-accounting-not-ordered-usd" style={totalCellStyle}>
                            <span style={{ marginRight: '4px' }}>$</span>
                            {formatAccountingValue(totalNotOrderedUsd)}
                          </div>
                          <div className="row-cell col-accounting-not-ordered-tl" style={totalCellStyle}>
                            <span style={{ marginRight: '4px' }}>₺</span>
                            {formatAccountingValue(totalNotOrderedTl)}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>


    {/* Vendor Edit Panel */}
    {vendorEditState && (
        <InlineEditPanelErrorBoundary onError={handleVendorEditClose}>
          <InlineEditPanel
            isOpen={true}
            onClose={handleVendorEditClose}
            clickedCellRect={vendorEditState.clickedCellRect}
            mode={mode}
            projectId={projectData.projectId}
            projectItems={vendorEditState.projectItems}
            currentItemId={vendorEditState.currentItemId}
            itemsById={vendorEditState.itemsById}
            onItemUpdated={handleItemUpdated}
            onItemAdded={handleItemAdded}
            onNavigate={handleVendorEditNavigate}
          />
        </InlineEditPanelErrorBoundary>
    )}

    {/* Project Menu */}
    {isProjectMenuOpen && (
      <ProjectMenu
        isOpen={isProjectMenuOpen}
        onClose={handleProjectMenuClose}
        triggerRef={projectHeaderRef}
        projectId={project.projectId}
        projectName={project.projectName}
        projectAddress={project.address}
        projectTypes={allTypeNames}
        projectBucket={project.region}
        isUrgent={isUrgent}
        enableGrouping={enableGrouping}
        pfGroups={pfGroups}
        onOpenAddToGroup={() => setAddToGroupOpen(true)}
        stockMode={isTrustStockMode}
        onDeleteProject={handleDeleteProject}
        onToggleUrgent={handleToggleUrgent}
        onEditProject={handleEditProject}
      />
    )}

    {/* Add to Group — one-screen form (type + group + rank), replaces the old
        click-through-menu flow. Lives outside isProjectMenuOpen since opening it
        closes the right-click menu first. */}
    {addToGroupOpen && (
      <AddToGroupModal
        projectId={project.projectId}
        projectName={project.projectName}
        projectTypes={allTypeNames}
        pfGroups={pfGroups}
        onClose={() => setAddToGroupOpen(false)}
      />
    )}

    {/* Row Context Menu (Delete Row) */}
    {rowContextMenu && (
      <>
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99998 }}
          onClick={() => setRowContextMenu(null)}
          onContextMenu={(e) => { e.preventDefault(); setRowContextMenu(null); }}
        />
        <div style={{
          position: 'fixed',
          left: rowContextMenu.x,
          top: rowContextMenu.y,
          zIndex: 99999,
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          padding: '4px 0',
          minWidth: '180px',
          fontSize: '13px',
        }}>
          <div style={{ padding: '6px 12px', color: '#6b7280', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {rowContextMenu.type || 'Item'}
          </div>
          {mode === 'projects' && isStockVendorCode(itemsById.get(rowContextMenu.itemId)?.vendor?.code) && (
            <button
              onClick={() => {
                const it = itemsById.get(rowContextMenu.itemId);
                setStockUsageFor({ itemId: rowContextMenu.itemId, label: `Project ${project.projectNumber} · ${rowContextMenu.type} · ${it?.pfCode || 'no PF code'}` });
                setRowContextMenu(null);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', color: '#0f766e', fontSize: '13px', textAlign: 'left' }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#ecfdf5')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              Use from Trust Stock
            </button>
          )}
          <button
            onClick={handleDeleteRow}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: '#dc2626',
              fontSize: '13px',
              textAlign: 'left',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            Delete Row
          </button>
        </div>
      </>
    )}

    {stockUsageFor && (
      <StockUsageModal projectItemId={stockUsageFor.itemId} rowLabel={stockUsageFor.label} onClose={() => setStockUsageFor(null)} />
    )}

    {/* Status Note Context Menu */}
    {noteMenu && (
      <>
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99998 }}
          onClick={() => setNoteMenu(null)}
          onContextMenu={(e) => { e.preventDefault(); setNoteMenu(null); }}
        />
        <div style={{
          position: 'fixed',
          left: noteMenu.x,
          top: noteMenu.y,
          zIndex: 99999,
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          padding: '4px 0',
          minWidth: '160px',
          fontSize: '13px',
        }}>
          {noteMenu.hasNote ? (
            <>
              <button
                onClick={() => {
                  const item = itemsById.get(noteMenu.itemId);
                  setNoteDialog({ itemId: noteMenu.itemId, text: item?.statusNote || '', mode: 'view' });
                  setNoteMenu(null);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  width: '100%', padding: '8px 14px', border: 'none',
                  backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span style={{ fontSize: '15px' }}>&#128196;</span> Notu Goruntule
              </button>
              <button
                onClick={() => {
                  const item = itemsById.get(noteMenu.itemId);
                  setNoteDialog({ itemId: noteMenu.itemId, text: item?.statusNote || '', mode: 'edit' });
                  setNoteMenu(null);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  width: '100%', padding: '8px 14px', border: 'none',
                  backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span style={{ fontSize: '15px' }}>&#9998;</span> Notu Duzenle
              </button>
              <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '4px 0' }} />
              <button
                onClick={() => {
                  handleStatusNoteSave(noteMenu.itemId, '');
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  width: '100%', padding: '8px 14px', border: 'none',
                  backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left',
                  color: '#dc2626',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span style={{ fontSize: '15px' }}>&#128465;</span> Notu Sil
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setNoteDialog({ itemId: noteMenu.itemId, text: '', mode: 'edit' });
                setNoteMenu(null);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                width: '100%', padding: '8px 14px', border: 'none',
                backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span style={{ fontSize: '15px' }}>&#10133;</span> Not Ekle
            </button>
          )}
        </div>
      </>
    )}

    {/* Status Note Dialog */}
    {noteDialog && (
      <>
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 99998,
            backgroundColor: 'rgba(0,0,0,0.3)',
          }}
          onClick={() => setNoteDialog(null)}
        />
        <div style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 99999,
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          padding: '20px',
          width: '380px',
          maxWidth: '90vw',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '14px',
          }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>
              {noteDialog.mode === 'view' ? 'Status Notu' : noteDialog.text ? 'Notu Duzenle' : 'Not Ekle'}
            </h3>
            <button
              onClick={() => setNoteDialog(null)}
              style={{
                border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
                fontSize: '18px', color: '#9ca3af', lineHeight: 1, padding: '2px',
              }}
            >
              &#10005;
            </button>
          </div>

          {noteDialog.mode === 'view' ? (
            <>
              <div style={{
                padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px',
                fontSize: '14px', color: '#374151', lineHeight: '1.5',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                minHeight: '60px', border: '1px solid #e5e7eb',
              }}>
                {noteDialog.text || '(Bos)'}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setNoteDialog({ ...noteDialog, mode: 'edit' })}
                  style={{
                    padding: '7px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500,
                    border: '1px solid #d1d5db', backgroundColor: '#fff', color: '#374151', cursor: 'pointer',
                  }}
                >
                  Duzenle
                </button>
                <button
                  onClick={() => setNoteDialog(null)}
                  style={{
                    padding: '7px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500,
                    border: 'none', backgroundColor: '#3b82f6', color: '#fff', cursor: 'pointer',
                  }}
                >
                  Kapat
                </button>
              </div>
            </>
          ) : (
            <>
              <textarea
                autoFocus
                defaultValue={noteDialog.text}
                onChange={(e) => setNoteDialog({ ...noteDialog, text: e.target.value })}
                placeholder="Notunuzu yazin..."
                style={{
                  width: '100%', minHeight: '100px', padding: '10px', fontSize: '14px',
                  border: '1px solid #d1d5db', borderRadius: '8px', resize: 'vertical',
                  outline: 'none', fontFamily: 'inherit', lineHeight: '1.5',
                  boxSizing: 'border-box',
                }}
                onFocus={e => (e.target.style.borderColor = '#3b82f6')}
                onBlur={e => (e.target.style.borderColor = '#d1d5db')}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setNoteDialog(null)}
                  style={{
                    padding: '7px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500,
                    border: '1px solid #d1d5db', backgroundColor: '#fff', color: '#374151', cursor: 'pointer',
                  }}
                >
                  Iptal
                </button>
                <button
                  onClick={() => handleStatusNoteSave(noteDialog.itemId, noteDialog.text)}
                  style={{
                    padding: '7px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500,
                    border: 'none', backgroundColor: '#22c55e', color: '#fff', cursor: 'pointer',
                  }}
                >
                  Kaydet
                </button>
              </div>
            </>
          )}
        </div>
      </>
    )}

    {/* Price Note Context Menu */}
    {priceNoteMenu && (
      <>
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99998 }}
          onClick={() => setPriceNoteMenu(null)}
          onContextMenu={(e) => { e.preventDefault(); setPriceNoteMenu(null); }}
        />
        <div style={{
          position: 'fixed',
          left: priceNoteMenu.x,
          top: priceNoteMenu.y,
          zIndex: 99999,
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          padding: '4px 0',
          minWidth: '160px',
          fontSize: '13px',
        }}>
          {priceNoteMenu.hasNote ? (
            <>
              <button
                onClick={() => {
                  const item = itemsById.get(priceNoteMenu.itemId);
                  const notes = (item?.priceNotes as Record<string, string> | null) || {};
                  setPriceNoteDialog({ itemId: priceNoteMenu.itemId, field: priceNoteMenu.field, text: notes[priceNoteMenu.field] || '', mode: 'view' });
                  setPriceNoteMenu(null);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 14px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span style={{ fontSize: '15px' }}>&#128196;</span> Notu Goruntule
              </button>
              <button
                onClick={() => {
                  const item = itemsById.get(priceNoteMenu.itemId);
                  const notes = (item?.priceNotes as Record<string, string> | null) || {};
                  setPriceNoteDialog({ itemId: priceNoteMenu.itemId, field: priceNoteMenu.field, text: notes[priceNoteMenu.field] || '', mode: 'edit' });
                  setPriceNoteMenu(null);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 14px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span style={{ fontSize: '15px' }}>&#9998;</span> Notu Duzenle
              </button>
              <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '4px 0' }} />
              <button
                onClick={() => handlePriceNoteSave(priceNoteMenu.itemId, priceNoteMenu.field, '')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 14px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left', color: '#dc2626' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span style={{ fontSize: '15px' }}>&#128465;</span> Notu Sil
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setPriceNoteDialog({ itemId: priceNoteMenu.itemId, field: priceNoteMenu.field, text: '', mode: 'edit' });
                setPriceNoteMenu(null);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 14px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span style={{ fontSize: '15px' }}>&#10133;</span> Not Ekle
            </button>
          )}
        </div>
      </>
    )}

    {/* Price Note Dialog */}
    {priceNoteDialog && (() => {
      const fieldLabels: Record<string, string> = { pfUsd: 'PF / USD', pfTl: 'PF / TL', invoice: 'INV / USD', invoiceTl: 'INV / TL', expensesUsd: 'Expenses USD', expensesTl: 'Expenses TL' };
      const label = fieldLabels[priceNoteDialog.field] || priceNoteDialog.field;
      return (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99998, backgroundColor: 'rgba(0,0,0,0.3)' }} onClick={() => setPriceNoteDialog(null)} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 99999, backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', padding: '20px', width: '380px', maxWidth: '90vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>
                {priceNoteDialog.mode === 'view' ? `${label} Notu` : priceNoteDialog.text ? 'Notu Duzenle' : `${label} — Not Ekle`}
              </h3>
              <button onClick={() => setPriceNoteDialog(null)} style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '18px', color: '#9ca3af', lineHeight: 1, padding: '2px' }}>&#10005;</button>
            </div>
            {priceNoteDialog.mode === 'view' ? (
              <>
                <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', fontSize: '14px', color: '#374151', lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-word', minHeight: '60px', border: '1px solid #e5e7eb' }}>
                  {priceNoteDialog.text || '(Bos)'}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setPriceNoteDialog({ ...priceNoteDialog, mode: 'edit' })} style={{ padding: '7px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, border: '1px solid #d1d5db', backgroundColor: '#fff', color: '#374151', cursor: 'pointer' }}>Duzenle</button>
                  <button onClick={() => setPriceNoteDialog(null)} style={{ padding: '7px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, border: 'none', backgroundColor: '#3b82f6', color: '#fff', cursor: 'pointer' }}>Kapat</button>
                </div>
              </>
            ) : (
              <>
                <textarea
                  autoFocus
                  defaultValue={priceNoteDialog.text}
                  onChange={(e) => setPriceNoteDialog({ ...priceNoteDialog, text: e.target.value })}
                  placeholder="Notunuzu yazin..."
                  style={{ width: '100%', minHeight: '100px', padding: '10px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: '1.5', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = '#22c55e')}
                  onBlur={e => (e.target.style.borderColor = '#d1d5db')}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setPriceNoteDialog(null)} style={{ padding: '7px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, border: '1px solid #d1d5db', backgroundColor: '#fff', color: '#374151', cursor: 'pointer' }}>Iptal</button>
                  <button onClick={() => handlePriceNoteSave(priceNoteDialog.itemId, priceNoteDialog.field, priceNoteDialog.text)} style={{ padding: '7px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, border: 'none', backgroundColor: '#22c55e', color: '#fff', cursor: 'pointer' }}>Kaydet</button>
                </div>
              </>
            )}
          </div>
        </>
      );
    })()}
</>
  );
};

function areProjectBlockPropsEqual(prev: ProjectBlockProps, next: ProjectBlockProps): boolean {
  if (prev.project !== next.project) return false;
  if (prev.backendItems !== next.backendItems) return false;
  if (prev.mode !== next.mode) return false;
  if (prev.sectionLabel !== next.sectionLabel) return false;
  if (prev.highlightedItemId !== next.highlightedItemId) return false;
  if (prev.highlightField !== next.highlightField) return false;
  if (prev.showSectionHeader !== next.showSectionHeader) return false;
  if (prev.supplierVendorCodeFilter !== next.supplierVendorCodeFilter) return false;
  if (prev.enableAccountingColumns !== next.enableAccountingColumns) return false;
  if (prev.isSupplierMode !== next.isSupplierMode) return false;
  if (prev.permissionOverrides !== next.permissionOverrides) return false;
  if (prev.selectable !== next.selectable) return false;
  if (prev.isSelected !== next.isSelected) return false;
  if (prev.onToggleSelect !== next.onToggleSelect) return false;
  if (prev.enableGrouping !== next.enableGrouping) return false;
  if (prev.pfGroups !== next.pfGroups) return false;
  // Only re-render if one of THIS project's items changed in the global map
  if (prev.globalItemsById !== next.globalItemsById) {
    const ids = prev.backendItems?.map(i => i.id) ?? [];
    for (const id of ids) {
      if (prev.globalItemsById?.get(id) !== next.globalItemsById?.get(id)) return false;
    }
  }
  return true;
}

export default React.memo(ProjectBlock, areProjectBlockPropsEqual);
```

---

## FILE: components/ProjectHeader.tsx

```tsx
import React, { forwardRef } from 'react';
import { Project } from '../types';

interface ProjectHeaderProps {
  project: Project;
  onClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}

const ProjectHeader = forwardRef<HTMLDivElement, ProjectHeaderProps>(({ project, onClick, onContextMenu, style }, ref) => {
  return (
    <div
      ref={ref}
      className="project-header"
      onClick={onClick}
      onContextMenu={onContextMenu}
      style={{
        ...style,
        cursor: onClick || onContextMenu ? 'pointer' : 'default'
      }}
    >
      <h2 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>
        {project.projectName}
      </h2>
      <p style={{ margin: '0', fontSize: '12px', opacity: '0.8' }}>
        {project.address}
      </p>
    </div>
  );
});

export default ProjectHeader;
```

---

## FILE: components/ProjectMenu.tsx

```tsx
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { PfGroup } from '../lib/pf-groups';
import { apiFetch } from '../lib/auth';

interface ProjectMenuProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement>;
  projectId: string;
  projectName: string;
  projectAddress?: string;
  projectTypes?: string[];
  projectBucket?: string;
  isUrgent?: boolean;
  enableGrouping?: boolean; // Projects tab only
  pfGroups?: PfGroup[];
  onOpenAddToGroup?: () => void;
  /** Trust Stock: no price-list document, urgency, address or region */
  stockMode?: boolean;
  onDeleteProject: (projectId: string) => void;
  onToggleUrgent: (projectId: string, isUrgent: boolean) => void;
  onEditProject?: (projectId: string, field: 'name' | 'address' | 'types' | 'bucket', value: any) => void | Promise<void>;
}

const BUCKET_OPTIONS = [
  { value: 'TLINES_NE', label: 'TLines NE' },
  { value: 'TLINES_SE', label: 'TLines SE' },
  { value: 'TLINES_NW', label: 'TLines NW' },
  { value: 'CVW', label: 'TLines CVW' },
  { value: 'TLINES_HQ', label: 'TLines HQ' },
  { value: 'TLINES_TC', label: 'TLines TC' },
];

const TYPE_OPTIONS = ['Millwork', 'Shelving', 'Ceiling', 'Image', 'Furniture', 'Decoration'];

const ProjectMenu: React.FC<ProjectMenuProps> = ({
  isOpen,
  onClose,
  triggerRef,
  projectId,
  projectName,
  projectAddress = '',
  projectTypes = [],
  projectBucket = '',
  isUrgent = false,
  enableGrouping = false,
  pfGroups = [],
  onOpenAddToGroup,
  stockMode = false,
  onDeleteProject,
  onToggleUrgent,
  onEditProject
}) => {
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState<'name' | 'address' | 'types' | 'region' | 'group' | null>(null);
  const [editTypes, setEditTypes] = useState<string[]>(projectTypes);
  const [newCustomType, setNewCustomType] = useState('');
  const [customTypeError, setCustomTypeError] = useState<string | null>(null);
  const [addingCustomType, setAddingCustomType] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Reset state only when menu transitions from closed to open
  const [wasOpen, setWasOpen] = useState(false);
  useEffect(() => {
    if (isOpen && !wasOpen) {
      setEditMode(null);
      setEditTypes(projectTypes);
      setIsSaving(false);
    }
    setWasOpen(isOpen);
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleDeleteClick = () => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete the project?\n\n"${projectName}"\n\nThis action cannot be undone and all project data will be permanently deleted.`
    );

    if (isConfirmed) {
      onDeleteProject(projectId);
      onClose();
    }
  };

  const handleUrgentToggle = () => {
    onToggleUrgent(projectId, !isUrgent);
    onClose();
  };

  // Create a new global custom type (name + auto short code) and check it in the list.
  const addCustomType = async () => {
    const name = newCustomType.trim();
    if (!name) return;
    const code = name.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10);
    if (!code) { setCustomTypeError('Name needs at least one letter or digit'); return; }
    if (editTypes.some(t => t.toLowerCase() === name.toLowerCase()) || TYPE_OPTIONS.some(t => t.toLowerCase() === name.toLowerCase())) {
      setCustomTypeError('This type already exists'); return;
    }
    setAddingCustomType(true);
    setCustomTypeError(null);
    try {
      const res = await apiFetch('/api/custom-types', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, code, isGlobal: true }) });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to create custom type');
      }
      // Server returns the existing type when the name is already known — use its spelling
      const saved = await res.json().catch(() => null);
      const savedName: string = saved?.name || name;
      setEditTypes(prev => prev.some(t => t.toLowerCase() === savedName.toLowerCase()) ? prev : [...prev, savedName]);
      setNewCustomType('');
    } catch (err) {
      setCustomTypeError(err instanceof Error ? err.message : 'Failed to create custom type');
    } finally {
      setAddingCustomType(false);
    }
  };

  const handleSave = async (field: 'name' | 'address' | 'types' | 'bucket', value: any) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onEditProject?.(projectId, field, value);
      setEditMode(null);
      onClose();
    } catch (error) {
      console.error(`Failed to save ${field}:`, error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  // Calculate position based on trigger element
  let position = { top: 0, left: 0 };
  if (triggerRef.current) {
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    position = {
      top: triggerRect.bottom + scrollTop + 4,
      left: triggerRect.left + scrollLeft
    };
  }

  return createPortal(
    <>
      {/* Invisible backdrop — click to close */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 24999,
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isSaving) onClose();
        }}
      />
      {/* Menu panel */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: `${position.top}px`,
          left: `${position.left}px`,
          backgroundColor: '#fff',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          minWidth: '200px',
          zIndex: 25000,
          opacity: isSaving ? 0.6 : 1,
          pointerEvents: isSaving ? 'none' : 'auto',
        }}
      >
        {/* Menu Items */}
        <div style={{ padding: '4px 0' }}>
          {!stockMode && (<>
          {/* Belge Hazırla */}
          <button
            onClick={() => { navigate(`/price-list?projectId=${projectId}`); onClose(); }}
            style={{ width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '8px' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <span style={{ fontSize: '16px' }}>📋</span>
            Belge Hazırla
          </button>

          {/* Divider */}
          <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
          </>)}

          {/* Toggle Urgent */}
          {!stockMode && (
          <button
            onClick={handleUrgentToggle}
            style={{
              width: '100%',
              padding: '8px 16px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
              color: isUrgent ? '#059669' : '#dc2626',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span style={{ fontSize: '16px' }}>{isUrgent ? '🔽' : '🔺'}</span>
            {isUrgent ? 'Remove Urgent' : 'Make Urgent'}
          </button>
          )}

          {enableGrouping && (
            <>
              <button
                onClick={() => { onOpenAddToGroup?.(); onClose(); }}
                style={{ width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span style={{ fontSize: '16px' }}>🏷️</span>
                {pfGroups.length === 0 ? 'Create Group' : 'Add to Group...'}
              </button>

              {/* Divider */}
              <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
            </>
          )}

          {/* Divider */}
          <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

          {/* Edit Name */}
          {editMode === 'name' ? (
            <div style={{ padding: '8px 16px' }}>
              <input
                autoFocus
                type="text"
                defaultValue={projectName}
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    await handleSave('name', (e.target as HTMLInputElement).value);
                  }
                  if (e.key === 'Escape') setEditMode(null);
                }}
                style={{ width: '100%', padding: '4px 8px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}
              />
              <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>Press Enter to save</div>
            </div>
          ) : (
            <button onClick={() => setEditMode('name')} style={{ width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
              Edit Name
            </button>
          )}

          {/* Edit Address */}
          {!stockMode && (editMode === 'address' ? (
            <div style={{ padding: '8px 16px' }}>
              <input
                autoFocus
                type="text"
                defaultValue={projectAddress}
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    await handleSave('address', (e.target as HTMLInputElement).value);
                  }
                  if (e.key === 'Escape') setEditMode(null);
                }}
                style={{ width: '100%', padding: '4px 8px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}
              />
              <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>Press Enter to save</div>
            </div>
          ) : (
            <button onClick={() => setEditMode('address')} style={{ width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
              Edit Address
            </button>
          ))}

          {/* Edit Types */}
          {editMode === 'types' ? (
            <div style={{ padding: '8px 16px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Select project types:</div>
              {/* Standard + custom types merged, no duplicates */}
              {(() => {
                const allOptions = [...TYPE_OPTIONS];
                // Add custom types from projectTypes that aren't in standard list
                projectTypes.forEach(t => {
                  if (!allOptions.includes(t)) allOptions.push(t);
                });
                return allOptions;
              })().map(t => (
                <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 0', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editTypes.includes(t)}
                    onChange={() => {
                      setEditTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
                    }}
                  />
                  {t}
                  {!TYPE_OPTIONS.includes(t) && <span style={{ fontSize: '11px', color: '#999', marginLeft: '4px' }}>(custom)</span>}
                </label>
              ))}
              <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                <input
                  type="text"
                  value={newCustomType}
                  placeholder="New custom type"
                  onMouseDown={(e) => e.stopPropagation()}
                  onChange={(e) => { setNewCustomType(e.target.value); setCustomTypeError(null); }}
                  onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); addCustomType(); } }}
                  style={{ flex: 1, minWidth: 0, padding: '4px 8px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                />
                <button
                  onClick={addCustomType}
                  disabled={addingCustomType || !newCustomType.trim()}
                  style={{ padding: '4px 10px', fontSize: '13px', border: 'none', borderRadius: '4px', background: '#374151', color: '#fff', cursor: 'pointer' }}
                >
                  {addingCustomType ? '...' : 'Add'}
                </button>
              </div>
              {customTypeError && <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>{customTypeError}</div>}
              <button
                onClick={() => handleSave('types', editTypes)}
                disabled={isSaving}
                style={{
                  marginTop: '6px',
                  padding: '4px 12px',
                  fontSize: '13px',
                  backgroundColor: isSaving ? '#93c5fd' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isSaving ? 'not-allowed' : 'pointer'
                }}
              >
                {isSaving ? 'Saving...' : 'Save Types'}
              </button>
            </div>
          ) : (
            <button onClick={() => setEditMode('types')} style={{ width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
              Edit Types
            </button>
          )}

          {/* Move Region */}
          {!stockMode && (editMode === 'region' ? (
            <div style={{ padding: '8px 16px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Move project to another region:</div>
              {BUCKET_OPTIONS.filter(b => b.value !== projectBucket).map(b => (
                <button
                  key={b.value}
                  onClick={() => handleSave('bucket', b.value)}
                  disabled={isSaving}
                  style={{ display: 'block', width: '100%', padding: '6px 8px', border: 'none', background: 'none', textAlign: 'left', cursor: isSaving ? 'not-allowed' : 'pointer', fontSize: '13px', color: '#374151' }}
                  onMouseEnter={(e) => { if (!isSaving) e.currentTarget.style.backgroundColor = '#e5f3ff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          ) : (
            <button onClick={() => setEditMode('region')} style={{ width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
              Move Region
            </button>
          ))}

          {/* Divider */}
          <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

          {/* Delete Project */}
          <button
            onClick={handleDeleteClick}
            style={{
              width: '100%',
              padding: '8px 16px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span style={{ fontSize: '16px' }}>🗑️</span>
            Delete Project
          </button>
        </div>
      </div>
    </>,
    document.body
  );
};

export default ProjectMenu;
```

---

## FILE: components/SectionSeparator.tsx

```tsx
import React from 'react';

interface SectionSeparatorProps {
  title: string;
}

const SectionSeparator: React.FC<SectionSeparatorProps> = ({ title }) => {
  return (
    <div className="section-separator">
      <h1>{title}</h1>
    </div>
  );
};

export default SectionSeparator;
```

---

## FILE: components/SignWaitingFilters.tsx

```tsx
import React from 'react';

export type SignWaitingToken = 'PO_TLINES' | 'PO_T' | 'PF_T' | 'TO_ORDER' | 'BOOKS_IN_PROGRESS';

export const SIGN_WAITING_OPTIONS: { token: SignWaitingToken; label: string; title: string; bg: string; border: string; text: string }[] = [
  { token: 'PO_TLINES', label: 'PO Waiting TLines', title: 'PO status: WAITING TLINES TO SIGN', bg: '#fff7ed', border: '#fdba74', text: '#c2410c' },
  { token: 'PO_T', label: 'PO Waiting T', title: 'PO status: WAITING T TO SIGN', bg: '#f5f3ff', border: '#c4b5fd', text: '#6d28d9' },
  { token: 'PF_T', label: 'PF Waiting T', title: 'PF status: WAITING T TO SIGN', bg: '#f5f3ff', border: '#c4b5fd', text: '#6d28d9' },
  { token: 'TO_ORDER', label: 'To Order', title: 'Status: TO ORDER', bg: '#fff1f2', border: '#fda4af', text: '#be123c' },
  { token: 'BOOKS_IN_PROGRESS', label: 'Books in Progress', title: 'Status: BOOKS IN PROGRESS', bg: '#f0f9ff', border: '#7dd3fc', text: '#0369a1' },
];

interface SignWaitingFiltersProps {
  value: SignWaitingToken[];
  onChange: (next: SignWaitingToken[]) => void;
}

/** Three independent toggle chips; any combination can be active at once (rows matching ANY active chip are kept). */
const SignWaitingFilters: React.FC<SignWaitingFiltersProps> = ({ value, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
    {SIGN_WAITING_OPTIONS.map(o => {
      const active = value.includes(o.token);
      return (
        <button
          key={o.token}
          title={o.title}
          onClick={() => onChange(active ? value.filter(t => t !== o.token) : [...value, o.token])}
          style={{
            display: 'flex',
            alignItems: 'center',
            height: '34px',
            padding: '0 12px',
            border: active ? `1.5px solid ${o.border}` : '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: active ? 600 : 400,
            color: active ? o.text : '#4b5563',
            backgroundColor: active ? o.bg : '#fff',
            cursor: 'pointer',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          {o.label}
        </button>
      );
    })}
  </div>
);

export default SignWaitingFilters;
```

---

## FILE: components/StockUsageModal.tsx

```tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  getAvailableStockProducts, getRowStockUsage, applyStockMovements, removeStockUsage, getStockPeople,
  StockProduct, RowStockUsage, STOCK_STATUS_STYLE,
} from '../lib/trust-stock';
import { useSocketEvent } from '../hooks/useSocketEvent';
import TrustStockContentsModal from './TrustStockContentsModal';

/**
 * "Use from Trust Stock" for one Projects-table row whose vendor is TR-STOCK.
 * Opens by itself when the row's vendor is set to TR-STOCK (or from the row's
 * right-click menu). Pick a stock PF at the top, enter per product how many
 * this row TAKES / RESERVES / RETURNS, switch to another PF and add more —
 * everything is saved together with the name of who took it.
 */

type Entry = { take: string; reserve: string; ret: string };
const EMPTY: Entry = { take: '', reserve: '', ret: '' };
const n = (v: string) => { const x = parseFloat(v.replace(',', '.')); return Number.isFinite(x) && x > 0 ? x : 0; };
const dash = (v: number | null) => (v == null ? '—' : v);
const KIND_LABEL: Record<string, string> = { TAKEN: 'Taken', RETURNED: 'Returned', RESERVED: 'Reserved' };
const KIND_COLOR: Record<string, string> = { TAKEN: '#b45309', RETURNED: '#0369a1', RESERVED: '#6d28d9' };

interface PfOption {
  id: string;
  groupCode: string;
  pfCode: string | null;
  vendor: string;
  products: StockProduct[];
  takeable: number;
}

const StockUsageModal: React.FC<{ projectItemId: string; rowLabel: string; onClose: () => void }> = ({ projectItemId, rowLabel, onClose }) => {
  const [moves, setMoves] = useState<RowStockUsage[]>([]);
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [people, setPeople] = useState<string[]>([]);
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [pfId, setPfId] = useState<string>('');
  const [takenBy, setTakenBy] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [overviewOpen, setOverviewOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [m, p, ppl] = await Promise.all([getRowStockUsage(projectItemId), getAvailableStockProducts(), getStockPeople().catch(() => [] as string[])]);
      setMoves(m);
      setProducts(p);
      setPeople(ppl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [projectItemId]);
  useEffect(() => { load(); }, [load]);
  useSocketEvent('trust-stock:usage-changed', load);

  // Stock PFs (one per imported PF), most available first
  const pfs = useMemo<PfOption[]>(() => {
    const map = new Map<string, PfOption>();
    for (const p of products) {
      let o = map.get(p.stockItem.id);
      if (!o) {
        o = { id: p.stockItem.id, groupCode: p.stockItem.group.code, pfCode: p.stockItem.pfCode, vendor: p.stockItem.vendor ? `${p.stockItem.vendor.code} - ${p.stockItem.vendor.name}` : '', products: [], takeable: 0 };
        map.set(o.id, o);
      }
      o.products.push(p);
      o.takeable += Math.max(0, p.takeable);
    }
    return [...map.values()].sort((a, b) => a.groupCode.localeCompare(b.groupCode, undefined, { numeric: true }) || (a.pfCode || '').localeCompare(b.pfCode || ''));
  }, [products]);

  // Start on the PF this row already uses, else the first one
  useEffect(() => {
    if (pfId || !pfs.length) return;
    const used = moves[0] && products.find(p => p.id === moves[0].productId)?.stockItem.id;
    setPfId(used || pfs[0].id);
  }, [pfs, moves, products, pfId]);

  // This row's balance per product
  const mine = useMemo(() => {
    const m: Record<string, { taken: number; reserved: number }> = {};
    for (const u of moves) {
      const r = (m[u.productId] ||= { taken: 0, reserved: 0 });
      if (u.kind === 'TAKEN') r.taken += u.quantity;
      if (u.kind === 'RETURNED') r.taken -= u.quantity;
      if (u.kind === 'RESERVED') r.reserved += u.quantity;
    }
    return m;
  }, [moves]);

  const currentPf = pfs.find(p => p.id === pfId);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (currentPf?.products || []).filter(p => !q || [p.itemCode, p.description, p.dimensions].some(v => (v || '').toLowerCase().includes(q)));
  }, [currentPf, search]);

  const setEntry = (id: string, patch: Partial<Entry>) => setEntries(prev => ({ ...prev, [id]: { ...(prev[id] || EMPTY), ...patch } }));

  // Same limits as the server
  const problemFor = (p: StockProduct): string | null => {
    const e = entries[p.id];
    if (!e) return null;
    const take = n(e.take), reserve = n(e.reserve), ret = n(e.ret);
    const my = mine[p.id] || { taken: 0, reserved: 0 };
    if (ret > my.taken) return `Can return at most ${my.taken}`;
    const free = p.takeable + ret;
    if (take - Math.min(my.reserved, take) > free) return `Max ${free + my.reserved} can be taken`;
    const freeAfterTake = free - Math.max(0, take - my.reserved);
    if (reserve > freeAfterTake) return `Max ${Math.max(0, freeAfterTake)} can be reserved`;
    return null;
  };

  const pending = products.filter(p => { const e = entries[p.id]; return e && (n(e.take) || n(e.reserve) || n(e.ret)); });
  const pendingByPf = useMemo(() => {
    const m: Record<string, number> = {};
    pending.forEach(p => { m[p.stockItem.id] = (m[p.stockItem.id] || 0) + 1; });
    return m;
  }, [pending]);
  const hasProblem = pending.some(p => problemFor(p));
  const canSave = pending.length > 0 && !hasProblem && !!takenBy.trim() && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await applyStockMovements(projectItemId, pending.map(p => {
        const e = entries[p.id];
        return { productId: p.id, take: n(e.take) || undefined, reserve: n(e.reserve) || undefined, return: n(e.ret) || undefined };
      }), takenBy.trim());
      setEntries({});
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const undo = async (u: RowStockUsage) => {
    if (!window.confirm(`Undo: ${KIND_LABEL[u.kind]} ${u.itemCode} × ${u.quantity}?`)) return;
    try { await removeStockUsage(u.id); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
  };

  const th: React.CSSProperties = { padding: '6px 6px', fontSize: 10.5, color: '#fff', background: '#1e293b', textAlign: 'center', fontWeight: 600, position: 'sticky', top: 0, zIndex: 1, lineHeight: 1.2 };
  const td: React.CSSProperties = { padding: '5px 6px', fontSize: 12, borderBottom: '1px solid #eef2f7', textAlign: 'center', verticalAlign: 'middle' };
  const inp: React.CSSProperties = { width: 58, padding: '4px 5px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12, textAlign: 'right' };

  return (
    <div onMouseDown={() => !saving && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 10, width: 1320, maxWidth: '100%', height: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,.25)' }}>
        {/* Header */}
        <div style={{ padding: '12px 18px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Use from Trust Stock</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>{rowLabel}</div>
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={() => setOverviewOpen(true)} style={{ padding: '7px 12px', border: '1px solid #1e293b', background: '#fff', color: '#1e293b', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Stock Overview
          </button>
          <button onClick={onClose} disabled={saving} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>×</button>
        </div>

        {/* 1. Pick the stock PF */}
        <div style={{ padding: '10px 18px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>1 · Stock PF</div>
          {loading ? <div style={{ fontSize: 13, color: '#6b7280' }}>Loading…</div> : pfs.length === 0 ? (
            <div style={{ fontSize: 13, color: '#6b7280' }}>Trust Stock is empty — upload PF PDFs on the Trust Stock page first.</div>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {pfs.map(o => {
                const active = o.id === pfId;
                return (
                  <button key={o.id} onClick={() => setPfId(o.id)} style={{
                    textAlign: 'left', padding: '7px 11px', borderRadius: 8, cursor: 'pointer', minWidth: 210,
                    border: active ? '2px solid #0f766e' : '1px solid #d1d5db', background: active ? '#ecfdf5' : '#fff',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                      {o.groupCode}
                      {pendingByPf[o.id] ? <span style={{ marginLeft: 6, padding: '0 6px', borderRadius: 999, background: '#0f766e', color: '#fff', fontSize: 10.5 }}>{pendingByPf[o.id]} to save</span> : null}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#334155' }}>{o.pfCode || '(no PF code)'}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{o.vendor} · {o.products.length} items · {o.takeable} free</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* This row's movements */}
        {moves.length > 0 && (
          <div style={{ padding: '7px 18px', borderBottom: '1px solid #e5e7eb', background: '#f8fafc', maxHeight: 110, overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginRight: 4 }}>This row:</span>
              {moves.map(u => (
                <span key={u.id} title={new Date(u.createdAt).toLocaleString('en-GB')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 999, background: '#fff', border: '1px solid #e2e8f0', fontSize: 12 }}>
                  <b style={{ color: KIND_COLOR[u.kind] }}>{KIND_LABEL[u.kind]}</b> {u.itemCode} × {u.quantity}
                  <span style={{ color: '#94a3b8' }}>{u.stockCode}{u.takenBy ? ` · ${u.takenBy}` : ''}</span>
                  <button title="Undo" onClick={() => undo(u)} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', padding: 0, fontSize: 14 }}>×</button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 2. Products of the chosen PF */}
        <div style={{ padding: '8px 18px 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>2 · What does this row use from {currentPf ? <span style={{ fontFamily: 'monospace' }}>{currentPf.pfCode}</span> : 'the PF'}?</div>
          <div style={{ flex: 1 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter items…" style={{ width: 200, padding: '5px 9px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12 }} />
        </div>
        <div style={{ flex: 1, overflow: 'auto', margin: '0 18px', border: '1px solid #e5e7eb', borderRadius: 6 }}>
          {!currentPf ? null : rows.length === 0 ? <div style={{ padding: 18, color: '#6b7280', fontSize: 13 }}>No items.</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Item Code', 'Description', 'Dimensions', 'Ordered', 'Received', 'On Hand', 'Reserved', 'Available', 'Status', 'This row\ntaken / res.', 'TAKE', 'RESERVE', 'RETURN'].map(h => (
                    <th key={h} style={{ ...th, ...(['TAKE', 'RESERVE', 'RETURN'].includes(h) ? { background: '#0f766e' } : {}) }}>{h.split('\n').map((l, i) => <div key={i}>{l}</div>)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(p => {
                  const st = STOCK_STATUS_STYLE[p.status];
                  const e = entries[p.id] || EMPTY;
                  const my = mine[p.id];
                  const problem = problemFor(p);
                  return (
                    <tr key={p.id} style={{ background: problem ? '#fef2f2' : undefined }}>
                      <td style={{ ...td, fontWeight: 700, color: '#15803d', whiteSpace: 'nowrap' }}>{p.itemCode}</td>
                      <td style={{ ...td, textAlign: 'left', color: '#15803d', maxWidth: 280 }}>{p.description}</td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>{p.dimensions || '—'}</td>
                      <td style={td}>{p.ordered}</td>
                      <td style={td}>{dash(p.received)}</td>
                      <td style={td}>{dash(p.onHand)}</td>
                      <td style={td}>{p.reserved}</td>
                      <td style={{ ...td, fontWeight: 700 }}>{p.available == null ? <span title="Not received in the warehouse yet — ordered quantity is the limit">({p.takeable})</span> : p.available}</td>
                      <td style={td}><span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: 4, background: st.bg, color: st.fg, fontSize: 10, fontWeight: 700 }}>{st.label}</span></td>
                      <td style={{ ...td, color: '#475569' }}>{my ? `${my.taken} / ${my.reserved}` : '—'}</td>
                      <td style={td}><input style={inp} value={e.take} onChange={ev => setEntry(p.id, { take: ev.target.value })} inputMode="decimal" /></td>
                      <td style={td}><input style={inp} value={e.reserve} onChange={ev => setEntry(p.id, { reserve: ev.target.value })} inputMode="decimal" /></td>
                      <td style={td}>
                        <input style={{ ...inp, opacity: my?.taken ? 1 : 0.4 }} disabled={!my?.taken} value={e.ret} onChange={ev => setEntry(p.id, { ret: ev.target.value })} inputMode="decimal" />
                        {problem && <div style={{ color: '#dc2626', fontSize: 10.5, marginTop: 2, whiteSpace: 'nowrap' }}>{problem}</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 3. Who + save */}
        <div style={{ padding: '10px 18px', borderTop: '1px solid #e5e7eb', marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>3 · Taken by</span>
          <input
            list="trust-stock-people"
            value={takenBy}
            onChange={e => setTakenBy(e.target.value)}
            placeholder="Name (pick or type a new one)"
            style={{ width: 230, padding: '7px 9px', border: `1px solid ${pending.length && !takenBy.trim() ? '#f59e0b' : '#d1d5db'}`, borderRadius: 6, fontSize: 13 }}
          />
          <datalist id="trust-stock-people">{people.map(p => <option key={p} value={p} />)}</datalist>
          <span style={{ fontSize: 11.5, color: '#64748b' }}>
            {pending.length ? `${pending.length} item(s) from ${Object.keys(pendingByPf).length} PF(s) ready to save` : 'Available in ( ) = not received in the warehouse yet; ordered quantity is the limit.'}
          </span>
          <div style={{ flex: 1 }} />
          {error && <span style={{ color: '#dc2626', fontSize: 13 }}>{error}</span>}
          <button onClick={onClose} disabled={saving} style={{ padding: '8px 14px', border: '1px solid #d1d5db', background: '#fff', borderRadius: 6, cursor: 'pointer' }}>Close</button>
          <button onClick={save} disabled={!canSave} title={pending.length && !takenBy.trim() ? 'Enter who is taking the stock' : undefined}
            style={{ padding: '8px 18px', border: 'none', borderRadius: 6, background: '#0f766e', color: '#fff', fontWeight: 600, cursor: canSave ? 'pointer' : 'not-allowed', opacity: canSave ? 1 : 0.5 }}>
            {saving ? 'Saving…' : `Save${pending.length ? ` (${pending.length})` : ''}`}
          </button>
        </div>
      </div>

      {overviewOpen && (
        <div onMouseDown={e => e.stopPropagation()}>
          <TrustStockContentsModal readOnly onClose={() => setOverviewOpen(false)} />
        </div>
      )}
    </div>
  );
};

export default StockUsageModal;
```

---

## FILE: components/TodayPfControl.tsx

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { TodayPfFlag, getTodayPfFlags } from '../lib/today-pf';
import { useSocketEvent } from '../hooks/useSocketEvent';
import TodayPfManageModal from './TodayPfManageModal';

interface TodayPfControlProps {
  pfActive: boolean;
  onTogglePf: () => void;
  followActive: boolean;
  onToggleFollow: () => void;
  onFlagsChange?: (flags: TodayPfFlag[]) => void;
  // The manage modal's open state is owned by FilterBar, which puts a single
  // combined "Edit" button in front of every chip cluster instead of each one
  // having its own pencil icon.
  manageOpen: boolean;
  onManageOpenChange: (open: boolean) => void;
}

const CHIP = {
  PF: { label: 'ToDo', title: "Show only today's flagged PFs", bg: '#fff7ed', border: '#fed7aa', text: '#c2410c' },
  FOLLOWUP: { label: 'Receive Follow Up', title: 'Show only PFs being followed up', bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
} as const;

const TodayPfControl: React.FC<TodayPfControlProps> = ({ pfActive, onTogglePf, followActive, onToggleFollow, onFlagsChange, manageOpen, onManageOpenChange }) => {
  const [flags, setFlags] = useState<TodayPfFlag[]>([]);

  const refresh = useCallback(() => {
    getTodayPfFlags()
      .then(data => {
        setFlags(data);
        onFlagsChange?.(data);
      })
      .catch(() => { /* non-critical: leave last-known flags in place */ });
  }, [onFlagsChange]);

  useEffect(() => { refresh(); }, [refresh]);
  useSocketEvent('today-pf:updated', refresh);

  const renderChip = (kind: 'PF' | 'FOLLOWUP', active: boolean, onToggle: () => void) => {
    const c = CHIP[kind];
    const count = flags.filter(f => f.kind === kind).length;
    return (
      <button
        onClick={onToggle}
        title={c.title}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          height: '34px',
          padding: '0 12px',
          border: active ? `1.5px solid ${c.border}` : '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: active ? 600 : 400,
          color: active ? c.text : '#4b5563',
          backgroundColor: active ? c.bg : '#fff',
          cursor: 'pointer',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        <span>{c.label}</span>
        {count > 0 && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '18px',
            height: '18px',
            padding: '0 4px',
            borderRadius: '9px',
            backgroundColor: active ? c.text : '#9ca3af',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 700,
          }}>
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {renderChip('PF', pfActive, onTogglePf)}
      {renderChip('FOLLOWUP', followActive, onToggleFollow)}

      {manageOpen && (
        <TodayPfManageModal
          flags={flags}
          onClose={() => onManageOpenChange(false)}
          onChanged={refresh}
        />
      )}
    </div>
  );
};

export default TodayPfControl;
```

---

## FILE: components/TodayPfManageModal.tsx

```tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getProjects, mapBackendTypeToFrontend, BackendProject } from '../lib/projects';
import { TodayPfFlag, TodayPfKind, createTodayPfFlag, deleteTodayPfFlag } from '../lib/today-pf';

const NOT_ORDERED_STATUSES = ['HOLD_T', 'HOLD_PM', 'HOLD_BOOKS', 'NOT_ORDERED', 'TO_ORDER', 'BOOKS_IN_PROGRESS'];

// The "to order" list is now driven by the TO_ORDER item status directly (see the status filter
// chip), not by a manually-managed flag — so this modal only offers the PF and Follow Up tabs.
type ManagedKind = Extract<TodayPfKind, 'PF' | 'FOLLOWUP'>;

const TABS: Record<ManagedKind, { title: string; short: string; accent: string; soft: string; gradient: string; empty: string; doneLabel: string }> = {
  PF: { title: 'ToDo', short: 'PFs to complete', accent: '#ea580c', soft: '#fff7ed', gradient: 'linear-gradient(135deg, #f97316, #c2410c)', empty: 'No PFs flagged yet.', doneLabel: 'PF codes' },
  FOLLOWUP: { title: 'Receive Follow Up', short: 'Receive follow up', accent: '#16a34a', soft: '#f0fdf4', gradient: 'linear-gradient(135deg, #22c55e, #15803d)', empty: 'Nothing being followed up yet.', doneLabel: 'followed' },
};

interface TodayPfManageModalProps {
  flags: TodayPfFlag[];
  onClose: () => void;
  onChanged: () => void;
}

const TodayPfManageModal: React.FC<TodayPfManageModalProps> = ({ flags, onClose, onChanged }) => {
  const [projects, setProjects] = useState<BackendProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectSearch, setProjectSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [tab, setTab] = useState<ManagedKind>('PF');
  const [busy, setBusy] = useState<string | null>(null); // key of the button currently in flight
  const [error, setError] = useState<string | null>(null);
  const pressedOnBackdrop = useRef(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    getProjects()
      .then(res => setProjects(res.data))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load projects'))
      .finally(() => setLoadingProjects(false));
  }, []);

  // Position the dropdown against the search input's real screen coordinates —
  // a single direct measurement, no multi-phase reflow dance.
  useEffect(() => {
    if (!dropdownOpen) return;
    const updatePosition = () => {
      if (!pickerRef.current) return;
      const rect = pickerRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    };
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [dropdownOpen]);

  // Close on outside click — but a click inside the portaled dropdown itself
  // (which is a DOM sibling of the modal, not a descendant) must not count as
  // "outside," otherwise picking a project closes the whole modal.
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (pickerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  const projectLabel = (p: BackendProject) => `${p.projectNo} — ${p.name}`;

  const filteredProjects = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(p => projectLabel(p).toLowerCase().includes(q));
  }, [projects, projectSearch]);

  const selectedProject = useMemo(
    () => projects.find(p => p.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const handlePickProject = (p: BackendProject) => {
    setSelectedProjectId(p.id);
    setProjectSearch(projectLabel(p));
    setDropdownOpen(false);
  };

  // Every distinct PF type present in the selected project, with fill progress.
  const availableTypes = useMemo(() => {
    if (!selectedProject) return [];
    const seen = new Map<string, { label: string; type?: string; customTypeId?: string; total: number; filled: number }>();
    (selectedProject.items || []).forEach(item => {
      const label = mapBackendTypeToFrontend(item.type, (item as any).customType);
      if (!seen.has(label)) {
        seen.set(label, {
          label,
          type: (item as any).customTypeId ? undefined : (item.type || undefined),
          customTypeId: (item as any).customTypeId || undefined,
          total: 0,
          filled: 0,
        });
      }
      const entry = seen.get(label)!;
      entry.total += 1;
      const done = tab === 'PF' ? !!item.pfCode?.trim() : !NOT_ORDERED_STATUSES.includes(String((item as any).status || 'NOT_ORDERED'));
      if (done) entry.filled += 1;
    });
    return [...seen.values()];
  }, [selectedProject, tab]);

  // To Order tab: every individual PF (item) of the selected project, one by one.
  const orderItems = useMemo(() => {
    if (!selectedProject) return [];
    return (selectedProject.items || [])
      .map(item => ({
        id: item.id,
        label: mapBackendTypeToFrontend(item.type, (item as any).customType),
        pfCode: item.pfCode?.trim() || '',
        vendor: ((item as any).vendor?.name as string) || '',
        status: String((item as any).status || 'NOT_ORDERED'),
      }))
      .sort((a, b) => a.label.localeCompare(b.label) || a.pfCode.localeCompare(b.pfCode, undefined, { numeric: true }));
  }, [selectedProject]);

  const flaggedItemIds = useMemo(() => new Set(flags.filter(f => f.kind === tab && f.itemId).map(f => f.itemId as string)), [flags, tab]);

  const handleAddItem = async (itemId: string, key: string) => {
    if (!selectedProjectId || busy) return;
    setBusy(key);
    setError(null);
    try {
      await createTodayPfFlag({ projectId: selectedProjectId, kind: tab, itemId });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add flag');
    } finally {
      setBusy(null);
    }
  };

  const pill = (st: string) => {
    const ordered = !NOT_ORDERED_STATUSES.includes(st);
    return { background: ordered ? '#dcfce7' : '#fef3c7', color: ordered ? '#166534' : '#92400e' };
  };
  const typePill = { background: '#f1f5f9', color: '#475569', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' as const };
  const statusText = (st: string) => st.replace(/_/g, ' ').toLowerCase().replace(/^./, c => c.toUpperCase());

  const tabFlags = useMemo(() => flags.filter(f => f.kind === tab), [flags, tab]);
  const theme = TABS[tab];

  const flaggedLabelsForProject = useMemo(() => {
    if (!selectedProjectId) return new Set<string>();
    return new Set(tabFlags.filter(f => f.projectId === selectedProjectId).map(f => f.typeLabel));
  }, [tabFlags, selectedProjectId]);

  const handleAddType = async (t: { label: string; type?: string; customTypeId?: string }) => {
    if (!selectedProjectId || busy) return;
    setBusy(t.label);
    setError(null);
    try {
      await createTodayPfFlag({ projectId: selectedProjectId, type: t.type, customTypeId: t.customTypeId, kind: tab });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add flag');
    } finally {
      setBusy(null);
    }
  };

  const handleRemove = async (id: string) => {
    if (busy) return;
    setBusy(id);
    setError(null);
    try {
      await deleteTodayPfFlag(id);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove flag');
    } finally {
      setBusy(null);
    }
  };

  const progressColor = (filled: number, total: number) => {
    if (total === 0) return '#9ca3af';
    if (filled >= total) return '#16a34a';
    if (filled > 0) return '#d97706';
    return '#9ca3af';
  };

  return createPortal(
    <div
      onMouseDown={e => { pressedOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => { if (pressedOnBackdrop.current && e.target === e.currentTarget) onClose(); pressedOnBackdrop.current = false; }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(15,23,42,0.55)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: 2000,
        padding: '20px',
      }}
    >
      <div
                style={{
          background: 'white', borderRadius: '14px', width: '520px',
          maxHeight: '85vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.28)', overflow: 'hidden',
        }}
      >
        <div style={{
          padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: theme.gradient, color: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5-6.5-4.5L5.5 21.5 8 14 2 9.5h7.5z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>{theme.title}</h3>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', width: '28px', height: '28px',
              borderRadius: '50%', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', gap: '6px', padding: '10px 22px 0', borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
          {(['PF', 'FOLLOWUP'] as ManagedKind[]).map(k => {
            const t = TABS[k];
            const active = tab === k;
            const count = flags.filter(f => f.kind === k).length;
            return (
              <button
                key={k}
                onClick={() => setTab(k)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px',
                  border: 'none', borderBottom: active ? `2px solid ${t.accent}` : '2px solid transparent',
                  background: 'transparent', cursor: 'pointer', fontSize: '13px',
                  fontWeight: active ? 700 : 500, color: active ? t.accent : '#6b7280', marginBottom: '-1px',
                }}
              >
                {t.short}
                <span style={{
                  minWidth: '18px', height: '18px', padding: '0 5px', borderRadius: '9px', fontSize: '11px', fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: active ? t.accent : '#d1d5db', color: '#fff',
                }}>{count}</span>
              </button>
            );
          })}
        </div>

        <div style={{ padding: '18px 22px', overflowY: 'auto' }}>
          {error && (
            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '9px 12px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <div style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
            Currently flagged {tabFlags.length > 0 && `(${tabFlags.length})`}
          </div>
          {tabFlags.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '20px', padding: '10px 12px', background: '#f9fafb', borderRadius: '8px' }}>
              {theme.empty}
            </div>
          ) : (
            <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {tabFlags.map(f => {
                const pct = f.totalItems > 0 ? Math.round((f.filledItems / f.totalItems) * 100) : 0;
                return (
                  <div key={f.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px', border: `1px solid ${f.completedAt ? '#bbf7d0' : '#e5e7eb'}`, borderLeft: `3px solid ${f.completedAt ? '#22c55e' : theme.accent}`, borderRadius: '10px', fontSize: '13px',
                    background: f.completedAt ? '#f0fdf4' : '#fff', boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
                  }}>
                    {f.itemId ? (
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <strong style={{ color: '#0f172a' }}>{f.projectNo}</strong>
                          <span style={typePill}>{f.typeLabel}</span>
                          {f.completedAt && <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '12px' }}>✓ done</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 600, fontSize: '12px', color: f.pfCode ? '#1d4ed8' : '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {f.pfCode || 'no PF code yet'}
                          </span>
                          <span style={{ ...pill(f.itemStatus || 'NOT_ORDERED'), borderRadius: '999px', padding: '2px 9px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {statusText(f.itemStatus || 'NOT_ORDERED')}
                          </span>
                        </div>
                      </div>
                    ) : (
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <strong>{f.projectNo}</strong>
                        <span style={{ color: '#6b7280' }}>— {f.typeLabel}</span>
                        {f.completedAt && <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ done</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                        <div style={{ flex: 1, height: '5px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: progressColor(f.filledItems, f.totalItems), borderRadius: '3px', transition: 'width 0.2s' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap' }}>{f.filledItems}/{f.totalItems}</span>
                      </div>
                    </div>
                    )}
                    <button
                      onClick={() => handleRemove(f.id)}
                      disabled={!!busy}
                      title="Remove"
                      style={{
                        border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer',
                        width: '26px', height: '26px', borderRadius: '6px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {busy === f.id ? '…' : '×'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
            Add new
          </div>

          <div ref={pickerRef} style={{ position: 'relative', marginBottom: '10px' }}>
            <input
              value={projectSearch}
              onChange={e => {
                setProjectSearch(e.target.value);
                setSelectedProjectId('');
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              disabled={loadingProjects}
              placeholder={loadingProjects ? 'Loading projects...' : 'Search project by number or name...'}
              style={{
                width: '100%', height: '38px', padding: '0 12px 0 34px', border: '1px solid #d1d5db',
                borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', outline: 'none',
              }}
            />
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"
              style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
            </svg>
          </div>

          {dropdownOpen && !loadingProjects && dropdownPos && createPortal(
            <div
              ref={dropdownRef}
              style={{
                position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width,
                maxHeight: '240px', overflowY: 'auto',
                background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb',
                boxShadow: '0 10px 25px rgba(0,0,0,0.12)', zIndex: 2100,
              }}
            >
              {filteredProjects.length === 0 ? (
                <div style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                  No projects match "{projectSearch}"
                </div>
              ) : (
                filteredProjects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handlePickProject(p)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '9px 12px', border: 'none',
                      background: p.id === selectedProjectId ? theme.soft : 'transparent',
                      color: p.id === selectedProjectId ? theme.accent : '#374151',
                      fontSize: '13px', cursor: 'pointer',
                    }}
                    onMouseEnter={e => { if (p.id !== selectedProjectId) e.currentTarget.style.background = '#f9fafb'; }}
                    onMouseLeave={e => { if (p.id !== selectedProjectId) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <strong>{p.projectNo}</strong>
                    <span style={{ color: '#9ca3af' }}> — {p.name}</span>
                  </button>
                ))
              )}
            </div>,
            document.body
          )}

          {selectedProject && tab === 'FOLLOWUP' && (
            orderItems.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#9ca3af', padding: '10px 12px', background: '#f9fafb', borderRadius: '8px' }}>
                This project has no PFs yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Only ORDERED PFs can be followed up — the others are greyed out:</div>
                {orderItems.map(it => {
                  const flagged = flaggedItemIds.has(it.id);
                  const blocked = tab === 'FOLLOWUP' && it.status !== 'ORDERED';
                  return (
                    <button
                      key={it.id}
                      onClick={() => handleAddItem(it.id, it.id)}
                      disabled={!!busy || flagged || blocked}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left',
                        opacity: blocked ? 0.55 : 1, filter: blocked ? 'grayscale(1)' : 'none',
                        padding: '8px 12px', borderRadius: '8px', fontSize: '13px',
                        border: flagged ? `1px solid ${theme.accent}` : '1px solid #e5e7eb',
                        background: flagged ? theme.soft : blocked ? '#f3f4f6' : '#fff',
                        cursor: flagged || blocked ? 'not-allowed' : 'pointer',
                      }}
                      onMouseEnter={e => { if (!flagged && !blocked) e.currentTarget.style.borderColor = theme.accent; }}
                      onMouseLeave={e => { if (!flagged && !blocked) e.currentTarget.style.borderColor = '#e5e7eb'; }}
                    >
                      <span style={{ ...typePill, width: '74px', textAlign: 'center', flexShrink: 0 }}>{it.label}</span>
                      <span style={{ flex: 1, minWidth: 0, fontFamily: 'ui-monospace, monospace', fontWeight: 600, color: it.pfCode ? '#111827' : '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {busy === it.id ? '…' : (it.pfCode || 'no PF code yet')}
                        {it.vendor && <span style={{ fontFamily: 'inherit', fontWeight: 400, color: '#9ca3af' }}> · {it.vendor}</span>}
                      </span>
                      <span style={{ ...pill(it.status), borderRadius: '999px', padding: '2px 9px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {statusText(it.status)}
                      </span>
                      {flagged && <span style={{ color: theme.accent, fontWeight: 700 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )
          )}

          {selectedProject && tab === 'PF' && (
            availableTypes.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#9ca3af', padding: '10px 12px', background: '#f9fafb', borderRadius: '8px' }}>
                This project has no items yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {availableTypes.map(t => {
                  const alreadyFlagged = flaggedLabelsForProject.has(t.label);
                  const fullyFilled = t.total > 0 && t.filled >= t.total;
                  const isBusy = busy === t.label;
                  return (
                    <button
                      key={t.label}
                      onClick={() => handleAddType(t)}
                      disabled={!!busy || alreadyFlagged}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '7px 12px',
                        borderRadius: '8px',
                        border: alreadyFlagged ? '1px solid #16a34a' : '1px solid #d1d5db',
                        background: alreadyFlagged ? '#f0fdf4' : '#fff',
                        color: alreadyFlagged ? '#16a34a' : '#374151',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: alreadyFlagged ? 'default' : 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { if (!alreadyFlagged) e.currentTarget.style.borderColor = theme.accent; }}
                      onMouseLeave={e => { if (!alreadyFlagged) e.currentTarget.style.borderColor = '#d1d5db'; }}
                    >
                      {alreadyFlagged && '✓ '}
                      {isBusy ? '…' : t.label}
                      <span style={{
                        fontSize: '11px',
                        color: alreadyFlagged ? '#16a34a' : progressColor(t.filled, t.total),
                        fontWeight: 700,
                      }}>
                        {t.filled}/{t.total}{fullyFilled ? ' ✓' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TodayPfManageModal;
```

---

## FILE: components/TrustStockContentsModal.tsx

```tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  getStockProducts, getAvailableStockProducts, openTrustStockPdf, updateStockProduct, deleteStockProduct, downloadReorderPf,
  StockProduct, StockStatus, STOCK_STATUS_STYLE,
} from '../lib/trust-stock';
import { useSocketEvent } from '../hooks/useSocketEvent';

/**
 * Trust Lines — Cabinet Stock Overview (same columns and rules as the
 * "Cabinet Stock Management" sheet). Every figure is calculated from the
 * imported PFs, the warehouse receipt (Confirmed Received, entered here) and
 * the take/reserve/return movements made from Projects rows.
 */
const fmtPct = (v: number | null) => (v == null ? '—' : `${Math.round(v * 100)}%`);
const dash = (v: number | null) => (v == null ? '—' : v);
const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString('en-GB') : '-');

const STATUS_FILTERS: (StockStatus | 'ALL')[] = ['ALL', 'HEALTHY', 'WATCH', 'REORDER_NOW', 'OUT_OF_STOCK', 'PENDING_VERIFICATION'];

const ReceivedCell: React.FC<{ p: StockProduct; onError: (m: string) => void; onSaved: () => void }> = ({ p, onError, onSaved }) => {
  const [value, setValue] = useState(p.received == null ? '' : String(p.received));
  useEffect(() => { setValue(p.received == null ? '' : String(p.received)); }, [p.received]);
  const commit = async () => {
    const trimmed = value.trim();
    const next = trimmed === '' ? null : Number(trimmed.replace(',', '.'));
    if (next === p.received || (next != null && !Number.isFinite(next))) { setValue(p.received == null ? '' : String(p.received)); return; }
    try { await updateStockProduct(p.id, { receivedQuantity: next }); onSaved(); }
    catch (e) { onError(e instanceof Error ? e.message : 'Save failed'); setValue(p.received == null ? '' : String(p.received)); }
  };
  return (
    <input
      value={value}
      onChange={e => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setValue(p.received == null ? '' : String(p.received)); }}
      placeholder="—"
      title="Confirmed received in the warehouse (empty = pending verification)"
      inputMode="decimal"
      style={{ width: 56, padding: '3px 5px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12, textAlign: 'center', background: p.received == null ? '#f8fafc' : '#fff' }}
    />
  );
};

/** Click to edit; Enter / leaving the field saves, Esc cancels. */
const EditCell: React.FC<{
  value: string;
  onSave: (v: string) => Promise<void>;
  editable: boolean;
  multiline?: boolean;
  numeric?: boolean;
  style?: React.CSSProperties;
  placeholder?: string;
}> = ({ value, onSave, editable, multiline, numeric, style, placeholder = '—' }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);
  if (!editable || !editing) {
    return (
      <span
        onClick={() => editable && setEditing(true)}
        title={editable ? 'Click to edit' : undefined}
        style={{ cursor: editable ? 'text' : undefined, display: 'block', minHeight: 16, borderBottom: editable ? '1px dashed transparent' : undefined, ...style }}
        onMouseEnter={e => { if (editable) e.currentTarget.style.borderBottomColor = '#94a3b8'; }}
        onMouseLeave={e => { e.currentTarget.style.borderBottomColor = 'transparent'; }}
      >
        {value || <span style={{ color: '#cbd5e1' }}>{placeholder}</span>}
      </span>
    );
  }
  const commit = async () => {
    if (saving) return;
    if (draft.trim() === value.trim()) { setEditing(false); return; }
    setSaving(true);
    try { await onSave(draft.trim()); setEditing(false); }
    finally { setSaving(false); }
  };
  const common = {
    autoFocus: true,
    value: draft,
    disabled: saving,
    onChange: (e: any) => setDraft(e.target.value),
    onBlur: commit,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') { setDraft(value); setEditing(false); }
      if (e.key === 'Enter' && !(multiline && e.shiftKey)) { e.preventDefault(); commit(); }
    },
    style: { width: '100%', boxSizing: 'border-box' as const, padding: '3px 5px', border: '1px solid #0f766e', borderRadius: 4, fontSize: 12, fontFamily: 'inherit', textAlign: (numeric ? 'center' : 'left') as any },
  };
  return multiline ? <textarea rows={2} {...common} /> : <input inputMode={numeric ? 'decimal' : undefined} {...common} />;
};

/** readOnly: opened from a Projects row (Projects access) — figures only, no receipt editing */
const TrustStockContentsModal: React.FC<{ onClose: () => void; readOnly?: boolean }> = ({ onClose, readOnly = false }) => {
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StockStatus | 'ALL'>('ALL');
  const [orderFilter, setOrderFilter] = useState('');
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [makingPf, setMakingPf] = useState(false);

  // Edits from this table; reload afterwards (the live event isn't sent back to the editor)
  const save = async (p: StockProduct, patch: Parameters<typeof updateStockProduct>[1]) => {
    if ('itemCode' in patch && !patch.itemCode) { setError('Item code can\'t be empty'); throw new Error('empty'); }
    if ('quantity' in patch && !(Number.isFinite(patch.quantity as number) && (patch.quantity as number) >= 0)) { setError('Enter a valid ordered quantity'); throw new Error('bad qty'); }
    try { await updateStockProduct(p.id, patch); setError(null); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Save failed'); throw e; }
  };
  const remove = async (p: StockProduct) => {
    if (!window.confirm(`Remove ${p.itemCode} from ${p.stockItem.group.code}?`)) return;
    try { await deleteStockProduct(p.id); setError(null); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Remove failed'); }
  };

  const load = useCallback(async () => {
    try { setProducts(await (readOnly ? getAvailableStockProducts() : getStockProducts())); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [readOnly]);
  useEffect(() => { load(); }, [load]);
  useSocketEvent('trust-stock:usage-changed', load);
  useSocketEvent('trust-stock:item-created', load);
  useSocketEvent('trust-stock:item-deleted', load);

  const orders = useMemo(() => [...new Set(products.map(p => p.stockItem.group.code))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })), [products]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter(p => statusFilter === 'ALL' || p.status === statusFilter)
      .filter(p => !orderFilter || p.stockItem.group.code === orderFilter)
      .filter(p => !q || [p.itemCode, p.description, p.dimensions, p.stockItem.pfCode, p.stockItem.group.code, p.stockItem.vendor?.name, ...p.usages.map(u => u.projectNo), ...p.usages.map(u => u.takenBy || '')]
        .some(v => (v || '').toLowerCase().includes(q)))
      .sort((a, b) => a.stockItem.group.code.localeCompare(b.stockItem.group.code, undefined, { numeric: true }));
  }, [products, search, statusFilter, orderFilter]);

  // Dashboard figures (remaining / available only count models with a confirmed receipt — same as the sheet)
  const dash_ = useMemo(() => {
    const received = products.filter(p => p.received != null);
    return {
      ordered: products.reduce((s, p) => s + p.ordered, 0),
      received: received.reduce((s, p) => s + (p.received ?? 0), 0),
      used: products.reduce((s, p) => s + p.netUsed, 0),
      onHand: received.reduce((s, p) => s + (p.onHand ?? 0), 0),
      reserved: products.reduce((s, p) => s + p.reserved, 0),
      available: received.reduce((s, p) => s + (p.available ?? 0), 0),
      reorder: products.filter(p => p.status === 'REORDER_NOW').length,
      out: products.filter(p => p.status === 'OUT_OF_STOCK').length,
      watch: products.filter(p => p.status === 'WATCH').length,
      pending: products.filter(p => p.status === 'PENDING_VERIFICATION').length,
    };
  }, [products]);

  const toggle = (id: string) => setOpen(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const card = (label: string, value: number, head: string, color = '#0f172a') => (
    <div key={label} style={{ flex: '1 1 150px', minWidth: 140, border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden', textAlign: 'center' }}>
      <div style={{ background: head, color: '#fff', fontSize: 10.5, fontWeight: 700, padding: '5px 4px', letterSpacing: '.3px' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, padding: '6px 4px', color }}>{value}</div>
    </div>
  );

  const th: React.CSSProperties = { padding: '6px 6px', fontSize: 10.5, color: '#fff', background: '#1e293b', textAlign: 'center', fontWeight: 600, position: 'sticky', top: 0, zIndex: 1, lineHeight: 1.2 };
  const td: React.CSSProperties = { padding: '5px 6px', fontSize: 12, borderBottom: '1px solid #eef2f7', textAlign: 'center', verticalAlign: 'middle' };
  const COLS = ['Stock Order', 'Item Code', 'Description', 'Dimensions', 'Ordered', 'Confirmed\nReceived', 'Taken', 'Returned', 'On Hand', 'Reserved', 'Available', 'Remaining %', 'Reorder at ≤', 'Order', 'Status', 'Used by'];

  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: readOnly ? 100001 : 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 10, width: 1500, maxWidth: '100%', height: '94vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,.25)' }}>
        <div style={{ padding: '10px 18px', background: '#1e293b', color: '#fff', borderRadius: '10px 10px 0 0', display: 'flex', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '.4px' }}>TRUST LINES — STOCK OVERVIEW</div>
          <div style={{ flex: 1 }} />
          {!readOnly && (() => {
            const lines = products.filter(p => p.reorderQty > 0);
            const qty = lines.reduce((s, p) => s + p.reorderQty, 0);
            return (
              <button
                disabled={!lines.length || makingPf}
                onClick={async () => {
                  setMakingPf(true);
                  try { await downloadReorderPf(); setError(null); }
                  catch (e) { setError(e instanceof Error ? e.message : 'Could not create the re-order PF'); }
                  finally { setMakingPf(false); }
                }}
                title={lines.length ? `Production form for ${lines.length} product(s), ${qty} pcs — the Order column` : 'Nothing at the reorder point'}
                style={{ marginRight: 14, padding: '6px 14px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 700, cursor: lines.length && !makingPf ? 'pointer' : 'default', background: lines.length ? '#f59e0b' : '#475569', color: lines.length ? '#1e293b' : '#cbd5e1' }}>
                {makingPf ? 'Creating PF…' : `⬇ Re-order PF${lines.length ? ` (${lines.length})` : ''}`}
              </button>
            );
          })()}
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#fff' }}>×</button>
        </div>

        {/* Dashboard */}
        <div style={{ padding: '10px 18px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {card('TOTAL ORDERED', dash_.ordered, '#1e3a5f')}
            {card('TOTAL RECEIVED', dash_.received, '#1e3a5f')}
            {card('USED (net of returns)', dash_.used, '#1e3a5f')}
            {card('REMAINING (on hand)', dash_.onHand, '#1e3a5f')}
            {card('RESERVED', dash_.reserved, '#1e3a5f')}
            {card('AVAILABLE', dash_.available, '#1e3a5f')}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {card('NEED REORDER', dash_.reorder, '#b91c1c', '#b91c1c')}
            {card('OUT OF STOCK', dash_.out, '#7f1d1d', '#7f1d1d')}
            {card('ON WATCH', dash_.watch, '#b45309', '#b45309')}
            {card('PENDING VERIFICATION', dash_.pending, '#6b7280', '#6b7280')}
          </div>
        </div>

        {/* Filters */}
        <div style={{ padding: '8px 18px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid #e5e7eb' }}>
          {STATUS_FILTERS.map(s => {
            const active = statusFilter === s;
            const style = s === 'ALL' ? { label: 'ALL', bg: '#1e293b', fg: '#fff' } : STOCK_STATUS_STYLE[s];
            return (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                border: active ? '2px solid #0f172a' : '1px solid #d1d5db', background: active ? style.bg : '#fff', color: active ? style.fg : '#374151',
              }}>{style.label}</button>
            );
          })}
          <select value={orderFilter} onChange={e => setOrderFilter(e.target.value)} style={{ padding: '5px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12 }}>
            <option value="">All stock orders</option>
            {orders.map(o => <option key={o}>{o}</option>)}
          </select>
          <div style={{ flex: 1 }} />
          {error && <span style={{ color: '#dc2626', fontSize: 12 }}>{error}</span>}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Item, description, PF, project, person…"
            style={{ width: 230, padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12 }} />
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading && <div style={{ padding: 24, color: '#6b7280' }}>Loading…</div>}
          {!loading && products.length === 0 && <div style={{ padding: 24, color: '#6b7280' }}>No products yet — upload a PF PDF to fill the stock.</div>}
          {!loading && products.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{COLS.map(h => <th key={h} style={th}>{h.split('\n').map((l, i) => <div key={i}>{l}</div>)}</th>)}</tr></thead>
              <tbody>
                {visible.map((p, i) => {
                  const st = STOCK_STATUS_STYLE[p.status];
                  const newGroup = i === 0 || visible[i - 1].stockItem.id !== p.stockItem.id;
                  const isOpen = open.has(p.id);
                  return (
                    <React.Fragment key={p.id}>
                      {newGroup && (
                        <tr>
                          <td colSpan={COLS.length} style={{ padding: '5px 10px', background: '#e2e8f0', fontSize: 12, color: '#0f172a' }}>
                            <b>{p.stockItem.group.code}</b>
                            <span style={{ margin: '0 10px', fontFamily: 'monospace' }}>{p.stockItem.pfCode}</span>
                            {p.stockItem.vendor && <span>{p.stockItem.vendor.code} - {p.stockItem.vendor.name}</span>}
                            <span style={{ marginLeft: 10, color: '#475569' }}>{fmtDate(p.stockItem.pfDate)}</span>
                            {p.stockItem.hasPdf && (
                              <button onClick={() => openTrustStockPdf(p.stockItem.id).catch(e => setError(e.message))}
                                style={{ marginLeft: 10, padding: '1px 8px', borderRadius: 4, border: '1px solid #94a3b8', background: '#fff', fontSize: 11, cursor: 'pointer' }}>View PDF</button>
                            )}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td style={td}>{p.stockItem.group.code}</td>
                        <td style={{ ...td, fontWeight: 700, color: '#15803d', whiteSpace: 'nowrap' }}>
                          <EditCell editable={!readOnly} value={p.itemCode} onSave={v => save(p, { itemCode: v })} />
                        </td>
                        <td style={{ ...td, textAlign: 'left', color: '#15803d', maxWidth: 280 }}>
                          <EditCell editable={!readOnly} multiline value={p.description} onSave={v => save(p, { description: v })} />
                        </td>
                        <td style={{ ...td, whiteSpace: 'nowrap' }}>
                          <EditCell editable={!readOnly} value={p.dimensions || ''} onSave={v => save(p, { dimensions: v || null })} />
                        </td>
                        <td style={td}>
                          <EditCell editable={!readOnly} numeric value={String(p.ordered)} onSave={v => save(p, { quantity: Number(v.replace(',', '.')) })} />
                        </td>
                        <td style={td}>{readOnly ? dash(p.received) : <ReceivedCell p={p} onError={setError} onSaved={load} />}</td>
                        <td style={td}>{p.taken}</td>
                        <td style={td}>{p.returned}</td>
                        <td style={{ ...td, fontWeight: 600 }}>{dash(p.onHand)}</td>
                        <td style={td}>{p.reserved}</td>
                        <td style={{ ...td, fontWeight: 700 }}>{dash(p.available)}</td>
                        <td style={td}>{fmtPct(p.remainingPct)}</td>
                        <td style={td}>{dash(p.reorderThreshold)}</td>
                        <td style={{ ...td, fontWeight: 800, color: p.reorderQty > 0 ? '#c2410c' : '#9ca3af', background: p.reorderQty > 0 ? '#fff7ed' : undefined }}
                          title={p.reorderQty > 0 ? `Re-order ${p.reorderQty} to get back to the ordered ${p.ordered}` : 'Not at the reorder point'}>
                          {p.reorderQty > 0 ? p.reorderQty : '—'}
                        </td>
                        <td style={td}><span style={{ display: 'inline-block', padding: '3px 6px', borderRadius: 4, background: st.bg, color: st.fg, fontSize: 10, fontWeight: 700, lineHeight: 1.2 }}>{st.label}</span></td>
                        <td style={td}>
                          {p.usages.length === 0 ? (readOnly ? <span style={{ color: '#9ca3af' }}>—</span> : (
                            <button onClick={() => remove(p)} title="Remove this product (only possible while no project uses it)" style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 11, padding: 0 }}>Remove</button>
                          )) : (
                            <button onClick={() => toggle(p.id)} style={{ border: 'none', background: 'none', color: '#0f766e', cursor: 'pointer', fontSize: 12, padding: 0, whiteSpace: 'nowrap' }}>
                              {isOpen ? '▾' : '▸'} {new Set(p.usages.map(u => u.projectNo)).size} project(s)
                            </button>
                          )}
                        </td>
                      </tr>
                      {isOpen && p.usages.map(u => (
                        <tr key={u.id} style={{ background: '#f8fafc' }}>
                          <td style={td} colSpan={2} />
                          <td style={{ ...td, textAlign: 'left' }} colSpan={2}>
                            Project <b>{u.projectNo}</b> <span style={{ color: '#64748b' }}>{u.projectName}</span>
                            <span style={{ fontFamily: 'monospace', fontSize: 11, marginLeft: 8, color: '#475569' }}>{u.projectPfCode}</span>
                            {u.takenBy && <span style={{ marginLeft: 8, color: '#0f172a' }}>· {u.takenBy}</span>}
                            {u.rowDeleted && <span style={{ color: '#dc2626', marginLeft: 6 }}>(row deleted)</span>}
                          </td>
                          <td style={td} colSpan={2} />
                          <td style={{ ...td, color: '#b45309', fontWeight: 600 }}>{u.kind === 'TAKEN' ? u.quantity : ''}</td>
                          <td style={{ ...td, color: '#0369a1', fontWeight: 600 }}>{u.kind === 'RETURNED' ? u.quantity : ''}</td>
                          <td style={td} />
                          <td style={{ ...td, color: '#6d28d9', fontWeight: 600 }}>{u.kind === 'RESERVED' ? u.quantity : ''}</td>
                          <td style={{ ...td, color: '#64748b' }} colSpan={6}>{fmtDate(u.createdAt)}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ ...td, background: '#facc15', fontWeight: 800, textAlign: 'left' }}>TOTAL</td>
                  {[
                    visible.reduce((s, p) => s + p.ordered, 0),
                    visible.reduce((s, p) => s + (p.received ?? 0), 0),
                    visible.reduce((s, p) => s + p.taken, 0),
                    visible.reduce((s, p) => s + p.returned, 0),
                    visible.reduce((s, p) => s + (p.onHand ?? 0), 0),
                    visible.reduce((s, p) => s + p.reserved, 0),
                    visible.reduce((s, p) => s + (p.available ?? 0), 0),
                  ].map((v, i) => <td key={i} style={{ ...td, background: '#facc15', fontWeight: 800 }}>{v}</td>)}
                  <td colSpan={2} style={{ ...td, background: '#facc15' }} />
                  <td style={{ ...td, background: '#facc15', fontWeight: 800, color: '#9a3412' }}>{visible.reduce((s, p) => s + p.reorderQty, 0) || '—'}</td>
                  <td colSpan={2} style={{ ...td, background: '#facc15' }} />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
        <div style={{ padding: '6px 18px', fontSize: 11, color: '#64748b', borderTop: '1px solid #e5e7eb' }}>
          Status per model, Remaining % = Available ÷ Confirmed Received: HEALTHY &gt; 50% · WATCH 25–50% · REORDER NOW ≤ 25% · OUT OF STOCK ≤ 0 · PENDING VERIFICATION = no warehouse receipt yet (enter it in “Confirmed Received”).
        </div>
      </div>
    </div>
  );
};

export default TrustStockContentsModal;
```

---

## FILE: components/VendorDropdownField.tsx

```tsx
import React, { useState, useRef, useEffect } from 'react';
import AnchoredDropdown from './ui/AnchoredDropdown';
import { Vendor, VendorOption, createVendorOptions, findVendorById } from '../types';
import { getVendors, createVendor } from '../lib/projects';
import { usePagePermissions } from '../hooks/usePagePermissions';

interface VendorDropdownFieldProps {
  value?: string; // Selected vendor ID
  onChange: (vendorId: string | null, vendor: Vendor | null) => void;
  onAddVendorClick: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const VendorDropdownField: React.FC<VendorDropdownFieldProps> = ({
  value,
  onChange,
  onAddVendorClick,
  placeholder = 'Select vendor...',
  className = '',
  disabled = false
}) => {
  const { canManageMasterData } = usePagePermissions();
  const [isOpen, setIsOpen] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorOptions, setVendorOptions] = useState<VendorOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load vendors on mount
  useEffect(() => {
    loadVendors();
  }, []);

  // Update vendor options when vendors or search term changes
  useEffect(() => {
    if (vendors.length > 0) {
      const options = createVendorOptions(vendors);
      const filtered = searchTerm
        ? options.filter(option =>
            option.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            option.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            option.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : options;
      setVendorOptions(filtered);
    }
  }, [vendors, searchTerm]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const loadVendors = async () => {
    try {
      setLoading(true);
      setError(null);
      const vendorData = await getVendors();
      setVendors(vendorData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerClick = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    setSearchTerm('');
  };

  const handleVendorSelect = (vendor: VendorOption) => {
    const fullVendor = findVendorById(vendors, vendor.id);

    // Close dropdown immediately
    setIsOpen(false);
    setSearchTerm('');

    // Apply selection immediately
    onChange(vendor.id, fullVendor || null);
  };

  const handleAddVendorClick = () => {
    setIsOpen(false);
    setSearchTerm('');
    onAddVendorClick();
  };

  const handleCreateVendor = async (code: string, name: string) => {
    if (!canManageMasterData) {
      setError('You do not have permission to create vendors');
      return;
    }

    try {
      setCreating(true);
      setError(null);


      const newVendor = await createVendor({ code: code.toUpperCase(), name });


      // Refresh vendor list
      await loadVendors();

      // Close dropdown and apply selection
      setIsOpen(false);
      setSearchTerm('');

      // Select the newly created vendor
      onChange(newVendor.id, newVendor);

    } catch (err) {
      console.error('❌ Failed to create vendor:', err);
      setError(err instanceof Error ? err.message : 'Failed to create vendor');
    } finally {
      setCreating(false);
    }
  };

  // Check if search term matches any existing vendor
  const searchTermExistsAsVendor = (term: string): boolean => {
    if (!term || !term.trim()) return false;
    const normalizedTerm = term.toLowerCase().trim();
    return vendors.some(vendor =>
      vendor.code.toLowerCase() === normalizedTerm ||
      vendor.name.toLowerCase() === normalizedTerm ||
      `${vendor.code} - ${vendor.name}`.toLowerCase() === normalizedTerm
    );
  };

  // Parse search term into code and name for new vendor creation
  const parseSearchTermForVendor = (term: string): { code: string; name: string } | null => {
    if (!term || !term.trim()) return null;

    const cleanTerm = term.trim();

    // If contains " - ", split into code and name
    if (cleanTerm.includes(' - ')) {
      const [code, ...nameParts] = cleanTerm.split(' - ');
      const name = nameParts.join(' - ');
      if (code && name) {
        return { code: code.trim(), name: name.trim() };
      }
    }

    // If it's short (3 chars or less), treat as code and ask for name
    if (cleanTerm.length <= 3) {
      return { code: cleanTerm.toUpperCase(), name: cleanTerm };
    }

    // Otherwise, use first 3 chars as code and full term as name
    return {
      code: cleanTerm.substring(0, 3).toUpperCase(),
      name: cleanTerm
    };
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null, null);
  };

  // Get display text for selected vendor
  const selectedVendor = value ? findVendorById(vendors, value) : null;
  const displayText = selectedVendor
    ? `${selectedVendor.code} - ${selectedVendor.name}`
    : placeholder;

  return (
    <div className={`vendor-dropdown-field ${className}`}>
      {/* Trigger */}
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        className={`vendor-dropdown-trigger ${disabled ? 'disabled' : ''} ${isOpen ? 'open' : ''}`}
        style={{
          padding: '8px 12px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: disabled ? '#f5f5f5' : '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '36px'
        }}
      >
        <span
          style={{
            color: selectedVendor ? '#000' : '#999',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {displayText}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {selectedVendor && !disabled && (
            <button
              onClick={handleClear}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: '2px',
                color: '#999',
                fontSize: '14px'
              }}
              title="Clear selection"
            >
              ✕
            </button>
          )}
          <span style={{ color: '#999', fontSize: '12px' }}>
            {isOpen ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Shared Anchored Dropdown */}
      <AnchoredDropdown
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
        triggerRef={triggerRef}
        field="vendor"
        minWidth={250}
        maxHeight={280}
        className="vendor-dropdown-field"
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '0'
          }}
        >
          {/* Search Input */}
          <div style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #ddd',
                borderRadius: '2px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Content */}
          <div style={{ overflow: 'auto', maxHeight: '180px', flex: 1 }}>
            {loading && (
              <div style={{ padding: '12px', textAlign: 'center', color: '#999' }}>
                Loading vendors...
              </div>
            )}

            {error && (
              <div style={{ padding: '12px', color: '#dc3545', fontSize: '14px' }}>
                {error}
                <button
                  onClick={loadVendors}
                  style={{
                    marginLeft: '8px',
                    padding: '2px 8px',
                    border: '1px solid #dc3545',
                    background: 'none',
                    color: '#dc3545',
                    borderRadius: '2px',
                    cursor: 'pointer'
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Create New Option - Show when user typed something that doesn't match existing vendors */}
            {!loading && !error && canManageMasterData && searchTerm && vendorOptions.length === 0 && !searchTermExistsAsVendor(searchTerm) && (
              <div
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const parsed = parseSearchTermForVendor(searchTerm);
                  if (parsed) {
                    handleCreateVendor(parsed.code, parsed.name);
                  }
                }}
                style={{
                  padding: '10px 12px',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  backgroundColor: '#f0f9ff',
                  borderLeft: '3px solid #1976d2',
                  color: creating ? '#999' : '#1976d2',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  if (!creating) {
                    e.currentTarget.style.backgroundColor = '#e3f2fd';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f9ff';
                }}
              >
                {creating ? (
                  <>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '16px' }}>+</span>
                    Create new: "{searchTerm}"
                  </>
                )}
              </div>
            )}

            {!loading && !error && vendorOptions.length === 0 && searchTerm && (searchTermExistsAsVendor(searchTerm) || !canManageMasterData) && (
              <div style={{ padding: '12px', color: '#999', fontSize: '14px' }}>
                No vendors found matching "{searchTerm}"
              </div>
            )}

            {!loading && !error && vendorOptions.length === 0 && !searchTerm && (
              <div style={{ padding: '12px', color: '#999', fontSize: '14px' }}>
                No vendors available
              </div>
            )}

            {/* Vendor Options */}
            {vendorOptions.map((vendor) => (
              <div
                key={vendor.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleVendorSelect(vendor);
                }}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  backgroundColor: value === vendor.id ? '#e3f2fd' : 'transparent',
                  borderLeft: value === vendor.id ? '3px solid #1976d2' : '3px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = value === vendor.id ? '#e3f2fd' : '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = value === vendor.id ? '#e3f2fd' : 'transparent';
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                  {vendor.code}
                </div>
                <div style={{ color: '#666', fontSize: '12px' }}>
                  {vendor.name}
                </div>
              </div>
            ))}
          </div>

          {/* Add New Vendor Button - Only show if user can manage master data */}
          {!loading && !error && canManageMasterData && (
            <div style={{ borderTop: '1px solid #eee' }}>
              <button
                onClick={handleAddVendorClick}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: '#1976d2',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ fontSize: '16px' }}>+</span>
                Add New Vendor
              </button>
            </div>
          )}
        </div>
      </AnchoredDropdown>
    </div>
  );
};

export default VendorDropdownField;
```

---

## FILE: components/ui/AnchoredDropdown.tsx

```tsx
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface AnchoredDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement>;
  children: React.ReactNode;
  className?: string;
  field: 'vendor' | 'poSignStatus' | 'pfSignStatus' | 'orderType' | 'status' | 'containerNo' | 'paymentRule';
  minWidth?: number;
  maxWidth?: number;
  maxHeight?: number;
  gap?: number;
}

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

const AnchoredDropdown: React.FC<AnchoredDropdownProps> = ({
  isOpen,
  onClose,
  triggerRef,
  children,
  className = '',
  field,
  minWidth = 200,
  maxWidth,
  maxHeight = 300,
  gap = 6
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<DropdownPosition>({ top: -9999, left: 0, width: 0, maxHeight });

  const computePosition = (): DropdownPosition => {
    if (!triggerRef.current) return { top: -9999, left: 0, width: 0, maxHeight };

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const maxAllowedWidth = maxWidth || window.innerWidth - 16;
    const finalWidth = Math.min(Math.max(triggerRect.width, minWidth), maxAllowedWidth);
    const finalLeft = Math.max(8, Math.min(triggerRect.left, window.innerWidth - finalWidth - 8));

    const preferredTop = triggerRect.bottom + gap;
    const flipped = preferredTop + maxHeight > window.innerHeight;

    let finalTop = flipped
      ? Math.max(8, triggerRect.top - gap - maxHeight)
      : preferredTop;

    const availableSpace = window.innerHeight - finalTop - 8;
    const finalMaxHeight = Math.min(maxHeight, Math.max(availableSpace, 100));

    return { top: finalTop, left: finalLeft, width: finalWidth, maxHeight: finalMaxHeight };
  };

  // Compute position synchronously before browser paint — no measurement phase, no flicker
  useLayoutEffect(() => {
    if (isOpen) {
      setPosition(computePosition());
    }
  }, [isOpen, triggerRef, gap, maxHeight, minWidth, maxWidth]);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!isOpen) return;

    const handleReposition = () => {
      setPosition(computePosition());
    };

    window.addEventListener('scroll', handleReposition, { passive: true });
    window.addEventListener('resize', handleReposition, { passive: true });

    const scrollableContainers: Element[] = [];
    if (triggerRef.current) {
      let element = triggerRef.current.parentElement;
      while (element && element !== document.body) {
        const style = window.getComputedStyle(element);
        if (style.overflow === 'auto' || style.overflow === 'scroll' ||
            style.overflowY === 'auto' || style.overflowY === 'scroll' ||
            style.overflowX === 'auto' || style.overflowX === 'scroll') {
          scrollableContainers.push(element);
        }
        element = element.parentElement;
      }
    }

    scrollableContainers.forEach(container => {
      container.addEventListener('scroll', handleReposition, { passive: true });
    });

    return () => {
      window.removeEventListener('scroll', handleReposition);
      window.removeEventListener('resize', handleReposition);
      scrollableContainers.forEach(container => {
        container.removeEventListener('scroll', handleReposition);
      });
    };
  }, [isOpen, triggerRef, gap, maxHeight, minWidth, maxWidth]);

  // 🚨 ENHANCED: Global outside click handler with composedPath and better timing
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent | PointerEvent) => {
      const target = event.target as Node;


      // Use composedPath if available for better shadow DOM support
      const eventPath = event.composedPath ? event.composedPath() : [target];
      const elementsInPath = eventPath.filter(el => el instanceof Element) as Element[];

      // Don't close if clicking inside the dropdown
      if (dropdownRef.current && elementsInPath.some(el => dropdownRef.current?.contains(el))) {
        return;
      }

      // Don't close if clicking on the trigger element
      if (triggerRef.current && elementsInPath.some(el => triggerRef.current?.contains(el))) {
        return;
      }

      // Don't close if clicking on any vendor-related UI (for vendor dropdowns)
      if (field === 'vendor') {
        const hasVendorUI = elementsInPath.some(el =>
          el.closest?.('[data-vendor-autocomplete]') ||
          el.closest?.('.vendor-dropdown') ||
          el.closest?.('.vendor-modal') ||
          el.closest?.('.anchored-dropdown')
        );
        if (hasVendorUI) {
          return;
        }
      }

      // Don't close if clicking on status-option (for PO/PF sign status dropdowns)
      if (field === 'poSignStatus' || field === 'pfSignStatus') {
        const isStatusOption = elementsInPath.some(el =>
          el.classList?.contains('status-option') ||
          el.closest?.('.status-option')
        );
        if (isStatusOption) {
          return;
        }
      }

      // Don't close if clicking on any order-type-related UI (for order type dropdowns)
      if (field === 'orderType') {
        const hasOrderTypeUI = elementsInPath.some(el =>
          el.closest?.('[data-order-type-autocomplete]') ||
          el.closest?.('.order-type-dropdown') ||
          el.closest?.('.anchored-dropdown')
        );
        if (hasOrderTypeUI) {
          return;
        }
      }

      // Don't close if clicking on any status-related UI (for status dropdowns)
      if (field === 'status') {
        const hasStatusUI = elementsInPath.some(el =>
          el.closest?.('[data-status-autocomplete]') ||
          el.closest?.('.status-dropdown') ||
          el.closest?.('.anchored-dropdown')
        );
        if (hasStatusUI) {
          return;
        }
      }

      // Don't close if clicking on any container-related UI (for container dropdowns)
      if (field === 'containerNo') {
        const hasContainerUI = elementsInPath.some(el =>
          el.closest?.('.container-cell-editor') ||
          el.closest?.('.container-dropdown') ||
          el.closest?.('.container-options') ||
          el.closest?.('.container-option') ||
          el.closest?.('.container-cell-display') ||
          el.closest?.('.anchored-dropdown')
        );
        if (hasContainerUI) {
          return;
        }
      }

      // Don't close if clicking on any payment-rule-related UI (for payment rule dropdowns)
      if (field === 'paymentRule') {
        const hasPaymentRuleUI = elementsInPath.some(el =>
          el.closest?.('.payment-rule-dropdown-editor') ||
          el.closest?.('.payment-rule-option') ||
          el.closest?.('.anchored-dropdown')
        );
        if (hasPaymentRuleUI) {
          return;
        }
      }

      // Close on outside click
      onClose();
    };

    // 🚨 CRITICAL FIX: Use both mousedown and pointerdown with capture for better compatibility
    document.addEventListener('mousedown', handleOutsideClick, true);
    document.addEventListener('pointerdown', handleOutsideClick, true);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick, true);
      document.removeEventListener('pointerdown', handleOutsideClick, true);
    };
  }, [isOpen, onClose, triggerRef, field]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const dropdownStyle: React.CSSProperties = {
    position: 'fixed',
    top: `${position.top}px`,
    left: `${position.left}px`,
    width: `${position.width}px`,
    maxHeight: `${position.maxHeight}px`,
    overflowY: 'auto',
    zIndex: 99999,
    backgroundColor: 'white',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  };

  return createPortal(
    <div
      ref={dropdownRef}
      className={`anchored-dropdown ${className}`}
      style={dropdownStyle}
      tabIndex={0}
      onMouseDown={(e) => e.stopPropagation()} // Prevent outside click when clicking inside
    >
      {children}
    </div>,
    document.body
  );
};

export default AnchoredDropdown;
```

---

## FILE: constants.ts

```ts
// Layout constants for consistent sizing
export const ROW_HEIGHT = 40; // Single source of truth for row height in pixels
export const TOTAL_ROW_HEIGHT = 32; // Height for the total row at bottom
```

---

## FILE: contexts/AuthContext.tsx

```tsx
import React, { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { removeToken, restoreSession, getCurrentUser, logout as apiLogout, apiFetch } from '../lib/auth';

interface User {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  forcePasswordChange?: boolean;
  displayName?: string; // Computed stable display name
}

interface Role {
  id: string;
  name: string;
  isSystem: boolean;
  isActive: boolean;
}

interface Permission {
  key: string;
  module: string;
  action: string;
}

interface ColumnVisibility {
  columnKey: string;
  isHidden: boolean;
  isReadOnly: boolean;
}

interface UserAccessPolicy {
  columnsHidden: string[];
  columnsReadOnly: string[];
  rowScopes: Record<string, any>;
  modulePermissions: Record<string, any>;
  pagePermissions?: Record<string, boolean>; // DB-driven: { dashboard: true, suppliers_vendors: false, ... }
  allowedTypes?: { enumTypes: string[] | null; customTypeIds: string[] | null } | null;
  projectScope?: { enabled: boolean; projectIds: string[] } | null;
}

interface AuthContextType {
  user: User | null;
  role: Role | null;
  permissions: Permission[];
  columnVisibility: ColumnVisibility[];
  userAccessPolicy: UserAccessPolicy | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requiresPasswordChange: boolean;
  isAdmin: boolean; // DB-driven: true if role has admin_roles_permissions page access
  login: (user: User, role: Role, permissions: Permission[], columnVisibility?: ColumnVisibility[], userAccessPolicy?: UserAccessPolicy, isAdminFlag?: boolean) => void;
  logout: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
  canAccessPage: (pageKey: string) => boolean;
  getPagePermissions: () => Record<string, boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility[]>([]);
  const [userAccessPolicy, setUserAccessPolicy] = useState<UserAccessPolicy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const isAuthenticated = !!user;

  // Helper to compute stable displayName
  const computeDisplayName = (userData: Partial<User>): string => {
    if (userData.name) {
      return userData.name;
    }
    if (userData.email) {
      return userData.email.split('@')[0];
    }
    return 'User';
  };

  // Safe merge helper to preserve displayName
  const safeUserMerge = (prevUser: User | null, newUserData: any): User => {
    const displayName = prevUser?.displayName || computeDisplayName(newUserData);
    return {
      ...newUserData,
      displayName,
    };
  };

  const login = (userData: User, roleData: Role, permissionsData: Permission[], columnVisibilityData?: ColumnVisibility[], userAccessPolicyData?: UserAccessPolicy, isAdminFlag?: boolean) => {
    // Compute stable display name
    const userWithDisplayName: User = {
      ...userData,
      displayName: computeDisplayName(userData)
    };

    setUser(userWithDisplayName);
    setRole(roleData);
    setPermissions(permissionsData);
    setColumnVisibility(columnVisibilityData || []);
    setUserAccessPolicy(userAccessPolicyData || null);
    // isAdmin comes purely from backend (DB-driven)
    setIsAdmin(!!isAdminFlag);
    lastPermissionsRef.current = JSON.stringify(userAccessPolicyData?.pagePermissions || {});

  };

  const logout = async () => {
    try {
      // Call backend logout to clear refresh token cookie
      await apiLogout();
    } catch (error) {
      console.error('Logout failed:', error);
    }

    // Clear local state regardless of API success
    setUser(null);
    setRole(null);
    setPermissions([]);
    setColumnVisibility([]);
    setUserAccessPolicy(null);
    setIsAdmin(false);
  };

  // Track last known permissions for change detection
  const lastPermissionsRef = useRef<string>('');

  // Apply fetched auth data to state
  const applyAuthData = useCallback((data: any) => {
    const userWithDisplayName = safeUserMerge(user, data.user);
    setUser(userWithDisplayName);
    setRole(data.role);
    setPermissions(data.permissions);
    setColumnVisibility(data.columnVisibility || []);
    setUserAccessPolicy(data.userAccessPolicy || null);
    // isAdmin from backend is DB-driven (based on admin_roles_permissions page access)
    setIsAdmin(!!data.isAdmin);
    // Update ref
    lastPermissionsRef.current = JSON.stringify(data.userAccessPolicy?.pagePermissions || {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch permissions from backend (used when access is denied to pick up newly granted permissions)
  const refreshPermissions = useCallback(async () => {
    try {
      const data = await getCurrentUser();
      applyAuthData(data);
    } catch (error) {
      console.error('Failed to refresh permissions:', error);
    }
  }, [applyAuthData]);

  // Check if user is logged in on app start with refresh token support
  useEffect(() => {
    // Is the API answering at all? (false while it is starting / restarting / unreachable)
    const apiIsUp = async (): Promise<boolean> => {
      try {
        const res = await apiFetch('/api/health');
        if (res.status < 500) return true;
        // 503 from the API itself ("degraded": DB down) still means the API is running
        return res.status === 503 && (await res.json().catch(() => ({})))?.status === 'degraded';
      } catch {
        return false;
      }
    };

    const initAuth = async () => {
      // A failed restore only means "logged out" when the API is up. While it is starting or
      // restarting (e.g. local dev after a code change) keep the session and try again.
      for (let attempt = 0; ; attempt++) {
        try {
          // Attempt to restore session (will try refresh token if access token missing/expired)
          const userData = await restoreSession();
          applyAuthData(userData);
          break;
        } catch (error) {
          if (attempt < 20 && !(await apiIsUp())) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          // No valid session found, user will need to login
          removeToken();
          break;
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Permission sync - listens for socket events, falls back to 60s poll
  useEffect(() => {
    if (!user) return;

    const poll = async () => {
      try {
        const data = await getCurrentUser();
        const newPerms = JSON.stringify((data.userAccessPolicy as any)?.pagePermissions || {});
        if (newPerms !== lastPermissionsRef.current) {
          applyAuthData(data);
        }
      } catch {
        // Silently ignore
      }
    };

    // Fallback poll at 60s (socket events handle near-real-time)
    const intervalId = setInterval(poll, 60000);
    return () => clearInterval(intervalId);
  }, [user?.id, applyAuthData]); // eslint-disable-line react-hooks/exhaustive-deps

  const requiresPasswordChange = !!user?.forcePasswordChange;

  // PURE DB-DRIVEN: canAccessPage checks pagePermissions from backend
  const canAccessPage = (pageKey: string): boolean => {
    return userAccessPolicy?.pagePermissions?.[pageKey] || false;
  };

  // PURE DB-DRIVEN: getPagePermissions returns what backend sent
  const getPagePermissions = (): Record<string, boolean> => {
    return userAccessPolicy?.pagePermissions || {};
  };

  const value: AuthContextType = {
    user,
    role,
    permissions,
    columnVisibility,
    userAccessPolicy,
    isAuthenticated,
    isLoading,
    requiresPasswordChange,
    isAdmin,
    login,
    logout,
    refreshPermissions,
    canAccessPage,
    getPagePermissions,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
```

---

## FILE: contexts/PaymentRulesContext.tsx

```tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { PaymentRule, getPaymentRules } from '../lib/payment-rules';
import { useAuth } from './AuthContext';

interface PaymentRulesContextType {
  paymentRules: PaymentRule[];
  loading: boolean;
  error: string | null;
  refreshRules: () => Promise<void>;
  addRule: (rule: PaymentRule) => void;
}

const PaymentRulesContext = createContext<PaymentRulesContextType | undefined>(undefined);

export const usePaymentRules = () => {
  const context = useContext(PaymentRulesContext);
  if (context === undefined) {
    throw new Error('usePaymentRules must be used within a PaymentRulesProvider');
  }
  return context;
};

interface PaymentRulesProviderProps {
  children: React.ReactNode;
}

export const PaymentRulesProvider: React.FC<PaymentRulesProviderProps> = ({ children }) => {
  const [paymentRules, setPaymentRules] = useState<PaymentRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const refreshRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const rules = await getPaymentRules();
      setPaymentRules(rules);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment rules');
      console.error('❌ Failed to load payment rules:', err);
    } finally {
      setLoading(false);
    }
  };

  const addRule = (rule: PaymentRule) => {
    setPaymentRules(prev => [...prev, rule]);
  };

  // Wait for auth to be ready before fetching payment rules
  useEffect(() => {
    // Only fetch if:
    // 1. Auth is not loading (session has been restored or determined to not exist)
    // 2. User is authenticated
    if (!isAuthLoading && isAuthenticated) {
      refreshRules();
    } else if (!isAuthLoading && !isAuthenticated) {
    } else {
    }
  }, [isAuthenticated, isAuthLoading]);

  const value: PaymentRulesContextType = {
    paymentRules,
    loading,
    error,
    refreshRules,
    addRule
  };

  return (
    <PaymentRulesContext.Provider value={value}>
      {children}
    </PaymentRulesContext.Provider>
  );
};
```

---

## FILE: contexts/SocketContext.tsx

```tsx
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from './AuthContext';
import { apiFetch } from '../lib/auth';

/**
 * Real-time updates over Supabase Realtime (Broadcast).
 *
 * Replaces the old Socket.IO connection but keeps the same API
 * (`socket.on/off`, `joinRooms`, `leaveRooms`, `isConnected`, `userId`), so
 * pages and `useSocketEvent` didn't have to change.
 *
 * The backend publishes `{ event, data, excludeUserId? }` envelopes to the
 * channel `${channelPrefix}:${room}`; the prefix is only given out by the
 * authenticated GET /api/realtime/config.
 */

type Listener = (data: any) => void;

/** Minimal socket-like event emitter (what useSocketEvent relies on). */
export class RealtimeEmitter {
  private listeners = new Map<string, Set<Listener>>();

  on(event: string, listener: Listener) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener);
    return this;
  }

  off(event: string, listener?: Listener) {
    if (!listener) this.listeners.delete(event);
    else this.listeners.get(event)?.delete(listener);
    return this;
  }

  emit(event: string, data: any) {
    this.listeners.get(event)?.forEach((l) => {
      try {
        l(data);
      } catch (err) {
        console.error(`[Realtime] handler for "${event}" failed`, err);
      }
    });
  }
}

interface RealtimeConfig {
  enabled: boolean;
  url: string;
  key: string;
  channelPrefix: string;
  allRoom: string;
}

interface SocketContextType {
  socket: RealtimeEmitter | null;
  isConnected: boolean;
  userId: string | null;
  joinRooms: (rooms: string[]) => void;
  leaveRooms: (rooms: string[]) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

// Module-level state to survive React StrictMode double-mount
let _emitter: RealtimeEmitter | null = null;
let _client: SupabaseClient | null = null;
let _config: RealtimeConfig | null = null;
let _myUserId: string | null = null;
let _onStatus: ((connected: boolean) => void) | null = null;
const _desiredRooms = new Set<string>();
const _channels = new Map<string, RealtimeChannel>();

function dispatch(payload: any) {
  if (!payload || typeof payload.event !== 'string' || !_emitter) return;
  // Server asked to skip the user who made the change (they already have fresh data)
  if (payload.excludeUserId && payload.excludeUserId === _myUserId) return;
  _emitter.emit(payload.event, payload.data);
}

function subscribeRoom(room: string) {
  if (!_client || !_config || _channels.has(room)) return;
  const channel = _client
    .channel(`${_config.channelPrefix}:${room}`, { config: { broadcast: { self: false } } })
    .on('broadcast', { event: 'message' }, ({ payload }) => dispatch(payload))
    .subscribe((status) => {
      if (room !== _config?.allRoom) return;
      if (status === 'SUBSCRIBED') _onStatus?.(true);
      else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') _onStatus?.(false);
    });
  _channels.set(room, channel);
}

function unsubscribeRoom(room: string) {
  const channel = _channels.get(room);
  if (!channel) return;
  _channels.delete(room);
  _client?.removeChannel(channel);
}

function teardown() {
  _channels.forEach((ch) => _client?.removeChannel(ch));
  _channels.clear();
  _client?.realtime.disconnect();
  _client = null;
  _config = null;
}

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState<RealtimeEmitter | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  _myUserId = user?.id || null;

  useEffect(() => {
    if (!isAuthenticated) {
      teardown();
      _desiredRooms.clear();
      _emitter = null;
      setSocket(null);
      setIsConnected(false);
      return;
    }

    if (!_emitter) _emitter = new RealtimeEmitter();
    setSocket(_emitter);
    _onStatus = setIsConnected;

    // Already connected (StrictMode re-mount)
    if (_client) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/api/realtime/config');
        if (!res.ok) throw new Error(`config ${res.status}`);
        const cfg: RealtimeConfig = await res.json();
        if (cancelled || _client) return;
        if (!cfg.enabled) {
          console.warn('[Realtime] disabled on server');
          return;
        }
        _config = cfg;
        _client = createClient(cfg.url, cfg.key, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
          realtime: { params: { eventsPerSecond: 20 } },
        });
        subscribeRoom(cfg.allRoom);
        _desiredRooms.forEach(subscribeRoom);
      } catch (err: any) {
        console.warn('[Realtime] connection setup failed:', err?.message || err);
      }
    })();

    return () => {
      cancelled = true;
      // Don't disconnect on StrictMode re-mount; real logout is handled above
    };
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on actual unmount (when whole app unmounts)
  useEffect(() => {
    return () => {
      teardown();
      _desiredRooms.clear();
    };
  }, []);

  const joinRooms = useCallback((rooms: string[]) => {
    rooms.forEach((r) => {
      _desiredRooms.add(r);
      subscribeRoom(r);
    });
  }, []);

  const leaveRooms = useCallback((rooms: string[]) => {
    rooms.forEach((r) => {
      _desiredRooms.delete(r);
      unsubscribeRoom(r);
    });
  }, []);

  const value = useMemo<SocketContextType>(() => ({
    socket,
    isConnected,
    userId: user?.id || null,
    joinRooms,
    leaveRooms,
  }), [socket, isConnected, user?.id, joinRooms, leaveRooms]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
```

---

## FILE: hooks/useColumnPermissions.ts

```ts
import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  OPERATIONAL_BOARD_COLUMNS,
  ColumnKey,
  getMoneyColumns,
  getAllColumnKeys
} from '../lib/columns';

interface ColumnPermissions {
  isColumnVisible: (columnKey: ColumnKey) => boolean;
  isColumnHidden: (columnKey: ColumnKey) => boolean;
  isColumnReadOnly: (columnKey: ColumnKey) => boolean;
  isColumnEditable: (columnKey: ColumnKey) => boolean;
  getVisibleColumns: () => ColumnKey[];
  getHiddenColumns: () => ColumnKey[];
  getReadOnlyColumns: () => ColumnKey[];
  getEditableColumns: () => ColumnKey[];
  hasPermission: (columnKey: ColumnKey, action: 'view' | 'edit') => boolean;
  // Money column specific functionality
  isAnyMoneyColumnHidden: () => boolean;
  areAllMoneyColumnsHidden: () => boolean;
  shouldShowMoneyTotals: () => boolean;
  getVisibleMoneyColumns: () => ColumnKey[];
}


export const useColumnPermissions = (): ColumnPermissions => {
  const { userAccessPolicy } = useAuth();

  // Use userAccessPolicy from auth context (role-based + user-specific merged)

  const permissions = useMemo((): ColumnPermissions => {
    // Get all available column keys from canonical registry
    const allColumnKeys = getAllColumnKeys();

    // Extract user-specific permission arrays
    const userHiddenColumns = userAccessPolicy?.columnsHidden || [];
    const userReadOnlyColumns = userAccessPolicy?.columnsReadOnly || [];

    // Helper function to check if column is hidden
    const isColumnHidden = (columnKey: ColumnKey): boolean => {
      return userHiddenColumns.includes(columnKey);
    };

    // Helper function to check if column is visible
    const isColumnVisible = (columnKey: ColumnKey): boolean => {
      return !isColumnHidden(columnKey);
    };

    // Helper function to check if column is read-only
    const isColumnReadOnly = (columnKey: ColumnKey): boolean => {
      // If column is hidden, it's neither read-only nor editable in the traditional sense
      if (isColumnHidden(columnKey)) {
        return false;
      }
      return userReadOnlyColumns.includes(columnKey);
    };

    // Helper function to check if column is editable
    const isColumnEditable = (columnKey: ColumnKey): boolean => {
      // Column is editable if it's visible and not read-only
      return isColumnVisible(columnKey) && !isColumnReadOnly(columnKey);
    };

    // Helper function to get visible columns
    const getVisibleColumns = (): ColumnKey[] => {
      return allColumnKeys.filter(isColumnVisible);
    };

    // Helper function to get hidden columns
    const getHiddenColumns = (): ColumnKey[] => {
      return allColumnKeys.filter(isColumnHidden);
    };

    // Helper function to get read-only columns
    const getReadOnlyColumns = (): ColumnKey[] => {
      return allColumnKeys.filter(isColumnReadOnly);
    };

    // Helper function to get editable columns
    const getEditableColumns = (): ColumnKey[] => {
      return allColumnKeys.filter(isColumnEditable);
    };

    // Generic permission checker
    const hasPermission = (columnKey: ColumnKey, action: 'view' | 'edit'): boolean => {
      if (action === 'view') {
        return isColumnVisible(columnKey);
      } else if (action === 'edit') {
        return isColumnEditable(columnKey);
      }
      return false;
    };

    // Money column specific functionality
    const moneyColumns = getMoneyColumns();

    const isAnyMoneyColumnHidden = (): boolean => {
      return moneyColumns.some(col => isColumnHidden(col.key as ColumnKey));
    };

    const areAllMoneyColumnsHidden = (): boolean => {
      return moneyColumns.every(col => isColumnHidden(col.key as ColumnKey));
    };

    const shouldShowMoneyTotals = (): boolean => {
      // If ALL money columns are hidden, hide entire money total cluster
      // If ANY money column is visible, show totals (but only for visible columns)
      return !areAllMoneyColumnsHidden();
    };

    const getVisibleMoneyColumns = (): ColumnKey[] => {
      return moneyColumns
        .map(col => col.key as ColumnKey)
        .filter(isColumnVisible);
    };

    return {
      isColumnVisible,
      isColumnHidden,
      isColumnReadOnly,
      isColumnEditable,
      getVisibleColumns,
      getHiddenColumns,
      getReadOnlyColumns,
      getEditableColumns,
      hasPermission,
      isAnyMoneyColumnHidden,
      areAllMoneyColumnsHidden,
      shouldShowMoneyTotals,
      getVisibleMoneyColumns,
    };
  }, [userAccessPolicy]);

  return permissions;
};

// Additional utility functions for debugging and development
export const useColumnPermissionsDebug = () => {
  const { user } = useAuth();
  const permissions = useColumnPermissions();

  return {
    ...permissions,
    debug: {
      user,
      userAccessPolicy: (user as any)?.userAccessPolicy,
      allColumns: Object.keys(OPERATIONAL_BOARD_COLUMNS),
      visibleColumns: permissions.getVisibleColumns(),
      hiddenColumns: permissions.getHiddenColumns(),
      readOnlyColumns: permissions.getReadOnlyColumns(),
      editableColumns: permissions.getEditableColumns(),
    },
  };
};

// Hook for specific column permission checking (for performance in components)
export const useColumnPermission = (columnKey: ColumnKey) => {
  const permissions = useColumnPermissions();

  return useMemo(() => ({
    isVisible: permissions.isColumnVisible(columnKey),
    isHidden: permissions.isColumnHidden(columnKey),
    isReadOnly: permissions.isColumnReadOnly(columnKey),
    isEditable: permissions.isColumnEditable(columnKey),
    canView: permissions.hasPermission(columnKey, 'view'),
    canEdit: permissions.hasPermission(columnKey, 'edit'),
  }), [permissions, columnKey]);
};

export default useColumnPermissions;
```

---

## FILE: hooks/useLivePatchStore.ts

```ts
/**
 * useLivePatchStore — Cell-level live update engine.
 *
 * Tracks:
 *  - editingCells: cells currently being edited by the local user
 *  - pendingMutations: optimistic mutations waiting for server confirmation
 *  - queuedRemotePatches: remote patches that arrived while a cell was being edited
 *
 * Provides:
 *  - handlePatchEvent(): process incoming `entity:patched` socket events
 *  - markCellEditing / markCellIdle: track focus/blur
 *  - resolveConflict(): after user finishes editing a cell that has queued remote patches
 */
import { useRef, useCallback } from 'react';

// ───────────────────── Types ─────────────────────
export interface PatchEventPayload {
    entity: string;
    entityId: string;
    parentId: string;
    patch: Record<string, any>;
    updatedAt: string;
    updatedBy: string;
    mutationId: string;
}

export interface PendingMutation {
    entityId: string;
    field: string;
    oldValue: any;
    newValue: any;
    startedAt: number;
}

export interface QueuedRemotePatch {
    value: any;
    updatedAt: string;
    updatedBy: string;
}

export interface PatchResult {
    /** true = caller should apply this patch to local state */
    apply: boolean;
    /** the fields to apply (only set when apply=true) */
    patch?: Record<string, any>;
    /** entity info */
    entityId?: string;
    parentId?: string;
    /** true if the patch was queued for conflict resolution */
    queued?: boolean;
}

// ───────────────────── Hook ─────────────────────

export function useLivePatchStore() {
    // Use refs so handlers never go stale and no unnecessary rerenders
    const editingCellsRef = useRef<Set<string>>(new Set());
    const pendingMutationsRef = useRef<Map<string, PendingMutation>>(new Map());
    const queuedRemotePatchesRef = useRef<Map<string, QueuedRemotePatch>>(new Map());

    // ── Cell editing tracking ──

    const markCellEditing = useCallback((entityId: string, field: string) => {
        const key = `${entityId}:${field}`;
        editingCellsRef.current.add(key);
    }, []);

    const markCellIdle = useCallback((entityId: string, field: string) => {
        const key = `${entityId}:${field}`;
        editingCellsRef.current.delete(key);
    }, []);

    const isCellEditing = useCallback((entityId: string, field: string): boolean => {
        return editingCellsRef.current.has(`${entityId}:${field}`);
    }, []);

    // ── Pending mutations (optimistic UI) ──

    const addPendingMutation = useCallback(
        (mutationId: string, details: PendingMutation) => {
            pendingMutationsRef.current.set(mutationId, details);
        },
        [],
    );

    const confirmMutation = useCallback((mutationId: string) => {
        pendingMutationsRef.current.delete(mutationId);
    }, []);

    const rollbackMutation = useCallback((mutationId: string) => {
        const mutation = pendingMutationsRef.current.get(mutationId);
        pendingMutationsRef.current.delete(mutationId);
        return mutation; // caller can use oldValue to rollback
    }, []);

    // ── Remote patch queue (conflict resolution) ──

    const hasQueuedPatch = useCallback((entityId: string, field: string): boolean => {
        return queuedRemotePatchesRef.current.has(`${entityId}:${field}`);
    }, []);

    const getQueuedPatch = useCallback(
        (entityId: string, field: string): QueuedRemotePatch | undefined => {
            return queuedRemotePatchesRef.current.get(`${entityId}:${field}`);
        },
        [],
    );

    const clearQueuedPatch = useCallback((entityId: string, field: string) => {
        queuedRemotePatchesRef.current.delete(`${entityId}:${field}`);
    }, []);

    const clearAllQueuedPatches = useCallback((entityId: string) => {
        const keysToDelete: string[] = [];
        for (const key of queuedRemotePatchesRef.current.keys()) {
            if (key.startsWith(`${entityId}:`)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach((k) => queuedRemotePatchesRef.current.delete(k));
    }, []);

    // ── Core: handle an incoming patch event ──

    const handlePatchEvent = useCallback(
        (data: PatchEventPayload, myUserId: string): PatchResult => {
            const { entityId, parentId, patch, updatedBy, mutationId } = data;

            // Case 1: This is my own mutation echoed back — just confirm it
            if (updatedBy === myUserId) {
                if (pendingMutationsRef.current.has(mutationId)) {
                    confirmMutation(mutationId);
                }
                // Still apply the patch so server-confirmed values reach local state
                // (e.g., auto-computed fields like pfCode), but filter out
                // fields that are currently being edited by me
                const safePatch: Record<string, any> = {};
                for (const [field, value] of Object.entries(patch)) {
                    if (!editingCellsRef.current.has(`${entityId}:${field}`)) {
                        safePatch[field] = value;
                    }
                }
                return {
                    apply: Object.keys(safePatch).length > 0,
                    patch: safePatch,
                    entityId,
                    parentId,
                };
            }

            // Case 2: Another user's update — check for conflicts
            const safePatch: Record<string, any> = {};
            let hasQueued = false;

            for (const [field, value] of Object.entries(patch)) {
                const cellKey = `${entityId}:${field}`;

                if (editingCellsRef.current.has(cellKey)) {
                    // Cell is being edited locally — queue, don't overwrite
                    queuedRemotePatchesRef.current.set(cellKey, {
                        value,
                        updatedAt: data.updatedAt,
                        updatedBy,
                    });
                    hasQueued = true;
                } else {
                    // Cell is idle — safe to apply immediately
                    safePatch[field] = value;
                }
            }

            return {
                apply: Object.keys(safePatch).length > 0,
                patch: safePatch,
                entityId,
                parentId,
                queued: hasQueued,
            };
        },
        [confirmMutation],
    );

    // ── Conflict resolution ──

    /**
     * Called when user finishes editing a cell (blur/enter).
     * Returns the queued remote value if one exists, or null if no conflict.
     */
    const resolveConflict = useCallback(
        (entityId: string, field: string): QueuedRemotePatch | null => {
            const key = `${entityId}:${field}`;
            const queued = queuedRemotePatchesRef.current.get(key);
            if (!queued) return null;
            // Don't auto-clear — let the caller decide (Keep Mine vs Use Remote)
            return queued;
        },
        [],
    );

    /**
     * User chose "Keep Mine" — clear the queued patch, the user's API call wins.
     */
    const resolveKeepMine = useCallback((entityId: string, field: string) => {
        clearQueuedPatch(entityId, field);
        markCellIdle(entityId, field);
    }, [clearQueuedPatch, markCellIdle]);

    /**
     * User chose "Use Remote" — return the remote value for the caller to apply.
     */
    const resolveUseRemote = useCallback(
        (entityId: string, field: string): any | undefined => {
            const key = `${entityId}:${field}`;
            const queued = queuedRemotePatchesRef.current.get(key);
            clearQueuedPatch(entityId, field);
            markCellIdle(entityId, field);
            return queued?.value;
        },
        [clearQueuedPatch, markCellIdle],
    );

    return {
        // Cell editing
        markCellEditing,
        markCellIdle,
        isCellEditing,

        // Pending mutations
        addPendingMutation,
        confirmMutation,
        rollbackMutation,

        // Remote patch queue
        hasQueuedPatch,
        getQueuedPatch,
        clearQueuedPatch,
        clearAllQueuedPatches,

        // Core handler
        handlePatchEvent,

        // Conflict resolution
        resolveConflict,
        resolveKeepMine,
        resolveUseRemote,
    };
}

export type LivePatchStore = ReturnType<typeof useLivePatchStore>;
```

---

## FILE: hooks/usePagePermissions.ts

```ts
import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PagePermissions {
  operationalBoardView: boolean;
  createProject: boolean;
  canAddItems: boolean;
  canManageMasterData: boolean;
}

interface UsePagePermissionsReturn {
  pagePermissions: PagePermissions;
  canAccessOperationalBoard: boolean;
  canCreateProject: boolean;
  canAddItems: boolean;
  canManageMasterData: boolean;
  hasPageAccess: (page: keyof PagePermissions) => boolean;
}

export const usePagePermissions = (): UsePagePermissionsReturn => {
  const { userAccessPolicy } = useAuth();

  const pagePermissions = useMemo((): PagePermissions => {
    // Default permissions if not specified
    const defaultPermissions: PagePermissions = {
      operationalBoardView: true,
      createProject: true,
      canAddItems: true,
      canManageMasterData: true,
    };

    // ✨ FIXED: More robust permission handling with explicit fallbacks
    if (!userAccessPolicy?.pagePermissions) {
      return defaultPermissions;
    }

    // Merge user permissions with defaults to ensure all permissions are defined
    const userPagePermissions = userAccessPolicy.pagePermissions;
    return {
      operationalBoardView: userPagePermissions.operationalBoardView ?? defaultPermissions.operationalBoardView,
      createProject: userPagePermissions.createProject ?? defaultPermissions.createProject,
      canAddItems: userPagePermissions.canAddItems ?? defaultPermissions.canAddItems,
      canManageMasterData: userPagePermissions.canManageMasterData ?? defaultPermissions.canManageMasterData,
    };
  }, [userAccessPolicy]);

  const canAccessOperationalBoard = pagePermissions.operationalBoardView;
  const canCreateProject = pagePermissions.createProject;
  const canAddItems = pagePermissions.canAddItems;
  const canManageMasterData = pagePermissions.canManageMasterData;

  const hasPageAccess = (page: keyof PagePermissions): boolean => {
    return pagePermissions[page] || false;
  };

  return {
    pagePermissions,
    canAccessOperationalBoard,
    canCreateProject,
    canAddItems,
    canManageMasterData,
    hasPageAccess,
  };
};

export default usePagePermissions;
```

---

## FILE: hooks/useSocketEvent.ts

```ts
import { useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';

/**
 * Subscribe to a Socket.IO event. Handler is called whenever the event fires.
 * Automatically cleans up on unmount.
 */
export function useSocketEvent(event: string, handler: (data: any) => void) {
  const { socket } = useSocket();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!socket) return;

    const listener = (data: any) => handlerRef.current(data);
    socket.on(event, listener);

    return () => {
      socket.off(event, listener);
    };
  }, [socket, event]);
}
```

---

## FILE: hooks/useUndoStack.ts

```ts
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/auth';

export interface UndoEntry {
  entityType: 'projectItem' | 'directOrderItem' | 'missingExtraItem' | 'expensesPItem' | 'trustStockItem';
  entityId: string;
  parentId: string;
  previousValues: Record<string, any>;
  timestamp: number;
  description: string;
}

const MAX_STACK_SIZE = 3;

// ====================== GLOBAL SINGLETON ======================
// Single stack shared across ALL ProjectBlock instances.
// This prevents duplicate listeners and ensures CTRL+Z always
// undoes the globally-last mutation regardless of which project it was in.

let globalStack: UndoEntry[] = [];
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

function globalPush(entry: Omit<UndoEntry, 'timestamp'>) {
  globalStack = [...globalStack, { ...entry, timestamp: Date.now() }].slice(-MAX_STACK_SIZE);
  notifyListeners();
}

function getEndpoint(entityType: UndoEntry['entityType'], entityId: string): string {
  switch (entityType) {
    case 'projectItem':
      return `/api/projects/items/${entityId}`;
    case 'directOrderItem':
      return `/api/direct-orders/items/${entityId}`;
    case 'missingExtraItem':
      return `/api/missing-extra/items/${entityId}`;
    case 'expensesPItem':
      return `/api/expenses-p/items/${entityId}`;
    case 'trustStockItem':
      return `/api/trust-stock/items/${entityId}`;
  }
}

// Track undo-complete callbacks per parentId so the correct project refetches
const undoCompleteCallbacks = new Map<string, () => void>();

export function registerUndoCallback(parentId: string, callback: () => void) {
  undoCompleteCallbacks.set(parentId, callback);
}

export function unregisterUndoCallback(parentId: string) {
  undoCompleteCallbacks.delete(parentId);
}

// Simple floating toast for undo feedback
function showUndoToast(message: string) {
  const existing = document.getElementById('undo-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'undo-toast';
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#333',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: '99999',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    transition: 'opacity 0.3s',
    opacity: '1',
  });
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

let isUndoing = false;

async function globalUndo(): Promise<UndoEntry | null> {
  if (globalStack.length === 0 || isUndoing) return null;
  isUndoing = true;

  const entry = globalStack[globalStack.length - 1];
  globalStack = globalStack.slice(0, -1);
  notifyListeners();

  try {
    const endpoint = getEndpoint(entry.entityType, entry.entityId);
    await apiFetch(endpoint, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry.previousValues),
    });

    // Call the undo-complete callback for the affected project
    const cb = undoCompleteCallbacks.get(entry.parentId);
    if (cb) cb();

    showUndoToast(`Geri alindi: ${entry.description}`);
    return entry;
  } catch (error) {
    console.error('Undo failed:', error);
    return null;
  } finally {
    isUndoing = false;
  }
}

// ====================== GLOBAL KEYBOARD LISTENER ======================
// Single listener, registered once on first hook mount

let keyboardListenerRegistered = false;

function ensureKeyboardListener() {
  if (keyboardListenerRegistered) return;
  keyboardListenerRegistered = true;

  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      // Allow native undo ONLY when actively typing in a focused input
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      if (isInput && document.activeElement === target) {
        // Check if the input has actual text selection/content being edited right now
        const input = target as HTMLInputElement;
        if (input.value && input.value.length > 0) {
          return; // Let browser handle native undo inside the input
        }
      }

      e.preventDefault();
      globalUndo();
    }
  });
}

// ====================== REACT HOOK ======================

export function useUndoStack(onUndoComplete?: () => void, parentId?: string) {
  const [stackSize, setStackSize] = useState(globalStack.length);

  // Register keyboard listener once
  useEffect(() => {
    ensureKeyboardListener();
  }, []);

  // Subscribe to stack changes
  useEffect(() => {
    const listener = () => setStackSize(globalStack.length);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  // Register undo-complete callback for this project
  useEffect(() => {
    if (parentId && onUndoComplete) {
      registerUndoCallback(parentId, onUndoComplete);
      return () => unregisterUndoCallback(parentId);
    }
  }, [parentId, onUndoComplete]);

  const push = useCallback((entry: Omit<UndoEntry, 'timestamp'>) => {
    globalPush(entry);
  }, []);

  const undo = useCallback(async () => {
    return globalUndo();
  }, []);

  return {
    push,
    undo,
    canUndo: stackSize > 0,
    stackSize,
  };
}
```

---

## FILE: lib/api.ts

```ts
/**
 * API Client for Trust Project
 * Handles authentication and HTTP requests to the backend
 */

interface ApiConfig {
  baseURL: string;
  timeout?: number;
}

interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor(config: ApiConfig) {
    this.baseURL = config.baseURL.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = config.timeout || 10000; // Default 10 seconds
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
      };
    }
    return {};
  }

  private async makeRequest(endpoint: string, config: RequestConfig): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
      ...(config.headers || {}),
    };

    const requestConfig: RequestInit = {
      method: config.method,
      headers,
      credentials: 'include', // Include cookies for refresh token
      signal: AbortSignal.timeout(this.timeout),
    };

    if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
      requestConfig.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, requestConfig);

      // Handle non-JSON responses (like 204 No Content)
      if (response.status === 204) {
        return null;
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        data = null;
      }

      if (!response.ok) {
        const errorMessage = data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
          throw new Error('Request timed out. Please try again.');
        }
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  async get(endpoint: string, headers?: Record<string, string>): Promise<any> {
    return this.makeRequest(endpoint, { method: 'GET', headers });
  }

  async post(endpoint: string, body?: any, headers?: Record<string, string>): Promise<any> {
    return this.makeRequest(endpoint, { method: 'POST', body, headers });
  }

  async put(endpoint: string, body?: any, headers?: Record<string, string>): Promise<any> {
    return this.makeRequest(endpoint, { method: 'PUT', body, headers });
  }

  async patch(endpoint: string, body?: any, headers?: Record<string, string>): Promise<any> {
    return this.makeRequest(endpoint, { method: 'PATCH', body, headers });
  }

  async delete(endpoint: string, headers?: Record<string, string>): Promise<any> {
    return this.makeRequest(endpoint, { method: 'DELETE', headers });
  }
}

// Create and export a configured instance
const getBaseURL = () => {
  // All /api/* requests are proxied:
  // Dev: Vite proxy (vite.config.ts) → localhost:3001
  // Prod: Vercel rewrite (vercel.json) → Railway backend
  return "";
};

export const apiClient = new ApiClient({
  baseURL: getBaseURL(),
  timeout: 15000, // 15 seconds
});

// Export the class for custom instances if needed
export { ApiClient };
```

---

## FILE: lib/auth.ts

```ts
// Auth API helper
// Force relative URLs in production to use Vercel proxy
const API_URL = import.meta.env.PROD
  ? "" // Use same-origin via Vercel rewrite in production
  : (import.meta.env.VITE_API_URL || "http://localhost:3001/api");

// Production API URL logging
if (import.meta.env.PROD) {
}

// Helper function to construct API URLs
const buildApiUrl = (path: string): string => {
  if (API_URL) {
    return `${API_URL}${path}`;
  }
  return `/api${path}`;
};

export interface LoginCredentials {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

export interface ColumnVisibility {
  columnKey: string;
  isHidden: boolean;
  isReadOnly: boolean;
}

export interface UserAccessPolicy {
  columnsHidden: string[];
  columnsReadOnly: string[];
  rowScopes: Record<string, any>;
  modulePermissions: Record<string, any>;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    isActive: boolean;
  };
  role: {
    id: string;
    name: string;
    isSystem: boolean;
    isActive: boolean;
  };
  permissions: Array<{
    key: string;
    module: string;
    action: string;
  }>;
  columnVisibility?: ColumnVisibility[];
  userAccessPolicy?: UserAccessPolicy;
  isAdmin?: boolean; // 🚨 CRITICAL: Admin flag from backend
}

export interface MeResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    isActive: boolean;
    forcePasswordChange?: boolean;
    createdAt: string;
  };
  role: {
    id: string;
    name: string;
    isSystem: boolean;
    isActive: boolean;
  };
  permissions: Array<{
    key: string;
    module: string;
    action: string;
  }>;
  columnVisibility: ColumnVisibility[];
  userAccessPolicy: UserAccessPolicy;
  isAdmin: boolean; // 🚨 CRITICAL: Admin flag from backend
}

export interface AuthError {
  message: string;
  statusCode: number;
  error: string;
}

// Token storage helpers
export const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('auth_token');
};

// Refresh token helper
export const refreshToken = async (): Promise<{ accessToken: string }> => {
  const response = await fetch(buildApiUrl('/auth/refresh'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include httpOnly cookies
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Token refresh failed');
  }

  return data;
};

// Central API client with auto-refresh
export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const makeRequest = (token?: string) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Construct full URL - handle same-origin proxy in production
    const fullUrl = url.startsWith('/api') ?
      (API_URL ? `${API_URL}${url.substring(4)}` : url) :
      url;

    return fetch(fullUrl, {
      ...options,
      headers,
      credentials: 'include', // Always include cookies for refresh token
    });
  };

  // First attempt with current token
  const token = getToken();
  let response = await makeRequest(token || undefined);
  
  // If 401, try to refresh token and retry once
  if (response.status === 401 && token) {

    try {
      const refreshData = await refreshToken();
      setToken(refreshData.accessToken);


      // Retry original request with new token
      response = await makeRequest(refreshData.accessToken);
    } catch (refreshError) {
      console.error('❌ Token refresh failed:', refreshError);

      // Clear token and let the app handle redirect to login
      removeToken();
      throw new Error('Session expired, please log in again');
    }
  }
  
  return response;
};

// API calls
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await fetch(buildApiUrl('/auth/login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include for refresh token cookie
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }

  // Store token
  setToken(data.accessToken);


  return data;
};

export const logout = async (): Promise<void> => {
  // Always clear local token first to prevent race conditions
  removeToken();

  try {
    // Call backend to revoke refresh token and clear httpOnly cookie
    const fullUrl = API_URL ? `${API_URL}/auth/logout` : '/api/auth/logout';
    await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Send httpOnly cookie so backend can clear it
    });
  } catch (error) {
    console.error('Logout API call failed:', error);
  }
};

export const getCurrentUser = async (): Promise<MeResponse> => {
  // Try to get user info, apiFetch will handle token refresh if needed
  try {
    const response = await apiFetch('/api/auth/me');

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get user info');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Create authenticated request helper (DEPRECATED - use apiFetch instead)
export const createAuthenticatedRequest = (url: string, options: RequestInit = {}) => {
  console.warn('⚠️  createAuthenticatedRequest is deprecated, use apiFetch instead');
  return apiFetch(url, options);
};

// Session restoration from refresh token
export const restoreSession = async (): Promise<MeResponse> => {

  const token = getToken();

  // If no access token, try refresh token first
  if (!token) {

    try {
      const refreshData = await refreshToken();
      setToken(refreshData.accessToken);
    } catch (error) {
      throw new Error('No valid session found');
    }
  }

  // Now get current user (this will also handle any additional token refresh if needed)
  return getCurrentUser();
};
```

---

## FILE: lib/columns.ts

```ts
/**
 * CANONICAL COLUMN REGISTRY - Single Source of Truth
 *
 * This is the authoritative definition of all columns used in the Operational Board.
 * Any column changes must be made here first.
 *
 * Used by:
 * - Operational Board header render
 * - Body render
 * - Total row render
 * - Permission UI generation
 * - Backend validation
 */

export interface ColumnDefinition {
  key: string;
  label: string;
  group: 'project' | 'vendor' | 'status' | 'dates' | 'money' | 'logistics';
  width: string;
  isMoney: boolean;
  isEditableByDefault: boolean;
  description?: string;
}

// CANONICAL COLUMN REGISTRY
export const OPERATIONAL_BOARD_COLUMNS: Record<string, ColumnDefinition> = {
  projectNo: {
    key: 'projectNo',
    label: 'Project No',
    group: 'project',
    width: '120px',
    isMoney: false,
    isEditableByDefault: false,
    description: 'Project identifier number'
  },
  type: {
    key: 'type',
    label: 'Type',
    group: 'project',
    width: '100px',
    isMoney: false,
    isEditableByDefault: true,
    description: 'Project item type (Millwork, Shelving, etc.)'
  },
  pfCode: {
    key: 'pfCode',
    label: 'PF Code',
    group: 'project',
    width: '120px',
    isMoney: false,
    isEditableByDefault: false,
    description: 'Auto-generated project code'
  },
  vendor: {
    key: 'vendor',
    label: 'Vendor',
    group: 'vendor',
    width: '150px',
    isMoney: false,
    isEditableByDefault: true,
    description: 'Assigned vendor for this item'
  },
  orderType: {
    key: 'orderType',
    label: 'Order Type',
    group: 'vendor',
    width: '140px',
    isMoney: false,
    isEditableByDefault: true,
    description: 'Type of order (Standard, Custom, etc.)'
  },
  poSignStatus: {
    key: 'poSignStatus',
    label: 'PO Sign Status',
    group: 'status',
    width: '130px',
    isMoney: false,
    isEditableByDefault: true,
    description: 'Purchase order signature status'
  },
  pfSignStatus: {
    key: 'pfSignStatus',
    label: 'PF Sign Status',
    group: 'status',
    width: '130px',
    isMoney: false,
    isEditableByDefault: true,
    description: 'Project form signature status'
  },
  status: {
    key: 'status',
    label: 'Status',
    group: 'status',
    width: '140px',
    isMoney: false,
    isEditableByDefault: true,
    description: 'Current project status'
  },
  std: {
    key: 'std',
    label: 'STD',
    group: 'dates',
    width: '140px',
    isMoney: false,
    isEditableByDefault: true,
    description: 'Start To Deliver date'
  },
  etd: {
    key: 'etd',
    label: 'ETD',
    group: 'dates',
    width: '140px',
    isMoney: false,
    isEditableByDefault: true,
    description: 'Expected To Deliver date'
  },
  rtd: {
    key: 'rtd',
    label: 'RTD',
    group: 'dates',
    width: '140px',
    isMoney: false,
    isEditableByDefault: true,
    description: 'Ready To Deliver date'
  },
  rtr: {
    key: 'rtr',
    label: 'RTR',
    group: 'dates',
    width: '140px',
    isMoney: false,
    isEditableByDefault: true,
    description: 'Ready To Receive date'
  },
  rdy: {
    key: 'rdy',
    label: 'RDY',
    group: 'dates',
    width: '140px',
    isMoney: false,
    isEditableByDefault: false,
    description: 'Ready date (auto-set when status → READY)'
  },
  ftd: {
    key: 'ftd',
    label: 'FTD',
    group: 'dates',
    width: '140px',
    isMoney: false,
    isEditableByDefault: true,
    description: 'Final Target Delivery date'
  },
  snd: {
    key: 'snd',
    label: 'SND',
    group: 'dates',
    width: '140px',
    isMoney: false,
    isEditableByDefault: false,
    description: 'Sent date (auto-set when status → SENT)'
  },
  pfUsd: {
    key: 'pfUsd',
    label: 'PF USD',
    group: 'money',
    width: '120px',
    isMoney: true,
    isEditableByDefault: true,
    description: 'Project fee in USD'
  },
  pfTl: {
    key: 'pfTl',
    label: 'PF TL',
    group: 'money',
    width: '120px',
    isMoney: true,
    isEditableByDefault: true,
    description: 'Project fee in Turkish Lira'
  },
  paymentRule: {
    key: 'paymentRule',
    label: 'Payment Rule',
    group: 'logistics',
    width: '180px',
    isMoney: false,
    isEditableByDefault: true,
    description: 'Payment agreement terms (e.g., 50/50, 100% upfront)'
  },
  containerNo: {
    key: 'containerNo',
    label: 'Container No',
    group: 'logistics',
    width: '130px',
    isMoney: false,
    isEditableByDefault: true,
    description: 'Container number for shipping'
  },
  containerDate: {
    key: 'containerDate',
    label: 'Container Date',
    group: 'logistics',
    width: '140px',
    isMoney: false,
    isEditableByDefault: true,
    description: 'Container shipping date'
  },
  expensesUsd: {
    key: 'expensesUsd',
    label: 'EXPENSES / USD',
    group: 'money',
    width: '160px',
    isMoney: true,
    isEditableByDefault: true,
    description: 'Expenses amount in USD'
  },
  expensesTl: {
    key: 'expensesTl',
    label: 'EXPENSES / TL',
    group: 'money',
    width: '160px',
    isMoney: true,
    isEditableByDefault: true,
    description: 'Expenses amount in Turkish Lira'
  },
  invoice: {
    key: 'invoice',
    label: 'INV/USD',
    group: 'money',
    width: '160px',
    isMoney: true,
    isEditableByDefault: true,
    description: 'Invoice amount in USD'
  },
  invoiceTl: {
    key: 'invoiceTl',
    label: 'INV/TL',
    group: 'money',
    width: '160px',
    isMoney: true,
    isEditableByDefault: true,
    description: 'Invoice amount in Turkish Lira'
  },
} as const;

// Type exports
export type ColumnKey = keyof typeof OPERATIONAL_BOARD_COLUMNS;
export type ColumnGroup = 'project' | 'vendor' | 'status' | 'dates' | 'money' | 'logistics';

// Helper functions
export const getColumnDefinition = (key: ColumnKey): ColumnDefinition => {
  return OPERATIONAL_BOARD_COLUMNS[key];
};

export const getColumnsByGroup = (group: ColumnGroup): ColumnDefinition[] => {
  return Object.values(OPERATIONAL_BOARD_COLUMNS).filter(col => col.group === group);
};

export const getMoneyColumns = (): ColumnDefinition[] => {
  return Object.values(OPERATIONAL_BOARD_COLUMNS).filter(col => col.isMoney);
};

export const getEditableColumns = (): ColumnDefinition[] => {
  return Object.values(OPERATIONAL_BOARD_COLUMNS).filter(col => col.isEditableByDefault);
};

export const getAllColumnKeys = (): ColumnKey[] => {
  return Object.keys(OPERATIONAL_BOARD_COLUMNS) as ColumnKey[];
};

export const isValidColumnKey = (key: string): key is ColumnKey => {
  return key in OPERATIONAL_BOARD_COLUMNS;
};

export const validateColumnKeys = (keys: string[]): { valid: ColumnKey[], invalid: string[] } => {
  const valid: ColumnKey[] = [];
  const invalid: string[] = [];

  keys.forEach(key => {
    if (isValidColumnKey(key)) {
      valid.push(key);
    } else {
      invalid.push(key);
    }
  });

  return { valid, invalid };
};

// Generate grid template columns for CSS Grid
export const generateGridTemplateColumns = (visibleColumns: ColumnKey[]): string => {
  return visibleColumns
    .map(key => OPERATIONAL_BOARD_COLUMNS[key].width)
    .join(' ');
};
```

---

## FILE: lib/containers.ts

```ts
import { apiFetch } from './auth';

export interface GlobalContainerDate {
  containerNo: string;
  containerDate: string | null;
  itemId: string;
  projectId: string;
  projectType: 'project' | 'directOrder' | 'missingExtra';
  itemType: string | null;
  updatedAt: string;
}

export interface SyncContainerDateResponse {
  updated: number;
  details: GlobalContainerDate[];
}

/**
 * 🔍 GLOBAL SEARCH: Find latest container date across all projects
 */
export async function getLatestContainerDate(containerNo: string): Promise<string | null> {
  try {

    const response = await apiFetch(`/api/containers/latest-date?containerNo=${encodeURIComponent(containerNo)}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch container date: ${response.status}`);
    }

    const data = await response.json();


    // ✅ FIX: Handle both possible response formats
    const latestDate = data?.latestDate || data?.containerDate || data;


    return latestDate;
  } catch (error) {
    console.error('❌ Failed to get latest container date:', error);
    return null;
  }
}

/**
 * 📊 SEARCH: Find all containers with dates across projects
 */
export async function searchContainers(containerNo?: string): Promise<GlobalContainerDate[]> {
  try {
    const url = containerNo
      ? `/api/containers/search?containerNo=${encodeURIComponent(containerNo)}`
      : '/api/containers/search';

    const response = await apiFetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to search containers: ${response.status}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('❌ Failed to search containers:', error);
    return [];
  }
}

/**
 * 🔄 GLOBAL SYNC: Update all items with same container number across all projects
 */
export async function syncContainerDate(containerNo: string, containerDate: string | null): Promise<SyncContainerDateResponse> {
  try {

    const response = await apiFetch('/api/containers/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        containerNo,
        containerDate
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync container date: ${response.status}`);
    }

    const data = await response.json();


    return data;
  } catch (error) {
    console.error('❌ Failed to sync container date:', error);
    throw error;
  }
}

/**
 * ✏️ RENAME: Rename container globally across all item tables
 */
export async function renameContainerGlobally(oldName: string, newName: string): Promise<{ oldName: string; newName: string; updatedItems: number }> {
  try {

    const response = await apiFetch('/api/containers/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldName, newName }),
    });

    if (!response.ok) {
      throw new Error(`Failed to rename container: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to rename container:', error);
    throw error;
  }
}

/**
 * 📋 Get all unique container names currently in use
 */
export async function getContainerNames(): Promise<string[]> {
  try {
    const response = await apiFetch('/api/containers/names', { method: 'GET' });

    if (!response.ok) {
      throw new Error(`Failed to get container names: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get container names:', error);
    return [];
  }
}

/**
 * 📈 STATS: Get container statistics across all projects
 */
export async function getContainerStats(): Promise<{
  totalContainers: number;
  containersWithDates: number;
  uniqueContainerNumbers: number;
  projectTypes: {
    project: number;
    directOrder: number;
    missingExtra: number;
  }
}> {
  try {
    const response = await apiFetch('/api/containers/stats', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to get container stats: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Failed to get container stats:', error);
    return {
      totalContainers: 0,
      containersWithDates: 0,
      uniqueContainerNumbers: 0,
      projectTypes: {
        project: 0,
        directOrder: 0,
        missingExtra: 0
      }
    };
  }
}
```

---

## FILE: lib/dateUtils.ts

```ts
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
```

---

## FILE: lib/direct-orders.ts

```ts
// Direct Order API functions - mirrors projects.ts structure

import { Project, CreateProjectData, ProjectsData } from '../types';
import { apiFetch } from './auth';
import { mapTypeToEnum, ProjectHalf } from './projects';

// ===================== PROJECT API FUNCTIONS =====================

export async function getDirectOrders(bucket?: string): Promise<ProjectsData> {

  let url = '/api/direct-orders';
  if (bucket) {
    url += `?bucket=${bucket}`;
  }

  const response = await apiFetch(url, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ DIRECT_ORDER_FETCH_FAIL', {
      status: response.status,
      statusText: response.statusText,
      bodyPreview: errorText.substring(0, 200),
    });
    throw new Error(`Failed to fetch direct orders: ${response.statusText}`);
  }

  const data = await response.json();
  

  return data;
}

export async function bulkAssignDirectOrderHalf(
  projectIds: string[],
  halfOfYear: ProjectHalf | null,
  halfYear: number | null,
): Promise<{ updatedCount: number }> {
  const response = await apiFetch('/api/direct-orders/bulk/half', {
    method: 'PATCH',
    body: JSON.stringify({ projectIds, halfOfYear, halfYear }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to assign half');
  }

  return response.json();
}

export async function getDirectOrderById(projectId: string): Promise<Project> {

  const response = await apiFetch(`/api/direct-orders/${projectId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch direct order: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

export async function createDirectOrder(data: CreateProjectData): Promise<Project> {

  // Convert frontend display types to backend enum values
  const backendTypes = data.types?.map(type => mapTypeToEnum(type)) || [];

  const response = await apiFetch('/api/direct-orders', {
    method: 'POST',
    body: JSON.stringify({
      projectNo: data.projectNo,
      name: data.name,
      address: data.address,
      bucket: data.bucket,
      description: data.description,
      status: data.status || 'PRE_PROJECT',
      types: backendTypes, // ✅ FIX: Convert display values to enum values
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('❌ Direct order creation error:', errorData);
    throw new Error(errorData.message || `Failed to create direct order: ${response.statusText}`);
  }

  const result = await response.json();
  return result;
}

export async function updateDirectOrder(projectId: string, data: Partial<CreateProjectData>): Promise<Project> {
  const response = await apiFetch(`/api/direct-orders/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update direct order: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteDirectOrder(projectId: string): Promise<void> {
  const response = await apiFetch(`/api/direct-orders/${projectId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete direct order: ${response.statusText}`);
  }
}

// ===================== ITEM API FUNCTIONS =====================

export async function createDirectOrderItem(projectId: string, data: any): Promise<any> {

  const response = await apiFetch(`/api/direct-orders/${projectId}/items`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('❌ Direct order item creation error:', errorData);
    throw new Error(errorData.message || `Failed to create direct order item: ${response.statusText}`);
  }

  const result = await response.json();
  return result;
}

export async function updateDirectOrderItem(
  projectId: string,
  itemId: string,
  data: Record<string, any>
): Promise<any> {

  const response = await apiFetch(`/api/direct-orders/${projectId}/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [DIRECT ORDER UPDATE] API Error:', {
      status: response.status,
      statusText: response.statusText,
      responseText: errorText,
      requestData: data,
      projectId,
      itemId,
      url: `/api/direct-orders/${projectId}/items/${itemId}`,
      timestamp: new Date().toISOString()
    });

    try {
      const errorData = JSON.parse(errorText);
      throw new Error(errorData.message || `Failed to update direct order item: ${response.statusText}`);
    } catch (parseError) {
      throw new Error(`Failed to update direct order item: ${response.statusText} - ${errorText}`);
    }
  }

  const result = await response.json();
  return result;
}

export async function deleteDirectOrderItem(projectId: string, itemId: string): Promise<void> {
  const response = await apiFetch(`/api/direct-orders/${projectId}/items/${itemId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete direct order item: ${response.statusText}`);
  }
}
```

---

## FILE: lib/displayHelpers.ts

```ts
/**
 * Display Helper Functions
 *
 * Utilities for formatting and displaying data consistently across the application.
 */

/**
 * Remove "P" prefix from project numbers for UI display
 *
 * @param projectNo - Project number (can be string or number)
 * @returns Project number without "P" prefix for display
 *
 * Examples:
 *   "P601" -> "601"
 *   "P0007" -> "0007" (preserves leading zeros)
 *   "601" -> "601" (no change if no P prefix)
 *   "PX12" -> "PX12" (no change if P is not followed by digits)
 */
export const displayProjectNo = (projectNo: string | number): string => {
  const str = String(projectNo || '');

  // Check if it starts with "P" followed by digits only
  if (str.match(/^P\d+$/)) {
    return str.substring(1); // Remove the "P" prefix
  }

  // Return as-is if it doesn't match the pattern
  return str;
};

/**
 * Detect the "_OLD_<timestamp>" suffix that the team uses to mark a project
 * that was kept around when the same project number was re-created from the UI.
 *
 *   "1185"                       -> { kind: 'active', cleanCode: '1185' }
 *   "1185_OLD_1778145894409"     -> { kind: 'old',    cleanCode: '1185', timestamp: 1778145894409 }
 *
 * The badge in the operational table renders off this. We never mutate data
 * here — purely a display-time classification.
 */
export interface DuplicateMarker {
  kind: 'old' | 'active';
  cleanCode: string;
  timestamp?: number;
}

const OLD_SUFFIX_RE = /^(.*)_OLD_(\d+)$/;

export const parseDuplicateMarker = (projectNo: string | number): DuplicateMarker => {
  const str = String(projectNo || '');
  const match = str.match(OLD_SUFFIX_RE);
  if (match) {
    return { kind: 'old', cleanCode: match[1], timestamp: Number(match[2]) };
  }
  return { kind: 'active', cleanCode: str };
};
```

---

## FILE: lib/expenses-direct-order.ts

```ts
import { apiFetch } from './auth';
import type { ExpensesDirectOrderProject, ExpensesDirectOrderItem, ExpensesDirectOrderProjectsResponse } from '../types/expensesDirectOrder';
import type { Project } from '../types';
import type { BackendProjectItem } from './projects';
import { mapBackendTypeToFrontend } from './projects';

const API_BASE = '/api/expenses-direct-order';

export async function getExpensesDirectOrderProjects(): Promise<ExpensesDirectOrderProject[]> {
  const res = await apiFetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error('Failed to fetch expenses direct order projects');
  const json: ExpensesDirectOrderProjectsResponse = await res.json();
  return json.data;
}

export async function createExpensesDirectOrderProject(data: {
  bucket: string;
  projectNo: string;
  name: string;
}): Promise<ExpensesDirectOrderProject> {
  const res = await apiFetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create project');
  }
  return res.json();
}

export async function deleteExpensesDirectOrderProject(projectId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/projects/${projectId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete project');
}

export async function createExpensesDirectOrderItem(
  projectId: string,
  data: Partial<ExpensesDirectOrderItem>,
): Promise<ExpensesDirectOrderItem> {
  const res = await apiFetch(`${API_BASE}/projects/${projectId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create item');
  return res.json();
}

export async function updateExpensesDirectOrderItem(
  itemId: string,
  data: Partial<ExpensesDirectOrderItem>,
): Promise<ExpensesDirectOrderItem> {
  const res = await apiFetch(`${API_BASE}/items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update item');
  return res.json();
}

export async function deleteExpensesDirectOrderItem(itemId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/items/${itemId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete item');
}

export function mapExpensesDOItemToBackendItem(item: ExpensesDirectOrderItem): BackendProjectItem {
  return {
    id: item.id,
    projectId: item.projectId,
    type: item.type as BackendProjectItem['type'],
    customTypeId: item.customTypeId,
    customType: item.customType,
    pfCode: null,
    vendorId: item.vendorId,
    orderType: item.orderType,
    pfSignStatus: 'NOT_SIGNED',
    poSignStatus: 'NOT_SIGNED',
    status: item.status as BackendProjectItem['status'],
    std: item.std,
    etd: item.etd,
    rtd: null,
    rtr: item.rtrd,
    rdy: item.rdy,
    ftd: item.ftd,
    snd: item.snd,
    pfUsd: null,
    pfTl: null,
    paidUsd1: item.paidUsd1 as number | null,
    paidUsd2: item.paidUsd2 as number | null,
    paidTl1: item.paidTl1 as number | null,
    paidTl2: item.paidTl2 as number | null,
    invoiceTransactionNo: item.invoiceTransactionNo,
    invoiceNumber: item.invoiceNumber,
    quickBook: item.quickBook,
    containerNo: item.containerNo,
    containerDate: null,
    paymentRule: item.paymentRule,
    duePaid: false,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    vendor: item.vendor ? { id: item.vendor.id, code: item.vendor.code, name: item.vendor.name } : undefined,
    expensesUsd: item.expensesUsd,
    expensesTl: item.expensesTl,
  } as BackendProjectItem & { expensesUsd: any; expensesTl: any };
}

export function mapExpensesDOToProject(ep: ExpensesDirectOrderProject): Project {
  const items = ep.items || [];
  const rows = items.map(item => ({
    type: mapBackendTypeToFrontend(item.type, item.customType),
    pfCode: '',
    vendor: item.vendor
      ? (item.vendor.code ? `${item.vendor.code} - ${item.vendor.name}` : item.vendor.name)
      : '',
    vendorId: item.vendorId || '',
    orderType: item.orderType || '',
    pfSignStatus: 'NOT SIGNED',
    poSignStatus: 'NOT SIGNED',
    status: (item.status || '').replace(/_/g, ' '),
    statusNote: (item as any).statusNote || '',
    std: item.std || '',
    etd: item.etd || '',
    rtd: '',
    rtr: '',
    rdy: item.rdy || '',
    ftd: item.ftd || '',
    snd: item.snd || '',
    pfUsd: '',
    pfTl: '',
    paymentRule: item.paymentRule || '',
    containerNo: item.containerNo || '',
    containerDate: '',
    expensesUsd: item.expensesUsd ? item.expensesUsd.toString() : '',
    expensesTl: item.expensesTl ? item.expensesTl.toString() : '',
    customTypeId: item.customTypeId || null,
    itemId: item.id,
  }));

  return {
    projectId: ep.id,
    projectNumber: ep.projectNo,
    projectNumberColor: 'orange',
    projectName: ep.name,
    address: ep.address || '',
    isUrgent: ep.isUrgent || false,
    region: ep.bucket,
    rows,
    poSignStatusByType: {},
    backendItems: items.map(mapExpensesDOItemToBackendItem),
  };
}
```

---

## FILE: lib/expenses-missing-extra.ts

```ts
import { apiFetch } from './auth';
import type { ExpensesMissingExtraProject, ExpensesMissingExtraItem, ExpensesMissingExtraProjectsResponse } from '../types/expensesMissingExtra';
import type { Project } from '../types';
import type { BackendProjectItem } from './projects';
import { mapBackendTypeToFrontend } from './projects';

const API_BASE = '/api/expenses-missing-extra';

export async function getExpensesMissingExtraProjects(): Promise<ExpensesMissingExtraProject[]> {
  const res = await apiFetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error('Failed to fetch expenses missing & extra projects');
  const json: ExpensesMissingExtraProjectsResponse = await res.json();
  return json.data;
}

export async function createExpensesMissingExtraProject(data: {
  bucket: string;
  projectNo: string;
  name: string;
}): Promise<ExpensesMissingExtraProject> {
  const res = await apiFetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create project');
  }
  return res.json();
}

export async function deleteExpensesMissingExtraProject(projectId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/projects/${projectId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete project');
}

export async function createExpensesMissingExtraItem(
  projectId: string,
  data: Partial<ExpensesMissingExtraItem>,
): Promise<ExpensesMissingExtraItem> {
  const res = await apiFetch(`${API_BASE}/projects/${projectId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create item');
  return res.json();
}

export async function updateExpensesMissingExtraItem(
  itemId: string,
  data: Partial<ExpensesMissingExtraItem>,
): Promise<ExpensesMissingExtraItem> {
  const res = await apiFetch(`${API_BASE}/items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update item');
  return res.json();
}

export async function deleteExpensesMissingExtraItem(itemId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/items/${itemId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete item');
}

export function mapExpensesMEItemToBackendItem(item: ExpensesMissingExtraItem): BackendProjectItem {
  return {
    id: item.id,
    projectId: item.projectId,
    type: item.type as BackendProjectItem['type'],
    customTypeId: item.customTypeId,
    customType: item.customType,
    pfCode: null,
    vendorId: item.vendorId,
    orderType: item.orderType,
    pfSignStatus: 'NOT_SIGNED',
    poSignStatus: 'NOT_SIGNED',
    status: item.status as BackendProjectItem['status'],
    std: item.std,
    etd: item.etd,
    rtd: null,
    rtr: item.rtrd,
    rdy: item.rdy,
    ftd: item.ftd,
    snd: item.snd,
    pfUsd: null,
    pfTl: null,
    paidUsd1: item.paidUsd1 as number | null,
    paidUsd2: item.paidUsd2 as number | null,
    paidTl1: item.paidTl1 as number | null,
    paidTl2: item.paidTl2 as number | null,
    invoiceTransactionNo: item.invoiceTransactionNo,
    invoiceNumber: item.invoiceNumber,
    quickBook: item.quickBook,
    containerNo: item.containerNo,
    containerDate: null,
    paymentRule: item.paymentRule,
    duePaid: false,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    vendor: item.vendor ? { id: item.vendor.id, code: item.vendor.code, name: item.vendor.name } : undefined,
    expensesUsd: item.expensesUsd,
    expensesTl: item.expensesTl,
  } as BackendProjectItem & { expensesUsd: any; expensesTl: any };
}

export function mapExpensesMEToProject(ep: ExpensesMissingExtraProject): Project {
  const items = ep.items || [];
  const rows = items.map(item => ({
    type: mapBackendTypeToFrontend(item.type, item.customType),
    pfCode: '',
    vendor: item.vendor
      ? (item.vendor.code ? `${item.vendor.code} - ${item.vendor.name}` : item.vendor.name)
      : '',
    vendorId: item.vendorId || '',
    orderType: item.orderType || '',
    pfSignStatus: 'NOT SIGNED',
    poSignStatus: 'NOT SIGNED',
    status: (item.status || '').replace(/_/g, ' '),
    statusNote: (item as any).statusNote || '',
    std: item.std || '',
    etd: item.etd || '',
    rtd: '',
    rtr: '',
    rdy: item.rdy || '',
    ftd: item.ftd || '',
    snd: item.snd || '',
    pfUsd: '',
    pfTl: '',
    paymentRule: item.paymentRule || '',
    containerNo: item.containerNo || '',
    containerDate: '',
    expensesUsd: item.expensesUsd ? item.expensesUsd.toString() : '',
    expensesTl: item.expensesTl ? item.expensesTl.toString() : '',
    customTypeId: item.customTypeId || null,
    itemId: item.id,
  }));

  return {
    projectId: ep.id,
    projectNumber: ep.projectNo,
    projectNumberColor: 'orange',
    projectName: ep.name,
    address: ep.address || '',
    isUrgent: ep.isUrgent || false,
    region: ep.bucket,
    rows,
    poSignStatusByType: {},
    backendItems: items.map(mapExpensesMEItemToBackendItem),
  };
}
```

---

## FILE: lib/expenses-p.ts

```ts
import { apiFetch } from './auth';
import type { ExpensesPProject, ExpensesPItem, ExpensesPProjectsResponse } from '../types/expensesP';
import type { Project } from '../types';
import type { BackendProjectItem } from './projects';
import { mapBackendTypeToFrontend } from './projects';

const API_BASE = '/api/expenses-p';

export async function getExpensesPProjects(): Promise<ExpensesPProject[]> {
  const res = await apiFetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error('Failed to fetch expenses-p projects');
  const json: ExpensesPProjectsResponse = await res.json();
  return json.data;
}

export async function createExpensesPProject(data: {
  bucket: string;
  projectNo: string;
  name: string;
}): Promise<ExpensesPProject> {
  const res = await apiFetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create project');
  }
  return res.json();
}

export async function deleteExpensesPProject(projectId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/projects/${projectId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete project');
}

export async function createExpensesPItem(
  projectId: string,
  data: Partial<ExpensesPItem>,
): Promise<ExpensesPItem> {
  const res = await apiFetch(`${API_BASE}/projects/${projectId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create item');
  return res.json();
}

export async function updateExpensesPItem(
  itemId: string,
  data: Partial<ExpensesPItem>,
): Promise<ExpensesPItem> {
  const res = await apiFetch(`${API_BASE}/items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update item');
  return res.json();
}

export async function deleteExpensesPItem(itemId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/items/${itemId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete item');
}

/**
 * Map an ExpensesPItem to BackendProjectItem-like shape for ProjectBlock compatibility.
 * ProjectBlock uses BackendProjectItem internally for state management.
 */
export function mapExpensesPItemToBackendItem(item: ExpensesPItem): BackendProjectItem {
  return {
    id: item.id,
    projectId: item.projectId,
    type: item.type as BackendProjectItem['type'],
    customTypeId: item.customTypeId,
    customType: item.customType,
    pfCode: null,
    vendorId: item.vendorId,
    orderType: item.orderType,
    pfSignStatus: 'NOT_SIGNED',
    poSignStatus: 'NOT_SIGNED',
    status: item.status as BackendProjectItem['status'],
    std: item.std,
    etd: item.etd,
    rtd: null,
    rtr: item.rtrd,  // expenses-p uses 'rtrd' → map to 'rtr' for ProjectBlock compatibility
    rdy: item.rdy,
    ftd: item.ftd,
    snd: item.snd,
    pfUsd: null,
    pfTl: null,
    paidUsd1: item.paidUsd1 as number | null,
    paidUsd2: item.paidUsd2 as number | null,
    paidTl1: item.paidTl1 as number | null,
    paidTl2: item.paidTl2 as number | null,
    invoiceTransactionNo: item.invoiceTransactionNo,
    invoiceNumber: item.invoiceNumber,
    quickBook: item.quickBook,
    containerNo: item.containerNo,
    containerDate: null,
    paymentRule: item.paymentRule,
    duePaid: false,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    vendor: item.vendor ? { id: item.vendor.id, code: item.vendor.code, name: item.vendor.name } : undefined,
    // Expenses-specific fields (accessed via `as any` in ProjectBlock)
    expensesUsd: item.expensesUsd,
    expensesTl: item.expensesTl,
  } as BackendProjectItem & { expensesUsd: any; expensesTl: any };
}

/**
 * Map an ExpensesPProject to the Project format used by ProjectBlock.
 */
export function mapExpensesPToProject(ep: ExpensesPProject): Project {
  const items = ep.items || [];
  const rows = items.map(item => ({
    type: mapBackendTypeToFrontend(item.type, item.customType),
    pfCode: '',
    vendor: item.vendor
      ? (item.vendor.code ? `${item.vendor.code} - ${item.vendor.name}` : item.vendor.name)
      : '',
    vendorId: item.vendorId || '',
    orderType: item.orderType || '',
    pfSignStatus: 'NOT SIGNED',
    poSignStatus: 'NOT SIGNED',
    status: (item.status || '').replace(/_/g, ' '),
    statusNote: (item as any).statusNote || '',
    std: item.std || '',
    etd: item.etd || '',
    rtd: '',
    rtr: '',
    rdy: item.rdy || '',
    ftd: item.ftd || '',
    snd: item.snd || '',
    pfUsd: '',
    pfTl: '',
    paymentRule: item.paymentRule || '',
    containerNo: item.containerNo || '',
    containerDate: '',
    expensesUsd: item.expensesUsd ? item.expensesUsd.toString() : '',
    expensesTl: item.expensesTl ? item.expensesTl.toString() : '',
    customTypeId: item.customTypeId || null,
    itemId: item.id,
  }));

  return {
    projectId: ep.id,
    projectNumber: ep.projectNo,
    projectNumberColor: 'orange',
    projectName: ep.name,
    address: ep.address || '',
    isUrgent: ep.isUrgent || false,
    region: ep.bucket,
    rows,
    poSignStatusByType: {},
    backendItems: items.map(mapExpensesPItemToBackendItem),
  };
}
```

---

## FILE: lib/gridWidth.ts

```ts
/**
 * Grid Width Calculation - Single Source of Truth
 * 
 * This file calculates the dynamic grid width based on visible columns.
 * Used to ensure headers match the exact width of the grid.
 */

import { ColumnKey } from './columns';

// Column width mapping - MUST match CSS values in styles.css
export const COLUMN_WIDTHS: Record<ColumnKey, number> = {
  projectNo: 110,
  type: 140,
  pfCode: 180,
  vendor: 220,
  orderType: 200,
  poSignStatus: 140,
  pfSignStatus: 140,
  status: 140,
  std: 140,
  etd: 140,
  rtd: 140,
  rtr: 140,
  rdy: 140,
  ftd: 140,
  snd: 140,
  pfUsd: 160,
  pfTl: 160,
  invoice: 160,
  invoiceTl: 160,
  paymentRule: 180,
  containerNo: 140,
  containerDate: 140,
  expensesUsd: 160,
  expensesTl: 160,
};

// Fixed columns that are always visible (sticky left section)
export const FIXED_COLUMNS: ColumnKey[] = ['projectNo', 'type'];

// Scrollable columns (right section)
export const SCROLLABLE_COLUMNS: ColumnKey[] = [
  'pfCode',
  'vendor',
  'orderType',
  'poSignStatus',
  'pfSignStatus',
  'status',
  'std',
  'etd',
  'rtd',
  'rtr',
  'rdy',
  'ftd',
  'snd',
  'pfUsd',
  'pfTl',
  'invoice',
  'invoiceTl',
  'expensesUsd',
  'expensesTl',
  'paymentRule',
  'containerNo',
  'containerDate',
];

/**
 * Calculate the total grid width based on visible columns
 * @param isColumnVisible - Function to check if a column is visible
 * @param isSupplierMode - Whether we're in supplier mode (hides PO Sign Status)
 * @returns Total width in pixels
 */
export const calculateGridWidth = (
  isColumnVisible: (key: ColumnKey) => boolean,
  isSupplierMode: boolean = false
): number => {
  let totalWidth = 0;

  // Add fixed columns (always visible)
  FIXED_COLUMNS.forEach((col) => {
    if (isColumnVisible(col)) {
      totalWidth += COLUMN_WIDTHS[col];
    }
  });

  // Add scrollable columns (conditionally visible)
  SCROLLABLE_COLUMNS.forEach((col) => {
    // Skip PO Sign Status in supplier mode
    if (isSupplierMode && col === 'poSignStatus') {
      return;
    }

    if (isColumnVisible(col)) {
      totalWidth += COLUMN_WIDTHS[col];
    }
  });

  return totalWidth;
};

/**
 * Get grid width as CSS string (e.g., "2210px")
 */
export const getGridWidthPx = (
  isColumnVisible: (key: ColumnKey) => boolean,
  isSupplierMode: boolean = false
): string => {
  return `${calculateGridWidth(isColumnVisible, isSupplierMode)}px`;
};
```

---

## FILE: lib/missing-extra.ts

```ts
// Missing & Extra API helper
import { apiFetch } from './auth';
import { sanitizeProjectItemPayload } from './sanitizePayload';
import { ProjectHalf } from './projects';

// Backend interfaces for Missing & Extra
export interface BackendMissingExtraCase {
  id: string;
  baseProjectId: string | null;
  baseProjectNo: string;
  baseProjectName: string;
  section: 'TLINES_NE' | 'TLINES_SE' | 'TLINES_NW' | 'CVW' | 'TLINES_HQ' | 'TLINES_TC';
  caseType: 'MISSING' | 'EXTRA' | 'REPLACEMENT';
  caseIndex: number;
  derivedProjectCode: string; // e.g., '301-MS-1'
  types: string[];
  isUrgent?: boolean; // ✅ ADD: Urgent status
  containerDate?: string | null; // ✅ ADD: Container date
  halfOfYear?: ProjectHalf | null;
  halfYear?: number | null;
  createdAt: string;
  updatedAt: string;
  baseProject?: {
    id: string;
    projectNo: string;
    name: string;
  } | null;
  items?: BackendMissingExtraItem[];
}

export interface BackendMissingExtraItem {
  id: string;
  caseId: string;
  type: 'MILLWORK' | 'SHELVING' | 'CEILING' | 'IMAGE' | 'FURNITURE' | null;
  customTypeId: string | null;
  pfCode: string | null;
  vendorId: string | null;
  orderType: string | null;
  pfSignStatus: 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED';
  poSignStatus: 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED';
  status: 'HOLD_T' | 'HOLD_PM' | 'HOLD_BOOKS' | 'NOT_ORDERED' | 'TO_ORDER' | 'ORDERED' | 'ASSEMBLY' | 'READY_TO_RECEIVE' | 'RECEIVED' | 'READY' | 'SENT_TO_TLINES' | 'PARTIAL_SENT' | 'SENT' | null;
  std: string | null;
  etd: string | null;
  rtd: string | null;
  rtr: string | null;
  rdy: string | null;
  ftd: string | null;
  snd: string | null;
  pfUsd: number | null;
  pfTl: number | null;
  paidUsd1: number | null;
  paidUsd2: number | null;
  paidTl1: number | null;
  paidTl2: number | null;
  invoiceTransactionNo: string | null;
  invoiceNumber: string | null;
  quickBook: string | null;
  containerNo: string | null;
  containerDate: string | null;
  paymentRule: string | null;
  invoice: number | null;
  invoiceTl: number | null;
  createdAt: string;
  updatedAt: string;
  vendor?: {
    id: string;
    code: string;
    name: string;
  } | null;
  customType?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface CreateMissingExtraCaseRequest {
  section: 'TLINES_NE' | 'TLINES_SE' | 'TLINES_NW' | 'CVW' | 'TLINES_HQ' | 'TLINES_TC';
  caseType: 'MISSING' | 'EXTRA' | 'REPLACEMENT';
  types: string[]; // Selected types for the case
  // Mode 1: From existing project
  baseProjectId?: string;
  // Mode 2: Legacy/manual project
  legacyProjectNo?: string;
  legacyProjectName?: string;
  // Optional custom case index (if not provided, auto-incremented)
  caseIndex?: number;
}

export interface CreateMissingExtraItemRequest {
  type?: 'MILLWORK' | 'SHELVING' | 'CEILING' | 'IMAGE' | 'FURNITURE';
  customTypeId?: string;
  vendorId?: string;
  orderType?: string;
  pfSignStatus?: 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED';
  poSignStatus?: 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED';
  status?: 'HOLD_T' | 'HOLD_PM' | 'HOLD_BOOKS' | 'NOT_ORDERED' | 'TO_ORDER' | 'ORDERED' | 'ASSEMBLY' | 'READY_TO_RECEIVE' | 'RECEIVED' | 'READY' | 'SENT_TO_TLINES' | 'PARTIAL_SENT' | 'SENT';
  std?: string; // ISO date string
  etd?: string; // ISO date string
  rtd?: string; // ISO date string
  ftd?: string; // ISO date string
  containerNo?: string;
  containerDate?: string;
}

export interface UpdateMissingExtraItemRequest {
  vendorId?: string;
  orderType?: string;
  pfSignStatus?: 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED';
  poSignStatus?: 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED';
  status?: 'HOLD_T' | 'HOLD_PM' | 'HOLD_BOOKS' | 'NOT_ORDERED' | 'TO_ORDER' | 'ORDERED' | 'ASSEMBLY' | 'READY_TO_RECEIVE' | 'RECEIVED' | 'READY' | 'SENT_TO_TLINES' | 'PARTIAL_SENT' | 'SENT';
  std?: string; // ISO date string
  etd?: string; // ISO date string
  rtd?: string; // ISO date string
  ftd?: string; // ISO date string
  rdy?: string; // ISO date string
  snd?: string; // ISO date string
  pfUsd?: number; // PF USD amount
  pfTl?: number; // PF TL amount
  containerNo?: string;
  containerDate?: string;
  paymentRule?: string; // Payment rule value
  invoice?: number | null;
  invoiceTl?: number | null;
}

export interface GroupedMissingExtraCasesResponse {
  TLINES_NE?: BackendMissingExtraCase[];
  TLINES_SE?: BackendMissingExtraCase[];
  TLINES_NW?: BackendMissingExtraCase[];
  CVW?: BackendMissingExtraCase[];
  TLINES_HQ?: BackendMissingExtraCase[];
  TLINES_TC?: BackendMissingExtraCase[];
}

// ==================== MISSING EXTRA CASE API FUNCTIONS ====================

export const getMissingExtraCases = async (): Promise<GroupedMissingExtraCasesResponse> => {
  const response = await apiFetch(`/api/missing-extra/cases`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch Missing & Extra cases');
  }

  const data = await response.json();
  return data;
};

export const getMissingExtraCase = async (caseId: string): Promise<BackendMissingExtraCase> => {
  const response = await apiFetch(`/api/missing-extra/cases/${caseId}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch Missing & Extra case');
  }

  const data = await response.json();
  return data;
};

export const createMissingExtraCase = async (caseData: CreateMissingExtraCaseRequest): Promise<BackendMissingExtraCase> => {
  const response = await apiFetch(`/api/missing-extra/cases`, {
    method: 'POST',
    body: JSON.stringify(caseData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create Missing & Extra case');
  }

  const data = await response.json();
  return data;
};

export const updateMissingExtraCase = async (caseId: string, updates: { isUrgent?: boolean; containerDate?: string | null }): Promise<BackendMissingExtraCase> => {
  const response = await apiFetch(`/api/missing-extra/cases/${caseId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update Missing & Extra case');
  }

  const data = await response.json();
  return data;
};

export const bulkAssignMissingExtraHalf = async (
  caseIds: string[],
  halfOfYear: ProjectHalf | null,
  halfYear: number | null,
): Promise<{ updatedCount: number }> => {
  const response = await apiFetch(`/api/missing-extra/cases/bulk/half`, {
    method: 'PATCH',
    body: JSON.stringify({ caseIds, halfOfYear, halfYear }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to assign half');
  }

  return response.json();
};

export const getMissingExtraCaseItems = async (caseId: string): Promise<BackendMissingExtraItem[]> => {
  const response = await apiFetch(`/api/missing-extra/cases/${caseId}/items`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch Missing & Extra case items');
  }

  const data = await response.json();
  return data;
};

// ==================== MISSING EXTRA ITEM API FUNCTIONS ====================

export const createMissingExtraItem = async (caseId: string, itemData: CreateMissingExtraItemRequest): Promise<BackendMissingExtraItem> => {
  // Sanitize payload to remove UI-only fields
  const sanitizedData = sanitizeProjectItemPayload(itemData);

  const response = await apiFetch(`/api/missing-extra/cases/${caseId}/items`, {
    method: 'POST',
    body: JSON.stringify(sanitizedData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create Missing & Extra item');
  }

  const data = await response.json();
  return data;
};

export const updateMissingExtraItem = async (itemId: string, itemData: UpdateMissingExtraItemRequest): Promise<BackendMissingExtraItem> => {
  // Sanitize payload to remove UI-only fields
  const sanitizedData = sanitizeProjectItemPayload(itemData);

  const requestUrl = `/api/missing-extra/items/${itemId}`;
  const requestPayload = JSON.stringify(sanitizedData);

  // Frontend request logging

  const response = await apiFetch(requestUrl, {
    method: 'PATCH',
    body: requestPayload,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('❌ [FRONTEND ERROR] Missing & Extra update failed:', {
      status: response.status,
      errorData,
      requestUrl,
      payload: itemData
    });
    throw new Error(errorData.message || 'Failed to update Missing & Extra item');
  }

  const data = await response.json();


  return data;
};

export const deleteMissingExtraItem = async (itemId: string): Promise<{ message: string }> => {
  const response = await apiFetch(`/api/missing-extra/items/${itemId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete Missing & Extra item');
  }

  const data = await response.json();
  return data;
};

export const deleteMissingExtraCase = async (caseId: string): Promise<{ message: string }> => {
  const response = await apiFetch(`/api/missing-extra/cases/${caseId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete Missing & Extra case');
  }

  const data = await response.json();
  return data;
};
```

---

## FILE: lib/payment-rules.ts

```ts
import { apiFetch } from './auth';

export interface PaymentRule {
  id: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRuleRequest {
  value: string;
}

/**
 * Get all payment rules
 */
export const getPaymentRules = async (): Promise<PaymentRule[]> => {
  const response = await apiFetch('/api/payment-rules');

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch payment rules');
  }

  return response.json();
};

/**
 * Create a new payment rule
 */
export const createPaymentRule = async (request: CreatePaymentRuleRequest): Promise<PaymentRule> => {
  const response = await apiFetch('/api/payment-rules', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create payment rule');
  }

  return response.json();
};
```

---

## FILE: lib/pf-groups.ts

```ts
// PF Grouping API helper
import { apiFetch } from './auth';

export interface PfGroupMember {
  id: string;
  groupId: string;
  rank: number;
  projectId: string;
  projectNo: string;
  projectName: string;
  bucket: string;
  type: string | null;
  customTypeId: string | null;
  typeLabel: string;
}

export interface PfGroup {
  id: string;
  number: number;
  createdAt: string;
  members: PfGroupMember[];
}

export interface PfGroupTarget {
  projectId: string;
  type?: string;
  customTypeId?: string;
  rank?: number; // addPfGroupMember only: which existing tier to join
}

export const getPfGroups = async (): Promise<PfGroup[]> => {
  const response = await apiFetch('/api/pf-groups');
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch groups');
  }
  return response.json();
};

/** Creates a brand-new group whose first member is this target. */
export const createPfGroup = async (target: PfGroupTarget): Promise<{ id: string; number: number }> => {
  const response = await apiFetch('/api/pf-groups', {
    method: 'POST',
    body: JSON.stringify(target),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create group');
  }
  return response.json();
};

/** Appends a target as the next member of an existing group. */
export const addPfGroupMember = async (groupId: string, target: PfGroupTarget): Promise<PfGroupMember> => {
  const response = await apiFetch(`/api/pf-groups/${groupId}/members`, {
    method: 'POST',
    body: JSON.stringify(target),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to add to group');
  }
  return response.json();
};

export const reorderPfGroupMember = async (memberId: string, direction: 'up' | 'down'): Promise<{ message: string }> => {
  const response = await apiFetch(`/api/pf-groups/members/${memberId}/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ direction }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to reorder');
  }
  return response.json();
};

export const removePfGroupMember = async (memberId: string): Promise<{ message: string }> => {
  const response = await apiFetch(`/api/pf-groups/members/${memberId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to remove member');
  }
  return response.json();
};

export const deletePfGroup = async (groupId: string): Promise<{ message: string }> => {
  const response = await apiFetch(`/api/pf-groups/${groupId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete group');
  }
  return response.json();
};

/** Token to match a group member against a grid row: projectId + the same display type label. */
export const pfGroupKey = (projectId: string, typeLabel: string): string => `${projectId}:${typeLabel}`;

/**
 * Buckets a group's members by rank (priority tier), sorted ascending — several
 * members (different projects, or different types) can share one tier, so this
 * is a grouping, not a 1:1 index.
 */
export const tiersOfGroup = (group: PfGroup): [number, PfGroupMember[]][] => {
  const byRank = new Map<number, PfGroupMember[]>();
  group.members.forEach(m => {
    const arr = byRank.get(m.rank) || [];
    arr.push(m);
    byRank.set(m.rank, arr);
  });
  return [...byRank.entries()].sort(([a], [b]) => a - b);
};
```

---

## FILE: lib/projectColor.ts

```ts
/**
 * Global Project Color System
 *
 * Implements unified color rules across all project types:
 * - Projects board / operational board (normal projects)
 * - Missing Extra board
 * - Direct Orders board
 * - Supplier sheets (P / ME / DO)
 * - Any dashboard project cards/blocks that show project color
 *
 * Color Rules (precedence order):
 * 1. GREEN: All items SENT (normal SENT, not "SENT TO TLINES")
 * 2. RED: isUrgent=true OR containerDate ≤ 10 days (GREEN overrides)
 * 3. BLUE: At least one item ORDERED
 * 4. ORANGE: Default fallback
 */

import { BackendProjectItem } from './projects';

export type ProjectColor = 'orange' | 'blue' | 'green' | 'red';

// Type for items with debug source tracking - allows both status and orderStatus for flexibility
type ItemWithSource = (BackendProjectItem & { orderStatus?: string | null }) & { __source: string };

// Type for basic items from getProjectItems function
type BasicProjectItem = { status?: string | null; orderStatus?: string | null; };

interface ProjectLike {
  // Core project fields
  id?: string;
  isUrgent?: boolean;
  containerDate?: string | Date | null;

  // Items can be in different locations depending on data source
  backendItems?: Array<{ status?: string | null; orderStatus?: string | null; }>;
  items?: Array<{ status?: string | null; orderStatus?: string | null; }>;
  rows?: Array<{ status?: string | null; orderStatus?: string | null; }>;
}

/**
 * Normalize status values to handle different string formats and enums
 */
const normalizeStatus = (status: any): string => {
  return String(status || '').trim().toUpperCase();
};

/**
 * Check if status represents ORDERED state
 */
const isOrdered = (status: any): boolean => {
  const norm = normalizeStatus(status);
  return norm === 'ORDERED';
};

/**
 * Check if status represents normal SENT state (not SENT_TO_TLINES)
 */
const isSentNormal = (status: any): boolean => {
  const norm = normalizeStatus(status);
  return norm === 'SENT';
};

/**
 * Check if status represents SENT_TO_TLINES state (does NOT count for GREEN)
 */
const isSentToTlines = (status: any): boolean => {
  const norm = normalizeStatus(status);
  // Handle various formats: "SENT_TO_TLINES", "SENT TO TLINES", "SENT-TO-TLINES"
  return norm.includes('SENT') && norm.includes('TLINES');
};

/**
 * Extract items from project object, handling different data structures
 */
export const getProjectItems = (project: ProjectLike): Array<{ status?: string | null; orderStatus?: string | null; }> => {
  return project?.backendItems ?? project?.items ?? project?.rows ?? [];
};

/**
 * Calculate days remaining until container date
 * Uses start-of-day comparison to avoid timezone issues
 */
const getDaysLeft = (containerDate: string | Date | null): number | null => {
  if (!containerDate) return null;

  try {
    // Parse container date and set to start of day
    const targetDate = new Date(containerDate);
    if (isNaN(targetDate.getTime())) return null;
    targetDate.setHours(0, 0, 0, 0);

    // Get today at start of day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate difference in days
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  } catch (error) {
    console.error('Error calculating days left:', error);
    return null;
  }
};

/**
 * Calculate minimum days remaining from all item-level container dates
 * Returns null if no valid container dates found
 */
const getMinDaysRemainingFromItems = (items: any[]): { minDays: number | null; earliestDate: string | null } => {
  if (!items || items.length === 0) {
    return { minDays: null, earliestDate: null };
  }

  let minDays: number | null = null;
  let earliestDate: string | null = null;

  for (const item of items) {
    // Check multiple possible field names for container date
    const itemDate = item.containerDate ?? item.container_date ?? item.containerETA ?? null;
    if (!itemDate) continue;

    const daysLeft = getDaysLeft(itemDate);
    if (daysLeft === null) continue;

    if (minDays === null || daysLeft < minDays) {
      minDays = daysLeft;
      earliestDate = itemDate;
    }
  }

  return { minDays, earliestDate };
};

/**
 * NEW: Map-only color calculation - NEVER uses stale arrays
 *
 * @param params Object with project, itemsById Map, and optional urgent override
 * @returns Project color token
 */
export const getProjectColorFromMap = (params: {
  project: any;
  itemsById: Map<string, BackendProjectItem>;
  isUrgentOverride?: boolean;
}): ProjectColor => {
  const { project, itemsById, isUrgentOverride } = params;

  if (!project) return 'orange';

  // 🔧 EXTRACT ITEM IDS from project structure
  const itemIds = project.rows?.map((row: any) => row.itemId).filter(Boolean) || [];

  // 🔧 BUILD ITEMS ARRAY from authoritative Map ONLY
  const items = itemIds
    .map((id: string) => {
      const item = itemsById.get(id);
      if (!item) return null;

      // 🧩 PROOF: Add source tracking on-the-fly (don't mutate original)
      return {
        ...item,
        __source: "itemsById_lookup"
      };
    })
    .filter(Boolean);

  // A. GREEN (highest precedence): All items SENT (normal)
  const allSentNormal = items.length > 0 && items.every((item: ItemWithSource) => {
    const status = item.status ?? item.orderStatus;
    return isSentNormal(status);
  });

  if (allSentNormal) return 'green';

  // B. RED (second precedence): Urgent flag OR container deadline ≤ 10 days
  const urgent = isUrgentOverride ?? !!project.isUrgent;

  // ✅ CHECK ITEM-LEVEL CONTAINER DATES (not just project.containerDate)
  const { minDays, earliestDate: _earliestDate } = getMinDaysRemainingFromItems(items);
  const containerWindowActive = minDays !== null && minDays <= 10 && minDays >= 0;

  if (urgent || containerWindowActive) {
    // 🔍 DEBUG: Log when project turns red
    if (import.meta.env.DEV) {
      if (containerWindowActive) {
      } else if (urgent) {
      }
    }
    return 'red';
  }

  // C. BLUE: At least one item has PO signed (SIGNED or READY_TO_SIGN)
  const hasPoSigned = items.some((item: ItemWithSource) => {
    const poStatus = item.poSignStatus;
    return poStatus === 'SIGNED' || poStatus === 'READY_TO_SIGN';
  });

  if (hasPoSigned) {
    return 'blue';
  }

  // D. ORANGE: Default fallback
  return 'orange';
};

/**
 * Core function: Calculate project color based on business rules
 *
 * @param project Project-like object with items and metadata
 * @returns Project color token
 */
export const getProjectColor = (project: ProjectLike): ProjectColor => {
  if (!project) return 'orange';

  const items = getProjectItems(project);

  // A. GREEN (highest precedence): All items are SENT (normal)
  const allSentNormal = items.length > 0 && items.every((item: BasicProjectItem) => {
    const status = item.status ?? item.orderStatus;
    return isSentNormal(status);
  });

  if (allSentNormal) return 'green';

  // B. RED (second precedence): Urgent flag OR container deadline ≤ 10 days
  const urgent = !!project.isUrgent;
  
  // ✅ CHECK ITEM-LEVEL CONTAINER DATES (not just project.containerDate)
  const { minDays, earliestDate: _earliestDate } = getMinDaysRemainingFromItems(items);
  const containerWindowActive = minDays !== null && minDays <= 10 && minDays >= 0;

  if (urgent || containerWindowActive) {
    // 🔍 DEBUG: Log when project turns red
    if (import.meta.env.DEV) {
      if (containerWindowActive) {
      } else if (urgent) {
      }
    }
    return 'red';
  }

  // C. BLUE: At least one item has PO signed
  const hasPoSigned2 = items.some((item: BasicProjectItem) => {
    const poStatus = (item as any).poSignStatus;
    return poStatus === 'SIGNED' || poStatus === 'READY_TO_SIGN';
  });

  if (hasPoSigned2) {
    return 'blue';
  }

  // D. ORANGE: Default fallback
  return 'orange';
};

/**
 * Optional: Get detailed color metadata for debugging
 */
export interface ProjectColorMeta {
  color: ProjectColor;
  reason: string;
  itemsTotal: number;
  itemsOrdered: number;
  itemsSentNormal: number;
  itemsSentToTlines: number;
  isUrgent: boolean;
  containerDate: string | null;
  daysLeft: number | null;
}

export const getProjectColorMeta = (project: ProjectLike): ProjectColorMeta => {
  const items = getProjectItems(project);
  const color = getProjectColor(project);

  let itemsOrdered = 0;
  let itemsSentNormal = 0;
  let itemsSentToTlines = 0;

  items.forEach(item => {
    const status = item.status ?? item.orderStatus;
    if (isOrdered(status)) itemsOrdered++;
    if (isSentNormal(status)) itemsSentNormal++;
    if (isSentToTlines(status)) itemsSentToTlines++;
  });

  const daysLeft = getDaysLeft(project.containerDate || null);

  let reason: string;
  if (color === 'green') reason = 'All items SENT (normal)';
  else if (color === 'red' && project.isUrgent) reason = 'Marked as urgent';
  else if (color === 'red' && daysLeft !== null && daysLeft <= 10) reason = `Container deadline in ${daysLeft} days`;
  else if (color === 'blue') reason = 'Has ORDERED items';
  else reason = 'Default state';

  return {
    color,
    reason,
    itemsTotal: items.length,
    itemsOrdered,
    itemsSentNormal,
    itemsSentToTlines,
    isUrgent: !!project.isUrgent,
    containerDate: project.containerDate ? String(project.containerDate) : null,
    daysLeft,
  };
};

/**
 * Map project color to CSS class name
 */
export const getProjectColorClass = (color: ProjectColor): string => {
  return `project-number-${color}`;
};

/**
 * Map project color to hex value (matches existing CSS)
 */
export const getProjectColorHex = (color: ProjectColor): string => {
  switch (color) {
    case 'orange': return '#DE8244';
    case 'blue': return '#6A99D1';
    case 'green': return '#9FCF63';
    case 'red': return '#E53E3E'; // New red color
    default: return '#DE8244';
  }
};
```

---

## FILE: lib/projectTotalApi.ts

```ts
import { apiClient } from './api';
import type { CompanyTotals, CategoryRows, Money2 } from '../types/projectTotal';

// Backend response types (from /project-totals endpoint)
interface BackendMoney { pfUsd: number; pfTl: number; }
interface BackendTab { label: string; money: BackendMoney; }
interface BackendCompany { bucket: string; displayName: string; tabs: BackendTab[]; total: BackendMoney; }
interface BackendExpenseBucket {
  bucket: string;
  projects: { usd: number; tl: number };
  directOrder: { usd: number; tl: number };
  missingExtra: { usd: number; tl: number };
  trustExpenses: { usd: number; tl: number };
}

interface BackendResponse {
  companies: BackendCompany[];
  grandTotal: {
    projects: BackendMoney;
    directOrder: BackendMoney;
    missingExtra: BackendMoney;
    total: BackendMoney;
  };
  trustExpenseTotals?: BackendMoney;
  expensesTotals?: BackendExpenseBucket[];
}

// Map backend bucket enum → frontend company key
const BUCKET_TO_KEY: Record<string, string> = {
  TLINES_NE: 'TLINES_NE',
  TLINES_SE: 'TLINES_SE',
  CVW: 'TLINES_CVW',
  TLINES_NW: 'TLINES_NW',
  TLINES_HQ: 'TLINES_HQ',
  TLINES_TC: 'TRUST_TC',
};

const FRONTEND_LABELS: Record<string, string> = {
  TLINES_NE: 'T LINES NE',
  TLINES_SE: 'T LINES SE',
  TLINES_CVW: 'T LINES CVW',
  TLINES_NW: 'T LINES NW',
  TLINES_HQ: 'T LINES HQ',
  TRUST_TC: 'TRUST TC',
  TRUST_EXP: 'TRUST Expenses',
};

function toMoney2(bm: BackendMoney): Money2 {
  return { usd: bm.pfUsd || 0, tl: bm.pfTl || 0 };
}

function emptyRows(): CategoryRows {
  return {
    projects: { usd: 0, tl: 0 },
    directOrder: { usd: 0, tl: 0 },
    missingExtra: { usd: 0, tl: 0 },
  };
}

export async function fetchProjectTotals(): Promise<CompanyTotals[]> {
  const resp: BackendResponse = await apiClient.get('/api/project-totals');
  if (!resp || !resp.companies) {
    throw new Error('Invalid response from project-totals endpoint');
  }

  // Build a map of frontend key → production data from backend
  const prodMap = new Map<string, CategoryRows>();
  for (const bc of resp.companies) {
    const frontendKey = BUCKET_TO_KEY[bc.bucket];
    if (!frontendKey) continue;
    const rows: CategoryRows = {
      projects: toMoney2(bc.tabs[0]?.money || { pfUsd: 0, pfTl: 0 }),
      directOrder: toMoney2(bc.tabs[1]?.money || { pfUsd: 0, pfTl: 0 }),
      missingExtra: toMoney2(bc.tabs[2]?.money || { pfUsd: 0, pfTl: 0 }),
    };
    prodMap.set(frontendKey, rows);
  }

  // Build the full CompanyTotals[] with all frontend companies
  const allKeys = [
    'TLINES_NE', 'TLINES_SE', 'TLINES_CVW', 'TLINES_NW',
    'TLINES_HQ', 'TRUST_TC', 'TRUST_EXP',
  ];

  // Build expenses map from expensesTotals (keyed by frontend key)
  const expMap = new Map<string, CategoryRows>();
  if (resp.expensesTotals) {
    for (const eb of resp.expensesTotals) {
      const frontendKey = BUCKET_TO_KEY[eb.bucket];
      if (!frontendKey) continue;
      expMap.set(frontendKey, {
        projects: { usd: eb.projects.usd || 0, tl: eb.projects.tl || 0 },
        directOrder: { usd: eb.directOrder.usd || 0, tl: eb.directOrder.tl || 0 },
        missingExtra: { usd: eb.missingExtra.usd || 0, tl: eb.missingExtra.tl || 0 },
        trustExpenses: { usd: eb.trustExpenses.usd || 0, tl: eb.trustExpenses.tl || 0 },
      });
    }
  }

  // Trust Expenses totals for TRUST_EXP company
  const teMoney = resp.trustExpenseTotals
    ? toMoney2(resp.trustExpenseTotals)
    : { usd: 0, tl: 0 };

  return allKeys.map((key) => {
    let expenses: CategoryRows;
    if (key === 'TRUST_EXP') {
      // TRUST_EXP gets trust expenses totals in the expenses.projects field
      expenses = { projects: teMoney, directOrder: { usd: 0, tl: 0 }, missingExtra: { usd: 0, tl: 0 } };
    } else {
      expenses = expMap.get(key) || emptyRows();
    }

    return {
      companyKey: key,
      label: FRONTEND_LABELS[key] || key,
      production: prodMap.get(key) || emptyRows(),
      expenses,
    };
  });
}
```

---

## FILE: lib/projects.ts

```ts
// Projects API helper
import { apiFetch } from './auth';
import { sortItemsForDisplay } from '../types';
import { getProjectColor } from './projectColor';
import { sanitizeProjectItemPayload } from './sanitizePayload';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Vendor interfaces
export interface Vendor {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  fixedMillworkCodes?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVendorRequest {
  name: string;
  code?: string; // Optional, auto-generated if not provided
  fixedMillworkCodes?: boolean; // Millwork PF codes follow the order-type M01/M02/M03 rule
}

export interface UpdateVendorRequest {
  name?: string;
  code?: string;
  isActive?: boolean;
}

// Half-year assignment
export type ProjectHalf = 'FIRST_HALF' | 'SECOND_HALF';

// Backend API interfaces
export interface BackendProject {
  id: string;
  bucket: 'TLINES_NE' | 'TLINES_SE' | 'TLINES_NW' | 'CVW' | 'TLINES_HQ' | 'TLINES_TC';
  projectNo: string;
  name: string;
  address: string | null;
  description: string | null;
  types: string[]; // Metadata: types that were selected when creating project
  status: string;
  isUrgent?: boolean; // ✅ ADD: Urgent status
  containerDate?: string | null; // ✅ ADD: Container date
  halfOfYear?: ProjectHalf | null;
  halfYear?: number | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    email: string;
    name: string;
  };
  items?: BackendProjectItem[]; // Project line items with vendor relations
}

// Line item structure
export interface BackendProjectItem {
  id: string;
  projectId: string;
  type: 'MILLWORK' | 'SHELVING' | 'CEILING' | 'IMAGE' | 'FURNITURE' | 'DECORATION' | null;
  customTypeId: string | null;
  customType?: {
    id: string;
    name: string;
    code: string;
    description: string | null;
  } | null;
  pfCode: string | null;
  vendorId: string | null; // Foreign key to vendor
  orderType: string | null;
  pfSignStatus: 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED' | 'WAITING_TLINES_TO_SIGN' | 'WAITING_T_TO_SIGN' | 'SIGNED_WITH_EST_PRICE';
  poSignStatus: 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED' | 'WAITING_TLINES_TO_SIGN' | 'WAITING_T_TO_SIGN';
  status: 'HOLD_T' | 'HOLD_PM' | 'HOLD_BOOKS' | 'NOT_ORDERED' | 'TO_ORDER' | 'ORDERED' | 'WAITING_PAYMENT' | 'ASSEMBLY' | 'READY_TO_RECEIVE' | 'RECEIVED' | 'READY' | 'SENT_TO_TLINES' | 'PARTIAL_SENT' | 'SENT' | null;
  std: string | null;
  etd: string | null;
  rtd: string | null;
  rtr: string | null;
  rdy: string | null;
  ftd: string | null;
  snd: string | null;
  pfUsd: number | null;
  pfTl: number | null;
  paidUsd1: number | null;
  paidUsd2: number | null;
  paidTl1: number | null;
  paidTl2: number | null;
  invoiceTransactionNo: string | null;
  invoiceNumber: string | null;
  quickBook: string | null;
  containerNo: string | null;
  containerDate: string | null; // ✅ ADD: Container date for individual items
  paymentRule: string | null;
  statusNote: string | null;
  priceNotes?: Record<string, string> | null;
  duePaid: boolean;
  paidUsd1Date: string | null;
  paidUsd2Date: string | null;
  paidTl1Date: string | null;
  paidTl2Date: string | null;
  invoiceDate: string | null;
  invoice: number | null;
  invoiceTl: number | null;
  createdAt: string;
  updatedAt: string;
  vendor?: { // Vendor relation when included
    id: string;
    code: string;
    name: string;
  } | null;
}

// Frontend mapping interfaces
export interface ApiSection {
  id: string;
  label: string;
  projects: ApiProject[];
}

export interface ApiProject {
  projectId: string;
  projectNumber: number | string; // Allow string for Direct Orders (DO-01, DO-02)
  projectNumberColor: 'orange' | 'blue' | 'green' | 'red';
  projectName: string;
  address: string;
  region: string;
  isUrgent?: boolean; // ✅ ADD: Urgent status
  containerDate?: string | null; // ✅ ADD: Container date
  halfOfYear?: ProjectHalf | null;
  halfYear?: number | null;
  rows: ApiRow[];
  poSignStatusByType: Record<string, string>;
  backendItems?: BackendProjectItem[]; // Preserve raw backend items for editing
}

export interface ApiRow {
  type: string;
  pfCode: string;
  vendor: string;
  vendorId?: string;
  orderType: string;
  pfSignStatus: string;
  poSignStatus: string; // PO sign status (added for type groups)
  status: string;
  std: string;
  etd: string;
  rtd: string;
  rtr: string;
  rdy: string;
  ftd: string;
  snd: string;
  statusNote: string;
  pfUsd: string;
  pfTl: string;
  paymentRule: string;
  containerNo: string;
  containerDate: string; // Container date (project-level, same for all rows)
  itemId?: string; // 🚨 CRITICAL: Backend item ID for click handlers
}

export interface CreateProjectRequest {
  bucket: 'TLINES_NE' | 'TLINES_SE' | 'TLINES_NW' | 'CVW' | 'TLINES_HQ' | 'TLINES_TC';
  projectNo: string;
  name: string;
  address?: string;
  description?: string;
  types: string[]; // Selected types that will create placeholder line items
}

export interface ProjectsResponse {
  data: BackendProject[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// API calls
// `getProjects()` does NOT rely on a generous backend default — the server
// caps every response, on purpose (performance, browser stability, API
// protection). Instead, this helper explicitly paginates: it asks for one
// page at a time and walks `meta.totalPages` until the full operational set
// has been collected.
//
// PAGE_SIZE is intentionally aligned with the server's safe default. Don't
// crank it up to "fetch all in one go" — that defeats the cap.
// MAX_PAGES is a runaway guard: if we ever blow past it the loop stops and
// surfaces a console warning so the truncation is never silent.
export const getProjects = async (): Promise<ProjectsResponse> => {
  const PAGE_SIZE = 50;
  const MAX_PAGES = 50; // 50 * 50 = 2 500 projects before truncation kicks in

  const fetchPage = async (page: number): Promise<ProjectsResponse> => {
    const response = await apiFetch(`${API_URL}/projects?page=${page}&limit=${PAGE_SIZE}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch projects');
    }
    return response.json();
  };

  const first = await fetchPage(1);
  const all: BackendProject[] = [...first.data];
  const backendTotalPages = first.meta?.totalPages ?? 1;
  const pagesToWalk = Math.min(backendTotalPages, MAX_PAGES);

  for (let p = 2; p <= pagesToWalk; p++) {
    const next = await fetchPage(p);
    all.push(...next.data);
  }

  // ── TEMP DEV LOG: prove pagination is doing its job, never silent.
  // Disable with `window.__PROJECT_LIST_DEBUG__ = false` from the console.
  if (typeof window !== 'undefined' && (window as any).__PROJECT_LIST_DEBUG__ !== false) {
    // eslint-disable-next-line no-console
    const backendTotal = first.meta?.total ?? all.length;
    if (all.length < backendTotal) {
      // eslint-disable-next-line no-console
      console.warn(
        `[PROJECT_LIST_FE] WARNING — pagination truncated: fetched ${all.length} of ${backendTotal} projects (MAX_PAGES=${MAX_PAGES}, PAGE_SIZE=${PAGE_SIZE}). Raise MAX_PAGES or trim the data set.`
      );
    } else if (backendTotalPages > MAX_PAGES) {
      // eslint-disable-next-line no-console
      console.warn(
        `[PROJECT_LIST_FE] WARNING — backend reported ${backendTotalPages} pages, frontend cap is ${MAX_PAGES}. Tail pages were skipped.`
      );
    }
  }

  return {
    data: all,
    meta: {
      total: first.meta?.total ?? all.length,
      page: 1,
      limit: all.length,
      totalPages: 1,
    },
  };
};

export const getProject = async (projectId: string): Promise<BackendProject> => {
  const response = await apiFetch(`${API_URL}/projects/${projectId}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch project');
  }

  const data = await response.json();
  return data;
};

export const createProject = async (projectData: CreateProjectRequest): Promise<BackendProject> => {
  const response = await apiFetch(`${API_URL}/projects`, {
    method: 'POST',
    body: JSON.stringify(projectData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create project');
  }

  const data = await response.json();
  return data;
};

// ==================== VENDOR API FUNCTIONS ====================

export const getVendors = async (): Promise<Vendor[]> => {
  const response = await apiFetch(`${API_URL}/vendors`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch vendors');
  }

  const data = await response.json();
  return data;
};

export const createVendor = async (vendorData: CreateVendorRequest): Promise<Vendor> => {
  const response = await apiFetch(`${API_URL}/vendors`, {
    method: 'POST',
    body: JSON.stringify(vendorData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create vendor');
  }

  const data = await response.json();
  return data;
};

export const updateVendor = async (vendorId: string, vendorData: UpdateVendorRequest): Promise<Vendor> => {
  const response = await apiFetch(`${API_URL}/vendors/${vendorId}`, {
    method: 'PATCH',
    body: JSON.stringify(vendorData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update vendor');
  }

  const data = await response.json();
  return data;
};

export const deleteVendor = async (vendorId: string): Promise<{ message: string }> => {
  const response = await apiFetch(`${API_URL}/vendors/${vendorId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete vendor');
  }

  const data = await response.json();
  return data;
};

// ==================== ORDER TYPE API FUNCTIONS ====================

// Order type interfaces
export interface OrderType {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderTypeRequest {
  name: string;
}

export interface UpdateOrderTypeRequest {
  name?: string;
  isActive?: boolean;
}

export const getOrderTypes = async (): Promise<OrderType[]> => {
  const response = await apiFetch(`${API_URL}/order-types`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch order types');
  }

  const data = await response.json();
  return data;
};

export const createOrderType = async (orderTypeData: CreateOrderTypeRequest): Promise<OrderType> => {
  const response = await apiFetch(`${API_URL}/order-types`, {
    method: 'POST',
    body: JSON.stringify(orderTypeData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create order type');
  }

  const data = await response.json();
  return data;
};

export const updateOrderType = async (orderTypeId: string, orderTypeData: UpdateOrderTypeRequest): Promise<OrderType> => {
  const response = await apiFetch(`${API_URL}/order-types/${orderTypeId}`, {
    method: 'PATCH',
    body: JSON.stringify(orderTypeData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update order type');
  }

  const data = await response.json();
  return data;
};

export const deleteOrderType = async (orderTypeId: string): Promise<{ message: string }> => {
  const response = await apiFetch(`${API_URL}/order-types/${orderTypeId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete order type');
  }

  const data = await response.json();
  return data;
};

// Project Item API interfaces
export interface CreateProjectItemRequest {
  type: 'MILLWORK' | 'SHELVING' | 'CEILING' | 'IMAGE' | 'FURNITURE';
  vendorId?: string; // Vendor ID reference
  orderType?: string;
  pfSignStatus?: 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED' | 'WAITING_TLINES_TO_SIGN' | 'WAITING_T_TO_SIGN' | 'SIGNED_WITH_EST_PRICE';
  poSignStatus?: 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED' | 'WAITING_TLINES_TO_SIGN' | 'WAITING_T_TO_SIGN';
  status?: 'HOLD_T' | 'HOLD_PM' | 'HOLD_BOOKS' | 'NOT_ORDERED' | 'TO_ORDER' | 'ORDERED' | 'ASSEMBLY' | 'READY_TO_RECEIVE' | 'RECEIVED' | 'READY' | 'SENT_TO_TLINES' | 'PARTIAL_SENT' | 'SENT';
  std?: string; // ISO date string
  etd?: string; // ISO date string
  rtd?: string; // ISO date string
  ftd?: string; // ISO date string
  containerNo?: string;
}

export interface UpdateProjectItemRequest {
  vendorId?: string;
  orderType?: string;
  pfSignStatus?: 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED' | 'WAITING_TLINES_TO_SIGN' | 'WAITING_T_TO_SIGN' | 'SIGNED_WITH_EST_PRICE';
  poSignStatus?: 'NOT_SIGNED' | 'READY_TO_SIGN' | 'SIGNED' | 'WAITING_TLINES_TO_SIGN' | 'WAITING_T_TO_SIGN';
  status?: 'HOLD_T' | 'HOLD_PM' | 'HOLD_BOOKS' | 'NOT_ORDERED' | 'TO_ORDER' | 'ORDERED' | 'ASSEMBLY' | 'READY_TO_RECEIVE' | 'RECEIVED' | 'READY' | 'SENT_TO_TLINES' | 'PARTIAL_SENT' | 'SENT';
  std?: string; // ISO date string
  etd?: string; // ISO date string
  rtd?: string; // ISO date string
  ftd?: string; // ISO date string
  pfUsd?: number; // PF USD amount
  pfTl?: number; // PF TL amount
  paidUsd1?: number; // First USD payment
  paidUsd2?: number; // Second USD payment
  paidTl1?: number; // First TL payment
  paidTl2?: number; // Second TL payment
  containerNo?: string;
  invoice?: number | null;
  invoiceTl?: number | null;
}

// ==================== PROJECT ITEM API FUNCTIONS ====================

export const createProjectItem = async (projectId: string, itemData: CreateProjectItemRequest): Promise<BackendProjectItem> => {
  // Sanitize payload to remove UI-only fields
  const sanitizedData = sanitizeProjectItemPayload(itemData);

  const response = await apiFetch(`/api/projects/${projectId}/items`, {
    method: 'POST',
    body: JSON.stringify(sanitizedData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create project item');
  }

  const data = await response.json();
  return data;
};

export const updateProjectItem = async (itemId: string, itemData: UpdateProjectItemRequest): Promise<BackendProjectItem> => {
  // Sanitize payload to remove UI-only fields
  const sanitizedData = sanitizeProjectItemPayload(itemData);

  const requestUrl = `/api/projects/items/${itemId}`;
  const requestPayload = JSON.stringify(sanitizedData);

  // 🚨 FRONTEND REQUEST LOGGING - Capture exact request details

  // Special logging for poSignStatus updates to verify enum values
  if (itemData.poSignStatus) {
  }

  const response = await apiFetch(requestUrl, {
    method: 'PATCH',
    body: requestPayload,
  });

  // Log response status

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('❌ [FRONTEND ERROR] Update failed:', {
      status: response.status,
      errorData,
      requestUrl,
      payload: itemData
    });
    throw new Error(errorData.message || 'Failed to update project item');
  }

  const data = await response.json();

  // Log successful response data

  return data;
};

export const deleteProjectItem = async (projectId: string, itemId: string): Promise<{ message: string }> => {
  const response = await apiFetch(`${API_URL}/projects/${projectId}/items/${itemId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete project item');
  }

  const data = await response.json();
  return data;
};

export const getProjectItems = async (projectId: string): Promise<BackendProjectItem[]> => {
  const response = await apiFetch(`${API_URL}/projects/${projectId}/items`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch project items');
  }

  const data = await response.json();
  return data;
};

export const getProjectItem = async (projectId: string, itemId: string): Promise<BackendProjectItem> => {
  const response = await apiFetch(`${API_URL}/projects/${projectId}/items/${itemId}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch project item');
  }

  const data = await response.json();
  return data;
};

// DEBUG: Get raw DB values for a project item (Admin only)
export const debugProjectItemRawDB = async (itemId: string): Promise<{
  id: string;
  poSignStatus: string;
  pfSignStatus: string;
  status: string | null;
  std: string | null;
  rtd: string | null;
  etd: string | null;
  ftd: string | null;
  updatedAt: string;
}> => {
  const response = await apiFetch(`${API_URL}/projects/items/${itemId}/debug`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch debug item data');
  }

  const data = await response.json();


  return data;
};

export const bulkAssignProjectHalf = async (
  projectIds: string[],
  halfOfYear: ProjectHalf | null,
  halfYear: number | null,
): Promise<{ updatedCount: number }> => {
  const response = await apiFetch(`${API_URL}/projects/bulk/half`, {
    method: 'PATCH',
    body: JSON.stringify({ projectIds, halfOfYear, halfYear }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to assign half');
  }

  return response.json();
};

export const deleteProject = async (projectId: string): Promise<{ message: string }> => {
  const response = await apiFetch(`${API_URL}/projects/${projectId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete project');
  }

  const data = await response.json();
  return data;
};

// Utility function to map backend data to frontend format
export const mapBackendProjectsToSections = (backendProjects: BackendProject[]): ApiSection[] => {
  // Group projects by bucket
  const projectsByBucket = backendProjects.reduce((acc, project) => {
    if (!acc[project.bucket]) {
      acc[project.bucket] = [];
    }
    acc[project.bucket].push(project);
    return acc;
  }, {} as Record<string, BackendProject[]>);

  // Map buckets to sections
  const sections: ApiSection[] = [
    {
      id: 'tlines-ne',
      label: 'TLines NE',
      projects: (projectsByBucket['TLINES_NE'] || []).map(mapBackendProjectToFrontend)
    },
    {
      id: 'tlines-se',
      label: 'TLines SE',
      projects: (projectsByBucket['TLINES_SE'] || []).map(mapBackendProjectToFrontend)
    },
    {
      id: 'tlines-sc',
      label: 'TLines NW',
      projects: (projectsByBucket['TLINES_NW'] || []).map(mapBackendProjectToFrontend)
    },
    {
      id: 'cvw',
      label: 'TLines CVW',
      projects: (projectsByBucket['CVW'] || []).map(mapBackendProjectToFrontend)
    },
    {
      id: 'tlines-hq',
      label: 'TLines HQ',
      projects: (projectsByBucket['TLINES_HQ'] || []).map(mapBackendProjectToFrontend)
    },
    {
      id: 'tlines-tc',
      label: 'TLines TC',
      projects: (projectsByBucket['TLINES_TC'] || []).map(mapBackendProjectToFrontend)
    }
  ];

  return sections;
};

// Helper function to map backend project to frontend format
export const mapBackendProjectToFrontend = (backendProject: BackendProject): ApiProject => {
  // Generate project color using global business rules
  const projectNumberColor = getProjectColor(backendProject);

  // CRITICAL: Apply YSM + PF sorting to backend items before mapping to rows
  const sortedBackendItems = sortItemsForDisplay(backendProject.items || []);

  // Map sorted line items to rows
  const rows: ApiRow[] = sortedBackendItems.map(item => ({
    type: mapBackendTypeToFrontend(item.type, item.customType),
    pfCode: item.pfCode || '',
    vendor: item.vendor
      ? (item.vendor.code ? `${item.vendor.code} - ${item.vendor.name}` : item.vendor.name)
      : '', // Include code for consistency, fallback to name only if code is missing
    vendorId: item.vendorId || '',
    orderType: item.orderType || '',
    pfSignStatus: mapSignStatusToFrontend(item.pfSignStatus),
    poSignStatus: mapSignStatusToFrontend(item.poSignStatus), // ADDED: Map PO sign status from backend
    status: mapItemStatusToFrontend(item.status || 'NOT_ORDERED'),
    std: item.std || '',
    etd: item.etd || '',
    rtd: item.rtd || '',
    rtr: item.rtr || '',
    rdy: item.rdy || '',
    ftd: item.ftd || '',
    snd: item.snd || '',
    statusNote: item.statusNote || '',
    pfUsd: item.pfUsd ? item.pfUsd.toString() : '',
    pfTl: item.pfTl ? item.pfTl.toString() : '',
    paymentRule: item.paymentRule || '',
    containerNo: item.containerNo || '',
    containerDate: backendProject.containerDate ? new Date(backendProject.containerDate).toISOString().split('T')[0] : '', // Project-level field, same for all rows
    itemId: item.id // 🚨 CRITICAL FIX: Add itemId for click handlers
  }));

  // Build PO Sign Status by type from actual items (FIXED: Proper aggregation)
  const poSignStatusByType: Record<string, string> = {};
  const typeGroups: Record<string, string[]> = {};

  // First, group items by type and collect their PO statuses
  (backendProject.items || []).forEach(item => {
    const frontendType = mapBackendTypeToFrontend(item.type, item.customType);
    const mappedStatus = mapSignStatusToFrontend(item.poSignStatus);

    if (!typeGroups[frontendType]) {
      typeGroups[frontendType] = [];
    }
    typeGroups[frontendType].push(mappedStatus);
  });

  // Then, determine type-level status using business rules
  Object.keys(typeGroups).forEach(frontendType => {
    const statuses = typeGroups[frontendType];

    // Business rule: Type-level status priority
    if (statuses.includes('SIGNED')) {
      // If ANY item is SIGNED, type-level shows SIGNED
      poSignStatusByType[frontendType] = 'SIGNED';
    } else if (statuses.includes('WAITING TLINES TO SIGN')) {
      poSignStatusByType[frontendType] = 'WAITING TLINES TO SIGN';
    } else if (statuses.includes('WAITING T TO SIGN')) {
      poSignStatusByType[frontendType] = 'WAITING T TO SIGN';
    } else if (statuses.includes('READY TO SIGN')) {
      // If ANY item is READY TO SIGN (but none SIGNED), show READY TO SIGN
      poSignStatusByType[frontendType] = 'READY TO SIGN';
    } else {
      // All items are NOT SIGNED
      poSignStatusByType[frontendType] = 'NOT SIGNED';
    }

  });

  return {
    projectId: backendProject.id,
    projectNumber: backendProject.projectNo, // Keep original projectNo (e.g., "DO-01", "P-123")
    projectNumberColor,
    projectName: backendProject.name,
    address: backendProject.address || '',
    region: 'Generated', // Default region since backend doesn't have this field
    rows, // Map from backend items
    poSignStatusByType, // Built from actual line items
    backendItems: backendProject.items || [], // Preserve raw backend items for editing
    isUrgent: backendProject.isUrgent || false, // Preserve urgent status from backend
    containerDate: backendProject.containerDate || null, // Preserve container date from backend
    halfOfYear: backendProject.halfOfYear || null,
    halfYear: backendProject.halfYear || null
  };
};

// (Removed old hash-based color generation - now using shared business rules)

// Helper functions to map backend enums to frontend strings - EXPORTED for use in components
export const mapBackendTypeToFrontend = (backendType: string | null, customType?: { name: string } | null): string => {
  // If custom type exists, use its name
  if (customType?.name) {
    return customType.name;
  }

  // Otherwise use enum mapping
  if (!backendType) return 'Unknown';

  const typeMap: Record<string, string> = {
    'MILLWORK': 'Millwork',
    'SHELVING': 'Shelving',
    'CEILING': 'Ceiling',
    'IMAGE': 'Image',
    'FURNITURE': 'Furniture',
    'DECORATION': 'Decoration'
  };
  return typeMap[backendType] || backendType;
};

export const mapSignStatusToFrontend = (backendStatus: string): string => {
  const statusMap: Record<string, string> = {
    'NOT_SIGNED': 'NOT SIGNED',
    'READY_TO_SIGN': 'READY TO SIGN',
    'SIGNED': 'SIGNED',
    'WAITING_TLINES_TO_SIGN': 'WAITING TLINES TO SIGN',
    'WAITING_T_TO_SIGN': 'WAITING T TO SIGN',
    'SIGNED_WITH_EST_PRICE': 'SIGNED WITH EST PRICE',
    // Retired price variants (data was migrated to SIGNED) — display as SIGNED if any linger
    'SIGNED_NO_PRICE': 'SIGNED',
    'SIGNED_WITH_PRICE': 'SIGNED',
  };
  return statusMap[backendStatus] || backendStatus;
};

// 🚨 NEW: Map display values back to backend enum values for PATCH requests
export const mapSignStatusToEnum = (displayValue: string): string => {
  const enumMap: Record<string, string> = {
    'NOT SIGNED': 'NOT_SIGNED',
    'READY TO SIGN': 'READY_TO_SIGN',
    'SIGNED': 'SIGNED',
    'WAITING TLINES TO SIGN': 'WAITING_TLINES_TO_SIGN',
    'WAITING T TO SIGN': 'WAITING_T_TO_SIGN',
    'SIGNED WITH EST PRICE': 'SIGNED_WITH_EST_PRICE',
  };
  return enumMap[displayValue] || displayValue;
};

// 🚨 NEW: Map frontend display types back to backend enum values
export const mapTypeToEnum = (displayValue: string): string => {
  const enumMap: Record<string, string> = {
    'Millwork': 'MILLWORK',
    'Shelving': 'SHELVING',
    'Ceiling': 'CEILING',
    'Image': 'IMAGE',
    'Furniture': 'FURNITURE',
    'Decoration': 'DECORATION'
  };
  return enumMap[displayValue] || displayValue;
};

export const mapItemStatusToFrontend = (backendStatus: string | null): string => {
  if (!backendStatus) return '';

  const statusMap: Record<string, string> = {
    'HOLD_T': 'HOLD / T',
    'HOLD_PM': 'HOLD / PM',
    'HOLD_BOOKS': 'HOLD BOOKS',
    'NOT_ORDERED': 'NOT ORDERED',
    'TO_ORDER': 'TO ORDER',
    'BOOKS_IN_PROGRESS': 'BOOKS IN PROGRESS',
    'ORDERED': 'ORDERED',
    'ASSEMBLY': 'ASSEMBLY',
    'READY_TO_RECEIVE': 'READY TO RECEIVE',
    'RECEIVED': 'RECEIVED',
    'READY': 'READY',
    'SENT_TO_TLINES': 'SENT TO TLINES',
    'PARTIAL_SENT': 'PARTIAL SENT',
    'SENT': 'SENT'
  };
  return statusMap[backendStatus] || backendStatus;
};

// Helper function to map frontend section to backend bucket
export const mapSectionToBucket = (sectionId: string): 'TLINES_NE' | 'TLINES_SE' | 'TLINES_NW' | 'CVW' | 'TLINES_HQ' | 'TLINES_TC' => {
  switch (sectionId) {
    case 'tlines-ne':
      return 'TLINES_NE';
    case 'tlines-se':
      return 'TLINES_SE';
    case 'tlines-sc':
      return 'TLINES_NW';
    case 'cvw':
      return 'CVW';
    case 'tlines-hq':
      return 'TLINES_HQ';
    case 'tlines-tc':
      return 'TLINES_TC';
    default:
      throw new Error(`Unknown section ID: ${sectionId}`);
  }
};
```

---

## FILE: lib/sanitizePayload.ts

```ts
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
```

---

## FILE: lib/today-pf.ts

```ts
// Today's PFs API helper
import { apiFetch } from './auth';

export type TodayPfKind = 'PF' | 'ORDER' | 'FOLLOWUP';

export interface TodayPfFlag {
  id: string;
  kind: TodayPfKind;
  projectId: string;
  projectNo: string;
  projectName: string;
  bucket: string;
  type: string | null;
  customTypeId: string | null;
  typeLabel: string;
  createdAt: string;
  completedAt: string | null;
  itemId: string | null; // ORDER flags target one specific PF; PF flags are type-level (null)
  pfCode: string | null;
  vendorName: string | null;
  itemStatus: string | null;
  totalItems: number;
  filledItems: number;
}

export const getTodayPfFlags = async (): Promise<TodayPfFlag[]> => {
  const response = await apiFetch('/api/today-pf');
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch Today's PFs");
  }
  return response.json();
};

export const createTodayPfFlag = async (data: { projectId: string; type?: string; customTypeId?: string; kind?: TodayPfKind; itemId?: string }): Promise<TodayPfFlag> => {
  const response = await apiFetch('/api/today-pf', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create flag');
  }
  return response.json();
};

export const deleteTodayPfFlag = async (id: string): Promise<{ message: string }> => {
  const response = await apiFetch(`/api/today-pf/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to remove flag');
  }
  return response.json();
};

/**
 * Token used to match a flag against a grid row: projectId + the same display
 * type label shown in the TYPE column (e.g. "Millwork", "Image", or a custom
 * type's name) — this is what a Row's `type` field already carries, so no
 * raw enum/customTypeId reconciliation is needed on the frontend.
 */
export const todayPfKey = (projectId: string, typeLabel: string): string => `${projectId}:${typeLabel}`;

/** Token for an item-level (To Order) flag — matched against a Row's itemId. */
export const todayPfItemKey = (itemId: string): string => `item:${itemId}`;

export const todayPfActiveKeys = (flags: TodayPfFlag[]): Set<string> =>
  new Set(flags.map(f => (f.itemId ? todayPfItemKey(f.itemId) : todayPfKey(f.projectId, f.typeLabel))));
```

---

## FILE: lib/trust-stock.ts

```ts
import { apiFetch, getToken } from './auth';
import type { Project } from '../types';
import type { BackendProjectItem } from './projects';
import { mapBackendTypeToFrontend, mapSignStatusToFrontend } from './projects';

/* ============================================================================
 * Trust Stock — purchases Trust makes for its own stock (Trust Stock company).
 * Groups ("STOCK 1", "STOCK 2" …) play the role of projects; items mirror
 * project items so the shared ProjectBlock table can render/edit them.
 * ========================================================================== */

const API_BASE = '/api/trust-stock';

export interface TrustStockItem {
  id: string;
  groupId: string;
  type: string | null;
  customTypeId: string | null;
  customType?: { id: string; name: string; code: string; description?: string | null } | null;
  vendorId: string | null;
  vendor?: { id: string; code: string; name: string } | null;
  pfCode: string | null;
  orderNo: string | null;
  orderType: string | null;
  pfSignStatus: string;
  poSignStatus: string;
  status: string | null;
  std: string | null;
  etd: string | null;
  rtr: string | null;
  rtd: string | null;
  rdy: string | null;
  ftd: string | null;
  snd: string | null;
  pfUsd: string | number | null;
  pfTl: string | number | null;
  invoice: string | number | null;
  invoiceTl: string | number | null;
  paidUsd1: string | number | null;
  paidUsd2: string | number | null;
  paidTl1: string | number | null;
  paidTl2: string | number | null;
  paidUsd1Date: string | null;
  paidUsd2Date: string | null;
  paidTl1Date: string | null;
  paidTl2Date: string | null;
  paymentRule: string | null;
  statusNote: string | null;
  priceNotes: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrustStockGroup {
  id: string;
  code: string;
  name: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: TrustStockItem[];
}

async function json<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || fallback);
  }
  return res.json();
}

export async function getTrustStockGroups(): Promise<TrustStockGroup[]> {
  const data = await json<{ data: TrustStockGroup[] }>(await apiFetch(`${API_BASE}/groups`), 'Failed to load Trust Stock');
  return data.data;
}

/** Leave `code` empty to get the next "STOCK n". */
export async function createTrustStockGroup(data: { code?: string; name?: string }): Promise<TrustStockGroup> {
  return json(await apiFetch(`${API_BASE}/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }), 'Failed to create stock group');
}

export async function deleteTrustStockGroup(groupId: string): Promise<void> {
  await json(await apiFetch(`${API_BASE}/groups/${groupId}`, { method: 'DELETE' }), 'Failed to delete stock group');
}

export async function createTrustStockItem(groupId: string, data: Record<string, any>): Promise<BackendProjectItem> {
  const item = await json<TrustStockItem>(await apiFetch(`${API_BASE}/groups/${groupId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }), 'Failed to create stock item');
  return mapTrustStockItemToBackendItem(item);
}

export async function updateTrustStockItem(itemId: string, data: Record<string, any>): Promise<BackendProjectItem> {
  const item = await json<TrustStockItem>(await apiFetch(`${API_BASE}/items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }), 'Failed to update stock item');
  return mapTrustStockItemToBackendItem(item);
}

export async function deleteTrustStockItem(itemId: string): Promise<void> {
  await json(await apiFetch(`${API_BASE}/items/${itemId}`, { method: 'DELETE' }), 'Failed to delete stock item');
}

/** Stock item → the BackendProjectItem shape ProjectBlock / AccountingGrid work with. */
export function mapTrustStockItemToBackendItem(item: TrustStockItem): BackendProjectItem {
  return {
    ...(item as any),
    projectId: item.groupId,
    vendor: item.vendor ? { id: item.vendor.id, code: item.vendor.code, name: item.vendor.name } : undefined,
    containerNo: null,
    containerDate: null,
    duePaid: false,
  } as BackendProjectItem;
}

/** Stock group → the Project shape ProjectBlock renders ("STOCK 1" in the project-number column). */
export function mapTrustStockGroupToProject(group: TrustStockGroup): Project {
  const items = group.items || [];
  return {
    projectId: group.id,
    projectNumber: group.code,
    projectNumberColor: 'green',
    projectName: group.name || group.code,
    address: '',
    isUrgent: false,
    region: 'TRUST_STOCK',
    poSignStatusByType: {},
    rows: items.map(item => ({
      type: mapBackendTypeToFrontend(item.type as any, item.customType as any),
      pfCode: item.pfCode || '',
      vendor: item.vendor ? (item.vendor.code ? `${item.vendor.code} - ${item.vendor.name}` : item.vendor.name) : '',
      vendorId: item.vendorId || '',
      orderType: item.orderType || '',
      pfSignStatus: mapSignStatusToFrontend(item.pfSignStatus as any),
      poSignStatus: mapSignStatusToFrontend(item.poSignStatus as any),
      status: (item.status || '').replace(/_/g, ' '),
      statusNote: item.statusNote || '',
      std: item.std || '',
      etd: item.etd || '',
      rtd: item.rtd || '',
      rtr: item.rtr || '',
      rdy: item.rdy || '',
      ftd: item.ftd || '',
      snd: item.snd || '',
      pfUsd: item.pfUsd != null ? String(item.pfUsd) : '',
      pfTl: item.pfTl != null ? String(item.pfTl) : '',
      paymentRule: item.paymentRule || '',
      containerNo: '',
      containerDate: '',
      customTypeId: item.customTypeId || null,
      itemId: item.id,
    })) as any,
    backendItems: items.map(mapTrustStockItemToBackendItem),
  } as Project;
}

/* ── PF PDF import ─────────────────────────────────────────────────────────── */

export interface ParsedStockProduct {
  itemCode: string;
  description: string;
  category: string | null;
  quantity: number;
  unitPrice: number | null;
  totalPrice: number | null;
}

export interface PfPdfPreview {
  stockCode: string | null;
  pfCode: string | null;
  supplierName: string | null;
  vendor: { id: string; code: string; name: string } | null;
  pfDate: string | null;
  type: string | null;
  currency: 'USD' | 'TL' | 'EUR';
  totalPrice: number | null;
  paymentRule: string | null;
  products: ParsedStockProduct[];
  warnings: string[];
  groupStatus: 'new' | 'exists' | 'in-trash';
  duplicateOf: { itemId: string; groupCode: string } | null;
}

export interface PfImportData {
  stockCode: string;
  pfCode: string;
  vendorId: string | null;
  type: string | null;
  orderNo?: string | null;
  pfDate: string | null;
  currency: 'USD' | 'TL' | 'EUR';
  totalPrice: number | null;
  paymentRule: string | null;
  products: ParsedStockProduct[];
}

// Multipart uploads can't go through apiFetch (it forces a JSON content type)
async function uploadForm(path: string, form: FormData) {
  const token = getToken();
  const base = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001/api');
  const url = base ? `${base}${path.replace(/^\/api/, '')}` : path;
  const res = await fetch(url, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
    credentials: 'include',
  });
  return json<any>(res, 'Upload failed');
}

export async function previewTrustStockPdf(file: File): Promise<PfPdfPreview> {
  const form = new FormData();
  form.append('file', file);
  return uploadForm(`${API_BASE}/pdf/preview`, form);
}

export async function importTrustStockPdf(file: File, data: PfImportData): Promise<TrustStockItem> {
  const form = new FormData();
  form.append('file', file);
  form.append('data', JSON.stringify(data));
  return uploadForm(`${API_BASE}/pdf/import`, form);
}

/** Opens the stored PF PDF in a new tab. */
export async function openTrustStockPdf(itemId: string): Promise<void> {
  const win = window.open('', '_blank'); // open synchronously so popup blockers allow it
  const res = await apiFetch(`${API_BASE}/items/${itemId}/pdf`);
  if (!res.ok) {
    win?.close();
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'PDF not available');
  }
  const url = URL.createObjectURL(await res.blob());
  if (win) win.location.href = url; else window.open(url, '_blank');
}

/** Builds the re-order PF (everything with an Order quantity) and downloads it. */
export async function downloadReorderPf(productIds?: string[]): Promise<void> {
  const res = await apiFetch(`${API_BASE}/reorder-pf`, { method: 'POST', body: JSON.stringify({ productIds }) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Could not create the re-order PF');
  }
  const name = decodeURIComponent(/filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') || '')?.[1] || 'REORDER-PF.pdf');
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/* ── Stock contents & usage ────────────────────────────────────────────────── */

export type StockMoveKind = 'TAKEN' | 'RETURNED' | 'RESERVED';
export type StockStatus = 'PENDING_VERIFICATION' | 'OUT_OF_STOCK' | 'REORDER_NOW' | 'WATCH' | 'HEALTHY';

export interface StockProductUsage {
  id: string;
  kind: StockMoveKind;
  quantity: number;
  note: string | null;
  takenBy: string | null;
  createdAt: string;
  projectItemId: string;
  projectNo: string;
  projectName: string;
  projectPfCode: string | null;
  rowDeleted: boolean;
}

export interface StockProduct {
  id: string;
  itemCode: string;
  description: string;
  dimensions: string | null;
  category: string | null;
  /** original ordered quantity */
  quantity: number;
  receivedAt: string | null;
  // stock-sheet figures (see TrustStockService.stats)
  ordered: number;
  received: number | null;
  taken: number;
  returned: number;
  netUsed: number;
  reserved: number;
  onHand: number | null;
  available: number | null;
  remainingPct: number | null;
  reorderThreshold: number | null;
  /** suggested re-order (ordered − available) once at the reorder point; 0 otherwise */
  reorderQty: number;
  status: StockStatus;
  /** what can still be taken/reserved (ordered qty is the cap until the receipt is confirmed) */
  takeable: number;
  unitPrice: number | null;
  totalPrice: number | null;
  currency: string;
  stockItem: {
    id: string;
    pfCode: string | null;
    orderNo: string | null;
    pfDate: string | null;
    type: string | null;
    hasPdf: boolean;
    vendor: { id: string; code: string; name: string } | null;
    group: { id: string; code: string };
  };
  usages: StockProductUsage[];
}

export async function getStockProducts(): Promise<StockProduct[]> {
  return json(await apiFetch(`${API_BASE}/products`), 'Failed to load stock contents');
}

/** Same list, readable with Projects access (used by the "Use from Trust Stock" picker). */
export async function getAvailableStockProducts(): Promise<StockProduct[]> {
  return json(await apiFetch(`${API_BASE}/usage/products`), 'Failed to load stock');
}

export async function updateStockProduct(id: string, data: Partial<Pick<StockProduct, 'itemCode' | 'description' | 'dimensions' | 'quantity' | 'unitPrice' | 'totalPrice'>> & { receivedQuantity?: number | null }) {
  return json(await apiFetch(`${API_BASE}/products/${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }), 'Failed to update product');
}

export async function deleteStockProduct(id: string) {
  return json(await apiFetch(`${API_BASE}/products/${id}`, { method: 'DELETE' }), 'Failed to remove product');
}

export interface RowStockUsage {
  id: string;
  kind: StockMoveKind;
  quantity: number;
  note: string | null;
  takenBy: string | null;
  createdAt: string;
  productId: string;
  itemCode: string;
  description: string;
  unitPrice: number | null;
  currency: string;
  stockPfCode: string | null;
  stockCode: string;
}

export async function getRowStockUsage(projectItemId: string): Promise<RowStockUsage[]> {
  return json(await apiFetch(`${API_BASE}/usage?projectItemId=${encodeURIComponent(projectItemId)}`), 'Failed to load stock usage');
}

export async function addStockUsage(projectItemId: string, productId: string, quantity: number) {
  return json(await apiFetch(`${API_BASE}/usage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectItemId, productId, quantity }),
  }), 'Failed to use stock');
}

export interface StockMovementLine { productId: string; take?: number; reserve?: number; return?: number; note?: string }

/** Take / reserve / return several products for one Projects row in one go. */
export async function applyStockMovements(projectItemId: string, lines: StockMovementLine[], takenBy: string): Promise<RowStockUsage[]> {
  return json(await apiFetch(`${API_BASE}/usage/movements`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectItemId, takenBy, lines }),
  }), 'Failed to save stock movements');
}

export const STOCK_STATUS_STYLE: Record<StockStatus, { label: string; bg: string; fg: string }> = {
  HEALTHY: { label: 'HEALTHY', bg: '#dcfce7', fg: '#166534' },
  WATCH: { label: 'WATCH', bg: '#fef3c7', fg: '#92400e' },
  REORDER_NOW: { label: 'REORDER NOW', bg: '#fee2e2', fg: '#b91c1c' },
  OUT_OF_STOCK: { label: 'OUT OF STOCK', bg: '#7f1d1d', fg: '#ffffff' },
  PENDING_VERIFICATION: { label: 'PENDING VERIFICATION', bg: '#e5e7eb', fg: '#374151' },
};

export async function removeStockUsage(id: string) {
  return json(await apiFetch(`${API_BASE}/usage/${id}`, { method: 'DELETE' }), 'Failed to remove usage');
}

/** The Trust Stock company as a vendor in the Projects table ("TR-STOCK"). */
export function isStockVendorCode(code?: string | null): boolean {
  return !!code && code.toUpperCase().replace(/[^A-Z]/g, '') === 'TRSTOCK';
}

/** Names entered before as "taken by" (for the dropdown). */
export async function getStockPeople(): Promise<string[]> {
  return json(await apiFetch(`${API_BASE}/usage/people`), 'Failed to load names');
}

/** One remembered product (latest entry per item code) for the manual-entry dropdown. */
export interface StockCatalogItem {
  itemCode: string;
  description: string;
  dimensions: string | null;
  category: string | null;
  unitPrice: number | null;
  currency: string;
}

export async function getStockCatalog(): Promise<StockCatalogItem[]> {
  return json(await apiFetch(`${API_BASE}/catalog`), 'Failed to load product catalog');
}
```

---

## FILE: pages/OperationalBoard.tsx

```tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import FilterBar, { FilterConfig } from '../components/FilterBar';
import OperationalBoardGrid, { OperationalBoardGridHandle } from '../components/OperationalBoardGrid';
import HalfAssignmentToolbar from '../components/HalfAssignmentToolbar';
import AddProjectDrawer, { NewProjectData } from '../components/AddProjectDrawer';
import AccessDenied from '../components/AccessDenied';
import { createProject, getProjects, bulkAssignProjectHalf, ApiSection } from '../lib/projects';
import { createMissingExtraCase, bulkAssignMissingExtraHalf } from '../lib/missing-extra';
import { TodayPfFlag, todayPfActiveKeys } from '../lib/today-pf';
import { PfGroup, getPfGroups } from '../lib/pf-groups';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { ProjectType } from '../types';
import { usePagePermissions } from '../hooks/usePagePermissions';
import { useColumnPermissions } from '../hooks/useColumnPermissions';
import { exportProjectsToExcel } from '../utils/excel/exportProjectsExcel';
import { exportProjectsAllTabsToExcel } from '../utils/excel/exportProjectsAllTabsExcel';

// Map dashboard issueType to the problematic field
const ISSUE_TYPE_TO_FIELD: Record<string, string> = {
  'ORDERED_NO_ETD': 'etd',
  'READY_NO_RTD': 'rtd',
  'SENT_TO_TLINES_NO_FTD': 'ftd',
  'RECEIVED_NO_RTD': 'rtd',
  'NO_VENDOR': 'vendor',
  'NO_ORDER_TYPE': 'orderType',
  'NO_CONTAINER': 'containerNo',
};

// Type options for Missing & Extra case creation (same as Add Project)
const TYPE_OPTIONS: { value: ProjectType; label: string }[] = [
  { value: 'Millwork', label: 'Millwork' },
  { value: 'Shelving', label: 'Shelving' },
  { value: 'Ceiling', label: 'Ceiling' },
  { value: 'Furniture', label: 'Furniture' },
  { value: 'Image', label: 'Image' }
];

interface OperationalBoardProps {
  mode?: 'projects' | 'missingExtra';
  vendorCodeFilter?: string;
}

const OperationalBoard: React.FC<OperationalBoardProps> = ({ mode = 'projects', vendorCodeFilter }) => {
  const { canAccessOperationalBoard } = usePagePermissions();
  const { isColumnVisible } = useColumnPermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sectionsData, setSectionsData] = useState<ApiSection[]>([]);
  const [allSectionsData, setAllSectionsData] = useState<ApiSection[]>([]); // Unfiltered, for filter-dropdown option lists

  // TODAY'S PFs: flags reported up by TodayPfControl (it owns fetching + socket refresh)
  const [todayPfFlags, setTodayPfFlags] = useState<TodayPfFlag[]>([]);

  // PF GROUPS: owned here (unlike Today's PFs) because both the right-click "Add to
  // Group" menu (inside each ProjectBlock) and the grouped table view need the list.
  const [pfGroups, setPfGroups] = useState<PfGroup[]>([]);
  const refreshPfGroups = useCallback(() => {
    getPfGroups().then(setPfGroups).catch(() => { /* non-critical: leave last-known groups in place */ });
  }, []);
  useEffect(() => { if (mode === 'projects') refreshPfGroups(); }, [mode, refreshPfGroups]);
  useSocketEvent('pf-group:updated', refreshPfGroups);

  // Derive unique containers from table rows for filter
  const availableContainers = useMemo(() => {
    const seen = new Map<string, string>();
    sectionsData.forEach((section: any) => {
      (section.projects || []).forEach((project: any) => {
        (project.rows || []).forEach((row: any) => {
          if (row.containerNo && row.containerNo.trim()) {
            const key = row.containerNo.trim().toLowerCase();
            if (!seen.has(key)) seen.set(key, row.containerNo.trim());
          }
        });
        (project.backendItems || []).forEach((item: any) => {
          if (item.containerNo && item.containerNo.trim()) {
            const key = item.containerNo.trim().toLowerCase();
            if (!seen.has(key)) seen.set(key, item.containerNo.trim());
          }
        });
      });
    });
    return [...seen.values()];
  }, [sectionsData]);

  // Derive distinct half/year tokens present in the data, for the Half filter dropdown.
  // Built from the UNFILTERED project set so selecting "First Half" doesn't make
  // "Second Half" disappear from the option list.
  const availableHalves = useMemo(() => {
    const seen = new Set<string>();
    allSectionsData.forEach((section: any) => {
      (section.projects || []).forEach((project: any) => {
        if (project.halfOfYear && project.halfYear) {
          seen.add(`${project.halfYear}:${project.halfOfYear}`);
        }
      });
    });
    return [...seen.values()].sort();
  }, [allSectionsData]);

  // HALF-YEAR ASSIGNMENT: currently-visible (post-filter) project ids + selection state
  const visibleProjectIds = useMemo(() => {
    const ids = new Set<string>();
    sectionsData.forEach((section: any) => {
      (section.projects || []).forEach((project: any) => {
        if (project.projectId) ids.add(project.projectId);
      });
    });
    return [...ids];
  }, [sectionsData]);

  // Half-year assignment is supported on Projects and Missing & Extra (both are
  // backed by their own real DB rows with halfOfYear/halfYear columns). Direct
  // Order has its own separate page (DirectOrder.tsx) with the same feature.
  const isHalfSelectableMode = mode === 'projects' || mode === 'missingExtra';

  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());

  // OperationalBoard is reused (not remounted) when switching between the
  // Projects and Missing & Extra tabs, so clear any leftover selection when
  // the mode changes to avoid mixing project ids with case ids.
  useEffect(() => {
    setSelectedProjectIds(new Set());
  }, [mode]);

  const handleToggleProjectSelect = useCallback((projectId: string) => {
    setSelectedProjectIds(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }, []);

  const allVisibleSelected = visibleProjectIds.length > 0 && visibleProjectIds.every(id => selectedProjectIds.has(id));

  const handleToggleSelectAll = () => {
    setSelectedProjectIds(allVisibleSelected ? new Set() : new Set(visibleProjectIds));
  };

  const handleHalfAssigned = () => {
    setSelectedProjectIds(new Set());
    // The backend excludes the acting user's own socket from the project:updated
    // broadcast (it assumes this tab already has fresh data from the HTTP response),
    // so this tab must refetch explicitly — otherwise the grid looks unchanged
    // until a manual page reload.
    gridRef.current?.refreshData();
  };

  // Dashboard highlighting: read itemId and issueType from URL
  const highlightedItemId = searchParams.get('itemId');
  const issueType = searchParams.get('issueType');
  const highlightField = issueType ? ISSUE_TYPE_TO_FIELD[issueType] || null : null;

  // Clear highlight params after 4 seconds so re-navigation works
  useEffect(() => {
    if (highlightedItemId) {
      const timer = setTimeout(() => {
        setSearchParams(prev => {
          const next = new URLSearchParams(prev);
          next.delete('itemId');
          next.delete('projectId');
          next.delete('issueType');
          return next;
        }, { replace: true });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [highlightedItemId, setSearchParams]);
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    vendors: [],
    vendorCodes: [],
    types: [],
    statuses: [],
    containers: [],
    halves: []
  });
  // Keys of flagged (project, type) pairs for whichever lists (Today's PFs / To Order) are toggled on — union when both
  const todayPfKeys = useMemo(() => todayPfActiveKeys(todayPfFlags.filter(f =>
    (f.kind === 'PF' && filterConfig.todayPfOnly) || (f.kind === 'FOLLOWUP' && filterConfig.followUpOnly)
  )), [todayPfFlags, filterConfig.todayPfOnly, filterConfig.followUpOnly]);
  const [projectSearch, setProjectSearch] = useState('');
  const [addProjectDrawerOpen, setAddProjectDrawerOpen] = useState(false);

  // Missing Extra case creation state
  const [addCaseDrawerOpen, setAddCaseDrawerOpen] = useState(false);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [caseFormData, setCaseFormData] = useState({
    section: '' as 'TLINES_NE' | 'TLINES_SE' | 'TLINES_NW' | 'CVW' | 'TLINES_HQ' | 'TLINES_TC' | '',
    projectSource: 'fromProjects' as 'fromProjects' | 'legacy',
    selectedProjectId: '',
    legacyProjectNo: '',
    legacyProjectName: '',
    caseType: '' as 'MISSING' | 'EXTRA' | 'REPLACEMENT' | '',
    caseIndex: '',
    selectedTypes: [] as ProjectType[]
  });
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [caseFormError, setCaseFormError] = useState<string | null>(null);

  // Ref to access grid refresh function
  const gridRef = React.useRef<OperationalBoardGridHandle>(null);

  const handleFilterChange = (config: FilterConfig) => {
    setFilterConfig(config);
  };

  const handleExportExcel = () => {
    if (sectionsData.length === 0) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    if (mode === 'projects') {
      // Projects export: one workbook with Projects + Missing & Extra +
      // Direct Orders + Project Total sheets
      exportProjectsAllTabsToExcel({
        projectsSections: sectionsData,
        isColumnVisible,
        filename: `Operational_Board_${dateStr}.xlsx`,
      });
    } else {
      exportProjectsToExcel({ sections: sectionsData, isColumnVisible, filename: `Missing_Extra_${dateStr}.xlsx` });
    }
  };



  const handleAddCase = () => {
    setCaseFormData({
      section: '',
      projectSource: 'fromProjects',
      selectedProjectId: '',
      legacyProjectNo: '',
      legacyProjectName: '',
      caseType: '',
      caseIndex: '',
      selectedTypes: []
    });
    setCaseFormError(null);
    setAddCaseDrawerOpen(true);

    // Load projects in background - don't block modal opening
    getProjects()
      .then((response) => {
        const projects = response.data.map((p: any) => ({
          id: p.id,
          projectNo: p.projectNo,
          name: p.name,
          section: p.bucket
        }));
        setAvailableProjects(projects);
      })
      .catch((error) => {
        console.warn('🛡️ Projects API unavailable for case creation, but legacy mode still works:', error);
        setAvailableProjects([]);
      });
  };

  const handleCloseAddProjectDrawer = () => {
    setAddProjectDrawerOpen(false);
  };

  const handleCloseAddCaseDrawer = () => {
    setAddCaseDrawerOpen(false);
    setIsCreatingCase(false);
    setCaseFormData({
      section: '',
      projectSource: 'fromProjects',
      selectedProjectId: '',
      legacyProjectNo: '',
      legacyProjectName: '',
      caseType: '',
      caseIndex: '',
      selectedTypes: []
    });
    setCaseFormError(null);
  };

  const handleTypeToggle = (type: ProjectType) => {
    setCaseFormData(prev => {
      const safeSelectedTypes = Array.isArray(prev.selectedTypes) ? prev.selectedTypes : [];
      return {
        ...prev,
        selectedTypes: safeSelectedTypes.includes(type)
          ? safeSelectedTypes.filter(t => t !== type)
          : [...safeSelectedTypes, type]
      };
    });
  };

  const handleCreateCase = async () => {
    setIsCreatingCase(true);
    setCaseFormError(null);

    let requestData: any = {
      section: caseFormData.section,
      caseType: caseFormData.caseType,
      types: caseFormData.selectedTypes.map(type => type.toUpperCase())
    };

    try {
      if (!caseFormData.section || !caseFormData.caseType) {
        setCaseFormError('Please fill in all required fields');
        setIsCreatingCase(false);
        return;
      }

      if (caseFormData.selectedTypes.length === 0) {
        setCaseFormError('Please select at least one type');
        setIsCreatingCase(false);
        return;
      }

      if (caseFormData.projectSource === 'fromProjects' && !caseFormData.selectedProjectId) {
        setCaseFormError('Please select a project');
        setIsCreatingCase(false);
        return;
      }

      if (caseFormData.projectSource === 'legacy' && (!caseFormData.legacyProjectNo || !caseFormData.legacyProjectName)) {
        setCaseFormError('Please fill in project number and name');
        setIsCreatingCase(false);
        return;
      }

      if (caseFormData.projectSource === 'fromProjects') {
        requestData.baseProjectId = caseFormData.selectedProjectId;
      } else {
        requestData.legacyProjectNo = caseFormData.legacyProjectNo.trim();
        requestData.legacyProjectName = caseFormData.legacyProjectName;
      }

      // Add custom case index if provided
      if (caseFormData.caseIndex.trim() !== '') {
        const parsedIndex = parseInt(caseFormData.caseIndex);
        if (isNaN(parsedIndex) || parsedIndex < 1) {
          setCaseFormError('Case index must be a positive number');
          setIsCreatingCase(false);
          return;
        }
        requestData.caseIndex = parsedIndex;
      }

      await createMissingExtraCase(requestData);

      handleCloseAddCaseDrawer();

      // OPTIMISTIC REFRESH: Immediately refresh Missing/Extra data
      if (gridRef.current) {
        await gridRef.current.refreshData();
      } else {
        console.warn('⚠️ Grid refresh function not available');
      }
    } catch (error) {
      setCaseFormError(`Failed to create case: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingCase(false);
    }
  };

  const handleCreateProject = async (data: NewProjectData): Promise<{ success: boolean; error?: string }> => {
    try {
      const projectRequest: any = {
        bucket: data.sectionId as 'TLINES_NE' | 'TLINES_SE' | 'TLINES_NW' | 'CVW' | 'TLINES_HQ' | 'TLINES_TC',
        projectNo: `${data.projectNumber}`,
        name: data.projectName,
        address: data.address || '',
        types: [...data.selectedTypes.map(type => type.toUpperCase()), ...data.customTypes.map(type => type.toUpperCase())],
        ...(data.dropboxSection && { dropboxSection: data.dropboxSection }),
        ...(data.dropboxRegion && { dropboxRegion: data.dropboxRegion }),
        ...(data.dropboxStatus && { dropboxStatus: data.dropboxStatus }),
        ...(data.dropboxClientType && { dropboxClientType: data.dropboxClientType }),
        ...(data.clientName && { clientName: data.clientName }),
      };

      await createProject(projectRequest);

      // Refresh grid so the new project appears immediately (don't await — let drawer close instantly)
      if (gridRef.current) {
        gridRef.current.refreshData();
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create project' };
    }
  };

  // Page Access Control
  if (!canAccessOperationalBoard) {
    return (
      <AccessDenied
        title="Projects Access Denied"
        message="Your role does not have permission to access Projects. Please contact your administrator if you need access."
      />
    );
  }

  return (
    <div className={`board-page ${mode === 'missingExtra' ? 'board-page--missing' : 'board-page--projects'}`}>
      {/* Page header with mode-specific content */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e0e0e0',
        position: 'sticky',
        top: '108px',
        zIndex: 100
      }}>
        <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>
          {mode === 'missingExtra' ? 'Missing & Extra' : 'Projects'}
        </h2>

        {mode === 'projects' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Project search */}
            {!vendorCodeFilter && (
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={projectSearch}
                  onChange={e => setProjectSearch(e.target.value)}
                  placeholder="Proje ara..."
                  style={{
                    height: '34px',
                    width: '200px',
                    padding: '0 28px 0 10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {projectSearch && (
                  <span
                    onClick={() => setProjectSearch('')}
                    style={{
                      position: 'absolute', right: '8px', top: '50%',
                      transform: 'translateY(-50%)', cursor: 'pointer',
                      color: '#9ca3af', fontSize: '16px', fontWeight: '700', lineHeight: 1
                    }}
                  >×</span>
                )}
              </div>
            )}
            <button
              onClick={handleExportExcel}
              style={{
                padding: '8px 16px',
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => setAddProjectDrawerOpen(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>+</span>
              <span>Add Project</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Project search for ME mode */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={projectSearch}
                onChange={e => setProjectSearch(e.target.value)}
                placeholder="Proje ara..."
                style={{
                  height: '34px', width: '200px',
                  padding: '0 28px 0 10px',
                  border: '1px solid #d1d5db', borderRadius: '4px',
                  fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                }}
              />
              {projectSearch && (
                <span onClick={() => setProjectSearch('')} style={{
                  position: 'absolute', right: '8px', top: '50%',
                  transform: 'translateY(-50%)', cursor: 'pointer',
                  color: '#9ca3af', fontSize: '16px', fontWeight: '700', lineHeight: 1
                }}>×</span>
              )}
            </div>
            <button
              onClick={handleExportExcel}
              style={{
                padding: '8px 16px',
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>Export Excel</span>
            </button>
            <button
              onClick={handleAddCase}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2c3e50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>+</span>
              <span>Create Missing/Extra</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter bar - only show when vendorCodeFilter is not provided */}
      {!vendorCodeFilter && (
        <FilterBar
          filterConfig={filterConfig}
          onFilterChange={handleFilterChange}
          totalItems={0}
          filteredItems={0}
          availableContainers={availableContainers}
          availableHalves={availableHalves}
          matchingProjectCount={visibleProjectIds.length}
          showTodayPf={mode === 'projects'}
          onTodayPfFlagsChange={setTodayPfFlags}
          pfGroups={mode === 'projects' ? pfGroups : []}
        />
      )}

      {/* Half-year assignment toolbar - Projects and Missing & Extra tabs */}
      {!vendorCodeFilter && isHalfSelectableMode && (
        <HalfAssignmentToolbar
          selectedCount={selectedProjectIds.size}
          allVisibleSelected={allVisibleSelected}
          visibleCount={visibleProjectIds.length}
          onToggleSelectAll={handleToggleSelectAll}
          selectedIds={Array.from(selectedProjectIds)}
          onAssign={mode === 'missingExtra' ? bulkAssignMissingExtraHalf : bulkAssignProjectHalf}
          onAssigned={handleHalfAssigned}
        />
      )}

      {/* Grid component */}
      <OperationalBoardGrid
        ref={gridRef}
        mode={mode}
        vendorCodeFilter={vendorCodeFilter}
        filterConfig={filterConfig}
        readOnly={!!vendorCodeFilter}
        onSectionsChange={setSectionsData}
        onAllSectionsChange={setAllSectionsData}
        highlightedItemId={highlightedItemId}
        highlightField={highlightField}
        projectSearch={projectSearch}
        selectedProjectIds={isHalfSelectableMode && !vendorCodeFilter ? selectedProjectIds : undefined}
        onToggleProjectSelect={isHalfSelectableMode && !vendorCodeFilter ? handleToggleProjectSelect : undefined}
        todayPfActiveKeys={mode === 'projects' ? todayPfKeys : undefined}
        pfGroups={mode === 'projects' ? pfGroups : []}
        allSectionsData={allSectionsData}
      />

      {/* Add Project Drawer */}
      <AddProjectDrawer
        isOpen={addProjectDrawerOpen}
        onClose={handleCloseAddProjectDrawer}
        onCreateProject={handleCreateProject}
        existingProjectNumbers={{}}
      />

      {/* Create Case Modal */}
      {addCaseDrawerOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            minWidth: '500px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>
              Create Missing/Extra Case
            </h3>

            {caseFormError && (
              <div style={{
                backgroundColor: '#f8d7da',
                color: '#721c24',
                padding: '12px',
                borderRadius: '4px',
                marginBottom: '20px',
                border: '1px solid #f5c6cb'
              }}>
                {caseFormError}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Section *
              </label>
              <select
                value={caseFormData.section}
                onChange={(e) => setCaseFormData(prev => ({ ...prev, section: e.target.value as any }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">-- Select Section --</option>
                <option value="TLINES_NE">TLines NE</option>
                <option value="TLINES_SE">TLines SE</option>
                <option value="TLINES_NW">TLines NW</option>
                <option value="CVW">TLines CVW</option>
                <option value="TLINES_HQ">TLines HQ</option>
                <option value="TLINES_TC">TLines TC</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500' }}>
                Project Source
              </label>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="projectSource"
                    value="fromProjects"
                    checked={caseFormData.projectSource === 'fromProjects'}
                    onChange={(e) => setCaseFormData(prev => ({ ...prev, projectSource: e.target.value as any }))}
                    style={{ marginRight: '8px' }}
                  />
                  From Projects (default)
                </label>
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="projectSource"
                    value="legacy"
                    checked={caseFormData.projectSource === 'legacy'}
                    onChange={(e) => setCaseFormData(prev => ({ ...prev, projectSource: e.target.value as any }))}
                    style={{ marginRight: '8px' }}
                  />
                  Legacy project (manual)
                </label>
              </div>
            </div>

            {caseFormData.projectSource === 'fromProjects' ? (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Select Project *
                </label>
                <select
                  value={caseFormData.selectedProjectId}
                  onChange={(e) => setCaseFormData(prev => ({ ...prev, selectedProjectId: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">-- Select Project --</option>
                  {availableProjects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.projectNo} - {project.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Project Number *
                  </label>
                  <input
                    type="text"
                    value={caseFormData.legacyProjectNo}
                    onChange={(e) => setCaseFormData(prev => ({ ...prev, legacyProjectNo: e.target.value }))}
                    placeholder="e.g., st1, 239"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={caseFormData.legacyProjectName}
                    onChange={(e) => setCaseFormData(prev => ({ ...prev, legacyProjectName: e.target.value }))}
                    placeholder="e.g., Old Project Name"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </>
            )}

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Case Type *
              </label>
              <select
                value={caseFormData.caseType}
                onChange={(e) => setCaseFormData(prev => ({ ...prev, caseType: e.target.value as any }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">-- Select Case Type --</option>
                <option value="MISSING">Missing (MS)</option>
                <option value="EXTRA">Extra (EX)</option>
                <option value="REPLACEMENT">Replacement (RE)</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Case Index (optional)
              </label>
              <input
                type="number"
                min="1"
                value={caseFormData.caseIndex}
                onChange={(e) => setCaseFormData(prev => ({ ...prev, caseIndex: e.target.value }))}
                placeholder="Auto (leave empty for next available)"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              <span style={{ fontSize: '12px', color: '#666', marginTop: '4px', display: 'block' }}>
                Leave empty for automatic numbering, or enter a specific index
              </span>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Types <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '8px',
                marginBottom: '12px'
              }}>
                {TYPE_OPTIONS.map(type => (
                  <label
                    key={type.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={(() => {
                        const safeSelectedTypes = Array.isArray(caseFormData.selectedTypes) ? caseFormData.selectedTypes : [];
                        return safeSelectedTypes.includes(type.value);
                      })()}
                      onChange={() => handleTypeToggle(type.value)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleCloseAddCaseDrawer}
                disabled={isCreatingCase}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: isCreatingCase ? 'not-allowed' : 'pointer',
                  opacity: isCreatingCase ? 0.6 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCase}
                disabled={isCreatingCase}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2c3e50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: isCreatingCase ? 'not-allowed' : 'pointer',
                  opacity: isCreatingCase ? 0.6 : 1
                }}
              >
                {isCreatingCase ? 'Creating...' : 'Create Case'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationalBoard;

// Add CSS styles for dashboard highlighting
const highlightingStyles = `
.project-container {
  transition: all 0.3s ease;
}

.project-container.highlighted {
  transform: scale(1.02);
  z-index: 10;
  position: relative;
}

.dashboard-highlighted {
  animation: dashboardHighlight 3s ease-in-out;
}

.dashboard-item-highlighted {
  animation: itemHighlight 3s ease-in-out;
  border-left: 4px solid #22c55e !important;
}

.dashboard-cell-highlighted {
  animation: cellHighlight 3s ease-in-out;
  border-radius: 3px;
  z-index: 5;
  position: relative;
}

@keyframes dashboardHighlight {
  0% {
    border: 3px solid rgba(37, 99, 235, 0.8);
    box-shadow: 0 0 20px rgba(37, 99, 235, 0.3);
    background: rgba(37, 99, 235, 0.08);
  }
  50% {
    border: 3px solid rgba(37, 99, 235, 0.5);
    box-shadow: 0 0 12px rgba(37, 99, 235, 0.2);
    background: rgba(37, 99, 235, 0.04);
  }
  100% {
    border: 3px solid transparent;
    box-shadow: none;
    background: transparent;
  }
}

@keyframes itemHighlight {
  0% {
    background: rgba(34, 197, 94, 0.5);
    transform: translateX(6px);
  }
  20% {
    background: rgba(34, 197, 94, 0.35);
    transform: translateX(3px);
  }
  70% {
    background: rgba(34, 197, 94, 0.15);
    transform: translateX(1px);
  }
  100% {
    background: transparent;
    transform: translateX(0);
  }
}

@keyframes cellHighlight {
  0% {
    background-color: rgba(220, 38, 38, 0.35);
    outline: 3px solid #dc2626;
    box-shadow: 0 0 12px rgba(220, 38, 38, 0.5);
  }
  20% {
    background-color: rgba(220, 38, 38, 0.25);
    outline: 2px solid #dc2626;
    box-shadow: 0 0 8px rgba(220, 38, 38, 0.3);
  }
  70% {
    background-color: rgba(220, 38, 38, 0.08);
    outline: 1px solid rgba(220, 38, 38, 0.3);
    box-shadow: none;
  }
  100% {
    background-color: transparent;
    outline: none;
    box-shadow: none;
  }
}

/* Enhanced visual feedback - auto-fading label */
.dashboard-highlighted::before {
  content: "Dashboard";
  position: absolute;
  top: -10px;
  right: 10px;
  background: #2563eb;
  color: white;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  z-index: 20;
  animation: fadeLabel 3s ease-in-out;
  opacity: 0;
  pointer-events: none;
}

@keyframes fadeLabel {
  0% { opacity: 0; transform: translateY(-4px); }
  15% { opacity: 1; transform: translateY(0); }
  70% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-4px); }
}
`;

// Inject highlighting styles
if (typeof document !== 'undefined') {
  const styleId = 'operational-board-highlighting';
  let styleElement = document.getElementById(styleId) as HTMLStyleElement;

  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = styleId;
    document.head.appendChild(styleElement);
  }

  styleElement.textContent = highlightingStyles;
}
```

---

## FILE: types.ts

```ts
// Vendor interfaces
export interface Vendor {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorOption {
  id: string;
  code: string;
  name: string;
  displayName: string; // Formatted as "Code - Name"
}

// Data model interfaces
export interface Row {
  type: string; // Type name (flexible string for mapping compatibility)
  pfCode: string; // Format: VendorCode-P(ProjectNo)-TypeLetter-OrderIndex
  vendor: string; // Vendor name (display only)
  vendorId?: string; // Vendor ID for editing
  orderType: string;
  pfSignStatus: string; // Flexible string for mapping compatibility
  poSignStatus: string; // PO sign status for individual items
  status: string; // Flexible string for mapping compatibility
  std: string;
  etd: string; // Editable date
  rtd: string; // Editable date
  rtr: string; // Editable date - Ready To Receive
  rdy: string; // Read-only, auto-filled when READY
  ftd: string; // Editable date
  snd: string; // Read-only, auto-filled when SENT
  statusNote: string; // Note attached to status cell
  pfUsd: string; // PF USD amount (display as string)
  pfTl: string; // PF TL amount (display as string)
  paymentRule: string; // Payment rule (editable text)
  containerNo: string; // Editable text
  containerDate: string; // Container date (project-level, same for all rows)
  expensesUsd?: string; // Expenses USD amount (expenses-p mode only)
  expensesTl?: string; // Expenses TL amount (expenses-p mode only)
  customTypeId?: string | null; // Custom type ID (set for custom types, null for enum types)
  invoice?: string; // Invoice amount (decimal)
  itemId?: string; // Backend project item ID for editing
  isRestricted?: boolean; // True if this row's type is not in user's allowedTypes (blur display, no edit)
}

export interface TypeGroup {
  type: ProjectType;
  poSignStatus: PoSignStatus; // One per type group
  rows: Row[];
}

export interface Project {
  projectId: string;
  projectNumber: number | string; // Allow string for Direct Orders (DO-01, DO-02)
  projectNumberColor: 'orange' | 'blue' | 'green' | 'red';
  projectName: string;
  address: string;
  isUrgent?: boolean;
  region: string;
  rows: Row[];
  poSignStatusByType: Record<string, string>; // Type-level PO Sign Status storage (flexible for mapping)
  backendItems?: any[]; // Backend project items for editing (using any for now to avoid import cycles)
  halfOfYear?: 'FIRST_HALF' | 'SECOND_HALF' | null;
  halfYear?: number | null;
}

// Create project data interface for forms
export interface CreateProjectData {
  projectNo?: string;
  name: string;
  address: string;
  bucket: string;
  description?: string;
  status?: string;
  types?: string[]; // For Direct Order: selected types array
}

// Projects API response interface
export interface ProjectsData {
  sections: Array<{
    id: string;
    label: string;
    projects: any[];
  }>;
  lastUpdate: Date | null;
}

export type ProjectType = 'Millwork' | 'Shelving' | 'Ceiling' | 'Image' | 'Furniture' | 'Decoration';

// Status options
export type PoSignStatus = 'NOT SIGNED' | 'READY TO SIGN' | 'SIGNED' | 'WAITING TLINES TO SIGN' | 'WAITING T TO SIGN';

export type PfSignStatus = 'NOT SIGNED' | 'READY TO SIGN' | 'SIGNED' | 'WAITING T TO SIGN' | 'SIGNED WITH EST PRICE';

export type Status =
  | 'HOLD / T'
  | 'HOLD / PM'
  | 'HOLD BOOKS'
  | 'NOT ORDERED'
  | 'TO ORDER'
  | 'BOOKS IN PROGRESS'
  | 'ORDERED'
  | 'WAITING PAYMENT'
  | 'ASSEMBLY'
  | 'READY TO RECEIVE'
  | 'RECEIVED'
  | 'READY'
  | 'SENT TO TLINES'
  | 'PARTIAL SENT'
  | 'SENT';

// Vendor utility functions
export const formatVendorDisplayName = (vendor: Vendor): string => {
  return vendor.code ? `${vendor.code} - ${vendor.name}` : vendor.name;
};

export const createVendorOptions = (vendors: Vendor[]): VendorOption[] => {
  const pinnedVendorCode = "YSM"; // Pin Yaşam Plus to top

  return vendors
    .filter(vendor => vendor.isActive)
    .map(vendor => ({
      ...vendor,
      displayName: formatVendorDisplayName(vendor)
    }))
    .sort((a, b) => {
      // Pin YSM (Yaşam Plus) to the top
      if (a.code === pinnedVendorCode && b.code !== pinnedVendorCode) {
        return -1; // a comes first
      }
      if (b.code === pinnedVendorCode && a.code !== pinnedVendorCode) {
        return 1; // b comes first
      }
      // Both are pinned or both are not pinned - sort alphabetically
      return a.displayName.localeCompare(b.displayName);
    });
};

export const findVendorById = (vendors: Vendor[], vendorId: string): Vendor | undefined => {
  return vendors.find(vendor => vendor.id === vendorId);
};

// Project bucket/section constants (matching backend ProjectBucket enum)
export const PROJECT_BUCKETS = ['TLINES_NE', 'TLINES_SE', 'TLINES_NW', 'CVW', 'TLINES_HQ', 'TLINES_TC'];

// Section ordering for display
export const SECTION_ORDER = ['TLINES_NE', 'TLINES_SE', 'TLINES_NW', 'CVW', 'TLINES_HQ', 'TLINES_TC'];

// Filter configuration interface
export interface FilterConfig {
  vendors: string[]; // Vendor IDs (for backend integration)
  vendorCodes?: string[]; // Vendor codes (for Row.vendor string matching)
  types: ProjectType[]; // Project types
  statuses: string[]; // Status values
  containers: string[]; // Container names
  halves?: string[]; // "year:half" tokens, e.g. "2026:FIRST_HALF"
}

// Create empty filter configuration
export function createEmptyFilters(): FilterConfig {
  return {
    vendors: [],
    vendorCodes: [],
    types: [],
    statuses: [],
    containers: [],
    halves: []
  };
}

// Order Type options (can be expanded)
export const ORDER_TYPE_OPTIONS = [
  'Custom',
  'Standard',
  'Modular',
  'Suspended',
  'Executive',
  'Workstation',
  'Conference',
  'Specialized',
  'Cleanroom',
  'Interactive'
];

// Fixed ordering for types
export const TYPE_ORDER: ProjectType[] = ['Millwork', 'Shelving', 'Ceiling', 'Image', 'Furniture', 'Decoration'];

// Type letter mapping for PF Code generation
export const TYPE_LETTERS = {
  'Millwork': 'M',
  'Shelving': 'S',
  'Ceiling': 'C',
  'Image': 'I',
  'Furniture': 'F',
  'Decoration': 'D'
} as const;

// ==================== ID-BASED STATE UTILITIES ====================

// Helper function to extract PF code sequence number for sorting
export function extractPFSequence(pfCode: string | null): number {
  if (!pfCode) return Infinity;
  const match = pfCode.match(/-[MSCIFD](\d{2})$/); // Extract M01, S02, D01, etc.
  return match ? parseInt(match[1], 10) : Infinity;
}

// Priority vendors: YSM = 0 (highest), GOS = 1, others = 2
// If no YSM exists in the group, GOS floats to the top automatically.
const PRIORITY_VENDORS: Record<string, number> = { YSM: 0, GOS: 1 };

export function getVendorPriority(item: any): number {
  const code = item.vendor?.code as string | undefined;
  if (!code) return 2;
  return PRIORITY_VENDORS[code] ?? 2;
}

/**
 * Display order of project items (one rule used everywhere):
 *  1. by type (TYPE_ORDER; custom types after, each kept together)
 *  2. YSM first, then GOS (priority vendors)
 *  3. other vendors as blocks — all rows of one vendor together, blocks in the order the
 *     vendor first appeared in that type; rows without a vendor last
 *  4. inside a vendor: PF code number (M01, M02 …), then creation time
 */
export function sortItemsForDisplay<T = any>(items: T[]): T[] {
  const typeOrder = TYPE_ORDER.map(t => t.toUpperCase());
  const typeKey = (i: any) => (i.customTypeId ? `C:${i.customTypeId}` : `T:${(i.type || '').toUpperCase()}`);
  const typeIdx = (i: any) => { const x = typeOrder.indexOf((i.type || '').toUpperCase()); return x < 0 ? 999 : x; };
  const vendorKey = (i: any) => i.vendorId || i.vendor?.id || i.vendor?.code || '';
  const time = (i: any) => (i.createdAt ? new Date(i.createdAt).getTime() : 0);
  const firstSeen = new Map<string, number>();
  for (const i of items as any[]) {
    const k = `${typeKey(i)}|${vendorKey(i)}`;
    const t = time(i);
    if (!firstSeen.has(k) || t < (firstSeen.get(k) as number)) firstSeen.set(k, t);
  }
  return items.slice().sort((a: any, b: any) => {
    const ta = typeIdx(a), tb = typeIdx(b);
    if (ta !== tb) return ta - tb;
    if (ta === 999 && typeKey(a) !== typeKey(b)) return typeKey(a) < typeKey(b) ? -1 : 1;
    const pa = getVendorPriority(a), pb = getVendorPriority(b);
    if (pa !== pb) return pa - pb;
    const va = vendorKey(a), vb = vendorKey(b);
    if (va !== vb) {
      if (!va) return 1;
      if (!vb) return -1;
      const fa = firstSeen.get(`${typeKey(a)}|${va}`) as number, fb = firstSeen.get(`${typeKey(b)}|${vb}`) as number;
      if (fa !== fb) return fa - fb;
      return va < vb ? -1 : 1;
    }
    const sa = extractPFSequence(a.pfCode), sb = extractPFSequence(b.pfCode);
    if (sa !== sb) return sa - sb;
    return time(a) - time(b);
  });
}

// Kept for existing callers
export const sortProjectItemsInTypeGroup = (items: any[]): any[] => sortItemsForDisplay(items);
export const sortBackendItems = (items: any[]): any[] => sortItemsForDisplay(items);

// Create Map from items array for fast ID-based lookups
export function createItemsMap(items: any[]): Map<string, any> {
  const map = new Map<string, any>();
  items.forEach(item => {
    if (item.id) {
      map.set(item.id, item);
    }
  });
  return map;
}

// Update item in map and return new Map (immutable pattern)
export function updateItemInMap(
  itemsMap: Map<string, any>,
  itemId: string,
  updatedItem: any
): Map<string, any> {
  const newMap = new Map(itemsMap);
  newMap.set(itemId, updatedItem);
  return newMap;
}
```

---

## FILE: types/expensesDirectOrder.ts

```ts
export interface ExpensesDirectOrderProject {
  id: string;
  bucket: string;
  projectNo: string;
  name: string;
  address: string;
  types: string[];
  isUrgent: boolean;
  createdAt: string;
  updatedAt: string;
  items: ExpensesDirectOrderItem[];
}

export interface ExpensesDirectOrderItem {
  id: string;
  projectId: string;
  type: string | null;
  customTypeId: string | null;
  customType: { id: string; name: string; code: string; description?: string } | null;
  vendorId: string | null;
  vendor: { id: string; code: string; name: string } | null;
  orderType: string | null;
  status: string | null;
  std: string | null;
  etd: string | null;
  rtrd: string | null;
  rdy: string | null;
  ftd: string | null;
  snd: string | null;
  expensesUsd: number | string | null;
  expensesTl: number | string | null;
  shelvesLoc: string | null;
  containerNo: string | null;
  invoiceSit: string | null;
  paidUsd1: number | string | null;
  paidUsd2: number | string | null;
  paidTl1: number | string | null;
  paidTl2: number | string | null;
  invoiceTransactionNo: string | null;
  invoiceNumber: string | null;
  quickBook: string | null;
  statusNote: string | null;
  paymentRule: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpensesDirectOrderProjectsResponse {
  data: ExpensesDirectOrderProject[];
}
```

---

## FILE: types/expensesMissingExtra.ts

```ts
export interface ExpensesMissingExtraProject {
  id: string;
  bucket: string;
  projectNo: string;
  name: string;
  address: string;
  types: string[];
  isUrgent: boolean;
  createdAt: string;
  updatedAt: string;
  items: ExpensesMissingExtraItem[];
}

export interface ExpensesMissingExtraItem {
  id: string;
  projectId: string;
  type: string | null;
  customTypeId: string | null;
  customType: { id: string; name: string; code: string; description?: string } | null;
  vendorId: string | null;
  vendor: { id: string; code: string; name: string } | null;
  orderType: string | null;
  pfCode: string | null;
  status: string | null;
  std: string | null;
  etd: string | null;
  rtrd: string | null;
  rdy: string | null;
  ftd: string | null;
  snd: string | null;
  expensesUsd: number | string | null;
  expensesTl: number | string | null;
  shelvesLoc: string | null;
  containerNo: string | null;
  invoiceSit: string | null;
  paidUsd1: number | string | null;
  paidUsd2: number | string | null;
  paidTl1: number | string | null;
  paidTl2: number | string | null;
  invoiceTransactionNo: string | null;
  invoiceNumber: string | null;
  quickBook: string | null;
  statusNote: string | null;
  paymentRule: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpensesMissingExtraProjectsResponse {
  data: ExpensesMissingExtraProject[];
}
```

---

## FILE: types/expensesP.ts

```ts
export interface ExpensesPProject {
  id: string;
  bucket: string;
  projectNo: string;
  name: string;
  address: string;
  types: string[];
  isUrgent: boolean;
  createdAt: string;
  updatedAt: string;
  items: ExpensesPItem[];
}

export interface ExpensesPItem {
  id: string;
  projectId: string;
  type: string | null;
  customTypeId: string | null;
  customType: { id: string; name: string; code: string; description?: string } | null;
  vendorId: string | null;
  vendor: { id: string; code: string; name: string } | null;
  orderType: string | null;
  status: string | null;
  std: string | null;
  etd: string | null;
  rtrd: string | null;
  rdy: string | null;
  ftd: string | null;
  snd: string | null;
  expensesUsd: number | string | null;
  expensesTl: number | string | null;
  shelvesLoc: string | null;
  containerNo: string | null;
  invoiceSit: string | null;
  paidUsd1: number | string | null;
  paidUsd2: number | string | null;
  paidTl1: number | string | null;
  paidTl2: number | string | null;
  invoiceTransactionNo: string | null;
  invoiceNumber: string | null;
  quickBook: string | null;
  statusNote: string | null;
  paymentRule: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpensesPProjectsResponse {
  data: ExpensesPProject[];
}
```

---

## FILE: types/projectTotal.ts

```ts
export interface Money2 {
  usd: number;
  tl: number;
}

export interface CategoryRows {
  projects: Money2;
  directOrder: Money2;
  missingExtra: Money2;
  trustExpenses?: Money2;
}

export interface CompanyTotals {
  companyKey: string;
  label: string;
  production: CategoryRows;
  expenses: CategoryRows;
}

export interface CompanyDef {
  key: string;
  label: string;
}
```

---

## FILE: utils/containerUtils.ts

```ts
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
```

---

## FILE: utils/excel/exportProjectTotalExcel.ts

```ts
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type {
  Money2,
  CategoryRows,
  CompanyTotals,
  CompanyDef,
} from '../../types/projectTotal';
import { calcTotalDolar } from '../moneyUtils';

// ── Helpers ──────────────────────────────────────────────────────────

function fillBg(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

const BORDER_THIN: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'D1D5DB' } };
const BORDERS_ALL: Partial<ExcelJS.Borders> = {
  top: BORDER_THIN,
  bottom: BORDER_THIN,
  left: BORDER_THIN,
  right: BORDER_THIN,
};

function sumRows(r: CategoryRows): Money2 {
  return {
    usd: r.projects.usd + r.directOrder.usd + r.missingExtra.usd + (r.trustExpenses?.usd || 0),
    tl: r.projects.tl + r.directOrder.tl + r.missingExtra.tl + (r.trustExpenses?.tl || 0),
  };
}

function addMoney(a: Money2, b: Money2): Money2 {
  return { usd: a.usd + b.usd, tl: a.tl + b.tl };
}

function addRows(a: CategoryRows, b: CategoryRows): CategoryRows {
  return {
    projects: addMoney(a.projects, b.projects),
    directOrder: addMoney(a.directOrder, b.directOrder),
    missingExtra: addMoney(a.missingExtra, b.missingExtra),
    trustExpenses: addMoney(
      a.trustExpenses || { usd: 0, tl: 0 },
      b.trustExpenses || { usd: 0, tl: 0 },
    ),
  };
}

function emptyRows(): CategoryRows {
  return {
    projects: { usd: 0, tl: 0 },
    directOrder: { usd: 0, tl: 0 },
    missingExtra: { usd: 0, tl: 0 },
  };
}

// Colors
const COL_HEADER_BG = '374151';
const COMPANY_BG = '4B5563';
const TOTAL_BG = '1E293B';
const GRAND_SUB_BG = '166534';
const GRAND_TOTAL_BG = '0F172A';
const GRAND_FINAL_BG = '111827';
const PF_HEADER_BG = '4472C4';
const EXP_HEADER_BG = '92400E';

// Column layout:
// LEFT:  A=Label(1), B=PF/USD(2), C=PF/TL(3), D=ALL(4), E=Rate(5)
// GAP:   F(6)
// RIGHT: G=Label(7), H=Exp/USD(8), I=Exp/TL(9), J=ALL(10), K=Rate(11)

const L = { label: 1, usd: 2, tl: 3, all: 4, rate: 5 };
const R = { label: 7, usd: 8, tl: 9, all: 10, rate: 11 };
const GAP_COL = 6;

// ── Main export ─────────────────────────────────────────────────────

/**
 * Write the Project Total sheet (as shown on /project-total) into an
 * existing workbook. Used by the standalone export and the multi-tab export.
 */
export function writeProjectTotalSheet(
  wb: ExcelJS.Workbook,
  data: CompanyTotals[],
  usdTryRate: number,
  productionCompanies: CompanyDef[],
  expensesCompanies: CompanyDef[],
): void {
  const ws = wb.addWorksheet('Project Total');

  const LABEL_W = 22;
  const DATA_W = 16;
  const RATE_W = 10;
  const GAP_W = 3;

  // Set column widths
  for (const side of [L, R]) {
    ws.getColumn(side.label).width = LABEL_W;
    ws.getColumn(side.usd).width = DATA_W;
    ws.getColumn(side.tl).width = DATA_W;
    ws.getColumn(side.all).width = DATA_W;
    ws.getColumn(side.rate).width = RATE_W;
  }
  ws.getColumn(GAP_COL).width = GAP_W;

  let row = 1;
  const safeRate = usdTryRate > 0 ? usdTryRate : 0;
  const calcAll = (m: Money2) => (safeRate > 0 ? m.usd + m.tl / safeRate : 0);

  // Helper: style a cell
  const sc = (
    r: number,
    c: number,
    value: string | number | null,
    opts: {
      bg?: string; fg?: string; bold?: boolean;
      align?: 'left' | 'center' | 'right';
      numFmt?: string; fontSize?: number;
    } = {},
  ) => {
    const cell = ws.getRow(r).getCell(c);
    cell.value = value;
    if (opts.bg) cell.fill = fillBg(opts.bg);
    cell.font = {
      bold: opts.bold || false,
      color: opts.fg ? { argb: opts.fg } : undefined,
      size: opts.fontSize || 10,
    };
    cell.alignment = { horizontal: opts.align || 'center', vertical: 'middle' };
    cell.border = BORDERS_ALL;
    if (opts.numFmt) cell.numFmt = opts.numFmt;
  };

  const numOrNull = (v: number) => (v === 0 ? null : v);

  // ── Row 1: Section headers ──
  ws.mergeCells(row, L.label, row, L.rate);
  sc(row, L.label, 'PRODUCTION PRICE', { bg: PF_HEADER_BG, fg: 'FFFFFF', bold: true, fontSize: 11 });
  ws.mergeCells(row, R.label, row, R.rate);
  sc(row, R.label, 'EXPENSES', { bg: EXP_HEADER_BG, fg: 'FFFFFF', bold: true, fontSize: 11 });
  ws.getRow(row).height = 24;
  row++;

  // ── Row 2: Column headers ──
  const writeColHeaders = (s: typeof L, labels: [string, string]) => {
    sc(row, s.label, '', { bg: COL_HEADER_BG });
    sc(row, s.usd, labels[0], { bg: COL_HEADER_BG, fg: 'FFFFFF', bold: true });
    sc(row, s.tl, labels[1], { bg: COL_HEADER_BG, fg: 'FFFFFF', bold: true });
    sc(row, s.all, 'ALL', { bg: COL_HEADER_BG, fg: 'FFFFFF', bold: true });
    sc(row, s.rate, '', { bg: COL_HEADER_BG });
  };
  writeColHeaders(L, ['PF / USD', 'PF / TL']);
  writeColHeaders(R, ['Exp / USD', 'Exp / TL']);
  ws.getRow(row).height = 20;
  row++;

  // ── Helper: write a company name row ──
  const writeCompanyHeader = (label: string, side: typeof L) => {
    ws.mergeCells(row, side.label, row, side.rate);
    sc(row, side.label, label, { bg: COMPANY_BG, fg: 'FFFFFF', bold: true, align: 'left', fontSize: 11 });
  };

  // ── Helper: write a money row for one side ──
  const writeMoneyRow = (
    side: typeof L,
    label: string,
    m: Money2 | null | undefined,
    opts: { bg: string; fg?: string; bold?: boolean },
  ) => {
    sc(row, side.label, label, { bg: opts.bg, fg: opts.fg, bold: opts.bold, align: 'left' });
    if (m) {
      sc(row, side.usd, numOrNull(m.usd), { bg: opts.bg, fg: opts.fg, bold: opts.bold, align: 'right', numFmt: '$#,##0.00' });
      sc(row, side.tl, numOrNull(m.tl), { bg: opts.bg, fg: opts.fg, bold: opts.bold, align: 'right', numFmt: '₺#,##0.00' });
      const all = calcAll(m);
      sc(row, side.all, numOrNull(all), { bg: opts.bg, fg: opts.fg, bold: opts.bold, align: 'right', numFmt: '$#,##0.00' });
    } else {
      sc(row, side.usd, '-', { bg: opts.bg, fg: opts.fg, bold: opts.bold, align: 'right' });
      sc(row, side.tl, '-', { bg: opts.bg, fg: opts.fg, bold: opts.bold, align: 'right' });
      sc(row, side.all, '-', { bg: opts.bg, fg: opts.fg, bold: opts.bold, align: 'right' });
    }
    sc(row, side.rate, null, { bg: opts.bg });
  };

  // ── Company data (left & right side-by-side where both exist) ──
  const prodCompanies = data.filter((d) => productionCompanies.some((c) => c.key === d.companyKey));
  const expCompanies = data.filter((d) => expensesCompanies.some((c) => c.key === d.companyKey));
  const maxLen = Math.max(prodCompanies.length, expCompanies.length);

  for (let i = 0; i < maxLen; i++) {
    const pc = prodCompanies[i];
    const ec = expCompanies[i];

    // Company header row
    ws.getRow(row).height = 22;
    if (pc) writeCompanyHeader(pc.label, L);
    if (ec) writeCompanyHeader(ec.label, R);
    row++;

    // 4 category rows (including Trust Expenses)
    const categories: (keyof CategoryRows)[] = ['projects', 'directOrder', 'missingExtra', 'trustExpenses'];
    const catLabels = ['  Projects', '  Direct Order', '  Missing & Extra', '  Trust Expenses'];

    for (let ci = 0; ci < categories.length; ci++) {
      ws.getRow(row).height = 18;
      if (pc) writeMoneyRow(L, catLabels[ci], pc.production[categories[ci]], { bg: 'FFFFFF' });
      if (ec) writeMoneyRow(R, catLabels[ci], ec.expenses[categories[ci]], { bg: 'FFFFFF' });
      row++;
    }

    // TOTAL row
    ws.getRow(row).height = 18;
    if (pc) writeMoneyRow(L, '  TOTAL', sumRows(pc.production), { bg: TOTAL_BG, fg: 'FFFFFF', bold: true });
    if (ec) writeMoneyRow(R, '  TOTAL', sumRows(ec.expenses), { bg: TOTAL_BG, fg: 'FFFFFF', bold: true });
    row++;
  }

  // ── Grand Total section ──
  const prodGrandRows = prodCompanies.reduce<CategoryRows>((acc, c) => addRows(acc, c.production), emptyRows());
  const expGrandRows = expCompanies.reduce<CategoryRows>((acc, c) => addRows(acc, c.expenses), emptyRows());
  const prodGrandTotal = sumRows(prodGrandRows);
  const expGrandTotal = sumRows(expGrandRows);

  // Category subtotals (green)
  const grandCats: { label: string; key: keyof CategoryRows }[] = [
    { label: '  Projects', key: 'projects' },
    { label: '  Direct Order', key: 'directOrder' },
    { label: '  Missing & Extra', key: 'missingExtra' },
    { label: '  Trust Expenses', key: 'trustExpenses' },
  ];

  for (const gc of grandCats) {
    ws.getRow(row).height = 18;
    writeMoneyRow(L, gc.label, prodGrandRows[gc.key], { bg: GRAND_SUB_BG, fg: 'FFFFFF', bold: true });
    writeMoneyRow(R, gc.label, expGrandRows[gc.key], { bg: GRAND_SUB_BG, fg: 'FFFFFF', bold: true });
    row++;
  }

  // TOTAL row
  ws.getRow(row).height = 18;
  writeMoneyRow(L, '  TOTAL', prodGrandTotal, { bg: GRAND_TOTAL_BG, fg: 'FFFFFF', bold: true });
  writeMoneyRow(R, '  TOTAL', expGrandTotal, { bg: GRAND_TOTAL_BG, fg: 'FFFFFF', bold: true });
  row++;

  // TOTAL DOLAR row
  const writeTotalDolar = (side: typeof L, gt: Money2) => {
    const td = calcTotalDolar(gt, safeRate);
    sc(row, side.label, '  TOTAL DOLAR', { bg: GRAND_TOTAL_BG, fg: 'FFFFFF', bold: true, align: 'left' });
    sc(row, side.usd, td != null ? numOrNull(td) : null, { bg: GRAND_TOTAL_BG, fg: 'FFFFFF', bold: true, align: 'right', numFmt: '$#,##0.00' });
    sc(row, side.tl, null, { bg: GRAND_TOTAL_BG });
    sc(row, side.all, null, { bg: GRAND_TOTAL_BG });
    sc(row, side.rate, null, { bg: GRAND_TOTAL_BG });
  };
  ws.getRow(row).height = 18;
  writeTotalDolar(L, prodGrandTotal);
  writeTotalDolar(R, expGrandTotal);
  row++;

  // GRAND TOTAL DOLAR row
  const writeGrandFinal = (side: typeof L, gt: Money2) => {
    const td = calcTotalDolar(gt, safeRate);
    sc(row, side.label, 'GRAND TOTAL DOLAR', { bg: GRAND_FINAL_BG, fg: 'FFFFFF', bold: true, align: 'left', fontSize: 11 });
    sc(row, side.usd, td != null ? numOrNull(td) : null, { bg: GRAND_FINAL_BG, fg: 'FFFFFF', bold: true, align: 'right', numFmt: '$#,##0.00' });
    sc(row, side.tl, null, { bg: GRAND_FINAL_BG });
    sc(row, side.all, null, { bg: GRAND_FINAL_BG });
    sc(row, side.rate, safeRate > 0 ? safeRate : null, { bg: GRAND_FINAL_BG, fg: 'FDE68A', bold: true, align: 'center' });
  };
  ws.getRow(row).height = 24;
  writeGrandFinal(L, prodGrandTotal);
  writeGrandFinal(R, expGrandTotal);
  row++;
}

export async function exportProjectTotalExcel(
  data: CompanyTotals[],
  usdTryRate: number,
  productionCompanies: CompanyDef[],
  expensesCompanies: CompanyDef[],
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  writeProjectTotalSheet(wb, data, usdTryRate, productionCompanies, expensesCompanies);

  // ── Save ──
  const today = new Date().toISOString().slice(0, 10);
  const buf = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buf]), `Project_Total_${today}.xlsx`);
}
```

---

## FILE: utils/excel/exportProjectsAllTabsExcel.ts

```ts
/**
 * Multi-tab Excel Export for the Projects page
 *
 * Produces a single workbook with four sheets:
 *   1. Projects        — the currently displayed Operational Board sections
 *   2. Missing & Extra — fetched fresh, same layout as the ME tab
 *   3. Direct Orders   — fetched fresh, same layout as the DO tab
 *   4. Project Total   — fetched fresh, same layout as the /project-total page
 */

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
  ApiSection,
  mapBackendTypeToFrontend,
  mapItemStatusToFrontend,
} from '../../lib/projects';
import { ColumnKey } from '../../lib/columns';
import { getMissingExtraCases, BackendMissingExtraCase } from '../../lib/missing-extra';
import { getDirectOrders } from '../../lib/direct-orders';
import { getProjectColor } from '../../lib/projectColor';
import { fetchProjectTotals } from '../../lib/projectTotalApi';
import type { CompanyDef } from '../../types/projectTotal';
import { writeProjectsSheet } from './exportProjectsExcel';
import { writeProjectTotalSheet } from './exportProjectTotalExcel';

// ── Section / company definitions (same as the pages) ───────────────

const SECTION_DEFS = [
  { id: 'TLINES_NE', label: 'TLines NE' },
  { id: 'TLINES_SE', label: 'TLines SE' },
  { id: 'TLINES_NW', label: 'TLines NW' },
  { id: 'CVW', label: 'TLines CVW' },
  { id: 'TLINES_HQ', label: 'TLines HQ' },
  { id: 'TLINES_TC', label: 'TLines TC' },
];

const PRODUCTION_COMPANIES: CompanyDef[] = [
  { key: 'TLINES_NE', label: 'T LINES NE' },
  { key: 'TLINES_SE', label: 'T LINES SE' },
  { key: 'TLINES_CVW', label: 'T LINES CVW' },
  { key: 'TLINES_NW', label: 'T LINES NW' },
  { key: 'TLINES_HQ', label: 'T LINES HQ' },
  { key: 'TRUST_TC', label: 'TRUST TC' },
];

const EXPENSES_COMPANIES: CompanyDef[] = [
  ...PRODUCTION_COMPANIES,
  { key: 'TRUST_EXP', label: 'TRUST Expenses' },
];

// Same persisted USD/TRY rate the /project-total page uses
const RATE_LS_KEY = 'PROJECT_TOTAL_USD_TRY_RATE';
const DEFAULT_RATE = 41.23;

function getStoredUsdTryRate(): number {
  try {
    const raw = localStorage.getItem(RATE_LS_KEY);
    if (raw !== null) {
      const v = parseFloat(raw);
      if (Number.isFinite(v) && v > 0) return v;
    }
  } catch { /* ignore */ }
  return DEFAULT_RATE;
}

// ── Data mappers (mirror the ME tab and DO page mappings) ───────────

function mapMissingExtraToSections(
  casesBySection: Record<string, BackendMissingExtraCase[]>,
): ApiSection[] {
  return SECTION_DEFS.map(sectionDef => {
    const casesInSection = casesBySection[sectionDef.id] || [];

    const projects = casesInSection.map(caseItem => ({
      projectId: caseItem.id,
      projectNumber: caseItem.derivedProjectCode,
      projectNumberColor: getProjectColor(caseItem as any),
      projectName: `${caseItem.baseProjectName} (${caseItem.caseType})`,
      address: '',
      region: '',
      poSignStatusByType: {},
      rows: (caseItem.items || []).map((item: any) => ({
        itemId: item.id,
        type: mapBackendTypeToFrontend(item.type, item.customType) as any,
        vendor: item.vendor
          ? (item.vendor.code ? `${item.vendor.code} - ${item.vendor.name}` : item.vendor.name)
          : '',
        vendorId: item.vendorId,
        orderType: item.orderType || '',
        pfSignStatus: item.pfSignStatus,
        poSignStatus: item.poSignStatus,
        status: mapItemStatusToFrontend(item.status || ''),
        std: item.std,
        etd: item.etd,
        rtd: item.rtd,
        rtr: item.rtr,
        rdy: item.rdy,
        ftd: item.ftd,
        snd: item.snd,
        pfUsd: (item.pfUsd || 0).toString(),
        pfTl: (item.pfTl || 0).toString(),
        invoice: (item.invoice || 0).toString(),
        invoiceTl: (item.invoiceTl || 0).toString(),
        paymentRule: item.paymentRule || '',
        containerNo: item.containerNo,
        containerDate: item.containerDate ? new Date(item.containerDate).toISOString().split('T')[0] : '',
        pfCode: item.pfCode || '',
      })),
    }));

    return {
      id: sectionDef.id,
      label: sectionDef.label,
      projects,
    } as unknown as ApiSection;
  });
}

function mapDirectOrdersToSections(response: { sections: any[] }): ApiSection[] {
  const bucketToLabel: Record<string, string> = Object.fromEntries(
    SECTION_DEFS.map(s => [s.id, s.label]),
  );

  return (response.sections || []).map((section: any) => ({
    id: section.section,
    label: bucketToLabel[section.section] || section.section,
    projects: (section.projects || []).map((p: any) => ({
      projectId: p.id,
      projectNumber: String(p.projectNo),
      projectNumberColor: 'blue' as const,
      projectName: p.name || '',
      address: p.address || '',
      region: p.region || '',
      poSignStatusByType: {},
      rows: (p.items ?? []).map((item: any) => ({
        itemId: item.id,
        type: mapBackendTypeToFrontend(item.type, item.customType),
        vendor: item.vendor
          ? (item.vendor.code ? `${item.vendor.code} - ${item.vendor.name}` : item.vendor.name)
          : '',
        vendorId: item.vendorId,
        orderType: item.orderType ?? item.orderTypeRef?.name ?? '',
        status: mapItemStatusToFrontend(item.status ?? ''),
        pfCode: item.pfCode ?? '',
        pfSignStatus: item.pfSignStatus,
        poSignStatus: item.poSignStatus,
        containerNo: item.containerNo ?? '',
        containerDate: item.containerDate ? new Date(item.containerDate).toISOString().split('T')[0] : '',
        std: item.std,
        etd: item.etd,
        rtd: item.rtd,
        rtr: item.rtr,
        rdy: item.rdy,
        ftd: item.ftd,
        snd: item.snd,
        pfUsd: item.pfUsd?.toString() ?? '',
        pfTl: item.pfTl?.toString() ?? '',
        invoice: item.invoice != null ? item.invoice.toString() : '',
        invoiceTl: item.invoiceTl != null ? item.invoiceTl.toString() : '',
        statusNote: item.statusNote ?? '',
        paymentRule: item.paymentRule ?? '',
      })),
    })),
  })) as unknown as ApiSection[];
}

// ── Main export ──────────────────────────────────────────────────────

interface ExportAllTabsOptions {
  projectsSections: ApiSection[];
  isColumnVisible: (key: ColumnKey) => boolean;
  filename?: string;
}

export async function exportProjectsAllTabsToExcel({
  projectsSections,
  isColumnVisible,
  filename,
}: ExportAllTabsOptions): Promise<void> {
  // Fetch the other tabs + totals in parallel; a failing fetch skips its sheet
  // instead of blocking the whole export
  const [meResult, doResult, totalsResult] = await Promise.allSettled([
    getMissingExtraCases(),
    getDirectOrders(),
    fetchProjectTotals(),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Projects';
  wb.created = new Date();

  writeProjectsSheet(wb, 'Projects', projectsSections, isColumnVisible);

  if (meResult.status === 'fulfilled') {
    const meSections = mapMissingExtraToSections(
      meResult.value as unknown as Record<string, BackendMissingExtraCase[]>,
    );
    writeProjectsSheet(wb, 'Missing & Extra', meSections, isColumnVisible);
  } else {
    console.error('Excel export: Missing & Extra fetch failed:', meResult.reason);
  }

  if (doResult.status === 'fulfilled') {
    writeProjectsSheet(wb, 'Direct Orders', mapDirectOrdersToSections(doResult.value as any), isColumnVisible);
  } else {
    console.error('Excel export: Direct Orders fetch failed:', doResult.reason);
  }

  if (totalsResult.status === 'fulfilled') {
    writeProjectTotalSheet(wb, totalsResult.value, getStoredUsdTryRate(), PRODUCTION_COMPANIES, EXPENSES_COMPANIES);
  } else {
    console.error('Excel export: Project Total fetch failed:', totalsResult.reason);
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const outputName = filename || `Projects_${dateStr}.xlsx`;

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, outputName);
}
```

---

## FILE: utils/excel/exportProjectsExcel.ts

```ts
/**
 * Excel Export for Operational Board (Projects)
 *
 * Exports the current view (filtered sections) to a styled .xlsx file.
 * Respects column permissions: hidden columns are excluded and layout shifts left.
 * Mirrors the React UI exactly:
 *  - Section separator: red (#B02417), centered white bold
 *  - Project header bar: dark gray (#404040), centered, "No - Name"
 *  - Column headers: black bg, white text (like .column-header)
 *  - Project No column merged vertically with project color (incl. TOTAL row)
 *  - TYPE cells merged per type group; green when all rows SENT (like UI)
 *  - PO Sign Status merged per type group with sign-status color
 *  - Dates as real dates formatted dd/mm/yyyy (like formatDateCell)
 *  - Money cells: $ / ₺ formats, blank when 0, centered like UI cells
 *  - TOTAL row: dark gray (#404040) like .total-grey, label before PF/USD
 */

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { ApiSection, ApiRow } from '../../lib/projects';
import { OPERATIONAL_BOARD_COLUMNS, ColumnKey } from '../../lib/columns';
import { FIXED_COLUMNS, SCROLLABLE_COLUMNS, COLUMN_WIDTHS } from '../../lib/gridWidth';
import { TYPE_ORDER } from '../../types';
import type { ProjectColor } from '../../lib/projectColor';
import { getStatusExcelFill } from './statusColorsExcel';

// ── Helpers ──────────────────────────────────────────────────────────

/** Parse money string (e.g. "1,234.56" or "1234.56") → number, or 0 */
function parseMoney(value: string | number | null | undefined): number {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return value;
  const cleaned = value.replace(/[^0-9.\-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/** Parse an ISO-ish date value → JS Date at midnight, or null */
function parseDateValue(value: any): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  // Date-only (UI shows dd/MM/yyyy via formatDateCell)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Display enums like the UI does: NOT_SIGNED → NOT SIGNED, SENT_TO_TLINES → SENT TO TLINES */
function displayStatus(value: any): string {
  return String(value ?? '').replace(/_/g, ' ');
}

/** Get visible columns in correct order (fixed + scrollable), filtered by permission */
function getVisibleColumns(isColumnVisible: (key: ColumnKey) => boolean): ColumnKey[] {
  const allColumns: ColumnKey[] = [...FIXED_COLUMNS, ...SCROLLABLE_COLUMNS];
  return allColumns.filter(col => isColumnVisible(col));
}

/** Group project rows by type, mirroring ProjectBlock logic */
function groupRowsByType(rows: ApiRow[]): { type: string; rows: ApiRow[] }[] {
  const typeMap = new Map<string, ApiRow[]>();

  rows.forEach(row => {
    if (!typeMap.has(row.type)) {
      typeMap.set(row.type, []);
    }
    typeMap.get(row.type)!.push(row);
  });

  // Known types first (in TYPE_ORDER), then custom types alphabetically
  const knownGroups = TYPE_ORDER
    .filter(t => typeMap.has(t))
    .map(t => ({ type: t, rows: typeMap.get(t)! }));

  const customGroups = Array.from(typeMap.keys())
    .filter(t => !(TYPE_ORDER as string[]).includes(t))
    .sort()
    .map(t => ({ type: t, rows: typeMap.get(t)! }));

  return [...knownGroups, ...customGroups];
}

// ── Column kind helpers (mirror the UI columns) ─────────────────────

const DATE_COLUMNS: ColumnKey[] = ['std', 'etd', 'rtr', 'rtd', 'rdy', 'ftd', 'snd', 'containerDate'] as ColumnKey[];
const USD_COLUMNS: ColumnKey[] = ['pfUsd', 'invoice', 'expensesUsd'] as ColumnKey[];
const TL_COLUMNS: ColumnKey[] = ['pfTl', 'invoiceTl', 'expensesTl'] as ColumnKey[];
const STATUS_COLUMNS: ColumnKey[] = ['status', 'pfSignStatus', 'poSignStatus'] as ColumnKey[];

const isDateCol = (c: ColumnKey) => DATE_COLUMNS.includes(c);
const isUsdCol = (c: ColumnKey) => USD_COLUMNS.includes(c);
const isTlCol = (c: ColumnKey) => TL_COLUMNS.includes(c);
const isMoneyCol = (c: ColumnKey) => isUsdCol(c) || isTlCol(c);
const isStatusCol = (c: ColumnKey) => STATUS_COLUMNS.includes(c);

// ── Styles (taken 1:1 from the React UI) ────────────────────────────

const COLORS = {
  sectionHeader: { bg: 'B02417', fg: 'FFFFFF' },     // .section-separator
  columnHeader: { bg: '000000', fg: 'FFFFFF' },      // .column-header
  projectHeader: { bg: '404040', fg: 'FFFFFF' },     // .project-header
  projectTotal: { bg: '404040', fg: 'FFFFFF' },      // .total-grey
  sectionTotal: { bg: '2563EB', fg: 'FFFFFF' },      // blue SECTION TOTALS bar
  typeAllSent: { bg: '15803D', fg: 'FFFFFF' },       // type cell when all rows SENT
};

/** Map projectNumberColor to Excel ARGB hex — same as getProjectColorHex */
function projectColorToArgb(color: ProjectColor): string {
  switch (color) {
    case 'orange': return 'DE8244';
    case 'blue':   return '6A99D1';
    case 'green':  return '9FCF63';
    case 'red':    return 'E53E3E';
    default:       return 'DE8244';
  }
}

/** PO Sign Status group color — same as ProjectBlock getSignStatusStyle */
function getSignStatusArgb(value: string): { bg: string; fg: string } | null {
  if (value === 'SIGNED') return { bg: '92D050', fg: '000000' };
  if (value === 'READY TO SIGN') return { bg: 'FFFF00', fg: '000000' };
  if (value === 'NOT SIGNED') return { bg: 'FF0000', fg: '000000' };
  if (value === 'WAITING TLINES TO SIGN') return { bg: 'FB923C', fg: '000000' };
  if (value === 'WAITING T TO SIGN') return { bg: 'A78BFA', fg: '000000' };
  if (value === 'SIGNED WITH EST PRICE') return { bg: '4ADE80', fg: '000000' };
  return null;
}

const BORDER_THIN: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'D1D5DB' } };
const BORDERS_ALL: Partial<ExcelJS.Borders> = {
  top: BORDER_THIN,
  bottom: BORDER_THIN,
  left: BORDER_THIN,
  right: BORDER_THIN,
};

function fillBg(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

const CENTER: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'center' };

// ── Main Export ──────────────────────────────────────────────────────

interface ExportOptions {
  sections: ApiSection[];
  isColumnVisible: (key: ColumnKey) => boolean;
  filename?: string;
}

/**
 * Write a projects-style sheet (sections → projects → typed rows) into an
 * existing workbook. Used by the single-sheet export and the multi-tab export.
 */
export function writeProjectsSheet(
  wb: ExcelJS.Workbook,
  sheetName: string,
  sections: ApiSection[],
  isColumnVisible: (key: ColumnKey) => boolean,
): void {
  const visibleCols = getVisibleColumns(isColumnVisible);
  if (visibleCols.length === 0) return;

  const colCount = visibleCols.length;
  const projNoColIdx = visibleCols.indexOf('projectNo'); // -1 if hidden
  const typeColIdx = visibleCols.indexOf('type');
  const poSignColIdx = visibleCols.indexOf('poSignStatus');
  const pfUsdColIdx = visibleCols.indexOf('pfUsd');

  // TOTAL label goes in the column just before PF/USD (like the UI)
  const totalLabelIdx = pfUsdColIdx > 0 ? pfUsdColIdx - 1 : 0;

  const ws = wb.addWorksheet(sheetName, {
    views: [{ state: 'frozen', ySplit: 0, xSplit: 0 }],
  });

  // Set column widths (px / 7 ≈ Excel width units)
  ws.columns = visibleCols.map(col => ({
    width: Math.round(COLUMN_WIDTHS[col] / 7.5),
  }));

  // Money cell writer: blank when 0, $/₺ number format, centered like the UI
  const setMoneyCell = (cell: ExcelJS.Cell, colKey: ColumnKey, num: number) => {
    cell.value = num !== 0 ? num : null;
    cell.numFmt = isUsdCol(colKey) ? '$#,##0.00' : '₺#,##0.00';
    cell.alignment = CENTER;
  };

  // ── Iterate sections ──────────────────────────────────────────────

  for (const section of sections) {
    if (section.projects.length === 0) continue;

    // ── Section Header Row (red, centered — like .section-separator) ──
    const sectionRow = ws.addRow([section.label]);
    ws.mergeCells(sectionRow.number, 1, sectionRow.number, colCount);
    const sectionCell = sectionRow.getCell(1);
    sectionCell.font = { bold: true, size: 14, color: { argb: COLORS.sectionHeader.fg } };
    sectionCell.fill = fillBg(COLORS.sectionHeader.bg);
    sectionCell.alignment = CENTER;
    sectionRow.height = 28;

    let sectionTotalUsd = 0;
    let sectionTotalTl = 0;
    let sectionTotalInv = 0;
    let sectionTotalInvTl = 0;

    for (const project of section.projects) {
      const projBgColor = projectColorToArgb(project.projectNumberColor);
      const dataRowCount = project.rows.length;

      // ── Project Name Header Row (dark gray, centered — like .project-header) ──
      const projectLabel = `${project.projectNumber} - ${project.projectName}`;
      const projRow = ws.addRow([projectLabel]);
      ws.mergeCells(projRow.number, 1, projRow.number, colCount);
      const projCell = projRow.getCell(1);
      projCell.font = { bold: true, size: 11, color: { argb: COLORS.projectHeader.fg } };
      projCell.fill = fillBg(COLORS.projectHeader.bg);
      projCell.alignment = CENTER;
      projRow.height = 24;

      // ── Column Headers Row (black — like .column-header) ──
      const headerValues = visibleCols.map(col => OPERATIONAL_BOARD_COLUMNS[col].label);
      const hdrRow = ws.addRow(headerValues);
      hdrRow.height = 22;
      hdrRow.eachCell((cell) => {
        cell.font = { bold: true, size: 10, color: { argb: COLORS.columnHeader.fg } };
        cell.fill = fillBg(COLORS.columnHeader.bg);
        cell.alignment = { ...CENTER, wrapText: true };
        cell.border = BORDERS_ALL;
      });

      // ── Data Rows (grouped by type, like ProjectBlock) ──
      let projectTotalUsd = 0;
      let projectTotalTl = 0;
      let projectTotalInv = 0;
      let projectTotalInvTl = 0;
      const typeGroups = groupRowsByType(project.rows);

      // Track first data row number for Project No vertical merge
      const firstDataRowNum = ws.lastRow!.number + 1;

      for (const group of typeGroups) {
        const groupStartRowNum = ws.lastRow!.number + 1;

        // Type cell green when ALL rows in this type are SENT / SENT TO TLINES (like UI)
        const isAllSent = group.rows.length > 0 && group.rows.every(r => {
          const s = String(r.status || '').toUpperCase().replace(/[\s-]/g, '_');
          return s === 'SENT_TO_TLINES' || s === 'SENT';
        });

        // PO Sign Status per type group (same rules as ProjectBlock)
        const groupPoStatus = (() => {
          const statuses = group.rows
            .map(r => displayStatus((r as any).poSignStatus).toUpperCase())
            .filter(s => s !== '');
          if (statuses.length === 0) return '';
          if (statuses.length === group.rows.length && statuses.every(s => s === 'SIGNED')) return 'SIGNED';
          if (statuses.some(s => s === 'WAITING TLINES TO SIGN')) return 'WAITING TLINES TO SIGN';
          if (statuses.some(s => s === 'WAITING T TO SIGN')) return 'WAITING T TO SIGN';
          if (statuses.some(s => s === 'READY TO SIGN')) return 'READY TO SIGN';
          return 'NOT SIGNED';
        })();

        for (const row of group.rows) {
          const values = visibleCols.map(col => {
            // Filled after the loop: projectNo (vertical merge), type / poSignStatus (group merge)
            if (col === 'projectNo' || col === 'type' || col === 'poSignStatus') return '';
            const val = (row as any)[col];
            if (isMoneyCol(col)) return parseMoney(val) || '';
            if (isDateCol(col)) return parseDateValue(val) ?? '';
            if (isStatusCol(col)) return displayStatus(val);
            return val ?? '';
          });

          const dataRow = ws.addRow(values);
          dataRow.height = 18;

          dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const colKey = visibleCols[colNumber - 1];
            cell.font = { size: 10 };
            cell.border = BORDERS_ALL;
            cell.alignment = CENTER;

            if (isMoneyCol(colKey)) {
              const num = parseMoney((row as any)[colKey]);
              setMoneyCell(cell, colKey, num);
              cell.font = { size: 10 };
              cell.border = BORDERS_ALL;
            } else if (isDateCol(colKey)) {
              cell.numFmt = 'dd/mm/yyyy';
            } else if (colKey === 'status' || colKey === 'pfSignStatus') {
              // Status cell coloring (same palette as the UI)
              const statusFill = getStatusExcelFill(cell.value as string);
              if (statusFill) {
                cell.fill = fillBg(statusFill.bg);
                cell.font = { size: 10, color: { argb: statusFill.fg }, bold: true };
              }
            }
          });

          projectTotalUsd += parseMoney(row.pfUsd);
          projectTotalTl += parseMoney(row.pfTl);
          projectTotalInv += parseMoney((row as any).invoice);
          projectTotalInvTl += parseMoney((row as any).invoiceTl);
        }

        const groupEndRowNum = ws.lastRow!.number;

        // ── Merge TYPE cell per type group (like the UI spanning cell) ──
        if (typeColIdx >= 0 && group.rows.length > 0) {
          const excelCol = typeColIdx + 1;
          if (groupEndRowNum > groupStartRowNum) {
            ws.mergeCells(groupStartRowNum, excelCol, groupEndRowNum, excelCol);
          }
          const typeCell = ws.getCell(groupStartRowNum, excelCol);
          typeCell.value = group.type;
          typeCell.alignment = CENTER;
          typeCell.border = BORDERS_ALL;
          if (isAllSent) {
            typeCell.fill = fillBg(COLORS.typeAllSent.bg);
            typeCell.font = { size: 10, bold: true, color: { argb: COLORS.typeAllSent.fg } };
          } else {
            typeCell.font = { size: 10, bold: true };
          }
        }

        // ── Merge PO SIGN STATUS cell per type group (like the UI) ──
        if (poSignColIdx >= 0 && group.rows.length > 0) {
          const excelCol = poSignColIdx + 1;
          if (groupEndRowNum > groupStartRowNum) {
            ws.mergeCells(groupStartRowNum, excelCol, groupEndRowNum, excelCol);
          }
          const poCell = ws.getCell(groupStartRowNum, excelCol);
          poCell.value = groupPoStatus;
          poCell.alignment = CENTER;
          poCell.border = BORDERS_ALL;
          const poFill = getSignStatusArgb(groupPoStatus);
          if (poFill) {
            poCell.fill = fillBg(poFill.bg);
            poCell.font = { size: 10, bold: true, color: { argb: poFill.fg } };
          } else {
            poCell.font = { size: 10 };
          }
        }
      }

      // ── Project TOTAL Row (dark gray — like .total-grey) ──
      const projTotalValues = visibleCols.map((_col, i) => {
        if (i === totalLabelIdx) return 'TOTAL';
        return '';
      });
      const ptRow = ws.addRow(projTotalValues);
      ptRow.height = 20;
      ptRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const colKey = visibleCols[colNumber - 1];
        cell.font = { bold: true, size: 10, color: { argb: COLORS.projectTotal.fg } };
        cell.fill = fillBg(COLORS.projectTotal.bg);
        cell.border = BORDERS_ALL;
        cell.alignment = CENTER;

        if (colKey === 'pfUsd') {
          setMoneyCell(cell, colKey, projectTotalUsd);
        } else if (colKey === 'pfTl') {
          setMoneyCell(cell, colKey, projectTotalTl);
        } else if (colKey === 'invoice') {
          setMoneyCell(cell, colKey, projectTotalInv);
        } else if (colKey === 'invoiceTl') {
          setMoneyCell(cell, colKey, projectTotalInvTl);
        }
        if (isMoneyCol(colKey)) {
          cell.font = { bold: true, size: 10, color: { argb: COLORS.projectTotal.fg } };
          cell.fill = fillBg(COLORS.projectTotal.bg);
          cell.border = BORDERS_ALL;
        }
      });
      const totalRowNum = ptRow.number;

      // ── Merge Project No column vertically incl. TOTAL row (like React UI) ──
      if (projNoColIdx >= 0 && dataRowCount > 0) {
        const excelCol = projNoColIdx + 1; // 1-based

        if (totalRowNum > firstDataRowNum) {
          ws.mergeCells(firstDataRowNum, excelCol, totalRowNum, excelCol);
        }

        // Style the merged Project No cell: project color bg, white bold text, centered
        const mergedCell = ws.getCell(firstDataRowNum, excelCol);
        mergedCell.value = project.projectNumber;
        mergedCell.font = { bold: true, size: 14, color: { argb: 'FFFFFF' } };
        mergedCell.fill = fillBg(projBgColor);
        mergedCell.alignment = CENTER;
        mergedCell.border = BORDERS_ALL;
      }

      sectionTotalUsd += projectTotalUsd;
      sectionTotalTl += projectTotalTl;
      sectionTotalInv += projectTotalInv;
      sectionTotalInvTl += projectTotalInvTl;
    }

    // ── Section Total Row (blue — like the SECTION TOTALS bar) ──
    const stRow = ws.addRow(visibleCols.map(() => ''));
    stRow.height = 24;
    stRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const colKey = visibleCols[colNumber - 1];
      cell.font = { bold: true, size: 12, color: { argb: COLORS.sectionTotal.fg } };
      cell.fill = fillBg(COLORS.sectionTotal.bg);
      cell.border = BORDERS_ALL;
      cell.alignment = CENTER;

      if (colKey === 'pfUsd') {
        setMoneyCell(cell, colKey, sectionTotalUsd);
      } else if (colKey === 'pfTl') {
        setMoneyCell(cell, colKey, sectionTotalTl);
      } else if (colKey === 'invoice') {
        setMoneyCell(cell, colKey, sectionTotalInv);
      } else if (colKey === 'invoiceTl') {
        setMoneyCell(cell, colKey, sectionTotalInvTl);
      }
      if (isMoneyCol(colKey)) {
        cell.font = { bold: true, size: 12, color: { argb: COLORS.sectionTotal.fg } };
        cell.fill = fillBg(COLORS.sectionTotal.bg);
        cell.border = BORDERS_ALL;
      }
    });
    // Label merged across the columns before PF/USD (centered, like the blue bar)
    const labelEnd = pfUsdColIdx > 1 ? pfUsdColIdx : 1;
    if (labelEnd > 1) {
      ws.mergeCells(stRow.number, 1, stRow.number, labelEnd);
    }
    const stLabelCell = ws.getCell(stRow.number, 1);
    stLabelCell.value = `${section.label.toUpperCase()} TOTALS`;
    stLabelCell.alignment = CENTER;

    // Spacer row between sections
    ws.addRow([]);
  }
}

export async function exportProjectsToExcel({
  sections,
  isColumnVisible,
  filename,
}: ExportOptions): Promise<void> {
  if (getVisibleColumns(isColumnVisible).length === 0) return;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Projects';
  wb.created = new Date();

  writeProjectsSheet(wb, 'Projects', sections, isColumnVisible);

  // ── Write & Download ──────────────────────────────────────────────

  const dateStr = new Date().toISOString().slice(0, 10);
  const outputName = filename || `Projects_${dateStr}.xlsx`;

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, outputName);
}
```

---

## FILE: utils/excel/statusColorsExcel.ts

```ts
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
```

---

## FILE: utils/filterUtils.ts

```ts
import { Row, Project, ProjectType } from '../types';
import { FilterConfig } from '../components/FilterBar';
import { todayPfKey, todayPfItemKey } from '../lib/today-pf';

// Vendor string normalization
function normalizeVendorString(vendor: string): string {
  return vendor
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ') // Replace multiple spaces
    .replace(/–/g, '-'); // Replace em-dash with hyphen
}

/**
 * Check if a single item matches the current filters (CRITICAL: empty filters are ignored)
 * `projectId` + `todayPfActiveKeys` are only needed when `filters.todayPfOnly` is set.
 */
export function matchesFilters(
  item: Row,
  filters: FilterConfig,
  projectId?: string,
  todayPfActiveKeys?: Set<string> | null,
): boolean {
  // VENDOR FILTER: Try vendor code matching first, then fall back to vendor ID matching
  let vendorOk = true;
  if (filters.vendors.length > 0 || filters.vendorCodes?.length) {
    vendorOk = false;

    // Strategy 1: Vendor code string matching (if vendorCodes provided)
    if (!vendorOk && filters.vendorCodes?.length) {
      vendorOk = filters.vendorCodes.some(code => {
        // Object code match
        if ((item as any).vendor && typeof (item as any).vendor === 'object') {
          if ((item as any).vendor.code === code) return true;
        }
        // String vendor match ("YSM - Company Name")
        if (typeof item.vendor === 'string') {
          const normalizedVendor = normalizeVendorString(item.vendor);
          const normalizedCode = normalizeVendorString(code);
          if (normalizedVendor.startsWith(normalizedCode + ' ') ||
              normalizedVendor.startsWith(normalizedCode + '-') ||
              normalizedVendor.includes(' ' + normalizedCode + ' ')) {
            return true;
          }
        }
        return false;
      });
    }

    // Strategy 2: Vendor ID matching (fallback when code matching fails)
    if (!vendorOk && filters.vendors.length > 0) {
      vendorOk = filters.vendors.some(vendorId => {
        // Direct vendorId field match
        if ((item as any).vendorId && (item as any).vendorId === vendorId) return true;
        // Vendor object id match
        if ((item as any).vendor && typeof (item as any).vendor === 'object' && (item as any).vendor.id === vendorId) return true;
        return false;
      });
    }
  }

  // Type filter: ignore if empty, otherwise item must match
  const typeOk = (filters.types.length === 0) ||
                 (filters.types.includes(item.type as ProjectType));

  // Status filter: ignore if empty, otherwise item must match
  const statusOk = (filters.statuses.length === 0) ||
                   (filters.statuses.includes(item.status));

  // Container filter: ignore if empty, otherwise item must match
  const containerOk = (!filters.containers || filters.containers.length === 0) ||
                      (filters.containers.some(c =>
                        item.containerNo && item.containerNo.toUpperCase() === c.toUpperCase()
                      ));

  // Today's PFs filter: row's (project, type) must be in the active flags set
  const todayPfOk = !(filters.todayPfOnly || filters.followUpOnly) || !!(
    (projectId && todayPfActiveKeys?.has(todayPfKey(projectId, item.type))) ||
    (item.itemId && todayPfActiveKeys?.has(todayPfItemKey(item.itemId)))
  );

  // Sign/status "waiting" quick filters: row matches if ANY active chip matches
  const signOk = !filters.signWaiting?.length || filters.signWaiting.some(tok =>
    tok === 'PO_TLINES' ? item.poSignStatus === 'WAITING TLINES TO SIGN'
      : tok === 'PO_T' ? item.poSignStatus === 'WAITING T TO SIGN'
      : tok === 'TO_ORDER' ? item.status === 'TO ORDER'
      : tok === 'BOOKS_IN_PROGRESS' ? item.status === 'BOOKS IN PROGRESS'
      : item.pfSignStatus === 'WAITING T TO SIGN'
  );

  // ALL active filters must pass (AND logic)
  return vendorOk && typeOk && statusOk && containerOk && todayPfOk && signOk;
}

/**
 * Filter individual rows based on filter configuration
 */
export function filterRows(
  rows: Row[],
  filters: FilterConfig,
  projectId?: string,
  todayPfActiveKeys?: Set<string> | null,
): Row[] {
  if (
    !filters.vendors.length && !filters.vendorCodes?.length && !filters.types.length &&
    !filters.statuses.length && !(filters.containers?.length) && !filters.todayPfOnly && !filters.followUpOnly && !filters.signWaiting?.length
  ) {
    return rows; // No filters active, return all rows
  }

  return rows.filter(row => matchesFilters(row, filters, projectId, todayPfActiveKeys));
}

/**
 * Half filter is project-level (not row-level): does this project's year/half
 * token match one of the selected tokens? "UNASSIGNED" matches projects with
 * no half set yet.
 */
export function projectMatchesHalfFilter(project: Project, filters: FilterConfig): boolean {
  if (!filters.halves || filters.halves.length === 0) return true;
  const token = (project.halfOfYear && project.halfYear)
    ? `${project.halfYear}:${project.halfOfYear}`
    : 'UNASSIGNED';
  return filters.halves.includes(token);
}

/**
 * Filter projects and their rows, hiding entire projects that have no visible rows.
 * Pass keepEmpty=true to retain projects/cases that genuinely have 0 rows (not filtered out).
 */
export function filterProjects(
  projects: Project[],
  filters: FilterConfig,
  keepEmpty = false,
  todayPfActiveKeys?: Set<string> | null,
): Project[] {
  return projects
    .filter(project => projectMatchesHalfFilter(project, filters))
    .map(project => {
      const originalRowCount = project.rows.length;
      const filteredRows = filterRows(project.rows, filters, project.projectId, todayPfActiveKeys);

      return {
        ...project,
        rows: filteredRows,
        __originalRowCount: originalRowCount,
      };
    })
    .filter(project => {
      if ((project as any).__originalRowCount === 0 && keepEmpty) return true;
      return project.rows.length > 0;
    });
}

/**
 * Count total items across all projects
 */
export function countTotalItems(projects: Project[]): number {
  return projects.reduce((total, project) => total + project.rows.length, 0);
}

/**
 * Get filter summary for debugging
 */
export function getFilterSummary(filters: FilterConfig): string {
  const parts = [];

  if (filters.vendors.length > 0) {
    parts.push(`${filters.vendors.length} vendor(s)`);
  }

  if (filters.types.length > 0) {
    parts.push(`${filters.types.length} type(s)`);
  }

  if (filters.statuses.length > 0) {
    parts.push(`${filters.statuses.length} status(es)`);
  }

  return parts.length > 0 ? `Filtering by: ${parts.join(', ')}` : 'No filters active';
}

/**
 * Helper to check if any filters are active
 */
export function hasActiveFilters(filters: FilterConfig): boolean {
  return filters.vendors.length > 0 ||
         filters.types.length > 0 ||
         filters.statuses.length > 0 ||
         (filters.containers?.length || 0) > 0 ||
         (filters.halves?.length || 0) > 0 ||
         !!filters.todayPfOnly ||
         !!filters.followUpOnly ||
         (filters.signWaiting?.length || 0) > 0;
}
```

---

## FILE: utils/moneyUtils.ts

```ts
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
```

---

## FILE: utils/statusStyles.ts

```ts
/**
 * Merkezi Status Renk Yönetimi
 *
 * Tüm status hücrelerinin arka plan ve yazı renklerini tek merkezden yönetir.
 * Backend logic, status values, dropdown davranışları değişmez - sadece görsel.
 */

export interface StatusStyle {
  backgroundColor: string;
  color: string;
}

/**
 * Status değerine göre style döner
 * @param status - Status değeri (case-insensitive)
 * @returns Arka plan ve yazı rengi
 */
export const getStatusStyle = (status: string | null | undefined): StatusStyle => {
  if (!status) {
    return {
      backgroundColor: 'white',
      color: 'black'
    };
  }

  // Case-insensitive comparison için uppercase'e çevir
  const normalizedStatus = status.toString().toUpperCase().trim();

  switch (normalizedStatus) {
    case 'NOT ORDERED':
    case 'NOT_ORDERED':
      return {
        backgroundColor: '#dc2626', // Kırmızı
        color: 'white'
      };

    case 'TO ORDER':
    case 'TO_ORDER':
      return {
        backgroundColor: '#fb7185', // Rose
        color: 'black'
      };

    case 'HOLD BOOKS':
    case 'HOLD_BOOKS':
      return {
        backgroundColor: '#ea580c',
        color: 'white'
      };

    case 'BOOKS IN PROGRESS':
    case 'BOOKS_IN_PROGRESS':
      return {
        backgroundColor: '#0ea5e9', // Sky blue
        color: 'white'
      };

    case 'ORDERED':
      return {
        backgroundColor: '#2563eb', // Mavi
        color: 'white'
      };

    case 'WAITING PAYMENT':
    case 'WAITING_PAYMENT':
      return {
        backgroundColor: '#a855f7', // Purple
        color: 'white'
      };

    case 'ASSEMBLY':
      return {
        backgroundColor: '#fbbf24', // Sarı
        color: 'black'
      };

    case 'READY TO RECEIVE':
    case 'READY_TO_RECEIVE':
      return {
        backgroundColor: '#f97316', // Orange
        color: 'white'
      };

    case 'RECEIVED':
      return {
        backgroundColor: '#fb923c', // Turuncu
        color: 'black'
      };

    case 'READY':
      return {
        backgroundColor: '#86efac', // Açık yeşil
        color: 'black'
      };

    case 'SENT TO TLINES':
    case 'SENT_TO_TLINES':
      return {
        backgroundColor: '#15803d', // Koyu yeşil
        color: 'white'
      };

    case 'SENT':
      return {
        backgroundColor: '#15803d', // Koyu yeşil (SENT TO TLINES ile aynı)
        color: 'white'
      };

    // Sign Status - cell background coloring
    case 'NOT SIGNED':
    case 'NOT_SIGNED':
      return {
        backgroundColor: '#ff0000',
        color: 'black'
      };

    case 'READY TO SIGN':
    case 'READY_TO_SIGN':
      return {
        backgroundColor: '#ffff00',
        color: 'black'
      };

    case 'SIGNED':
      return {
        backgroundColor: '#92d050',
        color: 'black'
      };

    case 'WAITING TLINES TO SIGN':
    case 'WAITING_TLINES_TO_SIGN':
      return {
        backgroundColor: '#fb923c',
        color: 'black'
      };

    case 'WAITING T TO SIGN':
    case 'WAITING_T_TO_SIGN':
      return {
        backgroundColor: '#a78bfa',
        color: 'black'
      };

    case 'SIGNED WITH EST PRICE':
    case 'SIGNED_WITH_EST_PRICE':
      return {
        backgroundColor: '#4ade80',
        color: 'black'
      };

    // Diğer tüm status'lar için default (HOLD PM, HOLD TLINES, PARTIAL SENT vb.)
    default:
      return {
        backgroundColor: 'white',
        color: 'black'
      };
  }
};

/**
 * Status hücresi için tam style objesi döner (width, padding vb. dahil)
 * @param status - Status değeri
 * @param additionalStyles - Ek style'lar (opsiyonel)
 * @returns Tam CSS style objesi
 */
export const getStatusCellStyle = (
  status: string | null | undefined,
  additionalStyles: React.CSSProperties = {}
): React.CSSProperties => {
  const statusStyle = getStatusStyle(status);

  return {
    ...statusStyle,
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    textAlign: 'center' as const,
    border: '1px solid #e5e7eb',
    minHeight: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...additionalStyles
  };
};
```

---

## FILE: styles.css

```css
/* Global styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --global-navbar-height: 64px;
  --sort-bar-height: 44px; /* 8px padding top + 28px content + 8px padding bottom */
  --total-header-height: calc(var(--global-navbar-height) + var(--sort-bar-height)); /* 108px total */

  /* STICKY STACKING SYSTEM - Consistent hierarchy for all pages */
  --section-separator-height: 56px;
  --column-header-height: 32px;

  /* Sticky top positions - builds proper stack */
  --navbar-top: 0px;
  --filterbar-top: var(--global-navbar-height); /* 64px */
  --section-separator-top: 10px; /* Higher up - almost at navbar level */
  --column-header-top: var(--total-header-height); /* 108px - After navbar + filterbar */

  /* Z-index hierarchy - higher number = on top */
  --z-navbar: 1000;
  --z-section-separator: 98; /* Section separator high up with navbar/filterbar */
  --z-filterbar: 99;
  --z-column-header: 20; /* Column headers clearly visible */
  --z-content: 1;
}

html, body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background-color: #f8f9fa;
  height: auto; /* Allow vertical scroll */
  overflow-y: auto; /* Enable vertical scroll */
  overflow-x: hidden; /* Prevent horizontal page scroll */
}

#root {
  height: auto; /* Allow content to determine height */
  min-height: 100vh; /* Minimum full viewport */
}

.App {
  min-height: 100vh; /* Minimum full viewport, not locked */
  padding-top: var(--global-navbar-height); /* ✅ Space for fixed navbar (64px) */
}

/* Global Navbar - Always visible at top */
.global-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-navbar);
  height: var(--global-navbar-height);
  background-color: #0f172a;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 1px 12px rgba(0, 0, 0, 0.4);
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.navbar-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
}

.navbar-logo {
  height: 150px;
  width: auto;
  object-fit: contain;
}

.navbar-hamburger {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.navbar-hamburger:hover {
  background-color: rgba(255, 255, 255, 0.08);
  color: #f1f5f9;
}

.navbar-add-project {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #cbd5e1;
  cursor: pointer;
  padding: 5px 12px;
  border-radius: 6px;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
}

.navbar-add-project:hover {
  background-color: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.3);
  color: #f1f5f9;
}

.add-project-icon {
  font-size: 16px;
  font-weight: bold;
}

.add-project-text {
  font-size: 13px;
}

.hamburger-icon {
  display: block;
  width: 24px;
  text-align: center;
}

.navbar-account {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  cursor: pointer;
  padding: 6px 10px 6px 6px;
  border-radius: 8px;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.navbar-account:hover {
  background-color: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.2);
}

.navbar-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.account-name {
  font-weight: 500;
  font-size: 13px;
  color: #cbd5e1;
}

.account-chevron {
  color: #64748b;
  transition: transform 0.2s ease;
}

.account-chevron.open {
  transform: rotate(180deg);
}

/* Navbar Account Dropdown */
.navbar-account-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 16px;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 1001;
  min-width: 200px;
  overflow: hidden;
  animation: dropdownFadeIn 0.12s ease-out;
}

@keyframes dropdownFadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.account-dropdown-header {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.account-dropdown-name {
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
}

.account-dropdown-email {
  font-size: 11px;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-dropdown-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 0;
}

.account-dropdown-item {
  padding: 10px 16px;
  cursor: pointer;
  font-size: 13px;
  color: #94a3b8;
  transition: all 0.12s ease;
  display: flex;
  align-items: center;
  gap: 10px;
}

.account-dropdown-item:hover {
  background-color: rgba(255, 255, 255, 0.06);
  color: #f1f5f9;
}

.account-dropdown-logout {
  color: #f87171;
}

.account-dropdown-logout:hover {
  background-color: rgba(248, 113, 113, 0.08);
  color: #fca5a5;
}

/* Section Separator - Sticky under global navbar + filter bar */
.section-separator {
  position: sticky;
  top: var(--section-separator-top); /* 108px - Below navbar + filterbar */
  z-index: var(--z-section-separator); /* 20 - Above column headers */
  width: 100%; /* Width constrained by parent wrapper, not viewport */
  height: var(--section-separator-height); /* 56px */
  background-color: #B02417;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.section-separator h1 {
  color: white;
  font-size: 20px;
  font-weight: bold;
  letter-spacing: 0.5px;
  margin: 0;
}

/* Sidebar */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
  z-index: 999;
  animation: fadeIn 0.18s ease-out;
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 256px;
  height: 100vh;
  background-color: #0f172a;
  color: white;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 6px 0 32px rgba(0, 0, 0, 0.5);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.sidebar-header {
  height: 64px;
  background-color: #0f172a;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 0 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  flex-shrink: 0;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sidebar-brand-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  flex-shrink: 0;
  box-shadow: 0 0 8px rgba(99, 102, 241, 0.6);
}

.sidebar-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  color: #e2e8f0;
  letter-spacing: -0.01em;
}

.sidebar-close {
  background: none;
  border: none;
  color: #475569;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.sidebar-close:hover {
  background-color: rgba(255, 255, 255, 0.08);
  color: #94a3b8;
}

.sidebar-close:focus {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}

.sidebar-nav {
  flex: 1;
  padding: 8px 10px;
  overflow-y: auto;
}

.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.sidebar-group {
  margin-bottom: 4px;
}

.sidebar-group-label {
  padding: 12px 8px 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.35);
  user-select: none;
}

/* Global override for all links within sidebar */
.sidebar a,
.sidebar a:link,
.sidebar a:visited,
.sidebar a:hover,
.sidebar a:active {
  text-decoration: none !important;
  color: inherit !important;
}

/* Container Cell Styling */
.container-cell-editor {
  position: relative;
  width: 100%;
}

.container-cell-display {
  width: 100% !important;
  box-sizing: border-box;
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.container-dropdown {
  background: white;
  border-radius: 6px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  border: 1px solid #e1e5e9;
  display: flex;
  flex-direction: column;
  max-height: 300px;
}

.container-options {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.container-option {
  user-select: none;
}

.container-option:hover {
  transition: background-color 0.15s ease;
}

/* Container cell placeholder styling */
.row-cell .container-placeholder {
  color: #9ca3af;
  font-style: italic;
}

.row-cell .container-value {
  color: #374151;
  font-weight: 500;
}

.sidebar-menu-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  border-radius: 8px;
  color: #64748b;
  text-decoration: none;
  font-weight: 500;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 2px;
}

/* Override default link states */
.sidebar-menu-item:link,
.sidebar-menu-item:visited,
.sidebar-menu-item:hover,
.sidebar-menu-item:active {
  text-decoration: none;
  color: inherit;
}

.sidebar-menu-item:hover {
  background-color: rgba(255, 255, 255, 0.06);
  color: #cbd5e1;
}

.sidebar-menu-item.active {
  background-color: rgba(99, 102, 241, 0.12);
  color: #a5b4fc;
}

.sidebar-menu-item.active .menu-icon {
  color: #818cf8;
}

/* Focus ring for accessibility */
.sidebar-menu-item:focus {
  outline: 2px solid #6366f1;
  outline-offset: -2px;
}

.menu-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  flex-shrink: 0;
  color: #475569;
}

.menu-label {
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.4;
  flex: 1;
}

/* Icon brightens on hover and active states */
.sidebar-menu-item:hover .menu-icon {
  color: #94a3b8;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* Sort Bar - Under global navbar */
.sort-bar {
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  padding: 8px 16px;
  flex-shrink: 0;
}

.sort-bar-content {
  display: flex;
  align-items: center;
  gap: 24px;
  max-width: 1200px;
}

.sort-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-label {
  font-size: 12px;
  font-weight: 600;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.sort-select {
  padding: 4px 8px;
  border: 1px solid #ced4da;
  border-radius: 3px;
  font-size: 12px;
  background-color: white;
  color: #495057;
  min-width: 120px;
  cursor: pointer;
}

.sort-select:focus {
  outline: none;
  border-color: #3366ff;
  box-shadow: 0 0 0 2px rgba(51, 102, 255, 0.1);
}

.sort-direction {
  background: white;
  border: 1px solid #ced4da;
  border-radius: 3px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  color: #495057;
  transition: all 0.2s;
}

.sort-direction:hover {
  background-color: #e9ecef;
  border-color: #adb5bd;
}

.sort-direction.asc {
  color: #28a745;
}

.sort-direction.desc {
  color: #dc3545;
}

.sort-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.sort-button {
  padding: 6px 12px;
  border: 1px solid;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.2s;
}

.sort-button.apply {
  background-color: #3366ff;
  border-color: #3366ff;
  color: white;
}

.sort-button.apply:hover {
  background-color: #2951cc;
  border-color: #2951cc;
}

.sort-button.reset {
  background-color: white;
  border-color: #6c757d;
  color: #6c757d;
}

.sort-button.reset:hover {
  background-color: #6c757d;
  color: white;
}

/* Add Project Drawer */
.add-project-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1002; /* Above navbar and sidebar */
  display: flex;
  justify-content: flex-end;
  animation: fadeIn 0.2s ease-out;
}

.add-project-drawer {
  width: 480px;
  height: 100vh;
  background: white;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  animation: slideInRight 0.3s ease-out;
  overflow: hidden;
}

.drawer-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.drawer-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #495057;
}

.drawer-close {
  background: none;
  border: none;
  font-size: 18px;
  color: #6c757d;
  cursor: pointer;
  padding: 4px;
  border-radius: 3px;
  transition: all 0.2s;
}

.drawer-close:hover {
  background-color: #e9ecef;
  color: #495057;
}

.drawer-form {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-label.required::after {
  content: ' *';
  color: #dc3545;
}

.form-input,
.form-select {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  color: #495057;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #3366ff;
  box-shadow: 0 0 0 2px rgba(51, 102, 255, 0.1);
}

.form-input.error,
.form-select.error {
  border-color: #dc3545;
}

.form-error {
  color: #dc3545;
  font-size: 12px;
  margin-top: 2px;
}

.submit-error {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 8px 12px;
  margin-top: 8px;
}

.types-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.type-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 0;
}

.type-checkbox input[type="checkbox"] {
  margin: 0;
}

.checkbox-label {
  font-size: 14px;
  color: #495057;
}

.custom-types {
  margin: 12px 0;
}

.custom-types-label {
  font-size: 12px;
  font-weight: 600;
  color: #6c757d;
  margin-bottom: 6px;
}

.custom-type-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #e9ecef;
  border-radius: 3px;
  padding: 4px 8px;
  margin-bottom: 4px;
  font-size: 13px;
  color: #495057;
}

.remove-custom-type {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 2px;
  font-size: 12px;
}

.remove-custom-type:hover {
  color: #dc3545;
}

.add-custom-type {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.add-custom-type .form-input {
  flex: 1;
}

.add-custom-btn {
  padding: 8px 16px;
  background-color: #6c757d;
  color: white;
  border: 1px solid #6c757d;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.add-custom-btn:hover:not(:disabled) {
  background-color: #5a6268;
  border-color: #5a6268;
}

.add-custom-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-actions {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-btn,
.create-btn {
  padding: 10px 20px;
  border: 1px solid;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cancel-btn {
  background-color: white;
  border-color: #6c757d;
  color: #6c757d;
}

.cancel-btn:hover:not(:disabled) {
  background-color: #6c757d;
  color: white;
}

.create-btn {
  background-color: #3366ff;
  border-color: #3366ff;
  color: white;
}

.create-btn:hover:not(:disabled) {
  background-color: #2951cc;
  border-color: #2951cc;
}

.cancel-btn:disabled,
.create-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Animations for drawer */
@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

/* Admin Roles Page */
.admin-roles-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  background-color: #f8f9fa;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
  color: #495057;
}

.page-header p {
  margin: 0;
  font-size: 14px;
  color: #6c757d;
  line-height: 1.4;
}

.admin-roles-container {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 24px;
  height: calc(100vh - 200px);
  min-height: 600px;
}

/* Left Panel - Roles List */
.roles-panel {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  background-color: #f8f9fa;
}

.panel-header h2 {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  color: #495057;
}

.search-container {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  color: #495057;
  background-color: white;
}

.search-input:focus {
  outline: none;
  border-color: #3366ff;
  box-shadow: 0 0 0 2px rgba(51, 102, 255, 0.1);
}

.roles-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.roles-list::-webkit-scrollbar {
  width: 6px;
}

.roles-list::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 3px;
}

.roles-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.roles-list::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

.role-item {
  padding: 16px;
  margin-bottom: 8px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background-color: white;
}

.role-item:hover {
  border-color: #3366ff;
  box-shadow: 0 2px 4px rgba(51, 102, 255, 0.1);
}

.role-item.selected {
  border-color: #3366ff;
  background-color: #f0f4ff;
  box-shadow: 0 2px 8px rgba(51, 102, 255, 0.15);
}

.role-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.role-name {
  font-size: 16px;
  font-weight: 600;
  color: #495057;
}

.role-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.role-badge.system {
  background-color: #e3f2fd;
  color: #1976d2;
}

.role-badge.custom {
  background-color: #fff3e0;
  color: #f57c00;
}

.role-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.user-count {
  font-size: 12px;
  color: #6c757d;
  font-weight: 500;
}

.status {
  font-size: 12px;
  font-weight: 500;
}

.status.active {
  color: #28a745;
}

.status.inactive {
  color: #dc3545;
}

.role-description {
  font-size: 13px;
  color: #6c757d;
  line-height: 1.4;
}

/* Right Panel - Role Details */
.role-details-panel {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.role-details-panel .panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
}

.role-details-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 20px 20px;
}

/* Scroll bar styling */
.role-details-content::-webkit-scrollbar {
  width: 6px;
}

.role-details-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.role-details-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.role-details-content::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.save-btn,
.duplicate-btn,
.delete-btn {
  padding: 6px 12px;
  border: 1px solid;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.save-btn {
  background-color: #28a745;
  border-color: #28a745;
  color: white;
}

.save-btn:hover {
  background-color: #218838;
  border-color: #218838;
}

.duplicate-btn {
  background-color: white;
  border-color: #6c757d;
  color: #6c757d;
}

.duplicate-btn:hover {
  background-color: #6c757d;
  color: white;
}

.delete-btn {
  background-color: white;
  border-color: #dc3545;
  color: #dc3545;
}

.delete-btn:hover:not(:disabled) {
  background-color: #dc3545;
  color: white;
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.role-info-section {
  padding: 20px 0;
  border-bottom: 1px solid #e9ecef;
}

.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #495057;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  color: #495057;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3366ff;
  box-shadow: 0 0 0 2px rgba(51, 102, 255, 0.1);
}

.form-input:disabled {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #495057;
}

.checkbox-label input[type="checkbox"] {
  margin: 0;
}

/* Permissions Section */
.permissions-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-top: 20px;
}

.permissions-header {
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.permissions-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #495057;
}

.checkbox-label.select-all {
  font-weight: 600;
  color: #3366ff;
}

.permissions-matrix {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 20px;
  max-height: 300px;
}

.permissions-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.permissions-table th {
  background-color: #f8f9fa;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #e9ecef;
  position: sticky;
  top: 0;
  z-index: 1;
}

.module-header {
  width: 180px;
}

.actions-header {
  width: auto;
}

.all-header {
  width: 60px;
  text-align: center;
}

.permissions-table td {
  padding: 12px;
  border-bottom: 1px solid #e9ecef;
  vertical-align: top;
}

.module-name {
  font-weight: 600;
  color: #495057;
}

.actions-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.permission-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #495057;
  white-space: nowrap;
}

.permission-checkbox input[type="checkbox"] {
  margin: 0;
}

.all-cell {
  text-align: center;
}

.no-selection {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  font-size: 16px;
}

/* Main Content - Normal page flow */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  /* No height restrictions - allow content to determine height */
}

/* Legacy styles replaced by TopBar - keeping for reference */
/* Old main-container is now main-content - defined above */

/* Project Block - Full Screen Board */
.project-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-bottom: 2px solid #D9D9D9;
  background-color: white;
}

.project-block:last-child {
  border-bottom: none;
}

/* Project Header */
.project-header {
  background-color: #404040;
  color: white;
  padding: 12px 16px;
  border-bottom: 1px solid #D9D9D9;
  flex-shrink: 0;
  text-align: center;
  width: 100%; /* Constrained by .board parent width (2210px), not viewport */
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 60px;
  justify-content: center;
}

.project-header h2 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 2px;
  line-height: 1.2;
}

/* SUPPLIER P: Project headers must match accounting labels height */
.supplierPLeftCol .project-header {
  height: var(--project-header-height) !important;
  min-height: var(--project-header-height) !important;
  max-height: var(--project-header-height) !important;
  box-sizing: border-box !important;
}

.project-header p {
  font-size: 12px;
  opacity: 0.85;
  line-height: 1.1;
}

/* Board Content Layout */
.board-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Per-Project Horizontal Scroll Container */
.project-scroll {
  display: flex;
  flex-direction: column;
  overflow-x: visible; /* No internal horizontal scroll - global scrollbar handles this */
  overflow-y: hidden;
}

/* GLOBAL SCROLL SYSTEM - For Operational Board */
.global-scroll-container {
  width: 100%;
  height: 100%;
  overflow-x: auto !important; /* Enable horizontal scrolling */
  overflow-y: visible !important;
  min-width: 100%; /* Ensure minimum width */
  padding-bottom: 24px; /* Space for fixed bottom scrollbar */
  scrollbar-width: none; /* Firefox: hide native scrollbar */
  -ms-overflow-style: none; /* IE/Edge */
}
.global-scroll-container::-webkit-scrollbar {
  display: none; /* Chrome/Safari: hide native scrollbar */
}

/* Fixed bottom scrollbar - always visible at viewport bottom */
.global-scroll-bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 14px;
  overflow-x: auto;
  overflow-y: hidden;
  z-index: 999;
  background-color: #f0f0f0;
  border-top: 1px solid #ccc;
}
.global-scroll-bottom-content {
  height: 1px;
}

/* Content naturally expands in scroll container */
.global-scroll-container .project-block,
.global-scroll-container .board,
.global-scroll-container .supplierPSheet {
  width: max-content; /* Allow content to expand naturally */
}

/* Fixed left section should stay in place during scroll */
.global-scroll-container .scroll-left {
  position: sticky !important;
  left: 0 !important;
  z-index: 10 !important;
  background: white !important;
  border-right: 1px solid #e0e0e0 !important;
}

/* Remove individual project scrollbars when in global scroll mode */
.global-scroll-container .project-block,
.global-scroll-container .project-scroll,
.global-scroll-container .board,
.global-scroll-container .scroll-right,
.global-scroll-container .data-grid-container,
.global-scroll-container .data-grid-scrollable,
.global-scroll-container .supplierPSheet,
.global-scroll-container .supplierPProjectRow,
.global-scroll-container .supplierPLeftCol,
.global-scroll-container .supplierPRightCol,
.global-scroll-container .supplierPPaymentsCol {
  overflow-x: visible !important;
  overflow-y: visible !important;
}


/* SUPPLIER PAGES: Parent handles scroll, inner containers are visible */
.supplier-tracking-page .global-scroll-container {
  overflow-x: visible !important; /* Parent handles horizontal scroll */
  overflow-y: visible !important;
}

.supplier-scroll-container {
  overflow-x: visible !important;
  overflow-y: visible !important;
  width: 100% !important;
  height: auto !important;
}

/* Ensure supplier content is wide and scrollable */
.supplier-scroll-container .supplierPSheet,
.supplier-scroll-container .supplierPProjectRow {
  width: max-content !important;
  min-width: 5000px !important; /* Force wide to always need scrolling */
}

/* Hide native scrollbar on supplier content - fixed bottom bar handles it */
.supplier-content-scroll {
  scrollbar-width: none !important; /* Firefox */
  -ms-overflow-style: none !important; /* IE/Edge */
}
.supplier-content-scroll::-webkit-scrollbar {
  display: none !important; /* Chrome/Safari */
}

/* Board Container - Two Section Layout */
.board {
  display: flex;
  min-width: 2210px; /* 110 + 140 + (180+220+200+140+140+140+140+140+140+140+160+160+140) = 2210px */
  width: max-content;
}

/* Fixed Left Section - Always Visible */
.fixed-left {
  position: sticky;
  left: 0;
  z-index: 5;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  width: 250px; /* 110 + 140 = PROJECT_NO + TYPE */
  flex-shrink: 0;
  overflow: visible; /* Ensure total-fixed is not clipped */
}

/* Scroll Right Section - Normal Flow */
.scroll-right {
  display: flex;
  flex-direction: column;
  width: fit-content; /* Prevent expansion beyond column widths */
  flex-shrink: 0;
}

/* Header Sections */
.header-fixed,
.header-right {
  display: flex;
  background-color: #000000;
  color: white;
  height: 32px;
  border-bottom: 1px solid #D9D9D9;
  flex-shrink: 0;
}

/* Body Row Sections */
.rows-fixed {
  display: flex;
  flex: 1;
}

.rows-right {
  display: flex;
  flex-direction: column;
  width: fit-content; /* Constrain to exact column widths */
}

/* Total Row - ONE continuous row spanning entire board */
.total-row {
  height: 32px; /* TOTAL_ROW_HEIGHT */
  border-top: 2px solid #333;
  border-bottom: none;
  background-color: transparent;
}

/* Total Row - Sticky left columns (same as normal rows) */
.total-row .col-project-no {
  position: sticky;
  left: 0;
  z-index: 5;
  background: transparent; /* No grey under project number */
  width: 110px;
}

.total-row .col-type {
  position: sticky;
  left: 110px; /* After project-no column */
  z-index: 4;
  width: 140px;
}

/* Total Grey Background - starts from TYPE column */
.total-grey {
  background: #404040 !important;
  color: white;
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Total Project Number - transparent background */
.total-projectno {
  background: transparent;
}

/* TOTAL label - only in FTD cell */
.total-label {
  justify-content: flex-end;
  padding-right: 12px;
}

/* Column Header - Sticky below section separator */
.column-header {
  display: flex;
  background-color: #000000;
  color: white;
  height: var(--column-header-height); /* 32px */
  border-bottom: 1px solid #D9D9D9;
  flex-shrink: 0;
  position: sticky;
  top: var(--column-header-top); /* 164px - Below section separator */
  z-index: var(--z-column-header); /* 10 */
}

.column-header-fixed {
  display: flex;
  flex-shrink: 0;
  z-index: var(--z-column-header); /* 10 */
  position: sticky;
  left: 0; /* Only horizontal sticking - vertical handled by parent .column-header */
  background-color: #000000;
}

.column-header-scrollable {
  display: flex;
  flex: 1;
  /* No overflow here - the parent project-scroll handles scrolling */
}

.column-header-cell {
  padding: 0 8px;
  font-weight: 600;
  font-size: 11px;
  text-align: center;
  border-right: 1px solid #333;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  box-sizing: border-box; /* Match body cells */
  height: 32px; /* Fixed height */
  flex-shrink: 0; /* Match body cells */
}

.column-header-cell:last-child {
  border-right: none;
}

/* Unified Grid Template - Single Source of Truth */
:root {
  --fixed-grid-template: 110px 140px; /* Project No + Type */
  --scrollable-grid-template: 180px 220px 200px 140px 140px 140px 140px 140px 140px 140px 160px 160px 180px 140px; /* PF Code -> Container */
}

/* Fixed Column Widths */
.col-project-no { width: 110px; }
.col-type { width: 140px; }

/* Scrollable Column Classes - Exact Width Matching */
.col-pf-code { width: 180px; flex-shrink: 0; }
.col-vendor { width: 220px; flex-shrink: 0; }
.col-order-type { width: 200px; flex-shrink: 0; }
.col-order-no { width: 160px; flex-shrink: 0; } /* Trust Stock only */
.col-po-sign-status { width: 140px; flex-shrink: 0; }
.col-pf-sign-status { width: 140px; flex-shrink: 0; }
.col-status { width: 140px; flex-shrink: 0; }
.col-std { width: 140px; flex-shrink: 0; }
.col-etd { width: 140px; flex-shrink: 0; }
.col-rtr { width: 140px; flex-shrink: 0; }
.col-rtd { width: 140px; flex-shrink: 0; }
.col-rdy { width: 140px; flex-shrink: 0; }
.col-ftd { width: 140px; flex-shrink: 0; }
.col-snd { width: 140px; flex-shrink: 0; }
.col-pf-usd { width: 160px; flex-shrink: 0; }
.col-pf-tl { width: 160px; flex-shrink: 0; }
.col-invoice { width: 160px; flex-shrink: 0; }
.col-invoice-tl { width: 160px; flex-shrink: 0; }
.col-payment-rule { width: 180px; flex-shrink: 0; }
.col-container-no { width: 140px; flex-shrink: 0; }
.col-container-date { width: 140px; flex-shrink: 0; }
.col-expenses-usd { width: 160px; flex-shrink: 0; }
.col-expenses-tl { width: 160px; flex-shrink: 0; }

/* ===================== TRUST EXPENSE COLUMN WIDTHS ===================== */
.col-te-color-box { width: 50px; flex-shrink: 0; }
.col-te-type { width: 140px; flex-shrink: 0; }
.col-te-vendor { width: 200px; flex-shrink: 0; }
.col-te-order-type { width: 160px; flex-shrink: 0; }
.col-te-status { width: 140px; flex-shrink: 0; }
.col-te-std { width: 120px; flex-shrink: 0; }
.col-te-etd { width: 120px; flex-shrink: 0; }
.col-te-rtrd { width: 120px; flex-shrink: 0; }
.col-te-rdy { width: 120px; flex-shrink: 0; }
.col-te-ftd { width: 120px; flex-shrink: 0; }
.col-te-snd { width: 120px; flex-shrink: 0; }
.col-te-expenses-usd { width: 140px; flex-shrink: 0; }
.col-te-expenses-tl { width: 140px; flex-shrink: 0; }
.col-te-shelves { width: 140px; flex-shrink: 0; }
.col-te-container-no { width: 140px; flex-shrink: 0; }
.col-te-invoice { width: 140px; flex-shrink: 0; }

/* Trust Expense header - red band */
.te-section-header {
  height: 44px;
  background-color: #c41e3a;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 1px;
  border-radius: 6px 6px 0 0;
}

/* Trust Expense sub-header columns (EXPENSES/USD, EXPENSES/TL etc.) - dark red */
.te-expense-header {
  background-color: #8b0000 !important;
  color: white !important;
}

/* Trust Expense content scroll - hide native scrollbar, use fixed bottom bar */
.te-content-scroll {
  scrollbar-width: none !important; /* Firefox */
  -ms-overflow-style: none !important; /* IE/Edge */
}
.te-content-scroll::-webkit-scrollbar {
  display: none !important; /* Chrome/Safari */
}

/* Trust Expense fixed-left override (only color box, 50px) */
.trust-expenses-page .fixed-left {
  width: 50px;
}

/* Trust Expense total row */
.te-total-row .row-cell {
  background-color: #404040;
  color: #ffffff;
  font-weight: 700;
  font-size: 12px;
}

.te-total-row .col-te-expenses-usd,
.te-total-row .col-te-expenses-tl {
  font-weight: 800;
  font-size: 13px;
}

/* ===================== ACCOUNTING COLUMNS (SUPPLIER MODE ONLY) ===================== */

/* ===================== SUPPLIER PROJECTS SHEET (P TAB ONLY) ===================== */

/* ===================== SUPPLIER P TAB - CLEAN LAYOUT ===================== */

/* ========== SUPPLIER P VIEWPORT - FORCE HORIZONTAL OVERFLOW ========== */

/* Viewport is the scroller (scrollbar hidden via CSS) */
.supplierPViewport {
  width: 100%;
  overflow-x: auto !important; /* CRITICAL: auto (not hidden) for actual scrolling */
  overflow-y: visible !important;
  padding-bottom: 22px !important; /* Room for fixed bottom scrollbar */

  /* Hide the scrollbar visually but keep scrolling enabled */
  scrollbar-width: none !important; /* Firefox */
  -ms-overflow-style: none !important; /* IE/Edge */
}

/* Hide scrollbar for Chrome/Safari/Opera */
.supplierPViewport::-webkit-scrollbar {
  height: 0 !important;
  width: 0 !important;
  display: none !important;
}

/* Scroll area MUST expand beyond viewport */
.supplierPScrollArea {
  width: max-content !important; /* CRITICAL: Forces content width > viewport */
  min-width: 100% !important;
  display: inline-block !important; /* Prevents flex shrink issues */
  overflow: visible !important; /* No clipping */
}

/* ========== PIXEL-PERFECT CSS GRID LAYOUT WITH VARIABLES ========== */

/* CSS Variables for pixel-perfect alignment */
:root {
  --accounting-paid-width: 120px;
  --accounting-remaining-width: 140px;
  --accounting-not-ordered-width: 140px;
  --accounting-gap-width: 30px;
  --accounting-total-width: calc(
    (2 * var(--accounting-paid-width)) +  /* PaidUSD columns: 2×120 = 240px */
    (2 * var(--accounting-paid-width)) +  /* PaidTL columns: 2×120 = 240px */
    (2 * var(--accounting-remaining-width)) +  /* Remaining columns: 2×140 = 280px */
    (2 * var(--accounting-not-ordered-width)) +  /* NotOrdered columns: 2×140 = 280px */
    (3 * var(--accounting-gap-width))  /* Gaps: 3×20 = 60px */
  ); /* Total: 240 + 240 + 280 + 280 + 60 = 1100px */

  --layout-gap: 24px;
  --gapWidth: 24px; /* Pixel-perfect gap for grid alignment */
  /* Note: --leftWidth and --rightWidth are set dynamically via React inline styles */
  --section-header-height: 44px;
  --project-header-height: 54px;
  --column-header-height: 32px;
  --data-row-height: 39px;
  --totals-row-height: 36px;
}

/* SUPPLIER-ONLY SCOPE: Global box-sizing reset for pixel-perfect alignment */
.supplierPViewport,
.supplierPViewport * {
  box-sizing: border-box !important;
}

/* SUPPLIER P: Ensure accounting inputs are editable and focusable */
.supplierPViewport .accountingRow input {
  pointer-events: auto !important;
  z-index: 10 !important;
  position: relative !important;
}

.supplierPViewport .accountingRow input:focus {
  outline: 2px solid #2563eb !important;
  outline-offset: -2px !important;
  background-color: #ffffff !important;
}

/* SUPPLIER P: Prevent row containers from interfering with input focus */
.supplierPViewport .accountingRow {
  pointer-events: auto !important;
}

/* Main wrapper for entire supplier sheet */
.supplierPSheet {
  width: max-content !important;
  min-width: 100% !important;
}

/* ========== PIXEL-PERFECT ROW HEIGHT TOKENS ========== */
/* Applied to all three blocks: Project Tracking, Accounting, Payments */
.supplierPSheet {
  --supplier-section-header: 44px;
  --supplier-topgroup-row: 52px;   /* Top group labels: Remaining/Not Ordered & DUE PAYMENT/PAYMENTS 1/2 */
  --supplier-colhead-row: 34px;    /* Column headers: Paid/USD/TL & USD/TL */
  --supplier-data-row: 40px;       /* Data rows */
  --supplier-totals-row: 32px;     /* Totals row */
  --supplier-gap: 40px;            /* Gap between Accounting and Payments */

  /* ========== INVOICE & RECEIPT ALIGNMENT HEIGHTS ========== */
  --invoice-title-height: 44px;    /* Same as section header */
  --invoice-header-spacer: calc(var(--supplier-topgroup-row) + var(--supplier-colhead-row)); /* 52px + 34px = 86px */
  --invoice-table-header-height: var(--supplier-colhead-row);  /* 34px */
  --invoice-row-height: var(--supplier-data-row);              /* 40px */

  /* ========== REGION GRID LAYOUT ========== */
  --accounting-width: calc(var(--leftWidth) + var(--rightWidth) + var(--gapWidth)); /* Project + Accounting combined */
  --payments-width: var(--paymentsWidth, 752px);
  --invoice-width: 420px;

  /* ========== GREEN COLOR TOKENS FOR PAYMENTS TABLES ========== */
  /* Pure green tones - NO YELLOW/GOLD in payments tables */
  --payments-header-bg: #2f5233;      /* Dark green for main headers (replaces #D4AF37) */
  --payments-header-border: #1f3515;   /* Darker green for borders (replaces #c9a832) */
  --payments-section-bg: #2f4b1f;     /* Green section background */
  --payments-light-bg: #e8f5e9;       /* Light green for data cells */
  --payments-totals-bg: #1f3515;      /* Dark green for totals */
}

/* ========== PIXEL-PERFECT ROW ALIGNMENT (Excel-style) ========== */

/* CSS Variables for consistent row heights across all grids */
:root {
  --gridRowHeight: 38px;        /* Standard data row height */
  --gridHeaderH1: 48px;         /* PAYMENTS/ACCOUNTING TLINES header */
  --gridHeaderH2: 44px;         /* DUE PAYMENT / PAYMENTS 1 / PAYMENTS 2 */
  --gridHeaderH3: 34px;         /* USD TL header */
  --gridTotalRowHeight: 36px;   /* Total/summary row height */
}

/* Region container - holds header row + project rows */
.supplierRegionContainer {
  margin-bottom: 32px !important;
}

/* Region header row - no longer used (replaced by flex blocks layout) */
.regionInvoiceHeaderRow {
  display: none !important;
}

/* Invoice region header (only once per region) */
.invoiceRegionHeader {
  height: var(--gridHeaderH1) !important; /* Same as payments title bar height */
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: #6b737b !important; /* Grey */
  color: #fff !important;
  font-weight: 700 !important;
  font-size: 14px !important;
  border-radius: 6px !important;
  letter-spacing: 0.5px !important;
  display: none;
}

/* Each project row - no longer used (replaced by flex blocks layout) */
.regionProjectRow {
  display: flex !important;
  flex-direction: row !important;
  gap: 24px !important;
  align-items: flex-start !important;
  margin-bottom: 18px !important;
  width: fit-content !important;
}

/* Column containers within each project row */
.colAccounting, .colPayments, .colInvoice {
  height: 100% !important; /* Take full height of the row */
  display: flex !important;
  flex-direction: column !important;
}

/* Grid column positioning after adding spacer */
.colPayments {
  grid-column: 3 !important; /* Skip spacer column */
}
.colInvoice {
  grid-column: 4 !important; /* Move to 4th column */
}

/* Individual project components within stacks */
.supplierProjectAccountingGrid {
  /* Each project's accounting grid */
}

.supplierProjectPaymentsGrid {
  /* Each project's payments grid */
}

.supplierProjectInvoiceTable {
  /* Each project's invoice table */
}

/* Legacy classes for backward compatibility */
.supplierProjectRow {
  display: grid !important;
  grid-template-columns: var(--accounting-width) var(--payments-width) !important;
  column-gap: 24px !important;
  align-items: start !important;
}

/* Projects + Accounting sub-layout: flex so hidden accounting collapses */
.supplierAccountingCol {
  display: flex !important;
  flex-direction: row !important;
  gap: var(--gapWidth) !important;
  align-items: flex-start !important;
  flex-wrap: nowrap !important;
  width: fit-content !important;
}

.supplierPaymentsCol {
  align-self: start !important;
}

/* Per-project row: Each project gets its own left+middle+right alignment */
.supplierPProjectRow,
.supplierPSectionTotalRow,
.supplierPTotalsRow {
  display: grid !important;
  grid-template-columns: var(--leftWidth) var(--rightWidth) var(--paymentsWidth, 752px) !important; /* PIXEL-PERFECT: Payments only, invoice in separate row */
  gap: var(--gapWidth) !important; /* Fixed gap between all three blocks */
  align-items: start !important;
  margin-bottom: 16px !important; /* Smaller gap between projects */
  width: max-content !important;
  min-width: 100% !important;
  box-sizing: border-box !important;
}

/* Section total rows have more spacing */
.supplierPSectionTotalRow,
.supplierPTotalsRow {
  margin-bottom: 32px !important;
}

/* Left column - project tables (FIXED WIDTH for pixel-perfect alignment) */
.supplierPLeftCol {
  width: var(--leftWidth) !important;
  min-width: var(--leftWidth) !important;
  max-width: var(--leftWidth) !important;
  box-sizing: border-box !important;
  overflow: visible !important;
}

/* Right column - accounting blocks (dynamic width based on visible columns) */
.supplierPRightCol {
  flex: 0 0 auto !important;
  box-sizing: border-box !important;
}

/* Payments column - green payments blocks (FIXED WIDTH for pixel-perfect alignment) */
.supplierPPaymentsCol {
  width: var(--paymentsWidth, 752px) !important;
  min-width: var(--paymentsWidth, 752px) !important;
  max-width: var(--paymentsWidth, 752px) !important;
  flex-shrink: 0 !important;
  box-sizing: border-box !important;
  overflow: visible !important;
  margin: 0 !important;
  padding: 0 !important;
  align-self: stretch !important;
}

/* Invoice & Receipt column - grey invoice receipt blocks (FIXED WIDTH for pixel-perfect alignment) */
.supplierPInvoiceReceiptCol {
  width: var(--invoiceReceiptWidth, 480px) !important;
  min-width: var(--invoiceReceiptWidth, 480px) !important;
  max-width: var(--invoiceReceiptWidth, 480px) !important;
  flex-shrink: 0 !important;
  box-sizing: border-box !important;
  overflow: visible !important;
  margin: 0 !important;
  padding: 0 !important;
  align-self: stretch !important;
}

.supplierPLeftCol{
  margin-top: -0px !important;
}
/* Ensure all four columns (left, middle, payments, invoice-receipt) start from same baseline */

.supplierPRightCol,
.supplierPPaymentsCol,
.supplierPInvoiceReceiptCol {
  margin-top: 0 !important;
  padding-top: 0 !important;
}

/* ========== SECTIONED ACCOUNTING + TOTALS ========== */

/* Accounting section per company */
.accountingSection {
  margin: 0 !important;
  box-sizing: border-box !important;
}

/* Gold header bar for accounting sections - NOW CONSTRAINED TO RIGHT COLUMN */
.accountingHeaderBar {
  width: 100% !important; /* 100% of right column (520px) */
  background: #b88900 !important; /* gold */
  color: #fff !important;
  font-weight: 700 !important;
  text-align: center !important;
  padding: 10px 0 !important;
  border: 1px solid #000 !important;
  letter-spacing: 0.5px !important;
  font-size: 14px !important;
  box-sizing: border-box !important;
}

/* ========== GRAND TOTALS STYLING ========== */

/* Projects grand total bar (left side) */
.projectsGrandTotalBar {
  width: 100% !important;
  background: #c41e3a !important; /* red */
  color: #fff !important;
  font-weight: 700 !important;
  text-align: center !important;
  padding: 10px 0 !important;
  border: 1px solid #000 !important;
  letter-spacing: 0.5px !important;
  font-size: 14px !important;
  box-sizing: border-box !important;
}

/* Projects grand total values */
.projectsGrandTotalValues {
  display: flex !important;
  justify-content: flex-end !important;
  gap: 12px !important;
  padding: 10px 12px !important;
  border: 1px solid #000 !important;
  border-top: none !important;
  background: #fff !important;
  font-weight: 700 !important;
  font-size: 15px !important;
}

/* Accounting grand total bar (right side) */
.accountingGrandTotalBar {
  width: 100% !important;
  background: #b88900 !important; /* gold */
  color: #fff !important;
  font-weight: 700 !important;
  text-align: center !important;
  padding: 10px 0 !important;
  border: 1px solid #000 !important;
  letter-spacing: 0.5px !important;
  font-size: 14px !important;
  box-sizing: border-box !important;
}

/* Accounting grand total values */
.accountingGrandTotalValues {
  display: flex !important;
  justify-content: flex-end !important;
  gap: 12px !important;
  padding: 10px 12px !important;
  border: 1px solid #000 !important;
  border-top: none !important;
  background: #fff !important;
  font-weight: 700 !important;
  font-size: 15px !important;
}

/* Total label and amounts */
.totalLabel {
  margin-right: auto !important;
  font-weight: 700 !important;
}

.totalUsd,
.totalTl {
  min-width: 140px !important;
  text-align: right !important;
  font-weight: 700 !important;
}

/* Supplier P Sheet - Legacy wrapper */
.supplier-p-sheet {
  width: 100%;
  min-width: fit-content;
  overflow: visible; /* No internal scrolling */
}

.supplier-p-sheet .supplier-section {
  margin-bottom: 24px;
}

/* CRITICAL: Remove internal scrollbars from ProjectBlock in Supplier P mode */
.supplierPViewport .project-block-container,
.supplierPViewport .project-scroll,
.supplierPViewport .board,
.supplierPViewport .scroll-right,
.supplierPViewport .data-grid-container,
.supplierPViewport .data-grid-scrollable {
  overflow-x: visible !important;
  overflow-y: visible !important;
}

/* PIXEL-PERFECT: Constrain ProjectBlock to exact left column width */
.supplierPLeftCol .project-block,
.supplierPLeftCol .project-block-container,
.supplierPLeftCol .board {
  width: var(--leftWidth) !important;
  min-width: var(--leftWidth) !important;
  max-width: var(--leftWidth) !important;
  box-sizing: border-box !important;
}

/* ALIGNMENT FIX: Ensure ProjectBlock starts from same top position as accounting blocks */
.supplierPLeftCol .project-block {
  margin-top: 0 !important;
  padding-top: 0 !important;
}

/* PIXEL-PERFECT: Constrain section separators to exact grid width in Supplier P */
.supplierPLeftCol .section-separator {
  width: var(--leftWidth) !important;
  min-width: var(--leftWidth) !important;
  max-width: var(--leftWidth) !important;
  height: var(--section-header-height) !important; /* Use consistent height */
  box-sizing: border-box !important;
}

/* ALIGNMENT FIX: Remove sticky positioning and top offset in Supplier P */
.supplierPSheet .section-separator {
  position: static !important; /* Remove sticky positioning */
  top: 0 !important; /* Remove top offset */
  margin-top: 0 !important; /* Ensure no extra top margin */
  padding-top: 0 !important; /* Ensure no extra top padding */
}

/* ========== RESPONSIVE HEADERS FOR PROJECTS & MISSING PAGES ========== */
/* SUPER SIMPLE APPROACH: Full width headers with centered text */

@media (max-width: 1400px) {
  /* RED SECTION HEADER - Full viewport width + centered text */
  .board-page--projects .section-separator,
  .board-page--missing .section-separator {
    position: sticky !important;
    left: 0 !important;
    width: 100vw !important;
    margin-left: -50vw !important;
    margin-right: -50vw !important;

    /* Center the text */
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
  }

  .board-page--projects .section-separator h1,
  .board-page--missing .section-separator h1 {
    text-align: center !important;
    margin: 0 !important;
  }

  /* GRAY PROJECT HEADER - Full viewport width + centered text */
  .board-page--projects .project-header,
  .board-page--missing .project-header {
    position: sticky !important;
    left: 0 !important;
    width: 100vw !important;
    margin-left: -50vw !important;
    margin-right: -50vw !important;

    /* Center the text */
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
    text-align: center !important;
  }

  .board-page--projects .project-header h2,
  .board-page--missing .project-header h2,
  .board-page--projects .project-header p,
  .board-page--missing .project-header p {
    text-align: center !important;
    margin: 0 auto !important;
  }
}

/* ========== SIMPLE FIXED BOTTOM SCROLLBAR ========== */

/* Fixed bottom scrollbar - always visible */
.supplierPBottomScrollbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 18px;
  overflow-x: scroll; /* MUST BE scroll */
  overflow-y: hidden;
  z-index: 99999;
  background: #f2f2f2;
  border-top: 1px solid rgba(0, 0, 0, 0.2);
}

/* Spacer div - width set dynamically to match table content */
.supplierPBottomScrollbarInner {
  height: 1px;
}

/* OLD STYLES BELOW - KEEPING FOR BACKWARD COMPATIBILITY */
.supplier-p-sheet-old {
  overflow-x: auto;
  overflow-y: visible;
  width: 100%;
  padding: 20px;
}

.supplier-section-wrapper {
  margin-bottom: 32px;
}

.supplier-project-block {
  margin-bottom: 24px;
}

/* Unified row layout - all headers in same row context */
.supplier-row {
  display: flex;
  align-items: stretch;
  width: 100%;
}

.supplier-gap {
  width: 24px;
  flex-shrink: 0;
  background-color: #ffffff;
}

/* ROW 1: Section bars (red + gold) */
.supplier-row--section {
  height: 56px;
  margin-bottom: 0;
}

.supplier-left-sectionbar {
  flex: 0 0 1800px;
  background-color: #dc2626;
  color: white;
  display: flex;
  align-items: center;
  padding-left: 20px;
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 1px;
  text-transform: uppercase;
  border: 2px solid #991b1b;
}

.supplier-right-sectionbar {
  flex: 0 0 1116px;
  background-color: #d4af37;
  border: 2px solid #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #000000;
}

/* ROW 2: Title + Top labels */
.supplier-row--title {
  min-height: 70px;
}

.supplier-left-title {
  flex: 0 0 1800px;
  background-color: #e5e7eb;
  padding: 12px 20px;
  border-bottom: 1px solid #d1d5db;
}

.project-name-text {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.project-number-text {
  font-size: 13px;
  color: #6b7280;
}

.supplier-right-toplabels {
  flex: 0 0 1116px;
  background-color: #e5e7eb;
  border-bottom: 1px solid #d1d5db;
  display: flex;
  align-items: center;
  font-size: 10px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  gap: 0;
}

.supplier-right-toplabels span {
  width: 120px;
  text-align: center;
}

.supplier-right-toplabels span:nth-child(7),
.supplier-right-toplabels span:nth-child(8),
.supplier-right-toplabels span:nth-child(10),
.supplier-right-toplabels span:nth-child(11) {
  width: 140px;
}

/* ROW 3: Column headers (black) */
.supplier-row--headers {
  height: 40px;
}

.supplier-left-headers {
  flex: 0 0 1800px;
  background-color: #000000;
  color: #ffffff;
  display: flex;
  align-items: center;
}

.supplier-left-headers .col-hdr {
  flex: 1;
  min-width: 100px;
  padding: 0 8px;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  border-right: 1px solid #333;
}

.supplier-right-headers {
  flex: 0 0 1116px;
  background-color: #000000;
  color: #ffffff;
  display: flex;
  align-items: center;
}

.supplier-right-headers .acct-hdr {
  width: 120px;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
}

.supplier-right-headers .acct-hdr:nth-child(7),
.supplier-right-headers .acct-hdr:nth-child(8),
.supplier-right-headers .acct-hdr:nth-child(10),
.supplier-right-headers .acct-hdr:nth-child(11) {
  width: 140px;
}

/* ROW 4+: Data rows */
.supplier-row--data {
  min-height: 36px;
  border-bottom: 1px solid #e5e7eb;
}

.supplier-left-cells {
  flex: 0 0 1800px;
  display: flex;
  align-items: center;
  background-color: #ffffff;
}

.supplier-left-cells .data-cell {
  flex: 1;
  min-width: 100px;
  padding: 4px 8px;
  font-size: 13px;
  border-right: 1px solid #e5e7eb;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.supplier-right-cells {
  flex: 0 0 1116px;
  display: flex;
  align-items: center;
  background-color: #ffffff;
}

/* LAST ROW: Totals */
.supplier-row--total {
  height: 45px;
  margin-top: 8px;
}

.supplier-left-total {
  flex: 0 0 1800px;
  background-color: #1e40af;
  color: #ffffff;
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-weight: 700;
}

.supplier-left-total .total-label {
  font-size: 14px;
  margin-right: 24px;
  letter-spacing: 1px;
}

.supplier-left-total .total-val {
  margin-right: 24px;
  font-size: 13px;
  padding: 4px 12px;
  background-color: #1d4ed8;
  border-radius: 4px;
  border: 1px solid #1e40af;
}

.supplier-right-total {
  flex: 0 0 1116px;
  background-color: #1e40af;
  color: #ffffff;
  display: flex;
  align-items: center;
  font-weight: 700;
  font-size: 13px;
}

.supplier-right-total .total-val {
  width: 120px;
  text-align: center;
}

.supplier-right-total .total-val:nth-child(7),
.supplier-right-total .total-val:nth-child(8),
.supplier-right-total .total-val:nth-child(10),
.supplier-right-total .total-val:nth-child(11) {
  width: 140px;
}

.supplier-section {
  margin-bottom: 32px;
}

/* Section header row: Red bar + Gold bar (same line) */
.supplier-section-header-row {
  display: flex;
  align-items: stretch;
  height: 56px;
  margin-bottom: 0;
}

.supplier-section-bar-left {
  flex: 0 0 auto;
  width: 1800px;
  background-color: #dc2626;
  color: white;
  display: flex;
  align-items: center;
  padding-left: 20px;
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 1px;
  text-transform: uppercase;
  border: 2px solid #991b1b;
}

.supplier-gap-cell {
  width: 24px;
  flex-shrink: 0;
  background-color: #ffffff;
}

.supplier-section-bar-right {
  width: 1116px;
  flex-shrink: 0;
  background-color: #d4af37;
  border: 2px solid #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #000000;
}

.supplier-project-block {
  margin-bottom: 24px;
}

/* Project title row: Gray title + Gray labels (same line) */
.supplier-project-header-row {
  display: flex;
  align-items: stretch;
  min-height: 70px;
  margin-bottom: 0;
}

.supplier-project-title-left {
  flex: 0 0 auto;
  width: 1800px;
  background-color: #e5e7eb;
  padding: 12px 20px;
  border-bottom: 1px solid #d1d5db;
}

.project-name-large {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.project-number {
  font-size: 13px;
  color: #6b7280;
}

.supplier-project-labels-right {
  width: 1116px;
  flex-shrink: 0;
  background-color: #e5e7eb;
  border-bottom: 1px solid #d1d5db;
  display: flex;
  align-items: center;
  font-size: 10px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.acct-label {
  width: 120px;
  text-align: center;
}

.acct-label:nth-child(7),
.acct-label:nth-child(8),
.acct-label:nth-child(10),
.acct-label:nth-child(11) {
  width: 140px;
}

/* Column headers row: Black headers */
.supplier-column-headers-row {
  display: flex;
  align-items: stretch;
  height: 40px;
}

.supplier-column-headers-left {
  flex: 0 0 auto;
  width: 1800px;
  background-color: #000000;
  color: #ffffff;
  display: flex;
  align-items: center;
}

.supplier-column-headers-left .col-header {
  padding: 0 8px;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  border-right: 1px solid #333;
  flex: 1;
  min-width: 100px;
}

.supplier-column-headers-right {
  width: 1116px;
  flex-shrink: 0;
  background-color: #000000;
  color: #ffffff;
  display: flex;
  align-items: center;
}

.col-header-acct {
  width: 120px;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
}

.col-header-acct:nth-child(7),
.col-header-acct:nth-child(8),
.col-header-acct:nth-child(10),
.col-header-acct:nth-child(11) {
  width: 140px;
}

/* Data rows */
.supplier-data-row {
  display: flex;
  align-items: stretch;
  min-height: 36px;
  border-bottom: 1px solid #e5e7eb;
}

.supplier-data-cells-left {
  flex: 0 0 auto;
  width: 1800px;
  display: flex;
  align-items: center;
  background-color: #ffffff;
}

.supplier-data-cells-left .data-cell {
  padding: 4px 8px;
  font-size: 13px;
  border-right: 1px solid #e5e7eb;
  flex: 1;
  min-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.supplier-data-cells-right {
  width: 1116px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  background-color: #ffffff;
}

/* Totals row */
.supplier-totals-row {
  display: flex;
  align-items: stretch;
  height: 45px;
  margin-top: 8px;
  margin-bottom: 16px;
}

.supplier-totals-left {
  flex: 0 0 auto;
  width: 1800px;
  background-color: #1e40af;
  color: #ffffff;
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-weight: 700;
}

.total-label {
  font-size: 14px;
  margin-right: 24px;
  letter-spacing: 1px;
}

.total-value {
  margin-right: 24px;
  font-size: 13px;
  padding: 4px 12px;
  background-color: #1d4ed8;
  border-radius: 4px;
  border: 1px solid #1e40af;
}

.supplier-totals-right {
  width: 1116px;
  flex-shrink: 0;
  background-color: #1e40af;
  color: #ffffff;
  display: flex;
  align-items: center;
  font-weight: 700;
  font-size: 13px;
}

.total-value-acct {
  width: 120px;
  text-align: center;
}

.total-value-acct:nth-child(7),
.total-value-acct:nth-child(8),
.total-value-acct:nth-child(10),
.total-value-acct:nth-child(11) {
  width: 140px;
}

/* ===================== SUPPLIER UNIFIED SHEET LAYOUT ===================== */

/* Supplier sheet row - contains left grid + gap + right accounting */
.supplier-sheet-row {
  display: flex;
  width: 100%;
  align-items: stretch;
}

.supplier-left {
  flex: 0 0 auto;
  width: fit-content;
  max-width: 1800px;
}

.supplier-gap {
  width: 24px;
  flex-shrink: 0;
  background-color: #ffffff;
}

.supplier-right {
  width: 1116px;
  flex-shrink: 0;
}

/* Accounting section header bar for supplier mode */
.accounting-section-header-bar {
  height: 56px;
  background-color: #d4af37;
  border: 2px solid #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #000000;
}

/* Accounting top labels row */
.accounting-top-labels {
  height: 70px;
  background-color: #e5e7eb;
  border-bottom: 1px solid #d1d5db;
  display: flex;
  align-items: center;
  font-size: 10px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Hide ProjectBlock header when inside supplier grid container */
.supplier-grid-container .project-header {
  display: none;
}

.supplier-grid-container .project-block {
  margin-top: 0;
  padding-top: 0;
}

/* Main spacer column after Container No - creates visual separation */
.col-accounting-spacer { 
  width: 24px; 
  flex-shrink: 0; 
  background-color: #ffffff;
  border: none;
}

/* Internal gap spacers within accounting zone (Excel-like separation) */
.col-accounting-gap-paid { 
  width: 18px; 
  flex-shrink: 0; 
  background-color: #ffffff;
  border: none;
}

.col-accounting-gap-group { 
  width: 18px; 
  flex-shrink: 0; 
  background-color: #ffffff;
  border: none;
}

/* Accounting column widths */
.col-accounting-paid-usd-1 { width: 120px; flex-shrink: 0; }
.col-accounting-paid-usd-2 { width: 120px; flex-shrink: 0; }
.col-accounting-paid-tl-1 { width: 120px; flex-shrink: 0; }
.col-accounting-paid-tl-2 { width: 120px; flex-shrink: 0; }
.col-accounting-remaining-usd { width: 140px; flex-shrink: 0; }
.col-accounting-remaining-tl { width: 140px; flex-shrink: 0; }
.col-accounting-not-ordered-usd { width: 140px; flex-shrink: 0; }
.col-accounting-not-ordered-tl { width: 140px; flex-shrink: 0; }

/* Gold accounting section header bar (per section) */
.accounting-section-header-row {
  display: flex;
  height: 40px;
  background-color: #d4af37;
  border: 2px solid #000000;
  border-top: 3px solid #000000;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #000000;
  margin-bottom: 0;
}

/* Accounting group headers (PAID / REMAINING / NOT ORDERED) - Excel style */
.accounting-group-headers {
  display: flex;
  height: 28px;
  background-color: #d4af37;
  border-left: 2px solid #000000;
  border-right: 2px solid #000000;
  border-bottom: 1px solid #000000;
}

.accounting-group-header {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #000000;
  background-color: #d4af37;
  border-right: 1px solid #000000;
}

.accounting-group-header-paid-usd {
  width: 240px; /* 2 columns × 120px */
}

.accounting-group-header-paid-tl {
  width: 240px; /* 2 columns × 120px */
}

.accounting-group-header-remaining {
  width: 280px; /* 2 columns × 140px */
}

.accounting-group-header-not-ordered {
  width: 280px; /* 2 columns × 140px */
}

/* Accounting column headers - black background with white text */
.accounting-column-header {
  background-color: #000000 !important;
  color: #ffffff !important;
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 0.5px;
  text-align: center;
  border: 1px solid #000000;
}

/* Accounting data cells - gold background */
.accounting-data-cell {
  background-color: #f4e4b7;
  border: 1px solid #caa233;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
}

.accounting-data-cell-editable {
  background-color: #fef3c7;
  cursor: pointer;
}

.accounting-data-cell-editable:hover {
  background-color: #fde68a;
}

/* Currency icon in accounting cells */
.accounting-currency-icon {
  font-weight: 700;
  margin-right: 4px;
  color: #92400e;
  font-size: 12px;
}

/* NOT SIGNED indicator in accounting cells */
.accounting-not-signed {
  background-color: #000000 !important;
  color: #ffffff !important;
  font-weight: 700;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border: 1px solid #000000;
}

/* Data Grid Layout */
.data-grid {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-width: 2210px; /* 110 + 140 + (180+220+200+140+140+140+140+140+140+140+160+160+140) = 2210px */
}

.data-grid-fixed {
  display: flex;
  flex-shrink: 0;
  border-right: 2px solid #D9D9D9;
  background-color: #fafbfc;
}

.data-grid-scrollable {
  flex: 1;
  overflow: visible; /* No scroll here - handled at project level */
}

/* Project Number Cell - Visible Color Block */
.projectno-cell {
  width: 110px;
  padding: 0;
  overflow: visible;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative; /* NOT transparent */
  z-index: 6; /* above any overlays */
  border-right: 1px solid #D9D9D9;
  cursor: pointer;
  transition: opacity 0.2s;
  box-sizing: border-box;
}

.projectno-text {
  width: 100%;
  text-align: center;
  font-size: 28px;
  font-weight: 800;
}

.projectno-cell:hover {
  opacity: 0.9;
}

.project-number-orange { background-color: #DE8244; }
.project-number-blue { background-color: #6A99D1; }
.project-number-green { background-color: #9FCF63; }
.project-number-red { background-color: #E53E3E; }

/* Type Stack - Fixed Left Section */
.type-stack {
  width: 140px;
  background-color: #ffffff;
  border-right: 1px solid #D9D9D9;
  flex-shrink: 0; /* Prevent compression */
}

/* Row System - Strict Heights */
.row-container {
  display: flex;
  flex-direction: column;
}

.row-item {
  display: flex;
  height: 40px; /* Exact ROW_HEIGHT */
  border-bottom: 1px solid #E8E9EA;
  box-sizing: border-box;
}

.row-item:hover {
  background-color: #f8f9fa;
}

/* Row Cells - Unified Alignment */
.row-cell {
  padding: 6px 8px;
  border-right: 1px solid #E8E9EA;
  border-bottom: 1px solid #E8E9EA; /* Add horizontal grid lines for Excel-like appearance */
  font-size: 12px;
  background-color: white;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.15s ease;
  height: 40px; /* Exact ROW_HEIGHT */
  box-sizing: border-box; /* Strict box model */
  overflow: hidden;
  position: relative; /* For dropdown positioning */
  min-width: 0; /* Prevent flex item overflow */
  flex-shrink: 0; /* Prevent compression */
}

.row-cell:hover {
  background-color: #e3f2fd;
}

.row-cell:last-child {
  border-right: none;
}

/* Interactive States */
.row-cell.clickable {
  cursor: pointer;
}

.row-cell.clickable:hover {
  background-color: #e1f5fe;
}

.row-cell.clickable:active {
  background-color: #b3e5fc;
}

/* Type Group Container */
.type-group-container {
  display: block;
  /* Removed position: relative to avoid creating positioning context */
}

/* Type Cells */
.type-cell {
  background-color: #f5f6fa;
  font-weight: 600;
  border-left: 3px solid #3368F5;
  color: #2c3e50;
  border-right: 1px solid #E8E9EA;
  border-bottom: 1px solid #E8E9EA;
  cursor: pointer;
  height: 40px; /* Single row height by default */
  min-height: 40px; /* Enforce minimum height */
  box-sizing: border-box;
  overflow: hidden;
  flex-shrink: 0; /* Prevent compression */
}

.type-cell.spanning {
  display: flex;
  align-items: center;
  justify-content: center;
  writing-mode: horizontal-tb;
  font-weight: 700;
  border-top: 1px solid #D9D9D9;
  border-bottom: 1px solid #D9D9D9;
  box-sizing: border-box;
  overflow: hidden;
  flex-shrink: 0; /* Prevent compression */
  min-height: 40px; /* Enforce minimum height for spanning cells */
}

.type-cell:hover {
  background-color: #e8eaf6;
}

/* Tüm itemları SENT TO TLINES olan type grupları için yeşil renk */
.type-cell.sent-to-tlines-complete {
  background-color: #15803d !important;
  color: white !important;
  border-left: 3px solid #052e16 !important;
}

.type-cell.sent-to-tlines-complete:hover {
  background-color: #166534 !important;
}

/* PO Sign Status Spanning */
.po-sign-status-cell {
  font-weight: 600;
  border-right: 1px solid #E8E9EA;
  border-bottom: 1px solid #E8E9EA;
  color: black;
  height: 40px;
  box-sizing: border-box;
  overflow: hidden;
}

.po-sign-status-spanning {
  display: flex;
  align-items: center;
  justify-content: center;
  writing-mode: horizontal-tb;
  font-weight: 700;
  box-sizing: border-box;
  overflow: hidden;
  border-top: 1px solid #D9D9D9;
  border-bottom: 1px solid #D9D9D9;
  /* Height is set inline via style attribute */
  /* No absolute positioning - stays in normal flow */
}

/* Total Row - Starts from TYPE column only */
.total-row {
  display: flex;
  height: 32px; /* TOTAL_ROW_HEIGHT */
  background-color: #404040;
  border-top: 2px solid #333;
  box-sizing: border-box;
}

/* Old type-total-row styles removed - using new total-fixed-type structure */

.total-row .row-cell {
  background-color: #404040;
  color: #ffffff;
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-right: 1px solid #555;
  border-bottom: 1px solid #555; /* Add bottom border for complete Excel grid */
  height: 32px; /* TOTAL_ROW_HEIGHT */
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

.total-row .row-cell:last-child {
  border-right: none;
}

/* Override for currency cells in total row */
.total-row .col-pf-usd,
.total-row .col-pf-tl {
  justify-content: flex-end;
  padding-right: 12px;
}

.total-row .total-label {
  justify-content: flex-end;
  padding-right: 12px;
}

/* Ensure FTD column shows TOTAL text properly */
.total-row .col-ftd.total-label {
  background-color: #404040;
  color: #ffffff;
  font-weight: 700;
  justify-content: flex-end;
  padding-right: 12px;
}

/* Status Indicators */
.status-approved {
  color: #2e7d32;
  font-weight: 600;
}

.status-pending {
  color: #f57c00;
  font-weight: 600;
}

.status-review {
  color: #c62828;
  font-weight: 600;
}

.status-in-progress {
  color: #1565c0;
  font-weight: 600;
}

/* Scrollbar Customization - Removed internal scrollbars, using global scrollbar only */

/* Inline Editors */
.inline-text-editor,
.inline-date-editor {
  width: 100%;
  height: 100%;
  border: 2px solid #2196f3;
  background-color: #ffffff;
  font-size: 12px;
  padding: 4px 6px;
  font-family: inherit;
  outline: none;
  border-radius: 2px;
}

.inline-text-editor:focus,
.inline-date-editor:focus {
  border-color: #1976d2;
  box-shadow: 0 0 0 1px #1976d2;
}

.inline-select-editor {
  position: absolute;
  z-index: 1000;
  border: 2px solid #2196f3;
  background-color: #ffffff;
  font-size: 12px;
  padding: 2px;
  font-family: inherit;
  outline: none;
  border-radius: 2px;
  min-width: 140px;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.inline-select-editor:focus {
  border-color: #1976d2;
}

.inline-select-editor option {
  padding: 4px 8px;
  background-color: #ffffff;
  color: #333;
}

.inline-select-editor option:hover {
  background-color: #e3f2fd;
}

/* Portal Dropdown - Rendered in document.body */
.portal-dropdown {
  /* Position is set inline via JavaScript */
  border: 2px solid #1976d2;
  background-color: #ffffff;
  font-size: 12px;
  font-family: inherit;
  outline: none;
  border-radius: 4px;
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
  pointer-events: auto; /* Ensure dropdown receives pointer events */
  z-index: 10000; /* High z-index to ensure it's above everything */
}

/* Status Dropdown Editor - Professional Board UX */
.status-dropdown-editor {
  max-height: 280px; /* Tall enough for most options */
  overflow-y: auto;
}

.status-option {
  padding: 8px 12px;
  background-color: #ffffff;
  color: #333;
  cursor: pointer;
  border-bottom: 1px solid #e8e9ea;
  transition: background-color 0.15s ease;
  font-weight: 500;
  pointer-events: auto; /* Ensure options receive pointer events */
}

.status-option:last-child {
  border-bottom: none;
}

.status-option:hover {
  background-color: #e3f2fd;
  color: #1976d2;
}

.status-option.current-status {
  background-color: #1976d2;
  color: #ffffff;
  font-weight: 700;
}

.status-option.current-status:hover {
  background-color: #1565c0;
  color: #ffffff;
}

/* Utility Classes */
.text-center { text-align: center; }
.text-right { text-align: right; }

.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.text-xs { font-size: 11px; }
.text-sm { font-size: 12px; }

/* ============================================
   RBAC - Enhanced Roles & Permissions
   ============================================ */

/* New Role Button */
.new-role-btn {
  background: linear-gradient(135deg, #1976d2, #1565c0);
  color: #ffffff;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 16px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(25, 118, 210, 0.2);
}

.new-role-btn:hover {
  background: linear-gradient(135deg, #1565c0, #0d47a1);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(25, 118, 210, 0.3);
}

.new-role-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(25, 118, 210, 0.2);
}

/* Role Badge - Locked Admin Badge */
.role-badge.locked {
  background: linear-gradient(135deg, #ff6b35, #f7931e);
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
  border: none;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 4px rgba(255, 107, 53, 0.3);
}

/* Update existing role-badge for consistency */
.role-badge.system {
  background: linear-gradient(135deg, #4caf50, #45a049);
  color: #ffffff;
}

.role-badge.custom {
  background: linear-gradient(135deg, #2196f3, #1976d2);
  color: #ffffff;
}

/* Board Columns Section */
.board-columns-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 2px solid #e8e9ea;
}

.board-columns-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e8e9ea;
}

.board-columns-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

/* Select All Columns Buttons */
.select-all-columns {
  display: flex;
  gap: 8px;
  align-items: center;
}

.select-all-btn {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #ffffff;
}

.select-all-btn.visible {
  color: #059669;
  border-color: #d1fae5;
}

.select-all-btn.visible:hover {
  background: #d1fae5;
  border-color: #059669;
}

.select-all-btn.readonly {
  color: #d97706;
  border-color: #fef3c7;
}

.select-all-btn.readonly:hover {
  background: #fef3c7;
  border-color: #d97706;
}

.select-all-btn.editable {
  color: #dc2626;
  border-color: #fecaca;
}

.select-all-btn.editable:hover {
  background: #fecaca;
  border-color: #dc2626;
}

/* Board Columns Matrix */
.board-columns-matrix {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e8e9ea;
  border-radius: 6px;
  background: #ffffff;
}

.board-columns-matrix::-webkit-scrollbar,
.permissions-matrix::-webkit-scrollbar {
  width: 6px;
}

.board-columns-matrix::-webkit-scrollbar-track,
.permissions-matrix::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 3px;
}

.board-columns-matrix::-webkit-scrollbar-thumb,
.permissions-matrix::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.board-columns-matrix::-webkit-scrollbar-thumb:hover,
.permissions-matrix::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

.board-columns-table {
  width: 100%;
  border-collapse: collapse;
}

.board-columns-table thead {
  background: #f8f9fa;
  border-bottom: 2px solid #e8e9ea;
  position: sticky;
  top: var(--column-header-top); /* 164px - Below section separator */
  z-index: var(--z-column-header); /* 10 */
}

.board-columns-table th {
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  text-align: left;
  border-right: 1px solid #e8e9ea;
}

.board-columns-table th:last-child {
  border-right: none;
}

.board-columns-table th.column-header {
  width: 40%;
  min-width: 140px;
}

.board-columns-table th.visible-header,
.board-columns-table th.readonly-header,
.board-columns-table th.editable-header {
  width: 20%;
  text-align: center;
  min-width: 80px;
}

.board-columns-table td {
  padding: 10px 16px;
  border-bottom: 1px solid #f3f4f6;
  border-right: 1px solid #f3f4f6;
  font-size: 13px;
}

.board-columns-table td:last-child {
  border-right: none;
}

.board-columns-table tbody tr:hover {
  background-color: #f9fafb;
}

.column-name {
  font-weight: 500;
  color: #374151;
}

.visible-cell,
.readonly-cell,
.editable-cell {
  text-align: center;
}

.visible-cell input[type="checkbox"],
.readonly-cell input[type="checkbox"],
.editable-cell input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #1976d2;
}

.visible-cell input[type="checkbox"]:disabled,
.readonly-cell input[type="checkbox"]:disabled,
.editable-cell input[type="checkbox"]:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* Enhanced Permissions Section */
.permissions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e8e9ea;
}

.permissions-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

/* Disabled state styling for admin role */
input[type="checkbox"]:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.form-input:disabled,
.form-textarea:disabled {
  background-color: #f3f4f6;
  border-color: #d1d5db;
  color: #6b7280;
  cursor: not-allowed;
}

/* Enhanced role item styling */
.role-item {
  transition: all 0.2s ease;
}

.role-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.role-item.selected {
  border-color: #1976d2;
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.15);
}

/* Users in Role Section */
.users-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 2px solid #e8e9ea;
  margin-bottom: 24px;
}

.users-header {
  margin-bottom: 20px;
}

.users-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.users-helper {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
  font-style: italic;
}

.users-input-section {
  margin-bottom: 20px;
}

.users-input-group {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-bottom: 8px;
}

.users-email-input {
  flex: 1;
  min-width: 0;
}

.add-user-btn {
  background: linear-gradient(135deg, #1976d2, #1565c0);
  color: #ffffff;
  border: none;
  padding: 10px 16px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(25, 118, 210, 0.2);
}

.add-user-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #1565c0, #0d47a1);
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(25, 118, 210, 0.3);
}

.add-user-btn:disabled {
  background: #e0e0e0;
  color: #9e9e9e;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.email-error {
  font-size: 12px;
  color: #dc3545;
  margin-top: 4px;
  margin-left: 2px;
}

.users-list-section {
  min-height: 60px;
}

.users-count {
  margin-bottom: 12px;
}

.no-users {
  font-size: 13px;
  color: #9ca3af;
  font-style: italic;
}

.user-count-text {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.users-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.user-chip {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  border: 1px solid #2196f3;
  border-radius: 16px;
  padding: 6px 4px 6px 12px;
  font-size: 12px;
  color: #1565c0;
  transition: all 0.2s ease;
  max-width: 100%;
}

.user-chip:hover {
  background: linear-gradient(135deg, #bbdefb, #90caf9);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(33, 150, 243, 0.2);
}

.user-email {
  margin-right: 6px;
  font-weight: 500;
  word-break: break-all;
  line-height: 1.2;
}

.remove-user-btn {
  background: #f44336;
  color: #ffffff;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  transition: all 0.2s ease;
  font-weight: bold;
  flex-shrink: 0;
}

.remove-user-btn:hover {
  background: #d32f2f;
  transform: scale(1.1);
}

.remove-user-btn:active {
  transform: scale(0.95);
}

/* ===================== ACCOUNTING PANEL STYLES ===================== */

/* Accounting Panel - Gold Theme */
.accounting-panel {
  width: 900px;
  min-width: 900px;
  background-color: #ffffff;
  border: 1px solid #d4d4d8;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.accounting-panel-header {
  background-color: #b88900;
  color: white;
  padding: 12px 16px;
  border-bottom: 1px solid #a67700;
}

.accounting-panel-header h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.accounting-panel-header p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.accounting-sections {
  padding: 16px;
}

/* Accounting Section */
.accounting-section {
  margin-bottom: 24px;
}

.accounting-section:last-child {
  margin-bottom: 0;
}

.accounting-section-title {
  background-color: #b88900;
  color: white;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  text-align: center;
  border-radius: 4px;
  margin-bottom: 8px;
}

.accounting-mini-tables-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  align-items: start;
}

/* Mini Table */
.accounting-mini-table {
  border: 1px solid #d4d4d8;
  border-radius: 4px;
  overflow: hidden;
  background-color: #ffffff;
}

.accounting-mini-table-title {
  background-color: #f3f4f6;
  color: #374151;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #d4d4d8;
}

.accounting-mini-table-header {
  background-color: #000000;
  color: white;
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.accounting-mini-table-header-cell {
  padding: 6px 8px;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border-right: 1px solid #333;
}

.accounting-mini-table-header-cell:last-child {
  border-right: none;
}

.accounting-mini-table-body {
  background-color: #fffbeb; /* Light gold background */
}

.accounting-mini-table-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-bottom: 1px solid #fbbf24;
}

.accounting-mini-table-row:last-child {
  border-bottom: none;
}

.accounting-mini-table-cell {
  padding: 6px 8px;
  font-size: 12px;
  border-right: 1px solid #fbbf24;
}

.accounting-mini-table-cell:last-child {
  border-right: none;
}

.accounting-mini-table-cell.currency-cell {
  text-align: center;
  font-weight: 700;
  color: #92400e;
  background-color: #fef3c7; /* Slightly darker gold */
}

.accounting-mini-table-cell.amount-cell {
  text-align: right;
  font-weight: 600;
  color: #1f2937;
}

/* Summary boxes at bottom */
.accounting-summary-boxes {
  background-color: #f9f9f9;
  padding: 16px;
  border-top: 1px solid #d4d4d8;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.accounting-summary-box {
  background-color: #b88900;
  color: white;
  padding: 12px;
  border-radius: 6px;
  text-align: left;
}

.accounting-summary-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  opacity: 0.9;
}

.accounting-summary-value {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.3px;
}

/* ===================== SUPPLIER SHEET LAYOUT ===================== */

/* Supplier sheet container - main scrollable area */
.supplier-sheet-container {
  position: relative;
  width: 100%;
}

/* Supplier Accounting Gap Separator Rules - Make gaps pure white space */
.acct-topgroup-row div[style*="var(--accounting-gap-width)"],
.acct-colhead-row div[style*="var(--accounting-gap-width)"],
.acct-data-row div[style*="var(--accounting-gap-width)"],
.acct-totals-row div[style*="var(--accounting-gap-width)"],
div[style*="accounting-gap-width"] {
  background: #ffffff !important;
  background-color: #ffffff !important;
  border: none !important;
  border-top: none !important;
  border-bottom: none !important;
  border-left: none !important;
  border-right: none !important;
  outline: none !important;
  box-shadow: none !important;
}

/* Payments Table Gap Separator Rules - Make gaps pure white space (same as accounting) */
.pay-topgroup-row div[style*="16px"],
.pay-colhead-row div[style*="16px"],
div[style*="16px"][style*="white"],
div[style*="16px"][style*="background-color: white"],
div[style*="16px"][style*="backgroundColor: 'white'"] {


  border: none !important;
  border-top: none !important;
  border-bottom: none !important;
  border-left: none !important;
  border-right: none !important;
  outline: none !important;
  box-shadow: none !important;
}

/* Supplier ME Section Total Blue Background */
.supplierMESectionTotal {
  background: #2563eb !important;
  background-color: #2563eb !important;
  color: white !important;
}

.supplierMESectionTotal * {
  color: white !important;
}

/* Remove all borders from cells adjacent to gaps */
/* Pattern: Remove borders from ALL cells that touch gaps */

/* Top Labels Row - Remove borders around gaps */
.acct-topgroup-row > div:nth-child(2),
.acct-topgroup-row > div:nth-child(5),
.acct-topgroup-row > div:nth-child(8) {
  border-right: none !important;
}

.acct-topgroup-row > div:nth-child(4),
.acct-topgroup-row > div:nth-child(7),
.acct-topgroup-row > div:nth-child(10) {
  border-left: none !important;
}

/* Column Headers Row - Same pattern */
.acct-colhead-row > div:nth-child(2),
.acct-colhead-row > div:nth-child(5),
.acct-colhead-row > div:nth-child(8) {
  border-right: none !important;
}

.acct-colhead-row > div:nth-child(4),
.acct-colhead-row > div:nth-child(7),
.acct-colhead-row > div:nth-child(10) {
  border-left: none !important;
}

/* Data Rows - Handle both div containers and inputs */
.acct-data-row > div:nth-child(2),
.acct-data-row > div:nth-child(5),
.acct-data-row > div:nth-child(8) {
  border-right: none !important;
}

.acct-data-row > div:nth-child(2) input,
.acct-data-row > div:nth-child(5) input,
.acct-data-row > div:nth-child(8) input {
  border-right: none !important;
}

.acct-data-row > div:nth-child(4),
.acct-data-row > div:nth-child(7),
.acct-data-row > div:nth-child(10) {
  border-left: none !important;
}

/* Section Totals Row */
.acct-totals-row > div:nth-child(2),
.acct-totals-row > div:nth-child(5),
.acct-totals-row > div:nth-child(8) {
  border-right: none !important;
}

.acct-totals-row > div:nth-child(4),
.acct-totals-row > div:nth-child(7),
.acct-totals-row > div:nth-child(10) {
  border-left: none !important;
}

/* Fixed bottom scrollbar styling - removed empty rule */

/* Accounting sheet styling */
.accounting-sheet {
  width: 100%;
}

.accounting-section-aligned {
  margin-bottom: 0; /* No gap between sections for perfect alignment */
  padding: 0;
}

.accounting-section-aligned .accounting-section-title {
  background-color: #b88900;
  color: white;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  text-align: center;
  margin-bottom: 8px;
}

.accounting-section-aligned .accounting-mini-tables-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  align-items: start;
  padding: 0 8px;
}

/* ================================================================
   Supplier Total Page — 4 side-by-side blocks (st- prefix)
   ================================================================ */

.st-container {
  padding: 20px 24px;
}

.st-loading,
.st-error {
  text-align: center;
  padding: 60px 20px;
  font-size: 16px;
  color: #6b7280;
}

.st-error {
  color: #dc2626;
}

.st-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.st-title {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.st-export-btn {
  padding: 8px 20px;
  background: #059669;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.st-export-btn:hover {
  background: #047857;
}

/* Horizontal scroll area */
.st-scroll-area {
  overflow-x: auto;
  padding-bottom: 8px;
}

/* Flex row holding the 4 blocks side-by-side */
.st-blocks-row {
  display: flex;
  align-items: flex-start;
  gap: 80px;
  flex-wrap: nowrap;
  width: fit-content;
}

/* Individual block */
.st-block {
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #d1d5db;
}

/* Block section header (colored title bar) — title always centered */
.st-block-header {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  padding: 0 8px;
}

.st-block-title {
  text-align: center;
}

/* Column headers row */
.st-col-headers {
  display: flex;
  align-items: center;
  background: #374151;
  border-bottom: 1px solid #4b5563;
}

.st-col-header-label {
  background: #374151;
  color: #d1d5db;
  font-size: 10px;
}

.st-col-hdr {
  flex: 0 0 auto;
  text-align: center;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 0 4px;
}

/* Shared row-label column (first block only) */
.st-row-label {
  width: 170px;
  flex: 0 0 170px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-sizing: border-box;
}

/* Vendor name row */
.st-vendor-row {
  display: flex;
  align-items: center;
  background: #4b5563;
  border-top: 1px solid #6b7280;
}

.st-vendor-name-full {
  width: 100%;
  padding: 0 10px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.st-vendor-name-bar {
  width: 100%;
  height: 100%;
}

/* Vendor sub-header row - repeats column labels within each vendor block */
.st-vendor-subheader {
  display: flex;
  align-items: center;
  background: #374151;
  border-top: 1px solid #4b5563;
}

.st-vendor-subheader-label {
  background: #374151;
}

.st-vendor-subheader-col {
  flex: 0 0 auto;
  text-align: center;
  color: #d1d5db;
  font-size: 10px;
  font-weight: 600;
  padding: 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

/* Data rows */
.st-data-row {
  display: flex;
  align-items: center;
  background: #fff;
  border-top: 1px solid #e5e7eb;
}

.st-data-row:nth-child(odd) {
  background: #f9fafb;
}

/* Money cells */
.st-cell {
  flex: 0 0 auto;
  text-align: right;
  padding: 0 10px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: #111827;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  box-sizing: border-box;
}

/* Vendor total row */
.st-vtotal-row {
  display: flex;
  align-items: center;
  background: #1e293b;
  border-top: 1px solid #334155;
}

.st-vtotal-label {
  color: #fff;
  font-weight: 700;
}

.st-vtotal-cell {
  color: #fff;
  font-weight: 700;
}

/* Grand total row */
.st-grand-row {
  display: flex;
  align-items: center;
  background: #111827;
  border-top: 2px solid #374151;
}

.st-grand-label {
  color: #fff;
  font-weight: 800;
  font-size: 13px;
}

.st-grand-cell {
  color: #fff;
  font-weight: 800;
  font-size: 13px;
}

/* Spacer row between vendor blocks — transparent, no borders */
.st-spacer-row {
  background: transparent;
  margin: 20px;
  border: none;
}

/* ================================================================
   PROJECT TOTAL PAGE — .pt-* classes
   ================================================================ */

/* Two-block wrapper: side-by-side on desktop, stacked on narrow */
.pt-blocks-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 48px;
  overflow-x: auto;
  padding-bottom: 12px;
}
@media (max-width: 1100px) {
  .pt-blocks-wrapper {
    flex-direction: column;
    gap: 32px;
  }
}

/* Individual block */
.pt-block {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
  flex: 0 0 auto;
}

/* Block header bar (centered title) */
.pt-block-header {
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
}

/* Column header row */
.pt-col-headers {
  display: flex;
  align-items: center;
  background: #374151;
  height: 32px;
  border-bottom: 1px solid #4b5563;
}
.pt-col-hdr {
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
}
.pt-col-hdr-empty {
  background: #374151;
}

/* Shared cell sizes */
.pt-label-cell {
  width: 170px;
  flex: 0 0 170px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-sizing: border-box;
}
.pt-data-cell {
  width: 130px;
  flex: 0 0 130px;
  text-align: right;
  padding: 0 10px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: #111827;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  box-sizing: border-box;
}
.pt-rate-cell {
  width: 100px;
  flex: 0 0 100px;
  text-align: center;
  padding: 0 8px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

/* Company card (with bottom margin for spacing) */
.pt-company-card {
  margin-bottom: 22px;
}

/* Company name bar */
.pt-company-name {
  display: flex;
  align-items: center;
  height: 36px;
  background: #4b5563;
  padding: 0 10px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
  border-top: 1px solid #6b7280;
}

/* Data row */
.pt-data-row {
  display: flex;
  align-items: center;
  height: 32px;
  background: #fff;
  border-top: 1px solid #e5e7eb;
}
.pt-data-row:nth-child(odd) {
  background: #f9fafb;
}

/* Company total row (dark navy) */
.pt-total-row {
  display: flex;
  align-items: center;
  height: 32px;
  background: #1e293b;
  border-top: 1px solid #334155;
}
.pt-total-row .pt-label-cell,
.pt-total-row .pt-data-cell {
  color: #fff;
  font-weight: 700;
}

/* ── Grand Total section ── */
.pt-grand-section {
  border-top: 2px solid #374151;
  margin-top: 4px;
}

/* Green category subtotal rows */
.pt-grand-sub-row {
  display: flex;
  align-items: center;
  height: 32px;
  background: #166534;
  border-top: 1px solid #15803d;
}
.pt-grand-sub-row .pt-label-cell,
.pt-grand-sub-row .pt-data-cell {
  color: #fff;
  font-weight: 700;
}

/* TOTAL / TOTAL DOLAR row (dark) */
.pt-grand-total-row {
  display: flex;
  align-items: center;
  height: 32px;
  background: #1e293b;
  border-top: 1px solid #334155;
}
.pt-grand-total-row .pt-label-cell,
.pt-grand-total-row .pt-data-cell {
  color: #fff;
  font-weight: 700;
}
.pt-total-dolar-row {
  background: #0f172a;
}

/* GRAND TOTAL DOLAR row (darkest) */
.pt-grand-final-row {
  display: flex;
  align-items: center;
  height: 36px;
  background: #111827;
  border-top: 2px solid #374151;
}
.pt-grand-final-row .pt-label-cell,
.pt-grand-final-row .pt-data-cell {
  color: #fff;
  font-weight: 800;
  font-size: 13px;
}

/* Per-card column header row (inside each company card) */
.pt-card-col-headers {
  display: flex;
  align-items: center;
  background: #374151;
  height: 26px;
  border-bottom: 1px solid #4b5563;
}
.pt-card-col-hdr {
  color: #fff !important;
  font-size: 10px;
  font-weight: 600;
  text-align: center;
  justify-content: center;
}

/* Exchange rate display inside grand total */
.pt-rate-display {
  color: #fbbf24;
  font-weight: 800;
  font-size: 14px;
}

/* Bottom rate input (yellow cell in grand total row) */
.pt-rate-input-bottom {
  width: 70px;
  padding: 3px 6px;
  border: 1px solid #fbbf24;
  border-radius: 3px;
  font-size: 13px;
  font-weight: 800;
  text-align: center;
  color: #111827;
  background: #fbbf24;
}
.pt-rate-input-bottom:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.5);
}

/* Exchange rate input in page header */
.pt-rate-input-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}
.pt-rate-input {
  width: 80px;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  text-align: right;
  color: #111827;
  background: #fff;
}
.pt-rate-input:focus {
  outline: none;
  border-color: #4472C4;
  box-shadow: 0 0 0 2px rgba(68, 114, 196, 0.2);
}
```

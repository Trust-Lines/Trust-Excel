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
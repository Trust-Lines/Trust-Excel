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
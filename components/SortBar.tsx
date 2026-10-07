import React, { useState } from 'react';
import { SortConfig, SortField, SortDirection, SORT_FIELD_OPTIONS } from '../utils/sortUtils';

interface SortBarProps {
  sortConfig: SortConfig | null;
  onSortChange: (config: SortConfig | null) => void;
}

const SortBar: React.FC<SortBarProps> = ({ sortConfig, onSortChange }) => {
  const [localPrimaryField, setLocalPrimaryField] = useState<SortField>(sortConfig?.field || 'vendor');
  const [localPrimaryDirection, setLocalPrimaryDirection] = useState<SortDirection>(sortConfig?.direction || 'asc');
  const [localSecondaryField, setLocalSecondaryField] = useState<SortField | undefined>(sortConfig?.secondaryField);
  const [localSecondaryDirection, setLocalSecondaryDirection] = useState<SortDirection>(sortConfig?.secondaryDirection || 'asc');

  const handleApply = () => {
    const newConfig: SortConfig = {
      field: localPrimaryField,
      direction: localPrimaryDirection,
      secondaryField: localSecondaryField,
      secondaryDirection: localSecondaryDirection,
    };
    onSortChange(newConfig);
  };

  const handleReset = () => {
    onSortChange(null);
    setLocalPrimaryField('vendor');
    setLocalPrimaryDirection('asc');
    setLocalSecondaryField(undefined);
    setLocalSecondaryDirection('asc');
  };

  return (
    <div className="sort-bar">
      <div className="sort-bar-content">
        {/* Primary Sort */}
        <div className="sort-group">
          <label className="sort-label">Sort by</label>
          <select
            className="sort-select"
            value={localPrimaryField}
            onChange={(e) => setLocalPrimaryField(e.target.value as SortField)}
          >
            {SORT_FIELD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            className={`sort-direction ${localPrimaryDirection === 'desc' ? 'desc' : 'asc'}`}
            onClick={() => setLocalPrimaryDirection(localPrimaryDirection === 'asc' ? 'desc' : 'asc')}
            title={localPrimaryDirection === 'asc' ? 'Ascending' : 'Descending'}
          >
            {localPrimaryDirection === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {/* Secondary Sort */}
        <div className="sort-group">
          <label className="sort-label">Then by</label>
          <select
            className="sort-select"
            value={localSecondaryField || ''}
            onChange={(e) => setLocalSecondaryField(e.target.value ? e.target.value as SortField : undefined)}
          >
            <option value="">None</option>
            {SORT_FIELD_OPTIONS.filter(option => option.value !== localPrimaryField).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {localSecondaryField && (
            <button
              className={`sort-direction ${localSecondaryDirection === 'desc' ? 'desc' : 'asc'}`}
              onClick={() => setLocalSecondaryDirection(localSecondaryDirection === 'asc' ? 'desc' : 'asc')}
              title={localSecondaryDirection === 'asc' ? 'Ascending' : 'Descending'}
            >
              {localSecondaryDirection === 'asc' ? '↑' : '↓'}
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="sort-actions">
          <button className="sort-button apply" onClick={handleApply}>
            Apply
          </button>
          <button className="sort-button reset" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default SortBar;
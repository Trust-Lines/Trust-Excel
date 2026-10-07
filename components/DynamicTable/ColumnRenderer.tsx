import React from 'react';
import { ColumnKey, generateGridTemplateColumns, getColumnDefinition } from '../../lib/columns';
import useColumnPermissions from '../../hooks/useColumnPermissions';

interface ColumnHeaderProps {
  visibleColumns: ColumnKey[];
  onColumnSort?: (columnKey: ColumnKey) => void;
  sortColumn?: ColumnKey | null;
  sortDirection?: 'asc' | 'desc';
}

export const DynamicColumnHeaders: React.FC<ColumnHeaderProps> = ({
  visibleColumns,
  onColumnSort,
  sortColumn,
  sortDirection,
}) => {
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: generateGridTemplateColumns(visibleColumns),
    gap: '1px',
  };

  return (
    <div style={gridStyle} className="bg-gray-100 border-b">
      {visibleColumns.map((columnKey) => {
        const column = getColumnDefinition(columnKey);
        const isSorted = sortColumn === columnKey;

        return (
          <div
            key={columnKey}
            className={`
              p-3 bg-white font-semibold text-gray-900 text-sm
              ${onColumnSort ? 'cursor-pointer hover:bg-gray-50' : ''}
              ${column.isMoney ? 'text-right' : ''}
              flex items-center justify-between
            `}
            onClick={() => onColumnSort?.(columnKey)}
          >
            <span>{column.label}</span>
            {isSorted && (
              <span className="ml-1 text-gray-500">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

interface TableRowProps {
  visibleColumns: ColumnKey[];
  rowData: Record<string, any>;
  onCellClick?: (columnKey: ColumnKey, value: any) => void;
  onCellEdit?: (columnKey: ColumnKey, newValue: any) => void;
  className?: string;
  children?: React.ReactNode;
}

export const DynamicTableRow: React.FC<TableRowProps> = ({
  visibleColumns,
  rowData,
  onCellClick,
  onCellEdit: _onCellEdit,
  className = '',
  children,
}) => {
  const permissions = useColumnPermissions();

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: generateGridTemplateColumns(visibleColumns),
    gap: '1px',
  };

  return (
    <div style={gridStyle} className={`bg-gray-100 ${className}`}>
      {visibleColumns.map((columnKey) => {
        const column = getColumnDefinition(columnKey);
        const value = rowData[columnKey];
        const isEditable = permissions.isColumnEditable(columnKey);

        return (
          <div
            key={columnKey}
            className={`
              p-3 bg-white text-sm
              ${isEditable && onCellClick ? 'cursor-pointer hover:bg-gray-50' : ''}
              ${column.isMoney ? 'text-right font-mono' : ''}
              ${permissions.isColumnReadOnly(columnKey) ? 'bg-gray-50' : ''}
              flex items-center
            `}
            onClick={() => isEditable && onCellClick?.(columnKey, value)}
          >
            {children ? children : (
              <span className={value == null ? 'text-gray-400 italic' : ''}>
                {formatCellValue(value, column)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

interface TotalRowProps {
  visibleColumns: ColumnKey[];
  totals: Record<string, number>;
  className?: string;
}

export const DynamicTotalRow: React.FC<TotalRowProps> = ({
  visibleColumns,
  totals,
  className = '',
}) => {
  const permissions = useColumnPermissions();

  // Check if we should show money totals
  const shouldShowMoneyTotals = permissions.shouldShowMoneyTotals();
  const visibleMoneyColumns = permissions.getVisibleMoneyColumns();

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: generateGridTemplateColumns(visibleColumns),
    gap: '1px',
  };

  return (
    <div style={gridStyle} className={`bg-gray-100 ${className}`}>
      {visibleColumns.map((columnKey) => {
        const column = getColumnDefinition(columnKey);

        // Determine cell content based on column type
        let content: React.ReactNode = null;
        let cellClass = 'p-3 bg-gray-200 text-sm';

        if (column.key === 'snd') {
          // SND column shows "TOTAL" label
          content = <span className="font-semibold text-white">TOTAL</span>;
          cellClass = 'p-3 bg-blue-800 text-sm flex items-center justify-center';
        } else if (column.isMoney && shouldShowMoneyTotals && visibleMoneyColumns.includes(columnKey)) {
          // Money columns show totals with currency symbols
          const total = totals[columnKey] || 0;
          const formattedTotal = formatCurrency(total, columnKey);
          content = <span className="font-semibold text-white text-right w-full">{formattedTotal}</span>;
          cellClass = 'p-3 bg-blue-800 text-sm flex items-center justify-end';
        } else {
          // All other columns are empty grey cells
          content = null;
          cellClass = 'p-3 bg-gray-200 text-sm';
        }

        return (
          <div key={columnKey} className={cellClass}>
            {content}
          </div>
        );
      })}
    </div>
  );
};

// Helper functions
const formatCellValue = (value: any, column: any): string => {
  if (value == null || value === '') {
    return '';
  }

  if (column.isMoney) {
    return formatCurrency(value, column.key);
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (value instanceof Date) {
    return value.toLocaleDateString();
  }

  return String(value);
};

const formatCurrency = (value: number, columnKey: string): string => {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  const symbol = columnKey === 'pfUsd' ? '$' : '₺';
  return `${symbol}${formatted}`;
};
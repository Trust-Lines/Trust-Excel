import React from 'react';
import { useColumnPermissions } from '../hooks/useColumnPermissions';
import { ColumnKey } from '../lib/columns';

interface ColumnDefinition {
  key: ColumnKey;
  label: string;
  className: string;
}

const ColumnHeader: React.FC = () => {
  const { isColumnVisible } = useColumnPermissions();

  const allColumns: ColumnDefinition[] = [
    { key: 'projectNo', label: 'Project No', className: 'col-project-no' },
    { key: 'type', label: 'Type', className: 'col-type' },
    { key: 'pfCode', label: 'PF Code', className: 'col-pf-code' },
    { key: 'vendor', label: 'Vendor', className: 'col-vendor' },
    { key: 'orderType', label: 'Order Type', className: 'col-order-type' },
    { key: 'poSignStatus', label: 'PO Sign Status', className: 'col-po-sign-status' },
    { key: 'pfSignStatus', label: 'PF Sign Status', className: 'col-pf-sign-status' },
    { key: 'status', label: 'Status', className: 'col-status' },
    { key: 'std', label: 'STD', className: 'col-std' },
    { key: 'etd', label: 'ETD', className: 'col-etd' },
    { key: 'rtd', label: 'RTD', className: 'col-rtd' },
    { key: 'ftd', label: 'FTD', className: 'col-ftd' },
    { key: 'pfUsd', label: 'PF USD', className: 'col-pf-usd' },
    { key: 'pfTl', label: 'PF TL', className: 'col-pf-tl' },
    { key: 'containerNo', label: 'Container No', className: 'col-container-no' }
  ];

  // Filter columns based on permissions
  const visibleColumns = allColumns.filter(column => isColumnVisible(column.key));

  // Separate fixed and scrollable columns
  const fixedColumns = visibleColumns.filter(col => col.key === 'projectNo' || col.key === 'type');
  const scrollableColumns = visibleColumns.filter(col => col.key !== 'projectNo' && col.key !== 'type');

  return (
    <div className="column-header">
      {fixedColumns.length > 0 && (
        <div className="column-header-fixed">
          {fixedColumns.map((column) => (
            <div key={column.key} className={`column-header-cell ${column.className}`}>
              {column.label}
            </div>
          ))}
        </div>
      )}
      {scrollableColumns.length > 0 && (
        <div className="column-header-scrollable">
          {scrollableColumns.map((column) => (
            <div key={column.key} className={`column-header-cell ${column.className}`}>
              {column.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ColumnHeader;
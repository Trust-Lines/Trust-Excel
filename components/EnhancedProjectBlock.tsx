import React, { useMemo } from 'react';
import ProjectBlock from './ProjectBlock';
import { useColumnPermissions } from '../hooks/useColumnPermissions';
import { ColumnKey, generateGridTemplateColumns } from '../lib/columns';

interface EnhancedProjectBlockProps {
  project: any;
  sectionLabel: string;
  showSectionHeader?: boolean;
  onProjectUpdate?: (projectId: string) => Promise<void>;
  onItemUpdate?: (itemId: string, updates: any) => void;
  onItemDelete?: (itemId: string) => void;
  className?: string;
}

/**
 * Enhanced ProjectBlock wrapper that implements professional column hiding
 * - True hiding: No whitespace left behind when columns are hidden
 * - Dynamic CSS Grid: Grid template columns generated from visible columns only
 * - Money totals: Handled based on money column visibility
 */
export const EnhancedProjectBlock: React.FC<EnhancedProjectBlockProps> = (props) => {
  const permissions = useColumnPermissions();

  // Get visible columns for proper rendering
  const visibleColumns = useMemo(() => {
    return permissions.getVisibleColumns();
  }, [permissions]);

  // Generate CSS variables for dynamic grid layout
  const gridStyles = useMemo(() => {
    // Fixed left columns (always visible)
    const fixedColumns = ['projectNo', 'type'] as ColumnKey[];

    // Scrollable right columns (filtered by visibility)
    const scrollableColumns = visibleColumns.filter(col =>
      !fixedColumns.includes(col)
    );

    // Generate grid template for scrollable area
    const scrollableGridTemplate = generateGridTemplateColumns(scrollableColumns);

    return {
      '--scrollable-grid-template': scrollableGridTemplate,
      '--visible-column-count': scrollableColumns.length,
    } as React.CSSProperties;
  }, [visibleColumns]);

  // Enhanced CSS to handle true column hiding
  const enhancedStyles = useMemo(() => {
    const hiddenColumns = permissions.getHiddenColumns();

    // Create CSS rules to truly hide columns (not just display: none)
    let css = '';

    hiddenColumns.forEach(columnKey => {
      // Hide column headers and cells
      css += `
        .col-${columnKey.toLowerCase().replace(/([A-Z])/g, '-$1')} {
          display: none !important;
        }
      `;
    });

    // Handle money total cluster visibility
    if (permissions.areAllMoneyColumnsHidden()) {
      css += `
        .money-total-cluster {
          display: none !important;
        }
      `;
    }

    return css;
  }, [permissions]);

  // Apply enhanced styles via CSS injection
  React.useEffect(() => {
    const styleId = 'enhanced-project-block-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = enhancedStyles;

    return () => {
      // Cleanup on unmount
      const el = document.getElementById(styleId);
      if (el && el.textContent === enhancedStyles) {
        el.remove();
      }
    };
  }, [enhancedStyles]);

  return (
    <div
      className="enhanced-project-block"
      style={gridStyles}
    >
      <ProjectBlock {...props} />

      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-column-info" style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '4px',
          fontSize: '12px',
          maxWidth: '300px',
          zIndex: 10000,
        }}>
          <div><strong>Column Debug:</strong></div>
          <div>Visible: {permissions.getVisibleColumns().join(', ')}</div>
          <div>Hidden: {permissions.getHiddenColumns().join(', ')}</div>
          <div>Show Money Totals: {permissions.shouldShowMoneyTotals() ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
};

export default EnhancedProjectBlock;
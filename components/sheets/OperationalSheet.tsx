import React, { useMemo } from 'react';
import ProjectBlock from '../ProjectBlock';
import { ApiSection, BackendProjectItem } from '../../lib/projects';

// Section Total Row Component (currently unused but kept for future use)
/*
const SectionTotalRow: React.FC<{
  sectionLabel: string;
  totals: { pfUsd: number; pfTl: number; hasData: boolean };
  isColumnVisible: (columnKey: string) => boolean;
  shouldShowMoneyTotals: () => boolean;
}> = ({ sectionLabel, totals, isColumnVisible, shouldShowMoneyTotals }) => {
  if (!totals.hasData || !shouldShowMoneyTotals()) {
    return null;
  }

  const sectionName = sectionLabel.replace('TLines ', '').toUpperCase();
  const showUsdTotal = isColumnVisible('pfUsd');
  const showTlTotal = isColumnVisible('pfTl');

  if (!showUsdTotal && !showTlTotal) {
    return null;
  }

  return (
    <div style={{
      position: 'relative',
      width: '100%',
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
      <div style={{
        position: 'absolute',
        right: '20px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
        {showUsdTotal && (
          <div style={{
            backgroundColor: '#1d4ed8',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontWeight: '600',
            fontSize: '14px',
            border: '1px solid #1e40af',
            minWidth: '120px',
            textAlign: 'center'
          }}>
            ${totals.pfUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}
        {showTlTotal && (
          <div style={{
            backgroundColor: '#1d4ed8',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontWeight: '600',
            fontSize: '14px',
            border: '1px solid #1e40af',
            minWidth: '120px',
            textAlign: 'center'
          }}>
            ₺{totals.pfTl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}
      </div>
    </div>
  );
};
*/

export interface SectionMetrics {
  sectionId: string;
  sectionLabel: string;
  height: number; // Calculated height in pixels
  projectCount: number;
  itemCount: number;
}

interface OperationalSheetProps {
  mode?: 'projects' | 'missingExtra';
  sections: ApiSection[];
  globalItemsById: Map<string, BackendProjectItem>;
  updateGlobalItem?: (itemId: string, patch: Partial<BackendProjectItem>) => void;
  onProjectUpdate?: (projectId: string) => Promise<void>;
  vendorCodeFilter?: string;
  onSectionMetrics?: (metrics: SectionMetrics[]) => void; // Callback to report section heights for alignment
  enableAccountingColumns?: boolean; // Enable accounting columns (supplier mode)
}

/**
 * OperationalSheet - Reusable component that renders operational board sections and projects
 * This is extracted from OperationalBoardGrid to allow composition in supplier view
 */
const OperationalSheet: React.FC<OperationalSheetProps> = ({
  mode = 'projects',
  sections,
  globalItemsById,
  updateGlobalItem,
  onProjectUpdate,
  vendorCodeFilter,
  onSectionMetrics,
  enableAccountingColumns = false
}) => {
  // Calculate section totals (unused for now but kept for future features)
  const calculateSectionTotals = (section: ApiSection) => {
    let totalPfUsd = 0;
    let totalPfTl = 0;
    let hasData = false;

    section.projects?.forEach(project => {
      project.rows?.forEach(row => {
        const pfUsd = parseFloat(row.pfUsd || '0');
        const pfTl = parseFloat(row.pfTl || '0');
        if (pfUsd > 0 || pfTl > 0) {
          hasData = true;
          totalPfUsd += pfUsd;
          totalPfTl += pfTl;
        }
      });
    });

    return { pfUsd: totalPfUsd, pfTl: totalPfTl, hasData };
  };

  // Calculate section metrics for alignment (will be enhanced with real height calculation)
  const sectionMetrics = useMemo(() => {
    return sections.map(section => {
      const itemCount = section.projects?.reduce((acc, proj) => acc + (proj.rows?.length || 0), 0) || 0;
      
      // Approximate height calculation (will be refined)
      // Section separator: ~56px, Project header: ~60px, Row: ~36px, Totals: ~45px, margins: ~32px
      let height = 56; // Section separator
      
      section.projects?.forEach(project => {
        height += 60; // Project header
        height += (project.rows?.length || 0) * 36; // Rows
        height += 16; // Project bottom margin
      });
      
      const totals = calculateSectionTotals(section);
      if (totals.hasData) {
        height += 45 + 16; // Totals row + margin
      }

      return {
        sectionId: section.id,
        sectionLabel: section.label,
        height,
        projectCount: section.projects?.length || 0,
        itemCount
      };
    });
  }, [sections]);

  // Report metrics to parent
  React.useEffect(() => {
    if (onSectionMetrics) {
      onSectionMetrics(sectionMetrics);
    }
  }, [sectionMetrics, onSectionMetrics]);

  return (
    <div className="operational-sheet">
      {sections.map((section) => (
        <section key={section.id} data-section-id={section.id}>
          {/* Render projects - each ProjectBlock now renders its own section bar */}
          {section.projects?.map((project, projectIndex) => (
            <ProjectBlock
              key={project.projectId}
              mode={mode}
              project={project}
              sectionLabel={section.label}
              backendItems={project.backendItems}
              globalItemsById={globalItemsById}
              updateGlobalItem={updateGlobalItem}
              onProjectUpdate={onProjectUpdate}
              onDeleteProject={undefined}
              supplierVendorCodeFilter={vendorCodeFilter}
              enableAccountingColumns={enableAccountingColumns}
              showSectionHeader={projectIndex === 0}
            />
          ))}

          {/* Empty state */}
          {(!section.projects || section.projects.length === 0) && (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#666',
              fontStyle: 'italic',
              backgroundColor: '#f8f9fa',
              border: '1px dashed #dee2e6',
              borderRadius: '4px',
              margin: '8px 16px 16px 16px'
            }}>
              No items in this section
            </div>
          )}
        </section>
      ))}
    </div>
  );
};

export default OperationalSheet;

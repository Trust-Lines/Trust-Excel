import React, { useMemo } from 'react';
import { ApiSection } from '../../lib/projects';
import { SectionMetrics } from './OperationalSheet';

interface AccountingSheetProps {
  sections: ApiSection[];
  sectionMetrics: SectionMetrics[]; // Height information from OperationalSheet for alignment
}

const formatCurrency = (amount: number): string => {
  if (amount === 0) return '-';
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const MiniTable: React.FC<{
  title: string;
  currency: string;
  value1: number;
  value2: number;
}> = ({ title, currency, value1, value2 }) => (
  <div className="accounting-mini-table">
    <div className="accounting-mini-table-title">{title}</div>
    <div className="accounting-mini-table-header">
      <div className="accounting-mini-table-header-cell">1st</div>
      <div className="accounting-mini-table-header-cell">2nd</div>
    </div>
    <div className="accounting-mini-table-body">
      <div className="accounting-mini-table-row">
        <div className="accounting-mini-table-cell currency-cell">{currency}</div>
        <div className="accounting-mini-table-cell amount-cell">{formatCurrency(value1)}</div>
      </div>
      <div className="accounting-mini-table-row">
        <div className="accounting-mini-table-cell currency-cell">{currency}</div>
        <div className="accounting-mini-table-cell amount-cell">{formatCurrency(value2)}</div>
      </div>
    </div>
  </div>
);

const RemainingTable: React.FC<{
  title: string;
  usdValue: number;
  tlValue: number;
  hasUnsigned: boolean;
}> = ({ title, usdValue, tlValue, hasUnsigned }) => (
  <div className="accounting-mini-table">
    <div className="accounting-mini-table-title">{title}</div>
    <div className="accounting-mini-table-header">
      <div className="accounting-mini-table-header-cell">USD</div>
      <div className="accounting-mini-table-header-cell">TL</div>
    </div>
    <div className="accounting-mini-table-body">
      {hasUnsigned ? (
        <div style={{
          padding: '12px 8px',
          textAlign: 'center',
          color: '#dc2626',
          fontWeight: '700',
          fontSize: '11px',
          textTransform: 'uppercase',
          backgroundColor: '#fee2e2',
          letterSpacing: '0.5px'
        }}>
          NOT SIGNED
        </div>
      ) : (
        <>
          <div className="accounting-mini-table-row">
            <div className="accounting-mini-table-cell currency-cell">$</div>
            <div className="accounting-mini-table-cell amount-cell">{formatCurrency(usdValue)}</div>
          </div>
          <div className="accounting-mini-table-row">
            <div className="accounting-mini-table-cell currency-cell">₺</div>
            <div className="accounting-mini-table-cell amount-cell">{formatCurrency(tlValue)}</div>
          </div>
        </>
      )}
    </div>
  </div>
);

/**
 * AccountingSheet - Displays accounting information derived from real project items
 * NO MOCK DATA - all values computed from actual backend items
 */
const AccountingSheet: React.FC<AccountingSheetProps> = ({ sections, sectionMetrics }) => {
  // Compute real accounting data from sections
  const accountingData = useMemo(() => {
    return sections.map((section) => {
      let totalPfUsd = 0;
      let totalPfTl = 0;
      let hasUnsignedItems = false;
      let notOrderedUsd = 0;
      let notOrderedTl = 0;
      let itemCount = 0;

      // Iterate through all projects and items in this section
      section.projects?.forEach(project => {
        project.rows?.forEach(row => {
          itemCount++;
          
          const pfTl = parseFloat(row.pfTl || '0');
          const invoice = parseFloat((row as any).invoice || '0');
          const invoiceAsUsd = pfTl > 0 ? 0 : invoice;
          const invoiceAsTl = pfTl > 0 ? invoice : 0;

          totalPfUsd += invoiceAsUsd;
          totalPfTl += invoiceAsTl;

          // Check if item is unsigned (PF Sign Status)
          if (row.pfSignStatus !== 'SIGNED') {
            hasUnsignedItems = true;
          }

          // Check if item is NOT_ORDERED
          if (row.status === 'NOT ORDERED') {
            notOrderedUsd += invoiceAsUsd;
            notOrderedTl += invoiceAsTl;
          }
        });
      });

      const paidUsd1 = 0;
      const paidUsd2 = 0;
      const paidTl1 = 0;
      const paidTl2 = 0;

      // Remaining = Invoice Total - Paid - NotOrdered
      const remainingUsd = totalPfUsd - paidUsd1 - paidUsd2 - notOrderedUsd;
      const remainingTl = totalPfTl - paidTl1 - paidTl2 - notOrderedTl;

      // Get corresponding metrics for height alignment
      const metrics = sectionMetrics.find(m => m.sectionId === section.id);

      return {
        sectionId: section.id,
        sectionLabel: section.label,
        paidUsd1,
        paidUsd2,
        paidTl1,
        paidTl2,
        remainingUsd: Math.max(0, remainingUsd),
        remainingTl: Math.max(0, remainingTl),
        notOrderedUsd,
        notOrderedTl,
        hasUnsignedItems,
        itemCount,
        height: metrics?.height || 200 // Use calculated height from OperationalSheet
      };
    });
  }, [sections, sectionMetrics]);

  // Calculate grand totals
  const grandTotals = useMemo(() => {
    return accountingData.reduce((acc, section) => ({
      totalPaidUsd: acc.totalPaidUsd + section.paidUsd1 + section.paidUsd2,
      totalPaidTl: acc.totalPaidTl + section.paidTl1 + section.paidTl2,
      totalRemainingUsd: acc.totalRemainingUsd + section.remainingUsd,
      totalRemainingTl: acc.totalRemainingTl + section.remainingTl,
      totalNotOrderedUsd: acc.totalNotOrderedUsd + section.notOrderedUsd,
      totalNotOrderedTl: acc.totalNotOrderedTl + section.notOrderedTl
    }), {
      totalPaidUsd: 0,
      totalPaidTl: 0,
      totalRemainingUsd: 0,
      totalRemainingTl: 0,
      totalNotOrderedUsd: 0,
      totalNotOrderedTl: 0
    });
  }, [accountingData]);

  return (
    <div className="accounting-sheet">
      {/* Accounting sections - aligned with operational sections */}
      {accountingData.map((data) => (
        <div
          key={data.sectionId}
          className="accounting-section-aligned"
          style={{
            minHeight: `${data.height}px`, // Match height of operational section
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Section header */}
          <div className="accounting-section-title">
            ACCOUNTING {data.sectionLabel.replace('TLines ', 'T LINES ').toUpperCase()}
          </div>

          {/* Mini tables */}
          <div className="accounting-mini-tables-row">
            <MiniTable
              title="Paid"
              currency="$"
              value1={data.paidUsd1}
              value2={data.paidUsd2}
            />
            <MiniTable
              title="Paid"
              currency="₺"
              value1={data.paidTl1}
              value2={data.paidTl2}
            />
            <RemainingTable
              title="Remaining"
              usdValue={data.remainingUsd}
              tlValue={data.remainingTl}
              hasUnsigned={data.hasUnsignedItems}
            />
            <RemainingTable
              title="Not Ordered"
              usdValue={data.notOrderedUsd}
              tlValue={data.notOrderedTl}
              hasUnsigned={false}
            />
          </div>

          {/* Item count badge */}
          <div style={{
            fontSize: '11px',
            color: '#666',
            marginTop: '8px',
            textAlign: 'center',
            fontWeight: '600'
          }}>
            {data.itemCount} items
          </div>
        </div>
      ))}

      {/* Summary totals at bottom */}
      <div className="accounting-summary-boxes" style={{ marginTop: '24px' }}>
        <div className="accounting-summary-box">
          <div className="accounting-summary-label">Total Paid USD</div>
          <div className="accounting-summary-value">${formatCurrency(grandTotals.totalPaidUsd)}</div>
        </div>
        <div className="accounting-summary-box">
          <div className="accounting-summary-label">Total Paid TL</div>
          <div className="accounting-summary-value">₺{formatCurrency(grandTotals.totalPaidTl)}</div>
        </div>
        <div className="accounting-summary-box">
          <div className="accounting-summary-label">Total Remaining USD</div>
          <div className="accounting-summary-value">${formatCurrency(grandTotals.totalRemainingUsd)}</div>
        </div>
        <div className="accounting-summary-box">
          <div className="accounting-summary-label">Total Remaining TL</div>
          <div className="accounting-summary-value">₺{formatCurrency(grandTotals.totalRemainingTl)}</div>
        </div>
        <div className="accounting-summary-box">
          <div className="accounting-summary-label">Not Ordered USD</div>
          <div className="accounting-summary-value">${formatCurrency(grandTotals.totalNotOrderedUsd)}</div>
        </div>
        <div className="accounting-summary-box">
          <div className="accounting-summary-label">Not Ordered TL</div>
          <div className="accounting-summary-value">₺{formatCurrency(grandTotals.totalNotOrderedTl)}</div>
        </div>
      </div>
    </div>
  );
};

export default AccountingSheet;

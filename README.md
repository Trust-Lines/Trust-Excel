# Operational Tracking Board UI Prototype

A React + TypeScript implementation of a realistic operational tracking board interface that visually resembles a large tracking display for construction/operational projects.

## Features

- **Top Navigation**: Navy strip + red title bar with customizable text
- **Project Blocks**: Multiple vertically stacked project sections
- **Horizontal Scrolling**: Wide content area with smooth horizontal scroll
- **Project Number Column**: Large, colored project numbers spanning full height
- **Type Grouping**: Fixed ordering (Millwork → Shelving → Ceiling → Image → Furniture)
- **PO Sign Status Spanning**: Shared status per type group with visual spanning
- **Responsive Grid**: Column-based layout with proper visual hierarchy

## Component Hierarchy

```
App
├── TopNavigation
└── ProjectBlock (multiple)
    ├── ProjectHeader
    ├── ColumnHeader
    └── [Scrollable Content]
        ├── ProjectNumberColumn
        └── [Data Grid]
            ├── TypeGroup (multiple)
            │   └── RowItem (multiple)
            └── TotalRow
```

## Color Scheme

- **Navy Strip**: `#28385F`
- **Red Title Bar**: `#B02417`
- **Project Headers**: `#404040`
- **Black Column Headers**: `#000000`
- **Project Number Backgrounds**:
  - Orange: `#DE8244`
  - Blue: `#6A99D1`
  - Green: `#9FCF63`
- **Blue Accent**: `#3368F5`

## Data Model

```typescript
interface Project {
  projectId: string;
  projectNumber: number;
  projectNumberColor: 'orange' | 'blue' | 'green';
  projectName: string;
  address: string;
  region: string;
  rows: Row[];
}

interface Row {
  type: 'Millwork' | 'Shelving' | 'Ceiling' | 'Image' | 'Furniture';
  pfCode: string;
  vendor: string;
  orderType: string;
  poSignStatus: string;
  pfSignStatus: string;
  status: string;
  std: string;
  etd: string;
  rtd: string;
  ftd: string;
  containerNo: string;
}
```

## Running the Project

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The development server will start at `http://localhost:5173/`

## Key Implementation Details

- **CSS Grid Layout**: Uses CSS Grid for precise column alignment and spanning
- **Type Ordering**: Enforces fixed type order regardless of data input order
- **PO Sign Status Logic**: Only shows on first row of each type group, spans visually
- **Horizontal Scroll**: Maintains minimum width while allowing horizontal overflow
- **Visual Hierarchy**: Clear separation between projects and type groups

## Layout Architecture

### Strict Height Calculations
- **ROW_HEIGHT**: 40px (single source of truth)
- **TOTAL_ROW_HEIGHT**: 32px (for bottom total row)
- **Type Group Height**: `typeRowCount * ROW_HEIGHT`
- **Project Number Height**: `dataRowsHeight + TOTAL_ROW_HEIGHT`

### Type Grouping (Rowspan-like Behavior)
Each Type appears ONCE per group and visually spans the exact height of its rows:

```
Millwork (spans 3 rows = 120px)
├── PMS-P179-M-01: Premier Millwork, Custom, ASSEMBLY
├── PMS-P179-M-02: Premier Millwork, Standard, READY
└── PMS-P179-M-03: Premier Millwork, Custom, SENT TO TLINES

Shelving (spans 1 row = 40px)
└── ESS-P179-S-01: Elite Storage, Modular, ORDERED
```

### PO Sign Status Per Type Group
- Shows ONCE per Type group (not per row)
- Spans same height as Type group using normal layout flow
- Only 3 values: NOT SIGNED, READY TO SIGN, SIGNED
- Stays within column boundaries (no overflow)
- **No absolute positioning** - flows correctly with horizontal scroll
- First row renders spanning cell, subsequent rows render hidden placeholders

### Inline Editing System
- **Editable Fields**: Vendor, Order Type, Status, PF/PO Sign Status, Dates, Container No
- **Read-only Fields**: PF Code, STD
- **Editor Types**: Text inputs, date pickers, professional status dropdowns
- **Keyboard Controls**: Enter=Save, Escape=Cancel

### Professional Status Dropdown UX
- **Upward Opening**: Dropdowns open upward by default (`bottom: 100%`)
- **Proper Height**: 280px max-height with scroll for visibility of all options
- **Current Status First**: Active status appears as first item, highlighted in blue
- **Fixed Order**: All 11 status values in operational sequence
- **Visual Polish**: Clear hover states, proper spacing, professional styling
- **Column Containment**: Stays within column boundaries, scrolls correctly

## PO Sign Status Layout Fix

### Problem Eliminated: Floating/Drifting
The original implementation used `position: absolute` with hardcoded `left: 540px` which caused:
- PO Sign Status to "float" relative to viewport instead of scrollable content
- Breaking horizontal scroll alignment
- Content drifting outside column boundaries

### Solution: Normal Layout Flow
**Method Used**: Render PO Sign Status as normal cells in layout flow with CSS-based spanning

**Implementation**:
1. **First row of each Type group**: Renders PO Sign Status cell with `height: ${typeGroupHeight}px`
2. **Subsequent rows**: Render hidden placeholder cells (`visibility: hidden`) to maintain layout
3. **No absolute positioning** - everything stays in normal document flow
4. **Proper scrolling** - PO Sign Status moves correctly with horizontal scroll

**Why Floating Bug is Eliminated**:
- ✅ No absolute positioning context that breaks scroll container
- ✅ PO Sign Status is part of the same grid structure as other cells
- ✅ Height spanning via CSS height property, not positioning hacks
- ✅ `box-sizing: border-box` and `overflow: hidden` prevent layout overflow

This ensures PO Sign Status always stays within its column boundaries and scrolls correctly with the right-side content.

---

This is a scalable UI foundation ready for integration with real backend data and additional interactive features.
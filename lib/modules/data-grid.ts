import { DesignModule } from '@/types';

export const dataGridModule: DesignModule = {
  slug: 'data-grid',
  title: 'Design Data Grid',
  description: 'A high-performance spreadsheet-like data grid with virtual scrolling, inline editing, sorting, filtering, and support for 1M+ rows.',
  difficulty: 'Senior',
  companies: ['Salesforce', 'Airtable', 'Google', 'Microsoft', 'Atlassian'],
  tags: ['Virtualization', 'Canvas', 'Inline Edit', 'Performance'],
  estimatedMinutes: 45,
  sections: [
    {
      id: 'functional-requirements',
      title: 'Functional Requirements',
      content: `Core (must have):
- Display tabular data: rows × columns with typed cells (text, number, date, boolean, select)
- Virtual scrolling: handle 1M+ rows without DOM explosion
- Inline editing: click cell → edit in-place; Tab to next cell; Enter to confirm; Escape to cancel
- Sorting: click column header to sort ascending/descending; multi-column sort
- Filtering: per-column filter inputs; filter by type (text search, number range, date picker, multi-select)
- Column management: resize (drag), reorder (drag), hide/show; sticky first N columns
- Row selection: single, multi (Shift+click), all (Ctrl+A); checkbox column
- Bulk actions on selected rows: delete, export, tag

Nice to have:
- Row grouping and aggregation (subtotals)
- Cell formulas (=SUM(A1:A10) style)
- Copy/paste: Excel-compatible (tab-delimited)
- Undo/redo for edits
- Column formulas / computed columns
- Export to CSV / Excel`,
    },
    {
      id: 'non-functional-requirements',
      title: 'Non-Functional Requirements',
      content: `- Render: 60fps scrolling with 1M rows and 50 columns
- Keyboard: full Excel-style navigation (arrows, Tab, Enter, PgUp/PgDn, Ctrl+Home/End)
- Editing latency: cell edit saves within 500ms; optimistic UI for instant feedback
- Filter/sort: client-side for < 100K rows; server-side beyond (re-fetch)
- Memory: DOM node count bounded regardless of total row count (windowing)
- Accessibility: screen reader announces cell position; keyboard operable for all actions
- Responsiveness: horizontal scroll for many columns; frozen columns always visible
- Column count: handle tables with 500+ columns`,
    },
    {
      id: 'user-flow',
      title: 'User Flow',
      content: `Initial load:
1. Page opens → GET /tables/:id/rows?page=1&limit=50 → render first 50 rows
2. Column headers rendered from schema (GET /tables/:id/schema)
3. VirtualGrid measures container height → determines how many rows to render
4. User scrolls → IntersectionObserver or onScroll triggers next page fetch
5. Rows prepended/appended as user scrolls; off-screen rows unmounted (windowing)

Inline editing:
1. User clicks a cell → cell switches from display to edit mode (input/select rendered)
2. User types or selects value
3. User presses Tab → save current cell (PATCH /rows/:rowId { column: value })
   → optimistic u UI → move focus to next cell
4. User presses Escape → discard changes; revert to original value; exit edit mode
5. Server responds: success → mark saved; error → show inline validation error

Sorting and filtering:
1. Click column header → sort icon cycles (none → asc → desc → none)
2. Filter icon → per-column filter popover appears
3. User types filter value → debounce 300ms
4. If totalRows < 100K: sort/filter applied client-side to cached rows
5. If totalRows >= 100K: GET /rows?sort=name:asc&filter=status:active → re-fetch
6. Filter pills displayed below header bar; click X to remove individual filter`,
    },
    {
      id: 'high-level-architecture',
      title: 'High Level Architecture',
      content: `Client rendering options (choose based on row count):
< 100K rows:  DOM rows with react-window (TanStack Virtual) — flexible, accessible
< 1M rows:    DOM rows mandatory virtual scrolling; cell-level virtualisation for wide tables
> 1M rows:    Canvas rendering (Glide Data Grid) — skip DOM entirely; GPU-drawn cells

Data flow:
Client → Table API → Row Service → PostgreSQL (< 10M rows)
                                 → ClickHouse (> 10M rows, analytics use case)

Real-time collaboration (Airtable-style):
Edit → PATCH /rows/:id → WS gateway → broadcast cell update to all viewers of same table
Other clients: receive { rowId, column, value } → update cell if visible

Sorting/filtering:
Client-side: Web Worker sorts/filters array (doesn't block main thread)
Server-side: SQL ORDER BY + WHERE pushed to DB; cursor-paginated results

Search:
Full-text search across all cell values: Elasticsearch (if needed) or PostgreSQL GIN index
Scoped to one table: PostgreSQL ILIKE or trigram index usually sufficient`,
    },
    {
      id: 'component-design',
      title: 'Component Design',
      content: `<DataGrid>
  <GridToolbar>
    <SearchInput />                ← global search across all columns
    <FilterBar>                    ← active filter pills with remove button
      <FilterPill column value op />
    </FilterBar>
    <ColumnVisibilityPicker />
    <ExportButton />
    <BulkActions visible={selectedCount > 0} />
  </GridToolbar>

  <GridContainer ref={containerRef}>
    <FrozenColumnPanel>            ← sticky left columns (checkbox + key column)
      <HeaderCell column />
      <VirtualRows>
        <FrozenCell rowIndex />
      </VirtualRows>
    </FrozenColumnPanel>

    <ScrollableGrid onScroll={handleScroll}>
      <HeaderRow>
        <ColumnHeader
          column
          sortDirection
          onSort
          onResize         ← drag handle on right edge
          onFilter
        />
      </HeaderRow>
      <VirtualRows                 ← only visible rows + overscan rendered
        rowCount={totalRows}
        rowHeight={36}
        overscan={10}
      >
        <GridRow rowIndex>
          <GridCell
            rowId column
            value displayValue
            isEditing
            onStartEdit
            onSave onCancel
          />
        </GridRow>
      </VirtualRows>
    </ScrollableGrid>

    <SelectionOverlay />           ← blue highlight box following selection range
  </GridContainer>

  <StatusBar>                      ← "1,234,567 rows · 3 selected · Filtered to 45"
  <ColumnFilterPopover />          ← portal; shown on filter icon click`,
    },
    {
      id: 'state-management',
      title: 'State Management',
      content: `Grid state — Zustand (complex enough to warrant global store):
\`\`\`ts
interface GridStore {
  // Data
  rows: Row[];                    // in-memory page cache
  totalRows: number;
  columns: Column[];
  schema: TableSchema;

  // View state
  sortColumns: SortColumn[];      // [{ column, direction }]
  filters: Filter[];
  hiddenColumnIds: Set<string>;
  columnWidths: Map<string, number>;
  frozenCount: number;            // how many columns are frozen

  // Selection
  selectedRowIds: Set<string>;
  activeCell: { rowIndex: number; colIndex: number } | null;
  editingCell: { rowId: string; column: string } | null;
  selectionRange: { start: CellRef; end: CellRef } | null;  // Shift+click range

  // Actions
  startEdit: (rowId: string, column: string) => void;
  commitEdit: (rowId: string, column: string, value: unknown) => void;
  cancelEdit: () => void;
  setSort: (column: string, direction: SortDirection) => void;
  setFilter: (column: string, filter: FilterValue) => void;
  moveSelection: (direction: 'up' | 'down' | 'left' | 'right') => void;
}
\`\`\`

Selection as range (not per-cell booleans):
\`\`\`ts
// O(1) storage; O(1) membership check
const isSelected = (rowIndex: number, colIndex: number) =>
  rowIndex >= selectionRange.start.row && rowIndex <= selectionRange.end.row &&
  colIndex >= selectionRange.start.col && colIndex <= selectionRange.end.col;
\`\`\`

Optimistic edit:
\`\`\`ts
commitEdit: (rowId, column, value) => {
  const prev = get().rows.find(r => r.id === rowId)?.[column];
  // 1. Update local state immediately
  set(produce(s => { s.rows.find(r => r.id === rowId)[column] = value; }));
  // 2. Send to server
  api.patchRow(rowId, { [column]: value }).catch(() => {
    // 3. Rollback on error
    set(produce(s => { s.rows.find(r => r.id === rowId)[column] = prev; }));
  });
}
\`\`\``,
    },
    {
      id: 'data-model',
      title: 'Data Model',
      content: `\`\`\`ts
type ColumnType = 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect' | 'url' | 'attachment';

interface TableSchema {
  id: string;
  name: string;
  columns: Column[];
  primaryKey: string;
  createdAt: Date;
  rowCount: number;
}

interface Column {
  id: string;
  name: string;
  type: ColumnType;
  width: number;
  frozen: boolean;
  required: boolean;
  options?: string[];          // for select / multiselect
  format?: string;             // for date: 'YYYY-MM-DD'
  formula?: string;            // computed column expression
}

interface Row {
  id: string;
  [columnId: string]: unknown; // dynamic columns
  _createdAt: Date;
  _updatedAt: Date;
  _createdBy: string;
}

interface Filter {
  columnId: string;
  operator: 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'is_empty' | 'is_not_empty' | 'in';
  value: unknown;
}

interface SortColumn {
  columnId: string;
  direction: 'asc' | 'desc';
  priority: number;            // multi-sort: lower = applied first
}
\`\`\`

Storage options by row count:
- < 1M rows: PostgreSQL with JSONB properties column (flexible schema)
- 1M–100M rows: PostgreSQL partitioned by tableId
- > 100M rows: ClickHouse (if analytics) or Spanner (if transactional + global)`,
    },
    {
      id: 'scaling',
      title: 'Scaling',
      content: `The rendering wall — why DOM fails at scale:
- Each DOM row with 20 columns = ~200 DOM nodes
- 10K rows: 2M DOM nodes → 500MB+ memory; scroll lags at 10fps
- Solution: virtualisation renders only viewport rows + overscan (~30 rows visible)
- 30 rows × 20 columns = 600 DOM nodes regardless of total row count

Canvas rendering for extreme scale:
- Glide Data Grid: renders cells as pixel operations on a <canvas>
- No DOM per cell → zero GC pressure from cell elements
- 1M rows, 100 columns: same render cost as 100 rows (only paints visible area)
- Trade-off: no native browser accessibility; must build custom ARIA layer

Web Worker for sort/filter:
\`\`\`ts
// Off-main-thread sort — prevents 500ms freeze for 100K row array
const worker = new Worker('/sort-worker.js');
worker.postMessage({ rows, sortColumns });
worker.onmessage = ({ data: sortedRows }) => setRows(sortedRows);
\`\`\`

Horizontal virtualisation (500+ columns):
- react-window Grid (both axes) — render only visible columns too
- Column widths must be known upfront (or estimated) for virtual layout
- Frozen columns rendered in a separate non-virtualised panel (always visible)

Pagination strategy:
- Cursor-based: use last row's primary key as cursor (not offset)
- Reason: offset breaks when rows are inserted/deleted during scrolling
- Page size: 100–200 rows; pre-fetch next page when user is 50% through current`,
    },
    {
      id: 'performance',
      title: 'Performance',
      content: `Cell render optimisation:
- GridRow: React.memo with custom comparator — only re-render if row data changed
- GridCell: React.memo — only re-render if cell's value or edit state changed
- Avoid index as key — use rowId as key so React reconciler matches correctly on reorder

Keyboard navigation at 60fps:
- moveSelection dispatches to Zustand; does not trigger API calls
- selectedRowIds as Set<string> — O(1) membership check vs O(n) array includes
- Active cell coordinates as { rowIndex, colIndex } — O(1) lookup in virtualised list

Column resize:
- During drag: update width in local ref (not state) — avoids re-render per pixel
- On drag end: commit to Zustand + persist to server
- Use CSS column-width variable: body grid template updates from one source

Copy/paste (Excel compatibility):
- On Ctrl+C: read selectionRange → build tab-delimited string → navigator.clipboard.writeText
- On Ctrl+V: parse tab-delimited → map to cells starting at activeCell → batch PATCH
- Special case: paste beyond current row count → batch INSERT new rows`,
    },
    {
      id: 'interview-tips',
      title: 'Interview Tips',
      content: `1. Canvas vs DOM — lead with the threshold: "DOM works fine up to ~50K rows; above that, Canvas (Glide Data Grid) is required". Name Glide Data Grid explicitly
2. Selection as range coordinates — not per-cell booleans. "I store {start, end} cell coords — O(1) storage and lookup for any selection size"
3. Web Worker for sort — "sorting 100K rows on the main thread blocks the UI for 500ms; I'd push it to a Web Worker"
4. Inline edit with optimistic rollback — describe the full: update local → PATCH → rollback on error
5. Cursor pagination not offset — "offset breaks when rows are inserted during scrolling; cursor uses last row's primary key"
6. Frozen columns as separate DOM panel — not a CSS trick; separate virtualised list with synced scroll positions
7. Keyboard navigation is a non-negotiable — interviewers at Salesforce/Airtable will ask about Tab/Enter/arrow/Ctrl+Home. Have the mental model ready`,
    },
  ],
};

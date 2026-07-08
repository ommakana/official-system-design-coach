import { VisualData } from '@/types/visuals';

export const dataGridVisuals: Record<string, VisualData> = {

  'user-flow': {
    type: 'flow',
    title: 'Inline Cell Edit Flow',
    steps: [
      { label: 'User clicks a cell', color: 'violet', detail: 'startEdit(rowId, columnId) → Zustand sets editingCell; cell re-renders as <input>' },
      { label: 'User types new value', color: 'blue', detail: 'Local state only — no API call; other cells unaffected (React.memo)' },
      {
        label: 'User presses Tab or Enter',
        color: 'emerald',
        detail: 'commitEdit(rowId, column, value) called',
        branch: [
          { label: 'Tab → move focus right', color: 'blue', detail: 'Save current cell + activate next cell in same row' },
          { label: 'Enter → move focus down', color: 'blue', detail: 'Save current cell + activate cell below in same column' },
        ],
      },
      { label: 'Optimistic update: local state updated immediately', color: 'emerald', detail: 'Zustand produce() sets rows[rowId][column] = newValue' },
      {
        label: 'PATCH /rows/:id sent in background',
        color: 'slate',
        detail: 'Server validates + persists',
        branch: [
          { label: 'Success', color: 'emerald', detail: 'No UI change needed — already showing correct value' },
          { label: 'Error', color: 'rose', detail: 'Rollback: restore prev value; show inline validation error on cell' },
        ],
      },
    ],
  },

  'high-level-architecture': {
    type: 'comparison',
    title: 'DOM Virtualisation vs Canvas Rendering — Choose by Row Count',
    columns: [
      {
        heading: 'DOM + react-window (< 100K rows)',
        color: 'blue',
        points: [
          'Render only visible rows + 10 overscan',
          '30 visible rows × 20 cols = 600 DOM nodes max',
          'Native browser accessibility built-in',
          'Keyboard navigation works without custom code',
          'react-window FixedSizeList for uniform heights',
          'TanStack Virtual for variable row heights',
        ],
      },
      {
        heading: 'Canvas — Glide Data Grid (> 100K rows)',
        color: 'violet',
        points: [
          'Cells rendered as pixel operations on <canvas>',
          'Zero DOM nodes per cell — zero GC pressure',
          '1M rows × 100 cols: same render cost as 100 rows',
          'Custom ARIA layer required (canvas has no a11y)',
          'Web Worker for sort/filter — no main thread block',
          'Used by: Airtable, Linear, Notion databases',
        ],
      },
    ],
  },

  'component-design': {
    type: 'tree',
    title: 'Component Hierarchy',
    root: {
      label: 'DataGrid', color: 'violet',
      children: [
        { label: 'GridToolbar', color: 'blue',
          children: [
            { label: 'SearchInput', color: 'slate', note: 'global search across all columns' },
            { label: 'FilterBar', color: 'amber', note: 'active filter pills with remove button' },
            { label: 'ColumnVisibilityPicker', color: 'slate' },
            { label: 'BulkActions', color: 'rose', note: 'visible when selectedCount > 0' },
          ],
        },
        { label: 'GridContainer', color: 'violet',
          children: [
            { label: 'FrozenColumnPanel', color: 'amber', note: 'sticky left; checkbox + key column; synced scroll',
              children: [{ label: 'FrozenCell', color: 'slate', note: 'per visible row' }],
            },
            { label: 'ScrollableGrid', color: 'blue',
              children: [
                { label: 'HeaderRow', color: 'slate',
                  children: [{ label: 'ColumnHeader', color: 'slate', note: 'sort icon, filter icon, resize handle' }],
                },
                { label: 'VirtualRows', color: 'emerald', note: 'only visible rows + 10 overscan',
                  children: [
                    { label: 'GridRow', color: 'emerald', note: 'React.memo; rowId as key',
                      children: [{ label: 'GridCell', color: 'violet', note: 'display or edit mode; memo\'d' }],
                    },
                  ],
                },
              ],
            },
            { label: 'SelectionOverlay', color: 'violet', note: 'blue highlight box for range selection' },
          ],
        },
        { label: 'StatusBar', color: 'slate', note: '"1.2M rows · 3 selected · Filtered to 45"' },
        { label: 'ColumnFilterPopover', color: 'slate', note: 'portal; rendered on filter icon click' },
      ],
    },
  },

  'state-management': {
    type: 'flow',
    title: 'Range Selection — O(1) Pattern',
    steps: [
      { label: 'User clicks cell (0, 0)', color: 'violet', detail: 'selectionRange = { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } }' },
      { label: 'User holds Shift + clicks cell (4, 3)', color: 'blue', detail: 'selectionRange = { start: { row: 0, col: 0 }, end: { row: 4, col: 3 } }' },
      { label: 'isSelected(r, c) checked per cell on render', color: 'emerald', detail: 'O(1): r >= start.row && r <= end.row && c >= start.col && c <= end.col' },
      { label: 'User presses Ctrl+C → copy selection to clipboard', color: 'amber', detail: 'Build tab-delimited string from range; navigator.clipboard.writeText()' },
      { label: 'User presses Delete → bulk DELETE for selected range', color: 'rose', detail: 'PATCH /rows/bulk with { rowIds, column: null } — single API call, not N calls' },
    ],
  },
};

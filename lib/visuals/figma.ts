import { VisualData } from '@/types/visuals';

export const figmaVisuals: Record<string, VisualData> = {

  'user-flow': {
    type: 'flow',
    title: 'Editing a File — Local → Synced to All Peers',
    steps: [
      { label: 'User drags an object on canvas', color: 'violet', detail: 'Position updates locally at 60fps — no Yjs writes during drag (GPU transform only)' },
      { label: 'Render engine updates canvas in real-time', color: 'emerald', detail: 'WebGL uniform matrix updated; GPU handles transform — zero DOM node movement' },
      { label: 'User releases mouse (pointer-up)', color: 'blue', detail: 'Final position written to Yjs: yNodes.get(id).set("x", newX) and set("y", newY)' },
      { label: 'Yjs generates binary CRDT update', color: 'amber', detail: 'Deterministic, per-property LWW register — no server needed for merge' },
      {
        label: 'WS sends binary update to Yjs Sync Server',
        color: 'blue',
        detail: 'Server stores update (append-only) and broadcasts to all peers in same file',
        branch: [
          { label: 'All peers apply update', color: 'emerald', detail: 'Object snaps to new position on their canvas — convergence guaranteed' },
          { label: 'Conflict (two users moved same object)', color: 'amber', detail: 'LWW: whoever sent last position wins — acceptable for design tools' },
        ],
      },
    ],
  },

  'high-level-architecture': {
    type: 'arch',
    title: 'Figma System Architecture',
    layers: [
      { nodes: [
        { label: 'Client A', sublabel: 'WebGL + Yjs Doc', color: 'violet' },
        { label: 'Client B', sublabel: 'WebGL + Yjs Doc', color: 'violet' },
      ]},
      { edgeLabel: 'binary Yjs updates (WebSocket)', nodes: [{ label: 'WS Gateway', sublabel: 'sharded by fileId', color: 'blue' }] },
      { edgeLabel: 'sync + broadcast', nodes: [
        { label: 'Yjs Sync Server', sublabel: 'merges + fans out updates', color: 'blue' },
        { label: 'Awareness Relay', sublabel: 'cursor positions (ephemeral)', color: 'slate' },
      ]},
      { edgeLabel: 'persist', nodes: [{ label: 'PostgreSQL', sublabel: 'binary Yjs updates (append-only)', color: 'emerald' }] },
      { edgeLabel: 'hourly', nodes: [{ label: 'Snapshot Service', sublabel: 'materialises JSON for history', color: 'amber' }] },
    ],
  },

  'component-design': {
    type: 'tree',
    title: 'Component Hierarchy',
    root: {
      label: 'FigmaEditor', color: 'violet',
      children: [
        { label: 'Toolbar', color: 'slate', note: 'move / frame / shape / pen / text tool picker' },
        { label: 'CanvasArea', color: 'blue',
          children: [
            { label: 'WebGLCanvas', color: 'emerald', note: 'single <canvas>; all rendering via GPU' },
            { label: 'SelectionOverlay', color: 'amber', note: 'SVG for resize/rotation handles' },
            { label: 'PeerCursors', color: 'violet', note: 'coloured carets per collaborator (Awareness API)' },
          ],
        },
        { label: 'LeftPanel', color: 'slate',
          children: [
            { label: 'LayersTree', color: 'blue', note: 'virtual tree — handles 100K+ nodes' },
            { label: 'PagesPanel', color: 'slate' },
          ],
        },
        { label: 'RightPanel', color: 'slate',
          children: [
            { label: 'DesignTab', color: 'violet',
              children: [
                { label: 'PositionInputs', color: 'slate', note: 'X, Y, W, H — writes to Yjs on blur' },
                { label: 'FillEditor', color: 'slate' },
                { label: 'AutoLayoutEditor', color: 'slate' },
              ],
            },
          ],
        },
      ],
    },
  },

  'state-management': {
    type: 'comparison',
    title: 'Two Strict State Layers — Never Cross the Boundary',
    columns: [
      {
        heading: 'Document State → Yjs Doc',
        color: 'violet',
        points: [
          'yNodes: Y.Map — nodeId → node properties',
          'Each property is a separate CRDT register',
          'Move node: set("x", v) and set("y", v) separately',
          'Text content: Y.Text (character-level CRDT)',
          'Synced to all peers via WS binary updates',
          'Never put viewport, selection, or hover state here',
        ],
      },
      {
        heading: 'Render State → Zustand (local only)',
        color: 'blue',
        points: [
          'viewport: { x, y, zoom } — each user pans independently',
          'selectedNodeIds — local selection, not shared',
          'hoveredNodeId — ephemeral, not persisted',
          'tool: "move" | "frame" | "pen" | "text"',
          'isDragging — controls CRDT write batching',
          'Never synced via Yjs — stays local to each client',
        ],
      },
    ],
  },
};

import { DesignModule } from '@/types';

export const whiteboardModule: DesignModule = {
  slug: 'whiteboard',
  title: 'Design Whiteboard',
  description: 'A real-time collaborative infinite whiteboard with shapes, freehand drawing, sticky notes, and multi-user presence — similar to Miro or FigJam.',
  difficulty: 'Staff',
  companies: ['Miro', 'Figma', 'Microsoft', 'Atlassian', 'Zoom'],
  tags: ['Canvas', 'CRDT', 'Real-time', 'Infinite Canvas'],
  estimatedMinutes: 55,
  sections: [
    {
      id: 'functional-requirements',
      title: 'Functional Requirements',
      content: `Core (must have):
- Infinite canvas: pan (drag), zoom (wheel/pinch), no hard boundaries
- Objects: sticky notes (text), shapes (rect, ellipse, arrow), images, text boxes
- Freehand drawing: variable stroke width, colour picker
- Real-time collaboration: see all users' cursors and edits live
- Selection: click, marquee select, multi-select (Shift+click); group/ungroup
- Transform: move, resize, rotate any object; snap to grid optional
- Z-order: bring forward / send back
- Export: PNG of selected area or full board at chosen resolution
- Undo/redo: per-user undo (Ctrl+Z reverses only your actions)

Nice to have:
- Frames/sections: label a region of the board
- Voting / reaction stamps (facilitation tools)
- Timer widget
- Mind map auto-layout
- Presentation mode: pan between frames sequentially`,
    },
    {
      id: 'non-functional-requirements',
      title: 'Non-Functional Requirements',
      content: `- Canvas render: 60fps with 5,000+ objects; no stutter during pan/zoom
- Collaboration latency: remote edits visible within 500ms
- Freehand: local stroke renders at full 60fps regardless of network
- Offline: full editing capability; auto-merge on reconnect
- Scale: boards with 100 simultaneous editors; up to 50K objects per board
- Export: 4K PNG of full board within 15s for 10K objects
- Availability: 99.9% — workshop facilitation fails if whiteboard goes down
- Convergence: all clients reach identical state after network partition heals`,
    },
    {
      id: 'user-flow',
      title: 'User Flow',
      content: `Opening a board:
1. URL contains boardId → fetch initial board snapshot via REST
2. Render all objects from snapshot onto Canvas 2D context
3. WS connection established → server sends delta since snapshot version
4. Other users appear as named cursors (Awareness API data)
5. User's camera position (pan/zoom) is local-only — not synced

Adding a sticky note:
1. User double-clicks canvas → "New sticky" created at cursor position
2. Yjs: yObjects.set(id, { type: 'sticky', x, y, width: 200, height: 150, text: '' })
3. WS sends binary Yjs update to server → broadcast to other clients
4. Other clients render new sticky instantly
5. User types → text property updates per-keystroke in Yjs (text is a Y.Text)

Freehand drawing:
1. User mouse-down → stroke begins; points collected in local array
2. Canvas 2D draws stroke in real-time — smooth, no CRDT yet
3. Mouse-up → stroke finalised → create permanent object in Yjs with points array
4. WS sends the completed stroke (not intermediate points) — avoids WS flood
5. Other clients render final stroke (may see stroke appear at once on their screen)

Multi-user conflict (two users move same sticky):
- Yjs LWW (Last Write Wins) per property: whoever sends last position wins
- Acceptable for whiteboard (vs document editing where character loss is not ok)`,
    },
    {
      id: 'high-level-architecture',
      title: 'High Level Architecture',
      content: `Client rendering:
Canvas 2D (< 5K objects) or WebGL (> 5K objects)
← Yjs Doc (CRDT source of truth for all objects)
← Awareness API (cursor positions, user presence)
← WS connection to Collaboration Server

Collaboration layer (shard by boardId):
Client A ←→ WS Gateway → Yjs Sync Server
Client B ←→               ↓
                    Document Store (Postgres: binary Yjs updates, append-only)
                           ↓
                    Snapshot Service (materialises JSON board state hourly)

Export service:
Client → Export API → Headless Chrome / OffscreenCanvas worker
                    → Render board JSON → PNG/PDF
                    → Upload to S3 → Pre-signed URL returned

Presence layer:
Yjs Awareness API: each client broadcasts cursor position as ephemeral awareness state
Server relays awareness updates to all peers in same board (not persisted)

Asset storage (images pasted onto board):
Client → Upload Service (pre-signed S3 URL) → S3 → CDN
Image object in Yjs stores CDN URL only (not raw bytes)`,
    },
    {
      id: 'component-design',
      title: 'Component Design',
      content: `<WhiteboardApp>
  <Toolbar>
    <ToolButton tool="select" />
    <ToolButton tool="sticky" />
    <ToolButton tool="shape" />
    <ToolButton tool="pen" />
    <ToolButton tool="text" />
    <ToolButton tool="image" />
    <ZoomControls />
    <ExportButton />
  </Toolbar>
  <CanvasContainer
    onWheel={handleZoom}
    onPointerDown={handlePanStart}
  >
    <canvas ref={canvasRef} />    ← single canvas element; all objects drawn here
    <SelectionOverlay>           ← HTML/SVG layer for resize handles (not in canvas)
      <ResizeHandle corner="ne" />
      <ResizeHandle corner="sw" />
      <RotationHandle />
    </SelectionOverlay>
    <PeerCursors>                ← one cursor per connected user
      <PeerCursor userId color name />
    </PeerCursors>
    <StickyTextEditor>           ← contenteditable overlay when editing sticky text
  </CanvasContainer>
  <MiniMap />                    ← small overview of full board; shows viewport rect
  <CollaboratorList />           ← avatar strip showing online users
  <ZoomDisplay />                ← "75%" zoom indicator`,
    },
    {
      id: 'state-management',
      title: 'State Management',
      content: `Three layers — keep them strictly separate:

1. Board objects = Yjs Doc (persisted, synced):
\`\`\`ts
const ydoc = new Y.Doc();
const yObjects = ydoc.getMap<BoardObject>('objects');
// Each object property is independently mergeable
// Text content of sticky: Y.Text (character-level CRDT)
// Position/size/colour: Y.Map (LWW per key)

ydoc.on('update', (update: Uint8Array) => {
  provider.ws.send(update);          // send binary update to server
  renderDirtyObjects(getChangedIds(update)); // re-render only changed objects
});
\`\`\`

2. Camera / viewport = Zustand (local, not synced):
\`\`\`ts
interface ViewportStore {
  x: number;      // pan offset
  y: number;
  zoom: number;   // 0.1 – 10
  setViewport: (x: number, y: number, zoom: number) => void;
}
// Never put viewport in Yjs — each user should pan independently
\`\`\`

3. Presence = Yjs Awareness API (ephemeral, not persisted):
\`\`\`ts
provider.awareness.setLocalState({
  cursor: { x: worldX, y: worldY },
  user: { name, color },
  selectedIds: selectedObjectIds,
});
// Awareness updates are broadcast but NOT stored in Yjs doc
// Clears automatically when user disconnects
\`\`\``,
    },
    {
      id: 'data-model',
      title: 'Data Model',
      content: `\`\`\`ts
type BoardObjectType = 'sticky' | 'rectangle' | 'ellipse' | 'arrow'
  | 'text' | 'image' | 'freehand' | 'frame';

interface BoardObject {
  id: string;
  type: BoardObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;        // degrees
  zIndex: number;
  locked: boolean;
  // Sticky / text
  text?: string;           // stored as Y.Text in Yjs for collaborative editing
  fontSize?: number;
  textColor?: string;
  backgroundColor?: string;
  // Shape
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  // Arrow
  startPoint?: Point;
  endPoint?: Point;
  startConnectedTo?: string;  // objectId
  endConnectedTo?: string;
  // Image
  imageUrl?: string;          // CDN URL
  // Freehand
  points?: Point[];
  pressure?: number[];        // for variable stroke width
  // Frame
  label?: string;
}

interface Board {
  id: string;
  name: string;
  ownerId: string;
  teamId?: string;
  isPublic: boolean;
  shareToken?: string;
  createdAt: Date;
  updatedAt: Date;
  thumbnail?: string;         // last-rendered thumbnail for board list
}
\`\`\``,
    },
    {
      id: 'scaling',
      title: 'Scaling',
      content: `Canvas rendering with 5K+ objects:
- Canvas 2D: fine up to ~2K objects at 60fps
- WebGL (via PixiJS or custom): required above 2K; GPU-batched draw calls
- Switch threshold: measure frame time; upgrade renderer if > 12ms
- Viewport culling: only render objects whose bounding box intersects viewport rect
  5K objects in board → typically 50–200 visible at any zoom level

Spatial index for hit-testing:
- R-tree (via rbush library): O(log n) lookup for click-to-select
- Rebuild R-tree on every object move (fast for < 10K objects)
- Without index: O(n) scan on every click — noticeable above 1K objects

Yjs update batching for freehand:
- Problem: mouse-move fires at 100Hz → 100 Yjs updates/second during drawing
- Solution: finalise freehand stroke on pointer-up → 1 Yjs update per stroke
- During drawing: render to a separate "live" canvas layer; merge to main canvas on complete

100 simultaneous editors on one board:
- 100 awareness updates per second during active editing (cursor moves)
- Server relays awareness to all peers: 100 × 100 = 10K awareness messages/second
- Throttle cursor broadcast to 30fps (33ms) per client — acceptable lag for cursors
- Yjs object updates: much less frequent (per object interaction, not per cursor move)`,
    },
    {
      id: 'performance',
      title: 'Performance',
      content: `Pan and zoom — must be instant:
- Camera transform = CSS transform on a container div (GPU composited)
- OR: update WebGL view matrix (GPU-side) — single uniform update
- Never move individual DOM nodes during pan; transform the camera, not the objects
- Zoom: transform-origin at cursor position (CSS) or adjust matrix (WebGL)

Rendering dirty objects only:
- Yjs update event tells you which objectIds changed
- Re-draw only bounding box of changed objects + any objects that overlap
- Full redraw: only on zoom change (rescaling all objects)

Object selection:
- Selection state in Zustand (local); not in Yjs (other users don't see your selection)
- Render selection handles as SVG overlay (easier hit-testing for handles than canvas)
- Multi-select bounding box: computed from union of all selected object bounding boxes

Export performance:
- Client-side PNG export (for small boards): OffscreenCanvas in Web Worker; doesn't block UI
- Large board: send board JSON to server; headless Chrome renders and returns S3 URL
- Progress: poll GET /exports/:id/status every 2s; show spinner with "Generating export"`,
    },
    {
      id: 'interview-tips',
      title: 'Interview Tips',
      content: `1. Freehand sync on pointer-up not during drawing — this is the key insight. Broadcasting 100 points/second per user would flood the WS; send the final stroke once
2. Camera is local state — viewport pan/zoom is per-user and should never go into Yjs. Two users can look at different parts of the same board simultaneously
3. Canvas 2D vs WebGL threshold — "I'd start with Canvas 2D and switch to WebGL above 2K objects when frame budget is breached"
4. Spatial index for hit-testing — R-tree (rbush library) for O(log n) click-select. Without it, 5K objects means O(5K) on every click
5. LWW conflict for positions — unlike Google Docs where character loss is catastrophic, LWW is fine for "who moved this sticky last" conflicts
6. Per-user undo — Yjs tracks operations per client; undo stack is local, not shared. Two users undoing simultaneously don't conflict
7. Awareness vs CRDT for cursors — cursor positions are ephemeral; use Yjs Awareness (not the doc) so they don't bloat the persistent update log`,
    },
  ],
};

import { DesignModule } from '@/types';

export const figmaModule: DesignModule = {
  slug: 'figma',
  title: 'Design Figma',
  description: 'A collaborative vector design tool with real-time multi-user editing, infinite canvas, component systems, and version history.',
  difficulty: 'Staff',
  companies: ['Figma', 'Adobe', 'Canva', 'Sketch', 'Microsoft'],
  tags: ['CRDT', 'WebGL', 'Canvas', 'Real-time'],
  estimatedMinutes: 60,
  sections: [
    {
      id: 'functional-requirements',
      title: 'Functional Requirements',
      content: `Core (must have):
- Infinite canvas: pan, zoom, place shapes, text, images
- Vector tools: pen tool, rectangle, ellipse, line, polygon
- Layers panel: tree of all objects; show/hide, lock, rename, reorder
- Components and instances: create master component; instances inherit + override
- Real-time collaboration: multiple users edit simultaneously; see peer cursors
- Frames: artboards that define page boundaries for export
- Prototyping: link frames with transitions for interactive mockups
- Export: PNG / SVG / PDF at any resolution
- Version history: named versions; restore to any point

Nice to have:
- Auto layout (flexbox-like constraints for responsive designs)
- Variables / design tokens
- Dev mode (shows CSS, specs, copy code)
- Plugin API (third-party automation)`,
    },
    {
      id: 'non-functional-requirements',
      title: 'Non-Functional Requirements',
      content: `- Canvas render: 60fps with 10,000+ objects on screen
- Collaboration latency: peer cursors and edits visible within 500ms
- Offline: full editing capability; sync on reconnect
- File size: handle files with 100K+ objects without degradation
- Export: 4K PNG export within 10s
- Availability: 99.99% — designers lose work if editor goes down
- Convergence: after network partition heals, all clients reach identical state
- Undo/redo: unlimited history within a session`,
    },
    {
      id: 'user-flow',
      title: 'User Flow',
      content: `Opening a file:
1. File list → click file → URL changes to /file/:fileId
2. Client fetches file snapshot from API (initial document state)
3. WS connection established to collaboration server for this fileId
4. Render engine initialises canvas (WebGL context setup)
5. Objects rendered from JSON scene graph; viewport centred on content
6. Other collaborators appear as coloured cursors with name labels

Editing — moving an object:
1. User clicks object → selection handles appear
2. User drags → object position updates locally at 60fps (no server round-trip)
3. Yjs generates CRDT update (position property as LWW register)
4. WS sends binary Yjs update to server on pointer-up (not during drag)
5. Server stores update; broadcasts to all other clients in same file
6. Other clients apply update: object snaps to new position

Creating a component:
1. User selects objects → right-click → "Create Component"
2. Master component created with ID; original replaced with instance
3. Instance stores: componentId + property overrides (empty initially)
4. Duplicate component → new instance; inherits all master properties
5. Edit master → all instances update in real-time (resolved at render time)`,
    },
    {
      id: 'high-level-architecture',
      title: 'High Level Architecture',
      content: `Client rendering stack:
Browser → WebGL Renderer (GPU-accelerated) → Scene Graph (JSON tree)
        → Yjs CRDT Doc (source of truth for document state)
        → WS connection to Collaboration Server

Collaboration layer:
Client A ←→ WS Gateway (file-sharded) ←→ Yjs Sync Server
Client B ←→                               ↓
                                     Document Store (Postgres — binary Yjs updates)
                                           ↓
                                     Snapshot Service (materialises JSON every hour)

Export pipeline:
Client → Export API → Headless Chrome / Node canvas renderer → PNG/SVG/PDF
                    → S3 (temporary export storage, 24h TTL)
                    → Pre-signed URL returned to client

Asset storage:
Image uploads → S3 → CDN (served with long TTL, content-addressed URLs)
Fonts → CDN (static; loaded once per font family)

Shard by fileId — all clients on the same file route to the same WS server.
Prevents cross-shard merge complexity entirely.`,
    },
    {
      id: 'component-design',
      title: 'Component Design',
      content: `<FigmaEditor>
  <Toolbar />                      ← tool picker: move, frame, shape, pen, text
  <CanvasArea>
    <WebGLCanvas ref={glRef} />    ← single <canvas> element; all rendering via WebGL
    <SelectionOverlay />           ← SVG overlay for handles (not in WebGL)
    <PeerCursors />                ← positioned absolutely per collaborator
    <RulerH /><RulerV />
  </CanvasArea>
  <LeftPanel>
    <LayersTree />                 ← virtual tree for 100K+ nodes
    <PagesPanel />
  </LeftPanel>
  <RightPanel>
    <DesignTab>
      <PositionInputs />           ← X, Y, W, H — controlled; updates Yjs on blur
      <FillEditor />
      <EffectsEditor />
      <AutoLayoutEditor />
    </DesignTab>
    <PrototypeTab>
      <InteractionEditor />
    </PrototypeTab>
  </RightPanel>
  <VersionHistoryPanel />          ← drawer; shows named versions
  <CollaboratorAvatars />          ← header; click to pan to their cursor`,
    },
    {
      id: 'state-management',
      title: 'State Management',
      content: `Two completely separate layers — never mix:

Document state = Yjs Doc (the source of truth):
\`\`\`ts
const ydoc = new Y.Doc();
const yNodes = ydoc.getMap<YNode>('nodes');      // nodeId → node properties
const ySelection = ydoc.getMap('selection');     // shared selection (optional)

// Each property is a separate CRDT register — enables per-property conflict resolution
// Moving a node: update yNodes.get(id).set('x', newX) — not replace whole node
\`\`\`

Render state = Zustand (derived, ephemeral):
\`\`\`ts
interface CanvasStore {
  viewport: { x: number; y: number; zoom: number };
  selectedNodeIds: string[];
  hoveredNodeId: string | null;
  tool: 'move' | 'frame' | 'rectangle' | 'pen' | 'text';
  isDragging: boolean;
}
// Viewport changes never go to Yjs — they're local to each client
\`\`\`

Key insight: viewport, selection, hovered node are NOT synced via CRDT.
They're local render state. Only document content (positions, fills, text) goes through Yjs.`,
    },
    {
      id: 'data-model',
      title: 'Data Model',
      content: `\`\`\`ts
interface FigmaFile {
  id: string;
  name: string;
  ownerId: string;
  teamId?: string;
  thumbnail: string;         // S3 URL of last-rendered thumbnail
  createdAt: Date;
  updatedAt: Date;
  schemaVersion: number;
}

// Scene graph node — stored in Yjs as a Map
interface Node {
  id: string;
  type: 'frame' | 'group' | 'rectangle' | 'ellipse' | 'text' | 'component' | 'instance' | 'vector';
  parentId: string | null;
  childIds: string[];         // ordered
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;           // degrees
  opacity: number;            // 0–1
  visible: boolean;
  locked: boolean;
  fills: Fill[];
  strokes: Stroke[];
  effects: Effect[];
  // Text nodes only:
  characters?: string;
  fontSize?: number;
  // Component instance only:
  componentId?: string;
  overrides?: Record<string, Partial<Node>>;  // property overrides vs master
}

interface Version {
  id: string;
  fileId: string;
  label: string;              // user-named
  description?: string;
  createdById: string;
  yDocSnapshot: Uint8Array;   // binary Yjs snapshot at this point
  createdAt: Date;
}
\`\`\``,
    },
    {
      id: 'scaling',
      title: 'Scaling',
      content: `Rendering performance at scale (10K+ objects):
- Spatial indexing: R-tree (or quadtree) for hit-testing on click/hover
  Without index: O(n) scan; with R-tree: O(log n)
- Viewport culling: only render nodes whose bounding box intersects viewport
  10K objects in file → typically 50–200 visible in viewport
- LOD (Level of Detail): at zoom < 50%, render simplified versions (no text, simplified fills)

WebGL rendering decisions:
- Text: rendered to texture via Canvas 2D, then drawn as textured quad in WebGL
  (WebGL has no native text API)
- SVG paths: tessellated to triangles (Lyon library) → drawn as WebGL geometry
- Images: uploaded as GPU textures; mipmapped for zoom-out quality

CRDT update batching:
- During drag: update local state only (60fps, no Yjs writes)
- On pointer-up: write final position to Yjs once
- Prevents: 60 × drag-duration Yjs updates flooding the WS

Export at scale:
- Large file export runs server-side (headless browser)
- Client never renders 4K — too slow and memory-limited
- Server spins up isolated Chrome instance per export; enforces 30s timeout`,
    },
    {
      id: 'performance',
      title: 'Performance',
      content: `Pan/zoom — must never stall:
- Camera transform = CSS transform on a world container — GPU composited
- Never move individual DOM nodes during pan; move the viewport matrix only
- WebGL: update uniform mat4 (model-view-projection matrix); GPU handles transform

Layers panel with 100K nodes:
- Virtual tree: only render visible rows + 10 overscan
- react-virtual (TanStack Virtual) for tree virtualisation
- Flatten tree to visible rows list; track expand/collapse state

Property panel updates:
- User types in X position field → update local state immediately
- On blur / Enter → write to Yjs → triggers CRDT sync
- Never write to Yjs on every keystroke — too many operations for undo stack

Memory management:
- GPU textures: LRU cache with max size (evict least-recently-used images)
- Yjs update log: compact into snapshots hourly; prune old updates
- Large files (100K+ nodes): use incremental Yjs sync — only send delta since last sync`,
    },
    {
      id: 'interview-tips',
      title: 'Interview Tips',
      content: `1. WebGL is the only correct rendering choice for 10K+ objects — explain WHY: Canvas 2D works for < 1K; DOM cannot handle it at all
2. CRDT per-property — not per-node. Moving a shape: update x and y as separate LWW registers. This prevents two users moving the same node from conflicting catastrophically
3. Spatial indexing for hit-testing — most candidates forget this. "Click to select" is O(n) without an R-tree or quadtree
4. Batch CRDT writes on pointer-up not during drag — show you understand the performance vs. collaboration freshness tradeoff
5. Separate viewport from document state — viewport is local render state; never CRDT-sync zoom level or scroll position
6. Server-side export — clients cannot render a 4K export of a 100K-node file; explain headless Chrome approach
7. Component system: instances store overrides only, not full copies. Interviewers test whether you understand the inheritance model`,
    },
  ],
};

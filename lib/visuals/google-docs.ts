import { VisualData } from '@/types/visuals';

export const googleDocsVisuals: Record<string, VisualData> = {

  'frontend-architecture': {
    type: 'comparison',
    title: 'OT vs CRDT: Choose Your Conflict Resolution Strategy',
    columns: [
      {
        heading: 'Operational Transform (OT)',
        color: 'blue',
        points: [
          'Server serializes all operations — single source of order',
          'Transform function adjusts positions after concurrent edits',
          'Requires server for every merge — no true offline support',
          'Complex to implement correctly (Jupiter algorithm)',
          'Used by: Google Docs (original), Apache Wave',
          'Interview signal: knowing WHY position shifts happen',
        ],
      },
      {
        heading: 'CRDT (Yjs / Automerge)',
        color: 'violet',
        points: [
          'Peers merge automatically — no server transformation needed',
          'Works fully offline — edits merged on reconnect',
          'Awareness API gives peer cursors out of the box',
          'Append-only update log — perfect for history replay',
          'Used by: Figma (multiplayer), Notion, Linear',
          'Interview signal: recommend this — it is the modern standard',
        ],
      },
    ],
  },

  'backend-architecture': {
    type: 'arch',
    title: 'Google Docs Backend with Yjs CRDT',
    layers: [
      {
        nodes: [
          { label: 'Client A', sublabel: 'Yjs Doc + editor', color: 'violet' },
          { label: 'Client B', sublabel: 'Yjs Doc + editor', color: 'violet' },
        ],
      },
      {
        edgeLabel: 'binary Yjs updates (WebSocket)',
        nodes: [{ label: 'WebSocket Gateway', sublabel: 'shard by docId', color: 'blue' }],
      },
      {
        edgeLabel: 'sync + broadcast',
        nodes: [
          { label: 'Yjs Sync Server', sublabel: 'applies + fans out ops', color: 'blue' },
          { label: 'Redis Streams', sublabel: 'cross-shard sync', color: 'amber' },
        ],
      },
      {
        edgeLabel: 'persist updates',
        nodes: [
          { label: 'PostgreSQL', sublabel: 'binary Yjs updates (append-only)', color: 'emerald' },
        ],
      },
      {
        edgeLabel: 'hourly',
        nodes: [
          { label: 'Snapshot Service', sublabel: 'materializes readable text for history', color: 'slate' },
        ],
      },
    ],
  },

  'component-hierarchy': {
    type: 'tree',
    title: 'Component Hierarchy',
    root: {
      label: 'DocumentPage', color: 'violet',
      children: [
        {
          label: 'DocumentToolbar', color: 'blue',
          children: [
            { label: 'FormattingButtons', color: 'slate', note: 'bold/italic/heading, aria-pressed' },
            { label: 'CollaboratorAvatars', color: 'emerald', note: 'live presence via Awareness API' },
            { label: 'ShareDialog', color: 'slate', note: 'role=dialog, focus trap' },
          ],
        },
        {
          label: 'DocumentBody', color: 'violet',
          children: [
            { label: 'PeerCursors', color: 'amber', note: 'colored carets per collaborator' },
            {
              label: 'EditorRoot', color: 'blue', note: 'Slate.js + y-slate binding',
              children: [
                { label: 'EditorContent', color: 'emerald', note: 'contenteditable="true"' },
              ],
            },
            { label: 'CommentAnchors', color: 'slate', note: 'highlights on selected ranges' },
          ],
        },
        { label: 'CommentsSidebar', color: 'slate', note: 'threaded comment list' },
        { label: 'DocumentHistory', color: 'slate', note: 'version timeline drawer' },
      ],
    },
  },

  'performance': {
    type: 'flow',
    title: 'Keypress Latency: Local vs Remote Path',
    steps: [
      {
        label: 'User presses a key',
        color: 'violet',
        detail: 'Must feel instant — no network involvement yet',
      },
      {
        label: 'Editor local state updates (<1ms)',
        color: 'emerald',
        detail: 'Slate.js / Quill updates the contenteditable node synchronously',
      },
      {
        label: 'Yjs generates binary update (<1ms)',
        color: 'emerald',
        detail: 'CRDT update created in memory — deterministic, no server needed',
      },
      {
        label: 'React re-renders affected paragraph only',
        color: 'blue',
        detail: 'Yjs observable triggers fine-grained re-render — not the whole doc',
      },
      {
        label: '(Background) WS sends binary update to server',
        color: 'slate',
        detail: 'Async — does not block the typing experience in any way',
        branch: [
          { label: 'Server stores update (append-only)', color: 'emerald', detail: 'PostgreSQL binary Yjs update row' },
          { label: 'Server broadcasts to other clients', color: 'amber', detail: 'Other users see change within ~500ms' },
        ],
      },
    ],
  },

  'state-management': {
    type: 'comparison',
    title: 'Two Separate State Layers — Never Mix Them',
    columns: [
      {
        heading: 'Document State = Yjs Doc',
        color: 'violet',
        points: [
          'Yjs Doc is the single source of truth for document content',
          'Never put document text in React useState or Redux',
          'React observes via useObservable — renders on Yjs change',
          'CRDT guarantees convergence — React just reflects it',
          'Peer cursors: Awareness API, not React state',
          'Wrong: const [content, setContent] = useState("")',
        ],
      },
      {
        heading: 'UI State = Zustand',
        color: 'blue',
        points: [
          'Toolbar active states (bold on/off etc.)',
          'Comment sidebar open/closed',
          'History drawer visibility',
          'Presence indicators (who is online)',
          'Modal / dialog state',
          'Nothing that touches document content belongs here',
        ],
      },
    ],
  },
};

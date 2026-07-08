import { DesignModule } from '@/types';

export const googleDocsModule: DesignModule = {
  slug: 'google-docs',
  title: 'Design Google Docs',
  description: 'A collaborative rich-text editor with real-time multi-user editing, conflict-free merging, and offline support.',
  difficulty: 'Staff',
  companies: ['Google', 'Notion', 'Atlassian', 'Dropbox', 'Microsoft'],
  tags: ['CRDT', 'OT', 'Real-time', 'Rich Text', 'Offline'],
  estimatedMinutes: 60,
  sections: [
    {
      id: 'problem',
      title: 'Problem Statement',
      content: `Design a collaborative document editor where multiple users can simultaneously edit the same document and see each other's changes in real-time — similar to Google Docs.

Core challenges: how do you merge concurrent edits from N users without losing data or corrupting formatting? How do you display peer cursors? How do you handle offline edits that reconnect to a live document?`,
    },
    {
      id: 'functional-requirements',
      title: 'Functional Requirements',
      content: `**Must have:**
- Rich text editing: bold, italic, underline, headings, lists, links, code blocks
- Real-time collaboration: all users see each other's changes within 500ms
- Peer cursors: see where collaborators are typing with their name/color
- Document history: revision log; restore any past version
- Offline editing: make changes without network; merge on reconnect
- Comments: highlight a range, add a comment thread
- Sharing: view-only, comment-only, edit access levels

**Nice to have:**
- AI writing suggestions
- Voice typing
- @mention in comments
- Document outline (heading navigation)
- Export to PDF/DOCX`,
    },
    {
      id: 'non-functional-requirements',
      title: 'Non-Functional Requirements',
      content: `- **Latency:** Local keystrokes must feel instant (<16ms) — never block on network
- **Convergence:** All clients must reach identical document state after all ops applied
- **Consistency:** No data loss — every character typed must survive (even on conflict)
- **Scale:** Support 100 simultaneous editors on one document; 1B documents total
- **Offline:** Full editing while offline; automatic merge on reconnect
- **Availability:** 99.99% uptime; document never enters unrecoverable corrupt state`,
    },
    {
      id: 'scale-constraints',
      title: 'Scale Constraints',
      content: `- 1B documents; 3B users
- Up to 100 simultaneous editors per document
- Document size: up to 1M characters
- Operation throughput: 10K ops/second per document during heavy collaboration
- History retention: 30 days full history, indefinite snapshot at 30 days
- p99 op delivery to other clients: < 500ms
- Offline tolerance: up to 7 days of offline edits mergeable`,
    },
    {
      id: 'apis',
      title: 'Expected APIs',
      content: `\`\`\`
REST
GET    /documents/:id              → current snapshot + version vector
POST   /documents                  → create document
GET    /documents/:id/history      → revision list
POST   /documents/:id/restore      → restore to version N
POST   /documents/:id/comments     → create comment thread
PATCH  /comments/:id               → resolve / add reply

WebSocket (primary real-time channel)
WS /documents/:id/session
  Client → Server:
    { type: 'op', op: Operation, clientSeq: N }     ← Yjs update or OT op
    { type: 'cursor', range: { anchor, head } }
    { type: 'presence', status: 'idle' | 'active' }

  Server → Client:
    { type: 'op', op: Operation, serverSeq: N }     ← transformed + acked
    { type: 'cursor', userId, range }
    { type: 'presence', userId, status }
    { type: 'snapshot', doc, serverSeq }             ← sent on first connect
\`\`\``,
    },
    {
      id: 'frontend-architecture',
      title: 'Frontend Architecture',
      content: `**The hardest part of this design is the conflict resolution algorithm. You must choose between OT and CRDT.**

**Option A — Operational Transformation (OT) — Google's original approach:**
\`\`\`
User A types "X" at position 5 (op: insert(5, "X"))
User B deletes char at position 3 (op: delete(3))  ← concurrent

Server transforms A's op against B's op:
  insert(5, "X") transformed with delete(3) → insert(4, "X")
  (position shifted because B deleted before A's insertion point)
\`\`\`
- Server is required to serialize and transform ops
- Complex to implement correctly (Jupiter algorithm)
- Production: Google Docs, Apache Wave

**Option B — CRDT (Yjs / Automerge) — modern approach:**
\`\`\`ts
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { QuillBinding } from 'y-quill'

const ydoc = new Y.Doc()
const provider = new WebsocketProvider('wss://...', docId, ydoc)
const ytext = ydoc.getText('content')
const binding = new QuillBinding(ytext, quillEditor, provider.awareness)
\`\`\`
- No server transformation needed — CRDTs merge automatically
- Works fully offline — merge happens at reconnect
- Awareness API handles cursor positions out of the box
- Production: Figma (multiplayer), Notion (blocks), Linear

**Recommendation for interviews: propose CRDT (Yjs) — it's simpler to explain, handles offline correctly, and is the modern standard.**

**Editor engine:** Slate.js or Quill with CRDT binding (y-slate or y-quill)`,
    },
    {
      id: 'backend-architecture',
      title: 'Backend Architecture',
      content: `**With Yjs (CRDT) backend:**
\`\`\`
Client (Yjs doc) ←→ WS Gateway ←→ Yjs Sync Server
                                       ↓
                                 Document Store (PostgreSQL)
                                 stores binary Yjs updates
                                       ↓
                                 Snapshot Service
                                 materializes readable text hourly
\`\`\`

**Persistence:** Store binary Yjs updates (not the document text). Text is derived. This means:
- Every update is append-only (easy to replay for history)
- Snapshot = apply all updates up to time T (or apply periodic snapshots)
- Compact old updates into snapshots every hour to limit replay cost

**Scaling WS connections:** Each document lives on one WS server shard (consistent hashing by docId). Shard-to-shard sync via Redis Streams. If a server crashes, clients reconnect to new shard and receive snapshot.

**Permissions service:** Edge-cached; checked on WS handshake and on every op (server-side validation of write access).`,
    },
    {
      id: 'component-hierarchy',
      title: 'Component Hierarchy',
      content: `\`\`\`
<DocumentPage>
  <DocumentToolbar>           ← formatting controls, share button
    <FormattingButtons />     ← bold/italic/heading etc.
    <CollaboratorAvatars />   ← live -N indicator
    <ShareDialog />
  </DocumentToolbar>
  <DocumentBody>
    <PeerCursors />           ← renders colored carets for each collaborator
    <EditorRoot>              ← Slate or Quill editor root
      <EditorContent />       ← actual contenteditable
    </EditorRoot>
    <CommentAnchors />        ← highlights on selected ranges with comment threads
  </DocumentBody>
  <CommentsSidebar>           ← threaded comment list, resolves
  <DocumentHistory />         ← version timeline drawer
\`\`\``,
    },
    {
      id: 'state-management',
      title: 'State Management',
      content: `**Two completely separate state layers:**

1. **Document state = Yjs Doc** — never put document content in React state or Redux. Yjs is the source of truth; React observes it via \`useObservable\`.

2. **UI state = Zustand** — toolbar active states, comment sidebar open, history drawer, presence indicators.

\`\`\`ts
// Correct: observe Yjs for content
const text = useYText(ydoc.getText('content'));

// Wrong: don't mirror document in useState
const [content, setContent] = useState(''); // defeats CRDT guarantees
\`\`\`

**Peer cursors:**
- Yjs Awareness API broadcasts cursor position as JSON to all peers
- Map awareness states → colored \`<PeerCursor>\` absolute-positioned overlays
- Throttle cursor broadcast to 50ms to avoid flooding`,
    },
    {
      id: 'performance',
      title: 'Performance & Virtualization',
      content: `**Keypress latency (the critical path):**
\`\`\`
User presses key
  → Editor local state update (sync, <1ms)
  → Yjs generates update (sync, <1ms)
  → React re-renders affected paragraph only (React's reconciler)
  → (background) WS sends binary Yjs update to server
  → Server stores + broadcasts to other clients
\`\`\`
Network never blocks the user. The 500ms real-time target is for *other users*, not the typer.

**Document virtualization:**
- For very large documents, virtualize paragraphs out of viewport
- Tricky with contenteditable — use a custom approach: render skeleton divs off-screen with measured heights
- Slate.js handles this better than raw contenteditable

**Bundle:**
- Yjs + y-websocket: ~30KB gzip — worth it
- Editor (Quill or Slate): ~50KB — lazy load
- Editor page: its own chunk; don't share with homepage bundle`,
    },
    {
      id: 'accessibility',
      title: 'Accessibility',
      content: `- Editor uses \`contenteditable="true"\` — screen readers can navigate and read content
- Custom toolbar buttons: \`aria-label\`, \`aria-pressed\` for toggles (bold/italic)
- Comments: \`aria-label="Comment: [first line]. Press Enter to open thread."\`
- Peer cursors: announced via \`aria-live="polite"\` when user joins — "Alice joined the document"
- Keyboard shortcuts must not conflict with AT (avoid reassigning Ctrl+A, Tab)
- Color used for peer identification must include name label (not color alone)`,
    },
    {
      id: 'tradeoffs',
      title: 'Tradeoffs',
      content: `| Decision | Chosen | Alternative | Why |
|---|---|---|---|
| Conflict resolution | CRDT (Yjs) | OT | CRDTs work fully offline; OT requires server serialization |
| Persistence format | Binary Yjs updates | Document text | Updates are append-only; text derived; enables history replay |
| Editor engine | Slate.js + y-slate | ProseMirror | Slate has better React integration; PM has larger ecosystem |
| Cursor sync | Awareness API | Custom WS events | Awareness is built into Yjs; ephemeral, no persistence needed |
| History | Yjs updates replay | Snapshot per version | Update log is the ground truth; snapshots are an optimization |
| Scaling | Shard by docId | Single server | Multiple editors → one shard → no cross-shard transform |`,
    },
    {
      id: 'interview-tips',
      title: 'Interview Tips',
      content: `1. **Address the core conflict problem first** — don't design the editor UI before explaining OT vs CRDT
2. **Pick a side and defend it** — "I'd use Yjs/CRDT because..." is stronger than "it depends"
3. **Separate local latency from sync latency** — local keystroke is instant; 500ms is for remote peers
4. **Mention awareness API for cursors** — shows you know the ecosystem beyond the obvious
5. **Persistence model is a Staff signal** — storing binary Yjs updates, not text, shows deep understanding
6. **Discuss what happens on reconnect** — merge offline edits, send divergence to server, receive snapshot
7. **Don't design the toolbar first** — interviewers want conflict resolution, not formatting buttons`,
    },
    {
      id: 'common-mistakes',
      title: 'Common Mistakes',
      content: `Proposing WebSocket without addressing conflict resolution — the interviewer will probe immediately
Using \`last write wins\` for document edits — you will lose characters; never acceptable for text
Putting document content in React useState — defeats CRDT guarantees; breaks offline
Designing OT without explaining the transformation function — handwaving the hard part
Forgetting offline entirely — Google Docs offline mode is a real product requirement
Treating real-time latency as the keypress latency — local edits must be instant regardless of network
Not knowing what Yjs or OT is by name — Staff-level engineers are expected to know the options`,
    },
  ],
};

import { DesignModule } from '@/types';

export const trelloModule: DesignModule = {
  slug: 'trello',
  title: 'Design Trello',
  description: 'A Kanban board app with real-time drag-and-drop, offline support, and collaborative card management.',
  difficulty: 'Senior',
  companies: ['Atlassian', 'Notion', 'Asana', 'Linear'],
  tags: ['DnD', 'Real-time', 'Optimistic UI', 'Offline'],
  estimatedMinutes: 45,
  sections: [
    {
      id: 'problem',
      title: 'Problem Statement',
      content: `Design a Kanban board application similar to Trello. Users can create boards, add lists, and manage cards with drag-and-drop reordering — all with real-time collaboration across multiple users.

Key interactions:
- Create/rename/delete boards, lists, and cards
- Drag cards between lists and reorder within a list
- Real-time updates when collaborators make changes
- Offline support with conflict resolution on reconnect
- Rich card metadata: labels, due dates, attachments, checklists, comments`,
    },
    {
      id: 'functional-requirements',
      title: 'Functional Requirements',
      content: `**Must have:**
- Board CRUD: create, rename, archive, delete
- List CRUD with horizontal ordering
- Card CRUD with rich metadata (title, description, labels, due date, assignees, attachments, checklists, comments)
- Drag-and-drop: reorder cards within a list, move cards across lists, reorder lists horizontally
- Real-time collaboration: changes by any user appear within 500ms for others on the same board
- Offline support: read cached boards; queue writes and sync on reconnect
- Search: find cards across all boards by keyword

**Nice to have:**
- Board templates
- Card activity timeline
- @mentions in comments
- Keyboard shortcuts (j/k navigation, quick add)
- Bulk card actions`,
    },
    {
      id: 'non-functional-requirements',
      title: 'Non-Functional Requirements',
      content: `- **Performance:** Drag animation at 60fps with ≤16ms frame budget; optimistic updates applied in <50ms
- **Availability:** 99.9% uptime; graceful offline degradation
- **Scalability:** Support boards with 50 lists × 500 cards without scroll jank
- **Accessibility:** Full keyboard navigation for all DnD operations; ARIA live regions for real-time updates
- **Security:** Board-level permissions; attachment virus scanning; rate-limited writes
- **Bundle:** <200KB initial JS; code-split per route`,
    },
    {
      id: 'scale-constraints',
      title: 'Scale Constraints',
      content: `- 50M registered users, 500K DAU
- 200K concurrent WebSocket connections
- Peak: 10K card moves/second
- Board size: max 100 lists, 10K cards
- Attachment: max 10MB per file, 250MB per board
- API: p99 < 200ms for card reads; p99 < 500ms for writes
- Real-time delivery: < 500ms from write → other clients receive update`,
    },
    {
      id: 'apis',
      title: 'Expected APIs',
      content: `\`\`\`
REST
GET    /boards/:id                     → full board snapshot (lists + cards)
PATCH  /boards/:id                     → rename, archive
GET    /boards/:id/cards/search?q=     → card search
POST   /lists                          → create list
PATCH  /lists/:id                      → rename, reorder (position field)
DELETE /lists/:id
POST   /cards                          → create card
PATCH  /cards/:id                      → update any field
DELETE /cards/:id
POST   /cards/:id/move                 → { targetListId, position }
POST   /cards/:id/attachments          → multipart upload
POST   /cards/:id/comments
WebSocket (or SSE)
WS /boards/:id/stream                  → board-scoped event stream
  Events: card.created | card.moved | card.updated | list.reordered | user.cursor
\`\`\``,
    },
    {
      id: 'frontend-architecture',
      title: 'Frontend Architecture',
      content: `**Framework:** Next.js (App Router) — board page as a Client Component, metadata SSR.

**State management — normalized store (Zustand or Redux Toolkit):**
\`\`\`ts
// Normalized shape prevents O(n) scans on moves
interface BoardStore {
  board: Board;
  lists: Record<string, List>;   // listId → List
  cards: Record<string, Card>;   // cardId → Card
  orderedListIds: string[];
  cardsByList: Record<string, string[]>; // listId → cardId[]
}
\`\`\`

**Drag and Drop — dnd-kit (not react-dnd):**
- \`DndContext\` at board root; \`SortableContext\` per list
- \`useSortable\` on each card; \`useDroppable\` on lists
- Optimistic: update store immediately on \`onDragEnd\`, send PATCH, rollback on error
- Clone strategy for drag overlay — keeps original card in DOM (no layout jump)

**Real-time — WebSocket singleton:**
\`\`\`ts
// Applied as patch to normalized store; ignored if local optimistic already applied
socket.on('card.moved', ({ cardId, fromList, toList, position }) => {
  // dedupe: skip if we sent this event (match by eventId)
  applyServerMove(cardId, fromList, toList, position);
});
\`\`\`

**Offline — service worker + IndexedDB:**
- Cache board snapshot in IndexedDB on first load
- Queue mutations in IDB when navigator.onLine === false
- Flush queue on 'online' event; use server timestamps to resolve conflicts`,
    },
    {
      id: 'backend-architecture',
      title: 'Backend Architecture',
      content: `**API layer:** Node.js / Go microservice behind API gateway
**Database:** PostgreSQL for boards/lists/cards; positions stored as floating point (LexoRank avoids renumbering)
**Real-time:** Redis Pub/Sub → WebSocket gateway (fanout to all board subscribers)
**Attachments:** S3-compatible object store; pre-signed upload URLs; Lambda for virus scan + thumbnail
**Cache:** Redis for board snapshots (invalidated on write); CDN edge cache for static assets
**Search:** Elasticsearch / Typesense for full-text card search

\`\`\`
Client → API Gateway → Card Service → PostgreSQL
                   ↓
              Redis Pub/Sub → WS Gateway → all board clients
\`\`\`

**LexoRank for ordering:**
When a card moves between positions A and B, new rank = midpoint string.
Only rebalance (renumber all) when ranks collapse (rare). This means a single PATCH instead of bulk reorder.`,
    },
    {
      id: 'component-hierarchy',
      title: 'Component Hierarchy',
      content: `\`\`\`
<BoardPage>                    ← fetches board, owns Zustand store
  <BoardHeader />              ← title, members, filters
  <DndContext>                 ← dnd-kit root
    <HorizontalListScroller>   ← overflow-x scroll, virtualized if >20 lists
      <List key={listId}>
        <ListHeader />
        <SortableContext items={cardIds}>
          <VirtualCardList>    ← react-window if >50 cards
            <CardItem />       ← useSortable, click → CardModal
          </VirtualCardList>
        </SortableContext>
        <AddCardInput />
      </List>
      <AddListButton />
    </HorizontalListScroller>
    <DragOverlay>              ← renders dragging card clone
      <CardItem clone />
    </DragOverlay>
  </DndContext>
  <CardModal />                ← portal, renders on card click
\`\`\``,
    },
    {
      id: 'folder-structure',
      title: 'Folder Structure',
      content: `\`\`\`
app/
  boards/[id]/
    page.tsx           ← Board route (SSR metadata + CSR board)
    loading.tsx        ← Skeleton board
components/
  board/
    BoardHeader.tsx
    HorizontalListScroller.tsx
    List.tsx
    CardItem.tsx
    CardModal/
      CardModal.tsx
      CardChecklist.tsx
      CardAttachments.tsx
      CardComments.tsx
    DragOverlay.tsx
    AddListButton.tsx
    AddCardInput.tsx
lib/
  store/boardStore.ts       ← Zustand normalized store
  dnd/lexorank.ts           ← rank calculation helpers
  realtime/boardSocket.ts   ← WS singleton
  offline/syncQueue.ts      ← IDB mutation queue
\`\`\``,
    },
    {
      id: 'state-management',
      title: 'State Management',
      content: `**Normalized Zustand store** — never store cards inside list arrays; use IDs only:
\`\`\`ts
const useBoardStore = create<BoardStore>((set, get) => ({
  // Optimistic move — called before API
  moveCard: (cardId, fromListId, toListId, toIndex) => {
    const snapshot = get(); // save for rollback
    set(produce(state => {
      state.cardsByList[fromListId] = state.cardsByList[fromListId]
        .filter(id => id !== cardId);
      state.cardsByList[toListId].splice(toIndex, 0, cardId);
    }));
    api.moveCard(cardId, { targetListId: toListId, position: toIndex })
      .catch(() => set(snapshot)); // rollback on error
  }
}));
\`\`\`

**Why normalized?** Avoid O(n) list scans when a card update arrives via WebSocket. Patch \`cards[id]\` directly — O(1).`,
    },
    {
      id: 'performance',
      title: 'Performance & Virtualization',
      content: `**DnD performance:**
- Use CSS \`transform\` (GPU layer) never \`top/left\` for drag overlay
- \`will-change: transform\` on dragging element only — remove after drop
- \`pointer-events: none\` on non-dragging cards during drag

**Virtualization:**
- Lists: if board has >20 lists, horizontal virtual scroll (windowed)
- Cards: if list has >50 cards, \`react-window\` FixedSizeList
- Card modal images: \`loading="lazy"\` + IntersectionObserver for attachments

**Bundle:**
- Board page code-split; CardModal lazy-loaded on first open
- dnd-kit: ~15KB gzip (vs react-beautiful-dnd ~30KB, react-dnd ~20KB)
- Attachment previews: served via CDN with immutable cache headers

**Rendering:**
- \`React.memo\` on CardItem — only re-renders if cardId's data changes
- \`useDeferredValue\` for search filter on large boards`,
    },
    {
      id: 'accessibility',
      title: 'Accessibility',
      content: `Drag and drop must work without a mouse — this is a common Senior interview gotcha.

**Keyboard DnD (dnd-kit built-in):**
- Space to pick up, Arrow keys to move, Space/Enter to drop, Escape to cancel
- Announce moves: \`aria-live="assertive"\` region reads "Card 'Deploy fix' moved to Done, position 2"

**ARIA:**
- Board: \`role="main"\`; lists: \`role="region"\` with \`aria-label\`
- Cards: \`role="article"\`, \`aria-describedby\` pointing to due date + assignee
- Modal: \`role="dialog"\`, \`aria-modal="true"\`, focus trap, restore focus on close

**Color:** Labels must not rely on color alone — always include text inside label chips

**Motion:** Wrap DnD animations in \`@media (prefers-reduced-motion)\` — provide instant swap fallback`,
    },
    {
      id: 'tradeoffs',
      title: 'Tradeoffs',
      content: `| Decision | Chosen | Alternative | Why |
|---|---|---|---|
| DnD library | dnd-kit | react-beautiful-dnd | RBD unmaintained; dnd-kit has better a11y + perf |
| Ordering | LexoRank (float strings) | Integer positions | Integers need bulk renumber on every move |
| Real-time | WebSocket | SSE | SSE is read-only; WS needed for cursor presence |
| Offline | IndexedDB + sync queue | No offline | PWA expectation; users on poor connections |
| State | Normalized (Zustand) | Component state | Global DnD + real-time updates demand shared state |
| Conflict resolution | Last-write-wins + server timestamp | OT/CRDT | CRDTs complex for MVP; LWW acceptable for Kanban |`,
    },
    {
      id: 'interview-tips',
      title: 'Interview Tips',
      content: `1. **Lead with clarifying questions** — "How many lists per board? Do we need offline? Is this a PWA?"
2. **Name dnd-kit by name** — shows you know the ecosystem and why (a11y, perf, active maintenance)
3. **Bring up LexoRank unprompted** — most candidates say "update all positions" and get challenged
4. **Discuss optimistic UI explicitly** — describe the rollback strategy, not just "update immediately"
5. **Mention WebSocket deduplication** — "If I sent the move, I skip my own broadcast"
6. **Proactively cover offline** — "Here's how I'd handle a card move while offline"
7. **Accessibility for DnD is a Staff-level signal** — keyboard drag, live announcements, focus restoration`,
    },
    {
      id: 'common-mistakes',
      title: 'Common Mistakes',
      content: ` Using array index as React key on sortable cards — breaks animation and state
 Updating positions as integers — causes bulk renumber, N+1 writes
 Storing full card objects inside list arrays — makes O(n) updates, breaks memoization
 Forgetting to handle the "moved while offline" conflict
 Skipping touch device support for DnD (mobile users exist)
 Not debouncing/batching position saves — triggers too many API calls during rapid drag
 Re-rendering all cards when any card changes — missing React.memo or selector optimization
 Building custom DnD from scratch in an interview — signal bad scope judgment`,
    },
  ],
};

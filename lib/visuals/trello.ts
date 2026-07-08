import { VisualData } from '@/types/visuals';

// slug → section-id → visual
export const trelloVisuals: Record<string, VisualData> = {

  'frontend-architecture': {
    type: 'arch',
    title: 'Trello Frontend Architecture',
    layers: [
      { nodes: [{ label: 'Browser', sublabel: 'Next.js App Router', color: 'violet' }] },
      {
        edgeLabel: 'renders',
        nodes: [
          { label: 'BoardPage', sublabel: 'Client Component', color: 'violet' },
        ],
      },
      {
        edgeLabel: 'state from',
        nodes: [
          { label: 'Zustand Store', sublabel: 'Normalized (lists + cards)', color: 'blue' },
          { label: 'WS Singleton', sublabel: 'board event stream', color: 'blue' },
        ],
      },
      {
        edgeLabel: 'API calls',
        nodes: [
          { label: 'REST API', sublabel: 'PATCH /cards/:id/move', color: 'slate' },
          { label: 'WebSocket', sublabel: '/boards/:id/stream', color: 'emerald' },
        ],
      },
      {
        edgeLabel: 'persisted in',
        nodes: [
          { label: 'PostgreSQL', sublabel: 'LexoRank positions', color: 'emerald' },
          { label: 'Redis Pub/Sub', sublabel: 'board event fanout', color: 'amber' },
        ],
      },
    ],
  },

  'backend-architecture': {
    type: 'arch',
    title: 'Trello Backend Architecture',
    layers: [
      {
        nodes: [
          { label: 'Client A', color: 'violet' },
          { label: 'Client B', color: 'violet' },
        ],
      },
      {
        edgeLabel: 'REST + WS',
        nodes: [{ label: 'API Gateway', sublabel: 'auth + rate limit', color: 'slate' }],
      },
      {
        edgeLabel: 'routes to',
        nodes: [
          { label: 'Card Service', sublabel: 'CRUD + move', color: 'blue' },
          { label: 'WS Gateway', sublabel: 'board subscriptions', color: 'blue' },
        ],
      },
      {
        edgeLabel: 'pub/sub + persist',
        nodes: [
          { label: 'Redis Pub/Sub', sublabel: 'event fanout', color: 'amber' },
          { label: 'PostgreSQL', sublabel: 'cards, positions', color: 'emerald' },
        ],
      },
      {
        edgeLabel: 'broadcasts to',
        nodes: [
          { label: 'All Board Clients', sublabel: 'card.moved events', color: 'violet' },
        ],
      },
    ],
  },

  'component-hierarchy': {
    type: 'tree',
    title: 'Component Hierarchy',
    root: {
      label: 'BoardPage', color: 'violet', note: 'owns Zustand store',
      children: [
        { label: 'BoardHeader', color: 'slate', note: 'title, members, filters' },
        {
          label: 'DndContext', color: 'blue', note: 'dnd-kit root',
          children: [
            {
              label: 'HorizontalListScroller', color: 'slate', note: 'overflow-x',
              children: [
                {
                  label: 'List', color: 'emerald', note: 'per listId',
                  children: [
                    { label: 'ListHeader', color: 'slate' },
                    {
                      label: 'SortableContext', color: 'blue',
                      children: [
                        { label: 'CardItem', color: 'emerald', note: 'useSortable' },
                      ],
                    },
                    { label: 'AddCardInput', color: 'slate' },
                  ],
                },
                { label: 'AddListButton', color: 'slate' },
              ],
            },
            { label: 'DragOverlay', color: 'amber', note: 'clone while dragging' },
          ],
        },
        { label: 'CardModal', color: 'violet', note: 'portal, lazy loaded' },
      ],
    },
  },

  'state-management': {
    type: 'flow',
    title: 'Optimistic Card Move Flow',
    steps: [
      {
        label: 'User drops card (onDragEnd fires)',
        color: 'violet',
        detail: 'dnd-kit emits the final drop position',
      },
      {
        label: 'Store snapshot saved for rollback',
        color: 'blue',
        detail: 'const snapshot = get() — captures full state before mutation',
      },
      {
        label: 'Store updated immediately (optimistic)',
        color: 'emerald',
        detail: 'Zustand produce() moves cardId in cardsByList — UI updates in <1ms',
      },
      {
        label: 'PATCH /cards/:id/move sent to server',
        color: 'blue',
        detail: '{ targetListId, position } — async, does not block UI',
        branch: [
          { label: 'Success', color: 'emerald', detail: 'Server confirms — no UI change needed' },
          { label: 'Error', color: 'rose', detail: 'set(snapshot) — card snaps back to original position' },
        ],
      },
      {
        label: 'WebSocket broadcast received by other clients',
        color: 'amber',
        detail: 'card.moved event deduped by eventId — skip if we sent it',
      },
    ],
  },
};

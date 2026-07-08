import { VisualData } from '@/types/visuals';

export const chatAppVisuals: Record<string, VisualData> = {

  'user-flow': {
    type: 'flow',
    title: 'Message Send Flow (Online → Delivered → Read)',
    steps: [
      { label: 'User types and hits Send', color: 'violet', detail: 'Message added to UI optimistically with status "sending" and a client-generated UUID' },
      { label: 'POST /messages (or WS send) fires', color: 'blue', detail: 'Payload: { clientId, conversationId, content }' },
      { label: 'Server persists to Cassandra → returns server ID', color: 'emerald', detail: 'Status flips to "sent" — single tick shown in UI' },
      {
        label: 'Server publishes to Kafka → Fan-out Worker routes to recipient',
        color: 'blue',
        detail: 'Recipient WS session receives the message',
        branch: [
          { label: 'Recipient online (WS connected)', color: 'emerald', detail: 'Delivered event fires → double tick shown to sender' },
          { label: 'Recipient offline', color: 'amber', detail: 'Push Service sends FCM/APNs notification to device' },
        ],
      },
      { label: 'Recipient opens conversation → read receipt fires', color: 'violet', detail: 'Double blue ticks shown to sender' },
    ],
  },

  'high-level-architecture': {
    type: 'arch',
    title: 'Chat App System Architecture',
    layers: [
      { nodes: [{ label: 'Client A', sublabel: 'sender', color: 'violet' }, { label: 'Client B', sublabel: 'recipient', color: 'violet' }] },
      { edgeLabel: 'WS + REST', nodes: [{ label: 'WS Gateway', sublabel: 'sharded by userId', color: 'blue' }] },
      { edgeLabel: 'persist + publish', nodes: [
        { label: 'Message Service', sublabel: 'CRUD + move', color: 'blue' },
        { label: 'Kafka', sublabel: 'durable event log', color: 'amber' },
      ]},
      { edgeLabel: 'fan-out', nodes: [
        { label: 'Fan-out Worker', sublabel: 'routes to WS sessions', color: 'blue' },
        { label: 'Push Service', sublabel: 'FCM / APNs', color: 'emerald' },
      ]},
      { edgeLabel: 'store', nodes: [
        { label: 'Cassandra', sublabel: 'partitioned by conversationId', color: 'emerald' },
        { label: 'Redis', sublabel: 'presence + delivery status', color: 'amber' },
      ]},
    ],
  },

  'component-design': {
    type: 'tree',
    title: 'Component Hierarchy',
    root: {
      label: 'ChatApp', color: 'violet',
      children: [
        { label: 'ConversationSidebar', color: 'blue', note: 'virtualised list, sorted by last message',
          children: [
            { label: 'ConversationItem', color: 'slate', note: 'avatar, name, unread badge' },
            { label: 'SearchBar', color: 'slate', note: 'client-side filter' },
          ],
        },
        { label: 'ChatWindow', color: 'violet', note: 'conversationId prop',
          children: [
            { label: 'ChatHeader', color: 'slate', note: 'name, online status, call buttons' },
            { label: 'MessageList', color: 'blue', note: 'react-window FixedSizeList',
              children: [
                { label: 'MessageBubble', color: 'emerald', note: 'memo\'d; own/other styling; status ticks' },
                { label: 'MediaMessage', color: 'slate', note: 'lazy image/video' },
                { label: 'DateSeparator', color: 'slate', note: 'injected between date boundaries' },
              ],
            },
            { label: 'TypingIndicator', color: 'amber', note: 'shown on WS "typing" event' },
            { label: 'MessageInput', color: 'blue',
              children: [
                { label: 'TextArea', color: 'slate', note: 'auto-grow' },
                { label: 'AttachmentPicker', color: 'slate', note: 'triggers pre-signed upload' },
              ],
            },
          ],
        },
      ],
    },
  },

  'state-management': {
    type: 'comparison',
    title: 'Three State Layers — Never Mix Them',
    columns: [
      {
        heading: 'Server State → React Query',
        color: 'blue',
        points: [
          'Message history: useInfiniteQuery (cursor-paginated)',
          'Conversation list: useQuery with staleTime 30s',
          'Optimistic send: add to cache → await confirm → replace tempId',
          'On error: rollback via onError callback',
          'Cache invalidated on WS new message event',
        ],
      },
      {
        heading: 'Real-time + Offline → Zustand + IndexedDB',
        color: 'violet',
        points: [
          'Zustand: activeConversationId, typingUsers, presenceMap',
          'IndexedDB: full message objects indexed by conversationId + timestamp',
          'Outbox table: unsent messages with retry count',
          'On reconnect: drain outbox in order, merge server IDs back',
          'Cold open: render from IndexedDB instantly (<16ms)',
        ],
      },
    ],
  },
};

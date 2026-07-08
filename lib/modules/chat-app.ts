import { DesignModule } from '@/types';

export const chatAppModule: DesignModule = {
  slug: 'chat-app',
  title: 'Design Chat App',
  description: 'A real-time messaging app with 1:1 and group chats, delivery guarantees, media sharing, and offline support — similar to WhatsApp or Slack DMs.',
  difficulty: 'Senior',
  companies: ['Meta', 'Slack', 'Microsoft', 'Airbnb', 'Discord'],
  tags: ['WebSocket', 'Real-time', 'Offline', 'Push'],
  estimatedMinutes: 45,
  sections: [
    {
      id: 'functional-requirements',
      title: 'Functional Requirements',
      content: `Core (must have):
- 1:1 and group messaging (up to 256 members)
- Message types: text, images, files, voice notes, reactions
- Delivery status: sent (1 tick) → delivered (2 ticks) → read (2 blue ticks)
- Push notifications when app is backgrounded or closed
- Online/last-seen presence indicators
- Message history: searchable, paginated from newest
- Offline support: queue outgoing messages, sync on reconnect

Nice to have:
- Message reactions and replies (threading)
- Disappearing messages (TTL)
- End-to-end encryption
- Voice/video calling (separate signalling layer)
- @mentions with notification targeting`,
    },
    {
      id: 'non-functional-requirements',
      title: 'Non-Functional Requirements',
      content: `- Latency: message delivery < 500ms p99 for online recipients
- Availability: 99.99% — chat cannot go down
- Durability: zero message loss, even on server crash
- Scale: 2B users (WhatsApp scale), 100M concurrent WebSocket connections
- Offline tolerance: queue up to 7 days of unsent messages
- Storage: messages retained indefinitely (user-controlled delete)
- Security: messages encrypted in transit (TLS) and at rest; E2E optional
- Consistency: messages in a conversation must arrive in order`,
    },
    {
      id: 'user-flow',
      title: 'User Flow',
      content: `Happy path — sending a message:
1. App opens → load conversation list from IndexedDB cache (instant)
2. Tap conversation → load message history via GET /messages?cursor= (cached)
3. User types → message added to UI optimistically with status "sending"
4. POST /messages (or WS send) → server persists, returns message ID
5. Status flips to "sent" (single tick) — server confirms storage
6. Recipient's WS gateway receives push → status flips to "delivered" (double tick)
7. Recipient opens conversation → read receipt fires → status flips to "read" (blue ticks)

Offline path:
- User sends while offline → stored in IndexedDB outbox
- On reconnect → drain outbox in order, each message gets server ID
- Received messages while offline → delivered via push, stored in local DB on next open`,
    },
    {
      id: 'high-level-architecture',
      title: 'High Level Architecture',
      content: `Client → WS Gateway (shard by userId) → Message Service → Kafka
                                                               ↓
                                               Fan-out Worker → recipient WS session
                                               Push Service   → FCM / APNs (if offline)

Key components:
- WS Gateway: stateful; holds open connections; routes by userId hash
- Message Service: persists to Cassandra (write-optimised, no single point of failure)
- Kafka: decouples persistence from delivery — retry-safe, replayable
- Fan-out Worker: resolves group membership, fans out to all member WS sessions
- Push Service: checks presence; if recipient WS not connected, sends push
- Media Service: client uploads directly to S3 via pre-signed URL; CDN for delivery
- Presence Service: Redis sorted set — heartbeat every 30s; TTL = 60s marks offline`,
    },
    {
      id: 'component-design',
      title: 'Component Design',
      content: `<ChatApp>
  <ConversationSidebar>            ← virtualized list, sorted by last message
    <ConversationItem />           ← avatar, name, last message, unread badge
    <SearchBar />                  ← filters conversations client-side
  </ConversationSidebar>
  <ChatWindow conversationId>
    <ChatHeader />                 ← name, avatar, online status, call buttons
    <MessageList>                  ← react-window FixedSizeList (or variable)
      <MessageBubble />            ← memo'd; own/other styling; status ticks
      <MediaMessage />             ← lazy image/video with IntersectionObserver
      <DateSeparator />            ← injected between date-crossing messages
    </MessageList>
    <TypingIndicator />            ← shown when remote is typing (WS event)
    <MessageInput>
      <TextArea />                 ← auto-grow, Shift+Enter for newline
      <AttachmentPicker />         ← triggers pre-signed upload flow
      <SendButton />
    </MessageInput>
  </ChatWindow>
  <MediaViewer />                  ← lightbox portal for image/video preview`,
    },
    {
      id: 'state-management',
      title: 'State Management',
      content: `Three layers — never mix them:

1. Server state — React Query (or SWR):
   useInfiniteQuery for message pages (cursor-based, oldest-first display)
   Optimistic mutation for send: add message to cache → await server confirm

2. Real-time state — Zustand:
   activeConversationId, typingUsers: Record<string, boolean>, presenceMap

3. Offline state — IndexedDB (via idb or Dexie):
   - messages table: full message objects, indexed by conversationId + timestamp
   - outbox table: unsent messages with retry count
   - On reconnect: drain outbox, merge server response back into messages table

Optimistic send:
\`\`\`ts
// Add to cache immediately with status: 'sending'
queryClient.setQueryData(['messages', convId], (old) => ({
  ...old, pages: [...old.pages, tempMessage],
}));
// On confirm: replace tempId with real server ID + flip status to 'sent'
// On error: mark as failed, show retry button
\`\`\``,
    },
    {
      id: 'data-model',
      title: 'Data Model',
      content: `\`\`\`ts
interface User {
  id: string;
  name: string;
  avatarUrl: string;
  phone: string;          // primary identifier (WhatsApp model)
  lastSeen: number;       // epoch ms; null if "hide last seen" enabled
  status: 'online' | 'offline';
}

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  participants: string[];  // userIds
  name?: string;           // group name
  avatarUrl?: string;
  lastMessage: MessagePreview;
  unreadCount: number;
  createdAt: number;
}

interface Message {
  id: string;             // server-assigned UUID
  clientId: string;       // client-generated (for optimistic dedup)
  conversationId: string;
  senderId: string;
  type: 'text' | 'image' | 'file' | 'voice' | 'reaction';
  content: string;        // text, or S3 URL for media
  replyTo?: string;       // parent message id
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: number;
  deletedAt?: number;     // soft delete
}
\`\`\`
Storage: Cassandra partitioned by conversationId, clustered by timestamp DESC.
Why Cassandra: write-heavy, append-mostly, time-series access pattern, no joins needed.`,
    },
    {
      id: 'scaling',
      title: 'Scaling',
      content: `WebSocket connection scaling:
- WS Gateway sharded by userId (consistent hashing) — each shard owns N users
- 100M concurrent connections needs ~1000 gateway nodes at 100K conn/node
- Shard lookup: Redis hash ring — O(1) to find which shard owns a userId

Message fan-out for group chats:
- Small groups (< 100): fan out inline in message service
- Large groups (100–256): async fan-out via Kafka consumer group
- Super-large channels (Slack #general): actor model — limit to 10K push/s per channel

Cassandra partitioning:
- Partition key: conversationId (all messages for a chat on same partition)
- Clustering key: timestamp DESC (newest first, matches read pattern)
- Compaction: time-window (TWCS) — old data compacts efficiently

Push delivery at scale:
- FCM/APNs batch up to 1000 device tokens per request
- Deduplicate push within 60s window (Redis SET with TTL)
- Priority: high for DMs; normal for group mentions`,
    },
    {
      id: 'performance',
      title: 'Performance',
      content: `Message list rendering:
- react-window FixedSizeList for uniform message heights
- Variable heights (media): measure via ResizeObserver, cache in Map
- Only render messages in viewport + 10 overscan — 1000 messages = same cost as 10

Images + media:
- Thumbnail generated on upload (Lambda + Sharp) — show before full load
- Aspect ratio set before image loads → zero layout shift
- loading="lazy" on all media; IntersectionObserver preloads next 3

Cold start (opening the app):
- Conversation list: served from IndexedDB immediately (< 16ms)
- Message history: served from IndexedDB page 1, then background-refresh
- Perceived load = instant; actual freshness = ~200ms behind server

Typing indicators — debounce:
- Emit 'typing' WS event max once per 3 seconds while user types
- Stop event fires on send or after 5s of inactivity
- Recipient shows indicator for max 7s then hides (prevents stuck indicator)`,
    },
    {
      id: 'interview-tips',
      title: 'Interview Tips',
      content: `1. Lead with delivery guarantees — "how do you ensure a message is never lost?" is always asked. Answer: Kafka + Cassandra + client ACK chain
2. Explain the three-tick system precisely — sent/delivered/read are three separate server events, not one
3. WS sharding is the scalability crux — describe consistent hashing by userId, not by conversation
4. Separate push (FCM) from WS — interviewers probe "what if the user has no internet?" — push bridges that gap
5. Client-generated ID + server ID — enables optimistic UI without waiting for the round trip
6. Cassandra partition strategy is a Staff signal — partition by conversationId, cluster by timestamp
7. Pre-signed S3 URLs for media — API should never proxy file bytes; client uploads directly`,
    },
  ],
};

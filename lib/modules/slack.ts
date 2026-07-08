import { DesignModule } from '@/types';

export const slackModule: DesignModule = {
  slug: 'slack',
  title: 'Design Slack',
  description: 'A team messaging platform with channels, threads, real-time messaging, search across history, and deep integrations — at millions-of-workspace scale.',
  difficulty: 'Staff',
  companies: ['Slack', 'Microsoft', 'Discord', 'Atlassian', 'Zoom'],
  tags: ['WebSocket', 'Threads', 'Search', 'Multi-tenant'],
  estimatedMinutes: 55,
  sections: [
    {
      id: 'functional-requirements',
      title: 'Functional Requirements',
      content: `Core (must have):
- Workspaces: isolated tenants; users belong to one or more workspaces
- Channels: public, private, DMs, multi-person DMs
- Messaging: text, emoji, code blocks, mentions (@user, @channel, @here)
- Threads: reply to any message; thread is first-class, not nested comment
- Real-time: all channel members see messages within 500ms
- Full-text search: across all messages in workspace history
- Notifications: mentions, DMs, keywords — per-user, per-channel preference
- Emoji reactions: any Unicode emoji; multiple users per reaction
- File sharing: images, PDFs, code snippets with syntax highlight

Nice to have:
- Slash commands and app integrations (webhooks, bots)
- Workflow builder (automation triggers)
- Huddles (lightweight audio/video)
- Message scheduling`,
    },
    {
      id: 'non-functional-requirements',
      title: 'Non-Functional Requirements',
      content: `- Delivery: message reaches all online channel members within 500ms p99
- Scale: 10M+ concurrent connections across thousands of workspaces
- Search: full-text results within 2s for any query across full workspace history
- Multi-tenancy: one workspace's data must never be accessible to another
- Availability: 99.99% — business-critical; outage affects all customers
- Consistency: messages in a channel must be totally ordered
- Storage: message history retained indefinitely (paid plans)
- Presence: online/away/DND status refreshed within 30s`,
    },
    {
      id: 'user-flow',
      title: 'User Flow',
      content: `Opening Slack (cold start):
1. App loads → render workspace sidebar from cache (IndexedDB)
2. WS connection established → workspace shard assigned via gateway
3. Server sends missed events since last_seen_timestamp
4. Channel history loads via GET /messages?channel=&cursor= (React Query)
5. Unread badges computed from server-side unread_pointer per channel

Sending a message:
1. User types → "is typing" event broadcast (throttled: once per 3s)
2. User submits → optimistic UI: message added locally with "sending" status
3. POST /messages → server persists, assigns sequence number, publishes to Kafka
4. Fan-out worker routes to all member WS sessions in that channel
5. Server ACK → client flips status from "sending" to delivered

Thread reply:
1. User hovers message → "Reply in thread" button appears
2. Thread panel opens (right sidebar) — lazy loads thread messages
3. Reply sent → POST /threads/:id/messages; parent message shows reply count
4. Thread participants get notification regardless of channel notification setting

Search:
1. User types in search bar → debounced 300ms → GET /search?q=&workspace=
2. Elasticsearch queries workspace-isolated index
3. Results grouped by: messages / files / channels / people`,
    },
    {
      id: 'high-level-architecture',
      title: 'High Level Architecture',
      content: `Connection layer:
Client → Load Balancer → WS Gateway (sharded by workspace)
         Each shard owns N workspaces (consistent hashing)
         Shard lookup: Redis cluster (workspace_id → shard_host)

Message flow:
WS Gateway → Message Service → Kafka topic (workspace-partitioned)
                                      ↓
                             Fan-out Consumer → recipient WS sessions
                             Push Consumer   → FCM/APNs (if offline)
                             Search Indexer  → Elasticsearch (async)
                             Storage Writer  → Cassandra (durable log)

Search layer:
Client → Search Service → Elasticsearch (per-workspace index)
                        → Results ranked by recency + relevance

Notification layer:
Kafka → Notification Service → evaluates per-user preferences
                             → filters by channel mute / keyword / mention
                             → routes to: in-app badge | push | email

Presence layer:
Client heartbeat every 30s → Presence Service → Redis sorted set
Key: workspace:{id}:presence, Score: last_heartbeat_epoch
Expire members with score < now - 60s → mark offline`,
    },
    {
      id: 'component-design',
      title: 'Component Design',
      content: `<SlackApp>
  <WorkspaceSwitcher />            ← multi-workspace support; keyboard: Cmd+1-9
  <Sidebar>
    <ChannelList>                  ← virtualised; grouped by starred/muted/DMs
      <ChannelItem />              ← unread badge, bold when unread
    </ChannelList>
    <DirectMessageList />
  </Sidebar>
  <MainPane>
    <ChannelHeader />              ← name, topic, members count, search
    <MessageList>                  ← virtualised VariableSizeList (code blocks vary height)
      <MessageItem>
        <UserAvatar />
        <MessageContent>           ← rendered markdown + @mentions highlighted
          <CodeBlock />            ← syntax highlighted, copyable
          <LinkPreview />          ← lazy-loaded Open Graph preview
          <EmojiReactions />       ← optimistic add/remove
        </MessageContent>
        <MessageActions />         ← react, reply, pin, edit, delete (on hover)
      </MessageItem>
    </MessageList>
    <MessageComposer>
      <RichTextEditor />           ← Slate.js; bold/italic/code/lists/mentions
      <FileAttachButton />
      <EmojiPicker />
      <SendButton />
    </MessageComposer>
  </MainPane>
  <ThreadPanel>                    ← slides in from right on thread open
    <ThreadMessageList />
    <ThreadComposer />
  </ThreadPanel>`,
    },
    {
      id: 'state-management',
      title: 'State Management',
      content: `Normalised store — mandatory for Slack's data relationships:
\`\`\`ts
// Zustand normalised shape
interface SlackStore {
  channels:     Record<string, Channel>;
  messages:     Record<string, Message>;          // messageId → Message
  messagesByChannel: Record<string, string[]>;    // channelId → messageId[]
  threads:      Record<string, string[]>;         // parentId → replyId[]
  presence:     Record<string, 'online'|'away'|'offline'>;
  typing:       Record<string, string[]>;         // channelId → userId[]
  unreadCounts: Record<string, number>;
  activeChannel: string | null;
  threadOpen:   string | null;                   // parent messageId
}
\`\`\`

Why normalised matters:
- A message update from WS hits messages[id] → O(1), not O(n) array scan
- Thread reply count increments the parent message without re-fetching channel
- Presence update touches only presence[userId] — no channel re-render

React Query for server sync:
- useInfiniteQuery per channel — fetches backward from newest
- Zustand gets the latest WS events; React Query handles initial load + pagination
- Never duplicate: React Query populates the Zustand cache on fetch`,
    },
    {
      id: 'data-model',
      title: 'Data Model',
      content: `\`\`\`ts
interface Workspace {
  id: string;
  name: string;
  domain: string;           // yourcompany.slack.com
  plan: 'free' | 'pro' | 'business' | 'enterprise';
  createdAt: Date;
}

interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  type: 'public' | 'private' | 'dm' | 'mpim';
  members: string[];        // userIds
  topic?: string;
  createdAt: Date;
  archivedAt?: Date;
}

interface Message {
  id: string;             // ts (Unix timestamp with decimal — Slack's actual format)
  channelId: string;
  workspaceId: string;
  userId: string;
  content: string;        // raw markdown
  blocks?: Block[];       // rich layout (Slack Block Kit)
  threadTs?: string;      // parent message ts (null = top-level)
  replyCount: number;     // denormalised for display
  reactions: Record<string, string[]>;  // emoji → userId[]
  files?: FileAttachment[];
  editedAt?: Date;
  deletedAt?: Date;
}

interface Notification {
  userId: string;
  workspaceId: string;
  type: 'mention' | 'dm' | 'thread_reply' | 'keyword';
  messageId: string;
  channelId: string;
  read: boolean;
  createdAt: Date;
}
\`\`\`
Storage: Cassandra partitioned by (workspaceId, channelId), clustered by message ts.`,
    },
    {
      id: 'scaling',
      title: 'Scaling',
      content: `WS Gateway sharding:
- Shard by workspaceId — all members of a workspace hit the same shard
- Benefit: fan-out stays within one shard; no cross-shard message routing
- Failure: if a shard dies, clients reconnect → new shard pulls from Kafka replay
- Scale: each shard holds ~5K workspaces; grow horizontally as needed

Search scaling:
- One Elasticsearch index per workspace — strict isolation, no cross-tenant bleed
- Index on message write (Kafka → ES indexer, async, < 5s lag)
- Query: ES BM25 ranking + date filter + workspace scoping
- ES sharding within workspace index when workspace grows beyond 10M messages

Notification fan-out:
- Kafka topic per workspace — parallelism without cross-workspace interference
- Notification service reads user preferences from Redis cache (TTL 5m)
- Batch push: FCM supports 1000 tokens per request — batch offline members

Large workspace optimisations:
- #general in a 100K-member company: cap broadcast to 10K pushes/s
- Members who have muted #general: skip WS push entirely (preference in Redis)
- Paginated member list: don't load all 100K members into frontend`,
    },
    {
      id: 'performance',
      title: 'Performance',
      content: `Message list virtualisation:
- Variable height (code blocks, link previews make rows unpredictable)
- Cache measured heights in a Map<messageId, number> ref
- VariableSizeList from react-window; estimatedItemSize: 72px
- On new message: append to bottom; auto-scroll only if user is at bottom

Rich text editor performance:
- Slate.js renders only changed nodes (built-in fine-grained updates)
- Mention autocomplete: debounce 150ms; cancel in-flight with AbortController
- Emoji picker: virtualised grid (1000+ emojis); fuzzy search client-side

Cold start:
- Render sidebar from IndexedDB immediately (< 16ms visible content)
- Active channel messages: IndexedDB page 1 → render; background-refresh from API
- WS connection: establish in parallel with rendering, not sequentially

Typing indicator efficiency:
- Throttle "typing" WS event: send max 1 per 3 seconds while typing
- Client-side timer: if no "typing" event for 7s → hide indicator
- Prevents cascading re-renders in busy channels`,
    },
    {
      id: 'interview-tips',
      title: 'Interview Tips',
      content: `1. Shard by workspaceId not userId — this is the key Slack-specific insight. All workspace members route to the same shard, enabling efficient in-shard fan-out
2. Threads are first-class entities — not nested comments. Parent message stores replyCount; thread has its own message list and notification rules
3. Normalised Zustand store is essential — explain O(1) WS update vs O(n) scan
4. Elasticsearch per-workspace index — show you understand multi-tenant search isolation
5. Notification preference evaluation must be server-side — don't send push and let client decide; that leaks message content to offline devices
6. Presence via Redis sorted set — heartbeat score + TTL expiry is the clean implementation
7. WS shard failure recovery — clients reconnect to new shard; replay from Kafka offset ensures no events missed`,
    },
  ],
};

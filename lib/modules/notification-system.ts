import { DesignModule } from '@/types';

export const notificationSystemModule: DesignModule = {
  slug: 'notification-system',
  title: 'Design Notification System',
  description: 'A multi-channel notification platform delivering in-app, push, email, and SMS with user preferences, grouping, and delivery guarantees.',
  difficulty: 'Senior',
  companies: ['Meta', 'Google', 'Airbnb', 'Uber', 'Salesforce'],
  tags: ['Fan-out', 'Kafka', 'Push', 'Preferences'],
  estimatedMinutes: 45,
  sections: [
    {
      id: 'functional-requirements',
      title: 'Functional Requirements',
      content: `Core (must have):
- Channels: in-app (bell icon), push (FCM/APNs), email, SMS
- Notification types: social (likes, comments, follows), transactional (purchase, OTP), system (security alerts)
- Grouping: "Alice and 4 others liked your photo" instead of 5 separate notifications
- User preferences: per-type per-channel settings (e.g. "email me for orders, never for likes")
- Do-not-disturb: time-of-day and timezone-aware delivery scheduling
- Read/unread state: in-app notification centre with mark-all-read
- Delivery guarantee: transactional notifications (OTP, purchase) must not be lost

Nice to have:
- Notification centre: paginated list with filters
- Action buttons in push: "Accept" / "Decline" without opening app
- Rich push: image in notification banner
- Scheduled notifications: send at a specific future time`,
    },
    {
      id: 'non-functional-requirements',
      title: 'Non-Functional Requirements',
      content: `- Throughput: handle 1M notifications/minute at peak (e.g. celebrity post)
- Latency: transactional (OTP) delivered within 5s; social within 60s
- Reliability: transactional notifications: at-least-once delivery with dedup
- Preference evaluation: user pref lookup < 10ms (cached in Redis)
- Scale: 3B users; each with O(100) preference rules
- Deduplication: same event must not generate duplicate notifications within TTL window
- Multi-tenant: Airbnb uses same system for guest, host, and partner notifications`,
    },
    {
      id: 'user-flow',
      title: 'User Flow',
      content: `Event → Notification delivery:
1. Event occurs (Alice likes Bob's photo) → publisher sends event to Kafka topic
2. Notification Service consumes event → looks up Bob's preferences (Redis cache)
3. Preference check: Bob has "likes" → in-app only; skip push, skip email
4. Grouping check: Bob already has a "likes" notification in last 60s → aggregate
   "Alice and 2 others liked your photo" → update existing notification
5. Dispatch to in-app adapter: write to notifications table; emit WS event to Bob's client
6. Bob's client receives WS event → unread badge increments; notification appears in centre

OTP / transactional flow:
1. User triggers "send OTP" → high-priority Kafka topic (separate from social)
2. Notification Service skips grouping (transactional = never group)
3. Evaluates channel: SMS adapter → Twilio API call
4. Twilio confirms send → mark notification as "sent"
5. Retry: if Twilio fails → retry 3× with exponential backoff → dead-letter queue
6. Dedup: Redis SET with key = (userId + eventType + window) prevents double OTP`,
    },
    {
      id: 'high-level-architecture',
      title: 'High Level Architecture',
      content: `Event sources:
Like Service, Order Service, Auth Service → Kafka (partitioned by userId)

Notification Service (core):
Kafka Consumer → Preference Loader (Redis cache, 5min TTL)
              → Grouping Engine (sliding window aggregation)
              → Priority Router (transactional vs social)
              → Channel Dispatcher

Channel adapters:
Dispatcher → In-App Adapter   → notifications DB + WS gateway
          → Push Adapter      → FCM (Android) / APNs (iOS) → device
          → Email Adapter     → SendGrid / SES → SMTP
          → SMS Adapter       → Twilio / SNS → carrier

Delivery tracking:
Each send → write delivery_log row (notificationId, channel, status, timestamp)
FCM/APNs callbacks → update delivery_log with "delivered" / "failed"
Failed → retry queue → dead-letter after max attempts

In-app real-time:
Notification written to DB → publish to Redis pub/sub → WS gateway → client
Client receives: { type: 'notification', data: {...} } → update badge + list`,
    },
    {
      id: 'component-design',
      title: 'Component Design',
      content: `<NotificationBelunreadCount}>   ← header component
  <UnreadBadge />                           ← red dot / count bubble
  <NotificationDropdown isOpen>
    <NotificationHeader>
      <Title>Notifications</Title>
      <MarkAllReadButton />
      <SettingsLink />
    </NotificationHeader>
    <NotificationList>                      ← virtualised; can have 100s
      <NotificationItem key={id}>
        <Avatar src={actor.avatarUrl} />
        <NotificationText>                  ← rendered with @mentions highlighted
          <ActorName /> {verb} <TargetLink />
          {groupCount > 1 && <> and {groupCount - 1} others</>}
        </NotificationText>
        <Timestamp>{timeAgo(createdAt)}</Timestamp>
        <UnreadDot visible={!isRead} />
        <ActionButtons />                   ← context-specific: "Follow back", "View order"
      </NotificationItem>
    </NotificationList>
    <LoadMoreButton />
  </NotificationDropdown>
</NotificationBell>

<NotificationPreferencesPage>             ← /settings/notifications
  {NOTIFICATION_TYPES.map(type => (
    <PreferenceRow key={type}>
      <TypeLabel />
      <ChannelToggles channels={['push','email','sms']} />
    </PreferenceRow>
  ))}
  <DoNotDisturbScheduler />               ← time picker + timezone
</NotificationPreferencesPage>`,
    },
    {
      id: 'state-management',
      title: 'State Management',
      content: `Notification state — Zustand + React Query:
\`\`\`ts
// Zustand: real-time state (WS-driven)
interface NotificationStore {
  unreadCount: number;
  notifications: Notification[];   // latest page, prepended by WS
  isDropdownOpen: boolean;

  addNotification: (n: Notification) => void;   // called on WS event
  markRead: (id: string) => void;               // optimistic
  markAllRead: () => void;                      // optimistic
}

// WS listener wired in app root
useEffect(() => {
  ws.on('notification', (n: Notification) => {
    store.addNotification(n);
    // Browser push is separate — handled by service worker
  });
}, []);
\`\`\`

React Query: for paginated notification list (history beyond latest page)
\`\`\`ts
useInfiniteQuery(['notifications'], fetchNotificationsPage, {
  staleTime: 60_000,
  // WS events prepend to page 1 — no refetch needed for new items
});
\`\`\`

Preferences: standard useQuery + useMutation with optimistic toggle`,
    },
    {
      id: 'data-model',
      title: 'Data Model',
      content: `\`\`\`ts
interface Notification {
  id: string;
  userId: string;             // recipient
  type: NotificationType;     // 'like' | 'comment' | 'follow' | 'order' | 'otp' | ...
  priority: 'high' | 'normal';
  actors: Actor[];            // who triggered it (supports grouping)
  verb: string;               // "liked" | "commented on" | "shipped"
  targetType: string;         // 'photo' | 'post' | 'order'
  targetId: string;
  targetUrl: string;          // deep link
  isRead: boolean;
  groupKey: string;           // e.g. "like:photo:123" — for grouping same-type events
  createdAt: Date;
  expiresAt?: Date;           // transient notifications (OTP badge clears after 10min)
}

interface NotificationPreference {
  userId: string;
  type: NotificationType;
  channels: {
    inApp: boolean;
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  doNotDisturb: {
    enabled: boolean;
    startTime: string;  // "22:00"
    endTime: string;    // "08:00"
    timezone: string;   // "America/New_York"
  };
}

interface DeliveryLog {
  id: string;
  notificationId: string;
  channel: 'push' | 'email' | 'sms' | 'inApp';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  attempts: number;
  sentAt?: Date;
  deliveredAt?: Date;
  errorCode?: string;
}
\`\`\``,
    },
    {
      id: 'scaling',
      title: 'Scaling',
      content: `Fan-out at celebrity scale (1M followers):
- Small accounts (< 10K followers): fan-out inline in notification service
- Large accounts (> 10K followers): async fan-out via Kafka partitioned by userId range
- Each Kafka partition = one consumer; 100 partitions = 100 parallel fan-out workers
- Rate limit: max 50K push sends/second per FCM project (batch 1000 tokens/request)
- At 1M followers: ~20 seconds to fan-out push — acceptable for social

Preference evaluation at scale:
- Cache: Redis hash per userId — all preferences in one hget (< 2ms)
- TTL: 5 minutes; invalidated on settings change via cache-aside
- Size: ~20 preference keys per user × 3B users = too big for all-at-once load
- Strategy: load on first notification for user; evict LRU after 24h

Deduplication:
\`\`\`
Key:   dedup:{userId}:{eventType}:{targetId}
Value: notificationId
TTL:   60 seconds for social; never expire for transactional
\`\`\`
Redis SET NX (set if not exists) — atomic, < 1ms — prevents double notification

Kafka partitioning:
- Social events: partition by userId (recipient) — all fan-out for same user sequential
- Transactional events: separate high-priority topic; dedicated consumer group; no lag tolerance`,
    },
    {
      id: 'performance',
      title: 'Performance',
      content: `In-app notification centre:
- Virtualised list (react-window) — users may have thousands of notifications
- First load: latest 20 from React Query; infinite scroll for history
- Unread count badge: Zustand (instant, WS-driven); not derived from list length

Real-time badge update:
- WS event → Zustand addNotification → React re-renders badge in < 16ms
- Do NOT refetch the full list on every notification — append only

Push notification delivery latency:
- FCM: typically < 5s to device when device is online
- APNs: < 2s for high-priority (sound/badge); < 30s for background
- Always set appropriate APNs priority — high-priority wakes device; normal does not

Grouping window:
- 60-second sliding window per (userId, groupKey)
- Redis sorted set: ZADD with score = timestamp; ZRANGEBYSCORE for window
- If group exists → UPDATE (increment actor count, update timestamp)
- If no group → INSERT new notification
- Prevents 50 separate "like" notifications from flooding the centre`,
    },
    {
      id: 'interview-tips',
      title: 'Interview Tips',
      content: `1. Separate transactional from social — OTP must arrive in 5s; a "like" can wait 60s. Use separate Kafka topics with different consumer SLAs
2. Grouping is expected — "Alice and 4 others liked your post" shows real product thinking; describe the sliding window + groupKey approach
3. Preference evaluation must be cached — don't DB query on every notification; Redis hash with 5min TTL
4. Dedup with Redis SET NX — atomic, prevents double send; explain the TTL strategy per type
5. Fan-out at celebrity scale — describe the inline vs async threshold (10K followers) and Kafka parallelism
6. FCM priority levels — high-priority wakes device (sound + display); normal is background-only. Interviewers test this
7. DND is timezone-aware — "22:00 in New York" is different from "22:00 UTC"; store timezone with preference`,
    },
  ],
};

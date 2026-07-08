import { VisualData } from '@/types/visuals';

export const notificationSystemVisuals: Record<string, VisualData> = {

  'user-flow': {
    type: 'flow',
    title: 'Event → Multi-channel Delivery',
    steps: [
      { label: 'Event fires (Alice likes Bob\'s photo)', color: 'violet', detail: 'Like Service publishes to Kafka topic partitioned by recipient userId (Bob)' },
      { label: 'Notification Service consumes → loads Bob\'s preferences', color: 'blue', detail: 'Redis hash lookup: O(1), < 2ms; TTL 5min' },
      {
        label: 'Grouping check: existing "like" notification within 60s window?',
        color: 'amber',
        detail: 'Redis ZADD with score=timestamp; ZRANGEBYSCORE for 60s window',
        branch: [
          { label: 'Yes → aggregate', color: 'amber', detail: '"Alice and 2 others liked your photo" — UPDATE existing notification' },
          { label: 'No → new notification', color: 'emerald', detail: 'INSERT new notification row; assign groupKey for future grouping' },
        ],
      },
      { label: 'Channel routing based on user preferences', color: 'blue', detail: 'Bob: "likes → in-app only" → skip push, skip email' },
      { label: 'In-app adapter: write to DB + emit WS event', color: 'emerald', detail: 'Bob\'s client receives WS event → badge increments; notification appears in centre' },
    ],
  },

  'high-level-architecture': {
    type: 'arch',
    title: 'Notification System Architecture',
    layers: [
      { nodes: [
        { label: 'Like Service', color: 'slate' },
        { label: 'Order Service', color: 'slate' },
        { label: 'Auth Service', color: 'slate' },
      ]},
      { edgeLabel: 'publish events', nodes: [{ label: 'Kafka', sublabel: 'partitioned by recipient userId', color: 'amber' }] },
      { edgeLabel: 'consume', nodes: [{ label: 'Notification Service', sublabel: 'pref check + grouping + routing', color: 'blue' }] },
      { edgeLabel: 'dispatch', nodes: [
        { label: 'In-App Adapter', sublabel: 'DB write + WS push', color: 'violet' },
        { label: 'Push Adapter', sublabel: 'FCM (Android) / APNs (iOS)', color: 'emerald' },
        { label: 'Email Adapter', sublabel: 'SendGrid / SES', color: 'slate' },
        { label: 'SMS Adapter', sublabel: 'Twilio / SNS', color: 'slate' },
      ]},
    ],
  },

  'component-design': {
    type: 'tree',
    title: 'Component Hierarchy',
    root: {
      label: 'NotificationBell', color: 'violet', note: 'header component; unreadCount prop',
      children: [
        { label: 'UnreadBadge', color: 'rose', note: 'red dot / count bubble' },
        { label: 'NotificationDropdown', color: 'violet', note: 'isOpen controlled',
          children: [
            { label: 'NotificationHeader', color: 'slate',
              children: [
                { label: 'MarkAllReadButton', color: 'emerald', note: 'optimistic — updates Zustand immediately' },
                { label: 'SettingsLink', color: 'slate' },
              ],
            },
            { label: 'NotificationList', color: 'blue', note: 'virtualised; 100s of items',
              children: [
                { label: 'NotificationItem', color: 'emerald',
                  children: [
                    { label: 'Avatar', color: 'slate', note: 'actor who triggered notification' },
                    { label: 'NotificationText', color: 'slate', note: 'grouped: "Alice and 3 others liked..."' },
                    { label: 'UnreadDot', color: 'violet', note: 'visible={!isRead}' },
                    { label: 'ActionButtons', color: 'blue', note: 'context-specific: Follow back, View order' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },

  'scaling': {
    type: 'comparison',
    title: 'Fan-out Strategy by Account Size',
    columns: [
      {
        heading: 'Small Accounts (< 10K followers)',
        color: 'emerald',
        points: [
          'Fan-out inline in Notification Service',
          'Push to all followers synchronously in one Kafka batch',
          'Fast: entire fan-out completes < 1s',
          'Simple: no extra infrastructure needed',
          'Used for: 99% of all accounts',
          'Total: most notifications delivered this way',
        ],
      },
      {
        heading: 'Large Accounts (> 10K followers)',
        color: 'violet',
        points: [
          'Async fan-out via Kafka consumer group',
          '100 partitions = 100 parallel fan-out workers',
          'FCM batch: 1000 tokens per request',
          'At 1M followers: ~20s to complete full fan-out',
          'Rate limited: max 50K push sends/second per FCM project',
          'Used for: celebrities, news accounts, viral posts',
        ],
      },
    ],
  },
};

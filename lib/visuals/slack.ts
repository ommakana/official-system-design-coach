import { VisualData } from '@/types/visuals';

export const slackVisuals: Record<string, VisualData> = {

  'user-flow': {
    type: 'flow',
    title: 'Sending a Message in Slack',
    steps: [
      { label: 'User types → "is typing" WS event broadcast', color: 'violet', detail: 'Throttled: max 1 event per 3s to prevent WS flood' },
      { label: 'User submits → optimistic UI: message added with "sending" status', color: 'blue', detail: 'Normalised Zustand store: messages[tempId] = { ...message, status: "sending" }' },
      { label: 'POST /messages → server persists, assigns sequence number', color: 'emerald', detail: 'Server publishes event to Kafka partitioned by workspaceId' },
      {
        label: 'Fan-out worker routes to all channel member WS sessions',
        color: 'amber',
        detail: 'All members on same workspace shard — no cross-shard routing needed',
        branch: [
          { label: 'Member online (WS connected)', color: 'emerald', detail: 'Message appears instantly; status flips "sent"' },
          { label: 'Member offline', color: 'slate', detail: 'Push notification sent via FCM/APNs after preference check' },
        ],
      },
      { label: 'Search indexer (async) writes to Elasticsearch', color: 'slate', detail: 'Message searchable within ~5s; separate Kafka consumer, non-blocking' },
    ],
  },

  'high-level-architecture': {
    type: 'arch',
    title: 'Slack System Architecture',
    layers: [
      { nodes: [{ label: 'Client A', color: 'violet' }, { label: 'Client B', color: 'violet' }] },
      { edgeLabel: 'WS (shard by workspaceId)', nodes: [{ label: 'WS Gateway', sublabel: 'each shard owns N workspaces', color: 'blue' }] },
      { edgeLabel: 'persist + publish', nodes: [
        { label: 'Message Service', sublabel: 'Cassandra storage', color: 'blue' },
        { label: 'Kafka', sublabel: 'partitioned by workspaceId', color: 'amber' },
      ]},
      { edgeLabel: 'consume', nodes: [
        { label: 'Fan-out Worker', sublabel: 'routes to WS sessions', color: 'blue' },
        { label: 'Search Indexer', sublabel: 'Elasticsearch per workspace', color: 'slate' },
        { label: 'Notification Service', sublabel: 'pref-aware push routing', color: 'emerald' },
      ]},
    ],
  },

  'component-design': {
    type: 'tree',
    title: 'Component Hierarchy',
    root: {
      label: 'SlackApp', color: 'violet',
      children: [
        { label: 'WorkspaceSwitcher', color: 'slate', note: 'Cmd+1-9 keyboard shortcut' },
        { label: 'Sidebar', color: 'blue',
          children: [
            { label: 'ChannelList', color: 'slate', note: 'virtualised; grouped starred/muted/DMs',
              children: [{ label: 'ChannelItem', color: 'slate', note: 'unread badge, bold when unread' }],
            },
          ],
        },
        { label: 'MainPane', color: 'violet',
          children: [
            { label: 'ChannelHeader', color: 'slate', note: 'name, topic, member count' },
            { label: 'MessageList', color: 'blue', note: 'VariableSizeList (code blocks vary height)',
              children: [
                { label: 'MessageItem', color: 'emerald',
                  children: [
                    { label: 'MessageContent', color: 'slate', note: 'rendered markdown + @mentions' },
                    { label: 'EmojiReactions', color: 'amber', note: 'optimistic add/remove' },
                    { label: 'MessageActions', color: 'slate', note: 'on hover: react, reply, pin' },
                  ],
                },
              ],
            },
            { label: 'MessageComposer', color: 'violet',
              children: [
                { label: 'RichTextEditor', color: 'blue', note: 'Slate.js; bold/italic/code/mentions' },
              ],
            },
          ],
        },
        { label: 'ThreadPanel', color: 'amber', note: 'slides in from right; lazy loads thread messages' },
      ],
    },
  },

  'state-management': {
    type: 'comparison',
    title: 'Why Normalised Store is Non-Negotiable for Slack',
    columns: [
      {
        heading: 'Normalised (correct)',
        color: 'emerald',
        points: [
          'messages: Record<string, Message> — O(1) WS update',
          'messagesByChannel: Record<string, string[]> — ordered IDs only',
          'WS event hits messages[id] directly — no array scan',
          'Thread reply: increment replyCount on parent — O(1)',
          'Presence update: touches only presence[userId]',
          'Emoji reaction: patch reactions on messages[id]',
        ],
      },
      {
        heading: 'Unnormalised (wrong)',
        color: 'rose',
        points: [
          'channels[id].messages = Message[] — nested arrays',
          'WS update: find message in array — O(n) scan',
          'Thread reply: find channel → find message → update count',
          'Presence: would need to search all channels',
          'Every WS event causes full channel re-render',
          'Scales badly: 1000 messages in active channel = visible lag',
        ],
      },
    ],
  },
};

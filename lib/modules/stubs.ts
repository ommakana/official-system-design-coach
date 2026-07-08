import { DesignModule } from '@/types';

// Stub modules — same shape as full modules, structured sections.
// Each has a meaningful problem statement + key sections.
// Expand any slug to full depth by adding more sections.

const stub = (
  slug: string,
  title: string,
  description: string,
  difficulty: 'Senior' | 'Staff',
  companies: string[],
  tags: string[],
  estimatedMinutes: number,
  coreChallenges: string,
  keyDecisions: string,
  interviewTips: string,
): DesignModule => ({
  slug,
  title,
  description,
  difficulty,
  companies,
  tags,
  estimatedMinutes,
  sections: [
    {
      id: 'problem',
      title: 'Problem Statement',
      content: description + '\n\n' + coreChallenges,
    },
    {
      id: 'key-decisions',
      title: 'Key Technical Decisions',
      content: keyDecisions,
    },
    {
      id: 'interview-tips',
      title: 'Interview Tips',
      content: interviewTips,
    },
  ],
});

export const stubModules: DesignModule[] = [
  stub(
    'figma',
    'Design Figma',
    'A collaborative vector design tool with real-time multi-user editing, infinite canvas, and version history.',
    'Staff',
    ['Figma', 'Adobe', 'Canva', 'Sketch'],
    ['CRDT', 'Canvas', 'WebGL', 'Real-time'],
    60,
    `Core challenges:
- Infinite canvas rendering at 60fps — WebGL vs Canvas 2D vs SVG
- Real-time multiplayer on vector objects (CRDTs per shape property)
- Flatten complex component/variant trees efficiently
- Handle 10K+ objects on canvas without jank
- Export to PNG/SVG/PDF from browser`,
    `- Rendering: WebGL (via a custom renderer or Three.js) for large canvases; SVG only for small documents
- CRDT per property: each shape property (x, y, width, fill) is a separate CRDT register — not the whole shape
- Component system: flatten component instances at render time; store reference + overrides only
- Selection: spatial index (R-tree or quadtree) to hit-test 10K objects in O(log n)
- Export: Web Worker renders off-main-thread; OffscreenCanvas for PNG`,
    `1. Lead with the rendering model choice — WebGL vs Canvas 2D is the central tradeoff
2. Explain CRDTs per-property, not per-object — this is the Staff-level insight
3. Discuss spatial indexing for hit-testing — most candidates forget performance at scale
4. Cover the component/master override model — analogous to CSS inheritance
5. Mention OffscreenCanvas for export — shows deep browser API knowledge`,
  ),

  stub(
    'chat-app',
    'Design Chat App',
    'A real-time messaging app with 1:1 and group chats, message status indicators, media sharing, and offline support — similar to WhatsApp or Slack DMs.',
    'Senior',
    ['Meta', 'Slack', 'Discord', 'Microsoft', 'Airbnb'],
    ['WebSocket', 'Real-time', 'Offline', 'Push Notifications'],
    45,
    `Core challenges:
- Message delivery guarantees: at-most-once vs at-least-once vs exactly-once
- Message status: sent, delivered, read (double-tick pattern)
- Ordering messages correctly across multiple devices
- Push notifications when app is backgrounded
- Storing and syncing message history on new device login`,
    `- Transport: WebSocket for active sessions; FCM/APNs push for background
- Message IDs: client-generated UUID (for optimistic display) + server sequence number (for ordering)
- Delivery receipts: client ACKs on receive; server marks delivered; second tick on read
- History sync: cursor-based pagination from newest backwards; store in IndexedDB
- Group chat fan-out: server sends to each member; don't fan-out on client
- Encryption: E2E encryption (Signal protocol) — keys never leave device`,
    `1. Distinguish message states clearly — sent/delivered/read are three separate events
2. Explain client UUID vs server sequence number — enables optimistic UI without gaps
3. Cover what happens when a message fails — retry with exponential backoff, dead-letter queue
4. Discuss offline message queue — store in IndexedDB, drain on reconnect
5. Mention E2E encryption if interviewer asks about security — Signal protocol is the reference`,
  ),

  stub(
    'youtube',
    'Design YouTube',
    'A video streaming platform with adaptive bitrate playback, comment system, recommendations, and upload pipeline.',
    'Staff',
    ['Google', 'Meta', 'Netflix', 'TikTok', 'Twitch'],
    ['Streaming', 'ABR', 'CDN', 'Upload Pipeline'],
    60,
    `Core challenges:
- Adaptive bitrate streaming (HLS/DASH) — switch quality based on bandwidth
- Video upload and transcoding pipeline at scale
- Recommendation feed personalization
- Comment system at massive scale (billions of comments)
- Live streaming vs VOD architecture differences`,
    `- Playback: HLS (Safari) or DASH (Chrome) with MSE; ABR via bandwidth estimation
- Upload: chunked multipart upload to S3; resumable via TUS protocol
- Transcoding: async job queue (Kafka) → FFmpeg workers → output to CDN
- CDN: edge nodes cache popular segments; origin pull for cold content
- Comments: Spanner/Bigtable for scale; paginated with cursor; sorted by top/new
- Player: custom <video> element with Media Source Extensions for segment control`,
    `1. Lead with ABR — most candidates just say "video player"; ABR shows depth
2. Explain chunked upload and resumability — large files need TUS or equivalent
3. Distinguish VOD from live streaming architecture — live needs ingest servers
4. Comment system at scale is a separate design — don't underestimate it
5. Cover CDN cache strategy for popular vs long-tail content`,
  ),

  stub(
    'slack',
    'Design Slack',
    'A team communication platform with channels, threads, real-time messaging, search across history, and integrations.',
    'Staff',
    ['Slack', 'Microsoft', 'Discord', 'Atlassian'],
    ['WebSocket', 'Search', 'Real-time', 'Threads'],
    55,
    `Core challenges:
- Scale: millions of concurrent WebSocket connections across thousands of workspaces
- Message threading: threads are first-class, not nested comments
- Full-text search across entire message history for all users
- Notification routing: mentions, DMs, keywords — per user preference
- Workspace isolation: one workspace's data must not leak to another`,
    `- WS sharding: gateway servers shard by workspace; each shard owns N workspaces
- Search: Elasticsearch per workspace with tenant isolation; index on send
- Threads: thread is a parent message + child messages; separate sorted set
- Notifications: server evaluates per-user preferences; fan-out via push service
- Presence: Redis sorted set of active users per workspace; heartbeat every 30s
- App integrations: webhook receiver + event bus; sandbox with rate limits`,
    `1. WS sharding is the scalability crux — explain per-workspace shard routing
2. Search at Slack scale requires Elasticsearch with workspace-level index isolation
3. Threads vs channels — threads are not comments; they're a separate entity
4. Notification fan-out is complex — discuss preference filtering before pushing
5. Cover workspace isolation explicitly — multi-tenant security is a common probe`,
  ),

  stub(
    'file-upload',
    'Design File Upload',
    'A robust file upload system with chunked uploads, progress tracking, resumability, preview generation, and CDN delivery.',
    'Senior',
    ['Dropbox', 'Google', 'Box', 'Atlassian', 'Notion'],
    ['Chunked Upload', 'CDN', 'Resumable', 'Preview'],
    40,
    `Core challenges:
- Large file uploads that survive network interruptions (resumable)
- Progress tracking accurate to the byte
- Client-side validation before upload begins
- Server-side virus scanning without blocking the upload response
- Generating previews (thumbnails, PDF page 1) asynchronously`,
    `- Protocol: TUS (open resumable upload standard) or custom chunked multipart
- Flow: client splits file into 5MB chunks → uploads each → server assembles
- Progress: track chunk upload progress via XMLHttpRequest.upload.onprogress
- Pre-signed URLs: client uploads directly to S3 via pre-signed URL — API never handles bytes
- Virus scan: S3 event → Lambda scan → tag object; block download until scanned
- Previews: async job on upload complete → FFmpeg/ImageMagick → store thumbnail in CDN
- Client validation: check MIME type, size, extension before any network request`,
    `1. Pre-signed S3 URLs is the correct answer — API should never proxy file bytes
2. TUS protocol for resumability — don't reinvent with custom checkpointing
3. Virus scanning must be async — don't block the upload response
4. Client-side validation saves bandwidth — check before upload, not just on server
5. Chunk size matters — 5–10MB per chunk balances retransmission cost vs parallelism`,
  ),

  stub(
    'whiteboard',
    'Design Whiteboard',
    'A real-time collaborative infinite whiteboard with shapes, freehand drawing, sticky notes, and multi-user presence — similar to Miro or FigJam.',
    'Staff',
    ['Miro', 'Figma', 'Microsoft', 'Atlassian'],
    ['Canvas', 'CRDT', 'Real-time', 'Infinite Canvas'],
    55,
    `Core challenges:
- Infinite canvas panning and zooming without jank
- Real-time sync of arbitrary shape positions with many concurrent users
- Freehand drawing: sync stroke-in-progress or only on stroke-end?
- Selection and multi-object transform (group move/resize)
- Export to PNG of potentially very large canvas area`,
    `- Rendering: Canvas 2D for shapes; WebGL if >10K objects; viewport culling is mandatory
- Sync: CRDT per object (position, size, content are separate registers)
- Freehand: sync on stroke-end only (too noisy during drawing); show peer stroke live via WS broadcast
- Camera model: CSS transform on a world container for pan/zoom; avoid re-rendering all objects on camera move
- Export: OffscreenCanvas in Web Worker; render only objects within export bounds
- Collision/overlap: z-index as a CRDT register; last-write-wins on z-order changes`,
    `1. Camera model is the first question — CSS transform vs canvas translate; explain viewport culling
2. Distinguish freehand sync from shape sync — strokes sync on end; shapes sync on move
3. Cover z-index conflict — two users moving same object to front; LWW is acceptable
4. Discuss selection across users — can two users select the same object? What happens?
5. Export performance — large canvas export needs Web Worker + OffscreenCanvas`,
  ),

  stub(
    'notification-system',
    'Design Notification System',
    'A multi-channel notification platform delivering in-app, push, email, and SMS notifications with user preferences and delivery guarantees.',
    'Senior',
    ['Meta', 'Google', 'Airbnb', 'Uber', 'Salesforce'],
    ['Push', 'Fan-out', 'Preferences', 'Delivery Guarantee'],
    45,
    `Core challenges:
- Fan-out: one event (new like) may need to notify millions of followers
- Multi-channel: same notification delivered to in-app, push, email, SMS depending on user preferences
- Deduplication: don't send the same notification twice (at-least-once delivery vs exactly-once)
- Rate limiting: don't spam users; group similar notifications ("5 people liked your post")
- Notification preferences: per-type, per-channel, per-time-of-day settings`,
    `- Architecture: event source → Kafka topic → notification service → fan-out workers → channel adapters
- Fan-out: small accounts inline; large accounts async batch worker
- Channel adapters: in-app (WebSocket/SSE), push (FCM/APNs), email (SES/SendGrid), SMS (Twilio)
- Grouping: sliding window aggregator — collect events for 60s, send digest
- Dedup: Redis SET with event hash; TTL = delivery window
- Preferences: Redis cache of user prefs; invalidate on settings change
- Delivery tracking: store delivery status per notification per channel; retry on failure`,
    `1. Kafka is the right event bus — explain why (durable, replayable, fan-out)
2. Channel adapter pattern decouples delivery from business logic
3. Grouping/batching is expected — "5 people liked" vs 5 separate notifications
4. Deduplication with Redis is the clean answer — explain the hash key + TTL strategy
5. Preferences must be cached — don't DB query on every notification
6. Cover the "do not disturb" window — time-zone-aware delivery scheduling`,
  ),

  stub(
    'search-autocomplete',
    'Design Search Autocomplete',
    'A real-time search suggestion system that returns ranked completions within 100ms for billions of queries — similar to Google Search or Amazon product search.',
    'Senior',
    ['Google', 'Amazon', 'Airbnb', 'Twitter', 'Uber'],
    ['Trie', 'Debounce', 'Caching', 'Ranking'],
    40,
    `Core challenges:
- Sub-100ms p99 response time for every keystroke query
- Ranking: popular suggestions first; personalize based on user history
- Handle misspellings and prefix matching
- Scale: billions of queries/day; suggestions must update as trending terms change
- Frontend: debounce, keyboard navigation, screen reader announcements`,
    `- Frontend: debounce 150ms before firing; AbortController to cancel in-flight requests
- Data structure: Trie for prefix matching; but at scale, pre-computed top-K per prefix stored in Redis
- Ranking: offline job (Spark/MapReduce) computes top-10 per prefix from query logs → loads to Redis
- CDN: cache suggestions by prefix at edge; TTL = 5 minutes (balance freshness vs hit rate)
- Personalization: blend global top-K with user's recent searches client-side
- Spell correction: edit-distance (Levenshtein) for no-result queries; pre-computed common misspellings
- Keyboard: combobox pattern (aria-autocomplete, aria-expanded, aria-activedescendant)`,
    `1. Debounce is table stakes — specify 150ms and explain why (not 0, not 500ms)
2. Pre-computed top-K in Redis is the scalable answer — real-time Trie traversal won't scale to billions
3. CDN caching of suggestions is a Senior signal — "cache by prefix at edge, 5min TTL"
4. ARIA combobox pattern is expected — name aria-autocomplete, aria-activedescendant
5. Discuss the ranking update pipeline — how do trending searches reach users within an hour?`,
  ),

  stub(
    'dashboard',
    'Design Dashboard',
    'An analytics dashboard with real-time metric widgets, configurable layouts, drill-down charts, and data from multiple backend sources.',
    'Senior',
    ['Salesforce', 'Datadog', 'Grafana', 'Mixpanel', 'Google'],
    ['Charts', 'Real-time', 'Layout', 'Data Aggregation'],
    40,
    `Core challenges:
- Composable widget system: different chart types, each independently configured and refreshed
- Real-time metrics: some widgets update every 5s; others are daily snapshots
- Large dataset rendering: chart with 100K data points must not freeze the browser
- Configurable layout: drag-and-drop widget placement, resizable panels
- Multi-source data: widgets pull from different APIs; aggregate without a unified schema`,
    `- Widget registry: each chart type is a plugin (ChartWidget, TableWidget, MetricWidget) with config schema
- Layout: CSS Grid with react-grid-layout for drag-resize; serialize layout to user preferences
- Data fetching: each widget manages its own query + polling interval; independent loading states
- Canvas for large charts: Chart.js with canvas (not SVG) for >1K data points; decimation plugin
- Real-time: SSE per widget type OR WebSocket with subscription per metric key
- Responsive: charts wrap to a fixed-height div (responsive:true ignores canvas height without it)
- Export: html2canvas or server-side PDF render for dashboard snapshots`,
    `1. Widget plugin system is the architecture crux — explain the registry + config schema pattern
2. Canvas vs SVG for charts — SVG fails at 10K+ data points; call out Chart.js canvas
3. Each widget has independent polling — don't centralize all refreshes
4. react-grid-layout for configurable layouts — mention it by name
5. Fixed-height div wrapper for Chart.js — common gotcha; show you know it`,
  ),

  stub(
    'analytics-ui',
    'Design Analytics UI',
    'A frontend analytics platform (like Mixpanel or Amplitude) with funnels, retention charts, segmentation, and large-scale event data querying.',
    'Staff',
    ['Mixpanel', 'Amplitude', 'Google', 'Salesforce', 'Stripe'],
    ['OLAP', 'Charts', 'Segmentation', 'Query Builder'],
    55,
    `Core challenges:
- Query builder UI for non-engineers: filter by event properties, date ranges, user segments
- Funnel analysis: track users through N sequential steps, show dropoff at each
- Retention charts: cohort-based; expensive to compute on the fly
- Results may be millions of rows — frontend must aggregate/sample intelligently
- Real-time vs historical data — live event stream vs pre-aggregated OLAP cube`,
    `- Query builder: composable filter chips (event + property + operator + value); serializes to SQL or OLAP DSL
- Backend: ClickHouse or BigQuery for OLAP queries; p99 < 10s for complex queries
- Async queries: submit query → poll for status → stream results; show progress bar
- Frontend aggregation: downsample to max 500 chart points; aggregate client-side for zoom/pan
- Funnel SQL: self-join on user_id with step ordering; server computes, sends aggregated results
- Retention: cohort table computed nightly; served from pre-aggregated table; not real-time
- Export: server-side CSV stream; large exports emailed (don't block UI)`,
    `1. Async query pattern is essential — analytics queries take seconds; don't block on fetch
2. OLAP vs OLTP distinction — explain why Postgres won't scale for this; ClickHouse/BigQuery will
3. Pre-aggregated retention — it's too expensive to compute cohorts on every request
4. Query builder serialization — show how UI state maps to a query DSL
5. Frontend downsampling — render max 500 points; aggregate on zoom; mention this explicitly`,
  ),

  stub(
    'data-grid',
    'Design Data Grid',
    'A high-performance spreadsheet-like data grid with virtual scrolling, inline editing, sorting, filtering, and 1M+ row support.',
    'Senior',
    ['Salesforce', 'Airtable', 'Google', 'Microsoft', 'Atlassian'],
    ['Virtualization', 'Canvas', 'Inline Edit', 'Performance'],
    45,
    `Core challenges:
- Render 1M rows smoothly — DOM-based approaches collapse; need virtualization or canvas rendering
- Frozen columns and rows (header + left columns stay fixed while body scrolls)
- Inline editing: click a cell → edit → Tab to next → Enter to save
- Sort/filter on large datasets: client-side for <100K rows; server-side beyond
- Column resizing, reordering, multi-select with range selection (Shift+click)`,
    `- Rendering: DOM virtualization (AG Grid / TanStack Virtual) for <500K rows; Canvas rendering (Glide Data Grid) for millions
- Virtualization: render only visible rows + 10 overscan; recycle row elements on scroll
- Frozen columns: position:sticky for simple case; separate left panel DOM for complex case
- Editing: cell component swaps to input on click; Tab navigation with Escape to cancel
- Sort/filter: client-side with Web Worker for large arrays to avoid blocking main thread
- Selection: track selected range as {start, end} cell coords — don't store per-cell booleans
- Keyboard: full Excel-like navigation (arrows, Tab, Enter, Ctrl+A, Shift+click range)`,
    `1. Canvas vs DOM is the central tradeoff — DOM works to ~500K rows; Canvas needed beyond that
2. Cell-level virtualization is harder than row — mention you'd handle it per use case
3. Web Worker for sorting large arrays — avoids jank on main thread
4. Selection as range coords, not per-cell state — O(1) storage, O(1) lookup
5. Keyboard navigation is a Senior signal — Excel-style Tab/Enter/arrow navigation`,
  ),

  stub(
    'kanban-board',
    'Design Kanban Board',
    'A project management Kanban board with swimlanes, WIP limits, card aging visualization, and team workflow automation.',
    'Senior',
    ['Atlassian', 'Linear', 'Asana', 'Monday.com', 'GitHub'],
    ['DnD', 'Real-time', 'Workflow', 'Filters'],
    45,
    `Note: This module focuses on the project-management Kanban (Linear/Jira-style) vs Trello's personal board.

Core challenges:
- Swimlanes: group cards by assignee/epic/priority horizontally across all columns
- WIP limits: column has a max in-progress count; visual warning + optional block
- Card aging: visual indicator (color fade) when a card has been in a column too long
- Automation: trigger rules — "when card moves to Done → notify assignee → close linked PR"
- Bulk operations: move 20 cards at once to a new sprint`,
    `- Swimlanes: 2D layout — (column × swimlane) grid; drag must track both dimensions
- WIP limit enforcement: soft (warn) vs hard (block drop); configurable per column
- Card aging: CSS custom property --age-days drives a color filter; computed server-side as metadata
- Automation engine: server-side rule evaluator; trigger → condition → action; no client logic
- Bulk ops: multi-select (Shift+click, Ctrl+click); server accepts array of card IDs per move
- Backlog vs board: separate views; backlog is flat list, board is column view of active sprint`,
    `1. Distinguish from Trello — Kanban board has swimlanes, WIP limits, sprint concept
2. 2D DnD for swimlane + column — harder than 1D; discuss coordinate tracking
3. WIP limit enforcement is a business rule — soft vs hard is a product decision to surface
4. Automation engine is server-side — don't put trigger logic in frontend
5. Bulk move needs a separate API endpoint — PATCH /cards/bulk-move with card ID array`,
  ),

  stub(
    'jira-board',
    'Design Jira Board',
    'An enterprise project tracking system with epics, stories, sprints, roadmaps, and deep workflow customization — at Atlassian scale.',
    'Staff',
    ['Atlassian', 'ServiceNow', 'Microsoft', 'Salesforce'],
    ['Workflow', 'Hierarchy', 'Search', 'Real-time'],
    60,
    `Core challenges:
- Issue hierarchy: Epic → Story → Sub-task → Bug (N levels deep)
- Custom workflows: each project defines its own status transitions (state machine)
- JQL (Jira Query Language): powerful filter DSL with field autocomplete
- Roadmap view: Gantt-chart-like timeline of epics spanning months
- Scale: Atlassian Cloud serves 10M+ users; one tenant's issues must not affect another's`,
    `- Issue hierarchy: adjacency list model in DB (parentId FK); rendered as tree in UI
- Workflow state machine: each project defines states + transition rules; server validates on move
- JQL parser: tokenizer + AST → SQL/Elasticsearch query; autocomplete via prefix search on field names
- Roadmap: SVG or Canvas timeline; date math for bar widths; scroll by time axis
- Search: Elasticsearch with per-project index; JQL maps to ES query DSL
- Multi-tenancy: row-level security in DB; separate ES index per workspace; rate limit per tenant
- Board views: Scrum (sprint-based) vs Kanban (continuous flow) — separate components`,
    `1. Issue hierarchy is the data model crux — explain adjacency list vs nested sets
2. Workflow state machine — transitions are configurable; server must validate; not just UI gates
3. JQL is a Staff-level detail — describe the parsing pipeline (tokenize → AST → query)
4. Multi-tenancy isolation is expected at Staff level — row-level security, separate indices
5. Roadmap rendering — explain date-to-pixel mapping and horizontal scroll model`,
  ),
];

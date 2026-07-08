import { DesignModule } from '@/types';

export const analyticsUIModule: DesignModule = {
  slug: 'analytics-ui',
  title: 'Design Analytics UI',
  description: 'A frontend analytics platform with funnels, retention cohorts, event exploration, and a query builder — like Mixpanel or Amplitude.',
  difficulty: 'Staff',
  companies: ['Mixpanel', 'Amplitude', 'Google', 'Salesforce', 'Stripe'],
  tags: ['OLAP', 'Charts', 'Query Builder', 'Async Queries'],
  estimatedMinutes: 55,
  sections: [
    {
      id: 'functional-requirements',
      title: 'Functional Requirements',
      content: `Core (must have):
- Event explorer: filter events by properties, date range, user segments
- Funnel analysis: define N sequential steps; show dropoff rate at each step
- Retention chart: cohort-based; what % of users return after N days
- Segmentation: group results by property (country, device, plan)
- Query builder UI: non-engineer-friendly filter builder with autocomplete
- Saved reports: persist queries; share via URL; add to dashboard
- Real-time events: live event stream showing events as they fire
- Export: CSV download of any query result

Nice to have:
- Dashboards: arrange multiple report widgets in a grid
- Alerts: notify when metric crosses a threshold
- A/B test analysis (statistical significance calculator)
- SQL editor for power users
- User profiles: click any user in a report to see their full event history`,
    },
    {
      id: 'non-functional-requirements',
      title: 'Non-Functional Requirements',
      content: `- Query latency: simple queries (last 7 days) < 3s; complex (retention last year) < 30s
- Scale: 100B events in storage; 10K queries/hour across all customers
- Data freshness: events queryable within 5 minutes of occurring
- Multi-tenant: one customer's data must never be visible to another
- Concurrency: user can run multiple queries simultaneously
- Export: CSV up to 10M rows delivered without blocking the browser
- Availability: 99.9% — analytics is not mission-critical (slight lag acceptable)
- Accuracy: counts must be exact (not sampled) for < 1B event queries`,
    },
    {
      id: 'user-flow',
      title: 'User Flow',
      content: `Building a funnel report:
1. User navigates to Funnels → blank canvas with "Add Step" button
2. Click "Add Step 1" → event picker dropdown with search autocomplete
   (events loaded from schema service: GET /schema/events)
3. Pick "Sign Up" event → Step 1 set. Click "Add Step 2"
4. Pick "First Purchase" event → funnel defined
5. Set date range (last 30 days) + breakdown dimension (by country)
6. Click "Run" → POST /queries { type: 'funnel', steps: [...], dateRange, breakdown }
7. Server returns queryId immediately (async — query takes 5–30s)
8. Client polls GET /queries/:id/status every 2s
   OR: WS pushes { type: 'query_complete', queryId, resultUrl }
9. Result ready → fetch paginated result from GET /queries/:id/results
10. Render bar chart showing conversion rate per step; breakdown as stacked bars

Saving and sharing:
1. Click "Save Report" → POST /reports → server stores query definition
2. URL updates to /reports/:id — shareable; team members see same query
3. Click "Add to Dashboard" → widget appears on user's dashboard grid`,
    },
    {
      id: 'high-level-architecture',
      title: 'High Level Architecture',
      content: `Ingestion pipeline (event collection):
Client SDK → Collector API → Kafka → Stream Processor (Flink)
                                   → ClickHouse (columnar OLAP store)
                                   → Redis (real-time event stream, 5min window)

Query execution:
Client → Query Service → validates query → checks cache (Redis 5min TTL)
                       ↓ cache miss
                       → ClickHouse query (SQL generated from query DSL)
                       → Result stored in S3 (for large result sets)
                       → queryId returned to client immediately

Result delivery:
Client polls / WS receives: { status: 'complete', resultUrl }
Client → GET /queries/:id/results → paginated JSON or presigned S3 URL for CSV

Schema service:
ClickHouse → Schema Service → caches event list + properties per workspace
Client → GET /schema/events?q=sign → autocomplete suggestions

Multi-tenancy:
- Each workspace has its own ClickHouse database (hard isolation)
- Query Service prepends WHERE workspace_id = ? to every query (defence-in-depth)
- Row-level security enforced at ClickHouse level as well`,
    },
    {
      id: 'component-design',
      title: 'Component Design',
      content: `<AnalyticsApp>
  <Sidebar>
    <NavItem href="/explore">Events</NavItem>
    <NavItem href="/funnels">Funnels</NavItem>
    <NavItem href="/retention">Retention</NavItem>
    <NavItem href="/dashboards">Dashboards</NavItem>
    <SavedReports />
  </Sidebar>
  <ReportBuilder>
    <ReportToolbar>
      <DateRangePicker />          ← presets: Last 7d / 30d / 90d / custom
      <BreakdownPicker />          ← select a property to group results by
      <RunButton loading={querying} />
      <SaveButton />
      <ExportButton />
    </ReportToolbar>

    <QueryBuilderPanel>            ← drag-and-drop filter chips
      <StepBuilder>                ← for funnels: ordered step list
        <EventPicker />            ← searchable combobox of event names
        <FilterChipList>           ← "country = US", "plan = pro"
          <FilterChip>
            <PropertySelect />
            <OperatorSelect />     ← equals, contains, greater than, etc.
            <ValueInput />
          </FilterChip>
          <AddFilterButton />
        </FilterChipList>
      </StepBuilder>
    </QueryBuilderPanel>

    <ResultsPanel>
      <QueryStatusBar />           ← "Running... 4.2s" or "Completed in 3.1s"
      <ChartContainer>             ← fixed-height div; Chart.js or Recharts
        <FunnelChart />
        <RetentionHeatmap />
        <TimeSeriesChart />
      </ChartContainer>
      <ResultsTable>               ← virtualised; sortable columns
    </ResultsPanel>
  </ReportBuilder>`,
    },
    {
      id: 'state-management',
      title: 'State Management',
      content: `Query state machine — Zustand:
\`\`\`ts
type QueryStatus = 'idle' | 'running' | 'complete' | 'error';

interface QueryStore {
  definition: QueryDefinition;     // the current report being built
  queryId: string | null;
  status: QueryStatus;
  results: QueryResult | null;
  error: string | null;
  executionTimeMs: number | null;

  updateDefinition: (patch: Partial<QueryDefinition>) => void;
  runQuery: () => Promise<void>;   // submits query, polls for result
  cancelQuery: () => void;
}
\`\`\`

Async query execution pattern:
\`\`\`ts
runQuery: async () => {
  set({ status: 'running', queryId: null, results: null });

  const { queryId } = await fetch('/api/queries', {
    method: 'POST',
    body: JSON.stringify(get().definition),
  }).then(r => r.json());

  set({ queryId });

  // Poll every 2s until complete
  const interval = setInterval(async () => {
    const { status, resultUrl } = await fetch(\`/api/queries/\${queryId}/status\`).then(r => r.json());
    if (status === 'complete') {
      clearInterval(interval);
      const results = await fetch(resultUrl).then(r => r.json());
      set({ status: 'complete', results });
    }
    if (status === 'error') {
      clearInterval(interval); set({ status: 'error', error: 'Query failed' });
    }
  }, 2000);
}
\`\`\`

Saved reports + dashboards: React Query (server state, cached)
Schema / event list: React Query with long staleTime (1h) — rarely changes`,
    },
    {
      id: 'data-model',
      title: 'Data Model',
      content: `\`\`\`ts
// ClickHouse events table (columnar, partitioned by date)
// CREATE TABLE events (
//   workspace_id UUID,
//   event_name   LowCardinality(String),
//   user_id      String,
//   timestamp    DateTime64(3),
//   properties   Map(String, String),  -- arbitrary event properties
//   session_id   String,
//   device_type  LowCardinality(String),
//   country      LowCardinality(String),
// ) ENGINE = MergeTree()
//   PARTITION BY toYYYYMM(timestamp)
//   ORDER BY (workspace_id, event_name, timestamp);

interface QueryDefinition {
  type: 'funnel' | 'retention' | 'trend' | 'breakdown';
  workspaceId: string;
  dateRange: { start: Date; end: Date };
  steps?: EventFilter[];         // funnel steps
  cohortEvent?: EventFilter;     // retention: the "did X" event
  returnEvent?: EventFilter;     // retention: the "came back and did Y" event
  breakdown?: string;            // property name to group by
  filters: GlobalFilter[];       // applied to all events
}

interface EventFilter {
  eventName: string;
  propertyFilters: PropertyFilter[];
  window?: number;               // funnel: max seconds between steps
}

interface PropertyFilter {
  property: string;
  operator: 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'is_set' | 'is_not_set';
  value: string | number;
}

interface QueryResult {
  queryId: string;
  type: QueryDefinition['type'];
  data: FunnelResult | RetentionResult | TrendResult;
  executionMs: number;
  rowCount: number;
  fromCache: boolean;
}
\`\`\``,
    },
    {
      id: 'scaling',
      title: 'Scaling',
      content: `ClickHouse for OLAP — why not PostgreSQL:
- PostgreSQL: row-oriented; COUNT(*) with GROUP BY on 100B rows = minutes
- ClickHouse: columnar; same query = seconds (reads only relevant columns)
- ClickHouse processes 1B rows/second on a single node — purpose-built for analytics
- Partitioned by month: queries with date filters skip irrelevant partitions entirely

Query result caching:
- Same query definition = same cache key (deterministic hash of QueryDefinition)
- Cache in Redis with 5min TTL — balances freshness vs compute cost
- Large result sets (> 1MB): cache S3 URL, not the result itself
- Cache invalidated on new event data that falls within the query's date range

Multi-tenant query isolation:
- Separate ClickHouse database per workspace → OS-level isolation
- Query Service validates workspace_id in JWT before executing
- Resource limits: max query CPU time 60s; max result rows 10M; max concurrency 5 per workspace

Retention query performance:
- Retention requires self-join: "users who did X in week 1 and returned in week N"
- Pre-aggregate into retention_cohorts table nightly (Spark batch job)
- Serve pre-aggregated data for standard 7/30/90-day retention; raw query for custom
- Custom retention with > 1M users: async query with 30s timeout, result to S3`,
    },
    {
      id: 'performance',
      title: 'Performance',
      content: `Chart rendering at scale:
- Never render more than 500 data points in a chart — browser can't animate it smoothly
- Server-side downsampling: aggregate to at most 500 buckets for time-series
- Zoom/pan: request finer granularity from server for the zoomed-in time range
- Chart.js: wrap canvas in fixed-height div; responsive:true ignores canvas height attribute

Query builder responsiveness:
- Event name autocomplete: debounce 200ms; pre-load top-50 events on mount
- Property value autocomplete: lazy — only fetch when user opens value dropdown
- Filter chip add/remove: local state only; no API call until "Run" clicked

Large CSV exports:
- Never load 10M rows into browser memory
- Server generates CSV in streaming fashion → S3 multipart upload
- Client receives pre-signed S3 URL for direct download
- Browser: anchor tag with download attribute; streams from S3 directly

Result table virtualisation:
- react-window FixedSizeList for result rows (uniform height)
- Sticky header row (CSS position:sticky — no JS needed)
- Column sorting: client-side for < 10K rows; server-side (re-query) for larger`,
    },
    {
      id: 'interview-tips',
      title: 'Interview Tips',
      content: `1. Async query pattern is essential — analytics queries take seconds; never block on fetch. Describe: submit → get queryId → poll or WS → fetch result
2. ClickHouse not PostgreSQL — explain columnar storage advantage for aggregation queries explicitly: "reads only the columns it needs instead of full row"
3. Pre-aggregate retention — cohort retention on raw events at 100B scale is too slow; nightly batch precomputes standard cohorts
4. Multi-tenant isolation — separate ClickHouse database per workspace, not just WHERE clause filtering; defence in depth
5. Schema service for autocomplete — event names and properties are queryable metadata; don't load all 10K event names upfront; autocomplete via schema API
6. Chart downsampling — "I'd limit to 500 data points; server downsamples the rest" shows you understand browser rendering limits
7. CSV export via S3 — never stream 10M rows through the browser; generate server-side, return pre-signed URL for direct S3 download`,
    },
  ],
};

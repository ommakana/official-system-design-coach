import { VisualData } from '@/types/visuals';

export const analyticsUIVisuals: Record<string, VisualData> = {

  'user-flow': {
    type: 'flow',
    title: 'Building and Running a Funnel Report',
    steps: [
      { label: 'User navigates to Funnels → clicks "Add Step 1"', color: 'violet', detail: 'Event picker dropdown loads top-50 events on mount; autocomplete via schema API' },
      { label: 'Picks "Sign Up" → adds "First Purchase" as Step 2', color: 'blue', detail: 'Local Zustand state only — no API call until Run is clicked' },
      { label: 'Sets date range + breakdown dimension → clicks "Run"', color: 'emerald', detail: 'POST /queries { type: "funnel", steps, dateRange, breakdown }' },
      { label: 'Server returns queryId immediately (async pattern)', color: 'amber', detail: 'Query submitted to ClickHouse; client does not wait for results' },
      {
        label: 'Client polls GET /queries/:id/status every 2s',
        color: 'blue',
        detail: 'Or WS event: { type: "query_complete", queryId, resultUrl }',
        branch: [
          { label: 'status: "complete"', color: 'emerald', detail: 'Fetch paginated results → render funnel chart + data table' },
          { label: 'status: "error"', color: 'rose', detail: 'Show error message; "Retry" button; log queryId for debugging' },
        ],
      },
    ],
  },

  'high-level-architecture': {
    type: 'arch',
    title: 'Analytics UI System Architecture',
    layers: [
      { nodes: [{ label: 'Client SDK', sublabel: 'event collection', color: 'violet' }, { label: 'Browser UI', sublabel: 'report builder', color: 'violet' }] },
      { edgeLabel: 'stream events', nodes: [
        { label: 'Collector API', sublabel: 'high-throughput ingest', color: 'blue' },
        { label: 'Kafka', sublabel: 'durable event queue', color: 'amber' },
      ]},
      { edgeLabel: 'process + store', nodes: [{ label: 'ClickHouse', sublabel: 'columnar OLAP; 1B rows/second', color: 'emerald' }] },
      { edgeLabel: 'query execution', nodes: [
        { label: 'Query Service', sublabel: 'SQL DSL generator; cache check', color: 'blue' },
        { label: 'Redis Cache', sublabel: '5min TTL; keyed by query hash', color: 'amber' },
      ]},
      { edgeLabel: 'large results', nodes: [{ label: 'S3', sublabel: 'result storage; pre-signed URL returned', color: 'slate' }] },
    ],
  },

  'component-design': {
    type: 'tree',
    title: 'Component Hierarchy',
    root: {
      label: 'AnalyticsApp', color: 'violet',
      children: [
        { label: 'Sidebar', color: 'slate',
          children: [
            { label: 'NavItem', color: 'slate', note: 'Events / Funnels / Retention / Dashboards' },
            { label: 'SavedReports', color: 'slate' },
          ],
        },
        { label: 'ReportBuilder', color: 'violet',
          children: [
            { label: 'ReportToolbar', color: 'blue',
              children: [
                { label: 'DateRangePicker', color: 'slate', note: 'presets: 7d / 30d / 90d / custom' },
                { label: 'BreakdownPicker', color: 'slate', note: 'group by property dimension' },
                { label: 'RunButton', color: 'violet', note: 'loading={querying}' },
                { label: 'ExportButton', color: 'slate', note: 'CSV via pre-signed S3 URL' },
              ],
            },
            { label: 'QueryBuilderPanel', color: 'blue',
              children: [
                { label: 'StepBuilder', color: 'emerald', note: 'funnel: ordered step list',
                  children: [
                    { label: 'EventPicker', color: 'slate', note: 'searchable combobox of event names' },
                    { label: 'FilterChipList', color: 'slate', note: '"country = US", "plan = pro"' },
                  ],
                },
              ],
            },
            { label: 'ResultsPanel', color: 'amber',
              children: [
                { label: 'QueryStatusBar', color: 'slate', note: '"Running... 4.2s" or "Completed in 3.1s"' },
                { label: 'ChartContainer', color: 'blue', note: 'fixed-height div; Chart.js canvas inside' },
                { label: 'ResultsTable', color: 'slate', note: 'virtualised; sortable columns' },
              ],
            },
          ],
        },
      ],
    },
  },

  'scaling': {
    type: 'comparison',
    title: 'ClickHouse vs PostgreSQL for Analytics',
    columns: [
      {
        heading: 'ClickHouse (correct for analytics)',
        color: 'emerald',
        points: [
          'Columnar storage: reads only queried columns',
          'COUNT(*) + GROUP BY on 1B rows = seconds',
          'Processes 1B rows/second on a single node',
          'Partitioned by month: date filters skip irrelevant data',
          'LowCardinality columns: country, device_type',
          'Purpose-built for OLAP workloads',
        ],
      },
      {
        heading: 'PostgreSQL (wrong for analytics)',
        color: 'rose',
        points: [
          'Row-oriented: reads ALL columns even if you need one',
          'COUNT(*) + GROUP BY on 100M rows = minutes',
          'Full table scan without column pruning',
          'Indexes help for OLTP; not for aggregate scans',
          'Fine for user profiles, settings, metadata',
          'Will collapse under analytics query load at scale',
        ],
      },
    ],
  },
};

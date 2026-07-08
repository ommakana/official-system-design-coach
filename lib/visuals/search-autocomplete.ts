import { VisualData } from '@/types/visuals';

export const searchAutocompleteVisuals: Record<string, VisualData> = {

  'user-flow': {
    type: 'flow',
    title: 'Typing Flow — Keystroke to Suggestion',
    steps: [
      { label: 'User focuses search input', color: 'violet', detail: 'Dropdown initialises hidden; aria-expanded="false"' },
      { label: 'User types "r"', color: 'blue', detail: 'Debounce timer starts (150ms) — no request fired yet' },
      { label: 'User types "re" — debounce resets', color: 'blue', detail: 'Previous AbortController.abort() called — cancels any in-flight request' },
      { label: '150ms passes with no new keystroke → GET /suggest?q=re fires', color: 'emerald', detail: 'CDN checked first (5min TTL cache); sessionStorage checked second' },
      {
        label: 'Response arrives → dropdown renders suggestions',
        color: 'violet',
        detail: 'aria-expanded="true"; aria-activedescendant updated on arrow key navigation',
        branch: [
          { label: 'User presses Enter / clicks suggestion', color: 'emerald', detail: 'Navigate to search results; input filled with selected query' },
          { label: 'User presses Escape', color: 'slate', detail: 'Dropdown closes; input retains typed text' },
        ],
      },
    ],
  },

  'high-level-architecture': {
    type: 'arch',
    title: 'Search Autocomplete Architecture',
    layers: [
      { nodes: [{ label: 'Browser Client', sublabel: 'debounced + AbortController', color: 'violet' }] },
      { edgeLabel: '95%+ cache hit rate', nodes: [{ label: 'CDN Edge', sublabel: 'cache by prefix, 5min TTL', color: 'emerald' }] },
      { edgeLabel: 'cache miss', nodes: [{ label: 'Suggestion Service', sublabel: 'API gateway', color: 'blue' }] },
      { edgeLabel: '< 2ms lookup', nodes: [
        { label: 'Redis', sublabel: 'pre-computed top-K per prefix', color: 'amber' },
        { label: 'Trie Service', sublabel: 'in-memory fallback', color: 'slate' },
      ]},
      { edgeLabel: 'refreshed hourly', nodes: [{ label: 'Aggregation Pipeline', sublabel: 'Kafka → Spark → top-K per prefix', color: 'blue' }] },
    ],
  },

  'component-design': {
    type: 'tree',
    title: 'Component Hierarchy (ARIA combobox pattern)',
    root: {
      label: 'SearchBox', color: 'violet', note: 'manages keyboard + focus logic',
      children: [
        { label: 'SearchInput', color: 'blue', note: 'role=combobox, aria-autocomplete=list, aria-expanded, aria-activedescendant' },
        { label: 'SuggestionDropdown', color: 'violet', note: 'role=listbox; visible when isOpen',
          children: [
            { label: 'SuggestionItem', color: 'emerald', note: 'role=option, aria-selected={i === activeIndex}',
              children: [
                { label: 'SearchIcon', color: 'slate' },
                { label: 'HighlightedText', color: 'blue', note: 'bold matched prefix in suggestion' },
                { label: 'TrendingBadge', color: 'amber', note: 'shown if s.trending === true' },
                { label: 'CategoryChip', color: 'slate', note: 'product / video / person' },
              ],
            },
          ],
        },
      ],
    },
  },

  'scaling': {
    type: 'comparison',
    title: 'Redis Pre-computed Top-K vs Real-time Trie Traversal',
    columns: [
      {
        heading: 'Redis Pre-computed (production)',
        color: 'emerald',
        points: [
          'Aggregation job runs every 1h on query logs',
          'Computes top-20 per prefix and writes to Redis',
          'Lookup: O(1) Redis GET — under 2ms',
          'Handles 100K req/s across 50 Redis nodes',
          'Trending: compare last-1h vs last-24h frequency ratio',
          'CDN caches results — 95%+ traffic never hits Redis',
        ],
      },
      {
        heading: 'Real-time Trie Traversal (dev/small scale)',
        color: 'amber',
        points: [
          'Single Trie in memory: < 500MB for 10M unique queries',
          'O(prefix_length) traversal per request',
          'Cannot handle 100K req/s on one process',
          'Requires load balancing across 50+ nodes',
          'Used as fallback when Redis returns cache miss',
          'Refreshed hourly from aggregation job output',
        ],
      },
    ],
  },
};

import { DesignModule } from '@/types';

export const searchAutocompleteModule: DesignModule = {
  slug: 'search-autocomplete',
  title: 'Design Search Autocomplete',
  description: 'A real-time search suggestion system that returns ranked completions within 100ms for billions of queries — like Google Search or Amazon product search.',
  difficulty: 'Senior',
  companies: ['Google', 'Amazon', 'Airbnb', 'Twitter', 'Uber'],
  tags: ['Trie', 'Redis', 'Debounce', 'CDN Cache'],
  estimatedMinutes: 40,
  youtubeUrl: 'https://youtu.be/jVMqj8A7Fpk?si=5TNnVIHmuxm1f_t2',
  sections: [
    {
      id: 'functional-requirements',
      title: 'Functional Requirements',
      content: `Core (must have):
- Show up to 10 ranked suggestions as user types
- Results update within 100ms of each keystroke
- Suggestions ranked by: global popularity + recency + user history
- Support prefix matching: "reac" → ["react", "react hooks", "react native"]
- Handle misspellings: "gogle" → "google" suggestions
- Category-aware: search context (products, videos, people) affects results
- Click suggestion → navigates to search results page
- Keyboard navigation: arrow keys + Enter to select; Escape to close

Nice to have:
- Rich suggestions: images, prices, ratings (Amazon-style)
- Trending badge on rapidly rising queries
- Safe search filtering
- Localisation: suggestions in user's language and region`,
    },
    {
      id: 'non-functional-requirements',
      title: 'Non-Functional Requirements',
      content: `- Latency: p99 suggestion response < 100ms end-to-end
- Scale: 10B searches/day (Google scale); 100K requests/second at peak
- Freshness: trending topics appear in suggestions within 1 hour of trending
- Availability: 99.99% — search box is the most-used UI on the page
- Cache hit rate: > 95% of queries served from cache (most queries are common)
- Accuracy: top suggestion matches user intent > 80% of time
- Accessibility: full keyboard support; ARIA combobox pattern`,
    },
    {
      id: 'user-flow',
      title: 'User Flow',
      content: `Typing flow:
1. User focuses search input → dropdown initialises (empty, hidden)
2. First keystroke → debounce timer starts (150ms)
3. After 150ms → GET /suggest?q=r&limit=10 fired
4. Response arrives → dropdown renders with suggestions
5. Each additional keystroke resets debounce; previous request cancelled (AbortController)
6. User arrows down → focus moves to suggestion (aria-activedescendant updates)
7. User presses Enter / clicks suggestion → navigates; input filled with selection
8. User presses Escape → dropdown closes; input retains typed text

Cache / offline behaviour:
- Recently typed prefixes cached in sessionStorage (5 min TTL)
- If response takes > 2s: show "searching..." below input; don't show stale data
- If API fails: fail silently — hide dropdown; user can still submit full search`,
    },
    {
      id: 'high-level-architecture',
      title: 'High Level Architecture',
      content: `Request path (happy path):
Client → CDN Edge (cache by prefix, 5 min TTL)
       → API Gateway → Suggestion Service
                     ↓
              Redis: top-K per prefix (< 1ms)
              ↓ (cache miss)
              Trie Service (in-memory prefix search)

Data pipeline (keeps suggestions fresh):
Query Logs → Kafka → Aggregation Service (Spark/Flink, 1h window)
                   → Computes top-K per prefix
                   → Writes to Redis + Trie Service

Personalisation layer (optional):
Suggestion Service → fetch user's recent searches from User History Service
                   → merge global top-K with personal history (client-side blend)

Spell correction:
Suggestion Service → Spell Checker (edit distance index, pre-built offline)
                   → Returns corrected candidates when prefix yields 0 results

Key insight: suggestions are pre-computed, not computed on request.
The Suggestion Service is essentially a Redis cache lookup.`,
    },
    {
      id: 'component-design',
      title: 'Component Design',
      content: `<SearchBox>                           ← manages all keyboard and focus logic
  <SearchInput
    role="combobox"
    aria-autocomplete="list"
    aria-expanded={isOpen}
    aria-controls="suggestion-list"
    aria-activedescendant={activeId}
    value={query}
    onChange={handleChange}
    onKeyDown={handleKey}
  />
  {isOpen && (
    <SuggestionDropdown
      id="suggestion-list"
      role="listbox"
    >
      {suggestions.map((s, i) => (
        <SuggestionItem
          key={s.query}
          id={\`suggestion-\${i}\`}
          role="option"
          aria-selected={i === activeIndex}
          onClick={() => navigate(s.query)}
        >
          <SearchIcon />
          <HighlightedText text={s.query} highlight={query} />
          {s.trending && <TrendingBadge />}
          {s.category && <CategoryChip label={s.category} />}
        </SuggestionItem>
      ))}
    </SuggestionDropdown>
  )}
</SearchBox>

HighlightedText: bold the matched prefix in each suggestion — visual cue.`,
    },
    {
      id: 'state-management',
      title: 'State Management',
      content: `Local component state only — no global store needed:
\`\`\`ts
function useAutocomplete(limit = 10) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const abortRef = useRef<AbortController>();

  const fetchSuggestions = useDebouncedCallback(async (q: string) => {
    if (!q.trim()) { setSuggestions([]); return; }

    // Cancel previous in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    // Check sessionStorage cache first
    const cached = sessionStorage.getItem(\`suggest:\${q}\`);
    if (cached) { setSuggestions(JSON.parse(cached)); return; }

    try {
      const res = await fetch(\`/api/suggest?q=\${q}&limit=\${limit}\`, {
        signal: abortRef.current.signal,
      });
      const data = await res.json();
      setSuggestions(data.suggestions);
      sessionStorage.setItem(\`suggest:\${q}\`, JSON.stringify(data.suggestions));
    } catch (e) {
      if (e.name !== 'AbortError') setSuggestions([]);
    }
  }, 150);

  // Keyboard handler: ArrowDown/Up/Enter/Escape
}
\`\`\``,
    },
    {
      id: 'data-model',
      title: 'Data Model',
      content: `\`\`\`ts
// API response
interface SuggestResponse {
  suggestions: Suggestion[];
  queryTime: number;    // ms, for monitoring
  cached: boolean;      // from Redis or Trie?
}

interface Suggestion {
  query: string;          // the suggested search string
  score: number;          // ranking score (higher = shown first)
  trending: boolean;      // rising rapidly in last 1h
  category?: string;      // 'product' | 'person' | 'place' | 'video'
  imageUrl?: string;      // for rich suggestions (Amazon-style)
  subtitle?: string;      // e.g. product price or artist name
}

// Redis data structure
// Key:   suggest:{prefix}          e.g. "suggest:reac"
// Value: sorted set — member: query string, score: popularity score
// TTL:   300 seconds (refreshed by aggregation job)

// Trie node (in-memory, fallback for Redis miss)
interface TrieNode {
  children: Map<string, TrieNode>;
  topK: string[];     // pre-computed top-10 for this prefix
  isTerminal: boolean;
}
\`\`\`

Aggregation pipeline output:
For each prefix of length 1-20, store top-20 queries sorted by:
score = 0.7 × globalFrequency + 0.2 × recencyScore + 0.1 × personalScore`,
    },
    {
      id: 'scaling',
      title: 'Scaling',
      content: `CDN caching — the biggest win:
- Cache key: prefix + locale + safe_search_flag
- TTL: 5 minutes (balance freshness vs hit rate)
- Expected cache hit rate: 95%+ (most queries are common prefixes)
- Only cache misses reach API servers

Redis sharding:
- Shard by prefix hash — all "reac*" keys on the same Redis shard
- Cluster: 20 Redis nodes handles 1M ops/sec comfortably
- Key count: ~26^3 = 17K prefix keys for 3-char prefixes (very manageable)

Trie in-memory service:
- Single Trie fits in < 500MB RAM for 10M unique queries
- Load-balanced across 50 nodes (read-only; refreshed hourly from aggregation)
- Each node handles ~2000 req/s → 50 nodes = 100K req/s total

Aggregation freshness:
- Kafka captures all search queries in real-time
- Spark Streaming job: 1-hour sliding window, top-K per prefix
- Writes to Redis + signals Trie nodes to reload
- Trending detection: compare last-1h vs last-24h frequency ratio`,
    },
    {
      id: 'performance',
      title: 'Performance',
      content: `Frontend — under 150ms perceived latency:
- Debounce 150ms: prevents request on every keystroke; feels responsive
- AbortController: cancels previous request before firing new one — no stale results
- sessionStorage cache: previously typed prefixes are instant (< 1ms)
- Optimistic UI: show cached results immediately; update if server response differs

Server — under 50ms response time:
- Redis lookup: < 2ms (in-memory, same datacenter)
- JSON serialisation of 10 suggestions: < 1ms
- Total server time: ~5ms; 95ms budget left for network

Keyboard navigation — no jank:
- activeIndex stored in useState — O(1) render of active suggestion
- Suggestions wrapped in memo — only re-render when suggestions array changes
- aria-activedescendant updated in same render cycle — no double render

Ranking quality:
- Personalisation blended client-side: merge top-5 global + top-5 personal history
- Sort merged list by blended score → take top 10
- Client-side blend avoids server round-trip for personalisation`,
    },
    {
      id: 'interview-tips',
      title: 'Interview Tips',
      content: `1. Pre-computed top-K is the right answer — don't say "query the Trie on every request at scale". Pre-compute offline, serve from Redis
2. Debounce 150ms — specify the number and justify it (not 0ms = too many requests; not 500ms = feels sluggish)
3. AbortController — shows you prevent race conditions from out-of-order responses
4. CDN caching of suggestions — "cache by prefix at edge, 5min TTL" is a Senior signal
5. ARIA combobox pattern — name aria-autocomplete, aria-activedescendant, role="listbox" / role="option"
6. Trie vs Redis — explain when to use each: Redis for O(1) pre-computed results; Trie as fallback for cache misses
7. Trending freshness — interviewers always ask "how fast do new trends appear?" Answer: Kafka + 1h aggregation window`,
    },
  ],
};

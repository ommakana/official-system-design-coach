import { DesignModule } from '@/types';

export const infiniteFeedModule: DesignModule = {
  slug: 'infinite-feed',
  title: 'Design Infinite Feed',
  description: 'A social/news feed with virtualization, pagination, optimistic interactions, and real-time updates at massive scale.',
  difficulty: 'Senior',
  companies: ['Meta', 'Twitter/X', 'LinkedIn', 'Reddit', 'TikTok'],
  tags: ['Virtualization', 'Pagination', 'Real-time', 'Optimistic UI'],
  estimatedMinutes: 40,
  sections: [
    {
      id: 'problem',
      title: 'Problem Statement',
      content: `Design an infinite-scrolling news/social feed similar to Facebook News Feed, Twitter timeline, or LinkedIn feed.

Users should be able to scroll indefinitely through ranked posts, interact (like, comment, share) with instant feedback, and receive real-time updates when new content arrives — all without performance degradation at thousands of items.`,
    },
    {
      id: 'functional-requirements',
      title: 'Functional Requirements',
      content: `**Must have:**
- Infinite scroll: load next page of ranked posts as user approaches bottom
- Post types: text, image, video, link preview, poll
- Interactions: like, comment, share, save — all with instant optimistic UI
- Real-time: "X new posts" badge when feed updates; live like count increments
- Pull-to-refresh (mobile)
- Feed ranking algorithm (relevance + time decay — treat as black box API)

**Nice to have:**
- Post filtering by type or from specific connections
- "Why am I seeing this?" explanation
- Sponsored / promoted posts interleaved
- Stories row above feed
- Pause/resume auto-play video on scroll`,
    },
    {
      id: 'non-functional-requirements',
      title: 'Non-Functional Requirements',
      content: `- **Performance:** Scroll at 60fps even with 1000+ posts rendered; no layout shift on image load
- **TTI:** Feed visible within 1.5s on 4G; skeleton shown within 100ms
- **Memory:** DOM node count bounded despite infinite scroll (recycle off-screen nodes)
- **Accessibility:** Posts keyboard-navigable; interactions operable without mouse
- **Resilience:** Like/comment must not fail silently — queue if offline, show error state
- **Data freshness:** New posts surfaced within 30s without full page reload`,
    },
    {
      id: 'scale-constraints',
      title: 'Scale Constraints',
      content: `- 3B registered users (Facebook scale), 1.5B DAU
- 500M posts created/day (~6K posts/second at peak)
- Average user scrolls 300 posts/session; feed page = 10 posts
- Each post card: ~2KB JSON; page = 20KB + media
- Like events: ~50K/second peak
- p99 feed load: < 300ms
- Real-time: new post notifications within 30s`,
    },
    {
      id: 'apis',
      title: 'Expected APIs',
      content: `\`\`\`
GET  /feed?cursor=<opaque>&limit=10&rankingContext=home
     → { posts: Post[], nextCursor: string, hasMore: bool }

POST /posts/:id/like          → 204 (fire-and-forget from client)
DELETE /posts/:id/like        → 204
POST /posts/:id/comments      → { comment: Comment }
POST /posts/:id/share         → { shareId: string }

SSE  /feed/stream             → event: new_posts, data: { count: N }
     (polls fallback if SSE unavailable)

GET  /posts/:id               → single post (for deep-link / share)
\`\`\`

**Cursor vs offset pagination:** Always cursor-based for feeds. Offset breaks when new posts insert at the top — you get duplicate or skipped posts. Cursor is a ranked score snapshot.`,
    },
    {
      id: 'frontend-architecture',
      title: 'Frontend Architecture',
      content: `**Data fetching:** TanStack Query (React Query) with infinite query:
\`\`\`ts
const { data, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['feed'],
  queryFn: ({ pageParam }) => fetchFeed(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  staleTime: 30_000,
});
\`\`\`

**Virtualization — react-window or TanStack Virtual:**
\`\`\`ts
// Posts have variable height (text vs image) → use VariableSizeList
// Cache measured heights to avoid recalculation
const rowHeights = useRef<Record<number, number>>({});

const getItemSize = (index: number) => rowHeights.current[index] ?? 200;

const setRowHeight = (index: number, size: number) => {
  listRef.current?.resetAfterIndex(index);
  rowHeights.current[index] = size;
};
\`\`\`

**Intersection Observer for infinite load:**
\`\`\`ts
// Sentinel div 800px above real bottom — preloads before user hits end
const sentinelRef = useIntersectionObserver({
  onIntersect: fetchNextPage,
  rootMargin: '800px',
  enabled: hasNextPage && !isFetchingNextPage,
});
\`\`\`

**Optimistic interactions:**
\`\`\`ts
// Like — update cache immediately, rollback on error
mutate(postId, { onMutate: incrementLike, onError: decrementLike });
\`\`\``,
    },
    {
      id: 'backend-architecture',
      title: 'Backend Architecture',
      content: `**Feed ranking service:** Separate ML service; pre-computes ranked feed per user every ~5min; stores in Redis sorted set keyed by user_id.

**Fan-out on write vs read:**
- Small accounts (<10K followers): fan-out on write — push post to all follower feeds at post time
- Celebrities (>10K followers): fan-out on read — merge celeb posts at read time
- Hybrid: most production systems (Meta, Twitter) use hybrid

**Like service:** Redis counter (INCR/DECR) for real-time counts; async persist to DB every 60s. Avoids DB write storm from like events.

**CDN for media:** Images/videos served from edge CDN; feed JSON served from API CDN with short TTL (30s).

\`\`\`
Client → API Gateway → Feed Aggregator → Redis (user feed sorted set)
                                      → Post Service → PostgreSQL / Cassandra
                    → Like Service    → Redis counters → async DB sync
                    → Media CDN       → S3 + CloudFront
\`\`\``,
    },
    {
      id: 'component-hierarchy',
      title: 'Component Hierarchy',
      content: `\`\`\`
<FeedPage>
  <StoriesRow />                ← horizontal scroll, separate query
  <NewPostsBadge count={N} />  ← SSE-driven, click to scroll top + refresh
  <VirtualFeed>                ← react-window VariableSizeList
    <PostCard key={id}>
      <PostHeader />           ← avatar, name, time, options menu
      <PostContent>            ← text / image / video / link-preview
        <MediaGrid />          ← 1-4 images in CSS grid
        <VideoPlayer />        ← IntersectionObserver auto-play
        <LinkPreview />
      </PostContent>
      <ReactionBar />          ← like, comment, share counts + buttons
      <CommentsPreview />      ← top 2 comments inline
    </PostCard>
  </VirtualFeed>
  <LoadingSkeleton />          ← shown below last item while fetching
\`\`\``,
    },
    {
      id: 'state-management',
      title: 'State Management',
      content: `**TanStack Query** handles server state (feed pages, post data).
**Zustand** handles UI state (active modal, new-post count, optimistic likes).

\`\`\`ts
// Prefer local mutation over global event bus
// React Query's cache IS the source of truth for post data
queryClient.setQueryData(['post', postId], (old) => ({
  ...old,
  likeCount: old.likeCount + 1,
  likedByMe: true,
}));
\`\`\`

**Avoid:** putting all posts in Redux — defeats React Query's caching; creates stale-state complexity.`,
    },
    {
      id: 'performance',
      title: 'Performance & Virtualization',
      content: `**The core challenge:** Browser can't hold 1000 rendered post DOM nodes — each costs memory and layout time.

**Windowing strategy:**
- Only render ~10 posts visible in viewport + ~5 overscan above/below
- Off-screen posts remain as empty placeholder divs (height cached) — no re-mount cost on scroll back

**Image performance:**
- \`aspect-ratio\` CSS on images before they load — prevents layout shift (CLS = 0)
- \`loading="lazy"\` + \`fetchpriority="high"\` on first 3 images only
- Blur placeholder (LQIP) from server

**Video auto-play:**
- IntersectionObserver: play when 50% visible, pause on exit
- Use \`<video preload="none"\` initially; preload \`metadata\` when near viewport

**Bundle:**
- FeedPage: lazy-load PostModal, CommentThread
- Video player: dynamic import only when a video post is in range`,
    },
    {
      id: 'accessibility',
      title: 'Accessibility',
      content: `- Feed list: \`role="feed"\` (ARIA landmark for infinite lists)
- Each post: \`role="article"\`, \`aria-posinset={index}\`, \`aria-setsize={-1}\` (unknown total)
- Like button: \`aria-pressed={likedByMe}\`, \`aria-label="Like. 142 likes"\`
- New posts badge: \`aria-live="polite"\` — announces "15 new posts available"
- Video: captions required; custom controls keyboard-accessible
- Reduced motion: disable auto-play, disable fade-in animations`,
    },
    {
      id: 'tradeoffs',
      title: 'Tradeoffs',
      content: `| Decision | Chosen | Alternative | Why |
|---|---|---|---|
| Pagination | Cursor-based | Offset | Offset breaks with real-time inserts |
| Virtualization | react-window | Full render | 1000 DOM nodes degrades perf significantly |
| Like counting | Redis + async persist | DB write per like | DB can't handle 50K writes/sec |
| Fan-out | Hybrid | Write-only or Read-only | Pure write-fan-out collapses for celebrities |
| Real-time | SSE for new post count | Long poll | SSE simpler than WS when only server pushes |
| Video play | IntersectionObserver | Always-play | Always-play kills battery + data |`,
    },
    {
      id: 'interview-tips',
      title: 'Interview Tips',
      content: `1. **Start with post types** — "Are there videos? What's the max media count?" shapes your component design
2. **Call out cursor vs offset** — examiners always probe this; have the "duplicate posts" explanation ready
3. **Mention \`role="feed"\`** — it's the specific ARIA role for infinite lists; most candidates don't know it
4. **Quantify virtualization** — "1000 DOM nodes adds ~50ms per scroll event; windowing keeps it under 5ms"
5. **Discuss fan-out explicitly** — this is the backend gotcha; hybrid is the right answer
6. **Optimistic like with rollback** — don't just say "update immediately," describe the rollback
7. **Video auto-play + accessibility** — auto-play must respect \`prefers-reduced-motion\` and have a pause control`,
    },
    {
      id: 'common-mistakes',
      title: 'Common Mistakes',
      content: `Not using cursor pagination — offset pagination breaks in real-time feeds
Not virtualizing — "I'd just render all posts" fails at scale
Storing feed in Redux alongside React Query — two sources of truth for same data
Missing image aspect-ratio — causes layout shift (bad CLS score)
Fan-out on write for all accounts — collapses when a celebrity posts
No optimistic rollback strategy — "update then hope" isn't production-quality
Forgetting video accessibility — no captions, no pause control
Treating "infinite scroll" as just adding a scroll listener — missing IntersectionObserver, sentinel pattern`,
    },
  ],
};

import { VisualData } from '@/types/visuals';

export const infiniteFeedVisuals: Record<string, VisualData> = {

  'frontend-architecture': {
    type: 'arch',
    title: 'Infinite Feed Frontend Architecture',
    layers: [
      { nodes: [{ label: 'FeedPage', sublabel: 'React Client Component', color: 'violet' }] },
      {
        edgeLabel: 'server state',
        nodes: [
          { label: 'TanStack Query', sublabel: 'useInfiniteQuery + cache', color: 'blue' },
          { label: 'Zustand', sublabel: 'UI state + optimistic likes', color: 'blue' },
        ],
      },
      {
        edgeLabel: 'renders',
        nodes: [
          { label: 'react-window', sublabel: 'VariableSizeList', color: 'emerald' },
          { label: 'IntersectionObserver', sublabel: 'sentinel 800px ahead', color: 'slate' },
        ],
      },
      {
        edgeLabel: 'fetches',
        nodes: [
          { label: 'GET /feed?cursor=', sublabel: 'cursor-based pages', color: 'amber' },
          { label: 'SSE /feed/stream', sublabel: 'new-post count badge', color: 'amber' },
        ],
      },
    ],
  },

  'backend-architecture': {
    type: 'comparison',
    title: 'Fan-out Strategy: Regular User vs Celebrity',
    columns: [
      {
        heading: 'Fan-out on Write (< 10K followers)',
        color: 'emerald',
        points: [
          'Post created → push to all follower feeds immediately',
          'Feed reads are instant — pre-computed per user',
          'Write amplification: N follower writes per post',
          'Works fine for regular accounts with small audiences',
          'Stored as Redis sorted set keyed by user_id',
        ],
      },
      {
        heading: 'Fan-out on Read (> 10K followers)',
        color: 'violet',
        points: [
          'Post stored once — NOT pushed to each follower',
          'Feed read merges celeb posts at request time',
          'Read is slightly heavier but avoids write storm',
          'Used for celebrities, public figures, viral accounts',
          'Production: Meta, Twitter use hybrid of both strategies',
        ],
      },
    ],
  },

  'component-hierarchy': {
    type: 'tree',
    title: 'Component Hierarchy',
    root: {
      label: 'FeedPage', color: 'violet',
      children: [
        { label: 'StoriesRow', color: 'slate', note: 'separate query, horizontal scroll' },
        { label: 'NewPostsBadge', color: 'amber', note: 'SSE-driven, click to refresh' },
        {
          label: 'VirtualFeed', color: 'blue', note: 'react-window VariableSizeList',
          children: [
            {
              label: 'PostCard', color: 'emerald', note: 'role=article, aria-posinset',
              children: [
                { label: 'PostHeader', color: 'slate', note: 'avatar, name, time' },
                {
                  label: 'PostContent', color: 'slate',
                  children: [
                    { label: 'MediaGrid', color: 'slate', note: '1-4 images, aspect-ratio set' },
                    { label: 'VideoPlayer', color: 'slate', note: 'IntersectionObserver autoplay' },
                    { label: 'LinkPreview', color: 'slate' },
                  ],
                },
                { label: 'ReactionBar', color: 'violet', note: 'optimistic like/comment/share' },
                { label: 'CommentsPreview', color: 'slate', note: 'top 2 inline' },
              ],
            },
          ],
        },
        { label: 'LoadingSkeleton', color: 'slate', note: 'shown while fetching more' },
      ],
    },
  },

  'state-management': {
    type: 'flow',
    title: 'Optimistic Like Flow',
    steps: [
      {
        label: 'User taps Like button',
        color: 'violet',
        detail: 'aria-pressed flips immediately — no waiting',
      },
      {
        label: 'queryClient.setQueryData() — cache updated',
        color: 'blue',
        detail: 'likeCount +1, likedByMe: true — React re-renders button instantly',
      },
      {
        label: 'POST /posts/:id/like sent in background',
        color: 'slate',
        detail: 'Fire-and-forget from UX perspective',
        branch: [
          { label: 'Success (204)', color: 'emerald', detail: 'Cache already correct — nothing to do' },
          { label: 'Error', color: 'rose', detail: 'queryClient.invalidateQueries() — refetch real count' },
        ],
      },
      {
        label: 'SSE stream pushes real like count update',
        color: 'amber',
        detail: 'Server broadcasts aggregated count after Redis INCR — shown live to all viewers',
      },
    ],
  },

  'performance': {
    type: 'flow',
    title: 'Virtualization: How react-window Works',
    steps: [
      {
        label: 'User scrolls — scroll event fires',
        color: 'slate',
        detail: 'scrollTop position captured by VariableSizeList',
      },
      {
        label: 'Visible range calculated: [startIndex, stopIndex]',
        color: 'blue',
        detail: 'Based on scrollTop + container height + cached row heights',
      },
      {
        label: 'Only ~10 PostCards rendered in DOM',
        color: 'emerald',
        detail: 'Plus 5 overscan above/below viewport for smooth scroll',
      },
      {
        label: 'Off-screen posts = empty divs (height preserved)',
        color: 'amber',
        detail: 'Heights cached in rowHeights ref — no re-measurement on scroll back',
      },
      {
        label: 'Sentinel 800px below visible area fires IntersectionObserver',
        color: 'violet',
        detail: 'fetchNextPage() called — next cursor page loaded before user reaches end',
      },
    ],
  },
};

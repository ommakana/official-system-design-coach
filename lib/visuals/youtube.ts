import { VisualData } from '@/types/visuals';

export const youtubeVisuals: Record<string, VisualData> = {

  'user-flow': {
    type: 'flow',
    title: 'Video Upload Pipeline',
    steps: [
      { label: 'Creator selects file → client validates type/size', color: 'violet', detail: 'Client-side check before any bytes sent; TUS protocol for resumability' },
      { label: 'File chunked (5MB pieces) → uploaded to S3 via TUS', color: 'blue', detail: 'Upload Service streams chunks to object storage; progress tracked per chunk' },
      { label: 'All chunks received → SNS/SQS event fires', color: 'emerald', detail: 'Upload Service marks session complete; triggers async transcoding pipeline' },
      { label: 'Transcoding fleet (FFmpeg) produces each resolution', color: 'amber', detail: '360p → 480p → 720p → 1080p → 4K + thumbnail — all in parallel workers' },
      { label: 'Outputs pushed to CDN origin; video status → "public"', color: 'emerald', detail: 'Creator notified; video immediately streamable from CDN edge nodes' },
    ],
  },

  'high-level-architecture': {
    type: 'arch',
    title: 'YouTube System Architecture',
    layers: [
      { nodes: [{ label: 'Browser / App', sublabel: 'viewer or creator', color: 'violet' }] },
      { edgeLabel: '95% of video traffic', nodes: [{ label: 'CDN Edge Nodes', sublabel: 'Akamai + Fastly + CloudFront', color: 'emerald' }] },
      { edgeLabel: 'cache miss (5%)', nodes: [{ label: 'CDN Origin', sublabel: 'transcoded S3 segments', color: 'blue' }] },
      { edgeLabel: 'metadata + API', nodes: [
        { label: 'Video Service', sublabel: 'PostgreSQL — metadata, views', color: 'blue' },
        { label: 'Comment Service', sublabel: 'Cassandra — high write volume', color: 'slate' },
        { label: 'Recommendation', sublabel: 'ML pre-computed, Redis', color: 'amber' },
      ]},
      { edgeLabel: 'view counts', nodes: [{ label: 'Redis INCR', sublabel: '→ async flush to DB every 60s', color: 'amber' }] },
    ],
  },

  'component-design': {
    type: 'tree',
    title: 'Component Hierarchy',
    root: {
      label: 'VideoPage', color: 'violet',
      children: [
        { label: 'VideoPlayer', color: 'blue', note: 'custom <video> element wrapper',
          children: [
            { label: 'VideoElement', color: 'emerald', note: 'hls.js or native HLS (Safari)' },
            { label: 'ProgressBar', color: 'slate', note: 'click-to-seek; buffered range indicator' },
            { label: 'Controls', color: 'slate',
              children: [
                { label: 'PlayPauseButton', color: 'slate' },
                { label: 'VolumeSlider', color: 'slate' },
                { label: 'QualityPicker', color: 'amber', note: 'ABR override dropdown' },
                { label: 'CaptionsToggle', color: 'slate' },
                { label: 'FullscreenButton', color: 'slate' },
              ],
            },
            { label: 'BufferingSpinner', color: 'slate', note: 'shown when readyState < 3' },
          ],
        },
        { label: 'VideoMetadata', color: 'slate', note: 'title, views, likes, subscribe' },
        { label: 'CommentSection', color: 'violet',
          children: [
            { label: 'CommentList', color: 'blue', note: 'virtualised, cursor-paginated' },
          ],
        },
        { label: 'RecommendationSidebar', color: 'amber', note: 'pre-fetched on page load' },
      ],
    },
  },

  'state-management': {
    type: 'comparison',
    title: 'Player State vs Server State — Keep Them Separate',
    columns: [
      {
        heading: 'Player State → Local useState',
        color: 'blue',
        points: [
          'playing, paused, buffered (0–100%)',
          'currentQuality: "auto" | "1080p" | ...',
          'volume, isMuted — persisted to localStorage',
          'isFullscreen, isTheaterMode (Zustand)',
          'Self-contained — no global store needed',
          'videoRef.current drives the actual <video> element',
        ],
      },
      {
        heading: 'Server State → React Query',
        color: 'violet',
        points: [
          'Video metadata: useQuery(["video", videoId])',
          'Comments: useInfiniteQuery, cursor-paginated',
          'Recommendations: useQuery, prefetched on hover',
          'View count: navigator.sendBeacon (fire-and-forget)',
          'Like: optimistic mutation with rollback on error',
          'Never await view tracking — use sendBeacon',
        ],
      },
    ],
  },
};

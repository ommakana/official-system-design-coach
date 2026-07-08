import { DesignModule } from '@/types';

export const youtubeModule: DesignModule = {
  slug: 'youtube',
  title: 'Design YouTube',
  description: 'A video streaming platform with adaptive bitrate playback, upload pipeline, recommendations, and comment system at massive scale.',
  difficulty: 'Staff',
  companies: ['Google', 'Meta', 'Netflix', 'TikTok', 'Twitch'],
  tags: ['ABR', 'Streaming', 'CDN', 'Upload Pipeline'],
  estimatedMinutes: 60,
  sections: [
    {
      id: 'functional-requirements',
      title: 'Functional Requirements',
      content: `Core (must have):
- Upload video: chunked, resumable, up to 12 hours / 128GB
- Transcode to multiple resolutions: 360p, 480p, 720p, 1080p, 1440p, 4K
- Stream with adaptive bitrate: switch quality based on network conditions
- Video player: play/pause, seek, volume, fullscreen, captions, quality picker
- Recommendations: personalised home feed; "Up next" sidebar
- Comments: nested, sortable (Top / Newest), with likes and replies
- Search: full-text across titles, descriptions, tags; autocomplete
- Channel: subscribe, notification bell, upload history

Nice to have:
- Live streaming (separate ingest architecture)
- Chapters / timestamps in description
- Shorts (vertical < 60s, separate feed algorithm)
- Offline download (mobile — DRM-protected HLS)`,
    },
    {
      id: 'non-functional-requirements',
      title: 'Non-Functional Requirements',
      content: `- Playback start: video plays within 2s on 4G (first segment buffered)
- Buffering: < 1% rebuffer rate on stable connection
- Upload: 1GB file uploaded and available for viewing within 5 minutes
- Scale: 500 hours of video uploaded per minute; 1B daily active viewers
- Availability: 99.99% for playback; 99.9% for upload (uploads can retry)
- Storage: exabyte-scale; popular videos cached at edge; long-tail at origin
- Latency: recommendation feed < 200ms; comments < 500ms
- Accessibility: auto-captions (ASR); keyboard-navigable player; ARIA`,
    },
    {
      id: 'user-flow',
      title: 'User Flow',
      content: `Viewer — watching a video:
1. Home page → recommendation feed (pre-fetched server-side, personalised)
2. Click video → video page loads; player initialises with lowest quality segment
3. Manifest (m3u8/mpd) fetched → reveals all available quality levels
4. ABR algorithm picks quality based on measured bandwidth
5. Segments downloaded ahead of playback position (buffer 30s ahead)
6. Quality switches seamlessly mid-playback as bandwidth changes
7. Seek → discard buffer; fetch segment at new timestamp; resume in < 200ms

Creator — uploading a video:
1. Select file → client validates type/size; shows progress bar
2. File chunked into 5MB pieces; uploaded via TUS protocol to upload service
3. Upload service streams chunks to object storageOn completion → SNS/SQS event triggers transcoding job queue
5. Transcoding workers (FFmpeg) produce each resolution + thumbnail
6. Outputs pushed to CDN origin; video marked "processing"
7. All resolutions ready → video status flips to "public"; creator notified`,
    },
    {
      id: 'high-level-architecture',
      title: 'High Level Architecture',
      content: `Upload pipeline:
Client → Upload Service → S3 (raw) → SQS → Transcoding Fleet (FFmpeg)
                                                      ↓
                                               CDN Origin (transcoded segments)
                                                      ↓
                                               CDN Edge Nodes (cached globally)

Playback pipeline:
Client → CDN Edge (cache hit: 95% of traffic served here)
       → CDN Origin (cache miss: fetch transcoded segments from S3)

Metadata + API:
Client → API Gateway → Video Service (PostgreSQL — video metadata, views)
                    → Comment Service (Cassandra — high write volume)
                    → Search Service (Elasticsearch — full-text)
                    → Recommendation Service (ML — pre-computed per user)
                    → View Counter (Redis INCR → async DB flush)

Key insight: CDN absorbs 95%+ of all video traffic.
The API servers never touch video bytes — only metadata.`,
    },
    {
      id: 'component-design',
      title: 'Component Design',
      content: `<VideoPage>
  <VideoPlayer>                    ← custom <video> element wrapper
    <VideoElement src={hlsSrc} />  ← hls.js or native HLS (Safari)
    <ProgressBar />                ← click-to-seek; buffered range indicator
    <Controls>
      <PlayPauseButton />
      <VolumeSlider />
      <QualityPicker />            ← dropdown of available resolutions
      <CaptionsToggle />
      <FullscreenButton />
      <PiPButton />                ← Picture-in-Picture API
    </Controls>
    <BufferingSpinner />           ← shown when readyState < 3
  </VideoPlayer>
  <VideoMetadata>
    <Title /><ViewCount /><Timestamp />
    <LikeButton />                 ← optimistic; debounced PATCH
    <ShareButton />
    <SubscribeButton />            ← optimistic; stored in local state
  </VideoMetadata>
  <CommentSection>
    <CommentInput />
    <CommentList>                  ← virtualised; cursor-paginated
      <CommentItem>
        <ReplyThread />            ← lazy-loaded on expand
      </CommentItem>
    </CommentList>
  </CommentSection>
  <RecommendationSidebar>          ← pre-fetched on page load
    <VideoCard />                  ← thumbnail (loading=lazy), title, channel
  </RecommendationSidebar>`,
    },
    {
      id: 'state-management',
      title: 'State Management',
      content: `Player state — local component state (not global):
\`\`\`ts
// Player is self-contained — no need for global store
const [playing, setPlaying] = useState(false);
const [quality, setQuality] = useState<Quality>('auto');
const [buffered, setBuffered] = useState(0);  // 0–100%
const videoRef = useRef<HTMLVideoElement>(null);
\`\`\`

Server state — React Query:
- Video metadata: useQuery(['video', videoId])
- Comments: useInfiniteQuery(['comments', videoId], cursor-paginated)
- Recommendations: useQuery(['recommendations', videoId]) — prefetched on hover

Global UI state — Zustand:
- isTheaterMode, isMiniPlayer, volume (persisted to localStorage)
- currentVideoId (for "now playing" indicator across tabs)

View count — fire and forget:
\`\`\`ts
// Don't await — view count increment is non-critical
navigator.sendBeacon('/api/views', JSON.stringify({ videoId }));
// sendBeacon works even when user navigates away
\`\`\``,
    },
    {
      id: 'data-model',
      title: 'Data Model',
      content: `\`\`\`ts
interface Video {
  id: string;
  channelId: string;
  title: string;
  description: string;
  status: 'processing' | 'public' | 'unlisted' | 'private' | 'deleted';
  durationSeconds: number;
  thumbnailUrl: string;
  tags: string[];
  viewCount: number;      // Redis counter, async flush to DB
  likeCount: number;
  uploadedAt: Date;
  renditions: Rendition[];
}

interface Rendition {
  resolution: '360p' | '480p' | '720p' | '1080p' | '1440p' | '4k';
  bitrateKbps: number;
  codec: 'h264' | 'av1';
  manifestUrl: string;    // HLS .m3u8 on CDN
}

interface Comment {
  id: string;
  videoId: string;
  authorId: string;
  parentId?: string;      // null = top-level; set = reply
  content: string;
  likeCount: number;
  createdAt: Date;
  editedAt?: Date;
  deletedAt?: Date;       // soft delete (shows "comment removed")
}

interface WatchEvent {
  userId: string;
  videoId: string;
  watchedSeconds: number;
  completionPct: number;
  timestamp: Date;
  // Used by recommendation ML — never deleted
}
\`\`\``,
    },
    {
      id: 'scaling',
      title: 'Scaling',
      content: `Video storage:
- Raw uploads: S3 Standard (before transcoding)
- Transcoded segments: S3 + CloudFront CDN (edge-cached globally)
- Thumbnails: CDN with long TTL (immutable once created)
- Popular videos: multi-CDN (Akamai + Fastly + AWS) for highest availability

View count at scale (500M views/day = 5,800/sec peak):
- Redis INCR per videoId — atomic, < 1ms
- Background job flushes Redis counts to PostgreSQL every 60s
- Never write to DB on every view — it cannot sustain 6K writes/sec per video

Comments at scale:
- Cassandra: partition by videoId, cluster by createdAt DESC
- Top comments: pre-computed nightly by a batch job, stored in Redis
- Real-time comment stream (Live): Kafka + WS gateway (same as chat)

Recommendation serving:
- ML model runs offline (Spark) — produces ranked list per user every 6h
- Stored in Redis per userId; served in < 5ms
- Cold users (no history): use video-similarity model instead`,
    },
    {
      id: 'performance',
      title: 'Performance',
      content: `ABR (Adaptive Bitrate) — the core playback performance mechanism:
- Client measures download speed of each segment (bytes / time)
- If bandwidth > rendition bitrate × 1.5: upgrade quality
- If buffer < 10s or stall detected: downgrade quality immediately
- Never switch more than 1 quality level per segment (prevents thrashing)
- hls.js implements this algorithm — no need to build from scratch

Player startup optimisation:
- Preconnect to CDN origin in <link rel="preconnect">
- Prefetch first 2 segments on video hover (250ms hover intent delay)
- Poster image shown immediately while manifest loads (no blank black screen)

Thumbnail lazy loading on recommendation cards:
- IntersectionObserver; load when 200px from viewport
- WebP with AVIF fallback: 40-60% smaller than JPEG
- aspect-ratio: 16/9 set in CSS — prevents layout shift before image loads

Seek performance:
- HLS segments typically 2–6s — seeking snaps to nearest segment start
- Manifests list byte ranges — player can HTTP Range request mid-segment
- Player pre-fetches 2 segments around seek point for near-instant resume`,
    },
    {
      id: 'interview-tips',
      title: 'Interview Tips',
      content: `1. Lead with ABR — most candidates say "video player"; ABR shows real depth. Explain the bandwidth-measurement loop explicitly
2. CDN is the answer to scaling video — "99% of video bandwidth comes from CDN edge, not your servers" 
3. Redis for view counts — interviewers always probe this. "I'd INCR in Redis and flush every 60s" is the right answer
4. Distinguish upload pipeline from playback pipeline — they're completely separate architectures
5. sendBeacon for view events — shows you know browsers cancel XHR on navigation; beacon is fire-and-forget
6. Cassandra for comments — high write volume, time-series access pattern; explain why not PostgreSQL
7. Pre-compute recommendations offline — real-time ML inference at YouTube scale is not feasible; batch + cache is right`,
    },
  ],
};

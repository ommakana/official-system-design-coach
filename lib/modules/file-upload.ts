import { DesignModule } from '@/types';

export const fileUploadModule: DesignModule = {
  slug: 'file-upload',
  title: 'Design File Upload',
  description: 'A robust file upload system with chunked resumable uploads, progress tracking, preview generation, virus scanning, and CDN delivery.',
  difficulty: 'Senior',
  companies: ['Dropbox', 'Google', 'Box', 'Atlassian', 'Notion'],
  tags: ['Chunked Upload', 'TUS', 'CDN', 'Pre-signed URLs'],
  estimatedMinutes: 40,
  sections: [
    {
      id: 'functional-requirements',
      title: 'Functional Requirements',
      content: `Core (must have):
- Upload files up to 5GB; support images, videos, PDFs, Office docs, ZIP
- Chunked upload: survives network interruption; resume from last good chunk
- Real-time progress bar: accurate byte-level progress
- Client-side validation: type, size, count limits before any bytes sent
- Preview generation: thumbnail for images and videos; page 1 for PDFs
- Download with correct Content-Disposition filename
- Delete files (soft delete with TTL before hard delete)
- Storage quota enforcement per user/org

Nice to have:
- Multi-file drag-and-drop with queue management
- In-browser image cropping / resizing before upload
- Version history: replace file, keep prior versions
- Virus / malware scanning before download is allowed
- Shareable links with optional expiry and password`,
    },
    {
      id: 'non-functional-requirements',
      title: 'Non-Functional Requirements',
      content: `- Upload speed: limited only by user's internet — no server bottleneck
- Resumability: resume interrupted upload up to 7 days after pause
- Availability: 99.9% for uploads; 99.99% for downloads (CDN-served)
- Preview latency: thumbnail available within 10s of upload completing
- Virus scan: scan completes within 30s; file blocked for download until scanned
- Storage: exabyte-scale; active files on hot storage; old on cold (Glacier)
- Security: files accessible only to authorised users; no public URLs by default
- Compliance: GDPR delete within 30 days; audit log of all access`,
    },
    {
      id: 'user-flow',
      title: 'User Flow',
      content: `Upload flow:
1. User drags file into drop zone (or clicks to browse)
2. Client validates: MIME type whitelist, size limit, quota check (local + server)
3. Client requests upload session: POST /uploads → server returns uploadId + pre-signed URLs
4. Client splits file into 5MB chunks; uploads each chunk directly to S3 via pre-signed URL
5. For each chunk: track bytes uploaded → update progress bar (0–100%)
6. All chunks uploaded → POST /uploads/:id/complete → server triggers assembly + processing
7. Server assembles chunks in S3 → triggers async jobs: virus scan + preview generation
8. Client polls GET /uploads/:id/status (or WS event) → shows "Processing..."
9. Scan passes + preview ready → file status "ready"; thumbnail shown; download enabled

Resume flow:
1. Upload interrupted (network drop, browser close)
2. On return: GET /uploads/:id → server returns { uploadedChunks: [0, 1, 2] }
3. Client resumes from chunk 3; skips already-uploaded chunks
4. No bytes re-uploaded unnecessarily`,
    },
    {
      id: 'high-level-architecture',
      title: 'High Level Architecture',
      content: `Upload path (client → S3 directly, API never touches bytes):
Client → Upload Service → creates upload session in DB
                        → generates pre-signed S3 URLs per chunk
                        → returns { uploadId, chunkUrls[] }
Client → S3 directly (pre-signed URL) — bypasses API completely
Client → Upload Service: POST /complete → triggers processing pipeline

Processing pipeline (async):
S3 event (all chunks uploaded) → SQS → Assembly Worker: S3 multipart complete
                                     → Virus Scanner (ClamAV / SaaS) → tag file
                                     → Preview Worker (Sharp/FFmpeg) → thumbnail to S3
                                     → Upload Service: update status to 'ready'

Download path:
Client → File Service → verify permission → generate short-lived pre-signed S3 URL (15min)
Client → S3 / CDN directly (pre-signed URL) → file downloaded

CDN layer:
Public files: CloudFront with long TTL (content-addressed; immutable once processed)
Private files: signed CDN URLs with 15min expiry; never publicly cacheable`,
    },
    {
      id: 'component-design',
      title: 'Component Design',
      content: `<FileUploader>
  <DropZone
    onDrop={handleDrop}
    accept={ALLOWED_TYPES}
    aria-label="Drop files here or click to browse"
  >
    <DropZonePrompt />               ← icon + "Drag & drop or click to upload"
    <input type="file" hidden />
  </DropZone>

  <UploadQueue>                      ← list of files being uploaded
    <UploadItem key={fileId}>
      <FileIcon mimeType={type} />
      <FileName />
      <FileSize />
      <ProgressBar
        value={uploaded}
        max={total}
        aria-valuenow={pct}
        aria-label={\`\${name}: \${pct}% uploaded\`}
      />
      <UploadStatus>                 ← "Uploading..." | "Processing..." | "Ready" | "Failed"
      <RetryButton visible={failed} />
      <CancelButton visible={uploading} />
    </UploadItem>
  </UploadQueue>

  <FileGallery>                      ← already uploaded files
    <FileCard key={id}>
      <Thumbnail src={thumbUrl} loading="lazy" />
      <FileName />
      <FileMeta>size, type, date</FileMeta>
      <DownloadButton />
      <DeleteButton />
    </FileCard>
  </FileGallery>
</FileUploader>`,
    },
    {
      id: 'state-management',
      title: 'State Management',
      content: `Upload queue — Zustand (tracks in-progress uploads):
\`\`\`ts
interface UploadStore {
  queue: Record<string, UploadItem>;  // fileId → UploadItem
  addToQueue: (file: File) => string;
  updateProgress: (fileId: string, chunk: number, total: number) => void;
  setStatus: (fileId: string, status: UploadStatus) => void;
  removeFromQueue: (fileId: string) => void;
}

interface UploadItem {
  fileId: string;
  file: File;
  uploadId: string;           // server session ID
  status: 'pending' | 'uploading' | 'processing' | 'ready' | 'failed';
  uploadedBytes: number;
  totalBytes: number;
  uploadedChunks: Set<number>;
  retryCount: number;
}
\`\`\`

Chunked upload logic:
\`\`\`ts
async function uploadChunk(chunk: Blob, url: string, onProgress: (n: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => onProgress(e.loaded);
    xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(\`HTTP \${xhr.status}\`));
    xhr.onerror = reject;
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.send(chunk);
  });
}
// Use XHR not fetch — fetch has no upload progress API
\`\`\`

Completed files: React Query for the file gallery (paginated, invalidated on upload complete)`,
    },
    {
      id: 'data-model',
      title: 'Data Model',
      content: `\`\`\`ts
interface UploadSession {
  id: string;                   // uploadId
  userId: string;
  orgId?: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  chunkSize: number;            // 5MB
  totalChunks: number;
  uploadedChunks: number[];     // indices of completed chunks
  s3Key: string;                // final assembled object key
  status: 'uploading' | 'assembling' | 'scanning' | 'processing' | 'ready' | 'failed';
  expiresAt: Date;              // 7 days — abandon incomplete uploads
  createdAt: Date;
}

interface StoredFile {
  id: string;
  uploadSessionId: string;
  userId: string;
  orgId?: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  s3Key: string;                // raw file location
  thumbnailKey?: string;        // preview image S3 key
  virusScanStatus: 'pending' | 'clean' | 'infected' | 'error';
  isPublic: boolean;
  shareToken?: string;          // for shareable links
  shareExpiresAt?: Date;
  downloadCount: number;
  createdAt: Date;
  deletedAt?: Date;             // soft delete
}

interface QuotaUsage {
  userId: string;
  orgId?: string;
  usedBytes: number;
  limitBytes: number;           // plan-based
  fileCount: number;
}
\`\`\``,
    },
    {
      id: 'scaling',
      title: 'Scaling',
      content: `Why pre-signed URLs are essential at scale:
- Without: client → API → API proxies to S3. API becomes bottleneck for GB files
- With: client → S3 directly. API handles only metadata (< 1KB per request)
- At 10K concurrent uploads of 1GB each: without pre-signed = 10TB through API servers. With pre-signed = 0 bytes through API servers

Chunk size trade-offs:
- Too small (1MB): 1000 pre-signed URLs per 1GB file; high request overhead
- Too large (50MB): longer retransmission on failure; progress bar jumps
- Sweet spot: 5-10MB — proven by AWS, Dropbox, Notion

Parallel chunk uploads:
- Upload 3 chunks concurrently (configurable)
- Saturates most connections without overwhelming slow clients
- Total upload time ≈ (total_size / bandwidth) / parallelism_factor

Storage tiering:
- Uploaded < 30 days: S3 Standard (frequent access)
- 30–90 days: S3 Intelligent-Tiering
- > 90 days: S3 Glacier Instant Retrieval (10ms access, 60% cheaper)
- Deleted files: 30-day grace period then purged from all tiers`,
    },
    {
      id: 'performance',
      title: 'Performance',
      content: `Progress accuracy:
- Track at chunk level, not request level: uploaded = sum of completed chunk sizes + current chunk XHR progress
- UI updates at 60fps using requestAnimationFrame — smooth bar
- Show speed and ETA: ETA = (remaining bytes) / (rolling 5s average speed)

XHR vs Fetch for uploads:
- Fetch API has no upload progress (ReadableStream upload is experimental)
- XHR: xhr.upload.onprogress = exact byte count — the correct choice
- Wrap XHR in Promise for async/await ergonomics

Retry strategy:
\`\`\`
Chunk failure → wait 2^attempt seconds → retry up to 5 times
Exponential backoff: 1s, 2s, 4s, 8s, 16s
Total max wait: 31s per chunk before marking upload failed
\`\`\`

Thumbnail generation (Sharp on Node.js):
- JPEG thumbnail at 400×300 (fits most cards); WebP for modern browsers
- Generated in a separate worker (never blocks the API)
- Stored in S3 with long TTL immutable cache headers
- URL: /thumbnails/{fileId}/{width}x{height}.webp — CDN-cacheable`,
    },
    {
      id: 'interview-tips',
      title: 'Interview Tips',
      content: `1. Pre-signed S3 URLs — the single most important answer. "API never touches file bytes" shows architectural maturity
2. XHR not fetch for progress — Fetch has no upload progress; XHR.upload.onprogress is the right tool
3. Chunked + resumable — TUS protocol is the open standard; describe chunk tracking in DB, resume from server-reported offset
4. Virus scan is async — never block the upload response; scan post-assembly, block download until clean
5. Client-side validation first — check MIME type, size, quota before touching the network; saves bandwidth and bad UX
6. Chunk size justification — "5-10MB balances retry cost vs request overhead" shows you've thought through the tradeoff
7. Storage tiering — mentioning S3 Intelligent-Tiering or Glacier for old files shows cost awareness; relevant at Dropbox/Google scale`,
    },
  ],
};

import { VisualData } from '@/types/visuals';

export const fileUploadVisuals: Record<string, VisualData> = {

  'user-flow': {
    type: 'flow',
    title: 'Chunked Upload Flow — Client to CDN',
    steps: [
      { label: 'User drops / selects file', color: 'violet', detail: 'Client validates: MIME type whitelist, size limit, quota — all before any network request' },
      { label: 'POST /uploads → server returns uploadId + pre-signed chunk URLs', color: 'blue', detail: 'API handles only metadata — never touches file bytes' },
      { label: 'Client splits file into 5MB chunks; uploads each directly to S3', color: 'emerald', detail: 'XHR upload.onprogress tracks byte-level progress per chunk; 3 chunks in parallel' },
      {
        label: 'All chunks uploaded → POST /uploads/:id/complete',
        color: 'blue',
        detail: 'Triggers async processing pipeline',
        branch: [
          { label: 'Assembly Worker', color: 'emerald', detail: 'S3 multipart complete — joins chunks into final object' },
          { label: 'Virus Scanner', color: 'amber', detail: 'Async scan; file blocked for download until "clean"' },
          { label: 'Preview Worker', color: 'blue', detail: 'Sharp/FFmpeg generates thumbnail → stored in S3' },
        ],
      },
      { label: 'Status flips to "ready" → thumbnail shown, download enabled', color: 'violet', detail: 'Client receives WS event or polls GET /uploads/:id/status' },
    ],
  },

  'high-level-architecture': {
    type: 'arch',
    title: 'File Upload System Architecture',
    layers: [
      { nodes: [{ label: 'Browser Client', sublabel: 'XHR chunked upload', color: 'violet' }] },
      { edgeLabel: 'metadata only (JSON)', nodes: [{ label: 'Upload Service', sublabel: 'session + pre-signed URLs', color: 'blue' }] },
      { edgeLabel: 'file bytes (direct)', nodes: [{ label: 'Amazon S3', sublabel: 'raw chunks → assembled object', color: 'emerald' }] },
      { edgeLabel: 'S3 event → SQS', nodes: [
        { label: 'Virus Scanner', sublabel: 'ClamAV / SaaS', color: 'rose' },
        { label: 'Preview Worker', sublabel: 'Sharp + FFmpeg', color: 'amber' },
      ]},
      { edgeLabel: 'serve via', nodes: [{ label: 'CDN (CloudFront)', sublabel: 'long TTL, immutable URLs', color: 'emerald' }] },
    ],
  },

  'component-design': {
    type: 'tree',
    title: 'Component Hierarchy',
    root: {
      label: 'FileUploader', color: 'violet',
      children: [
        { label: 'DropZone', color: 'blue', note: 'role=region, aria-label, onDrop handler',
          children: [
            { label: 'DropZonePrompt', color: 'slate', note: 'icon + "Drag & drop or click"' },
          ],
        },
        { label: 'UploadQueue', color: 'violet', note: 'in-progress files',
          children: [
            { label: 'UploadItem', color: 'emerald', note: 'per file being uploaded',
              children: [
                { label: 'FileIcon', color: 'slate', note: 'MIME-type aware' },
                { label: 'ProgressBar', color: 'blue', note: 'aria-valuenow, byte-accurate' },
                { label: 'UploadStatus', color: 'amber', note: 'Uploading / Processing / Ready / Failed' },
                { label: 'RetryButton', color: 'rose', note: 'visible on failed state only' },
              ],
            },
          ],
        },
        { label: 'FileGallery', color: 'slate', note: 'already-uploaded files (React Query)',
          children: [
            { label: 'FileCard', color: 'slate',
              children: [
                { label: 'Thumbnail', color: 'slate', note: 'loading=lazy, aspect-ratio set' },
                { label: 'DownloadButton', color: 'emerald' },
                { label: 'DeleteButton', color: 'rose' },
              ],
            },
          ],
        },
      ],
    },
  },

  'state-management': {
    type: 'flow',
    title: 'Optimistic Upload with Retry',
    steps: [
      { label: 'File added to queue with status "pending"', color: 'slate', detail: 'Zustand UploadStore; fileId = client-generated UUID' },
      { label: 'Chunk upload starts → status "uploading"', color: 'blue', detail: 'updateProgress(fileId, uploadedBytes, totalBytes) called on XHR onprogress' },
      { label: 'Chunk fails', color: 'rose', detail: 'Exponential backoff: wait 2^attempt seconds; retry up to 5×',
        branch: [
          { label: 'Retry succeeds', color: 'emerald', detail: 'Continue to next chunk normally' },
          { label: 'Max retries exceeded', color: 'rose', detail: 'setStatus(fileId, "failed"); show RetryButton' },
        ],
      },
      { label: 'All chunks done → POST /complete → status "processing"', color: 'amber', detail: 'Poll or WS for scan + preview completion' },
      { label: 'Status "ready" → thumbnail visible, download enabled', color: 'emerald', detail: 'React Query invalidateQueries("files") to refresh gallery' },
    ],
  },
};

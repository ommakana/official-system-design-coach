import { DesignModule } from '@/types';

export const httpStatusCodesModule: DesignModule = {
  slug: 'http-status-codes',
  title: 'HTTP Status Codes',
  description: 'Every status code you\'ll actually use — what it means, when to send it, and the mistakes people make with each.',
  difficulty: 'Reference',
  companies: ['Every API ever'],
  tags: ['HTTP', 'REST', 'API Design', 'Web'],
  estimatedMinutes: 15,
  sections: [
    {
      id: '1xx-informational',
      title: '1xx — Informational',
      content: 'These are mostly handled automatically and are rarely returned directly by app code.\n\n| Code | Meaning | Typical use |\n|------|---------|-------------|\n| 100 | Server received the headers and is waiting for the body | Large uploads with Expect: 100-continue |\n| 101 | Protocol upgrade accepted | WebSocket or HTTP/2 upgrade handshake |',
    },
    {
      id: '2xx-success',
      title: '2xx — Success',
      content: 'Use these when the request was handled successfully.\n\n| Code | Meaning | When to use it |\n|------|---------|----------------|\n| 200 | OK | Standard success for GET or non-creating POSTs |\n| 201 | Created | Resource was created; include a Location header |\n| 202 | Accepted | Request accepted, processing continues asynchronously |\n| 204 | No Content | Success with no response body, such as DELETE or update-only requests |\n| 206 | Partial Content | Return only part of a resource for range requests |',
    },
    {
      id: '3xx-redirection',
      title: '3xx — Redirection',
      content: 'These tell the client to go somewhere else. They are especially important for URL changes and redirects after form submissions.\n\n| Code | Meaning | Best use |\n|------|---------|----------|\n| 301 | Moved Permanently | Permanent URL change; browsers cache it |\n| 302 | Found | Temporary redirect; method may change to GET |\n| 303 | See Other | Redirect after POST/PUT/DELETE to a GET page |\n| 304 | Not Modified | Cached copy is still fresh; do not resend the body |\n| 307 | Temporary Redirect | Like 302, but preserves the original method |\n| 308 | Permanent Redirect | Like 301, but preserves the original method |',
    },
    {
      id: '4xx-client-errors',
      title: '4xx — Client Errors',
      content: 'The client sent something invalid or not allowed. Retrying the same request usually will not help.\n\n| Code | Meaning | Common example |\n|------|---------|----------------|\n| 400 | Bad Request | Malformed JSON, missing fields, invalid structure |\n| 401 | Unauthorized | No credentials or expired token |\n| 403 | Forbidden | Authenticated but not allowed to access this resource |\n| 404 | Not Found | URL or resource does not exist |\n| 405 | Method Not Allowed | GET used on a POST-only endpoint |\n| 409 | Conflict | Duplicate username, optimistic lock, concurrent edit |\n| 410 | Gone | Resource was intentionally removed permanently |\n| 422 | Unprocessable Entity | Well-formed request, but business validation failed |\n| 429 | Too Many Requests | Rate limit hit; include Retry-After |',
    },
    {
      id: '5xx-server-errors',
      title: '5xx — Server Errors',
      content: 'These mean the server failed while handling the request. Retry may help, but only with backoff and for the right cases.\n\n| Code | Meaning | What it usually points to |\n|------|---------|----------------------------|\n| 500 | Internal Server Error | Unexpected crash or unhandled exception |\n| 501 | Not Implemented | Feature or method is not supported |\n| 502 | Bad Gateway | Upstream service returned a bad response |\n| 503 | Service Unavailable | Server is overloaded or under maintenance |\n| 504 | Gateway Timeout | Upstream dependency took too long |',
    },

  ],
};

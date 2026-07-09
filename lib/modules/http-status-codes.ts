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
      content: `Rarely sent directly by apps. The browser/server handles these behind the scenes.

**100 Continue**
Server tells client "I got your headers, send the body now."
Used when client sends \`Expect: 100-continue\` before uploading a large file.
→ Saves bandwidth if server would reject the request anyway.

**101 Switching Protocols**
Server agrees to upgrade the connection protocol.
Used for: WebSocket handshake (\`Upgrade: websocket\`), HTTP/2.
→ You'll never write this manually — your WS library handles it.`,
    },
    {
      id: '2xx-success',
      title: '2xx — Success',
      content: `**200 OK**
The default success. Request worked, body has the response.
GET → return the resource.
POST (non-creation) → return the result (e.g. search results, login tokens).

**201 Created**
Resource was created. Always include a \`Location\` header pointing to the new resource.
\`\`\`
POST /users → 201 Created
Location: /users/42
\`\`\`
→ Use this for POST requests that create something, not for all POSTs.

**202 Accepted**
Request received, but processing happens asynchronously.
\`\`\`
POST /reports/generate → 202 Accepted
{ "jobId": "abc123", "statusUrl": "/jobs/abc123" }
\`\`\`
→ Ideal for long-running jobs (video encoding, email send, PDF generation).

**204 No Content**
Success, but no body to return.
DELETE → 204 (resource gone, nothing to send back).
PUT/PATCH that updates without returning the object → 204.
→ Never send a body with 204, even empty \`{}\`. That's spec-invalid.

**206 Partial Content**
Used with \`Range\` requests — serving a chunk of a file.
→ Core to video streaming and resumable downloads.
\`\`\`
Range: bytes=0-1023 → 206 Partial Content
Content-Range: bytes 0-1023/12345
\`\`\``,
    },
    {
      id: '3xx-redirection',
      title: '3xx — Redirection',
      content: `**301 Moved Permanently**
Resource has a new URL forever. Browsers cache this aggressively.
→ Use for permanent URL restructuring (e.g. /blog → /articles).
 Hard to undo — browsers cache it until user clears cache.

**302 Found (Temporary Redirect)**
Temporarily at a different URL. Method may change to GET on redirect.
→ Use for temporary moves (maintenance page, A/B test redirect).

**303 See Other**
After a POST/PUT/DELETE, redirect to a GET resource.
The "Post/Redirect/Get" pattern — prevents form resubmission on refresh.
\`\`\`
POST /checkout → 303 See Other → GET /order-confirmation/789
\`\`\`

**304 Not Modified**
Client has a cached copy and it's still fresh. Don't resend the body.
Works with: \`If-Modified-Since\` / \`If-None-Match\` (ETag) request headers.
→ Saves bandwidth on static assets and API responses.

**307 Temporary Redirect**
Like 302, but method is preserved (POST stays POST on redirect).

**308 Permanent Redirect**
Like 301, but method is preserved. Use when redirecting POST endpoints permanently.`,
    },
    {
      id: '4xx-client-errors',
      title: '4xx — Client Errors',
      content: `The client sent something wrong. Retrying the same request won't help.

**400 Bad Request**
Generic "your request is malformed."
Missing required fields, wrong data types, invalid JSON structure.
→ Always include a body explaining what's wrong.

**401 Unauthorized** ← name is confusing, means unauthenticated
"I don't know who you are." No credentials, expired token, bad token.
→ Must include \`WWW-Authenticate\` header.
→ Client should re-authenticate and retry.

**403 Forbidden** ← means unauthorized (despite the name)
"I know who you are, but you can't do this."
Authenticated user trying to access someone else's resource.
→ Retrying with same credentials won't help.

**404 Not Found**
Resource doesn't exist at this URL.
→ Also returned intentionally to hide existence of private resources (vs 403).

**405 Method Not Allowed**
Wrong HTTP verb. GET on a POST-only endpoint.
→ Must include \`Allow\` header listing valid methods: \`Allow: GET, HEAD\`.

**409 Conflict**
Request conflicts with current state of the resource.
Duplicate username, optimistic locking conflict, concurrent edit collision.
→ Body should explain the conflict.

**410 Gone**
Resource existed but is permanently deleted. Unlike 404, this is definitive.
→ Use to tell crawlers to remove it from indexes.

**422 Unprocessable Entity**
Request is well-formed but semantically invalid.
Failed business validation (e.g. end date before start date).
→ Preferred over 400 for validation errors in REST APIs.
\`\`\`json
{ "errors": [{ "field": "endDate", "message": "must be after startDate" }] }
\`\`\`

**429 Too Many Requests**
Rate limit hit. Always include \`Retry-After\` header.
\`\`\`
Retry-After: 60
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1720000000
\`\`\``,
    },
    {
      id: '5xx-server-errors',
      title: '5xx — Server Errors',
      content: `The server messed up. Retrying may help (with backoff).

**500 Internal Server Error**
Unhandled exception — something crashed that shouldn't have.
→ Never expose stack traces in the body in production. Log server-side.

**501 Not Implemented**
Server doesn't support this feature at all.
→ Rarely used. Usually for HTTP methods the server doesn't support.

**502 Bad Gateway**
Your server is a proxy/gateway and the upstream service returned garbage.
→ Classic sign: nginx/load balancer got a bad response from your app server.

**503 Service Unavailable**
Server is temporarily down — overloaded or in maintenance.
→ Always include \`Retry-After\` so clients know when to try again.
→ Used for graceful degradation (feature flags, circuit breakers).

**504 Gateway Timeout**
Your proxy waited too long for the upstream service.
→ Classic sign: a database query or microservice call timed out.
→ Increase upstream timeout or fix the slow dependency.`,
    },
    {
      id: 'decision-guide',
      title: 'Quick Decision Guide',
      content: `**Which 2xx to use?**
- Creating a resource → **201** + Location header
- Async job started → **202**
- Success, no body → **204**
- Everything else → **200**

**Which 4xx to use?**
- Not logged in / bad token → **401**
- Logged in but not allowed → **403**
- URL doesn't exist → **404**
- Validation failed (semantic) → **422**
- Validation failed (structural) → **400**
- Duplicate / conflict → **409**
- Rate limited → **429**

**Idempotency:**
GET, PUT, DELETE, HEAD are idempotent — safe to retry.
POST is not — retry risks duplicate creation.
→ Use \`Idempotency-Key\` header for POST retries (Stripe pattern).

**REST method → expected success code:**
| Method | Creates? | Body? | Code |
|--------|----------|-------|------|
| GET    | No       | Yes   | 200  |
| POST   | Yes      | Yes   | 201  |
| POST   | No       | Yes   | 200  |
| PUT    | No       | No    | 204  |
| PATCH  | No       | No    | 204  |
| DELETE | No       | No    | 204  |`,
    },
    {
      id: 'common-mistakes',
      title: 'Common Mistakes',
      content: `**Returning 200 with an error body**
\`\`\`json
//  Don't do this
HTTP/1.1 200 OK
{ "success": false, "error": "User not found" }
\`\`\`
This breaks every HTTP client, monitoring tool, and API gateway.
Use the right status code. The body should add detail, not override the status.

**Confusing 401 and 403**
401 = "Who are you?" → client needs to authenticate first.
403 = "I know who you are, but no." → authentication won't help.
Mistake: returning 403 for expired tokens (should be 401).

**Using 404 when you mean 403**
Hiding that a resource exists: acceptable for security (private repos, user profiles).
But be consistent — pick one strategy and document it.

**Sending a body with 204**
204 means no content. Sending \`{}\` is technically invalid. Some clients ignore it.

**500 for validation errors**
If user sent bad input, that's a 4xx. 500 is only for unexpected server failures.
Returning 500 for a missing required field means your error handling is broken.

**No Retry-After on 429 or 503**
If you're throttling clients, you must tell them when to retry.
Without it, they'll hammer you in a tight loop.`,
    },
  ],
};

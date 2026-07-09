import { DesignModule } from '@/types';

export const contentSecurityPolicyModule: DesignModule = {
  slug: 'content-security-policy',
  title: 'Content Security Policy (CSP)',
  description: 'The HTTP header that tells browsers what resources your page is allowed to load — blocking XSS and data injection attacks at the browser level.',
  difficulty: 'Reference',
  companies: ['Every web app in production'],
  tags: ['Security', 'HTTP Headers', 'XSS', 'Browser'],
  estimatedMinutes: 15,
  sections: [
    {
      id: 'what-is-csp',
      title: 'What is CSP and Why It Exists',
      content: `CSP is an HTTP response header (or <meta> tag) that tells the browser:
"Only load scripts/styles/images/fonts from these sources. Block everything else."

**The problem it solves:**
XSS (Cross-Site Scripting) — attacker injects a <script> tag into your page.
Without CSP: browser happily runs the injected script. Cookies stolen, session hijacked.
With CSP: browser checks the source against your policy. Source not in the whitelist? Blocked.

**How it works:**
\`\`\`
Server sends:
Content-Security-Policy: script-src 'self'; img-src https:;

Browser reads HTML, sees <script src="https://evil.com/steal.js">
Checks: is evil.com in script-src? No.
Action: blocks the request. Logs a violation.
\`\`\`

CSP is a defence-in-depth layer. It doesn't prevent injection — it prevents execution.`,
    },
    {
      id: 'how-to-set-it',
      title: 'How to Set a CSP Header',
      content: `**Option 1 — HTTP Header (preferred)**
Set it in your server/framework. Applies to every response.
\`\`\`
# Express (Node)
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'nonce-{RANDOM}'; style-src 'self' 'unsafe-inline'"
  );
  next();
});
\`\`\`

**Option 2 — <meta> tag (limited)**
\`\`\`html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'">
\`\`\`
Limitation: cannot use frame-ancestors, report-uri, or sandbox directives in a meta tag.

**Report-Only mode (test before enforcing)**
\`\`\`
Content-Security-Policy-Report-Only: default-src 'self'; report-uri /csp-report
\`\`\`
Violations are logged to your endpoint but NOT blocked.
Use this to audit your policy before going live.`,
    },
    {
      id: 'essential-directives',
      title: 'Essential Directives',
      content: `Each directive controls a specific resource type. If a type has no directive, it falls back to \`default-src\`.

---

**default-src**
The catch-all fallback for any resource type not explicitly listed.
\`\`\`
default-src 'self'
\`\`\`
Sets a safe base. Then override specific types as needed.

---

**script-src**
Controls where JavaScript can be loaded from.
Most important directive — this is what stops XSS from executing.
\`\`\`
script-src 'self' https://cdn.jsdelivr.net
\`\`\`
- Allows scripts from your own origin + jsDelivr CDN.
- Blocks inline <script> tags and external unknown sources.

---

**style-src**
Controls where CSS can be loaded from.
\`\`\`
style-src 'self' https://fonts.googleapis.com 'unsafe-inline'
\`\`\`
- Inline styles are common (styled-components, Tailwind), so 'unsafe-inline' is often needed here.
- Less critical than script-src (CSS attacks are rarer and less severe).

---

**img-src**
Controls where images can be loaded from.
\`\`\`
img-src 'self' https: data:
\`\`\`
- \`https:\` allows any image over HTTPS.
- \`data:\` allows base64-embedded images (common in apps).

---

**connect-src**
Controls what URLs fetch(), XMLHttpRequest, WebSocket, EventSource can connect to.
Critical for SPAs that call APIs.
\`\`\`
connect-src 'self' https://api.yourapp.com wss://realtime.yourapp.com
\`\`\`
- If you miss an API domain here, all your fetch() calls to it will be blocked.

---

**font-src**
Controls where web fonts can be loaded from.
\`\`\`
font-src 'self' https://fonts.gstatic.com
\`\`\`

---

**frame-src**
Controls which URLs can be embedded in <iframe>.
\`\`\`
frame-src 'none'                    # block all iframes
frame-src https://youtube.com       # only YouTube embeds
\`\`\`

---

**frame-ancestors**
Flip of frame-src — controls who can embed YOUR page in an iframe.
Replaces the older X-Frame-Options header.
\`\`\`
frame-ancestors 'none'              # nobody can iframe your page (blocks clickjacking)
frame-ancestors 'self'              # only your own domain can iframe it
frame-ancestors https://parent.com  # allow a specific partner
\`\`\`

---

**form-action**
Controls where <form> elements can submit to.
\`\`\`
form-action 'self'    # forms can only post to your own domain
\`\`\`
Prevents phishing via injected forms that submit to attacker's server.

---

**object-src**
Controls Flash, Java, and plugin embeds (<object>, <embed>, <applet>).
\`\`\`
object-src 'none'   # just disable it — nobody uses Flash anymore
\`\`\`

---

**base-uri**
Controls what URLs can be used in a <base> tag.
\`\`\`
base-uri 'self'     # prevent attackers from redirecting all relative URLs
\`\`\``,
    },
    {
      id: 'source-keywords',
      title: 'Source Keywords Explained',
      content: `These appear as values inside directives. Quotes are required — they're part of the syntax.

| Keyword | Meaning |
|---|---|
| \`'self'\` | Same origin (scheme + domain + port must all match) |
| \`'none'\` | Block everything for this directive |
| \`'unsafe-inline'\` | Allow inline \`<script>\` and \`<style>\`. Weakens XSS protection — avoid for script-src |
| \`'unsafe-eval'\` | Allow eval(), Function(), setTimeout(string). Needed by some older libraries |
| \`'strict-dynamic'\` | Trusted scripts can load other scripts dynamically. Used with nonces |
| \`https:\` | Any URL over HTTPS (scheme-only wildcard) |
| \`data:\` | Data URIs (base64 embedded content) |
| \`blob:\` | Blob URLs (common for file downloads, canvas exports) |

---

**Nonces — the right way to allow inline scripts**
A nonce is a random token generated per request. The browser only runs inline scripts that carry the matching nonce.
\`\`\`html
<!-- Server generates a new nonce every request -->
Content-Security-Policy: script-src 'nonce-abc123xyz'

<!-- Only this script runs — the nonce matches -->
<script nonce="abc123xyz">
  // your inline code
</script>

<!-- This is blocked — no nonce -->
<script>alert('xss')</script>
\`\`\`
Nonces make 'unsafe-inline' unnecessary for scripts while still allowing your own inline code.

---

**Hashes — alternative to nonces**
\`\`\`
script-src 'sha256-abc123...=='
\`\`\`
Browser computes SHA-256 of the inline script. If it matches, it runs.
Good for static inline scripts that never change (e.g. analytics snippets).`,
    },
    {
      id: 'reporting',
      title: 'Violation Reporting',
      content: `CSP can report violations to an endpoint you control — essential for catching policy gaps before users notice.

**report-uri (older, but widely supported)**
\`\`\`
Content-Security-Policy: default-src 'self'; report-uri /csp-violations
\`\`\`
Browser POSTs a JSON body to /csp-violations on every violation.
\`\`\`json
{
  "csp-report": {
    "document-uri": "https://yourapp.com/dashboard",
    "violated-directive": "script-src",
    "blocked-uri": "https://evil.com/steal.js",
    "source-file": "https://yourapp.com/index.html",
    "line-number": 42
  }
}
\`\`\`

**report-to (newer, preferred)**
\`\`\`
Report-To: {"group":"csp","max_age":86400,"endpoints":[{"url":"/csp-report"}]}
Content-Security-Policy: default-src 'self'; report-to csp
\`\`\`

**Workflow for deploying a new CSP:**
1. Start with \`Content-Security-Policy-Report-Only\` + report endpoint
2. Monitor violations for 1-2 weeks — add missing sources to the policy
3. When violations stop, switch header to \`Content-Security-Policy\`
4. Keep report-to active in enforce mode to catch future gaps`,
    },
    {
      id: 'full-example',
      title: 'Production-Ready Example',
      content: `A solid starting point for a React/Next.js SPA calling its own API:

\`\`\`
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{SERVER_NONCE}' 'strict-dynamic';
  style-src 'self' 'unsafe-inline';
  img-src 'self' https: data: blob:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.yourapp.com wss://realtime.yourapp.com;
  frame-src 'none';
  frame-ancestors 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
  report-to csp;
\`\`\`

**What each line buys you:**
- \`default-src 'self'\` — safe base, unknown types blocked
- \`script-src\` with nonce — your scripts run, injected ones don't
- \`style-src 'unsafe-inline'\` — Tailwind/CSS-in-JS works; acceptable risk
- \`img-src https:\` — any HTTPS image (user avatars, CDN, etc.)
- \`connect-src\` — your fetch() calls work, unknown API calls blocked
- \`frame-ancestors 'none'\` — clickjacking blocked
- \`object-src 'none'\` — plugins disabled
- \`base-uri 'self'\` — base tag hijacking blocked
- \`form-action 'self'\` — forms can't be hijacked to post elsewhere
- \`upgrade-insecure-requests\` — HTTP subresources auto-upgraded to HTTPS`,
    },
    {
      id: 'common-mistakes',
      title: 'Common Mistakes',
      content: `**Using 'unsafe-inline' on script-src**
This negates most of CSP's XSS protection. Any injected inline script will run.
Fix: use nonces or hashes instead.

**Using wildcard * for script-src**
\`script-src *\` allows scripts from any URL. Might as well have no CSP.
Fix: enumerate the exact CDN domains you use.

**Forgetting connect-src**
Your policy allows scripts, but all your fetch() calls are blocked in the browser console.
Fix: always include connect-src with your API domains.

**Not accounting for blob: and data:**
File download features or canvas-to-image breaks silently.
Fix: add \`blob:\` to \`img-src\` and \`worker-src\` if you use Web Workers.

**Setting it only on the HTML page, not on API responses**
CSP on your API JSON responses does nothing useful.
Set it on HTML responses only.

**Not using Report-Only first**
Deploying a strict CSP to production without testing breaks things for users.
Fix: always audit with Report-Only + monitoring for at least a week.

**Not regenerating the nonce per request**
A static nonce defeats the purpose — attackers can predict it.
Fix: \`crypto.randomBytes(16).toString('base64')\` on every request.`,
    },
  ],
};

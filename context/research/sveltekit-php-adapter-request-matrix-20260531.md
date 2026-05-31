# SvelteKit PHP Adapter — Request Matrix (Draft)

**Status:** Draft — needs verification against actual build output  
**Purpose:** Single-source-of-truth for what every HTTP request through the adapter should return

## Matrix

| # | Request | Expected Status | Content-Type | Mode | Notes |
|---|---|---|---|---|---|
| 1 | `GET /` | 200 | text/html | both | Root page |
| 2 | `GET /ssr-data` | 200 | text/html | both | Page with server data |
| 3 | `GET /ssr-data/__data.json` | 200 | application/json | both | Client nav data request |
| 4 | `GET /parent-child/nested` | 200 | text/html | both | Nested route |
| 5 | `GET /parent-child/nested/__data.json` | 200 | application/json | both | Nested data with layout merge |
| 6 | `GET /form-basic` | 200 | text/html | both | Basic form page |
| 7 | `POST /form-basic` | 303/200 | text/html | both | Form action (PHP) |
| 8 | `GET /form-multipart` | 200 | text/html | both | Multipart form page |
| 9 | `POST /form-multipart` | 303/200 | text/html | php-static 🟡 | Limited PHP bridge |
| 10 | `POST /form-multipart` | 303/200 | text/html | node-ssr ✅ | Full SvelteKit action |
| 11 | `GET /stream` | 200 | text/html | php-static 🟡 | Static page |
| 12 | `GET /stream` | 200 | text/html (chunked) | node-ssr ✅ | Real streaming |
| 13 | `GET /negotiate` | 200 | text/html | both | Accept: text/html |
| 14 | `GET /negotiate` | 200 | application/json | both | Accept: application/json |
| 15 | `GET /negotiate` (no Accept) | 200 | text/html | both | Default to page |
| 16 | `GET /api/ping` | 200 | application/json | both | PHP endpoint |
| 17 | `GET /status?code=404` | 404 | text/html | both | Server-side 404 |
| 18 | `GET /status?code=500` | 500 | text/html | both | Error page |
| 19 | `GET /redirect-me` | 308 | — | both | Redirect (trailing slash) |
| 20 | `GET /preload` | 200 | text/html | both | Preload test |
| 21 | `GET /preload/__data.json` | 200 | application/json | both | Preload data |
| 22 | `GET /error-throw` | 500 | text/html | both | Deliberate error |
| 23 | `GET /__health` | 200 | application/json | both | Health check |
| 24 | `GET /__ready` | 200 | application/json | both | Readiness check |
| 25 | `GET /nonexistent-page` | 404 | text/html | both | Unknown route |
| 26 | `GET /_protected/` | 403 | — | both | Protected access denied |
| 27 | `GET /_app/immutable/entry-*.js` | 200 | application/javascript | both | Immutable asset (1yr cache) |
| 28 | `GET /_app/version.json` | 200 | application/json | both | App version |
| 29 | `POST /actions/basic` | 303/200 | text/html | php-static ❌ | JS server file — no PHP bridge |
| 30 | `POST /actions/basic` | 303/200 | text/html | node-ssr ✅ | Full SvelteKit action |
| 31 | `GET /__data.json` (on route with no prerendered data) | 404 | application/json | both | No data for route |
| 32 | `GET /ssg/simple` | 200 | text/html | both | Static generated page |
| 33 | `GET /client-side` | 200 | text/html | both | Client-rendered page |
| 34 | `GET /base-path/test` (when deployed under subpath) | 200 | text/html | both | Base path mounting |

## Key

- ✅ = fully supported and tested
- 🟡 = supported with limitations
- 🔴 = not supported (known gap)
- ❌ = not supported (by design — see notes)
- both = works in both php-static and node-ssr modes

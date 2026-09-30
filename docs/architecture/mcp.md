# GYMS MCP

GYMS (the `/admin` management system) is also exposed as a remote
[Model Context Protocol](https://modelcontextprotocol.io) server, so MCP
clients (Claude.ai / Claude Desktop connectors, Claude Code, Cursor, ...) can
do what the admin pages do, limited by the signed-in user's role.

- Endpoint: `https://gdgoc.yonsei.ac.kr/api/mcp` (Streamable HTTP, stateless)
- Design spec: [`docs/superpowers/specs/2026-09-27-gyms-mcp-design.md`](../superpowers/specs/2026-09-27-gyms-mcp-design.md)

## Connecting

| Client              | How                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------- |
| Claude Code         | `claude mcp add --transport http gyms https://gdgoc.yonsei.ac.kr/api/mcp`                   |
| Claude.ai / Desktop | Settings → Connectors → Add custom connector → paste the endpoint URL                       |
| Cursor              | `mcp.json`: `{ "mcpServers": { "gyms": { "url": "https://gdgoc.yonsei.ac.kr/api/mcp" } } }` |

The client opens a browser, you sign in with the usual GitHub / Google /
passkey login, and a consent screen (`/auth/mcp-consent`) lets you pick the
scopes for that connection. UNVERIFIED accounts cannot connect.

## Architecture

```
MCP client ──► POST /api/mcp (no token) ─► 401 + WWW-Authenticate: resource_metadata=…
          ──► GET /.well-known/oauth-protected-resource/api/mcp        (RFC 9728)
          ──► GET /.well-known/oauth-authorization-server/api/auth     (RFC 8414)
          ──► CIMD client_id URL, or POST /api/auth/oauth2/register    (DCR)
          ──► browser: /api/auth/oauth2/authorize → /auth/sign-in → /auth/mcp-consent
          ──► POST /api/auth/oauth2/token (PKCE S256) → JWT access token
          ──► POST /api/mcp (Bearer)
                 app/api/mcp/route.ts      requireMcpAuth (JWKS) → actorFromClaims (role from DB)
                 lib/mcp/server.ts         one McpServer per request, only the actor's tools
                 lib/mcp/tools/*.ts        zod input → service → CallToolResult
                 lib/server/services/admin/*.ts   shared with the web Server Actions
```

- **Authorization server**: Better Auth with `jwt()`, `@better-auth/mcp` and
  `@better-auth/cimd` ([`auth.ts`](../../auth.ts)). Tokens are audience-bound
  to `/api/mcp`.
- **Service layer**: every admin mutation lives in
  `lib/server/services/admin/*`, takes an explicit `Actor`
  (`{ userId, role, scopes, via }`) and returns a `ServiceResult`. The web
  Server Actions and the MCP tools are thin adapters over the same functions,
  so permission checks, validation and cache invalidation cannot drift apart.
- **Cache invalidation**: `updateTag` only works in Server Actions. The MCP
  route runs tools inside `runWithRouteHandlerInvalidation`, where
  `updateCacheTags` switches to `revalidateTag(tag, { expire: 0 })`
  ([`invalidation-context.ts`](../../lib/server/cache/invalidation-context.ts)).

## Permissions

A tool call is allowed only when all three hold:

1. the access token carries the tool's scope,
2. the role matrix in [`check-permission.ts`](../../lib/server/permission/check-permission.ts)
   allows the action (including ownership, e.g. a MEMBER edits only their own projects),
3. non-LEAD users act only inside the generations of parts they belong to.

`tools/list` only returns tools the role could ever use with the granted
scopes; ownership is checked when the tool runs.

Rules for member data (web and MCP alike):

- **Contact details** (email, telephone, student id) are visible only to the
  member, a LEAD, or someone who shares a generation with them. Other callers
  get `null` for those fields. Names, parts and generations stay visible.
- **Editing members:** anyone can edit their own profile. A LEAD can edit
  anyone. A CORE can edit only MEMBER, ALUMNUS and UNVERIFIED members who share
  a generation with them.
- **Email changes:** only the member themselves or a LEAD can change an email
  (sign-in links accounts by email, so changing someone else's would hand over
  their account).

| Scope        | Unlocks                                                                              |
| ------------ | ------------------------------------------------------------------------------------ |
| `gyms:read`  | All read tools                                                                       |
| `gyms:write` | Create/update, session registration, participant removal, image uploads, own profile |
| `gyms:admin` | Deletes, pending sign-ups, approvals, role changes                                   |

| Role       | What MCP can do                                                                                             |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| LEAD       | Everything                                                                                                  |
| CORE       | Sessions, projects, parts and members CRUD; delete sessions and projects. No role or generation management. |
| MEMBER     | Read sessions and projects, create projects, edit own projects, register for sessions, own profile          |
| ALUMNUS    | Read sessions and projects, register for sessions, own profile                                              |
| UNVERIFIED | Cannot connect                                                                                              |

The role is read from the database on every request, so demoting or deleting
a user cuts off MCP access immediately. Tokens are JWTs: access tokens live
1 hour (15 minutes when `gyms:admin` is granted), refresh tokens 30 days.

## Tools

| Area        | Tools                                                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Context     | `whoami`                                                                                                                                                     |
| Generations | `list_generations`, `get_generation`, `create_generation`, `update_generation`, `delete_generation`                                                          |
| Parts       | `list_parts`, `get_part`, `create_part`, `update_part`, `delete_part`                                                                                        |
| Members     | `list_members`, `get_member`, `update_member`, `list_pending_members`, `approve_member`, `update_member_role`, `delete_member`                               |
| Profile     | `get_my_profile`, `update_my_profile`                                                                                                                        |
| Projects    | `list_projects`, `get_project`, `create_project`, `update_project`, `delete_project`                                                                         |
| Sessions    | `list_sessions`, `get_session`, `create_session`, `update_session`, `register_session`, `unregister_session`, `remove_session_participant`, `delete_session` |
| Images      | `create_image_upload`, `complete_image_upload`, `import_image_from_url`                                                                                      |

- Update tools are partial: omitted fields keep their current values.
- Session times without an offset are Seoul wall-clock time; offsets are
  converted to Seoul time.
- `create_session` with `internalOpen` emails the generation's members, as on
  the web.
- An explicit `generationId` you cannot access returns `FORBIDDEN` (omit it
  for your default generation).
- `list_sessions` with `openForRegistration` leaves out ended and full
  sessions; each row carries `participantCount`.
- `update_session` on an older session without dates needs both `startAt` and
  `endAt` in the same update.

### Images (up to 200MB, Cloudflare R2)

- Clients with a shell: `create_image_upload` returns a presigned PUT URL
  whose signature covers `Content-Type` and `Content-Length`; upload with
  `curl`, then `complete_image_upload` (with the returned `uploadToken`, which
  binds the key to your own upload for one hour) checks size and magic bytes and
  returns the public URL. Invalid files are deleted.
- Clients without a shell: `import_image_from_url` streams a public https
  image into an R2 multipart upload (no buffering). Private, loopback and
  link-local addresses are refused on every redirect hop and again at
  connect time (DNS rebinding).
- Accepted: jpg, jpeg, png, webp, gif, avif. SVG is refused.
- Image fields in create/update tools accept only URLs returned by these
  tools, under the matching prefix (`sessions/`, `projects/`, `users/`).
- Limit: 100 upload attempts (direct + imports) per user per hour, counted
  atomically; failed and rejected attempts count too. Past that the tools
  return `RATE_LIMITED`. Attempts are recorded in `mcp_image_upload`; each new
  upload request leases up to 20 that expired without completing, deletes
  their R2 objects and only then settles their records, which keep counting
  toward the hour (a failed delete is retried
  after the lease ends). An upload that cleanup already claimed can no longer
  be completed.
- Remote imports block private, loopback, link-local, IPv4-compatible,
  6to4, local NAT64 and discard-only ranges. They wait up to 30 seconds for
  response headers and 10 minutes for the whole transfer.

## Audit log

Every write/admin tool call, successful or not, is stored in
`mcp_audit_log` with the user, role, OAuth client id and name, tool,
sanitized input, outcome and target id (taken from the input when the call
failed). Sanitizing redacts secret-like keys and email, telephone and student
id values, drops URL query strings (signed URLs) and truncates long strings.
Rows older than one year are deleted automatically.

```sql
select "createdAt", tool, outcome, "errorCode", "targetId", "clientId"
from mcp_audit_log
where "userId" = $1
order by "createdAt" desc
limit 50;
```

## Known limits

- Access tokens are stateless JWTs. Revoking a connection without changing
  the user's role takes effect when the access token expires (≤ 1 hour).
- Very large originals are served through `next/image`; the first optimized
  request for a 200MB image is slow.
- There is no UI yet for listing or revoking connected clients, or for
  browsing the audit log.

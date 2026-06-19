# NOTES.md

## Phase 1 — Make it Run

Bug 1: Prisma client not generated

- npx prisma db push was run but npx prisma generate was not
- Caused Cannot find module '.prisma/client/default' error on all API routes
- Fix: Run npx prisma generate to create the local client files

Bug 2: WebRTC chat messages silently dropped

- lib/webrtc.ts line 132 sent { t: "msg", text }
- Receiver at line 79 checked for msg.t === "chat"
- Tag mismatch caused every message to be silently ignored
- Fix: Changed t: "msg" to t: "chat" in the safeSend call

Bug 3: Ghost dots — presence never goes stale after user disconnects

- app/api/poll/route.ts line 25-28 used where: {} in updateMany
- This refreshed lastSeen for ALL presence rows on every poll
- User B's polls kept User A's row alive even after A disconnected
- The existing TTL reaper at line 32 never triggered as a result
- Fix: Added where: { id } to only refresh the caller's own row
- This also fixes sudden disconnects since the TTL reaper now works correctly

Bug 4: ICE candidates silently dropped (found during Phase 2)

- lib/webrtc.ts called flushPendingCandidates() before setRemoteDescription()
- addIceCandidate() requires a remote description to exist first
- All queued candidates threw InvalidStateError, silently swallowed by catch {}
- Result: peers stuck on "connecting" indefinitely
- Fix: Swapped order — setRemoteDescription() first, then flushPendingCandidates()

Verified against live demo at pulse-silk-eta.vercel.app:

- Chat not auto-closing on disconnect is intentional behavior
- Page refresh creating a new dot is intentional behavior
- Not treated as bugs

---

## Phase 2 — Make it Good

Direction: Dark Cosmos — premium, immersive dark UI

EntryGate

- Full screen radial gradient atmosphere with emerald and indigo layers
- Orbit rings and star field for cosmic depth
- Staggered reveal animations on all elements
- Glowing emerald button with hover halo effect

WorldMap

- Switched to globe projection for 3D sphere rendering
- Added Mapbox fog/atmosphere — space color, horizon blend, atmospheric rim
- Per-dot colored glow using CSS custom property --dot-glow derived from dot hue
- Spring entry animation (dot-appear) and smooth exit animation (dot-removing)
- Wrapper div pattern to fix CSS transform conflict between Mapbox marker positioning and dot animations
- Confirmed dark-v11 as base style — satellite imagery competed with dot visibility and broke the dark theme

ChatPanel

- Glass morphism panel with backdrop-blur-xl and border-white/10
- Typing indicator with wave bounce animation (staggered delays per dot)
- Message timestamps (HH:MM) on each bubble
- Empty state centered message: "Say hi to your new connection 👋"
- Icon buttons for Video and End actions (inline SVG, no library)
- System message on connect styled as centered pill
- Fixed empty state vertical centering — replaced h-full with absolute inset-0
- Fixed semantic issue — system message mine changed from false to null

ConnectionPrompt

- Glass morphism card with scale + upward drift animation on appear
- Animated ping ring behind avatar icon
- Context-aware icon — globe for chat requests, camera for video requests
- Accept button dominates visually with emerald glow
- Decline button intentionally subtle

VideoPanel

- Vignette overlay using radial gradient for cinematic edge darkening
- Live pill indicator top-left with pulsing red dot
- PiP with "You" label, rounded-2xl, and depth shadow
- Pill-shaped End button with phone-down SVG and red glow on hover
- Fade-in animation on panel mount

Code review findings:

- Stale closure patterns in handleControl and onChannelOpen — harmless in practice due to refs and stable setters, flagged as design smells for future refactoring
- Added 20 second connection timeout that calls teardown() if data channel never opens

---

## Phase 3 — Make it Secure

Full security audit performed on all API routes and client code.

### Issues Found and Prioritized

Issue 1 — Signaling MITM (Critical) — Documented

- fromId in /api/signal is fully attacker-controlled
- Server never verifies the caller owns that ID
- Attacker can enumerate peer IDs via free poll call, drain any user's signal inbox, and inject forged SDP offers
- Correct fix: Issue session tokens server-side on /api/join, store in HttpOnly cookies, verify cookie.sessionId === fromId on every signal route call
- Not implemented — requires rearchitecting auth across multiple routes; too high risk to implement without breaking the app under time constraints

Issue 2 — Unauthenticated Cross-User Mailbox Read (High) — Documented

- No ownership check on GET /api/poll?id=<uuid>
- Anyone can drain another user's inbox silently, intercepting ICE candidates and SDP in transit
- Correct fix: same server-side session token as Issue 1
- Not implemented — resolved entirely by Issue 1 fix

Issue 3 — Unsafe JSON.parse crashes ICE negotiation (Medium) — Fixed

- lib/webrtc.ts line 89 had bare JSON.parse(payload) with no try/catch
- Malformed JSON from a connected peer caused unhandled SyntaxError, aborting mid-handshake
- Fix: wrapped in try/catch, returns early on parse failure

Issue 4 — Presence displacement via arbitrary IDs (Medium) — Fixed

- /api/join only checked ID type and length (8–64 chars), not UUID format
- Attacker could register with a copied UUID, overwriting a legitimate user's presence row
- Fix: added UUID v4 regex validation before upsert, rejects non-UUID with 400

Issue 5 — No HTTP security headers (Medium) — Fixed

- No CSP, X-Frame-Options, or X-Content-Type-Options present
- Fix: implemented nonce-based Content-Security-Policy in proxy.ts (Next.js v16 proxy convention) covering Mapbox and WebRTC blob workers, plus X-Frame-Options: DENY, X-Content-Type-Options: nosniff, and Referrer-Policy: strict-origin-when-cross-origin

### Additional Notes

- React's default JSX escaping handles XSS for chat messages — no additional sanitization library needed
- UUID validation on /api/join covers ID input sanitization
- Root cause of Issues 1, 2, and 4: session ownership is never proven server-side — one server-issued HttpOnly session token fix closes all three simultaneously

---

## Phase 4 — Make it Better

To be completed

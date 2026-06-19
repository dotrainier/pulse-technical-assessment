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

Built two complementary features that make Pulse feel more _alive_ (identity) and more _safe_ (blocking), plus fixed a core reconnection bug discovered while testing.

### Feature 1 — Pre-Connection Profile Card (Alive)

Anonymous strangers now have a lightweight, ephemeral identity so connecting feels human without compromising the no-accounts, nothing-stored design.

- _Mood selector_ on EntryGate — after locating, the user picks one of six moods (😊 Friendly, 💬 Just chatting, 🎮 Gamer, 🎵 Music, 😴 Bored, 🌍 Exploring). Stored as a nullable mood column on the Presence row and returned in the poll response.
- _Deterministic identity_ in lib/identity.ts — each peer's UUID is hashed into a consistent animal name ("Cosmic Panda"), a matching animal emoji (🐼), and an HSL avatar color. Three independent hash seeds keep the name parts and color decorrelated. A shared animalIndex() helper guarantees the emoji always matches the animal in the name — it's structurally impossible for them to diverge.
- _Where it shows_ — the ConnectionPrompt displays the colored avatar (animal emoji), the anonymous name, and the mood pill before the user decides to accept. The same identity carries into the ChatPanel header and appears as a small avatar beside each of the peer's messages (with consecutive-message grouping, so the avatar only shows on the first of a burst).
- Identity resolves from activePeerId across all connection states (requesting, connecting, connected), so it stays consistent from the prompt through the entire chat.

### Feature 2 — Explicit Block (Safe)

A deliberate, visible blocking action — distinct from declining or ending.

- _Design decision:_ declining a request or ending a chat are lightweight actions (you might reconsider, or want to reconnect later), so neither blocks. Only an explicit _Block_ button adds a peer to the session block list. This avoids the accidental-permanent-removal problem where a misclick on Decline would hide someone forever.
- _Block buttons_ — a muted tertiary "Block" action with a ban icon on the ConnectionPrompt (below Accept/Decline) and in the ChatPanel header (beside End). Blocking mid-chat also tears down the active connection.
- _Centralized logic_ — a single blockPeer() handler adds the peer to a useRef block set and performs the right teardown based on current connection state, with an early exit for the race where a block fires after the connection already ended.
- _Server-side filtering_ — blocked peer IDs are sent on the poll request, validated against a UUID v4 regex (prevents injection into the Prisma query), and excluded via notIn. Blocked peers vanish from the map on the next poll tick.
- _Consistent auto-decline_ — a guard in processSignal auto-declines any incoming request from a blocked peer before the prompt can show, so both block paths (prompt and chat) behave identically.
- _Session-scoped by design_ — blocks live in memory (useRef), not localStorage. Since peer IDs regenerate on every page load, persisting old blocked IDs would be useless — they'd never match new sessions. Memory-only blocking aligns with the app's ephemeral, anonymous nature.

### Feature 3 — Floating Emoji Reactions (Alive, bonus)

During a video call, both peers see a row of emoji buttons (❤️ 😂 👍 😮 🔥). Tapping one spawns a floating emoji that drifts up the screen and fades like Instagram Live reactions, and the same reaction is sent over the existing WebRTC data channel so it appears on both screens at once. New reaction message type on the data channel, kept distinct from chat and typing. Purely ephemeral and peer-to-peer — nothing stored. Also mirrored the local camera PiP for a natural selfie-view while sending the unflipped stream to the peer.

### Bug Found & Fixed During Phase 4 — Stale busy Flag

While testing block/decline/end behavior, found that the server's /api/signal route set busy: true on both peers on "accept" and cleared it on "decline" — but _never cleared it on "end"_. Any user who ended a conversation stayed permanently busy: true, so the server auto-declined every future request to them. This affected all users, not just the block edge case — ending any chat would silently brick that user's ability to receive new connections. Fix: added "end" to the busy-clearing branch alongside "decline".

### Deployment Note

app/layout.tsx calls await headers() to force per-request dynamic rendering. This is required for the nonce-based CSP (from Phase 3) to work in production — static pre-rendering at build time produces HTML with no nonce on the script tags, which the runtime CSP then blocks. Dynamic rendering lets Next.js read the per-request nonce and stamp it on every inline script. For a real-time app with live polling there's no meaningful caching loss.

### What I'd Do Next With More Time

- Let users change their mood mid-session instead of locking it in at entry. Right now it's set once on the EntryGate and never updated after that.
- Implement the server-side session token from the Phase 3 notes. That's the real fix for the signaling auth issues I documented, and it would also let me enforce blocking on the server instead of trusting the client's blocked list.
- Clean up the stale-closure patterns in handleControl and onChannelOpen that I noted in Phase 2. They work fine because everything inside them uses refs, but I'd refactor them properly before a real production release.

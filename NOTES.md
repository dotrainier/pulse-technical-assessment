_Bug 1:_ Prisma client not generated.

- npx prisma db push was run but npx prisma generate was not.
- This caused Cannot find module '.prisma/client/default' error on all API routes.
- Fix: Run npx prisma generate to create the local client files.

_Bug 2:_ WebRTC chat messages silently dropped.

- lib/webrtc.ts line 132 sent { t: "msg", text }
- Receiver at line 79 checked for msg.t === "chat"
- Tag mismatch caused every message to be silently ignored
- Fix: Changed t: "msg" to t: "chat" in the safeSend call

_Bug 3:_ Ghost dots — presence never goes stale after user disconnects.

- app/api/poll/route.ts line 25-28 used where: {} in updateMany
- This refreshed lastSeen for ALL presence rows on every poll
- So User B's polls kept User A's row alive even after A disconnected
- The existing TTL reaper at line 32 never triggered as a result
- Fix: Added where: { id } to only refresh the caller's own row
- This also fixes sudden disconnects since the TTL reaper now works correctly

_Developer Notice:_ Verified against live demo at pulse-silk-eta.vercel.app:

- Chat not auto-closing on disconnect is intentional behavior
- Page refresh creating a new dot is intentional behavior
- Not treated as bugs

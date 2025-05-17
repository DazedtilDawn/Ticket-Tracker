# Ticket-Tracker Debug Agent Guide

> **Purpose**  Give ChatGPT Codex (or any automated agent) a clear, reproducible set of steps to diagnose and fix the 502 / WebSocket failures that appear after deploying the app to **Render**.

---

## 1  Context

* **Stack**  Docker ➜ Node 20 (Express + Vite) ➜ PostgreSQL (Render) + optional S3.
* **Symptoms**  `502` on every `GET /api/users`, repeated WebSocket disconnect / reconnect loops seen in the browser console.
* **Clues so far**

  * Render proxy returns 502 **before** logs show a request hit the container.
  * Browser shows `wss://ticket-tracker-nbbp.onrender.com/ws` handshake failing.
  * Current `server/index.ts` binds **hard‑coded** `port = 5000` (should use `process.env.PORT`).
  * Dockerfile recently switched to single‑stage build and sets `USER nodejs` **before** the build step.

---

## 2  High‑level goal

1. Make the container boot, listen on the Render‑assigned port, and keep running.
2. Ensure `/ws` upgrades succeed once the app is healthy.
3. Remove 502s in the browser/network traces.

---

## 3  Step‑by‑step playbook

| #                                     | Task                                                                                                                                   | Expected outcome                                   |        |                                                    |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------ | -------------------------------------------------- |
| 1                                     | **Reproduce**<br>`curl -iv https://ticket-tracker-nbbp.onrender.com/api/users`<br>`wscat -c wss://ticket-tracker-nbbp.onrender.com/ws` | Capture status line / headers into `docs/502.log`. |        |                                                    |
| 2                                     | **Render dash → Logs** around the cURL timestamp                                                                                       | Verify if container restarted / crashed.           |        |                                                    |
| 3                                     | **Check port binding**<br>• In `server/index.ts` change<br>`const port = 5000` →<br>`const port = Number(process.env.PORT) \|\| 5000` |                                                    | 5000` | Server can listen on whatever port Render injects. |
| 4                                     | **Fix Dockerfile**<br>Implement multi‑stage:<br>```Dockerfile
FROM node:20-bookworm-slim AS builder
# build as root …
RUN npm ci && npm run build

FROM node:20-bookworm-slim
WORKDIR /app
COPY --from=builder /app .
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m nodejs
EXPOSE 5000
USER nodejs
CMD ["node","dist/index.js"]
```| Build happens as root; runtime under non‑privileged user; image smaller. |
| 5 | **Add Render health‑check**<br>`/health` route returns 200 early; set `healthCheckPath: /health` in `render.yaml`. | Render waits for readiness before routing traffic. |
| 6 | **Client WS reconnect**<br>Add exponential back‑off (already stubbed in `client/src/lib/ws.ts`). | Smooth UX on cold starts. |
| 7 | **Local validation**<br>`docker build -t ticket-tracker-prod .`<br>`docker run -e PORT=8888 -p 8888:8888 ticket-tracker-prod`<br>`curl http://localhost:8888/health` | Confirms fixes before pushing. |
| 8 | **Commit / push**: `fix(docker): build as root, drop to nodejs; use env PORT` | CI + Render auto‑deploy green. |

---

## 4  Artifacts / deliverables

* Updated **Dockerfile** (multi‑stage, `CMD node dist/index.js`).
* Patched **server/index.ts** (`process.env.PORT`).
* Optional `/health` route in `server/routes.ts`.
* Render blueprint (`render.yaml`) with `healthCheckPath`.
* Log snippet proving 200 OK + WebSocket `101 Switching Protocols`.
* Pull‑Request description referencing this guide.

---

## 5  Useful one‑liners

```bash
# Quick WebSocket smoke‑test
node -e "require('ws').WebSocket('wss://ticket-tracker-nbbp.onrender.com/ws').on('open',()=>console.log('WS OK'))"

# Tail Render logs from CLI
render logs ticket-tracker --service web --tail 200
```

---

### Checklist for merging

* [ ] All automated tests (`npm test` & `bun test`) pass
* [ ] `docker build` succeeds locally (< 600 MB final image)
* [ ] Render deploy logs show "Listening on :$PORT"
* [ ] Browser dev‑tools show no 502 / WS handshake failures

---

*Last updated: 2025‑05‑18 by ChatGPT Guide*

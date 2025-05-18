# Ticket-Tracker Debug Agent Guide

This guide explains how to diagnose 502 and WebSocket failures when deploying
this app on Render.

## 1. Context
- Stack: Docker -> Node 20 (Express + Vite) -> PostgreSQL.
- Symptoms: HTTP 502 from `/api/users`, failing `/ws` upgrades.

## 2. High-level goal
1. Container boots and listens on `$PORT`.
2. `/ws` upgrades succeed.
3. Browser sees no 502s.

## 3. Step-by-step playbook
1. Reproduce with:
   ```bash
   curl -iv https://ticket-tracker-nbbp.onrender.com/api/users
   wscat -c wss://ticket-tracker-nbbp.onrender.com/ws
   ```
2. Check Render logs around the timestamp.
3. Ensure server binds to `process.env.PORT`.
4. Use a multi-stage Dockerfile that builds as root and drops to the
   `nodejs` user only for runtime.
5. Add a `/health` endpoint and configure `healthCheckPath: /health` in
   `render.yaml`.
6. Locally validate with:
   ```bash
   docker build -t ticket-tracker-prod .
   docker run -e PORT=8888 -p 8888:8888 ticket-tracker-prod
   curl http://localhost:8888/health
   ```
7. Commit with message `fix(docker): build as root, drop to nodejs; use env PORT`.

## 4. Checklist for merging
- [ ] `npm test` and `bun test` pass.
- [ ] `docker build` succeeds locally (<600 MB image).
- [ ] Render logs show "Listening on :$PORT".
- [ ] Browser has no 502 or WebSocket failures.

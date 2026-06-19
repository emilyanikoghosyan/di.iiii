# Current State

**Every AI reads this before anything else. ≤50 lines. Read in full.**
Updated at the end of every session. Replace content — do not append.

active_branch: dev

---

## Last commit

`378cba5` — fix: control-cluster panel ignored the Snap-to-edge toggle.
Branch focus: `dev` → staging.di-studio.xyz, `main` → di-studio.xyz (production).

## What works

- Beta editor: graph-first layout, node palette, undo/redo, outliner; topbar hidden until Node 0 placed
- World node (`universe.world`): embedded 3D scene, fullscreen + overlay modes
- Studio editor: project hub, 3D scene, inspector, assets, spaces, undo/redo
- Studio asset import: GLBs at least 10 MB offer opt-in browser optimization before upload (2048px WebP textures + conservative model cleanup; originals remain optional)
- Auth: session-cookie login, role-based access, 8 s timeout; GitHub/Google OAuth live on both envs
- Deploy: push `dev` → staging, `main` → production (`publish-cpanel-prebuilt-v2.yml`)
- Docker: `docker compose up --build -d` → full stack on :8080 (Podman-compatible)
- Space sync: `npm run space:new/pull/push` + `SpaceSyncPanel` UI in BetaHub
- Public spaces + per-space read access control (`isPublic`, `requireReadRole`) — on `feature/landing-pages`
- User-scoped sign-in: `users.spaces` column + admin `GET/PATCH /api/users` — on `feature/landing-pages`

## What is broken / open

- `feature/landing-pages` is uncommitted local work — lint/build/test/server-contracts pass; read-scope + Studio nav verified live. `/api/users` covered by automated tests only. Commit + manual Docker check before merging to `dev`.
- `GET /api/spaces` (full list) still has no scope check — returns metadata only, but reveals which spaces exist.
- `.claude/settings.json` has uncommitted changes — needs commit/push.

## Space sync setup (per machine)

Add to `serverXR/.env.local` (gitignored):
```
LIVE_API_URL=https://di-studio.xyz/serverXR
LIVE_API_TOKEN=<editor-or-admin-token>
```
Then `npm run space:pull -- n000` or use the BetaHub buttons.

## Known fixes

→ **[docs/ai/known-fixes.md](docs/ai/known-fixes.md)** — check it before investigating any bug.
When you solve something that took >5 min, add a row there and update Last commit above.

## Deploy

```bash
git push origin dev                                                   # staging
git checkout main && git merge dev --no-edit && git push origin main && git checkout dev   # prod
gh run list --workflow publish-cpanel-prebuilt-v2.yml                 # monitor
```

## Validation

```bash
npm run lint && npm run build && npm run test -- --run && npm run test:server-contracts
```

# Agent Instructions

These instructions apply to coding work in this repository.

## Session Start

Before making code changes, read these files in order:

1. `AGENTS.md`
2. `ROADMAP.md`
3. `PROJECT_STATE.md`
4. `CHANGELOG.md`

Use `ROADMAP.md` as the source of truth for current priorities and future work.
Use `PROJECT_STATE.md` as the current architecture, data model, and runtime snapshot.
Use `CHANGELOG.md` to avoid repeating completed work.

Also run `git status --short` before editing.

## Default Startup Prompt

Use this prompt for normal coding sessions:

```text
Read AGENTS.md, ROADMAP.md, PROJECT_STATE.md, and CHANGELOG.md first.

Then continue from the current priority in ROADMAP.md. Make the change, update docs/tests/cache as needed, and run verification. Do not commit or push until I ask.
```

Use this prompt when the session should finish by publishing to GitHub:

```text
Read AGENTS.md, ROADMAP.md, PROJECT_STATE.md, and CHANGELOG.md first.

Then continue from the current priority in ROADMAP.md. Make the change, update docs/tests/cache as needed, run verification, commit, and push to GitHub.
```

## Coding Workflow

- Keep changes incremental and scoped to the selected feature.
- Prefer user-facing value over cleanup by default.
- Treat architecture work as supporting work unless explicitly requested.
- Update regression coverage when behavior changes.
- Update ROADMAP.md, PROJECT_STATE.md, and CHANGELOG.md for every meaningful change.
- Keep PROJECT_STATE.md's In Progress line current during active work.
- Bump `CACHE_VERSION` in `service-worker.js` when served files change.

## Verification

Run these before committing meaningful code changes:

```text
npm.cmd test
node --check app.js
node --check service-worker.js
git diff --check
```

Expand this list as the project grows.

## Commit And Push

- Do not commit or push unless asked.
- Stage only intentional files.
- Use one coherent commit per completed batch.
- After pushing, confirm the final commit hash and that the worktree is clean.

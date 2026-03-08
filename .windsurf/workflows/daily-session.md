---
description: Daily session log workflow (AM check-in + PM checkout)
---

# Daily Session Workflow (DriverAll)

## A) Morning check-in (start of day)

1) Read these files in order and align on what to do today:

- `REMINDER_next_session.md`
- `LOGS_checklist_next_session.md`
- `TODO.md`
- `PROJECT_TODO.md`
- `handoff/latest.md`

2) Confirm runtime basics:

- Backend health: `GET /api/health` (confirm Mongo `name=driverall`)
- Frontend dev server reachable

3) Pick **one** focus (today’s objective) and write it at the top of `REMINDER_next_session.md` under a new section:

- `## Today’s focus`

Use 1-3 bullets only.


## B) During the day (rules)

- Keep changes incremental.
- If a change requires a restart, restart and re-run health check.
- For anything that may be forgotten (ports, envs, endpoint URLs, known pitfalls), immediately add a short note to `REMINDER_next_session.md`.


## C) Evening checkout (end of day)

1) Update `REMINDER_next_session.md` by appending:

- `## What we did today`
- `## What’s next`
- `## Blockers / risks`

2) Update `LOGS_checklist_next_session.md` if you introduced a new endpoint, a new port, or a new smoke test.

3) If you completed or changed priorities, reflect it in:

- `TODO.md`
- `PROJECT_TODO.md`
- (Optional) refresh `handoff/latest.md` if you have a generator script.


## D) Templates (copy/paste)

### What we did today
- 

### What’s next
- 

### Blockers / risks
- 

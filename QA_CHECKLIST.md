# QA Checklist – OpenClaw & Kanban

Run through these before signing off. Then push to `main`.

## 1. Authentication token required
- [ ] Settings → OpenClaw: label shows **"Authentication Token"** (not "Optional").
- [ ] Save Configuration is **disabled** when token field is empty.
- [ ] With endpoint set but token empty, **Save** returns error asking for token / `~/.openclaw/openclaw.json`.
- [ ] With endpoint + token set, **Save** and **Test Connection** succeed.

## 2. Block sending without token
- [ ] With endpoint set and token **empty**, move a task to **In Progress** (or create in New with OpenClaw configured). Expect **403** and a clear message to set Authentication Token and `hooks.token` in OpenClaw.
- [ ] With endpoint + token set, moving to In Progress (or creating in New) succeeds and task gets `openclaw_session_id` (or stays in progress).

## 3. Kanban horizontal scroll (mobile/small width)
- [ ] Resize browser to narrow width (e.g. 375px) or use device toolbar.
- [ ] Kanban columns scroll **left/right** smoothly; all columns (New, In Progress, Completed) are reachable.
- [ ] Touch/mouse scroll feels smooth (no clipping).

## 4. Auto-progression: New → In Progress
- [ ] OpenClaw configured (endpoint + token). Create a **new task** with status **New** (e.g. from New column or create with status New).
- [ ] Task should move to **In Progress** and show an OpenClaw session id (or remain New if send failed).
- [ ] With OpenClaw down or token wrong, task stays in **New** (no crash).

## 5. Completion instruction & webhook
- [ ] Send a task via webhooks (move to In Progress with endpoint + token). In OpenClaw/logs, confirm the task message includes the completion instruction and webhook URL.
- [ ] When OpenClaw finishes, it POSTs to `POST /api/openclaw/webhook` with `session_id`, `status`, `result`. Task moves to **Completed** (or Failed if status failed).
- [ ] Webhook works **without** Mission Control user auth (OpenClaw can POST with no JWT).

## 6. Prompt injection defense
- [ ] Create a task with title or description containing newlines, `---`, `[COMPLETION INSTRUCTION]`, or JSON snippets. Send to OpenClaw.
- [ ] Completion instruction still appears last and unchanged; task content does not override or break the instruction.

---

**Sign-off:** _________________  
**Date:** _________________

After sign-off: `git push origin main` (or merge feature branch to main then push).

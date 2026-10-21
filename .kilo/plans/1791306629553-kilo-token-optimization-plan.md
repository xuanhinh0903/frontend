# Kilo Token Optimization Plan

## Goal
Reduce Kilo token usage and make agent behavior more predictable for this project, while keeping changes scoped to Kilo wherever possible. The cheapest available model is `gpt-5.5`, so savings should come mainly from context control, fewer tools, smaller outputs, and narrower workflows rather than model downgrade.

## Current Findings
- Project has no root `kilo.json` / `kilo.jsonc` and no `.kilo/kilo.json` / `.kilo/kilo.jsonc` yet.
- Global config `/Users/buixuanhinh/.config/kilo/kilo.jsonc` is effectively empty except `$schema`.
- `.kilo/` exists and contains `.gitignore`, `plans/`, and `worktrees/`.
- Root `AGENTS.md` is long and is likely auto-loaded by Kilo, contributing to baseline context usage.
- Previous token drop in the session was partly caused by loading Kilo config skill docs and reading project instruction files.
- `yarn run check` previously failed/noised because lint scanned generated/local directories such as `.kilo/worktrees` and `.cursor`.

## Decisions
- Use `gpt-5.5` as the configured model because it is the cheapest available model in the user's provider list.
- Prefer Kilo-only changes first: files under `.kilo/` and Kilo config.
- Do not immediately rewrite root `AGENTS.md` because that may affect other tools or future agents that depend on it.
- Treat root `AGENTS.md` reduction as an optional second phase if Kilo-only changes are insufficient.

## Phase 1: Kilo-Only Config
1. Create `.kilo/kilo.jsonc`.
2. Set the default model and small model explicitly to `gpt-5.5`.
3. Enable compaction and pruning explicitly.
4. Make expensive/expansive tools ask first, especially subagents and web tools.
5. Keep bash/edit permissions conservative so the agent does not run broad checks without approval.

Suggested content:

```jsonc
{
  "$schema": "https://app.kilo.ai/config.json",
  "model": "openai/gpt-5.5",
  "small_model": "openai/gpt-5.5",
  "compaction": {
    "auto": true,
    "prune": true
  },
  "permission": {
    "task": "ask",
    "webfetch": "ask",
    "websearch": "ask",
    "bash": "ask",
    "edit": "ask"
  }
}
```

Implementation note: if Kilo rejects `openai/gpt-5.5`, replace it with the exact provider/model ID shown in the Kilo model picker.

## Phase 2: Kilo-Only Lightweight Instructions
1. Create `.kilo/instructions.md` with concise operating rules for Kilo.
2. Add it to `.kilo/kilo.jsonc` using `instructions`.
3. Keep this file short and focused on token behavior.

Suggested `.kilo/instructions.md`:

```md
# Kilo Project Instructions

Use narrow context. Do not scan the whole repo unless explicitly asked.
Do not run `yarn run check`, lint, build, or tests unless explicitly asked.
Prefer reading only files directly related to the task.
For quick questions, answer without tools when possible.
Before using a subagent, web tool, or broad shell command, ask first.
For code changes, follow existing React + TypeScript + Vite patterns and `@` alias.
```

Suggested config addition:

```jsonc
{
  "instructions": [".kilo/instructions.md"]
}
```

Risk: Kilo may still auto-load root `AGENTS.md`; this lightweight file may add guidance but may not fully replace root instructions.

## Phase 3: Reduce Command Noise
1. Update lint/build ignore behavior so checks do not scan local/generated tool directories.
2. Target directories to ignore:
   - `.kilo/`
   - `.cursor/`
   - `.code-review-graph/`
   - `dist/`
   - `node_modules/`
3. Apply this either in ESLint config or the relevant ignore file already used by the project.

This phase affects project tooling, not only Kilo, but it reduces token waste when command output is captured.

## Phase 4: Optional Root Instruction Cleanup
Only do this if Phase 1 and Phase 2 are not enough.

1. Reduce root `AGENTS.md` to a shorter operational version.
2. Move detailed conventions into a separate human/reference doc only if needed.
3. Keep the root instruction under roughly 30-50 lines.

Risk: this may affect other AI tools that also read `AGENTS.md`.

## Recommended Kilo Workflow
- For quick questions, start a new session and say: `Trả lời ngắn, không đọc file, không dùng tool.`
- For small code edits, specify exact folders/files and say: `Không chạy check toàn bộ.`
- For reviews, request narrow scope: `Review auth routing only, do not scan whole repo.`
- Avoid loading skills unless specifically needed; skill docs can consume many tokens.
- Start a new session after large tool usage or config investigation.

## Validation
1. Open a new Kilo session after applying config.
2. Ask a no-tool question and verify token drop is small.
3. Ask a scoped file question and verify Kilo does not read broad repo context.
4. Try a code task and verify Kilo asks before broad bash/task/web usage.
5. If `yarn run check` is run later, confirm it no longer scans `.kilo/worktrees` or `.cursor`.

## Open Risks
- Kilo UI/runtime toggles such as thinking display, tool details, autocomplete, and Agent Manager may not be fully controlled by `kilo.jsonc`; they may need manual UI changes.
- If `gpt-5.5` is the only available model, token volume reduction must come from fewer context/tool tokens, not a cheaper model.
- Root `AGENTS.md` may continue to be loaded automatically unless Kilo provides a setting to exclude or override it.

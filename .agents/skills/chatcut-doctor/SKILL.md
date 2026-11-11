---
name: doctor
description: Automatically update ChatCut Desktop on each Doctor run, then diagnose installation, external-agent MCP connections and managed editing skills and apply requested repairs. Use when ChatCut tools or skills are missing, duplicated, stale or unable to connect.
---

# ChatCut Doctor

Use the ChatCut CLI for installation and diagnostics; Desktop remains the source
of the editing runtime, agent connections and bundled skills. For ordinary video
editing with working tools, continue the editing task.

Use `npx --yes --prefer-online @chatcut/cli@latest` for every CLI operation below,
including follow-ups. Do not let an old global command or cached unversioned npm
package choose the update target. Check `--help` when the published surface
differs. If the package is unavailable, use the
[official Desktop installation instructions](https://chatcut.io/desktop-plugin)
and report that the CLI could not be obtained; do not substitute another npm
package or hosted MCP server.

Make Desktop update the first recovery step on every Doctor invocation, without
waiting for a separate update request or confirmation. Honor an explicit
read-only/no-update request. Preserve the original failure and the current
project/chat before restarting.

- Run `npx --yes --prefer-online @chatcut/cli@latest update --json` once per
  invocation. The CLI selects the official signed release and preserves an
  installed version that is already current or newer; do not force a reinstall
  or downgrade.
- If it returns `close_app_required`, finish saving current work and quit
  Desktop normally at a safe point, then retry once. Do not interrupt an active
  export, recording, upload or Agent task or force-kill the app or other agent
  sessions. If a safe exit is unavailable or the user declines, record the
  deferral and continue the available read-only checks.
- After an update, or if Desktop was closed for the attempt, run
  `npx --yes --prefer-online @chatcut/cli@latest app --json`, restore the known
  project/chat and reconnect MCP. Compare the restarted app's actual reported
  running version with the update result. Download, installer exit and launch
  request alone do not establish that the new version is running; report an
  unavailable version check as unverified.
- Retain update failures and their original causes, then continue diagnosis.
  For `app_updater_required`, use the existing app updater or official
  interactive installer; missing privileges or signature failures must not be
  bypassed. Do not loop on the same update failure or repeat the update during
  post-update verification. Updating the npm CLI alone does not update Desktop.

Then run `npx --yes --prefer-online @chatcut/cli@latest doctor --json`. Choose
additional operations that match the user's request:

- Open or install Desktop:
  `npx --yes --prefer-online @chatcut/cli@latest app --json`.
- Diagnose one host:
  `npx --yes --prefer-online @chatcut/cli@latest doctor --client codex --json` or
  select `--client <name>`. Supported names are `codex`, `claude-code`,
  `hermes`, `workbuddy`, `deepseek-harness`, `qwen-work` and `doubao-work`.
- Repair a requested connection/skill problem:
  `npx --yes --prefer-online @chatcut/cli@latest doctor --fix --json`.
  When the request names one client, select it with `--client <name>`. Existing authorization to fix the problem is sufficient;
  the default app update does not authorize unrelated connection or skill repairs.

Any agent with a shell on the user's computer can also use Desktop immediately
through the CLI, without registering tools in its host or reloading a session:

- `chatcut connect --json` prepares Desktop, verifies a real tool call and returns
  the available tool and skill names, without repairing native-host registries.
- `chatcut skills list --json` lists the skills bundled with that Desktop version.
- `chatcut skills read <name>` reads the chosen skill; `--file <relative-path>`
  reads its supporting reference when needed.
- `chatcut tools list --json` discovers live tool names and descriptions.
- `chatcut tools describe <name> --json` returns the actual input schema.
- `chatcut tools call <name> --args-file <path> --json` invokes that tool;
  use `--args-file -` for JSON on stdin, or omit arguments for `{}`.

Run these commands yourself (or prefix them with `npx --yes @chatcut/cli` when
the command is not installed). Users should not copy commands or configuration.
Use the CLI route while a native host reload is pending or unsupported. Read
`ok` and the original MCP result; stop on failure. A timeout may follow a state
change, so inspect Desktop before repeating a mutation. This is a real CLI to
Desktop MCP call, and must be reported as CLI access rather than native host
tool-table loading. A cloud agent needs an approved local-computer execution
capability; its cloud shell cannot reach the user's local Desktop socket.

Automatic repair supports Codex, Claude Code, Hermes, WorkBuddy, DeepSeek Harness's
Desktop profile, and Qwen Work (千问办公). Doubao Work (豆包工作) synchronizes owned
skills to `~/DoubaoWork/skills`. `connect --client doubao-work` opens a prefilled
local setup skill/task in Doubao. Ask the user only to click Send, login or
system permission buttons; Doubao's native computer-use tool fills its signed-in
connector UI and verifies a real tool call. Never ask users to copy commands,
fill paths, choose a transport or enter environment variables. A permissions
restart can interrupt the task; resume it afterwards. Opening the task does not
mean connection success. Later repairs refresh the launcher and owned skills.

Doubao discovery is observed from the host's own authenticated live MCP connection;
it clears on disconnect. `discovery.lastToolCall` is separate call evidence.
Never equate a successful independent probe or copied skill files with host
loading. Do not invent a registry or collect browser credentials to bypass its
account/API registration flow. Host-native acceptance is separate from fixture tests.

Always read CLI `hostHandoffs`, including when diagnostic `ok` is true. Check
your own loaded ChatCut skills and tools before asking for another reload.
Native testing found that WorkBuddy 5.9.3 still lacked tools after an app restart
and new task, Qwen Work 1.4.0 did not load the legacy file registration into its
account-scoped registry, and DeepSeek Harness 0.2.1-rc.3 exposed no ChatCut tools
in the test session. Use CLI access to continue; do not ask users to repeat
reloads to work around an unresolved registration. Doubao's
verified path uses a new task, with an app restart only for system permissions.
Codex CLI, Claude Code and Hermes use a fresh
agent session; Codex desktop app and DeepSeek reload behavior still need their
own native acceptance. Follow each entry's evidence and remaining actions;
never replace an app-restart requirement with a generic new-chat instruction.
Before asking the user to restart or open a new conversation, prepare context
to continue the connection check. Ask the user only to click the host's buttons,
not copy commands, edit config or repeat their original task. After resuming,
load a managed skill and call the actual Desktop connector before claiming
the host is ready. A native acceptance still awaiting login must remain pending.

Read the individual checks and original errors. Installation, a running app,
host registration, readable managed skills, MCP discovery and a successful tool
call are different evidence. Doctor probes a fresh local MCP connection through
`initialize`, `tools/list` and `get_active_project`; cached discovery alone does
not establish success. An empty active project is valid.

Also inspect the current agent conversation's available `chatcut_desktop` tools
and skill catalog. A successful fresh probe cannot prove that this conversation
loaded them. After changes, use the host's supported reload or start a new
conversation, then verify a read-only tool call and access to the relevant
ChatCut workflow skill. Do not claim to have observed unavailable host state.

For repairs, let Desktop own connection setup and skill synchronization. It
respects explicit disconnections and checks the selected agent home. Preserve
user-edited or foreign skills and report their exact paths. Matching skill names
or similar text do not prove that copies are interchangeable: different hosts
can require different variants. Only obsolete, unchanged manifest-owned copies
are eligible for automatic removal. Do not clear an entire skill root, host
configuration, plugin cache, credentials or project directory.

When running inside a managed ChatCut Agent, its project-pinned MCP and built-in
skills are authoritative. Diagnose that project/session first; do not repair
external host integrations to fix an unrelated in-app tool failure.

Re-run diagnosis after repair. Report the failed stage and original cause,
changes actually completed, the final checks, preserved ambiguous paths and any
remaining sign-in, update or conversation-reload action. Sign-in happens inside
Desktop; never collect credentials. macOS/Windows policy or an unsupported
headless/Linux environment is a concrete limitation, not permission to bypass
publisher validation.

Research and consequential adoption decisions are recorded in
[sources](references/sources.md); read them when changing the diagnostic model.

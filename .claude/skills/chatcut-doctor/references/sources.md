# Doctor workflow research

Inspected 2026-10-25. These sources informed the workflow; no upstream code or
substantial text was copied. Repository popularity describes the collection,
not evidence that one skill works. The implementation is original ChatCut code.

- [OMX doctor skill](https://github.com/Yeachan-Heo/oh-my-codex/blob/6b1c110ec06b45a5644ceb6ee60788f7ccae6c46/skills/doctor/SKILL.md)
  and [CLI implementation](https://github.com/Yeachan-Heo/oh-my-codex/blob/6b1c110ec06b45a5644ceb6ee60788f7ccae6c46/src/cli/doctor.ts)
  (MIT; repository observed at 33,631 stars): adapted explicit checks, installed
  version evidence, selected config-home semantics, preserved original failures,
  and before/after repair verification. Rejected broad deletion of user skill
  roots/caches and replacing global instruction files: they exceed ChatCut's
  ownership and do not establish connection recovery.
- [OMC doctor skill](https://github.com/Yeachan-Heo/oh-my-claudecode/blob/5632614b75cc7833f74604be65d26a62a5b773de/skills/omc-doctor/SKILL.md)
  (MIT; repository observed at 40,246 stars): adapted respect for active config
  roots and standing opt-outs, exact ownership evidence before cleanup, and
  preserving ambiguous custom behavior. Omitted its hook migration and global
  instruction management; ChatCut's existing Desktop integration owner remains
  responsible for its own settings.
- [skill-doctor skill](https://github.com/evilstar2016/skill-doctor/blob/dd7e86b5721aa8f4bf7a7b5542b2a5cb5c03373c/skills/skill-doctor/SKILL.md)
  (MIT; repository observed at 13 stars): adapted structured diagnostics,
  path-specific findings, separation of diagnosis from mutation, and the
  distinction between similarity and interchangeability. Rejected installing
  its scanner, model providers or a second central skills library: ChatCut
  already owns its bundled workflows and ownership manifest.
- [OpenClaw doctor](https://docs.openclaw.ai/gateway/doctor) and
  [npm doctor](https://docs.npmjs.com/cli/v11/commands/npm-doctor/): primary
  references for actionable checks and explicit recovery operations. ChatCut
  keeps the CLI update operation separate from its read-only diagnostic command,
  uses bounded local checks and preserves the user's existing application state.
- [MCP lifecycle implemented by Desktop](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2025-11-25/basic/lifecycle.mdx):
  the probe negotiates the handshake protocol supported by ChatCut's current
  SDK, lists tools and executes a read. This is protocol-specific evidence,
  not proof of discovery inside another already-running agent conversation.

ChatCut's existing `connect-chatcut-desktop` and hosted MCP doctor materials were
also inspected. Their official artifact selection, truthful handoff and
separation of independent probes from original host failures remain useful.
The new CLI does not reuse the hosted collector, OAuth probes or log-upload
pipeline for local Desktop repair.

Original integration: authenticated operations on Desktop's existing local IPC
reuse its connection and skill owners; the npm CLI only bootstraps the signed
app and verifies observable results. Old ownership hashes are checked against
current bytes before any update/removal. Intentional per-host variants stay
independent. Cross-platform fixture tests do not establish native Windows
installation success; that remains a release acceptance requirement.

## Additional host integrations (2026-10-30)

- [DeepSeek MCP client](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/mcp/mcp-client)
  and the installed DeepSeek Harness packages establish the plugin entry format.
  The shipped `dsh-skill-filesystem` README establishes `$DSH_HOME/skills` and
  shared Agent Skills discovery. The installed Desktop profile and upstream
  `snapshots/session/plugin-manager-mcp/profile.patch.yml` establish the profile
  insert patch. YAML expressions are preserved as nodes and never evaluated.
- [Qwen Work connector documentation](https://help.aliyun.com/zh/qwenwork/qw-connectors)
  documents local STDIO and new-conversation requirements;
  [Alibaba Cloud's integration guide](https://docs.rag.bailian.aliyun.com/cookbook/office-agent)
  identifies `~/.qwenworkcn/skills`. The public
  [host archive sync script](https://github.com/ahang1598/doubao-workbuddy-qwenwork-skills/blob/main/scripts/sync_platform.py)
  and archived Qwen registry provide path/JSON-format evidence for
  `~/.qwenworkcn/mcp.json`. This is implementation evidence, not a native Qwen
  acceptance result; verify with an installed host before release.
- [Doubao Work official download](https://www.doubao.com/work), signed macOS
  ARM64 2.34.9, publisher `Beijing Chuntian Zhiyun Technology Co., Ltd.`, team
  `96L78H6LMH`, inspected and launched on 2026-10-30. Its actual first-run creates
  `~/DoubaoWork/skills`; native source diagnostics identify `agent_skill`'s
  local directory scanner and file watcher. Local manifests require YAML
  frontmatter with nonempty scalar `name` and `description`.
- The shipped client creates personal connectors through
  `/alice/office/skills/manage/connector/create_personal`, updates them through
  `update_personal`, refreshes the account manifest, and uses
  `neotix.taskMode.connector.queryLocalConnectors` for local status. These are
  account/native application interfaces, not a documented third-party CLI
  authentication contract. No browser credentials are extracted. First-time
  registration stays in the host UI; CLI repair owns its launcher and skills.
- Native acceptance found that the STDIO command field tokenizes an executable
  path containing spaces: `Application Support/...` fails with
  `CONNECTOR_STDIO_EXECUTABLE_NOT_FOUND`. `/bin/sh` plus a separate path argument
  reached the genuine Desktop MCP and discovered 65 tools. A signed-out Desktop
  separately failed during `tools/list` with its original sign-in error, proving
  that registration and transport alone do not establish a working connection.
  After user sign-in, a native Doubao model task read the synchronized
  `product-help` skill and successfully called `get_active_project`, returning
  `surface: "desktop"` and `projectId: null`; the native STDIO log confirmed the
  successful model-originated call without any project mutation.
- A fresh native Doubao task independently created a separate test connector
  through its own `general-computer-use` tool and the official connector form.
  A new task loaded that connector and successfully called `get_active_project`;
  native logs confirmed the new connector's model-originated STDIO roundtrip.
  Users supplied system permissions, not connector configuration. The exploratory
  GUI path was slow and retained an old tool table until a fresh task was started.
- The shipped frontend includes the `GeneralAgent_UseSkill` URL action with a
  local skill path, prompt and new-conversation flag. Its common action envelope
  includes `pfTrackParams`; omitting that object triggers a plugin failure log.
  Setup files are generated under Desktop userData without account credentials.
  Native acceptance of the optimized handoff remains required; file fixtures and
  observing skill dispatch alone do not establish the complete user flow.
- Native Codex CLI 0.160.1 was launched in a fresh, read-only session outside
  the repository, using a temporary MCP override and the real Desktop launcher.
  It read the installed `doctor` frontmatter and completed one genuine
  `chatcut_desktop.get_active_project` call (`surface: desktop`, no active
  project). This establishes fresh CLI session loading, not which Codex desktop
  app reload action is minimally necessary. Claude Code 2.1.153 reached its own
  sign-in requirement before model execution, so its native acceptance remains
  pending. CLI handoffs preserve these evidence distinctions.
- [Flomo's Doubao Work integration](https://help.flomoapp.com/advance/mcp/connect-doubao.html)
  independently documents the custom connector UI. Real native acceptance and
  app-local receipts are kept outside the repository under the verification
  profile; do not publish account state or raw private application logs.
- Follow-up native acceptance on 2026-10-30 found that WorkBuddy 5.9.3 still
  lacked ChatCut tools after a restart and fresh task, Qwen Work 1.4.0 did not
  load the legacy JSON registration into its identity-scoped connector owner,
  and DeepSeek Harness 0.2.1-rc.3 discovered doctor but exposed no ChatCut tools.
  These are unresolved native registrations, not proven reload requirements.
- Hermes 0.22.5's native event stream recorded `skill_view` for doctor and a
  successful `mcp__chatcut_desktop__get_active_project` call. Its separate CLI
  acceptance recorded terminal commands for skill discovery/read, live tool
  discovery/schema and one successful CLI `tools call`, with `surface: desktop`.
  WorkBuddy's and Qwen Work's real Agents also completed that CLI sequence. CLI acceptance is
  recorded separately from native host tool-table acceptance.
- The CLI now attaches an already-running Desktop through its canonical local
  endpoint and Desktop-owned launcher. It lists live MCP tools, reads skills
  from that Desktop version and invokes MCP directly. Install/start/update keep
  publisher validation. Native Qwen testing exposed that repeating Gatekeeper
  assessment for every runtime read can fail inside the host's command sandbox;
  attaching an existing connection avoids that unrelated install-time work.
  Qwen's real Agent subsequently read product-help and successfully called
  `get_active_project` through authenticated Desktop IPC. This route uses the
  existing Desktop MCP dispatcher without spawning a second STDIO runtime.
- DeepSeek Harness's signed-in Desktop Agent completed `connect --json` and
  `skills read product-help --json` in an independent native conversation.
  Its native trace recorded both actual `bash` calls and successful outputs;
  connect returned the Desktop verification result and the installed skill
  catalog. No API key or headless authentication workaround was needed.
- [Grok Bot computer and apps](https://docs.x.ai/grok-bot/computer-and-apps)
  distinguishes its cloud computer from approved local-computer commands.
  CLI access to the user's Desktop must run locally under that host policy;
  installing an STDIO command on the Bot's cloud computer cannot reach the
  user's local IPC socket. The official macOS download was signature-verified;
  startup and native acceptance were deferred at the user's request while
  completing the other hosts.

2026-10-30 product update: each Doctor Skill invocation now attempts the official
Desktop update by default, using `@chatcut/cli@latest`, before diagnosis. The
agent preserves work, handles a required normal quit and relaunch, and verifies
the running version. An explicit read-only/no-update request takes precedence;
unavailable safe exits or failed updates remain visible and do not authorize
unrelated repairs. This changes Skill orchestration, not the CLI diagnostic
command's read-only contract or the unpublished replacement Doctor.

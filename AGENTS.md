<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project Agent Skills & MCP Configuration

This project is fully configured for multi-agent workflows across **Claude Code, Cursor, OpenCode, Codex, MiniMax Code, Kimi, and Antigravity**.

### Skills (`.agents/skills` & `.claude/skills`)
- Over **205+ curated agent skills** are bundled directly in `.agents/skills/` and `.claude/skills/`.
- Includes Cloudflare security audit (`security-audit`), Vercel ecosystem, testing, React best practices, frontend/backend architecture, and debugging skills.

### MCP Servers (`mcp.json`, `.agents/mcp.json`, `.cursor/mcp.json`, `.vscode/mcp.json`)
The following MCP servers are configured:
1. **Spline**: 3D design & canvas automation.
2. **context7**: Up-to-date documentation and library references.
3. **higgsfield**: Video & media generation models.
4. **motion**: Motion task and calendar integration.
5. **playwright**: End-to-end browser automation and testing.
6. **chrome-devtools**: Live DevTools debugging, performance & accessibility auditing.
7. **firecrawl**: Web scraping, crawling, and research extraction.
8. **github**: GitHub repositories, issues, PRs, and commit automation.

### Claude Plugins (`.claude/settings.json`)
- `typescript-lsp`
- `security-guidance`
- `code-review`
- `code-simplifier`
- `context7`
- `claude-seo`


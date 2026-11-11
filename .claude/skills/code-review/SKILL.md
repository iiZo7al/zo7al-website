---
name: code-review
description: Code review a pull request, git branch, or code changes with high-signal bug detection, logic analysis, and standard compliance. Use when asked to review a PR, review code, or audit code changes.
---

# Code Review

Automated, rigorous code review for pull requests and code modifications.

## Core Directives

1. **Focus on High-Signal Issues**:
   - Syntax errors, type mismatches, missing imports, unresolved references.
   - Definite logic bugs, off-by-one errors, infinite loops, unhandled edge cases.
   - Resource leaks, unclosed connections, race conditions.
   - Violations of explicit project standards or guidelines.

2. **Ignore Low-Signal Noise (Do NOT Flag)**:
   - Pre-existing issues not touched by the changes.
   - Subjective stylistic preferences or formatting (unless explicitly defined in project rules).
   - Pedantic nitpicks that a senior engineer would not flag.
   - Speculative bugs that depend on unknown external conditions.

## Review Steps

1. **Understand Intent & Context**:
   - Inspect the git diff and commit messages (`git diff`, `git log`, or `gh pr diff <PR>`).
   - Read the PR title, description, and related issues to understand the developer's objective.

2. **Check Project Guidelines & Rules**:
   - Identify and review any project rules (`GEMINI.md`, `AGENTS.md`, `CLAUDE.md`).
   - Verify that changed files comply with project conventions.

3. **Multi-Perspective Audit**:
   - **Correctness & Logic**: Trace data and control flow through every changed function and branch.
   - **Error Handling**: Check if error paths, exceptions, and null/undefined values are safely handled.
   - **Performance & Security**: Check for injection risks, unescaped queries, unnecessary allocations, or blocking calls.

4. **Output Structured Feedback**:
   - If issues are detected, group them with clear file references, line numbers, and actionable suggestions.
   - Provide committable code fixes for small, self-contained issues.
   - If no issues are found, conclude clearly: "No critical bugs or regressions found."

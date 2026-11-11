---
name: typescript-lsp
description: TypeScript and JavaScript language server guidance for type diagnostics, go-to-definition, reference checking, and strict type safety. Use when diagnosing TypeScript errors, setting up tsconfig, or refactoring TypeScript/JavaScript code.
---

# TypeScript LSP & Diagnostics

Guide for leveraging TypeScript Language Server Protocol (LSP) and compiler diagnostics for robust type safety.

## TypeScript Diagnostics Workflow

1. **Compiler Diagnostic Check**:
   - Run type-checking non-emitting pass:
     ```bash
     npx tsc --noEmit
     ```
   - For incremental projects:
     ```bash
     npx tsc --noEmit --incremental
     ```

2. **Common TypeScript Error Resolution**:
   - **TS2322 / TS2345 (Type mismatch)**: Narrow union types with type guards (`typeof`, `instanceof`, discriminated tags) instead of force-casting with `any`.
   - **TS2339 (Property does not exist)**: Check interface definitions, optional chaining (`?.`), or declare proper index signatures.
   - **TS2532 / TS2531 (Object possibly undefined/null)**: Use optional chaining or explicit null checks before property access.
   - **Strict Null Checks**: Avoid `!` (non-null assertion) unless the value is mathematically guaranteed non-null in that immediate scope.

3. **Modern Best Practices**:
   - Prefer `type` aliases for unions and tuples, `interface` for extensible object contracts.
   - Utilize `unknown` instead of `any` for untyped external boundaries, and parse with runtime validators (such as `zod`).
   - Use `as const` assertions for immutable configuration maps.

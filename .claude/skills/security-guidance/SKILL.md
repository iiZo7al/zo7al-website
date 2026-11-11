---
name: security-guidance
description: Automated security review, vulnerability detection, and pattern-based protection against injection, XSS, SSRF, auth bypass, unsafe deserialization, and leaked secrets. Use when asked to audit security, review changes for vulnerabilities, or ensure secure coding practices.
---

# Security Guidance

Comprehensive security review rules and vulnerability detection for code development.

## Critical Vulnerability Checks

### 1. Deserialization & Execution Risks
- **Python**: Never use raw `pickle.load`, `cPickle`, `dill`, or `marshal` on untrusted input. Use JSON or schema-validated tools (`pydantic`, `msgspec`).
- **YAML**: Always use `yaml.safe_load()`. Avoid `yaml.load()` or `yaml.unsafe_load()`.
- **PyTorch**: Always specify `torch.load(..., weights_only=True)`.

### 2. Injection Flaws
- **SQL Injection**: Always use parameterized queries / prepared statements. Never concatenate user variables directly into SQL strings.
- **Command Injection**: Avoid `shell=True` in Python `subprocess`, or string interpolation into `child_process.exec()` in Node.js. Use array-based argument passing (`subprocess.run(["cmd", arg])`).
- **CI/CD Workflows**: Never expand untrusted user inputs (issue titles, PR comments, author emails) directly inside GitHub Actions `run:` steps. Map them to intermediate `env:` variables first.

### 3. Web & API Security
- **XSS**: Avoid raw `innerHTML`, `dangerouslySetInnerHTML`, or unescaped HTML template interpolation.
- **SSRF**: Validate target URLs against a strict protocol and host allowlist before making server-side HTTP requests; block private IP ranges (127.0.0.1, 10.0.0.0/8, 169.254.169.254).
- **Path Traversal**: Validate and sanitize file paths using `path.resolve` or `os.path.abspath` and verify the resolved path remains strictly within the intended base directory.

### 4. Secrets & Credentials
- Scan code and configuration for hardcoded API keys, bearer tokens, passwords, and private certificates.
- Enforce environment variable loading (`process.env`, `os.environ`) and secret management.

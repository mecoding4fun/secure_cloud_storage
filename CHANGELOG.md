# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Security Hardening
- **Audit & Remediation Cycle**: Completed a comprehensive security audit and remediation pass fixing path traversal, symlink escapes, and authentication leakage.
- **Removed Live Secrets**: Ensure no live API keys or `.env` files are tracked in version control.
- **Service Worker Security**: Enforced strict same-origin token injection in the web client's Service Worker to prevent token leakage.
- **ZIP Operations**: Replaced external subprocess dependencies with pure-Python `zipfile` standard library and added LRU/TTL caching for zip streams.
- **UI & State**: Fixed `react-hooks/exhaustive-deps` in React Web Client and handled React state lifecycle `mounted` checks for Flutter exceptions.
- **Proxy & Middleware**: Hardened the FastAPI backend by removing query-string authentication and adding Caddy as a reverse proxy with HTTPS termination.
- **Observability & Backups**: Added structured JSON logging (without logging file contents or secrets) and an independent `restic` host-level backup strategy.

### Added
- `.github/workflows/ci.yml` for automated testing (pytest, flutter test).
- Dependabot configuration for npm, pip, and pub dependencies.
- `SECURITY.md`, `CONTRIBUTING.md`, and this `CHANGELOG.md` file.

### Cleaned
- Removed obsolete rewrite scripts (`rewrite_ui.py`, `rewrite_preview.py`, `rewrite_flutter.py`, `patch_remote.exp`).
- Maintained a clean `.gitignore` to prevent tracking `__pycache__`, `venv/`, and `.env` files.

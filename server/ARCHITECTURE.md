# Backend Architecture

The application has been refactored from a monolithic `server.py` script into a structured FastAPI modular layout to improve maintainability and security separation.

## Directory Structure
```
server/
├── server.py              # Main application entrypoint (kept for backwards compatibility). Sets up CORS and mounts routes.
├── core/                  # Centralized cross-cutting concerns
│   ├── config.py          # Environment variable loading, configuration constants.
│   ├── security.py        # Authentication (`verify_key`) and path resolution (`get_secure_path`).
│   └── limiter.py         # Rate-limiting configuration and instances.
├── api/                   # HTTP transport layer
│   └── routes.py          # FastAPI Routers for all endpoints. Maps HTTP requests to service functions.
└── services/              # Business logic and implementations
    ├── storage.py         # Standard filesystem operations (upload, delete, rename, mkdir, list).
    ├── streaming.py       # Media range-request and streaming logic.
    └── archive.py         # ZIP stream generation via OS subprocess.
```

## Import Rules & Avoid Circular Imports
1. **Core**: Must not import from `api` or `services`.
2. **Services**: Can import from `core` but never from `api` or other `services` unless absolutely necessary (no current dependencies exist between services).
3. **API**: Imports from `core` and `services`.
4. **Server**: The main initialization file imports from `core` and `api`.

### Authentication
The API enforces strict `Authorization: Bearer <token>` checking on all endpoints via `core/security.py`. Query-string authentication has been deliberately removed to prevent token leakage in server logs or proxy logs.

### Web Client Service Worker
To securely render media (images, videos) without query-string tokens and without requiring complex Blob/URL.createObjectURL workarounds that buffer files entirely in browser memory, the React application utilizes a background Service Worker (`sw.js`).
- **Token Injection**: The Service Worker transparently intercepts browser-native `<img src>` and `<video src>` requests matching the API base path and securely injects the `Authorization: Bearer` header.
- **Security Constraints**: It strictly enforces same-origin (`url.origin === self.location.origin`) before ever appending the token, guarantees responses are not cached cross-origin, and acts solely as a silent proxy. It deliberately never echoes the token back to the window via `postMessage`.

## Security Enforcement
- All authentication is performed via `core.security.verify_key` which is injected directly into API routes.
- All path validation, symlink rejection, and directory traversal mitigation is strictly isolated inside `core.security.get_secure_path`.
- No endpoint directly concatenates file paths.

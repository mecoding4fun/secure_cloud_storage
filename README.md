# Secure Cloud Storage

[![CI](https://github.com/mecoding4fun/secure_cloud_storage/actions/workflows/ci.yml/badge.svg)](https://github.com/mecoding4fun/secure_cloud_storage/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**Status:** This is a personal-use, self-hosted project. It has been hardened against common web vulnerabilities (path traversal, symlink escapes, unauthenticated access), but is designed for a **single-user, trusted-network threat model** (e.g., accessed via Tailscale or a private LAN). It is **not** designed for multi-tenant SaaS environments.

Secure Cloud Storage is a self-hosted, cross-platform file management system designed to provide a secure, personal cloud storage solution. It enables users to browse, stream, upload, download, and manage files from both a web interface and a mobile application, interacting with a centralized backend server.

## Key Features

- **Cross-Platform Access**: Includes a responsive React web client and a Flutter mobile application.
- **File Management**: Create folders, upload files, rename, and delete items securely.
- **Media Streaming**: Native support for HTTP Range requests allowing video streaming without downloading the entire file.
- **File Previews**: Built-in previews for images, text, and PDF files.
- **Drag & Drop Uploads**: (Web) Drag and drop files directly into the browser to upload them.
- **Mobile Integration**: Upload directly from the camera or gallery on Android/iOS.
- **ZIP Downloads**: Download entire folders as a single ZIP file dynamically.

## Screenshots

*(Placeholder: Web Client Dashboard)*
*(Placeholder: Mobile Client File Browser)*
*(Placeholder: Media Streaming View)*

## Setup Instructions

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mecoding4fun/secure_cloud_storage.git
   cd secure_cloud_storage
   ```

2. **Generate a secure API Key**:
   ```bash
   openssl rand -hex 32
   ```

3. **Configure Environment**:
   Copy `.env.example` to `.env` in the root directory:
   ```bash
   cp server/.env.example .env
   # Edit .env and set API_KEY to the value generated above
   ```

4. **Start the server**:
   ```bash
   docker compose up -d
   ```
   The backend will be available behind a Caddy reverse proxy on port 443 (or whatever is configured in the `Caddyfile`).

### Option 2: Manual Development Setup

#### Backend
1. `cd server`
2. `cp .env.example .env` and fill in `API_KEY`.
3. `python3 -m venv venv && source venv/bin/activate`
4. `pip install -r requirements.txt`
5. `uvicorn server:app --host 0.0.0.0 --port 8000 --reload`

#### Web Client
1. `cd web_client`
2. `cp .env.example .env.local`
3. Edit `.env.local` to point `VITE_API_BASE` to `http://localhost:8000` (or your Caddy proxy).
4. `npm install`
5. `npm run dev`

#### Mobile Client
1. `cd mobile_client`
2. `flutter pub get`
3. `flutter run`

## Documentation

- [ARCHITECTURE.md](server/ARCHITECTURE.md): System architecture and data flow.
- [DEPLOYMENT.md](DEPLOYMENT.md): Deployment, Caddy config, and key rotation.
- [BACKUP.md](BACKUP.md): Using the host-level restic backup scripts.
- [SECURITY.md](SECURITY.md): Reporting vulnerabilities.
- [CONTRIBUTING.md](CONTRIBUTING.md): Contributing guidelines.

## Security Features

- **Strict Authentication**: All endpoints require a Bearer token via `Authorization` header.
- **Path Sanitization**: Directory traversal and symlink escapes are actively mitigated via strict bounds checking.
- **Service Worker Protection**: The web client uses a Service Worker to intercept `<img src>`/`<video src>` tags and inject auth tokens on strictly same-origin requests, preventing token leakage into HTML DOM or logs.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

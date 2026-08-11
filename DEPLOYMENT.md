# SCS Containerized Deployment

This project includes a containerized deployment setup for the backend using Docker and Docker Compose.

## Prerequisites

- Docker
- Docker Compose (v2)

## Configuration

Secrets and configuration must be provided via environment variables. The easiest way is to create a `.env` file in the root directory (where `docker-compose.yml` is located). 

Example `.env` file:
```env
# Required
API_KEY=your_super_secret_api_key_here

# Optional Configurations (with defaults)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
MAX_UPLOAD_BYTES=104857600
RATE_LIMIT_DEFAULT=100/minute
RATE_LIMIT_EXPENSIVE=20/minute
```

### API Key Rotation
If your API key is ever compromised or exposed in client logs/code, you must rotate it:
1. Generate a new secure key (e.g., `openssl rand -hex 32`).
2. Update the `API_KEY` value in your server `.env` file.
3. Restart the server (`docker compose down && docker compose up -d`).
4. Re-login on all mobile and web clients using the new key.
5. Previous keys will instantly stop working.

## Running the Server

To build and start the server and reverse proxy in detached mode, run:
```bash
docker compose up -d --build
```

### Local Development
The server will be available via local unencrypted HTTP at `http://localhost:8000`. Caddy is configured to seamlessly forward these local requests directly to FastAPI while applying security limits.

### Production (HTTPS / Tailscale / Private Networks)
Caddy automatically handles HTTPS configuration on ports 80 and 443. 

If you are deploying this to a private network (like Tailscale) or a local domain name, it will generate its own trusted internal TLS certificates by default using `tls internal` config in the `Caddyfile`.

If you are deploying this to the public web (which is highly discouraged without strong VPNs), simply set `DOMAIN_NAME` in your `.env` (e.g. `DOMAIN_NAME=scs.example.com`) and remove `tls internal` from the `Caddyfile`. Caddy will instantly and automatically negotiate Let's Encrypt SSL certificates.

### Proxy Features
The Caddy proxy provides:
- **HTTPS Termination:** All TLS is securely terminated at Caddy. FastAPI itself is entirely firewalled from the network and only accessible through Caddy.
- **Header Protection:** It redacts sensitive `Authorization` headers from the proxy logs to prevent credential leakage.
- **Upload Hard Limits:** Sets a hard reverse proxy limit on request body size (default: 100MB) to prevent FastAPI from being drowned by oversized packets before the framework limits kick in.
- **Streaming Compatibility:** `reverse_proxy` seamlessly pipes standard Range/Content-Range streaming through without artificially buffering large files into memory.

### Health Check

The Docker container has a built-in health check using Python to hit the `/health` endpoint. You can view the status of the container by running:
```bash
docker ps
```

## Storage Persistence

The Docker container stores uploaded files securely in `/app/shared`. This directory is explicitly mounted as a volume in `docker-compose.yml` to the host directory `./server/shared`. This guarantees that if you stop, rebuild, or destroy the container, your data will perfectly persist on the host filesystem.

## Non-Containerized Execution

The existing application remains entirely capable of running outside Docker for development purposes:
```bash
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
fastapi dev server.py
```

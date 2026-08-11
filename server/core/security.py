import os
from pathlib import Path
from fastapi import Request, HTTPException
import secrets
from .config import API_KEY, SHARED_DIR, DANGEROUS_EXTENSIONS, logger

def verify_key(request: Request):
    if "key" in request.query_params:
        logger.warning("Authentication failed: Query-string auth attempted")
        raise HTTPException(status_code=400, detail="Query-string authentication is no longer supported. Use Authorization header.")
        
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        logger.warning("Authentication failed: Missing or malformed Authorization header")
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    key = auth_header.split(" ")[1]
    if not secrets.compare_digest(key, API_KEY):
        logger.warning("Authentication failed: Invalid API key")
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    logger.info("Authentication successful")
    return key

def get_secure_path(path: str, *filenames: str) -> str:
    if "\x00" in path:
        raise HTTPException(400, "NUL bytes are not allowed in paths")
    if len(path) > 1024:
        raise HTTPException(400, "Path too long")
    if os.path.isabs(path):
        raise HTTPException(400, "Absolute paths are not allowed")

    for name in filenames:
        if not name or name == "." or name == "..":
            raise HTTPException(400, "Invalid or empty filename")
        if "\x00" in name or "/" in name or "\\" in name:
            raise HTTPException(400, "Path separators and NUL bytes are not allowed in filenames")
        if len(name) > 255:
            raise HTTPException(400, "Filename too long")
        if Path(name).suffix.lower() in DANGEROUS_EXTENSIONS:
            raise HTTPException(400, "Dangerous extensions are not allowed")
            
    base = Path(SHARED_DIR).resolve()
    target_raw = Path(os.path.abspath(os.path.join(str(base), path, *filenames)))
    
    if target_raw.suffix.lower() in DANGEROUS_EXTENSIONS:
        raise HTTPException(400, "Dangerous extensions are not allowed")
        
    try:
        target_raw.relative_to(base)
    except ValueError:
        raise HTTPException(403, "Path traversal attempt detected")
        
    current = target_raw
    while current != base and str(current) != current.root:
        if current.is_symlink():
            raise HTTPException(403, "Symlinks are not allowed")
        current = current.parent
        
    return str(target_raw)

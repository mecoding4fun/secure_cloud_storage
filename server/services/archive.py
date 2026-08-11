import os
import time
import asyncio
import zipfile
import tempfile
import re
from collections import OrderedDict
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from core.config import logger
from concurrent.futures import ThreadPoolExecutor

class BoundedTTLCache:
    def __init__(self, maxsize=1000, ttl=3600):
        self.cache = OrderedDict()
        self.maxsize = maxsize
        self.ttl = ttl
        
    def _cleanup(self):
        now = time.time()
        keys_to_delete = [k for k, v in self.cache.items() if now - v['timestamp'] > self.ttl]
        for k in keys_to_delete:
            del self.cache[k]
        while len(self.cache) > self.maxsize:
            self.cache.popitem(last=False)
            
    def set(self, key, value):
        self._cleanup()
        self.cache[key] = {'value': value, 'timestamp': time.time()}
        self.cache.move_to_end(key)
        
    def get(self, key):
        self._cleanup()
        if key in self.cache:
            return self.cache[key]['value']
        return None
        
    def __contains__(self, key):
        self._cleanup()
        return key in self.cache

active_zips = BoundedTTLCache(maxsize=1000, ttl=3600)

async def generate_zip_stream(full_path: str, download_id: str = ""):
    if download_id:
        if not re.match(r'^[a-zA-Z0-9_-]{1,64}$', download_id):
            raise HTTPException(400, "Invalid download_id")

    if not os.path.exists(full_path):
        raise HTTPException(404, "Not found")
    if not os.path.isdir(full_path):
        raise HTTPException(400, "Not a directory")
        
    folder_name = os.path.basename(full_path.rstrip("/")) or "download"
    
    total_size = 0
    file_list = []
    for root, _, files in os.walk(full_path):
        for f in files:
            p = os.path.join(root, f)
            if not os.path.islink(p):
                total_size += os.path.getsize(p)
                file_list.append(p)
                
    if download_id:
        active_zips.set(download_id, {"status": "zipping", "bytes": 0, "total": total_size})
        
    async def iter_zip():
        bytes_sent = 0
        try:
            # Create a temporary file to hold the zip
            fd, temp_path = tempfile.mkstemp(suffix=".zip")
            os.close(fd)
            
            # Zip all files in a background thread to not block the event loop
            def build_zip():
                nonlocal bytes_sent
                with zipfile.ZipFile(temp_path, 'w', zipfile.ZIP_STORED) as zf:
                    for file_path in file_list:
                        arcname = os.path.relpath(file_path, full_path)
                        zf.write(file_path, arcname)
                        # Estimate bytes sent based on uncompressed size to update status
                        bytes_sent += os.path.getsize(file_path)
                        if download_id and download_id in active_zips:
                            active_zips.get(download_id)["bytes"] = bytes_sent
            
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(None, build_zip)
            
            # Stream the temporary file back to the client
            with open(temp_path, "rb") as f:
                while chunk := f.read(1024 * 1024):
                    yield chunk
                    
            os.unlink(temp_path)
        except Exception as e:
            logger.error(f"ZIP generation failed: {e}")
        finally:
            if download_id and download_id in active_zips:
                active_zips.get(download_id)["status"] = "done"

    return StreamingResponse(
        iter_zip(),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{folder_name}.zip"'}
    )

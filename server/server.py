# ===============================
# File Server using FastAPI
# ===============================

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # later restrict to your domain/app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- AUTH SECTION  ---------------- #
API_KEY = "SETAPIKEY"

def verify_key(key: str):
    if key != API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")


# -------- Secure shared root directory -------- #
SHARED_DIR = os.path.abspath("./shared/")  # -> ensure absolute path

def clean_path(p: str):
    """Prevents /root writes & ../../ traversal"""
    p = p.lstrip("/")           # remove leading slash
    p = p.replace("..", "")     # forbid escaping parent
    return p


# -----------------------------------------------------
# List files
# -----------------------------------------------------
@app.get("/files")
def list_files(path: str = "", key: str = Depends(verify_key)):
    path = clean_path(path)
    target_dir = os.path.join(SHARED_DIR, path)

    if not os.path.exists(target_dir):
        raise HTTPException(404, "Invalid path")

    items = os.listdir(target_dir)

    return {
        "path": path,
        "items": [
            {
                "name": item,
                "is_dir": os.path.isdir(os.path.join(target_dir, item)),
                "size": os.path.getsize(os.path.join(target_dir, item)) if not os.path.isdir(os.path.join(target_dir,item)) else None,
                "modified": os.path.getmtime(os.path.join(target_dir, item)),
            }
            for item in items
        ]
    }


# -----------------------------------------------------
# Download file (supports nested paths)
# -----------------------------------------------------
@app.get("/files/{file_path:path}")
def download_file(file_path: str, key: str = Depends(verify_key)):
    file_path = clean_path(file_path)
    full_path = os.path.join(SHARED_DIR, file_path)

    if not os.path.exists(full_path):
        raise HTTPException(404, "File not found")

    return FileResponse(full_path)


# -----------------------------------------------------
# Stream video
# -----------------------------------------------------
@app.get("/stream/{file_path:path}")
async def stream_video(file_path: str, request: Request, key: str = Depends(verify_key)):
    file_path = clean_path(file_path)
    full = os.path.join(SHARED_DIR, file_path)

    if not os.path.exists(full):
        return JSONResponse(status_code=404, content={"error": "Not found"})

    file_size = os.path.getsize(full)
    range_header = request.headers.get("Range")

    def iter_file(start=0, end=None):
        with open(full, "rb") as f:
            f.seek(start)
            while chunk := f.read(1024*1024):
                yield chunk

    if range_header:
        start = int(range_header.replace("bytes=", "").split("-")[0])
        end = file_size-1
        return StreamingResponse(
            iter_file(start,end),
            status_code=206,
            headers={
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(file_size-start),
                "Content-Type": "video/mp4"
            }
        )

    return StreamingResponse(open(full,"rb"), media_type="video/mp4")


# -----------------------------------------------------
# Upload file
# -----------------------------------------------------
@app.post("/upload")
async def upload_file(path: str="", file: UploadFile = File(...), key: str = Depends(verify_key)):
    path = clean_path(path)
    target_dir = os.path.join(SHARED_DIR, path)
    os.makedirs(target_dir, exist_ok=True)

    save_path = os.path.join(target_dir, file.filename)

    with open(save_path, "wb") as f:
        f.write(await file.read())

    return {"uploaded": file.filename, "path": path}


# -----------------------------------------------------
# Delete file or folder
# -----------------------------------------------------
@app.delete("/files")
def delete_file(name: str, path: str="", key: str = Depends(verify_key)):
    path = clean_path(path)
    target = os.path.join(SHARED_DIR, path, name)

    if not os.path.exists(target):
        raise HTTPException(404,"Not found")

    if os.path.isdir(target):
        os.rmdir(target)
    else:
        os.remove(target)

    return {"deleted": name}


# -----------------------------------------------------
# Rename
# -----------------------------------------------------
@app.put("/rename")
def rename_item(old_name: str, new_name: str, path: str="", key: str = Depends(verify_key)):
    path = clean_path(path)
    old = os.path.join(SHARED_DIR, path, old_name)
    new = os.path.join(SHARED_DIR, path, new_name)

    if not os.path.exists(old):
        raise HTTPException(404,"Item not found")

    os.rename(old,new)
    return {"from": old_name, "to": new_name}


# -----------------------------------------------------
# mkdir
# -----------------------------------------------------
@app.post("/mkdir")
def make_directory(name: str, path: str="", key: str = Depends(verify_key)):
    path = clean_path(path)
    target = os.path.join(SHARED_DIR, path, name)
    os.makedirs(target, exist_ok=True)
    return {"folder": name, "created_in": path}

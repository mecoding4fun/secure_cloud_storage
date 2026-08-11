from fastapi import APIRouter, Request, UploadFile, File, HTTPException
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse, Response
import os

from core.security import verify_key, get_secure_path
from core.limiter import limiter
from core.config import RATE_LIMIT_DEFAULT, RATE_LIMIT_EXPENSIVE, logger
from services.storage import (
    list_directory, 
    upload_file_to_disk, 
    delete_item_from_disk, 
    rename_item_on_disk, 
    make_directory_on_disk
)
from services.streaming import iter_file_streaming
from services.archive import generate_zip_stream, active_zips

router = APIRouter()

@router.get("/files")
@limiter.limit(RATE_LIMIT_DEFAULT)
def list_files(request: Request, path: str = ""):
    verify_key(request)
    target_dir = get_secure_path(path)
    return list_directory(target_dir, path)

@router.get("/files/{file_path:path}")
@limiter.limit(RATE_LIMIT_EXPENSIVE)
def download_file(request: Request, file_path: str):
    verify_key(request)
    full_path = get_secure_path(file_path)
    if not os.path.exists(full_path):
        raise HTTPException(404, "File not found")
    if not os.path.isfile(full_path):
        raise HTTPException(400, "Not a file")
    return FileResponse(full_path)

@router.post("/upload")
@limiter.limit(RATE_LIMIT_EXPENSIVE)
async def upload_file(request: Request, path: str="", file: UploadFile = File(...)):
    verify_key(request)
    filename = os.path.basename(file.filename or "")
    target_dir = get_secure_path(path)
    save_path = get_secure_path(path, filename)
    await upload_file_to_disk(file, target_dir, save_path)
    logger.info("File uploaded successfully", extra={"extra_info": {"virtual_path": path, "filename": filename}})
    return {"uploaded": filename, "path": path}

@router.delete("/files")
@limiter.limit(RATE_LIMIT_DEFAULT)
def delete_file(request: Request, name: str, path: str=""):
    verify_key(request)
    target = get_secure_path(path, name)
    delete_item_from_disk(target, name)
    logger.info("File/Directory deleted", extra={"extra_info": {"virtual_path": path, "name": name}})
    return {"deleted": name}

@router.put("/rename")
@limiter.limit(RATE_LIMIT_DEFAULT)
def rename_item(request: Request, old_name: str, new_name: str, path: str=""):
    verify_key(request)
    old = get_secure_path(path, old_name)
    new = get_secure_path(path, new_name)
    rename_item_on_disk(old, new, old_name, new_name)
    logger.info("Item renamed", extra={"extra_info": {"virtual_path": path, "old_name": old_name, "new_name": new_name}})
    return {"from": old_name, "to": new_name}

@router.post("/mkdir")
@limiter.limit(RATE_LIMIT_DEFAULT)
def make_directory(request: Request, name: str, path: str=""):
    verify_key(request)
    target = get_secure_path(path, name)
    make_directory_on_disk(target, name, path)
    logger.info("Directory created", extra={"extra_info": {"virtual_path": path, "name": name}})
    return {"folder": name, "created_in": path}

@router.get("/stream/{file_path:path}")
@limiter.limit(RATE_LIMIT_EXPENSIVE)
async def stream_video(request: Request, file_path: str):
    verify_key(request)
    full = get_secure_path(file_path)
    return iter_file_streaming(full, request)

@router.get("/zip")
@limiter.limit(RATE_LIMIT_EXPENSIVE)
async def download_zip(request: Request, path: str, download_id: str = ""):
    verify_key(request)
    full_path = get_secure_path(path)
    return await generate_zip_stream(full_path, download_id)

@router.get("/zip/status/{download_id}")
@limiter.limit(RATE_LIMIT_DEFAULT)
def get_zip_status(request: Request, download_id: str):
    verify_key(request)
    status = active_zips.get(download_id)
    if status:
        return status
    return {"status": "unknown"}

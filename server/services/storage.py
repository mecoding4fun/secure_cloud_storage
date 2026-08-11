import os
from fastapi import HTTPException
from fastapi.concurrency import run_in_threadpool
from core.config import logger, MAX_UPLOAD_BYTES

def list_directory(target_dir: str, path: str):
    if not os.path.exists(target_dir):
        raise HTTPException(404, "Invalid path")
    if not os.path.isdir(target_dir):
        raise HTTPException(400, "Not a directory")

    try:
        items = os.listdir(target_dir)
        result = []
        for item in items:
            item_path = os.path.join(target_dir, item)
            if os.path.islink(item_path):
                continue
            is_dir = os.path.isdir(item_path)
            result.append({
                "name": item,
                "is_dir": is_dir,
                "size": os.path.getsize(item_path) if not is_dir else None,
                "modified": os.path.getmtime(item_path),
            })
        return {"path": path, "items": result}
    except OSError as e:
        logger.error(f"Filesystem error in list_directory: {type(e).__name__} for path '{path}'")
        raise HTTPException(status_code=500, detail="Filesystem error")


async def upload_file_to_disk(file, target_dir: str, save_path: str):
    try:
        os.makedirs(target_dir, exist_ok=True)
        if os.path.lexists(save_path):
            raise HTTPException(status_code=409, detail="File already exists")
            
        bytes_written = 0
        with open(save_path, "wb") as f:
            while chunk := await file.read(1024 * 1024):
                bytes_written += len(chunk)
                if bytes_written > MAX_UPLOAD_BYTES:
                    f.close()
                    os.remove(save_path)
                    raise HTTPException(status_code=413, detail="Payload Too Large")
                await run_in_threadpool(f.write, chunk)
    except HTTPException:
        raise
    except OSError as e:
        logger.error(f"Filesystem error in upload_file: {type(e).__name__} for file '{save_path}'")
        raise HTTPException(status_code=500, detail="Filesystem error")
    finally:
        await file.close()

def delete_item_from_disk(target: str, name: str):
    if not os.path.exists(target):
        raise HTTPException(404,"Not found")
    try:
        if os.path.isdir(target):
            import shutil
            # Using shutil.rmtree might be dangerous, original used os.rmdir which requires empty directory
            os.rmdir(target)
        else:
            os.remove(target)
    except OSError as e:
        logger.error(f"Filesystem error in delete_item: {type(e).__name__} for name '{name}'")
        raise HTTPException(status_code=500, detail="Filesystem error")

def rename_item_on_disk(old: str, new: str, old_name: str, new_name: str):
    if not os.path.exists(old):
        raise HTTPException(404,"Item not found")
    try:
        os.rename(old, new)
    except OSError as e:
        logger.error(f"Filesystem error in rename_item: {type(e).__name__} from '{old_name}' to '{new_name}'")
        raise HTTPException(status_code=500, detail="Filesystem error")

def make_directory_on_disk(target: str, name: str, path: str):
    try:
        os.makedirs(target, exist_ok=True)
    except OSError as e:
        logger.error(f"Filesystem error in make_directory: {type(e).__name__} for name '{name}'")
        raise HTTPException(status_code=500, detail="Filesystem error")

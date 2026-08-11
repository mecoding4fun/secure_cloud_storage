import os
import mimetypes
from fastapi import HTTPException
from fastapi.responses import JSONResponse, Response, StreamingResponse
from core.config import logger

def iter_file_streaming(full: str, request):
    if not os.path.exists(full):
        return JSONResponse(status_code=404, content={"error": "Not found"})
    if not os.path.isfile(full):
        return JSONResponse(status_code=404, content={"error": "Not a file"})

    try:
        file_size = os.path.getsize(full)
        range_header = request.headers.get("Range")
        content_type = mimetypes.guess_type(full)[0] or "application/octet-stream"

        def iter_file(start: int, end: int):
            chunk_size = 1024 * 1024
            bytes_to_read = end - start + 1
            with open(full, "rb") as f:
                f.seek(start)
                while bytes_to_read > 0:
                    read_len = min(chunk_size, bytes_to_read)
                    chunk = f.read(read_len)
                    if not chunk:
                        break
                    bytes_to_read -= len(chunk)
                    yield chunk

        if range_header:
            if not range_header.startswith("bytes="):
                return Response(status_code=416, headers={"Content-Range": f"bytes */{file_size}"})
                
            ranges = range_header.replace("bytes=", "").split("-")
            if len(ranges) != 2:
                return Response(status_code=416, headers={"Content-Range": f"bytes */{file_size}"})
                
            start_str, end_str = ranges[0].strip(), ranges[1].strip()
            
            if start_str == "" and end_str == "":
                return Response(status_code=416, headers={"Content-Range": f"bytes */{file_size}"})
                
            if start_str == "":
                try:
                    suffix_len = int(end_str)
                    if suffix_len == 0:
                        return Response(status_code=416, headers={"Content-Range": f"bytes */{file_size}"})
                    start = max(0, file_size - suffix_len)
                    end = file_size - 1
                except ValueError:
                    return Response(status_code=416, headers={"Content-Range": f"bytes */{file_size}"})
            else:
                try:
                    start = int(start_str)
                except ValueError:
                    return Response(status_code=416, headers={"Content-Range": f"bytes */{file_size}"})
                    
                if end_str == "":
                    end = file_size - 1
                else:
                    try:
                        end = int(end_str)
                    except ValueError:
                        return Response(status_code=416, headers={"Content-Range": f"bytes */{file_size}"})
                        
            if start >= file_size or start > end:
                return Response(status_code=416, headers={"Content-Range": f"bytes */{file_size}"})
                
            end = min(end, file_size - 1)
            content_length = end - start + 1
            
            return StreamingResponse(
                iter_file(start, end),
                status_code=206,
                headers={
                    "Content-Range": f"bytes {start}-{end}/{file_size}",
                    "Accept-Ranges": "bytes",
                    "Content-Length": str(content_length),
                    "Content-Type": content_type
                }
            )

        return StreamingResponse(
            iter_file(0, file_size - 1),
            status_code=200,
            headers={
                "Accept-Ranges": "bytes",
                "Content-Length": str(file_size),
                "Content-Type": content_type
            }
        )
    except OSError as e:
        logger.error(f"Filesystem error in stream_video: {type(e).__name__} for path '{full}'")
        raise HTTPException(status_code=500, detail="Filesystem error")

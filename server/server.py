import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from core.config import logger, ALLOW_ORIGINS, API_KEY, SHARED_DIR, MAX_UPLOAD_BYTES
from core.limiter import limiter
from api.routes import router as api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Server starting up. SHARED_DIR mapped to: %s", SHARED_DIR)
    yield
    logger.info("Server shutting down.")

app = FastAPI(title="Secure Cloud Storage", lifespan=lifespan)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Internal server error on %s %s: %s", request.method, request.url.path, str(exc), exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,     
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Range", "Accept", "Origin"],
    expose_headers=["Content-Length", "Content-Range", "Accept-Ranges"],
)

@app.middleware("http")
async def add_security_headers_and_logging(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; frame-ancestors 'none'; script-src 'self'"
    
    # Avoid logging the health check endpoint repeatedly
    if request.url.path != "/health":
        if response.status_code >= 500:
            log_func = logger.error
        elif response.status_code >= 400:
            log_func = logger.warning
        else:
            log_func = logger.info
            
        log_func(
            "Request handled",
            extra={
                "extra_info": {
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "process_time_ms": round(process_time * 1000, 2)
                }
            }
        )
    return response

app.include_router(api_router)

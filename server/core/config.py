import os
import logging
from dotenv import load_dotenv

load_dotenv()

import json
from datetime import datetime, timezone

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "name": record.name,
            "message": record.getMessage()
        }
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
        if hasattr(record, "extra_info"):
            log_record.update(record.extra_info)
        return json.dumps(log_record)

handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger = logging.getLogger("secure_storage")
logger.setLevel(logging.INFO)
# Remove default handlers and add JSON handler
logger.handlers = []
logger.addHandler(handler)
logger.propagate = False

RATE_LIMIT_DEFAULT = os.getenv("RATE_LIMIT_DEFAULT", "100/minute")
RATE_LIMIT_EXPENSIVE = os.getenv("RATE_LIMIT_EXPENSIVE", "20/minute")
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", 100 * 1024 * 1024))
SHARED_DIR = os.path.abspath(os.getenv("SHARED_DIR", "./shared/"))

API_KEY = os.getenv("API_KEY")
if not API_KEY:
    raise RuntimeError("API_KEY environment variable is required")

CORS_ORIGINS_ENV = os.getenv("CORS_ORIGINS", "")
if not CORS_ORIGINS_ENV or "*" in CORS_ORIGINS_ENV:
    ALLOW_ORIGINS = []
else:
    ALLOW_ORIGINS = [origin.strip() for origin in CORS_ORIGINS_ENV.split(",") if origin.strip()]

DANGEROUS_EXTENSIONS = {
    ".html", ".htm", ".xhtml", ".php", ".phtml", ".php3", ".php4", ".php5", 
    ".jsp", ".asp", ".aspx", ".js", ".mjs", ".cgi", ".pl", ".sh", ".bat", 
    ".exe", ".dll", ".jar", ".vbs", ".svg"
}

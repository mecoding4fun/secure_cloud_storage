import os
import tempfile
import shutil
import pytest

# Create a temporary directory for testing
test_dir = tempfile.mkdtemp()

# Set environment variables BEFORE importing the app
os.environ["API_KEY"] = "test_secret_key"
os.environ["SHARED_DIR"] = test_dir
os.environ["CORS_ORIGINS"] = "http://localhost:5173"
os.environ["MAX_UPLOAD_BYTES"] = str(10 * 1024 * 1024)

# Now it's safe to import the app and config
from server import app
from fastapi.testclient import TestClient
from core.config import SHARED_DIR, API_KEY

@pytest.fixture(scope="session", autouse=True)
def setup_and_teardown():
    # Setup: ensure the test directory exists
    os.makedirs(test_dir, exist_ok=True)
    yield
    # Teardown: remove the temporary directory
    shutil.rmtree(test_dir, ignore_errors=True)

@pytest.fixture
def client():
    # We can use TestClient(app)
    return TestClient(app)

@pytest.fixture
def auth_headers():
    return {"Authorization": f"Bearer {API_KEY}"}

@pytest.fixture
def shared_dir():
    return SHARED_DIR

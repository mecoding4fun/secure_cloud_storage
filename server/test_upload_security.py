import pytest
from fastapi.testclient import TestClient
import os
from server import app, API_KEY, SHARED_DIR, MAX_UPLOAD_BYTES

client = TestClient(app)
HEADERS = {"Authorization": f"Bearer {API_KEY}"}

def test_upload_valid_file():
    with open("test.txt", "wb") as f:
        f.write(b"hello world")
    
    with open("test.txt", "rb") as f:
        res = client.post("/upload", headers=HEADERS, files={"file": ("test.txt", f, "text/plain")})
    
    assert res.status_code == 200
    assert os.path.exists(os.path.join(SHARED_DIR, "test.txt"))
    os.remove("test.txt")
    os.remove(os.path.join(SHARED_DIR, "test.txt"))

def test_upload_dangerous_extension():
    res = client.post("/upload", headers=HEADERS, files={"file": ("malicious.html", b"<h1>xss</h1>")})
    assert res.status_code == 400
    assert "Dangerous extensions are not allowed" in res.json()["detail"]

def test_upload_path_traversal():
    # FastAPI's UploadFile uses Starlette, we can just pass a malicious filename string
    res = client.post("/upload", headers=HEADERS, files={"file": ("../../../tmp/nonexistent_traversal.txt", b"hello")})
    # Our os.path.basename extracts the basename
    assert res.status_code in [200, 400, 409]
    assert not os.path.exists(os.path.join(SHARED_DIR, "../../../tmp/nonexistent_traversal.txt"))
    if res.status_code == 200:
        if os.path.exists(os.path.join(SHARED_DIR, "nonexistent_traversal.txt")):
            os.remove(os.path.join(SHARED_DIR, "nonexistent_traversal.txt"))

def test_upload_file_conflict():
    with open(os.path.join(SHARED_DIR, "conflict.txt"), "w") as f:
        f.write("existing")
    
    res = client.post("/upload", headers=HEADERS, files={"file": ("conflict.txt", b"new content")})
    assert res.status_code == 409
    assert "File already exists" in res.json()["detail"]
    
    os.remove(os.path.join(SHARED_DIR, "conflict.txt"))

def test_upload_too_large(monkeypatch):
    # Monkeypatch MAX_UPLOAD_BYTES in the server module for this test
    import services.storage
    services.storage.MAX_UPLOAD_BYTES = 5  # 5 bytes max
    
    res = client.post("/upload", headers=HEADERS, files={"file": ("large.txt", b"123456")})
    assert res.status_code == 413
    assert "Payload Too Large" in res.json()["detail"]
    assert not os.path.exists(os.path.join(SHARED_DIR, "large.txt"))

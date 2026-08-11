import pytest
from fastapi.testclient import TestClient
import os
from server import app, API_KEY, SHARED_DIR

client = TestClient(app)
HEADERS = {"Authorization": f"Bearer {API_KEY}"}

def test_download_valid_file():
    # Setup
    file_path = os.path.join(SHARED_DIR, "download_test.txt")
    with open(file_path, "wb") as f:
        f.write(b"file content")
        
    res = client.get("/files/download_test.txt", headers=HEADERS)
    assert res.status_code == 200
    assert res.content == b"file content"
    
    # Cleanup
    os.remove(file_path)

def test_download_nonexistent_file():
    res = client.get("/files/doesnotexist.txt", headers=HEADERS)
    assert res.status_code == 404

def test_download_directory_fails():
    dir_path = os.path.join(SHARED_DIR, "download_dir")
    os.makedirs(dir_path, exist_ok=True)
    
    res = client.get("/files/download_dir", headers=HEADERS)
    assert res.status_code == 400
    
    os.rmdir(dir_path)

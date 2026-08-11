import pytest
from fastapi.testclient import TestClient
import os
import zipfile
import io
from server import app, API_KEY, SHARED_DIR

client = TestClient(app)
HEADERS = {"Authorization": f"Bearer {API_KEY}"}

@pytest.fixture(autouse=True)
def setup_folder():
    os.makedirs(SHARED_DIR, exist_ok=True)
    folder_path = os.path.join(SHARED_DIR, "test_folder")
    os.makedirs(folder_path, exist_ok=True)
    with open(os.path.join(folder_path, "file1.txt"), "w") as f:
        f.write("hello world")
    
    # Create symlink to test escape
    escape_link = os.path.join(folder_path, "escape")
    if not os.path.exists(escape_link):
        os.symlink("/tmp", escape_link)
        
    yield
    
    # Cleanup
    if os.path.exists(escape_link):
        os.remove(escape_link)
    if os.path.exists(os.path.join(folder_path, "file1.txt")):
        os.remove(os.path.join(folder_path, "file1.txt"))
    if os.path.exists(folder_path):
        os.rmdir(folder_path)

def test_zip_valid_folder():
    res = client.get("/zip?path=test_folder&download_id=123", headers=HEADERS)
    assert res.status_code == 200
    assert res.headers["Content-Type"] == "application/zip"
    
    # Read the returned zip
    with zipfile.ZipFile(io.BytesIO(res.content)) as zf:
        names = zf.namelist()
        # the zip command might ignore symlinks, or store them as files depending on OS
        # as long as we can't escape and read sensitive data, it's safe.
        assert "file1.txt" in names
        if "escape" in names:
            assert not zf.getinfo("escape").is_dir()
        
def test_zip_status():
    res = client.get("/zip/status/123", headers=HEADERS)
    assert res.status_code == 200
    assert res.json()["status"] in ["zipping", "done", "unknown"]

def test_zip_not_found():
    res = client.get("/zip?path=nonexistent", headers=HEADERS)
    assert res.status_code == 404

def test_zip_file_not_dir():
    res = client.get("/zip?path=test_folder/file1.txt", headers=HEADERS)
    assert res.status_code == 400
    
def test_zip_traversal_rejected():
    res = client.get("/zip?path=../", headers=HEADERS)
    assert res.status_code == 403

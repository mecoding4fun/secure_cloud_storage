import pytest
from fastapi.testclient import TestClient
import os
from server import app, API_KEY, SHARED_DIR

client = TestClient(app)
HEADERS = {"Authorization": f"Bearer {API_KEY}"}

def test_mkdir_valid_name():
    res = client.post("/mkdir?name=valid_folder", headers=HEADERS)
    assert res.status_code == 200
    assert os.path.exists(os.path.join(SHARED_DIR, "valid_folder"))
    
    # cleanup
    client.delete("/files?name=valid_folder", headers=HEADERS)

def test_mkdir_invalid_names():
    invalid_names = [
        "",                 # empty
        ".",                # dot
        "..",               # dot dot
        "folder/sub",       # path separator
        "folder\\sub",      # backslash
        "bad%00name",       # NUL byte
        "a" * 300,          # too long
        "test.html",        # dangerous extension
    ]
    
    for name in invalid_names:
        res = client.post(f"/mkdir?name={name}", headers=HEADERS)
        assert res.status_code == 400
        
def test_rename_valid_names():
    # Setup
    client.post("/mkdir?name=old_folder", headers=HEADERS)
    
    # Rename
    res = client.put("/rename?old_name=old_folder&new_name=new_folder", headers=HEADERS)
    assert res.status_code == 200
    
    assert not os.path.exists(os.path.join(SHARED_DIR, "old_folder"))
    assert os.path.exists(os.path.join(SHARED_DIR, "new_folder"))
    
    # Cleanup
    client.delete("/files?name=new_folder", headers=HEADERS)

def test_rename_invalid_new_name():
    client.post("/mkdir?name=test_folder", headers=HEADERS)
    
    # Attempt to rename to an invalid name
    res = client.put("/rename?old_name=test_folder&new_name=invalid/name", headers=HEADERS)
    assert res.status_code == 400
    assert "Path separators and NUL bytes are not allowed in filenames" in res.json()["detail"]
    
    # Cleanup
    client.delete("/files?name=test_folder", headers=HEADERS)

def test_path_validation():
    # NUL byte in path
    res = client.get("/files?path=nested%00path", headers=HEADERS)
    assert res.status_code == 400
    assert "NUL bytes are not allowed in paths" in res.json()["detail"]
    
    # Path too long
    res = client.get(f"/files?path={'a'*1500}", headers=HEADERS)
    assert res.status_code == 400
    assert "Path too long" in res.json()["detail"]

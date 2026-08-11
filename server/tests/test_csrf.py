import pytest
from fastapi.testclient import TestClient
import os
from server import app, API_KEY, SHARED_DIR

client = TestClient(app)

def test_csrf_upload_fails_without_auth():
    # Simulate a cross-origin form submission (which cannot set Authorization headers)
    # The browser would just send the POST request.
    with open("test.txt", "wb") as f:
        f.write(b"hello world")
        
    with open("test.txt", "rb") as f:
        res = client.post("/upload", files={"file": ("test.txt", f, "text/plain")})
        
    assert res.status_code == 401
    assert "Unauthorized" in res.json()["detail"]
    assert not os.path.exists(os.path.join(SHARED_DIR, "test.txt"))
    os.remove("test.txt")

def test_csrf_mkdir_fails_without_auth():
    # Simulate an unauthenticated POST
    res = client.post("/mkdir?name=csrf_folder")
    assert res.status_code == 401
    assert not os.path.exists(os.path.join(SHARED_DIR, "csrf_folder"))

def test_csrf_rename_fails_without_auth():
    # Create folder legitimately
    headers = {"Authorization": f"Bearer {API_KEY}"}
    client.post("/mkdir?name=valid_folder", headers=headers)
    
    # Attempt rename without auth
    res = client.put("/rename?old_name=valid_folder&new_name=hacked_folder")
    assert res.status_code == 401
    
    assert os.path.exists(os.path.join(SHARED_DIR, "valid_folder"))
    assert not os.path.exists(os.path.join(SHARED_DIR, "hacked_folder"))
    
    # Cleanup
    client.delete("/files?name=valid_folder", headers=headers)

def test_csrf_delete_fails_without_auth():
    headers = {"Authorization": f"Bearer {API_KEY}"}
    client.post("/mkdir?name=safe_folder", headers=headers)
    
    res = client.delete("/files?name=safe_folder")
    assert res.status_code == 401
    
    assert os.path.exists(os.path.join(SHARED_DIR, "safe_folder"))
    
    # Cleanup
    client.delete("/files?name=safe_folder", headers=headers)
    
def test_csrf_with_query_string_fails():
    # Even if attacker tries to pass key in query string as in old vulnerable versions
    res = client.post(f"/mkdir?name=csrf_query&key={API_KEY}")
    assert res.status_code == 400
    assert "Query-string authentication is no longer supported" in res.json()["detail"]
    assert not os.path.exists(os.path.join(SHARED_DIR, "csrf_query"))

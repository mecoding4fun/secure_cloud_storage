import pytest
from fastapi.testclient import TestClient
import os
from pathlib import Path

# Since server.py calls load_dotenv and accesses os.environ, we should set API_KEY if needed.
# But load_dotenv will pick up the .env file we created earlier.
from server import app, SHARED_DIR, API_KEY

client = TestClient(app)

def test_missing_auth_rejected():
    res = client.get("/files?path=/")
    assert res.status_code == 401

def test_invalid_auth_rejected():
    res = client.get("/files?path=/", headers={"Authorization": "Bearer badkey"})
    assert res.status_code == 401
    
def test_query_string_auth_rejected():
    res = client.get(f"/files?path=/&key={API_KEY}")
    assert res.status_code == 400
    assert "Query-string authentication is no longer supported" in res.json()["detail"]

def test_absolute_path_rejected():
    res = client.get(f"/files?path=/etc/passwd", headers={"Authorization": f"Bearer {API_KEY}"})
    assert res.status_code == 400
    assert "Absolute paths are not allowed" in res.json()["detail"]

def test_traversal_path_rejected():
    res = client.get(f"/files?path=../", headers={"Authorization": f"Bearer {API_KEY}"})
    assert res.status_code == 403
    assert "Path traversal attempt detected" in res.json()["detail"]

def test_encoded_traversal_rejected():
    res = client.get(f"/files?path=..%2F..%2F", headers={"Authorization": f"Bearer {API_KEY}"})
    assert res.status_code == 403
    assert "Path traversal attempt detected" in res.json()["detail"]
    
def test_deep_traversal_rejected():
    res = client.get(f"/files?path=....//....//etc/passwd", headers={"Authorization": f"Bearer {API_KEY}"})
    # Might return 400 Invalid path if it resolves to something weird, or 403.
    # It will definitely not return 200/404 exposing the filesystem.
    assert res.status_code in [400, 403, 404]

def test_valid_nested_path():
    nested = os.path.join(SHARED_DIR, "nested")
    os.makedirs(nested, exist_ok=True)
    res = client.get(f"/files?path=nested", headers={"Authorization": f"Bearer {API_KEY}"})
    assert res.status_code == 200

def test_nonexistent_path_returns_404():
    res = client.get(f"/files?path=doesnotexist12345", headers={"Authorization": f"Bearer {API_KEY}"})
    assert res.status_code == 404

def test_symlink_escape_rejected():
    # Setup symlink pointing outside
    outside_file = "/tmp/outside_test_file.txt"
    with open(outside_file, "w") as f:
        f.write("secret")
        
    symlink_path = os.path.join(SHARED_DIR, "symlink_test")
    if os.path.exists(symlink_path):
        os.remove(symlink_path)
    os.symlink(outside_file, symlink_path)
    
    # Try to read the symlink
    res = client.get(f"/files/symlink_test", headers={"Authorization": f"Bearer {API_KEY}"})
    assert res.status_code == 403
    
    # Cleanup
    os.remove(symlink_path)
    os.remove(outside_file)

import pytest
from fastapi.testclient import TestClient
import os
from server import app

client = TestClient(app)

def test_cors_allowed_origin():
    # CORS_ORIGINS is loaded in server.py, which was initialized with http://localhost:5173
    # Wait, the environment variable is read at module load time.
    # In .env it's http://localhost:5173
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "GET"
    }
    res = client.options("/files", headers=headers)
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "http://localhost:5173"

def test_cors_disallowed_origin():
    headers = {
        "Origin": "https://malicious.com",
        "Access-Control-Request-Method": "GET"
    }
    res = client.options("/files", headers=headers)
    assert res.status_code == 400 or res.headers.get("access-control-allow-origin") is None
    if res.status_code == 200:
        assert res.headers.get("access-control-allow-origin") != "https://malicious.com"

def test_cors_methods_and_headers():
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "PATCH" # Not allowed
    }
    res = client.options("/files", headers=headers)
    # FastAPI usually returns 400 for disallowed methods in preflight
    assert res.status_code == 400
    
def test_cors_credentials_false():
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "GET"
    }
    res = client.options("/files", headers=headers)
    assert res.status_code == 200
    # allow_credentials=False means this header should NOT be present or should be false
    assert "access-control-allow-credentials" not in res.headers or res.headers["access-control-allow-credentials"] == "false"

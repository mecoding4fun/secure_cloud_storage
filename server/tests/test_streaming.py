import pytest
from fastapi.testclient import TestClient
import os
from server import app, API_KEY, SHARED_DIR

client = TestClient(app)
HEADERS = {"Authorization": f"Bearer {API_KEY}"}

@pytest.fixture(autouse=True)
def setup_file():
    os.makedirs(SHARED_DIR, exist_ok=True)
    file_path = os.path.join(SHARED_DIR, "test_stream.txt")
    with open(file_path, "wb") as f:
        f.write(b"0123456789")
    yield
    if os.path.exists(file_path):
        os.remove(file_path)

def test_stream_no_range():
    res = client.get("/stream/test_stream.txt", headers=HEADERS)
    assert res.status_code == 200
    assert res.headers["Content-Length"] == "10"
    assert res.headers["Content-Type"] == "text/plain"
    assert res.content == b"0123456789"

def test_stream_start_only():
    headers = HEADERS.copy()
    headers["Range"] = "bytes=5-"
    res = client.get("/stream/test_stream.txt", headers=headers)
    assert res.status_code == 206
    assert res.headers["Content-Range"] == "bytes 5-9/10"
    assert res.headers["Content-Length"] == "5"
    assert res.content == b"56789"

def test_stream_start_end():
    headers = HEADERS.copy()
    headers["Range"] = "bytes=2-5"
    res = client.get("/stream/test_stream.txt", headers=headers)
    assert res.status_code == 206
    assert res.headers["Content-Range"] == "bytes 2-5/10"
    assert res.headers["Content-Length"] == "4"
    assert res.content == b"2345"

def test_stream_suffix():
    headers = HEADERS.copy()
    headers["Range"] = "bytes=-3"
    res = client.get("/stream/test_stream.txt", headers=headers)
    assert res.status_code == 206
    assert res.headers["Content-Range"] == "bytes 7-9/10"
    assert res.headers["Content-Length"] == "3"
    assert res.content == b"789"

def test_stream_invalid_range():
    headers = HEADERS.copy()
    headers["Range"] = "bytes=20-30"
    res = client.get("/stream/test_stream.txt", headers=headers)
    assert res.status_code == 416
    assert res.headers["Content-Range"] == "bytes */10"

def test_stream_invalid_format():
    headers = HEADERS.copy()
    headers["Range"] = "bytes=abc-"
    res = client.get("/stream/test_stream.txt", headers=headers)
    assert res.status_code == 416

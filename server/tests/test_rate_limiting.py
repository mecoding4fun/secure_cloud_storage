import pytest
from fastapi.testclient import TestClient
import os
from server import app, API_KEY

client = TestClient(app)

def test_rate_limiting():
    # Make 150 requests with an invalid key to see if we get 429
    responses = []
    for _ in range(150):
        res = client.get("/files?path=/", headers={"Authorization": "Bearer badkey"})
        responses.append(res.status_code)
        if res.status_code == 429:
            break
            
    assert 429 in responses, f"Rate limiting did not trigger, got statuses: {set(responses)}"

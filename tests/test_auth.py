def test_register_creates_user(client):
    response = client.post(
        "/register", json={"username": "alice", "password": "supersecret"}
    )
    assert response.status_code == 201
    assert response.json["message"] == "User created successfully."


def test_register_rejects_duplicate_username(client):
    client.post("/register", json={"username": "bob", "password": "pw123456"})
    response = client.post(
        "/register", json={"username": "bob", "password": "different"}
    )
    assert response.status_code == 400


def test_login_returns_tokens(client):
    client.post("/register", json={"username": "carol", "password": "mypassword"})
    response = client.post(
        "/login", json={"username": "carol", "password": "mypassword"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json
    assert "refresh_token" in response.json


def test_login_rejects_wrong_password(client):
    client.post("/register", json={"username": "dave", "password": "correcthorse"})
    response = client.post(
        "/login", json={"username": "dave", "password": "wrongpassword"}
    )
    assert response.status_code == 401


def test_logout_revokes_token(client):
    client.post("/register", json={"username": "erin", "password": "pw123456"})
    login_response = client.post(
        "/login", json={"username": "erin", "password": "pw123456"}
    )
    token = login_response.json["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    logout_response = client.post("/logout", headers=headers)
    assert logout_response.status_code == 200

    blocked_response = client.get("/item", headers=headers)
    assert blocked_response.status_code == 401
    assert blocked_response.json["error"] == "token_revoked"

def _auth_headers(client, username="itemtester", password="pw123456"):
    client.post("/register", json={"username": username, "password": password})
    login = client.post("/login", json={"username": username, "password": password})
    return {"Authorization": f"Bearer {login.json['access_token']}"}


def test_create_and_get_item(client):
    headers = _auth_headers(client)

    store_response = client.post("/store/TestStore", headers=headers)
    assert store_response.status_code == 201
    store_id = store_response.json["id"]

    item_response = client.post(
        "/item/Chair", json={"price": 49.99, "store_id": store_id}, headers=headers
    )
    assert item_response.status_code == 201
    assert item_response.json["price"] == 49.99

    get_response = client.get("/item/Chair", headers=headers)
    assert get_response.status_code == 200
    assert get_response.json["name"] == "Chair"


def test_get_all_items_requires_auth(client):
    response = client.get("/item")
    assert response.status_code == 401


def test_create_item_rejects_non_fresh_token(client):
    """Бонус: /item POST має @jwt_required(fresh=True) — токен,
    отриманий через /refresh, НЕ fresh і має бути відхилений."""
    username, password = "freshtester", "pw123456"
    client.post("/register", json={"username": username, "password": password})
    login = client.post("/login", json={"username": username, "password": password})
    fresh_headers = {"Authorization": f"Bearer {login.json['access_token']}"}
    refresh_response = client.post(
        "/refresh",
        headers={"Authorization": f"Bearer {login.json['refresh_token']}"},
    )
    non_fresh_headers = {
        "Authorization": f"Bearer {refresh_response.json['access_token']}"
    }

    store_response = client.post("/store/AnotherStore", headers=fresh_headers)
    store_id = store_response.json["id"]

    response = client.post(
        "/item/Table",
        json={"price": 20, "store_id": store_id},
        headers=non_fresh_headers,
    )
    assert response.status_code == 401
    assert response.json["error"] == "fresh_token_required"
    

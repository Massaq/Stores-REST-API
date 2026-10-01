# Stores REST API

[![Tests](https://github.com/Massaq/Stores-REST-API/actions/workflows/tests.yml/badge.svg)](https://github.com/Massaq/Stores-REST-API/actions/workflows/tests.yml)

A REST API for managing stores, items, and tags. Built with Flask,
JWT authentication, background tasks via Celery, and a Redis-backed
blocklist for revoked tokens.

## Stack

- **Python / Flask / Flask-Smorest** — REST API with automatic OpenAPI documentation
- **SQLAlchemy + PostgreSQL** — ORM and production database
- **Flask-JWT-Extended** — authentication via access/refresh tokens
- **Redis** — stores revoked JWT tokens with an automatic TTL,
  instead of an in-memory `set()` that doesn't survive a server restart
- **Celery** — background tasks, so requests don't block on slow operations
- **Docker / docker-compose** — four services: `web`, `worker`, `redis`, `postgres`
- **pytest** — tests for authentication, the blocklist, and CRUD endpoints
- **GitHub Actions** — tests run automatically on every push

## Getting Started

```bash
git clone https://github.com/Massaq/Stores-REST-API.git
cd Stores-REST-API
cp .env.example .env   # and put your JWT_SECRET_KEY in there
docker compose up --build
```

The API will be available at `http://localhost:5001`,
and Swagger UI at `http://localhost:5001/swagger-ui`.

## Tests

```bash
docker compose up -d redis
pip install -r requirements-dev.txt
pytest -v
```

## Main Endpoints

| Method   | Path           | Description                                              |
| -------- | -------------- | -------------------------------------------------------- |
| POST     | `/register`    | Register a user (+ background email via Celery)          |
| POST     | `/login`       | Obtain access/refresh tokens                             |
| POST     | `/logout`      | Revoke a token (Redis blocklist)                         |
| POST     | `/refresh`     | Refresh the access token                                 |
| GET/POST | `/item/<name>` | Get / create an item                                     |
| GET/POST | `/store`       | List / create stores                                     |
| GET/POST | `/tag/<name>`  | Tags for items                                           |

## Future Improvements

- [ ] Alembic migrations instead of `db.create_all()`
- [ ] Pagination and search for `/item`
- [ ] Tests against a real Postgres instance (currently in-memory SQLite for speed)

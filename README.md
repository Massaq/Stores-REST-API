# Stores REST API

[![Tests](https://github.com/Massaq/Stores-REST-API/actions/workflows/tests.yml/badge.svg)](https://github.com/Massaq/Stores-REST-API/actions/workflows/tests.yml)

REST API для управління магазинами, товарами і тегами. Побудований на Flask
із JWT-автентифікацією, фоновими задачами через Celery та Redis-backed
blocklist для відкликаних токенів

## Стек

- **Python / Flask / Flask-Smorest** — REST API з автоматичною OpenAPI-документацією
- **SQLAlchemy + PostgreSQL** — ORM і продакшн-база даних
- **Flask-JWT-Extended** — автентифікація через access/refresh токени
- **Redis** — зберігає відкликані JWT-токени з автоматичним TTL,
  замість in-memory `set()`, що не переживає перезапуск сервера
- **Celery** — фонові задачі, щоб запит не блокувався на повільних операціях
- **Docker / docker-compose** — чотири сервіси: `web`, `worker`, `redis`, `postgres`
- **pytest** — тести для автентифікації, blocklist'а і CRUD ендпоінтів
- **GitHub Actions** — тести автоматично запускаються при кожному push

## Запуск

```bash
git clone https://github.com/Massaq/Stores-REST-API.git
cd Stores-REST-API
cp .env.example .env   # і встав туди JWT_SECRET_KEY
docker compose up --build
```

API буде доступний на `http://localhost:5001`,
Swagger UI — на `http://localhost:5001/swagger-ui`.

## Тести

```bash
docker compose up -d redis
pip install -r requirements-dev.txt
pytest -v
```

## Основні ендпоінти

| Метод    | Шлях           | Опис                                                  |
| -------- | -------------- | ----------------------------------------------------- |
| POST     | `/register`    | Реєстрація користувача (+ фоновий email через Celery) |
| POST     | `/login`       | Отримати access/refresh токени                        |
| POST     | `/logout`      | Відкликати токен (Redis blocklist)                    |
| POST     | `/refresh`     | Оновити access-токен                                  |
| GET/POST | `/item/<name>` | Отримати / створити товар                             |
| GET/POST | `/store`       | Список / створення магазинів                          |
| GET/POST | `/tag/<name>`  | Теги для товарів                                      |

## Що можна покращити далі

- [ ] Alembic-міграції замість `db.create_all()`
- [ ] Пагінація та пошук для `/item`
- [ ] Тести проти реальної Postgres (зараз — in-memory SQLite для швидкості)

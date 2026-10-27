import os
from datetime import timedelta

import redis
from dotenv import load_dotenv
from redis.exceptions import RedisError

load_dotenv()

BLOCKLIST: redis.Redis = redis.Redis.from_url(
    os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    decode_responses=True,
)

JTI_EXPIRES: timedelta = timedelta(hours=1)
_FALLBACK_BLOCKLIST: set[str] = set()


def add_jti_to_blocklist(jti: str) -> None:
    try:
        BLOCKLIST.set(jti, "revoked", ex=JTI_EXPIRES)
    except RedisError:
        _FALLBACK_BLOCKLIST.add(jti)


def is_jti_blocklisted(jti: str) -> bool:
    try:
        return bool(BLOCKLIST.exists(jti) == 1)
    except RedisError:
        return jti in _FALLBACK_BLOCKLIST
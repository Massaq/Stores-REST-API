import os
from datetime import timedelta

import redis
from dotenv import load_dotenv

load_dotenv()

BLOCKLIST = redis.Redis.from_url(
    os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    decode_responses=True,
)


JTI_EXPIRES = timedelta(hours=1)


def add_jti_to_blocklist(jti: str) -> None:
    BLOCKLIST.set(jti, "revoked", ex=JTI_EXPIRES)


def is_jti_blocklisted(jti: str) -> bool:
    return BLOCKLIST.exists(jti) == 1
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
import bcrypt

from app.core.config import settings


MAX_BCRYPT_PASSWORD_BYTES = 72


def _encode_password(password: str) -> bytes:
    raw = password.encode("utf-8")
    return raw if len(raw) <= MAX_BCRYPT_PASSWORD_BYTES else raw[:MAX_BCRYPT_PASSWORD_BYTES]


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(_encode_password(plain_password), hashed_password.encode("utf-8"))


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(_encode_password(password), bcrypt.gensalt()).decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None

# ==========================================
# TRYONIX - PASSWORD SECURITY
# ==========================================

from pwdlib import PasswordHash


# Initialize Argon2 password hashing
password_hash = PasswordHash.recommended()


# ==========================================
# HASH PASSWORD
# ==========================================

def hash_password(password: str) -> str:
    return password_hash.hash(password)


# ==========================================
# VERIFY PASSWORD
# ==========================================

def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    return password_hash.verify(
        plain_password,
        hashed_password
    )


# ==========================================
# JWT TOKEN GENERATION
# ==========================================

import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
)

if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is missing from .env")


def create_access_token(user_id: int) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "exp": expiration,
        "iat": datetime.now(timezone.utc),
        "type": "access"
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


from fastapi import HTTPException, status

def decode_access_token(token: str) -> int:
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        if payload.get("type") != "access":
            raise ValueError("Invalid token type")

        return int(payload["sub"])

    except (jwt.InvalidTokenError, ValueError, KeyError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
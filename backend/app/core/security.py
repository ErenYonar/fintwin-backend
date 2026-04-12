# -*- coding: utf-8 -*-
import os
import hashlib
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# ── JWT Ayarları ──────────────────────────────────────────────────────────────
SECRET_KEY  = os.environ.get("FINTWIN_SECRET_KEY", "fintwin-super-secret-key-change-in-prod")
ALGORITHM   = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7   # 7 gün

# ── SMTP Ayarları ─────────────────────────────────────────────────────────────
SMTP_HOST   = os.environ.get("FINTWIN_SMTP_HOST", "smtp-relay.brevo.com")
SMTP_PORT   = int(os.environ.get("FINTWIN_SMTP_PORT", "587"))
SMTP_USER   = os.environ.get("FINTWIN_SMTP_USER", "")
SMTP_PASS   = os.environ.get("FINTWIN_SMTP_PASS", "")
FROM_NAME   = "FinTwin"

# ── OTP ───────────────────────────────────────────────────────────────────────
OTP_EXPIRE_SECONDS = 300   # 5 dakika

# ── Güvenlik ──────────────────────────────────────────────────────────────────
security = HTTPBearer()


def hash_email(email: str) -> str:
    """E-posta adresini SHA-256 ile hashle. Orijinal asla saklanmaz."""
    return hashlib.sha256(email.strip().lower().encode()).hexdigest()


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz veya süresi dolmuş token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """JWT token'dan aktif kullanıcıyı çek (dependency injection)."""
    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Token geçersiz")
    return {"user_id": int(user_id), "mail_hash": payload.get("mail_hash")}

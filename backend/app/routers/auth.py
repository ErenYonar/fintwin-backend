# -*- coding: utf-8 -*-
"""Auth endpoint'leri: kayıt, giriş, OTP doğrulama."""

from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime, timedelta
import aiosqlite

from app.core.database import get_db
from app.core.security import hash_email, create_access_token, OTP_EXPIRE_SECONDS, get_current_user
from app.models.schemas import (
    RegisterRequest, LoginRequest, OTPVerifyRequest,
    OTPResendRequest, TokenResponse
)
from app.services.email_service import generate_otp, send_otp_email

router = APIRouter()


# ── KAYIT ─────────────────────────────────────────────────────────────────────

@router.post("/register", status_code=201)
async def register(body: RegisterRequest, db: aiosqlite.Connection = Depends(get_db)):
    mail_hash = hash_email(body.email)

    # Zaten kayıtlı mı?
    async with db.execute("SELECT id, is_verified FROM users WHERE mail_hash = ?", (mail_hash,)) as cur:
        existing = await cur.fetchone()

    if existing:
        if existing["is_verified"]:
            raise HTTPException(400, "Bu e-posta zaten kayıtlı.")
        # Kayıtlı ama doğrulanmamış → yeni OTP gönder
        return await _send_otp(db, mail_hash, body.email, body.lang)

    # Yeni kayıt
    today = datetime.utcnow().strftime("%Y-%m-%d")
    await db.execute("""
        INSERT INTO users (mail_hash, yas, cinsiyet, sehir, meslek, gics_l3,
                           kayit_tarihi, is_verified, role, lang)
        VALUES (?,?,?,?,?,?,?,0,'user',?)
    """, (mail_hash, body.yas, body.cinsiyet, body.sehir,
          body.meslek, body.gics_l3, today, body.lang))
    await db.commit()

    return await _send_otp(db, mail_hash, body.email, body.lang)


# ── GİRİŞ ─────────────────────────────────────────────────────────────────────

@router.post("/login")
async def login(body: LoginRequest, db: aiosqlite.Connection = Depends(get_db)):
    mail_hash = hash_email(body.email)

    async with db.execute("SELECT * FROM users WHERE mail_hash = ?", (mail_hash,)) as cur:
        user = await cur.fetchone()

    if not user:
        raise HTTPException(404, "Bu e-posta kayıtlı değil.")

    return await _send_otp(db, mail_hash, body.email, body.lang)


# ── OTP DOĞRULA ───────────────────────────────────────────────────────────────

@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(body: OTPVerifyRequest, db: aiosqlite.Connection = Depends(get_db)):
    mail_hash = hash_email(body.email)
    now = datetime.utcnow()

    # Geçerli OTP var mı?
    async with db.execute("""
        SELECT * FROM otp_codes
        WHERE mail_hash = ? AND code = ? AND used = 0
        ORDER BY created_at DESC LIMIT 1
    """, (mail_hash, body.code)) as cur:
        otp_row = await cur.fetchone()

    if not otp_row:
        raise HTTPException(400, "Hatalı veya geçersiz kod.")

    expires_at = datetime.fromisoformat(otp_row["expires_at"])
    if now > expires_at:
        raise HTTPException(400, "Kodun süresi dolmuş. Yeni kod isteyin.")

    # OTP'yi kullanıldı olarak işaretle
    await db.execute("UPDATE otp_codes SET used = 1 WHERE id = ?", (otp_row["id"],))
    # Kullanıcıyı doğrulanmış yap
    await db.execute(
        "UPDATE users SET is_verified = 1, updated_at = ? WHERE mail_hash = ?",
        (now.isoformat(), mail_hash)
    )
    await db.commit()

    # Kullanıcı bilgilerini çek
    async with db.execute("SELECT * FROM users WHERE mail_hash = ?", (mail_hash,)) as cur:
        user = await cur.fetchone()

    token = create_access_token({"sub": str(user["id"]), "mail_hash": mail_hash})
    return TokenResponse(
        access_token=token,
        user=dict(user)
    )


# ── OTP YENİDEN GÖNDER ────────────────────────────────────────────────────────

@router.post("/resend-otp")
async def resend_otp(body: OTPResendRequest, db: aiosqlite.Connection = Depends(get_db)):
    mail_hash = hash_email(body.email)
    async with db.execute("SELECT id FROM users WHERE mail_hash = ?", (mail_hash,)) as cur:
        if not await cur.fetchone():
            raise HTTPException(404, "E-posta kayıtlı değil.")

    return await _send_otp(db, mail_hash, body.email, body.lang)


# ── YARDIMCI FONKSİYON ────────────────────────────────────────────────────────


async def _send_otp(db, mail_hash: str, email: str, lang: str):
    """OTP üret, DB'ye kaydet, mail gönder."""
    code = generate_otp()
    expires_at = (datetime.utcnow() + timedelta(seconds=OTP_EXPIRE_SECONDS)).isoformat()

    # Eski OTP'leri temizle
    await db.execute(
        "DELETE FROM otp_codes WHERE mail_hash = ? AND used = 0",
        (mail_hash,)
    )
    await db.execute(
        "INSERT INTO otp_codes (mail_hash, code, expires_at) VALUES (?,?,?)",
        (mail_hash, code, expires_at)
    )
    await db.commit()

    ok = send_otp_email(email, code, lang)
    if not ok:
        raise HTTPException(500, "Mail gönderilemedi. SMTP ayarlarını kontrol edin.")

    return {"message": "Doğrulama kodu gönderildi.", "email": email}


# ── HESAP SİL ─────────────────────────────────────────────────────────────────

@router.delete("/delete-account")
async def delete_account(
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    user_id   = current_user["user_id"]
    mail_hash = current_user["mail_hash"]

    # Kullanıcı var mı?
    async with db.execute("SELECT id FROM users WHERE id = ?", (user_id,)) as cur:
        user = await cur.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    # mail_hash ile bağlı verileri sil (CASCADE kapsamı dışındakiler)
    await db.execute("DELETE FROM otp_codes WHERE mail_hash = ?", (mail_hash,))
    await db.execute("DELETE FROM feedbacks  WHERE mail_hash = ?", (mail_hash,))

    # sync_log manuel sil (CASCADE yok)
    await db.execute("DELETE FROM sync_log WHERE user_id = ?", (user_id,))

    # Kullanıcıyı sil → transactions + statements CASCADE ile otomatik silinir
    await db.execute("DELETE FROM users WHERE id = ?", (user_id,))

    await db.commit()

    return {"message": "Hesap ve tüm veriler kalıcı olarak silindi.", "status": "ok"}


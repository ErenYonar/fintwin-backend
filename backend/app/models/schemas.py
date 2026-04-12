# -*- coding: utf-8 -*-
"""Pydantic şemaları – API request/response modelleri."""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date


# ── AUTH ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email:    EmailStr
    yas:      str
    cinsiyet: str
    sehir:    str
    meslek:   str
    gics_l3:  str
    lang:     str = "TR"

class LoginRequest(BaseModel):
    email: EmailStr
    lang:  str = "TR"

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    code:  str = Field(..., min_length=6, max_length=6)

class OTPResendRequest(BaseModel):
    email: EmailStr
    lang:  str = "TR"

class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         dict


# ── USER ──────────────────────────────────────────────────────────────────────

class UserUpdateRequest(BaseModel):
    yas:      Optional[str] = None
    cinsiyet: Optional[str] = None
    sehir:    Optional[str] = None
    meslek:   Optional[str] = None
    gics_l3:  Optional[str] = None
    lang:     Optional[str] = None

class UserResponse(BaseModel):
    id:           int
    mail_hash:    str
    yas:          Optional[str]
    cinsiyet:     Optional[str]
    sehir:        Optional[str]
    meslek:       Optional[str]
    gics_l3:      Optional[str]
    kayit_tarihi: str
    is_verified:  bool
    role:         str
    lang:         str


# ── TRANSACTION ───────────────────────────────────────────────────────────────

class TransactionCreate(BaseModel):
    tarih:          str          # "YYYY-MM-DD"
    kategori:       str
    detay:          str
    tutar:          float = Field(..., gt=0)
    tutar_orijinal: float = Field(..., gt=0)
    para_birimi:    str   = "TL"
    tip:            str          # "Gelir" | "Gider"
    logo:           Optional[str] = None
    local_id:       Optional[str] = None   # Mobile UUID (offline-first)

class TransactionUpdate(BaseModel):
    tarih:          Optional[str]   = None
    kategori:       Optional[str]   = None
    detay:          Optional[str]   = None
    tutar:          Optional[float] = None
    tutar_orijinal: Optional[float] = None
    para_birimi:    Optional[str]   = None
    tip:            Optional[str]   = None
    logo:           Optional[str]   = None

class TransactionResponse(BaseModel):
    id:             int
    tarih:          str
    kategori:       str
    detay:          str
    tutar:          float
    tutar_orijinal: float
    para_birimi:    str
    tip:            str
    logo:           Optional[str]
    local_id:       Optional[str]
    sync_status:    str
    created_at:     str
    updated_at:     str


# ── SYNC (offline-first batch) ────────────────────────────────────────────────

class SyncPayload(BaseModel):
    """Mobile'dan gelen tüm offline işlemler tek seferde."""
    device_id:    str
    transactions: List[TransactionCreate]
    last_sync:    Optional[str] = None   # ISO datetime

class SyncResponse(BaseModel):
    synced:   int
    skipped:  int
    server_transactions: List[TransactionResponse]


# ── ANALYTICS ─────────────────────────────────────────────────────────────────

class AnalyticsSummary(BaseModel):
    gelir:          float
    gider:          float
    net:            float
    finansal_skor:  int
    tasarruf_orani: float

class TrendAlert(BaseModel):
    kategori:    str
    bu_ay:       float
    gecen_ay:    float
    degisim_pct: float


# ── STATEMENT ─────────────────────────────────────────────────────────────────

class StatementRow(BaseModel):
    tarih:      str
    aciklama:   str
    tutar:      float

class StatementResponse(BaseModel):
    id:          int
    dosya_isim:  str
    dosya_hash:  str
    parsed_rows: List[StatementRow]
    aktarildi:   bool
    created_at:  str


# ── FEEDBACK ──────────────────────────────────────────────────────────────────

class FeedbackCreate(BaseModel):
    mesaj: str = Field(..., min_length=1, max_length=2000)
    dil:   str = "TR"

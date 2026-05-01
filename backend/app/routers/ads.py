# -*- coding: utf-8 -*-
"""Reklam yönetimi endpoint'leri."""

from fastapi import APIRouter, HTTPException, Depends, Header
from datetime import datetime
from typing import Optional
import aiosqlite
import os

from app.core.database import get_db

router = APIRouter()

ADMIN_SECRET = os.environ.get("FINTWIN_ADMIN_SECRET", "fintwin2024")


def check_admin(x_admin_secret: Optional[str] = Header(None)):
    if x_admin_secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Yetkisiz erişim.")


# ── Aktif reklamı getir (mobil uygulama çağırır) ──────────────────────────────

@router.get("/active")
async def get_active_ad(
    konum: str = "home",
    db: aiosqlite.Connection = Depends(get_db),
):
    async with db.execute("""
        SELECT * FROM ads
        WHERE konum = ? AND aktif = 1
        ORDER BY created_at DESC LIMIT 1
    """, (konum,)) as cur:
        row = await cur.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Aktif reklam yok.")
    return dict(row)


# ── Tüm reklamları listele (admin) ────────────────────────────────────────────

@router.get("/")
async def list_ads(
    db: aiosqlite.Connection = Depends(get_db),
    _: None = Depends(check_admin),
):
    async with db.execute("SELECT * FROM ads ORDER BY created_at DESC") as cur:
        rows = await cur.fetchall()
    return [dict(r) for r in rows]


# ── Yeni reklam ekle (admin) ──────────────────────────────────────────────────

@router.post("/", status_code=201)
async def create_ad(
    body: dict,
    db: aiosqlite.Connection = Depends(get_db),
    _: None = Depends(check_admin),
):
    now = datetime.utcnow().isoformat()
    await db.execute("""
        INSERT INTO ads (baslik, aciklama, gorsel_url, link, konum, aktif, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        body.get("baslik", ""),
        body.get("aciklama", ""),
        body.get("gorsel_url", ""),
        body.get("link", ""),
        body.get("konum", "home"),
        1 if body.get("aktif", True) else 0,
        now,
    ))
    await db.commit()
    return {"message": "Reklam eklendi."}


# ── Reklam güncelle (admin) ───────────────────────────────────────────────────

@router.put("/{ad_id}")
async def update_ad(
    ad_id: int,
    body: dict,
    db: aiosqlite.Connection = Depends(get_db),
    _: None = Depends(check_admin),
):
    fields = {k: v for k, v in body.items() if k in ["baslik", "aciklama", "link", "konum", "aktif"]}
    if not fields:
        raise HTTPException(400, "Güncellenecek alan yok.")

    set_clause = ", ".join(f"{k} = ?" for k in fields)
    await db.execute(
        f"UPDATE ads SET {set_clause} WHERE id = ?",
        list(fields.values()) + [ad_id]
    )
    await db.commit()
    return {"message": "Reklam güncellendi."}


# ── Reklam sil (admin) ────────────────────────────────────────────────────────

@router.delete("/{ad_id}", status_code=204)
async def delete_ad(
    ad_id: int,
    db: aiosqlite.Connection = Depends(get_db),
    _: None = Depends(check_admin),
):
    await db.execute("DELETE FROM ads WHERE id = ?", (ad_id,))
    await db.commit()

# -*- coding: utf-8 -*-
"""İşlem CRUD + offline-first sync endpoint'leri."""

from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
import aiosqlite

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.schemas import (
    TransactionCreate, TransactionUpdate,
    TransactionResponse, SyncPayload, SyncResponse
)

router = APIRouter()


# ── LİSTE ─────────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[TransactionResponse])
async def list_transactions(
    tip: str | None = None,         # "Gelir" | "Gider"
    kategori: str | None = None,
    start_date: str | None = None,  # "YYYY-MM-DD"
    end_date: str | None = None,
    limit: int = 200,
    offset: int = 0,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    user_id = current_user["user_id"]
    query = "SELECT * FROM transactions WHERE user_id = ? AND sync_status != 'deleted'"
    params = [user_id]

    if tip:
        query += " AND tip = ?"; params.append(tip)
    if kategori:
        query += " AND kategori = ?"; params.append(kategori)
    if start_date:
        query += " AND tarih >= ?"; params.append(start_date)
    if end_date:
        query += " AND tarih <= ?"; params.append(end_date)

    query += " ORDER BY tarih DESC, id DESC LIMIT ? OFFSET ?"
    params += [limit, offset]

    async with db.execute(query, params) as cur:
        rows = await cur.fetchall()
    return [dict(r) for r in rows]


# ── TEK İŞLEM ─────────────────────────────────────────────────────────────────

@router.get("/{tx_id}", response_model=TransactionResponse)
async def get_transaction(
    tx_id: int,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    async with db.execute(
        "SELECT * FROM transactions WHERE id = ? AND user_id = ?",
        (tx_id, current_user["user_id"])
    ) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(404, "İşlem bulunamadı.")
    return dict(row)


# ── OLUŞTUR ───────────────────────────────────────────────────────────────────

@router.post("/", status_code=201, response_model=TransactionResponse)
async def create_transaction(
    body: TransactionCreate,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    now = datetime.utcnow().isoformat()
    async with db.execute("""
        INSERT INTO transactions
          (user_id, tarih, kategori, detay, tutar, tutar_orijinal, para_birimi,
           tip, logo, local_id, sync_status, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,'synced',?,?)
        RETURNING *
    """, (
        current_user["user_id"], body.tarih, body.kategori, body.detay,
        body.tutar, body.tutar_orijinal, body.para_birimi, body.tip,
        body.logo, body.local_id, now, now
    )) as cur:
        row = await cur.fetchone()
    await db.commit()
    return dict(row)


# ── GÜNCELLE ──────────────────────────────────────────────────────────────────

@router.put("/{tx_id}", response_model=TransactionResponse)
async def update_transaction(
    tx_id: int,
    body: TransactionUpdate,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    async with db.execute(
        "SELECT id FROM transactions WHERE id = ? AND user_id = ?",
        (tx_id, current_user["user_id"])
    ) as cur:
        if not await cur.fetchone():
            raise HTTPException(404, "İşlem bulunamadı.")

    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(400, "Güncellenecek alan yok.")

    updates["updated_at"] = datetime.utcnow().isoformat()
    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [tx_id]

    await db.execute(f"UPDATE transactions SET {set_clause} WHERE id = ?", values)
    await db.commit()

    async with db.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,)) as cur:
        row = await cur.fetchone()
    return dict(row)


# ── SİL ───────────────────────────────────────────────────────────────────────

@router.delete("/{tx_id}", status_code=204)
async def delete_transaction(
    tx_id: int,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    async with db.execute(
        "SELECT id FROM transactions WHERE id = ? AND user_id = ?",
        (tx_id, current_user["user_id"])
    ) as cur:
        if not await cur.fetchone():
            raise HTTPException(404, "İşlem bulunamadı.")

    # Soft delete (sync için iz bırak)
    await db.execute(
        "UPDATE transactions SET sync_status = 'deleted', updated_at = ? WHERE id = ?",
        (datetime.utcnow().isoformat(), tx_id)
    )
    await db.commit()


# ── TÜM VERİLERİ SİL (hesap ayarları) ───────────────────────────────────────

@router.delete("/", status_code=204)
async def delete_all_transactions(
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    await db.execute(
        "DELETE FROM transactions WHERE user_id = ?",
        (current_user["user_id"],)
    )
    await db.commit()


# ══════════════════════════════════════════════════════════════════════════════
# OFFLINE-FIRST SYNC ENDPOINTİ
# Mobil uygulama offline biriktirdiği işlemleri buraya toplu gönderir.
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/sync", response_model=SyncResponse)
async def sync_transactions(
    body: SyncPayload,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    """
    Offline-first sync protokolü:
    1. Mobile'dan gelen işlemleri sunucuya yaz (local_id ile mükerrer kontrolü)
    2. Sunucudaki tüm son işlemleri mobile'a gönder
    """
    user_id = current_user["user_id"]
    synced = 0
    skipped = 0
    now = datetime.utcnow().isoformat()

    for tx in body.transactions:
        # local_id ile mükerrer kontrolü
        if tx.local_id:
            async with db.execute(
                "SELECT id FROM transactions WHERE user_id = ? AND local_id = ?",
                (user_id, tx.local_id)
            ) as cur:
                if await cur.fetchone():
                    skipped += 1
                    continue

        await db.execute("""
            INSERT INTO transactions
              (user_id, tarih, kategori, detay, tutar, tutar_orijinal, para_birimi,
               tip, logo, local_id, sync_status, created_at, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,'synced',?,?)
        """, (
            user_id, tx.tarih, tx.kategori, tx.detay, tx.tutar,
            tx.tutar_orijinal, tx.para_birimi, tx.tip, tx.logo,
            tx.local_id, now, now
        ))
        synced += 1

    # Sync log güncelle
    await db.execute("""
        INSERT OR REPLACE INTO sync_log (user_id, device_id, last_sync, tx_count)
        VALUES (?, ?, ?, ?)
    """, (user_id, body.device_id, now, synced))

    await db.commit()

    # Sunucudaki tüm işlemleri gönder (son 500)
    last_sync = body.last_sync or "2000-01-01"
    async with db.execute("""
        SELECT * FROM transactions
        WHERE user_id = ? AND updated_at > ? AND sync_status != 'deleted'
        ORDER BY tarih DESC LIMIT 500
    """, (user_id, last_sync)) as cur:
        server_txs = [dict(r) for r in await cur.fetchall()]

    return SyncResponse(
        synced=synced,
        skipped=skipped,
        server_transactions=server_txs
    )

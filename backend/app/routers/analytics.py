# -*- coding: utf-8 -*-
"""Analitik endpoint'leri – skor, özet, trend uyarıları."""

from fastapi import APIRouter, Depends
from datetime import date
import aiosqlite

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.schemas import AnalyticsSummary, TrendAlert

router = APIRouter()


def _financial_score(gelir: float, gider: float) -> int:
    if gelir <= 0 and gider <= 0: return 0
    if gelir <= 0: return 5
    oran = ((gelir - gider) / gelir) * 100
    if oran >= 30: return min(95, int(80 + oran / 2))
    elif oran >= 20: return int(70 + oran)
    elif oran >= 10: return int(50 + oran * 2)
    elif oran >= 0:  return int(30 + oran * 2)
    else:            return max(5, int(30 + oran))


@router.get("/summary", response_model=AnalyticsSummary)
async def get_summary(
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    user_id = current_user["user_id"]
    async with db.execute("""
        SELECT tip, SUM(tutar) as toplam FROM transactions
        WHERE user_id = ? AND sync_status != 'deleted'
        GROUP BY tip
    """, (user_id,)) as cur:
        rows = {r["tip"]: r["toplam"] for r in await cur.fetchall()}

    gelir = rows.get("Gelir", 0.0)
    gider = rows.get("Gider", 0.0)
    net   = gelir - gider
    skor  = _financial_score(gelir, gider)
    oran  = round((net / gelir * 100) if gelir > 0 else 0, 1)
    return AnalyticsSummary(gelir=gelir, gider=gider, net=net,
                            finansal_skor=skor, tasarruf_orani=oran)


@router.get("/categories")
async def get_categories(
    tip: str = "Gider",
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    async with db.execute("""
        SELECT kategori, SUM(tutar) as toplam FROM transactions
        WHERE user_id = ? AND tip = ? AND sync_status != 'deleted'
        GROUP BY kategori ORDER BY toplam DESC
    """, (current_user["user_id"], tip)) as cur:
        return [dict(r) for r in await cur.fetchall()]


@router.get("/trends", response_model=list[TrendAlert])
async def get_trends(
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    user_id = current_user["user_id"]
    today = date.today()
    bu_ay = today.strftime("%Y-%m")
    if today.month == 1:
        gecen_yil, gecen_ay_no = today.year - 1, 12
    else:
        gecen_yil, gecen_ay_no = today.year, today.month - 1
    gecen_ay = f"{gecen_yil}-{gecen_ay_no:02d}"

    async with db.execute("""
        SELECT kategori,
               SUM(CASE WHEN strftime('%Y-%m', tarih) = ? THEN tutar ELSE 0 END) as bu_ay,
               SUM(CASE WHEN strftime('%Y-%m', tarih) = ? THEN tutar ELSE 0 END) as gecen_ay
        FROM transactions
        WHERE user_id = ? AND tip = 'Gider' AND sync_status != 'deleted'
        GROUP BY kategori
        HAVING gecen_ay > 0 AND bu_ay > 0
    """, (bu_ay, gecen_ay, user_id)) as cur:
        rows = await cur.fetchall()

    alerts = []
    for r in rows:
        pct = ((r["bu_ay"] - r["gecen_ay"]) / r["gecen_ay"]) * 100
        if pct >= 20:
            alerts.append(TrendAlert(
                kategori=r["kategori"],
                bu_ay=r["bu_ay"],
                gecen_ay=r["gecen_ay"],
                degisim_pct=round(pct, 1)
            ))
    alerts.sort(key=lambda x: x.degisim_pct, reverse=True)
    return alerts


@router.get("/monthly")
async def get_monthly(
    months: int = 6,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    """Son N ay için gelir/gider özetini döndür (grafik için)."""
    async with db.execute("""
        SELECT strftime('%Y-%m', tarih) as ay, tip, SUM(tutar) as toplam
        FROM transactions
        WHERE user_id = ? AND sync_status != 'deleted'
          AND tarih >= date('now', ? || ' months')
        GROUP BY ay, tip
        ORDER BY ay
    """, (current_user["user_id"], f"-{months}")) as cur:
        return [dict(r) for r in await cur.fetchall()]

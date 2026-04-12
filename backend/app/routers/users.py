# users.py
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
import aiosqlite

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.schemas import UserUpdateRequest, UserResponse, FeedbackCreate

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    async with db.execute(
        "SELECT * FROM users WHERE id = ?", (current_user["user_id"],)
    ) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(404, "Kullanıcı bulunamadı.")
    return dict(row)


@router.put("/me", response_model=UserResponse)
async def update_me(
    body: UserUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(400, "Güncellenecek alan yok.")
    updates["updated_at"] = datetime.utcnow().isoformat()
    set_clause = ", ".join(f"{k} = ?" for k in updates)
    await db.execute(
        f"UPDATE users SET {set_clause} WHERE id = ?",
        list(updates.values()) + [current_user["user_id"]]
    )
    await db.commit()
    async with db.execute(
        "SELECT * FROM users WHERE id = ?", (current_user["user_id"],)
    ) as cur:
        return dict(await cur.fetchone())


@router.delete("/me", status_code=204)
async def delete_me(
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    """KVKK Md.7 – tüm kullanıcı verileri kalıcı olarak silinir."""
    user_id = current_user["user_id"]
    await db.execute("DELETE FROM transactions WHERE user_id = ?", (user_id,))
    await db.execute("DELETE FROM statements WHERE user_id = ?", (user_id,))
    await db.execute("DELETE FROM users WHERE id = ?", (user_id,))
    await db.commit()


@router.post("/feedback", status_code=201)
async def send_feedback(
    body: FeedbackCreate,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    await db.execute(
        "INSERT INTO feedbacks (mail_hash, mesaj, dil) VALUES (?,?,?)",
        (current_user["mail_hash"], body.mesaj, body.dil)
    )
    await db.commit()
    return {"message": "Geri bildirim alındı."}

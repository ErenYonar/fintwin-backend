# -*- coding: utf-8 -*-
"""
SQLite veritabanı bağlantısı ve tablo oluşturma.
Patronun dediği: "local DB'de tut, bulutla belirli sürede sync et"
"""

import aiosqlite
import os

DB_PATH = os.environ.get("FINTWIN_DB_PATH", "fintwin.db")


async def get_db() -> aiosqlite.Connection:
    """FastAPI dependency injection için DB bağlantısı."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        yield db


async def init_db():
    """Uygulama başlarken tüm tabloları oluştur."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("PRAGMA journal_mode=WAL;")   # Concurrent read/write
        await db.execute("PRAGMA foreign_keys=ON;")

        # ── KULLANICILAR ──────────────────────────────────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                mail_hash    TEXT    UNIQUE NOT NULL,
                yas          TEXT,
                cinsiyet     TEXT,
                sehir        TEXT,
                meslek       TEXT,
                gics_l3      TEXT,
                kayit_tarihi TEXT    NOT NULL,
                is_verified  INTEGER DEFAULT 0,
                role         TEXT    DEFAULT 'user',
                lang         TEXT    DEFAULT 'TR',
                created_at   TEXT    DEFAULT (datetime('now')),
                updated_at   TEXT    DEFAULT (datetime('now'))
            )
        """)

        # ── OTP KODLARI ───────────────────────────────────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS otp_codes (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                mail_hash  TEXT    NOT NULL,
                code       TEXT    NOT NULL,
                expires_at TEXT    NOT NULL,
                used       INTEGER DEFAULT 0,
                created_at TEXT    DEFAULT (datetime('now'))
            )
        """)

        # ── FINANSAL İŞLEMLER ────────────────────────────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                tarih          TEXT    NOT NULL,
                kategori       TEXT    NOT NULL,
                detay          TEXT    NOT NULL,
                tutar          REAL    NOT NULL,
                tutar_orijinal REAL    NOT NULL DEFAULT 0,
                para_birimi    TEXT    NOT NULL DEFAULT 'TL',
                tip            TEXT    NOT NULL CHECK(tip IN ('Gelir','Gider')),
                logo           TEXT,
                -- Sync alanları (offline-first için)
                local_id       TEXT,          -- Mobile'daki UUID
                sync_status    TEXT DEFAULT 'synced',  -- 'pending' | 'synced' | 'deleted'
                created_at     TEXT DEFAULT (datetime('now')),
                updated_at     TEXT DEFAULT (datetime('now'))
            )
        """)
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_transactions_user
            ON transactions(user_id, tarih DESC)
        """)

        # ── KREDİ KARTI EKSTRELERİ ───────────────────────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS statements (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                dosya_isim   TEXT    NOT NULL,
                dosya_hash   TEXT    NOT NULL,
                parsed_rows  TEXT    NOT NULL,   -- JSON string
                aktarildi    INTEGER DEFAULT 0,
                created_at   TEXT    DEFAULT (datetime('now'))
            )
        """)

        # ── SYNC LOG (hangi cihaz ne zaman sync etti) ────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS sync_log (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     INTEGER NOT NULL REFERENCES users(id),
                device_id   TEXT,
                last_sync   TEXT    DEFAULT (datetime('now')),
                tx_count    INTEGER DEFAULT 0
            )
        """)

        # ── GERİ BİLDİRİMLER ─────────────────────────────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS feedbacks (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                mail_hash  TEXT,
                mesaj      TEXT    NOT NULL,
                dil        TEXT    DEFAULT 'TR',
                okundu     INTEGER DEFAULT 0,
                created_at TEXT    DEFAULT (datetime('now'))
            )
        """)

        # ── REKLAMLAR ──────────────────────────────────────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS ads (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                baslik     TEXT    NOT NULL,
                aciklama   TEXT    DEFAULT '',
                link       TEXT    DEFAULT '',
                konum      TEXT    NOT NULL DEFAULT 'home',
                aktif      INTEGER DEFAULT 1,
                created_at TEXT    DEFAULT (datetime('now'))
            )
        """)

        await db.commit()
        print("[DB] Tablolar hazır ✓")

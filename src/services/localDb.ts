// src/services/localDb.ts
import * as SQLite from 'expo-sqlite';
import { Transaction, TransactionCreate } from './api';
import { v4 as uuidv4 } from 'uuid';

let _db: SQLite.SQLiteDatabase | null = null;
let _initPromise: Promise<void> | null = null;
let _hasUserKey = false; // user_key kolonu var mı?

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  if (!_initPromise) {
    _initPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('fintwin_local.db');
      await initLocalDb(db);
      _db = db;
    })();
  }
  await _initPromise;
  return _db!;
}

async function initLocalDb(db: SQLite.SQLiteDatabase) {
  // 1. Temel tabloları oluştur (user_key YOK — eski uyumlu)
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS transactions (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      local_id       TEXT UNIQUE NOT NULL,
      tarih          TEXT NOT NULL,
      kategori       TEXT NOT NULL,
      detay          TEXT NOT NULL,
      tutar          REAL NOT NULL,
      tutar_orijinal REAL NOT NULL,
      para_birimi    TEXT NOT NULL DEFAULT 'TL',
      tip            TEXT NOT NULL,
      logo           TEXT,
      sync_status    TEXT NOT NULL DEFAULT 'local',
      created_at     TEXT DEFAULT (datetime('now')),
      updated_at     TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sync_meta (
      key   TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS feedbacks (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_key   TEXT NOT NULL DEFAULT 'anonymous',
      message    TEXT NOT NULL,
      lang       TEXT NOT NULL DEFAULT 'TR',
      created_at TEXT DEFAULT (datetime('now')),
      is_read    INTEGER NOT NULL DEFAULT 0
    );
  `);

  // 2. user_key kolonunu güvenli şekilde ekle (yoksa ekle, varsa atla)
  try {
    await db.execAsync(
      `ALTER TABLE transactions ADD COLUMN user_key TEXT NOT NULL DEFAULT 'default';`
    );
    _hasUserKey = true;
  } catch {
    // Zaten var — normal
    _hasUserKey = true;
  }

  // 3. Index (user_key varsa)
  try {
    await db.execAsync(
      `CREATE INDEX IF NOT EXISTS idx_tx_user_tarih ON transactions(user_key, tarih DESC);`
    );
  } catch { /* ignore */ }
}

// ── Kullanıcı anahtarı ────────────────────────────────────────────────────────
let _currentUserKey = 'default';

export function setCurrentUser(key: string) {
  _currentUserKey = key || 'default';
}

export function getCurrentUserKey(): string {
  return _currentUserKey;
}

// ── İşlemler ──────────────────────────────────────────────────────────────────
export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await getDb();
  if (_hasUserKey) {
    return db.getAllAsync<Transaction>(
      'SELECT * FROM transactions WHERE user_key = ? ORDER BY tarih DESC, id DESC',
      _currentUserKey
    );
  }
  return db.getAllAsync<Transaction>(
    'SELECT * FROM transactions ORDER BY tarih DESC, id DESC'
  );
}

export async function addTransaction(
  data: TransactionCreate & { local_id?: string }
): Promise<void> {
  const db       = await getDb();
  const local_id = data.local_id || uuidv4();
  const now      = new Date().toISOString();

  if (_hasUserKey) {
    await db.runAsync(
      `INSERT INTO transactions
         (local_id, user_key, tarih, kategori, detay, tutar,
          tutar_orijinal, para_birimi, tip, logo, sync_status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,'local',?,?)`,
      local_id, _currentUserKey,
      data.tarih, data.kategori, data.detay,
      data.tutar, data.tutar_orijinal, data.para_birimi,
      data.tip, data.logo || null, now, now
    );
  } else {
    await db.runAsync(
      `INSERT INTO transactions
         (local_id, tarih, kategori, detay, tutar,
          tutar_orijinal, para_birimi, tip, logo, sync_status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,'local',?,?)`,
      local_id,
      data.tarih, data.kategori, data.detay,
      data.tutar, data.tutar_orijinal, data.para_birimi,
      data.tip, data.logo || null, now, now
    );
  }
}

export async function updateTransaction(
  local_id: string,
  data: Partial<TransactionCreate>
): Promise<void> {
  const db      = await getDb();
  const allowed = ['tarih','kategori','detay','tutar','tutar_orijinal','para_birimi','tip','logo'];
  const entries = Object.entries(data).filter(([k]) => allowed.includes(k));
  if (entries.length === 0) return;

  const fields = entries.map(([k]) => `${k} = ?`).join(', ');

  if (_hasUserKey) {
    const values = [...entries.map(([_, v]) => v), new Date().toISOString(), local_id, _currentUserKey];
    await db.runAsync(
      `UPDATE transactions SET ${fields}, updated_at = ? WHERE local_id = ? AND user_key = ?`,
      ...values
    );
  } else {
    const values = [...entries.map(([_, v]) => v), new Date().toISOString(), local_id];
    await db.runAsync(
      `UPDATE transactions SET ${fields}, updated_at = ? WHERE local_id = ?`,
      ...values
    );
  }
}

export async function deleteTransaction(local_id: string): Promise<void> {
  const db = await getDb();
  if (_hasUserKey) {
    await db.runAsync(
      'DELETE FROM transactions WHERE local_id = ? AND user_key = ?',
      local_id, _currentUserKey
    );
  } else {
    await db.runAsync('DELETE FROM transactions WHERE local_id = ?', local_id);
  }
}

export async function clearAllLocal(): Promise<void> {
  const db = await getDb();
  try {
    if (_hasUserKey) {
      await db.runAsync(
        'DELETE FROM transactions WHERE user_key = ?', _currentUserKey
      );
    } else {
      await db.execAsync('DELETE FROM transactions;');
    }
  } catch (e) {
    // Hiçbir şekilde crash etmesin — logout her zaman çalışsın
    console.warn('[localDb] clearAllLocal hata:', e);
  }
}

// ── Feedback ──────────────────────────────────────────────────────────────────
export async function saveFeedback(message: string, lang: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO feedbacks (user_key, message, lang, created_at)
     VALUES (?, ?, ?, datetime('now'))`,
    _currentUserKey, message.trim(), lang
  );
}

export interface Feedback {
  id: number; user_key: string; message: string;
  lang: string; created_at: string; is_read: number;
}

export async function getAllFeedbacks(): Promise<Feedback[]> {
  const db = await getDb();
  return db.getAllAsync<Feedback>('SELECT * FROM feedbacks ORDER BY created_at DESC');
}

// ── Sync meta ─────────────────────────────────────────────────────────────────
export async function getSyncMeta(key: string): Promise<string | null> {
  const db  = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM sync_meta WHERE key = ?', key
  );
  return row?.value || null;
}

export async function setSyncMeta(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?,?)', key, value
  );
}

// Eski compat exports
export async function getPendingTransactions(): Promise<Transaction[]> { return []; }
export async function markAsSynced(_l: string, _s: number): Promise<void> {}
export async function upsertFromServer(_s: any[]): Promise<void> {}

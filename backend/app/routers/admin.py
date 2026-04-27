# -*- coding: utf-8 -*-
"""
FinTwin Admin Paneli
Şifreli web arayüzü — istatistikler, öneri/şikayet listesi, kullanıcı verileri.
Erişim: /admin (tarayıcıdan)
Şifre: ADMIN_PASSWORD env değişkeni (varsayılan: fintwin2024)
"""

import os
import json
from datetime import datetime
from fastapi import APIRouter, Request, Form, Depends, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from starlette.responses import Response
import aiosqlite

from app.core.database import get_db

router = APIRouter()

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "fintwin2024")
COOKIE_NAME    = "ft_admin_session"
COOKIE_VALUE   = "fintwin_admin_authenticated"


def is_authenticated(request: Request) -> bool:
    return request.cookies.get(COOKIE_NAME) == COOKIE_VALUE


# ── HTML Şablonu ──────────────────────────────────────────────────────────────
def render_page(content: str, active_tab: str = "dashboard") -> str:
    tabs = [
        ("dashboard", "📊", "Dashboard"),
        ("feedbacks",  "💬", "Öneri & Şikayet"),
        ("users",      "👥", "Kullanıcılar"),
        ("stats",      "📈", "İstatistikler"),
    ]
    tab_html = ""
    for key, icon, label in tabs:
        active_cls = "active" if key == active_tab else ""
        tab_html += f'<a href="/admin/{key}" class="tab-link {active_cls}">{icon} {label}</a>'

    return f"""<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FinTwin Admin</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

  :root {{
    --bg:        #070711;
    --bg2:       #0d0d1a;
    --bg3:       #12122a;
    --card:      #111127;
    --card2:     #181830;
    --border:    rgba(124,110,250,0.15);
    --border2:   rgba(124,110,250,0.3);
    --primary:   #7C6EFA;
    --primary2:  #9D8FFF;
    --success:   #34D399;
    --danger:    #F87171;
    --warning:   #FBBF24;
    --info:      #60A5FA;
    --text:      #E8E8FF;
    --text2:     #9090B8;
    --text3:     #5A5A7A;
    --mono:      'DM Mono', monospace;
  }}

  * {{ box-sizing: border-box; margin: 0; padding: 0; }}

  body {{
    font-family: 'DM Sans', sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    line-height: 1.6;
  }}

  /* ── Sidebar ── */
  .layout {{
    display: flex;
    min-height: 100vh;
  }}

  .sidebar {{
    width: 240px;
    min-height: 100vh;
    background: var(--bg2);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 100;
  }}

  .sidebar-logo {{
    padding: 28px 24px 20px;
    border-bottom: 1px solid var(--border);
  }}
  .sidebar-logo .brand {{
    font-size: 22px;
    font-weight: 800;
    background: linear-gradient(135deg, #7C6EFA, #60A5FA);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.5px;
  }}
  .sidebar-logo .sub {{
    font-size: 11px;
    color: var(--text3);
    margin-top: 2px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 1px;
  }}

  .sidebar-nav {{
    padding: 16px 12px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }}

  .tab-link {{
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: 10px;
    text-decoration: none;
    color: var(--text2);
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
  }}
  .tab-link:hover {{
    background: var(--card);
    color: var(--text);
  }}
  .tab-link.active {{
    background: rgba(124,110,250,0.15);
    color: var(--primary2);
    font-weight: 700;
    border: 1px solid var(--border2);
  }}

  .sidebar-footer {{
    padding: 16px 12px;
    border-top: 1px solid var(--border);
  }}
  .logout-btn {{
    display: block;
    text-align: center;
    padding: 10px;
    border-radius: 10px;
    background: rgba(248,113,113,0.1);
    color: var(--danger);
    text-decoration: none;
    font-size: 13px;
    font-weight: 700;
    border: 1px solid rgba(248,113,113,0.2);
    transition: all 0.2s;
  }}
  .logout-btn:hover {{
    background: rgba(248,113,113,0.2);
  }}

  /* ── Main ── */
  .main {{
    margin-left: 240px;
    flex: 1;
    padding: 32px;
    max-width: 1200px;
  }}

  .page-title {{
    font-size: 26px;
    font-weight: 800;
    color: var(--text);
    margin-bottom: 24px;
    letter-spacing: -0.5px;
  }}

  /* ── Cards ── */
  .card {{
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 20px;
  }}
  .card-title {{
    font-size: 14px;
    font-weight: 700;
    color: var(--text2);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 16px;
  }}

  /* ── Stat Grid ── */
  .stat-grid {{
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 20px;
  }}
  .stat-card {{
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 20px;
    position: relative;
    overflow: hidden;
  }}
  .stat-card::before {{
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: var(--accent, var(--primary));
  }}
  .stat-label {{
    font-size: 11px;
    font-weight: 600;
    color: var(--text3);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }}
  .stat-value {{
    font-size: 28px;
    font-weight: 800;
    color: var(--text);
    font-family: var(--mono);
    letter-spacing: -1px;
  }}
  .stat-sub {{
    font-size: 12px;
    color: var(--text3);
    margin-top: 4px;
  }}

  /* ── Table ── */
  .table-wrap {{ overflow-x: auto; }}
  table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }}
  th {{
    text-align: left;
    padding: 10px 14px;
    font-size: 10px;
    font-weight: 700;
    color: var(--text3);
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 1px solid var(--border);
  }}
  td {{
    padding: 12px 14px;
    border-bottom: 1px solid rgba(124,110,250,0.07);
    color: var(--text2);
    vertical-align: middle;
  }}
  tr:hover td {{
    background: rgba(124,110,250,0.04);
  }}
  tr:last-child td {{ border-bottom: none; }}

  /* ── Badge ── */
  .badge {{
    display: inline-block;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.3px;
  }}
  .badge-tr   {{ background: rgba(124,110,250,0.15); color: var(--primary2); }}
  .badge-en   {{ background: rgba(96,165,250,0.15);  color: var(--info); }}
  .badge-new  {{ background: rgba(248,113,113,0.15); color: var(--danger); }}
  .badge-read {{ background: rgba(52,211,153,0.15);  color: var(--success); }}

  /* ── Mark Read btn ── */
  .mark-btn {{
    background: rgba(52,211,153,0.1);
    border: 1px solid rgba(52,211,153,0.3);
    color: var(--success);
    padding: 4px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s;
  }}
  .mark-btn:hover {{
    background: rgba(52,211,153,0.2);
  }}

  /* ── Progress Bar ── */
  .progress-wrap {{
    background: var(--card2);
    border-radius: 4px;
    height: 6px;
    overflow: hidden;
    margin-top: 6px;
  }}
  .progress-bar {{
    height: 100%;
    border-radius: 4px;
    background: linear-gradient(90deg, var(--primary), var(--info));
  }}

  /* ── Msg box ── */
  .msg-box {{
    background: var(--bg3);
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 13px;
    color: var(--text);
    line-height: 1.6;
    border-left: 3px solid var(--primary);
    margin-top: 4px;
    font-style: italic;
  }}

  /* ── Responsive ── */
  @media (max-width: 768px) {{
    .sidebar {{ width: 60px; }}
    .sidebar-logo, .sidebar-footer .logout-text {{ display: none; }}
    .tab-link span {{ display: none; }}
    .main {{ margin-left: 60px; padding: 16px; }}
    .stat-grid {{ grid-template-columns: repeat(2, 1fr); }}
  }}

  .chip {{
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    font-family: var(--mono);
  }}
  .chip-green {{ background: rgba(52,211,153,0.12); color: var(--success); }}
  .chip-red   {{ background: rgba(248,113,113,0.12); color: var(--danger); }}
  .chip-blue  {{ background: rgba(96,165,250,0.12);  color: var(--info); }}

  .section-divider {{
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 24px 0 16px;
    color: var(--text3);
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
  }}
  .section-divider::before, .section-divider::after {{
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }}

  .empty-state {{
    text-align: center;
    padding: 40px;
    color: var(--text3);
    font-size: 14px;
  }}
</style>
</head>
<body>
<div class="layout">
  <aside class="sidebar">
    <div class="sidebar-logo">
      <div class="brand">FinTwin</div>
      <div class="sub">Admin Panel</div>
    </div>
    <nav class="sidebar-nav">
      {tab_html}
    </nav>
    <div class="sidebar-footer">
      <a href="/admin/logout" class="logout-btn">🚪 Çıkış</a>
    </div>
  </aside>
  <main class="main">
    {content}
  </main>
</div>
</body>
</html>"""


# ── Giriş Sayfası ─────────────────────────────────────────────────────────────
LOGIN_HTML = """<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>FinTwin Admin — Giriş</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    font-family: 'DM Sans', sans-serif;
    background: #070711;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }}
  .login-box {{
    background: #111127;
    border: 1px solid rgba(124,110,250,0.2);
    border-radius: 20px;
    padding: 48px 40px;
    width: 100%;
    max-width: 380px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.6);
  }}
  .logo {{
    text-align: center;
    margin-bottom: 32px;
  }}
  .logo .brand {{
    font-size: 28px;
    font-weight: 800;
    background: linear-gradient(135deg, #7C6EFA, #60A5FA);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -1px;
  }}
  .logo .sub {{
    font-size: 13px;
    color: #5A5A7A;
    margin-top: 4px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }}
  label {{
    display: block;
    font-size: 12px;
    font-weight: 700;
    color: #9090B8;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }}
  input[type=password] {{
    width: 100%;
    background: #0d0d1a;
    border: 1.5px solid rgba(124,110,250,0.2);
    border-radius: 12px;
    padding: 14px 16px;
    font-size: 15px;
    color: #E8E8FF;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color 0.2s;
    margin-bottom: 20px;
  }}
  input[type=password]:focus {{
    border-color: #7C6EFA;
  }}
  button {{
    width: 100%;
    background: linear-gradient(135deg, #7C6EFA, #6366F1);
    border: none;
    border-radius: 12px;
    padding: 15px;
    font-size: 15px;
    font-weight: 800;
    color: #fff;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: opacity 0.2s;
    letter-spacing: 0.3px;
  }}
  button:hover {{ opacity: 0.9; }}
  .error {{
    background: rgba(248,113,113,0.1);
    border: 1px solid rgba(248,113,113,0.3);
    border-radius: 10px;
    padding: 12px 14px;
    color: #F87171;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 16px;
    text-align: center;
  }}
</style>
</head>
<body>
<div class="login-box">
  <div class="logo">
    <div class="brand">🏦 FinTwin</div>
    <div class="sub">Admin Panel</div>
  </div>
  {error_html}
  <form method="post" action="/admin/login">
    <label>Şifre</label>
    <input type="password" name="password" placeholder="••••••••" autofocus>
    <button type="submit">🔐 Giriş Yap</button>
  </form>
</div>
</body>
</html>"""


# ── Route'lar ─────────────────────────────────────────────────────────────────

@router.get("/", response_class=HTMLResponse)
async def admin_root(request: Request):
    if not is_authenticated(request):
        return HTMLResponse(LOGIN_HTML.replace("{error_html}", ""))
    return RedirectResponse("/admin/dashboard")


@router.post("/login")
async def admin_login(request: Request, password: str = Form(...)):
    if password == ADMIN_PASSWORD:
        resp = RedirectResponse("/admin/dashboard", status_code=302)
        resp.set_cookie(COOKIE_NAME, COOKIE_VALUE, httponly=True, max_age=86400 * 7)
        return resp
    error = '<div class="error">❌ Hatalı şifre. Tekrar deneyin.</div>'
    return HTMLResponse(LOGIN_HTML.replace("{error_html}", error), status_code=401)


@router.get("/logout")
async def admin_logout():
    resp = RedirectResponse("/admin/", status_code=302)
    resp.delete_cookie(COOKIE_NAME)
    return resp


@router.get("/dashboard", response_class=HTMLResponse)
async def admin_dashboard(request: Request, db: aiosqlite.Connection = Depends(get_db)):
    if not is_authenticated(request):
        return RedirectResponse("/admin/")

    # ── Genel istatistikler ──
    async with db.execute("SELECT COUNT(*) as c FROM users") as cur:
        toplam_kullanici = (await cur.fetchone())["c"]

    async with db.execute("SELECT COUNT(*) as c FROM users WHERE DATE(kayit_tarihi) = DATE('now')") as cur:
        bugun_kayit = (await cur.fetchone())["c"]

    async with db.execute("SELECT COUNT(*) as c FROM transactions WHERE sync_status != 'deleted'") as cur:
        toplam_islem = (await cur.fetchone())["c"]

    async with db.execute("""
        SELECT SUM(CASE WHEN tip='Gelir' THEN tutar ELSE 0 END) as gelir,
               SUM(CASE WHEN tip='Gider' THEN tutar ELSE 0 END) as gider
        FROM transactions WHERE sync_status != 'deleted'
    """) as cur:
        row = await cur.fetchone()
        toplam_gelir = row["gelir"] or 0
        toplam_gider = row["gider"] or 0

    async with db.execute("SELECT COUNT(*) as c FROM feedbacks") as cur:
        toplam_feedback = (await cur.fetchone())["c"]

    async with db.execute("SELECT COUNT(*) as c FROM feedbacks WHERE okundu = 0") as cur:
        okunmamis = (await cur.fetchone())["c"]

    async with db.execute("SELECT COUNT(*) as c FROM users WHERE is_verified = 1") as cur:
        dogrulanan = (await cur.fetchone())["c"]

    net = toplam_gelir - toplam_gider

    # ── Son 5 feedback ──
    async with db.execute("""
        SELECT mail_hash, mesaj, dil, okundu, created_at
        FROM feedbacks ORDER BY created_at DESC LIMIT 5
    """) as cur:
        son_feedbackler = await cur.fetchall()

    # ── Meslek dağılımı top 5 ──
    async with db.execute("""
        SELECT meslek, COUNT(*) as sayi FROM users
        WHERE meslek IS NOT NULL AND meslek != ''
        GROUP BY meslek ORDER BY sayi DESC LIMIT 5
    """) as cur:
        meslek_dist = await cur.fetchall()

    def fmt_tl(val):
        return f"{val:,.0f}₺".replace(",", ".")

    feedback_rows = ""
    for f in son_feedbackler:
        badge = "badge-tr" if f["dil"] == "TR" else "badge-en"
        oku_badge = "badge-read" if f["okundu"] else "badge-new"
        oku_text  = "Okundu" if f["okundu"] else "Yeni"
        hash_short = str(f["mail_hash"])[:12] + "..." if f["mail_hash"] else "—"
        msg_short  = str(f["mesaj"])[:80] + ("..." if len(str(f["mesaj"])) > 80 else "")
        tarih = str(f["created_at"])[:16]
        feedback_rows += f"""
        <tr>
          <td><span class="chip chip-blue" style="font-size:10px">{hash_short}</span></td>
          <td style="max-width:280px;color:var(--text)">{msg_short}</td>
          <td><span class="badge {badge}">{f['dil']}</span></td>
          <td><span class="badge {oku_badge}">{oku_text}</span></td>
          <td style="color:var(--text3);font-size:12px">{tarih}</td>
        </tr>"""

    if not son_feedbackler:
        feedback_rows = '<tr><td colspan="5" class="empty-state">Henüz öneri yok.</td></tr>'

    meslek_rows = ""
    for m in meslek_dist:
        meslek_rows += f"""
        <tr>
          <td style="color:var(--text)">{m['meslek'] or '—'}</td>
          <td><span class="chip chip-blue">{m['sayi']} kullanıcı</span></td>
        </tr>"""

    net_color = "var(--success)" if net >= 0 else "var(--danger)"

    content = f"""
    <div class="page-title">📊 Dashboard</div>

    <div class="stat-grid">
      <div class="stat-card" style="--accent: #7C6EFA">
        <div class="stat-label">Toplam Kullanıcı</div>
        <div class="stat-value">{toplam_kullanici}</div>
        <div class="stat-sub">✅ {dogrulanan} doğrulanmış</div>
      </div>
      <div class="stat-card" style="--accent: #34D399">
        <div class="stat-label">Bugün Kayıt</div>
        <div class="stat-value">{bugun_kayit}</div>
        <div class="stat-sub">Yeni kullanıcı</div>
      </div>
      <div class="stat-card" style="--accent: #60A5FA">
        <div class="stat-label">Toplam İşlem</div>
        <div class="stat-value">{toplam_islem}</div>
        <div class="stat-sub">Tüm kullanıcılar</div>
      </div>
      <div class="stat-card" style="--accent: #34D399">
        <div class="stat-label">Toplam Gelir</div>
        <div class="stat-value" style="font-size:20px;color:var(--success)">{fmt_tl(toplam_gelir)}</div>
        <div class="stat-sub">Tüm kullanıcılar</div>
      </div>
      <div class="stat-card" style="--accent: #F87171">
        <div class="stat-label">Toplam Gider</div>
        <div class="stat-value" style="font-size:20px;color:var(--danger)">{fmt_tl(toplam_gider)}</div>
        <div class="stat-sub">Tüm kullanıcılar</div>
      </div>
      <div class="stat-card" style="--accent: #FBBF24">
        <div class="stat-label">Net Bakiye</div>
        <div class="stat-value" style="font-size:20px;color:{net_color}">{fmt_tl(net)}</div>
        <div class="stat-sub">Gelir − Gider</div>
      </div>
      <div class="stat-card" style="--accent: #F472B6">
        <div class="stat-label">Öneri/Şikayet</div>
        <div class="stat-value">{toplam_feedback}</div>
        <div class="stat-sub">🔴 {okunmamis} okunmamış</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">💬 Son Öneri & Şikayetler</div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Kullanıcı</th><th>Mesaj</th><th>Dil</th><th>Durum</th><th>Tarih</th></tr></thead>
          <tbody>{feedback_rows}</tbody>
        </table>
      </div>
      <div style="margin-top:12px">
        <a href="/admin/feedbacks" style="color:var(--primary2);font-size:13px;font-weight:700;text-decoration:none">Tümünü gör →</a>
      </div>
    </div>

    <div class="card">
      <div class="card-title">💼 En Çok Kullanıcıya Sahip Meslekler</div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Meslek</th><th>Kullanıcı Sayısı</th></tr></thead>
          <tbody>{meslek_rows}</tbody>
        </table>
      </div>
    </div>
    """
    return HTMLResponse(render_page(content, "dashboard"))


@router.get("/feedbacks", response_class=HTMLResponse)
async def admin_feedbacks(request: Request, db: aiosqlite.Connection = Depends(get_db)):
    if not is_authenticated(request):
        return RedirectResponse("/admin/")

    async with db.execute("""
        SELECT id, mail_hash, mesaj, dil, okundu, created_at
        FROM feedbacks ORDER BY okundu ASC, created_at DESC
    """) as cur:
        feedbacks = await cur.fetchall()

    async with db.execute("SELECT COUNT(*) as c FROM feedbacks WHERE okundu = 0") as cur:
        okunmamis = (await cur.fetchone())["c"]

    rows = ""
    for f in feedbacks:
        badge = "badge-tr" if f["dil"] == "TR" else "badge-en"
        oku_badge = "badge-read" if f["okundu"] else "badge-new"
        oku_text  = "Okundu" if f["okundu"] else "Yeni"
        hash_short = str(f["mail_hash"])[:16] + "..." if f["mail_hash"] else "—"
        tarih = str(f["created_at"])[:16]
        mark_btn = ""
        if not f["okundu"]:
            mark_btn = f'<a href="/admin/feedbacks/mark/{f["id"]}" class="mark-btn">✓ Okundu İşaretle</a>'
        rows += f"""
        <tr>
          <td><span class="chip chip-blue" style="font-size:10px;font-family:var(--mono)">{hash_short}</span></td>
          <td style="max-width:400px">
            <div class="msg-box">{f['mesaj']}</div>
          </td>
          <td><span class="badge {badge}">{f['dil']}</span></td>
          <td><span class="badge {oku_badge}">{oku_text}</span></td>
          <td style="color:var(--text3);font-size:12px;white-space:nowrap">{tarih}</td>
          <td>{mark_btn}</td>
        </tr>"""

    if not feedbacks:
        rows = '<tr><td colspan="6" class="empty-state">Henüz öneri veya şikayet yok.</td></tr>'

    content = f"""
    <div class="page-title">💬 Öneri & Şikayetler
      <span style="font-size:14px;color:var(--danger);font-weight:600;margin-left:12px">
        🔴 {okunmamis} okunmamış
      </span>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Kullanıcı Hash</th>
              <th>Mesaj</th>
              <th>Dil</th>
              <th>Durum</th>
              <th>Tarih</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    </div>"""
    return HTMLResponse(render_page(content, "feedbacks"))


@router.get("/feedbacks/mark/{feedback_id}")
async def mark_feedback_read(request: Request, feedback_id: int, db: aiosqlite.Connection = Depends(get_db)):
    if not is_authenticated(request):
        return RedirectResponse("/admin/")
    await db.execute("UPDATE feedbacks SET okundu = 1 WHERE id = ?", (feedback_id,))
    await db.commit()
    return RedirectResponse("/admin/feedbacks", status_code=302)


@router.get("/users", response_class=HTMLResponse)
async def admin_users(request: Request, db: aiosqlite.Connection = Depends(get_db)):
    if not is_authenticated(request):
        return RedirectResponse("/admin/")

    async with db.execute("""
        SELECT u.id, u.mail_hash, u.yas, u.cinsiyet, u.sehir, u.meslek,
               u.gics_l3, u.kayit_tarihi, u.is_verified, u.lang,
               COUNT(t.id) as islem_sayisi
        FROM users u
        LEFT JOIN transactions t ON t.user_id = u.id AND t.sync_status != 'deleted'
        GROUP BY u.id
        ORDER BY u.kayit_tarihi DESC
        LIMIT 50
    """) as cur:
        users = await cur.fetchall()

    rows = ""
    for u in users:
        hash_short = str(u["mail_hash"])[:14] + "..."
        verified_badge = '<span class="badge badge-read">✅ Doğrulandı</span>' if u["is_verified"] else '<span class="badge badge-new">⏳ Bekliyor</span>'
        lang_badge = f'<span class="badge badge-{"tr" if u["lang"] == "TR" else "en"}">{u["lang"]}</span>'
        rows += f"""
        <tr>
          <td style="font-family:var(--mono);font-size:11px;color:var(--text3)">{hash_short}</td>
          <td style="color:var(--text)">{u['yas'] or '—'}</td>
          <td>{u['cinsiyet'] or '—'}</td>
          <td>{u['sehir'] or '—'}</td>
          <td style="color:var(--text)">{u['meslek'] or '—'}</td>
          <td style="color:var(--text2);font-size:12px">{u['gics_l3'] or '—'}</td>
          <td>{verified_badge}</td>
          <td>{lang_badge}</td>
          <td><span class="chip chip-blue">{u['islem_sayisi']}</span></td>
          <td style="color:var(--text3);font-size:11px">{str(u['kayit_tarihi'])[:10]}</td>
        </tr>"""

    if not users:
        rows = '<tr><td colspan="10" class="empty-state">Kullanıcı yok.</td></tr>'

    content = f"""
    <div class="page-title">👥 Son Kullanıcılar (En fazla 50)</div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mail Hash</th><th>Yaş</th><th>Cinsiyet</th><th>Şehir</th>
              <th>Meslek</th><th>Sektör</th><th>Durum</th><th>Dil</th>
              <th>İşlem</th><th>Kayıt</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    </div>"""
    return HTMLResponse(render_page(content, "users"))


@router.get("/stats", response_class=HTMLResponse)
async def admin_stats(request: Request, db: aiosqlite.Connection = Depends(get_db)):
    if not is_authenticated(request):
        return RedirectResponse("/admin/")

    def fmt_tl(val):
        v = val or 0
        return f"{v:,.0f}₺".replace(",", ".")

    # ── Meslek bazlı gelir/gider ortalamaları ──
    async with db.execute("""
        SELECT u.meslek,
               COUNT(DISTINCT u.id) as kullanici_sayisi,
               AVG(CASE WHEN t.tip='Gelir' THEN t.tutar END) as ort_gelir,
               AVG(CASE WHEN t.tip='Gider' THEN t.tutar END) as ort_gider,
               SUM(CASE WHEN t.tip='Gelir' THEN t.tutar ELSE 0 END) as toplam_gelir,
               SUM(CASE WHEN t.tip='Gider' THEN t.tutar ELSE 0 END) as toplam_gider
        FROM users u
        LEFT JOIN transactions t ON t.user_id = u.id AND t.sync_status != 'deleted'
        WHERE u.meslek IS NOT NULL AND u.meslek != ''
        GROUP BY u.meslek
        ORDER BY ort_gelir DESC NULLS LAST
    """) as cur:
        meslek_stats = await cur.fetchall()

    # ── Sektör bazlı gelir/gider ortalamaları ──
    async with db.execute("""
        SELECT u.gics_l3 as sektor,
               COUNT(DISTINCT u.id) as kullanici_sayisi,
               AVG(CASE WHEN t.tip='Gelir' THEN t.tutar END) as ort_gelir,
               AVG(CASE WHEN t.tip='Gider' THEN t.tutar END) as ort_gider
        FROM users u
        LEFT JOIN transactions t ON t.user_id = u.id AND t.sync_status != 'deleted'
        WHERE u.gics_l3 IS NOT NULL AND u.gics_l3 != ''
        GROUP BY u.gics_l3
        ORDER BY ort_gelir DESC NULLS LAST
    """) as cur:
        sektor_stats = await cur.fetchall()

    # ── Cinsiyet dağılımı ──
    async with db.execute("""
        SELECT cinsiyet, COUNT(*) as sayi FROM users
        WHERE cinsiyet IS NOT NULL AND cinsiyet != ''
        GROUP BY cinsiyet ORDER BY sayi DESC
    """) as cur:
        cinsiyet_dist = await cur.fetchall()

    # ── Yaş grubu dağılımı ──
    async with db.execute("""
        SELECT
          CASE
            WHEN CAST(yas AS INTEGER) BETWEEN 18 AND 25 THEN '18-25'
            WHEN CAST(yas AS INTEGER) BETWEEN 26 AND 35 THEN '26-35'
            WHEN CAST(yas AS INTEGER) BETWEEN 36 AND 45 THEN '36-45'
            WHEN CAST(yas AS INTEGER) > 45 THEN '45+'
            ELSE 'Belirtilmemiş'
          END as yas_grubu,
          COUNT(*) as sayi
        FROM users
        WHERE yas IS NOT NULL AND yas != ''
        GROUP BY yas_grubu
        ORDER BY sayi DESC
    """) as cur:
        yas_dist = await cur.fetchall()

    # ── Şehir top 10 ──
    async with db.execute("""
        SELECT sehir, COUNT(*) as sayi FROM users
        WHERE sehir IS NOT NULL AND sehir != ''
        GROUP BY sehir ORDER BY sayi DESC LIMIT 10
    """) as cur:
        sehir_dist = await cur.fetchall()

    # Meslek tablosu
    meslek_rows = ""
    for m in meslek_stats:
        og = m["ort_gelir"] or 0
        od = m["ort_gider"] or 0
        net = og - od
        net_color = "var(--success)" if net >= 0 else "var(--danger)"
        meslek_rows += f"""
        <tr>
          <td style="color:var(--text);font-weight:600">{m['meslek'] or '—'}</td>
          <td><span class="chip chip-blue">{m['kullanici_sayisi']}</span></td>
          <td style="color:var(--success);font-family:var(--mono)">{fmt_tl(og)}</td>
          <td style="color:var(--danger);font-family:var(--mono)">{fmt_tl(od)}</td>
          <td style="color:{net_color};font-family:var(--mono);font-weight:700">{fmt_tl(net)}</td>
        </tr>"""

    if not meslek_stats:
        meslek_rows = '<tr><td colspan="5" class="empty-state">Veri yok.</td></tr>'

    # Sektör tablosu
    sektor_rows = ""
    for s in sektor_stats:
        og = s["ort_gelir"] or 0
        od = s["ort_gider"] or 0
        net = og - od
        net_color = "var(--success)" if net >= 0 else "var(--danger)"
        sektor_rows += f"""
        <tr>
          <td style="color:var(--text);font-weight:600">{s['sektor'] or '—'}</td>
          <td><span class="chip chip-blue">{s['kullanici_sayisi']}</span></td>
          <td style="color:var(--success);font-family:var(--mono)">{fmt_tl(og)}</td>
          <td style="color:var(--danger);font-family:var(--mono)">{fmt_tl(od)}</td>
          <td style="color:{net_color};font-family:var(--mono);font-weight:700">{fmt_tl(net)}</td>
        </tr>"""

    if not sektor_stats:
        sektor_rows = '<tr><td colspan="5" class="empty-state">Veri yok.</td></tr>'

    # Cinsiyet kartları
    cinsiyet_html = ""
    toplam_c = sum(r["sayi"] for r in cinsiyet_dist) or 1
    colors_c  = ["#7C6EFA","#F472B6","#60A5FA"]
    for i, c in enumerate(cinsiyet_dist):
        pct = round(c["sayi"] / toplam_c * 100, 1)
        clr = colors_c[i % len(colors_c)]
        cinsiyet_html += f"""
        <div style="margin-bottom:14px">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span style="font-size:13px;color:var(--text);font-weight:600">{c['cinsiyet']}</span>
            <span style="font-size:13px;font-family:var(--mono);color:var(--text2)">{c['sayi']} · {pct}%</span>
          </div>
          <div class="progress-wrap">
            <div class="progress-bar" style="width:{pct}%;background:{clr}"></div>
          </div>
        </div>"""

    # Yaş grubu kartları
    yas_html = ""
    toplam_y = sum(r["sayi"] for r in yas_dist) or 1
    colors_y  = ["#34D399","#7C6EFA","#FBBF24","#F87171","#60A5FA"]
    for i, y in enumerate(yas_dist):
        pct = round(y["sayi"] / toplam_y * 100, 1)
        clr = colors_y[i % len(colors_y)]
        yas_html += f"""
        <div style="margin-bottom:14px">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span style="font-size:13px;color:var(--text);font-weight:600">{y['yas_grubu']}</span>
            <span style="font-size:13px;font-family:var(--mono);color:var(--text2)">{y['sayi']} · {pct}%</span>
          </div>
          <div class="progress-wrap">
            <div class="progress-bar" style="width:{pct}%;background:{clr}"></div>
          </div>
        </div>"""

    # Şehir top 10
    sehir_rows = ""
    toplam_s = sum(r["sayi"] for r in sehir_dist) or 1
    for s in sehir_dist:
        pct = round(s["sayi"] / toplam_s * 100, 1)
        sehir_rows += f"""
        <tr>
          <td style="color:var(--text);font-weight:600">{s['sehir']}</td>
          <td><span class="chip chip-blue">{s['sayi']}</span></td>
          <td style="width:200px">
            <div class="progress-wrap">
              <div class="progress-bar" style="width:{pct * 3}%;max-width:100%"></div>
            </div>
          </td>
          <td style="color:var(--text3);font-size:12px;font-family:var(--mono)">{pct}%</td>
        </tr>"""

    if not sehir_dist:
        sehir_rows = '<tr><td colspan="4" class="empty-state">Veri yok.</td></tr>'

    content = f"""
    <div class="page-title">📈 İstatistikler</div>

    <div class="card">
      <div class="card-title">💼 Meslek Bazlı Ortalama Gelir / Gider</div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Meslek</th>
              <th>Kullanıcı</th>
              <th>Ort. Gelir</th>
              <th>Ort. Gider</th>
              <th>Net</th>
            </tr>
          </thead>
          <tbody>{meslek_rows}</tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-title">🏢 Sektör Bazlı Ortalama Gelir / Gider</div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Sektör</th>
              <th>Kullanıcı</th>
              <th>Ort. Gelir</th>
              <th>Ort. Gider</th>
              <th>Net</th>
            </tr>
          </thead>
          <tbody>{sektor_rows}</tbody>
        </table>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <div class="card">
        <div class="card-title">🧬 Cinsiyet Dağılımı</div>
        {cinsiyet_html if cinsiyet_html else '<div class="empty-state">Veri yok.</div>'}
      </div>
      <div class="card">
        <div class="card-title">🎂 Yaş Grubu Dağılımı</div>
        {yas_html if yas_html else '<div class="empty-state">Veri yok.</div>'}
      </div>
    </div>

    <div class="card">
      <div class="card-title">📍 Şehir Dağılımı (Top 10)</div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Şehir</th><th>Kullanıcı</th><th>Dağılım</th><th>%</th></tr></thead>
          <tbody>{sehir_rows}</tbody>
        </table>
      </div>
    </div>
    """
    return HTMLResponse(render_page(content, "stats"))


@router.post("/reset-all-data")
async def reset_all_data(
    request: Request,
    db: aiosqlite.Connection = Depends(get_db),
):
    """TÜM VERİLERİ SİL — sadece admin şifresiyle erişilebilir."""
    # Admin şifre kontrolü
    body = await request.json()
    if body.get("password") != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Yetkisiz erişim")
    
    # Tüm tabloları temizle
    await db.execute("DELETE FROM transactions")
    await db.execute("DELETE FROM statements")
    await db.execute("DELETE FROM feedbacks")
    await db.execute("DELETE FROM otp_codes")
    await db.execute("DELETE FROM users")
    try:
        await db.execute("DELETE FROM sync_log")
    except:
        pass
    await db.commit()
    
    return {"message": "Tüm veriler silindi.", "status": "ok"}


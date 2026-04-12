# statements.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from datetime import datetime
import aiosqlite, hashlib, io, json, re

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.schemas import StatementResponse, StatementRow

router = APIRouter()


def _parse_pdf(pdf_bytes: bytes) -> list[dict]:
    """PDF'ten işlemleri çıkar – Streamlit versiyonuyla aynı mantık."""
    try:
        import pdfplumber
    except ImportError:
        raise HTTPException(500, "pdfplumber kurulu değil: pip install pdfplumber")

    tarih_re = re.compile(r'\b(\d{2}[/.]\d{2}[/.]\d{4})\b')
    tutar_re = re.compile(r'TL\.([\d][\d.]*(?:,[\d]{1,2})?(?:,-)?)')
    SKIP = ['TESEKKUR','TEŞEKKÜR','ODEME','ÖDEME','DEVIR','DEVİR','KKDF',
            'BSMV','TOPLAM','GENEL','IADE','İADE','FAIZ','FAİZ','GECIKME',
            'GECİKME','BONUS','INDIRIM','İNDİRİM','KAMPANYA']

    def parse_tl(s):
        try:
            s = str(s).strip().replace('TL.','').replace(',-','').strip().strip('.').strip(',')
            if not s: return 0.0
            if ',' in s:
                parts = s.rsplit(',',1)
                return float(parts[0].replace('.','') + '.' + (parts[1][:2] if len(parts)>1 else '00'))
            return float(s.replace('.',''))
        except: return 0.0

    rows = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            for line in text.split('\n'):
                line = line.strip()
                if not line: continue
                tm = tarih_re.search(line)
                if not tm: continue
                lu = line.upper()
                if '-TL.' in line: continue
                if any(kw in lu for kw in SKIP): continue
                tl_all = tutar_re.findall(line)
                if not tl_all: continue
                tutar_val = None
                for raw in tl_all:
                    v = parse_tl(raw)
                    if 0 < v <= 99999.99:
                        tutar_val = v; break
                if not tutar_val: continue
                acik = tarih_re.sub('', line)
                acik = tutar_re.sub('', acik)
                acik = re.sub(r'^\d{2}/\d{2}\s*','', acik.strip())
                acik = re.sub(r'\s+',' ', acik).strip()
                if len(acik) < 2: acik = "Ekstre İşlemi"
                rows.append({"tarih": tm.group(1), "aciklama": acik, "tutar": round(tutar_val,2)})

    # Mükerrer kaldır
    seen = set(); uniq = []
    for r in rows:
        k = (r["tarih"], r["tutar"], r["aciklama"])
        if k not in seen:
            seen.add(k); uniq.append(r)
    return uniq


@router.post("/upload", status_code=201, response_model=StatementResponse)
async def upload_statement(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    pdf_bytes = await file.read()
    dosya_hash = hashlib.md5(pdf_bytes).hexdigest()

    # Aynı dosya daha önce yüklendi mi?
    async with db.execute(
        "SELECT * FROM statements WHERE user_id = ? AND dosya_hash = ?",
        (current_user["user_id"], dosya_hash)
    ) as cur:
        existing = await cur.fetchone()
    if existing:
        return {**dict(existing), "parsed_rows": json.loads(existing["parsed_rows"])}

    parsed_rows = _parse_pdf(pdf_bytes)
    if not parsed_rows:
        raise HTTPException(422, "Ekstrede işlem bulunamadı.")

    async with db.execute("""
        INSERT INTO statements (user_id, dosya_isim, dosya_hash, parsed_rows)
        VALUES (?,?,?,?) RETURNING *
    """, (current_user["user_id"], file.filename, dosya_hash,
          json.dumps(parsed_rows, ensure_ascii=False))) as cur:
        row = await cur.fetchone()
    await db.commit()
    return {**dict(row), "parsed_rows": parsed_rows}


@router.get("/", response_model=list[StatementResponse])
async def list_statements(
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    async with db.execute(
        "SELECT * FROM statements WHERE user_id = ? ORDER BY created_at DESC",
        (current_user["user_id"],)
    ) as cur:
        rows = await cur.fetchall()
    result = []
    for r in rows:
        d = dict(r)
        d["parsed_rows"] = json.loads(d["parsed_rows"])
        result.append(d)
    return result


@router.delete("/{stmt_id}", status_code=204)
async def delete_statement(
    stmt_id: int,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    await db.execute(
        "DELETE FROM statements WHERE id = ? AND user_id = ?",
        (stmt_id, current_user["user_id"])
    )
    await db.commit()

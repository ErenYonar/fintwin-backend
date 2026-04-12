# exchange.py
from fastapi import APIRouter
from app.services.exchange_service import get_exchange_rates

router = APIRouter()

_cached_rates: dict | None = None
_cache_time: str | None = None


@router.get("/rates")
async def rates():
    """Döviz kurlarını döndür. İlk çağrıda TCMB'den çeker, önbelleğe alır."""
    global _cached_rates, _cache_time
    from datetime import datetime
    now = datetime.utcnow()

    # 30 dakikada bir yenile
    if _cached_rates is None or (
        _cache_time and (now - datetime.fromisoformat(_cache_time)).seconds > 1800
    ):
        fresh = get_exchange_rates()
        if fresh:
            _cached_rates = fresh
            _cache_time = now.isoformat()

    return {
        "rates": _cached_rates or {"TL": 1.0, "USD": 44.0, "EUR": 48.0, "GBP": 57.0},
        "updated_at": _cache_time,
    }

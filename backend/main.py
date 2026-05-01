# -*- coding: utf-8 -*-
"""
FinTwin FastAPI Backend
Streamlit uygulamasının tüm iş mantığı burada API olarak sunuluyor.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.core.database import init_db
from app.routers import auth, transactions, analytics, exchange, statements, users, admin, ads


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Uygulama başlarken DB'yi başlat."""
    await init_db()
    yield


app = FastAPI(
    title="FinTwin API",
    description="Kişisel Finans Asistanı – Mobil Backend",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS – React Native / Expo için tüm originlere izin ver (prod'da kısıtla)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router'ları kaydet
app.include_router(auth.router,         prefix="/auth",         tags=["Auth"])
app.include_router(users.router,        prefix="/users",        tags=["Users"])
app.include_router(transactions.router, prefix="/transactions", tags=["Transactions"])
app.include_router(analytics.router,    prefix="/analytics",    tags=["Analytics"])
app.include_router(exchange.router,     prefix="/exchange",     tags=["Exchange"])
app.include_router(statements.router,   prefix="/statements",   tags=["Statements"])
app.include_router(admin.router,        prefix="/admin",        tags=["Admin"])
app.include_router(ads.router,          prefix="/ads",          tags=["Ads"])


@app.get("/")
async def root():
    return {"message": "FinTwin API v2.0", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

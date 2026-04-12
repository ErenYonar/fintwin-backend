# -*- coding: utf-8 -*-
"""Döviz kuru çekme servisi – Streamlit versiyonundan taşındı."""

import urllib.request, urllib.error
import xml.etree.ElementTree as ET
import json, ssl


def get_exchange_rates() -> dict | None:
    """TCMB + fallback API'lerden döviz kurlarını çek."""
    rates = {"TL": 1.0}
    ctx = ssl._create_unverified_context()

    # Yöntem 1: TCMB XML
    try:
        url = "https://www.tcmb.gov.tr/kurlar/today.xml"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=8, context=ctx) as r:
            root = ET.fromstring(r.read())
        for currency in root.findall(".//Currency"):
            code = currency.get("Kod") or currency.get("CurrencyCode")
            if code in ["USD", "EUR", "GBP"]:
                fs = currency.find("ForexSelling")
                if fs is not None and fs.text:
                    v = float(fs.text.replace(",", "."))
                    if v > 0:
                        rates[code] = v
        if len(rates) >= 4:
            return rates
    except Exception:
        pass

    # Yöntem 2: open.er-api.com
    try:
        url = "https://open.er-api.com/v6/latest/TRY"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=8, context=ctx) as r:
            data = json.loads(r.read())
        if data.get("result") == "success":
            for sym in ["USD", "EUR", "GBP"]:
                v = data["rates"].get(sym, 0)
                if v > 0:
                    rates[sym] = round(1.0 / v, 4)
            if len(rates) >= 4:
                return rates
    except Exception:
        pass

    # Yöntem 3: fxratesapi.com
    try:
        url = "https://api.fxratesapi.com/latest?base=TRY&currencies=USD,EUR,GBP&format=json"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=8, context=ctx) as r:
            data = json.loads(r.read())
        if data.get("success", False):
            for sym in ["USD", "EUR", "GBP"]:
                v = data.get("rates", {}).get(sym, 0)
                if v > 0:
                    rates[sym] = round(1.0 / v, 4)
            if len(rates) >= 4:
                return rates
    except Exception:
        pass

    return None

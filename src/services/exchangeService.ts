// src/services/exchangeService.ts
/**
 * Döviz kuru servisi — TCMB (Merkez Bankası) resmi XML feed'i.
 * Fallback sırası: TCMB → open.er-api → exchangerate-api → eski cache → hardcode
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY      = 'fintwin_rates_v3';
const CACHE_META_KEY = 'fintwin_rates_meta_v3';
const CACHE_TTL_MS   = 60 * 60 * 1000; // 1 saat

export interface ExchangeRates {
  TL:  number;
  USD: number;
  EUR: number;
  GBP: number;
  lastUpdated: string;
  source: string;
}

const HARDCODE_FALLBACK: ExchangeRates = {
  TL: 1, USD: 38.50, EUR: 41.50, GBP: 49.00,
  lastUpdated: '', source: 'fallback',
};

// ── Kaynak 1: TCMB Resmi XML ─────────────────────────────────────────────────
async function fetchFromTCMB(): Promise<ExchangeRates> {
  const res = await fetch('https://www.tcmb.gov.tr/kurlar/today.xml', {
    headers: { 'Accept': 'application/xml, text/xml, */*' },
  });
  if (!res.ok) throw new Error(`TCMB HTTP ${res.status}`);
  const xml = await res.text();

  const extract = (code: string): number => {
    const re = new RegExp(
      `<Currency[^>]*Kod="${code}"[^>]*>[\\s\\S]*?<ForexSelling>([\\d.,]+)<\\/ForexSelling>`,
      'i'
    );
    const m = xml.match(re);
    if (!m) throw new Error(`TCMB: ${code} bulunamadı`);
    return parseFloat(m[1].replace(',', '.'));
  };

  const usd = extract('USD');
  const eur = extract('EUR');
  const gbp = extract('GBP');

  if (isNaN(usd) || isNaN(eur) || isNaN(gbp)) throw new Error('TCMB: parse hatası');

  return {
    TL: 1, USD: usd, EUR: eur, GBP: gbp,
    lastUpdated: new Date().toISOString(),
    source: 'TCMB (Merkez Bankası)',
  };
}

// ── Kaynak 2: open.er-api ────────────────────────────────────────────────────
async function fetchFromOpenER(): Promise<ExchangeRates> {
  const res  = await fetch('https://open.er-api.com/v6/latest/TRY');
  if (!res.ok) throw new Error(`open.er-api HTTP ${res.status}`);
  const json = await res.json();
  if (json.result !== 'success') throw new Error('open.er-api başarısız');
  const r = json.rates as Record<string, number>;
  return {
    TL: 1,
    USD: parseFloat((1 / r['USD']).toFixed(4)),
    EUR: parseFloat((1 / r['EUR']).toFixed(4)),
    GBP: parseFloat((1 / r['GBP']).toFixed(4)),
    lastUpdated: new Date().toISOString(),
    source: 'open.er-api.com',
  };
}

// ── Kaynak 3: exchangerate-api ───────────────────────────────────────────────
async function fetchFromExchangeRateAPI(): Promise<ExchangeRates> {
  const res  = await fetch('https://api.exchangerate-api.com/v4/latest/TRY');
  if (!res.ok) throw new Error(`exchangerate-api HTTP ${res.status}`);
  const json = await res.json();
  const r = json.rates as Record<string, number>;
  return {
    TL: 1,
    USD: parseFloat((1 / r['USD']).toFixed(4)),
    EUR: parseFloat((1 / r['EUR']).toFixed(4)),
    GBP: parseFloat((1 / r['GBP']).toFixed(4)),
    lastUpdated: new Date().toISOString(),
    source: 'exchangerate-api.com',
  };
}

// ── Cache yönetimi ───────────────────────────────────────────────────────────
async function getCached(): Promise<ExchangeRates | null> {
  try {
    const metaStr = await AsyncStorage.getItem(CACHE_META_KEY);
    if (!metaStr) return null;
    const { timestamp } = JSON.parse(metaStr);
    if (Date.now() - timestamp > CACHE_TTL_MS) return null;
    const ratesStr = await AsyncStorage.getItem(CACHE_KEY);
    if (!ratesStr) return null;
    return JSON.parse(ratesStr) as ExchangeRates;
  } catch { return null; }
}

async function setCache(rates: ExchangeRates): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(rates));
    await AsyncStorage.setItem(CACHE_META_KEY, JSON.stringify({ timestamp: Date.now() }));
  } catch { /* kritik değil */ }
}

async function getStaleCache(): Promise<ExchangeRates | null> {
  try {
    const ratesStr = await AsyncStorage.getItem(CACHE_KEY);
    if (!ratesStr) return null;
    const rates = JSON.parse(ratesStr) as ExchangeRates;
    return { ...rates, source: rates.source + ' (önbellek)' };
  } catch { return null; }
}

// ── Ana export ───────────────────────────────────────────────────────────────
export async function getExchangeRates(forceRefresh = false): Promise<ExchangeRates> {
  if (!forceRefresh) {
    const cached = await getCached();
    if (cached) return cached;
  }

  const sources = [fetchFromTCMB, fetchFromOpenER, fetchFromExchangeRateAPI];
  for (const fn of sources) {
    try {
      const rates = await fn();
      await setCache(rates);
      return rates;
    } catch (e) {
      console.warn('[ExchangeService] Kaynak başarısız:', e);
    }
  }

  const stale = await getStaleCache();
  if (stale) return stale;

  return { ...HARDCODE_FALLBACK, lastUpdated: new Date().toISOString() };
}

// ── Zaman formatlayıcı ───────────────────────────────────────────────────────
export function formatRateTimestamp(isoString: string, lang: 'TR' | 'EN'): string {
  if (!isoString) return lang === 'TR' ? 'Bilinmiyor' : 'Unknown';
  try {
    const diffMin = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
    if (diffMin < 1)  return lang === 'TR' ? 'Az önce' : 'Just now';
    if (diffMin < 60) return lang === 'TR' ? `${diffMin} dk önce` : `${diffMin} min ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24)   return lang === 'TR' ? `${diffH} saat önce` : `${diffH}h ago`;
    return new Date(isoString).toLocaleString(lang === 'TR' ? 'tr-TR' : 'en-US', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  } catch { return ''; }
}

import { getDeployStore, getStore } from "@netlify/blobs";

const STORE_NAME = "ilya-zhkh";
const STATE_KEY = "current";

function env(name: string) {
  return Netlify.env.get(name) || "";
}

function num(name: string): number | null {
  const raw = env(name).replace(",", ".").trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function nowIso() {
  return new Date().toISOString();
}

function blobStore() {
  const context = (Netlify as any)?.context?.deploy?.context;
  if (context === "production") {
    return getStore(STORE_NAME, { consistency: "strong" });
  }
  return getDeployStore(STORE_NAME);
}

export function isAuthorized(req: Request) {
  const expected = env("ZHKH_ACCESS_KEY");
  if (!expected) return false;
  const direct = req.headers.get("x-zhkh-key") || "";
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  return direct === expected || bearer === expected;
}

export function seedState() {
  return {
    schemaVersion: 1,
    property: {
      address: env("ZHKH_ADDRESS"),
    },
    services: {
      electricity: {
        title: "Электроэнергия",
        provider: "ООО «Р-Энергия»",
        account: env("ZHKH_ELECTRIC_ACCOUNT"),
        currentDebt: num("ZHKH_ELECTRIC_DEBT"),
        currency: "RUB",
        verifiedAt: env("ZHKH_ELECTRIC_VERIFIED_AT") || null,
        confidence: "confirmed",
        collection: "public-form",
        source: "Р-Энергия / Абонент+",
      },
      tko: {
        title: "ТКО",
        provider: "ООО «Эко-Пронск»",
        account: env("ZHKH_TKO_ACCOUNT"),
        currentDebt: num("ZHKH_TKO_DEBT"),
        currency: "RUB",
        verifiedAt: env("ZHKH_TKO_VERIFIED_AT") || null,
        confidence: "confirmed",
        collection: "public-form",
        source: "Эко-Пронск / Абонент+",
      },
      gas: {
        title: "Газ",
        provider: "ООО «Газпром межрегионгаз Рязань»",
        account: env("ZHKH_GAS_ACCOUNT"),
        currentDebt: null,
        currency: "RUB",
        verifiedAt: null,
        confidence: "account-confirmed",
        collection: "account-known-balance-closed",
        source: "Газпром межрегионгаз Рязань",
      },
      water: {
        title: "ХВС / водоотведение",
        provider: "МП «Водоканал города Рязани»",
        account: env("ZHKH_WATER_ACCOUNT"),
        currentDebt: null,
        currency: "RUB",
        verifiedAt: null,
        confidence: "account-confirmed",
        collection: "account-known-balance-closed",
        source: "МП «Водоканал города Рязани» / КВЦ",
      },
      caprepair: {
        title: "Капремонт",
        provider: "Фонд капитального ремонта Рязанской области",
        account: "",
        currentDebt: null,
        currency: "RUB",
        verifiedAt: null,
        confidence: "house-confirmed",
        collection: "balance-closed",
        source: "Фонд капитального ремонта Рязанской области",
        fundType: env("ZHKH_CAPREPAIR_STATUS") || null,
      },
      housing: {
        title: "УК / содержание дома",
        provider: env("ZHKH_UK_NAME"),
        account: env("ZHKH_KVC_ACCOUNT"),
        currentDebt: null,
        currency: "RUB",
        verifiedAt: null,
        confidence: "provider-confirmed",
        collection: "through-r-energiya",
        source: "ООО УК «Сервисный центр ЖКХ» / Р-Энергия",
      },
    },
    providers: {},
    zenmoney: {
      serverTimestamp: 0,
      lastSyncAt: null,
      lastError: null,
      payments: [],
    },
    lastRefreshAt: null,
    lastRefreshReason: null,
    errors: [],
  };
}

function mergeSeed(stored: any) {
  const seed = seedState();
  if (!stored || typeof stored !== "object") return seed;
  return {
    ...seed,
    ...stored,
    property: { ...seed.property, ...(stored.property || {}) },
    services: {
      ...seed.services,
      ...(stored.services || {}),
    },
    providers: { ...(stored.providers || {}) },
    zenmoney: {
      ...seed.zenmoney,
      ...(stored.zenmoney || {}),
      payments: Array.isArray(stored?.zenmoney?.payments) ? stored.zenmoney.payments : [],
    },
    errors: Array.isArray(stored.errors) ? stored.errors : [],
  };
}

export async function loadState() {
  try {
    const store = blobStore();
    const stored = await store.get(STATE_KEY, { type: "json" });
    return mergeSeed(stored);
  } catch (error: any) {
    const state = seedState();
    state.errors = [{ at: nowIso(), source: "storage", message: String(error?.message || error) }];
    return state;
  }
}

export async function saveState(state: any) {
  const store = blobStore();
  await store.setJSON(STATE_KEY, state);
}

function providerFromText(text: string) {
  const s = text.toLowerCase();
  if (/(ргмэк|р-энерг|р энергия|электроэнерг)/.test(s)) return "electricity";
  if (/(эко.?пронск|тко|обращение с тко)/.test(s)) return "tko";
  if (/(межрегионгаз|газпром.*газ|газоснабж)/.test(s)) return "gas";
  if (/(водоканал|холодн.*вод|водоотвед)/.test(s)) return "water";
  if (/(капремонт|капитальн.*ремонт|фонд.*ремонт)/.test(s)) return "caprepair";
  if (/(квц|жкх|сервисный центр)/.test(s)) return "housing";
  return null;
}

function inferBank(tx: any) {
  const id = String(tx?.outcomeBankID || tx?.incomeBankID || "").toLowerCase();
  if (id.includes("sberbank-online")) return "Сбербанк Онлайн";
  if (id.includes("tinkoff")) return "Т-Банк";
  return null;
}

function normalizeUtilityPayments(transactions: any[]) {
  const result: any[] = [];
  for (const tx of transactions || []) {
    if (!tx || tx.deleted) continue;
    const text = [tx.payee, tx.originalPayee, tx.comment].filter(Boolean).join(" ");
    const providerKey = providerFromText(text);
    if (!providerKey) continue;
    const outcome = Number(tx.outcome || 0);
    const income = Number(tx.income || 0);
    result.push({
      id: String(tx.id || ""),
      date: String(tx.date || ""),
      providerKey,
      title: String(tx.payee || tx.originalPayee || tx.comment || "Коммунальный платёж"),
      outcome: Number.isFinite(outcome) ? outcome : 0,
      income: Number.isFinite(income) ? income : 0,
      bank: inferBank(tx),
      source: String(tx.source || ""),
      comment: tx.comment ? String(tx.comment) : null,
    });
  }
  return result;
}

async function syncZenMoney(state: any) {
  const token = env("ZENMONEY_ACCESS_TOKEN");
  if (!token) {
    state.zenmoney.lastError = "ZENMONEY_ACCESS_TOKEN is not configured";
    return;
  }

  const previous = Number(state?.zenmoney?.serverTimestamp || 0);
  try {
    const res = await fetch("https://api.zenmoney.ru/v8/diff/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentClientTimestamp: Math.floor(Date.now() / 1000),
        serverTimestamp: previous,
      }),
    });

    if (!res.ok) {
      throw new Error(`ZenMoney HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }

    const data: any = await res.json();
    const incoming = normalizeUtilityPayments(Array.isArray(data?.transaction) ? data.transaction : []);
    const map = new Map<string, any>();
    for (const row of [...(state.zenmoney.payments || []), ...incoming]) {
      if (row?.id) map.set(String(row.id), row);
    }
    const payments = [...map.values()]
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 250);

    state.zenmoney = {
      ...state.zenmoney,
      serverTimestamp: Number(data?.serverTimestamp || previous),
      lastSyncAt: nowIso(),
      lastError: null,
      payments,
    };
  } catch (error: any) {
    state.zenmoney.lastSyncAt = nowIso();
    state.zenmoney.lastError = String(error?.message || error);
  }
}

const PROBES = [
  ["electricity", "https://r-energiya.abonent.online/search"],
  ["tko", "https://eco-pronsk-find-and-pay.abonent.plus/"],
  ["gas", "https://ryazanregiongaz.ru/"],
  ["water", "https://vodokanalryazan.ru/"],
  ["caprepair", "https://fondkr62.ru/"],
  ["housing", "http://ukars62.ru/"],
] as const;

async function probeOne(key: string, url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Ilya-ZHKH-Monitor/1.0)",
        "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
      },
    });
    return {
      key,
      url,
      ok: res.ok,
      status: res.status,
      checkedAt: nowIso(),
      finalUrl: res.url,
      error: null,
    };
  } catch (error: any) {
    return {
      key,
      url,
      ok: false,
      status: null,
      checkedAt: nowIso(),
      finalUrl: null,
      error: String(error?.message || error),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function probeProviders(state: any) {
  const rows = await Promise.all(PROBES.map(([key, url]) => probeOne(key, url)));
  for (const row of rows) {
    state.providers[row.key] = row;
  }
}

function summarize(state: any) {
  const services = Object.values(state.services || {}) as any[];
  const known = services.filter((x) => Number.isFinite(Number(x?.currentDebt)));
  const knownTotal = known.reduce((sum, x) => sum + Number(x.currentDebt || 0), 0);
  const unknown = services.filter((x) => x?.currentDebt == null).map((x) => x.title);
  const payments = Array.isArray(state?.zenmoney?.payments) ? state.zenmoney.payments : [];
  const lastPayment = payments[0] || null;

  return {
    knownDebtTotal: Math.round(knownTotal * 100) / 100,
    knownDebtServices: known.length,
    unknownDebtServices: unknown,
    lastUtilityPayment: lastPayment,
  };
}

export async function refreshState(reason = "manual") {
  const state = await loadState();
  state.errors = [];
  await Promise.all([
    syncZenMoney(state),
    probeProviders(state),
  ]);
  state.lastRefreshAt = nowIso();
  state.lastRefreshReason = reason;
  state.summary = summarize(state);
  await saveState(state);
  return state;
}

export function publicShape(state: any) {
  const normalized = mergeSeed(state);
  normalized.summary = summarize(normalized);
  return normalized;
}

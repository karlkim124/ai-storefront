import express from "express";
import crypto from "crypto";
import dns from "dns/promises";
import tls from "tls";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { declareDiscoveryExtension } from "@x402/extensions/bazaar";

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;
const PAY_TO = "0x65aF738Cdc6B21E9dAFA5F55223e63Aaf22d7F21";
const NETWORK = "eip155:8453";
const FACILITATOR_URL = process.env.FACILITATOR_URL || "https://facilitator.xpay.sh";

const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL });

const resourceServer = new x402ResourceServer(facilitatorClient)
  .register(NETWORK, new ExactEvmScheme());

const routes = {
  "GET /api/v1/extract": {
    accepts: [
      {
        scheme: "exact",
        price: "$0.01",
        network: NETWORK,
        payTo: PAY_TO
      }
    ],
    description: "Clean URL metadata and readable text extraction (strips scripts, styles, and HTML tags).",
    mimeType: "application/json",
    extensions: {
      ...declareDiscoveryExtension({
        input: { url: "https://en.wikipedia.org/wiki/Main_Page" },
        inputSchema: {
          properties: {
            url: { type: "string", description: "Target HTTP/HTTPS URL to fetch and extract clean text from." }
          },
          required: ["url"]
        },
        output: {
          example: {
            tier: "bulk_extraction",
            price_paid: "0.01 USDC",
            source_url: "https://en.wikipedia.org/wiki/Main_Page",
            title: "Wikipedia, the free encyclopedia",
            word_count: 142,
            extracted_text: "Wikipedia Main Page Welcome to Wikipedia..."
          }
        }
      })
    }
  },
  "GET /api/v1/niche-lookup": {
    accepts: [
      {
        scheme: "exact",
        price: "$0.05",
        network: NETWORK,
        payTo: PAY_TO
      }
    ],
    description: "Live Base & multi-chain DEX liquidity, 24h volume, order-flow ratio, and risk score lookup by token ticker or contract address.",
    mimeType: "application/json",
    extensions: {
      ...declareDiscoveryExtension({
        input: { key: "AERO" },
        inputSchema: {
          properties: {
            key: { type: "string", description: "Token symbol (e.g. AERO, VIRTUAL, DEGEN) or 0x contract address." }
          },
          required: ["key"]
        },
        output: {
          example: {
            tier: "niche_data_lookup",
            price_paid: "0.05 USDC",
            query: "AERO",
            verified_data: {
              chain: "base",
              symbol: "AERO",
              price_usd: "1.24",
              liquidity_usd: 18500000,
              volume_24h_usd: 4200000,
              buy_sell_ratio_24h: 1.12,
              liquidity_health_score: 92
            }
          }
        }
      })
    }
  },
  "GET /api/v1/token-audit": {
    accepts: [
      {
        scheme: "exact",
        price: "$0.05",
        network: NETWORK,
        payTo: PAY_TO
      }
    ],
    description: "Smart-contract token security & honeypot audit (buy/sell tax, mintability, proxy, ownership flags) across Base, Ethereum, Arbitrum, BSC, and Polygon.",
    mimeType: "application/json",
    extensions: {
      ...declareDiscoveryExtension({
        input: {
          chain_id: "8453",
          address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
        },
        inputSchema: {
          properties: {
            chain_id: { type: "string", description: "EVM Chain ID (8453 for Base, 1 for Ethereum, 42161 for Arbitrum, 56 for BSC, 137 for Polygon)." },
            address: { type: "string", description: "ERC-20 token contract address (0x...)." }
          },
          required: ["address"]
        },
        output: {
          example: {
            tier: "token_security_audit",
            price_paid: "0.05 USDC",
            chain_id: "8453",
            address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
            security_report: {
              token_name: "USD Coin",
              token_symbol: "USDC",
              is_honeypot: false,
              buy_tax_pct: 0,
              sell_tax_pct: 0,
              is_open_source: true,
              is_proxy: true,
              is_mintable: true,
              safe_to_trade_baseline: true
            }
          }
        }
      })
    }
  },
  "GET /api/v1/tvl-scan": {
    accepts: [
      {
        scheme: "exact",
        price: "$0.03",
        network: NETWORK,
        payTo: PAY_TO
      }
    ],
    description: "Live DeFi protocol TVL & 24h/7d capital flow screener filtered by chain and category via DefiLlama.",
    mimeType: "application/json",
    extensions: {
      ...declareDiscoveryExtension({
        input: { chain: "Base", category: "Dexs" },
        inputSchema: {
          properties: {
            chain: { type: "string", description: "Blockchain name (e.g. Base, Ethereum, Arbitrum, Solana)." },
            category: { type: "string", description: "Optional DeFi category filter (e.g. Dexs, Lending, Bridge, Liquid Staking)." }
          },
          required: ["chain"]
        },
        output: {
          example: {
            tier: "defi_tvl_screener",
            price_paid: "0.03 USDC",
            filter: { chain: "Base", category: "Dexs" },
            top_protocols: [
              {
                name: "Aerodrome",
                category: "Dexs",
                chain_tvl_usd: 520000000,
                total_tvl_usd: 520000000,
                change_1d_pct: 2.14,
                change_7d_pct: 8.45
              }
            ]
          }
        }
      })
    }
  },
  "GET /api/v1/domain-intel": {
    accepts: [
      {
        scheme: "exact",
        price: "$0.02",
        network: NETWORK,
        payTo: PAY_TO
      }
    ],
    description: "Live domain DNS records (A, AAAA, MX, NS, TXT/SPF), TLS/SSL certificate validity, and RDAP registration age lookup.",
    mimeType: "application/json",
    extensions: {
      ...declareDiscoveryExtension({
        input: { domain: "wikipedia.org" },
        inputSchema: {
          properties: {
            domain: { type: "string", description: "Apex domain name to inspect (e.g. wikipedia.org, coinbase.com)." }
          },
          required: ["domain"]
        },
        output: {
          example: {
            tier: "domain_intel_audit",
            price_paid: "0.02 USDC",
            domain: "wikipedia.org",
            dns: {
              a_records: ["198.35.26.96"],
              has_mx: true,
              has_spf: true
            },
            ssl: {
              valid: true,
              days_remaining: 74
            }
          }
        }
      })
    }
  },
  "POST /api/v1/verify-compute": {
    accepts: [
      {
        scheme: "exact",
        price: "$0.15",
        network: NETWORK,
        payTo: PAY_TO
      }
    ],
    description: "Deterministic canonical JSON SHA-256/SHA-512 cryptographic attestation and structural payload audit.",
    mimeType: "application/json",
    extensions: {
      ...declareDiscoveryExtension({
        output: {
          example: {
            tier: "heavy_compute_verification",
            price_paid: "0.15 USDC",
            verification_result: {
              sha256: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
              hash_match: true,
              key_count: 3,
              max_depth: 2,
              anomaly_detected: false
            }
          }
        }
      })
    }
  }
};

app.get("/", (req, res) => {
  res.json({
    service: "UE&D Express Autonomous Intelligence Storefront",
    status: "online",
    protocol: "x402",
    version: "2.2",
    network: NETWORK,
    manifest: "https://ueandd-express.onrender.com/.well-known/agent-card.json"
  });
});

app.get("/.well-known/agent-card.json", (req, res) => {
  res.json({
    name: "UE&D Express Autonomous Intelligence Storefront",
    description: "Production x402 micro-services settling in USDC on Base Mainnet.",
    protocol: "x402",
    version: "2.2",
    base_url: "https://ueandd-express.onrender.com",
    network: NETWORK,
    payee_wallet: PAY_TO,
    endpoints: [
      {
        path: "/api/v1/extract",
        method: "GET",
        price_usdc: "0.01",
        description: "Clean URL metadata and readable text extraction."
      },
      {
        path: "/api/v1/niche-lookup",
        method: "GET",
        price_usdc: "0.05",
        description: "Live Base & multi-chain DEX liquidity, volume, and risk score lookup."
      },
      {
        path: "/api/v1/token-audit",
        method: "GET",
        price_usdc: "0.05",
        description: "Smart-contract token security & honeypot audit via GoPlus."
      },
      {
        path: "/api/v1/tvl-scan",
        method: "GET",
        price_usdc: "0.03",
        description: "Live DeFi protocol TVL & capital flow screener by chain and category."
      },
      {
        path: "/api/v1/domain-intel",
        method: "GET",
        price_usdc: "0.02",
        description: "Domain DNS, TLS/SSL certificate validity, and RDAP registration age check."
      },
      {
        path: "/api/v1/verify-compute",
        method: "POST",
        price_usdc: "0.15",
        description: "Deterministic canonical JSON SHA-256/SHA-512 attestation and structural audit."
      }
    ]
  });
});

app.use(paymentMiddleware(routes, resourceServer));

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value !== null && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc, k) => {
        acc[k] = canonicalize(value[k]);
        return acc;
      }, {});
  }
  return value;
}

function inspectPayload(value, depth = 1) {
  if (value === null || value === undefined || value === "") {
    return { keys: 0, maxDepth: depth, nullOrEmptyCount: 1 };
  }
  if (Array.isArray(value)) {
    let keys = 0;
    let maxDepth = depth;
    let nullOrEmptyCount = value.length === 0 ? 1 : 0;
    for (const item of value) {
      const sub = inspectPayload(item, depth + 1);
      keys += sub.keys;
      maxDepth = Math.max(maxDepth, sub.maxDepth);
      nullOrEmptyCount += sub.nullOrEmptyCount;
    }
    return { keys, maxDepth, nullOrEmptyCount };
  }
  if (typeof value === "object") {
    const objKeys = Object.keys(value);
    let keys = objKeys.length;
    let maxDepth = depth;
    let nullOrEmptyCount = objKeys.length === 0 ? 1 : 0;
    for (const k of objKeys) {
      const sub = inspectPayload(value[k], depth + 1);
      keys += sub.keys;
      maxDepth = Math.max(maxDepth, sub.maxDepth);
      nullOrEmptyCount += sub.nullOrEmptyCount;
    }
    return { keys, maxDepth, nullOrEmptyCount };
  }
  return { keys: 0, maxDepth: depth, nullOrEmptyCount: 0 };
}

function checkTlsCert(hostname) {
  return new Promise((resolve) => {
    const socket = tls.connect(
      { host: hostname, port: 443, servername: hostname, rejectUnauthorized: false, timeout: 5000 },
      () => {
        try {
          const cert = socket.getPeerCertificate();
          const authorized = socket.authorized;
          socket.end();
          if (!cert || !cert.valid_to) {
            return resolve({ available: false });
          }
          const validTo = new Date(cert.valid_to);
          const daysRemaining = Math.floor((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          resolve({
            available: true,
            valid: authorized && daysRemaining > 0,
            issuer: cert.issuer?.O || cert.issuer?.CN || null,
            valid_from: cert.valid_from,
            valid_to: cert.valid_to,
            days_remaining: daysRemaining
          });
        } catch {
          socket.destroy();
          resolve({ available: false });
        }
      }
    );
    socket.on("error", () => resolve({ available: false }));
    socket.on("timeout", () => {
      socket.destroy();
      resolve({ available: false });
    });
  });
}

app.get("/api/v1/extract", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: "Missing 'url' query parameter." });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: "Only http and https URLs are supported." });
    }
  } catch {
    return res.status(400).json({ error: "Invalid URL format." });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(parsedUrl.toString(), {
      headers: { "User-Agent": "UEandD-AgentReader/2.2" },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(502).json({ error: `Upstream fetch failed with status ${response.status}` });
    }

    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : null;

    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
    const metaDescription = descMatch ? descMatch[1].trim() : null;

    const cleanText = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 6000);

    const wordCount = cleanText ? cleanText.split(" ").length : 0;

    res.json({
      tier: "bulk_extraction",
      price_paid: "0.01 USDC",
      source_url: parsedUrl.toString(),
      title,
      meta_description: metaDescription,
      word_count: wordCount,
      extracted_text: cleanText
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/v1/niche-lookup", async (req, res) => {
  const queryKey = (req.query.key || "").trim();
  if (!queryKey) {
    return res.status(400).json({ error: "Missing 'key' query parameter (token symbol or 0x address)." });
  }

  try {
    const dexUrl = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(queryKey)}`;
    const dexRes = await fetch(dexUrl, {
      headers: { "User-Agent": "UEandD-IntelEngine/2.2" }
    });

    if (!dexRes.ok) {
      return res.status(502).json({ error: `Upstream market feed returned ${dexRes.status}` });
    }

    const dexData = await dexRes.json();
    const pairs = Array.isArray(dexData.pairs) ? dexData.pairs : [];

    if (pairs.length === 0) {
      return res.status(404).json({
        tier: "niche_data_lookup",
        query: queryKey,
        error: "No active on-chain liquidity pairs found for query."
      });
    }

    const sorted = pairs.sort((a, b) => {
      const aBase = a.chainId === "base" ? 1 : 0;
      const bBase = b.chainId === "base" ? 1 : 0;
      if (aBase !== bBase) return bBase - aBase;
      return (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0);
    });

    const top = sorted[0];
    const liquidityUsd = Number(top.liquidity?.usd || 0);
    const volume24hUsd = Number(top.volume?.h24 || 0);
    const buys24h = Number(top.txns?.h24?.buys || 0);
    const sells24h = Number(top.txns?.h24?.sells || 0);
    const buySellRatio = sells24h > 0 ? Number((buys24h / sells24h).toFixed(2)) : buys24h;
    const priceChange24h = Number(top.priceChange?.h24 || 0);

    let score = 20;
    if (liquidityUsd >= 1000000) score += 40;
    else if (liquidityUsd >= 100000) score += 25;
    else if (liquidityUsd >= 10000) score += 10;

    if (volume24hUsd >= 250000) score += 25;
    else if (volume24hUsd >= 25000) score += 15;

    if (buys24h + sells24h >= 100) score += 15;
    score = Math.min(100, score);

    res.json({
      tier: "niche_data_lookup",
      price_paid: "0.05 USDC",
      query: queryKey,
      timestamp: new Date().toISOString(),
      verified_data: {
        chain: top.chainId,
        dex: top.dexId,
        pair_address: top.pairAddress,
        base_token: {
          symbol: top.baseToken?.symbol,
          name: top.baseToken?.name,
          address: top.baseToken?.address
        },
        price_usd: top.priceUsd,
        price_change_24h_pct: priceChange24h,
        liquidity_usd: liquidityUsd,
        volume_24h_usd: volume24hUsd,
        txns_24h: { buys: buys24h, sells: sells24h, buy_sell_ratio: buySellRatio },
        matched_pairs_count: pairs.length,
        liquidity_health_score: score,
        low_liquidity_warning: liquidityUsd < 25000
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/v1/token-audit", async (req, res) => {
  const chainId = (req.query.chain_id || "8453").toString().trim();
  const rawAddress = (req.query.address || "").toString().trim().toLowerCase();

  if (!/^0x[a-f0-9]{40}$/.test(rawAddress)) {
    return res.status(400).json({ error: "Invalid or missing 'address' (must be a 42-char 0x EVM contract address)." });
  }

  try {
    const goPlusUrl = `https://api.gopluslabs.io/api/v1/token_security/${encodeURIComponent(chainId)}?contract_addresses=${rawAddress}`;
    const gpRes = await fetch(goPlusUrl, {
      headers: { "User-Agent": "UEandD-SecurityOracle/2.2" }
    });

    if (!gpRes.ok) {
      return res.status(502).json({ error: `Upstream security provider returned ${gpRes.status}` });
    }

    const gpData = await gpRes.json();
    const info = gpData?.result?.[rawAddress];

    if (!info) {
      return res.status(404).json({
        tier: "token_security_audit",
        chain_id: chainId,
        address: rawAddress,
        error: "No contract security record indexed for this address on the specified chain."
      });
    }

    const isHoneypot = info.is_honeypot === "1";
    const buyTaxPct = Number((Number(info.buy_tax || 0) * 100).toFixed(2));
    const sellTaxPct = Number((Number(info.sell_tax || 0) * 100).toFixed(2));
    const isOpenSource = info.is_open_source === "1";
    const isProxy = info.is_proxy === "1";
    const isMintable = info.is_mintable === "1";
    const cannotSellAll = info.cannot_sell_all === "1";
    const hiddenOwner = info.hidden_owner === "1";

    const redFlags = [];
    if (isHoneypot) redFlags.push("HONEYPOT_DETECTED");
    if (cannotSellAll) redFlags.push("CANNOT_SELL_ALL");
    if (hiddenOwner) redFlags.push("HIDDEN_OWNER");
    if (!isOpenSource) redFlags.push("UNVERIFIED_SOURCE");
    if (buyTaxPct > 10) redFlags.push("HIGH_BUY_TAX");
    if (sellTaxPct > 10) redFlags.push("HIGH_SELL_TAX");

    const safeToTradeBaseline =
      !isHoneypot && !cannotSellAll && !hiddenOwner && isOpenSource && buyTaxPct <= 10 && sellTaxPct <= 10;

    res.json({
      tier: "token_security_audit",
      price_paid: "0.05 USDC",
      timestamp: new Date().toISOString(),
      chain_id: chainId,
      address: rawAddress,
      security_report: {
        token_name: info.token_name || null,
        token_symbol: info.token_symbol || null,
        holder_count: Number(info.holder_count || 0),
        is_honeypot: isHoneypot,
        buy_tax_pct: buyTaxPct,
        sell_tax_pct: sellTaxPct,
        is_open_source: isOpenSource,
        is_proxy: isProxy,
        is_mintable: isMintable,
        cannot_sell_all: cannotSellAll,
        hidden_owner: hiddenOwner,
        red_flags: redFlags,
        safe_to_trade_baseline: safeToTradeBaseline
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/v1/tvl-scan", async (req, res) => {
  const targetChain = (req.query.chain || "Base").toString().trim();
  const targetCategory = (req.query.category || "").toString().trim();
  const limit = Math.min(15, Math.max(1, Number(req.query.limit) || 5));

  try {
    const llamaRes = await fetch("https://api.llama.fi/protocols", {
      headers: { "User-Agent": "UEandD-DeFiScreener/2.2" }
    });

    if (!llamaRes.ok) {
      return res.status(502).json({ error: `Upstream TVL feed returned ${llamaRes.status}` });
    }

    const protocols = await llamaRes.json();
    if (!Array.isArray(protocols)) {
      return res.status(502).json({ error: "Unexpected upstream TVL response structure." });
    }

    const chainLower = targetChain.toLowerCase();
    const catLower = targetCategory.toLowerCase();

    const matched = protocols
      .map((p) => {
        const chainTvls = p.chainTvls || {};
        const matchedChainKey = Object.keys(chainTvls).find((k) => k.toLowerCase() === chainLower);
        const chainTvl = matchedChainKey ? Number(chainTvls[matchedChainKey] || 0) : 0;
        return { raw: p, chainTvl };
      })
      .filter(({ raw, chainTvl }) => {
        if (chainTvl <= 0) return false;
        if (catLower && (raw.category || "").toLowerCase() !== catLower) return false;
        return true;
      })
      .sort((a, b) => b.chainTvl - a.chainTvl)
      .slice(0, limit)
      .map(({ raw, chainTvl }) => ({
        name: raw.name,
        slug: raw.slug,
        symbol: raw.symbol || null,
        category: raw.category || null,
        chain_tvl_usd: Math.round(chainTvl),
        total_tvl_usd: Math.round(Number(raw.tvl || 0)),
        change_1d_pct: raw.change_1d !== null && raw.change_1d !== undefined ? Number(Number(raw.change_1d).toFixed(2)) : null,
        change_7d_pct: raw.change_7d !== null && raw.change_7d !== undefined ? Number(Number(raw.change_7d).toFixed(2)) : null
      }));

    res.json({
      tier: "defi_tvl_screener",
      price_paid: "0.03 USDC",
      timestamp: new Date().toISOString(),
      filter: {
        chain: targetChain,
        category: targetCategory || "all"
      },
      matched_count: matched.length,
      top_protocols: matched
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/v1/domain-intel", async (req, res) => {
  const rawDomain = (req.query.domain || "").toString().trim().toLowerCase();
  const cleanedDomain = rawDomain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");

  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(cleanedDomain)) {
    return res.status(400).json({ error: "Invalid or missing 'domain' query parameter." });
  }

  try {
    const [aRecords, mxRecords, nsRecords, txtRecords, sslInfo, rdapData] = await Promise.all([
      dns.resolve4(cleanedDomain).catch(() => []),
      dns.resolveMx(cleanedDomain).catch(() => []),
      dns.resolveNs(cleanedDomain).catch(() => []),
      dns.resolveTxt(cleanedDomain).catch(() => []),
      checkTlsCert(cleanedDomain),
      fetch(`https://rdap.org/domain/${encodeURIComponent(cleanedDomain)}`, {
        headers: { "User-Agent": "UEandD-DomainIntel/2.2" }
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    ]);

    const flatTxt = txtRecords.map((chunks) => chunks.join(""));
    const hasSpf = flatTxt.some((t) => t.toLowerCase().startsWith("v=spf1"));

    let registeredDate = null;
    let expirationDate = null;
    let domainAgeDays = null;

    if (rdapData && Array.isArray(rdapData.events)) {
      const regEvent = rdapData.events.find((e) => e.eventAction === "registration");
      const expEvent = rdapData.events.find((e) => e.eventAction === "expiration");
      if (regEvent?.eventDate) {
        registeredDate = regEvent.eventDate;
        domainAgeDays = Math.floor((Date.now() - new Date(regEvent.eventDate).getTime()) / (1000 * 60 * 60 * 24));
      }
      if (expEvent?.eventDate) {
        expirationDate = expEvent.eventDate;
      }
    }

    res.json({
      tier: "domain_intel_audit",
      price_paid: "0.02 USDC",
      timestamp: new Date().toISOString(),
      domain: cleanedDomain,
      dns: {
        resolves: aRecords.length > 0,
        a_records: aRecords,
        nameservers: nsRecords,
        mx_records: mxRecords.map((m) => m.exchange),
        has_mx: mxRecords.length > 0,
        has_spf: hasSpf
      },
      ssl: sslInfo,
      registration: {
        registered_at: registeredDate,
        expires_at: expirationDate,
        domain_age_days: domainAgeDays,
        newly_registered_warning: domainAgeDays !== null && domainAgeDays < 30
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/v1/verify-compute", (req, res) => {
  const payloadData = req.body?.data;
  const expectedSha256 = req.body?.expected_sha256;

  if (payloadData === undefined) {
    return res.status(400).json({ error: "Missing JSON body field 'data'." });
  }

  const canonicalObj = canonicalize(payloadData);
  const canonicalJson = JSON.stringify(canonicalObj);
  const sha256 = crypto.createHash("sha256").update(canonicalJson, "utf8").digest("hex");
  const sha512 = crypto.createHash("sha512").update(canonicalJson, "utf8").digest("hex");

  const stats = inspectPayload(payloadData);
  const hashMatch =
    typeof expectedSha256 === "string" && expectedSha256.trim().length > 0
      ? sha256.toLowerCase() === expectedSha256.trim().toLowerCase()
      : null;

  const anomalyDetected = stats.nullOrEmptyCount > 0 || (hashMatch === false);

  res.json({
    tier: "heavy_compute_verification",
    price_paid: "0.15 USDC",
    timestamp: new Date().toISOString(),
    verification_result: {
      canonical_sha256: sha256,
      canonical_sha512: sha512,
      expected_hash_provided: hashMatch !== null,
      hash_match: hashMatch,
      processed_bytes: Buffer.byteLength(canonicalJson, "utf8"),
      key_count: stats.keys,
      max_nesting_depth: stats.maxDepth,
      null_or_empty_fields: stats.nullOrEmptyCount,
      anomaly_detected: anomalyDetected
    }
  });
});

app.listen(PORT, () => {
  console.log(`UE&D Express x402 Storefront v2.2 live on port ${PORT}`);
});

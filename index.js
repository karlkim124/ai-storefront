import express from "express";
import crypto from "crypto";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { declareDiscoveryExtension } from "@x402/extensions/bazaar";

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;
const PAY_TO = "0x65aF738Cdc6B21E9dAFA5F55223e63Aaf22d7F21";
const NETWORK = "eip155:8453";
const FACILITATOR_URL = (process.env.FACILITATOR_URL || "https://facilitator.xpay.sh").trim().replace(/\]+$/, "");

const facilitatorClient = new HTTPFacilitatorClient({
  url: FACILITATOR_URL
});

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
        input: { url: "https://example.com" },
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
            source_url: "https://example.com",
            title: "Example Domain",
            word_count: 28,
            extracted_text: "Example Domain This domain is for use in illustrative examples..."
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

app.use(paymentMiddleware(routes, resourceServer));

// Helper: Canonicalize JSON recursively so key order is deterministic
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

// Helper: Inspect JSON structure for depth, key count, and null/empty anomalies
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

// ==========================================
// ROOT STATUS ROUTE (FREE / UNGATED)
// ==========================================
app.get("/", (req, res) => {
  res.json({
    service: "UE&D Express Autonomous Intelligence Storefront",
    status: "online",
    protocol: "x402",
    network: NETWORK,
    manifest: "https://ueandd-express.onrender.com/.well-known/agent-card.json"
  });
});

// ==========================================
// TIER 1: Clean URL Extraction ($0.01)
// ==========================================
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
      headers: { "User-Agent": "UEandD-AgentReader/2.1" },
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

// ==========================================
// TIER 2: Live DEX & Token Intelligence ($0.05)
// ==========================================
app.get("/api/v1/niche-lookup", async (req, res) => {
  const queryKey = (req.query.key || "").trim();
  if (!queryKey) {
    return res.status(400).json({ error: "Missing 'key' query parameter (token symbol or 0x address)." });
  }

  try {
    const dexUrl = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(queryKey)}`;
    const dexRes = await fetch(dexUrl, {
      headers: { "User-Agent": "UEandD-IntelEngine/2.1" }
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

    // Prefer Base pairs first if available, then sort by highest USD liquidity
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

    // Deterministic liquidity health score (0-100)
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

// ==========================================
// TIER 3: Cryptographic Compute Verification ($0.15)
// ==========================================
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

// ==========================================
// AGENT DISCOVERY MANIFEST (FREE / UNGATED)
// ==========================================
app.get("/.well-known/agent-card.json", (req, res) => {
  res.json({
    name: "UE&D Express Autonomous Intelligence Storefront",
    description: "Production x402 micro-services settling in USDC on Base Mainnet.",
    protocol: "x402",
    version: "2.1",
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
        path: "/api/v1/verify-compute",
        method: "POST",
        price_usdc: "0.15",
        description: "Deterministic canonical JSON SHA-256/SHA-512 attestation and structural audit."
      }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`UE&D Express x402 Storefront v2.1 live on port ${PORT}`);
});

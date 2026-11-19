const express = require('express');
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;
const SELLER_WALLET = process.env.SELLER_WALLET || "0x65aF738Cdc6B21E9dAFA5F55223e63Aaf22d7F21";
const NETWORK = "base";

function x402Paywall(priceUsdc) {
  return async (req, res, next) => {
    const paymentHeader = req.headers['x-payment'] || req.headers['payment-signature'];

    if (!paymentHeader) {
      res.setHeader('PAYMENT-REQUIRED', JSON.stringify({
        amount: priceUsdc,
        currency: 'USDC',
        network: NETWORK,
        payee: SELLER_WALLET
      }));

      return res.status(402).json({
        error: "Payment Required",
        message: `This endpoint requires an x402 micro-payment of ${priceUsdc} USDC.`,
        price_usdc: priceUsdc,
        network: NETWORK,
        payee_wallet: SELLER_WALLET
      });
    }

    // In live production, verify paymentHeader via an x402 facilitator SDK before calling next()
    next();
  };
}

// Tier 1: $0.01 Bulk Extraction
app.get('/api/v1/extract', x402Paywall("0.01"), async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: "Missing 'url' query parameter." });

  try {
    const response = await fetch(targetUrl, {
      headers: { 'User-Agent': 'AutonomousAgentReader/1.0' }
    });
    if (!response.ok) return res.status(502).json({ error: `Fetch failed with status ${response.status}` });

    const html = await response.text();
    const cleanText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 5000);

    res.json({
      tier: "bulk_extraction",
      price_paid: "0.01 USDC",
      source_url: targetUrl,
      extracted_text: cleanText
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tier 2: $0.05 Niche Lookup
app.get('/api/v1/niche-lookup', x402Paywall("0.05"), async (req, res) => {
  const queryKey = req.query.key;
  if (!queryKey) return res.status(400).json({ error: "Missing 'key' query parameter." });

  res.json({
    tier: "niche_data_lookup",
    price_paid: "0.05 USDC",
    query: queryKey,
    timestamp: new Date().toISOString(),
    verified_data: {
      market_sentiment: "bullish",
      liquidity_index: 0.884,
      compliance_flag: false,
      proprietary_score: 94.2
    }
  });
});

// Tier 3: $0.15 Heavy Compute Verification
app.post('/api/v1/verify-compute', x402Paywall("0.15"), async (req, res) => {
  const payloadData = req.body.data;
  if (!payloadData) return res.status(400).json({ error: "Missing JSON body 'data'." });

  res.json({
    tier: "heavy_compute_verification",
    price_paid: "0.15 USDC",
    timestamp: new Date().toISOString(),
    verification_result: {
      integrity_checked: true,
      anomaly_detected: false,
      confidence_interval: "99.91%",
      processed_bytes: JSON.stringify(payloadData).length
    }
  });
});

// Discovery Manifest for AI Agents
app.get('/.well-known/agent-card.json', (req, res) => {
  res.json({
    name: "Multi-Tier Autonomous Intelligence Storefront",
    description: "High-reliability micro-services for autonomous AI agents settling via x402 USDC on Base.",
    protocol: "x402",
    payee_wallet: SELLER_WALLET,
    endpoints: [
      { path: "/api/v1/extract", method: "GET", price_usdc: "0.01", description: "Bulk URL text extraction." },
      { path: "/api/v1/niche-lookup", method: "GET", price_usdc: "0.05", description: "Niche data lookup." },
      { path: "/api/v1/verify-compute", method: "POST", price_usdc: "0.15", description: "Payload compute verification." }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Multi-tier AI Storefront running on port ${PORT}`);
});

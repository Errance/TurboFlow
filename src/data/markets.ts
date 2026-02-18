import type { Market } from '../types'

export const markets: Market[] = [
  {
    id: 'mkt-btc-100k',
    title: 'Will BTC exceed $100K by March 2026?',
    description:
      'Resolves YES if Bitcoin trades at or above $100,000 on any major exchange (Binance, Coinbase, Kraken) before March 31, 2026 23:59 UTC.',
    category: 'Crypto',
    resolutionSource: 'Spot price from CoinGecko/CoinMarketCap aggregate.',
    expiresAt: '2026-03-31T23:59:59Z',
    status: 'OPEN',
    lastPrice: 65,
    volume: 125000,
    rules: `This market resolves YES if Bitcoin (BTC) trades at or above $100,000 USD on any of the following exchanges: Binance, Coinbase, or Kraken, at any point before the expiration date.

Price verification: The resolution price is the CoinGecko/CoinMarketCap aggregate spot price at the time of the crossing event. A single tick above $100,000 on one qualifying exchange is sufficient.

Edge cases:
- If any qualifying exchange is unavailable, the remaining exchanges are used.
- Flash wicks that are subsequently rolled back by the exchange do not count.
- The market expires at 2026-03-31T23:59:59 UTC. If BTC has not reached $100K by then, it resolves NO.`,
  },
  {
    id: 'mkt-fed-rates',
    title: 'Will the Fed cut rates in Q1 2026?',
    description:
      'Resolves YES if the Federal Reserve reduces the federal funds target rate at any FOMC meeting in January, February, or March 2026.',
    category: 'Economics',
    resolutionSource: 'Official FOMC statement and Fed press release.',
    expiresAt: '2026-03-31T23:59:59Z',
    status: 'OPEN',
    lastPrice: 42,
    volume: 89000,
    rules: `This market resolves YES if the Federal Reserve reduces the federal funds target rate by at least 25 basis points at any scheduled FOMC meeting in Q1 2026 (January 28-29, March 18-19).

Resolution source: The official FOMC post-meeting statement published on federalreserve.gov.

Edge cases:
- An emergency (unscheduled) rate cut also qualifies.
- A rate hold or increase resolves NO at expiration.
- If the FOMC statement is delayed, resolution waits for the official release.`,
  },
  {
    id: 'mkt-eth-merge',
    title: 'Will ETH 2.0 merge complete by Feb 2026?',
    description:
      'Resolves YES if the Ethereum merge (proof-of-stake transition) is finalized on mainnet with finality achieved before February 28, 2026.',
    category: 'Crypto',
    resolutionSource: 'Ethereum mainnet block explorer and official Ethereum Foundation announcement.',
    expiresAt: '2026-02-28T23:59:59Z',
    status: 'CLOSED',
    lastPrice: 78,
    volume: 210000,
    rules: `This market resolves YES if the Ethereum proof-of-stake merge is finalized on mainnet before the expiration date. Finality means at least 2 epochs have been justified and finalized post-merge.

Resolution source: Etherscan.io block explorer confirmation and official Ethereum Foundation blog announcement.`,
  },
  {
    id: 'mkt-us-gdp',
    title: 'Will US GDP growth exceed 3% in 2025?',
    description:
      'Resolves YES if real US GDP growth (annual rate) for full-year 2025 exceeds 3% as reported in the BEA third estimate.',
    category: 'Economics',
    resolutionSource: 'Bureau of Economic Analysis (BEA) advance/third estimate release.',
    expiresAt: '2026-02-28T23:59:59Z',
    status: 'RESOLVING',
    lastPrice: 55,
    volume: 67000,
  },
  {
    id: 'mkt-apple-ar',
    title: 'Will Apple release AR glasses in 2025?',
    description:
      'Resolves YES if Apple officially releases and ships a consumer AR/VR headset or glasses product to the public in calendar year 2025.',
    category: 'Tech',
    resolutionSource: 'Apple press release and official product availability.',
    expiresAt: '2025-12-31T23:59:59Z',
    status: 'SETTLED',
    lastPrice: 12,
    volume: 340000,
    settlementResult: 'NO',
    rules: `Resolves YES if Apple officially announces and makes available for purchase a consumer AR or VR glasses/headset product during calendar year 2025. Developer kits do not count — must be a consumer-facing product.`,
    settlementDetails: {
      source: 'Apple Newsroom (newsroom.apple.com)',
      settledAt: '2026-01-02T12:00:00Z',
      evidence: 'Apple did not announce or release any new AR glasses product in 2025. The Vision Pro (released Feb 2024) was the only AR/VR product available. No new AR glasses were announced at WWDC 2025 or any other Apple event during the calendar year.',
    },
  },
  {
    id: 'mkt-tsla-400',
    title: 'Will Tesla stock reach $400 by end of 2025?',
    description:
      'Resolves YES if Tesla (TSLA) stock trades at or above $400 per share on any US exchange during regular trading hours before December 31, 2025.',
    category: 'Finance',
    resolutionSource: 'Closing price from Yahoo Finance / Nasdaq.',
    expiresAt: '2025-12-31T23:59:59Z',
    status: 'SETTLED',
    lastPrice: 88,
    volume: 156000,
    settlementResult: 'YES',
    rules: `Resolves YES if Tesla (TSLA) stock trades at or above $400.00 per share during regular US market trading hours (9:30 AM - 4:00 PM ET) on any trading day before December 31, 2025. Pre-market and after-hours trades do not count.`,
    settlementDetails: {
      source: 'Yahoo Finance / Nasdaq official closing prices',
      settledAt: '2026-01-02T18:00:00Z',
      evidence: 'TSLA reached $412.35 intraday on December 18, 2025, during regular trading hours on Nasdaq. The closing price that day was $408.72, confirming the $400 threshold was breached.',
    },
  },
]

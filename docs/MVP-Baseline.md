# TurboFlow MVP Baseline

> **Branch**: `mvp` (forked from main a595c1a)
> **Last updated**: 2026-02-23
> **Purpose**: Single source of truth for MVP capabilities, architecture, and boundaries

---

## Architecture

- **Tech stack**: React + TypeScript + Zustand + Tailwind CSS + Vite
- **Information model**: Event → Contracts → Trade (event-centric)
- **Unit system**: USDC decimal throughout (0.01–0.99 for prices)
- **Primary key**: `contractId` is the canonical identifier for all trades, positions, and orders
- **Execution pipeline**: All trade sources (TradePanel, QuickOrder, LimitOrder, Parlay) flow through `portfolioStore.executeTrade()`

## Current Capabilities

| Feature | Status | Entry Point |
|---------|--------|-------------|
| Explore event list with category filtering | ✅ | `EventsPage` |
| Event detail with contract cards + trade panel | ✅ | `EventDetailPage` |
| Contract detail with CLOB orderbook + charts | ✅ | `ContractDetailPage` |
| Quick (market) order with scenario simulation | ✅ | `QuickOrderPanel` |
| Limit order with price/shares/total linking | ✅ | `LimitOrderPanel` |
| Live instant markets (5-min price predictions) | ✅ | `InstantMarketCard` |
| Sports betting UI (moneyline/spread/total) | ✅ | `SportsGamePage` |
| Parlay (multi-leg combo bets) | ✅ | `ParlaySlip` + `ParlayAddPopover` |
| Portfolio (positions, orders, trades, parlays, activity) | ✅ | `PortfolioPage` |
| Leaderboard rankings | ✅ | `LeaderboardPage` |
| Abnormal state handling (dispute, refund, appeal) | ✅ | `StatusBanner` + panels |
| Price chart (lightweight-charts) | ✅ | `PriceChart` |
| Depth chart (SVG) | ✅ | `DepthChart` |
| URL ↔ store category sync | ✅ | `EventsPage` `?category=` |

## Explicitly Not in MVP

| Feature | Reason |
|---------|--------|
| Strategy Basket (thesis, trench, copy/reweight) | Replaced by Parlay |
| Forecast opinion cards | Out of scope |
| Share system (social sharing, QR codes) | Out of scope (ShareButton retained but unmounted) |
| Follow/Following system | Out of scope |
| Hedge suggestions | Out of scope |

## Data Flow

```
User action (YES/NO click)
  → TradePanel.executeTrade() / QuickOrderPanel / LimitOrderPanel
    → orderStore (order lifecycle + scenario simulation)
      → on Fill → portfolioStore.executeTrade()
        → addTrade() + addPosition()
          → Portfolio page reflects the trade

Parlay:
  → ParlaySlip → parlayStore.placeParlay()
    → per-leg → portfolioStore.executeTrade()
```

## Key Stores

| Store | Purpose |
|-------|---------|
| `eventStore` | Events, category selection, trade panel state |
| `orderStore` | Order CRUD, quick/limit order placement, scenario steps |
| `portfolioStore` | Positions, trades, unified `executeTrade` entry point |
| `parlayStore` | Parlay slip management, validation, placement |
| `orderbookStore` | Orderbook snapshots + delta streaming |
| `toastStore` | Global toast notifications |

## Fixture Data

All mock data uses USDC decimal prices (e.g., `0.65` not `65`):
- `src/data/orders.ts` — 7 sample orders
- `src/data/trades.ts` — 8 sample trades
- `src/data/positions.ts` — 5 sample positions
- `src/data/scenarios.ts` — 3 quick order scenarios
- `src/data/orderbooks.ts` — 2 market orderbook snapshots + deltas
- `src/data/events.ts` — Full event catalog
- `src/data/priceHistory.ts` — Generated price history per market

## Demo Path

1. **Explore** → Browse categories → Click event card
2. **Event Detail** → Review contracts → Quick Buy YES/NO
3. **Contract Detail** → Orderbook → Click price → Limit order
4. **Sports** → Game page → Moneyline bet
5. **Live** → Instant market → Quick prediction
6. **Parlay** → Add 2+ legs → Place combo bet
7. **Portfolio** → View positions, orders, trade history, parlays

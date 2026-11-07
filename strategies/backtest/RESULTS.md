# Backtest results (Python port of the Pine strategy)

The data is Yahoo 5m continuous futures, Aug 28 – Nov 6 2026 (about 10 weeks). Run `python3 fetch_data.py`, then `python3 sensitivity.py` or `python3 grid.py`.

Fills are conservative:
- If TP and SL are both inside one bar, the SL counts first.
- Stops and market orders lose 1 tick of slippage.
- Commission is $2 per contract per side.

## What was tested

- **Settings search:** 900 random setting combos on NQ, ES, YM, GC and SI. Settings were picked on the first 5 weeks only, then checked on the last 5 weeks.
- **The average combo loses money.** Most setups in this family have no edge.
- **The IFVG entry model, the London/PM windows, market entries and swing-pivot liquidity** all lost money on average. The old v2.1 and v2.2 defaults blew the $1,000 drawdown on NQ.
- **One setup was profitable on all 5 markets in both halves:**
  - FVG model, NY AM only (9:30–11:30)
  - Asia, London and prior-day H/L as liquidity, sweep must close back inside
  - Limit entry at the FVG edge, stop 4 ticks past the zone
  - Min 2R, $500 TP, $250 max risk
- **Nudging each setting** (expiry, R:R, TP, risk, buffer, FVG size, limit expiry) mostly kept it profitable. These became the v3 defaults.

## v3 defaults, 1 contract max per market, full 10 weeks

| Market | Trades | Net | PF | Max DD |
|--------|-------:|----:|---:|-------:|
| NQ | 10 | +$645 | 1.77 | $639 |
| ES | 15 | +$2,278 | 2.91 | $408 |
| YM | 12 | +$862 | 2.19 | $371 |
| GC | 12 | +$1,232 | 1.99 | $512 |

**Running NQ + ES together, 1 contract each:** 25 trades, +$2,922, PF 2.4, max DD $709. There was never more than 1 contract open at a time.

## Caveats

- **The sample is small.** It's 10–15 trades per market, so one lucky week moves the numbers a lot.
- **It trades rarely.** That's about 1 trade a week per market. It is not a $300–500/day system.
- **Only 10 weeks of data were available.** Forward-test on sim or an eval before using it on a funded account.

## TradingView cross-check (v3 defaults, 5m, Oct 12 – Nov 6 2026)

| Market | TradingView | Python port, same dates |
|--------|-------------|-------------------------|
| ES | 7 trades, 4 wins, +$1,572, PF 4.8, DD $285 | 7 trades, 5 wins, +$2,197 |
| NQ | 3 trades, 0 wins, -$417 | 3 trades, 1 win, +$313 |

- **ES lines up** between the two engines.
- **NQ differs by one trade** (a win in Python, a loss in TradingView). The data feeds differ slightly: Yahoo vs TradingView's back-adjusted NQ1!.
- **Recommendation: run ES only, 1 contract.**

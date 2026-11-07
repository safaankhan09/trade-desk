# Sweep + FVG / IFVG Auto Trader (TradingView)

`sweep_fvg_autotrader.pine` is a Pine Script v6 **strategy**. You can backtest it on TradingView and send its alerts to a broker bridge to auto-execute.

## What it does (v2, prop-firm edition)

1. **Liquidity:** Asia high/low (20:00–00:00 NY), London high/low (02:00–05:00 NY), NY AM high/low (09:30–11:30, for PM trades), the prior day high/low, and swing pivots (strength 10). Levels are drawn as dotted lines (orange for highs, aqua for lows).
2. **Sweep:** a candle wicks through one of those levels and closes back inside it. The label says which level was taken, for example "Asia L swept".
   - Lows taken: the bot looks for a **long**.
   - Highs taken: the bot looks for a **short**.
3. **Trigger** (within 20 bars of the sweep):
   - **IFVG model:** price closes through an opposing FVG, flipping it into an inverse FVG.
   - **FVG model:** a fresh FVG forms in the trade direction after the sweep.
   - **Both:** whichever happens first.
4. **Entry:** only inside the trading windows: London 03:00–05:00, NY AM 09:30–11:30 and NY PM 13:30–15:45 (NY time). Each window can be switched on or off. Entries are either as a limit order on the retest (edge or CE / 50%) or as a market order at the trigger candle's close.
5. **Size, stop and target:**
   - **Stop (default):** just past the far edge of the FVG/IFVG you entered on, plus a buffer. This is tight enough for minis. "Beyond sweep" puts it past the sweep wick instead, which is wider and usually needs micros.
   - **Risk-based sizing (default):** the bot takes as many contracts as fit inside "Max risk per trade" ($250) for that stop, up to "Max contracts" (2). If even 1 contract doesn't fit, it skips the trade.
   - **TP:** a fixed dollar amount ($500), split across however many contracts it took.
   - **Min R:R filter:** skips trades below 1.5R by default.
6. **Prop firm guard:**
   - **Trailing drawdown:** tracks an end-of-day trailing drawdown ($1,000, with the floor locking at start balance + $100). If the backtest would have blown the account, it stops trading and the panel shows the date.
   - **Daily loss stop:** $500 by default.
   - **Daily goal:** stops for the day once you're up $500.
   - **Max trades per day:** 4.
   - **Flatten** at 15:55 NY.

### Lucid 25K setup

| Trading | Max contracts | Risk per trade |
|---------|---------------|----------------|
| Minis (NQ/ES) | 2 | $200–300 |
| Micros (MNQ/MES) | 20 | $200–300 |

Micros size more precisely. With 20 MNQ, the bot can take 7 contracts if that's what fits the stop, instead of being stuck at 1 or 2 minis.

The drawdown numbers are inputs, so check them against your plan's rules on Lucid's site.

In **Properties**, set commission to what you actually pay per contract per side.

### Info panel

- **Last plan:** contracts, stop and TP in points, and R:R for the most recent order.
- **Room to DD floor:** how far equity is above the trailing drawdown floor.
- **Skip counters:** setups skipped for risk/R:R, skipped because you were busy or done for the day, and limit orders that never filled.

## Load it

1. In TradingView, open the **Pine Editor**, paste in the file, click **Save**, then **Add to chart**.
2. Use a futures chart such as `NQ1!` or `ES1!` on a 1m–5m timeframe.
3. **Important:** click the gear on the strategy, open **Properties**, and set **Margin for long positions** and **Margin for short positions** to **0%**. If you leave them at 100%, TradingView needs the full contract value in cash (1 NQ is about $540k), so it rejects every order on big contracts like NQ, ES, GC, SI and BTC.
4. The info panel (top right) shows how many signals fired and why any were skipped (stop too wide, already in a trade or day limit hit, limit order never filled). Use it to tune the settings.
5. Check the **Strategy Tester** tab for results. Adjust inputs in the settings (gear icon).

## Auto-execute (optional)

TradingView doesn't place futures orders itself. You need a webhook bridge such as TradersPost, PickMyTrade or CrossTrade, connected to Tradovate, NinjaTrader or Rithmic.

1. Create an alert on the strategy and set **Condition** to this strategy.
2. Set **Message** to exactly: `{{strategy.order.alert_message}}`
3. Paste your bridge's webhook URL into the **Webhook URL** field.

**Alert style input:**
- **Bracket** (default): the entry alert carries the TP and SL prices, so the broker holds the bracket. TP/SL exit alerts are muted so you don't double-close. The end-of-window flatten still sends an exit.
- **Signals:** every entry and exit fires its own alert.

The JSON uses common TradersPost-style fields (`ticker`, `action`, `quantity`, `takeProfit.limitPrice`, `stopLoss.stopPrice`). Check it against your bridge's docs and edit `f_entryMsg` if their format differs.

## Heads up

- **Sim first.** Run it on a sim/demo account for a while before using real money.
- **Limit fills are optimistic in backtests.** The backtester assumes a touch fills your limit order, which doesn't always happen live.
- **Results depend on settings.** The swing strength, timeframe, and window change the results a lot, so tune them per market.
- **Not financial advice.** This is a tool, not a promise of profit.

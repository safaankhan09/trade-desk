# Sweep + FVG / IFVG Auto Trader (TradingView)

`sweep_fvg_autotrader.pine` is a Pine Script v6 **strategy**. You can backtest it on TradingView and send its alerts to a broker bridge to auto-execute.

## What it does

1. **Liquidity:** swing highs and lows (pivot strength 5 by default) are treated as resting liquidity.
2. **Sweep:** a candle wicks through one of those levels and closes back inside it.
   - Lows taken (SSL sweep): the bot looks for a **long**.
   - Highs taken (BSL sweep): the bot looks for a **short**.
3. **Trigger** (within 20 bars of the sweep):
   - **IFVG model:** price closes through an opposing FVG, flipping it into an inverse FVG.
     After an SSL sweep, a close above a bearish FVG triggers a long. After a BSL sweep, a close below a bullish FVG triggers a short.
   - **FVG model:** a fresh FVG forms in the trade direction after the sweep.
   - **Both:** whichever happens first.
4. **Entry:** only inside the **entry window** (default 9:30–11:00 NY). The entry is either
   - a limit order on the retest of the zone (edge or CE / 50%), or
   - a market order at the close of the trigger candle.
5. **Exits:**
   - **TP:** a fixed dollar amount, $500 by default. It is converted to ticks from the symbol's tick value and your contract count.
   - **SL:** just past the sweep wick plus a buffer, or a fixed dollar amount.
   - **Max risk:** if the stop past the sweep is wider than "Max risk per trade ($)", the bot pulls the stop in to cap the loss (default). You can switch it to skip those setups instead.
6. **Guard rails:**
   - max trades per day
   - optionally stop for the day after a winner
   - flatten anything still open when the hold window ends (default 15:55)
   - cancel limit orders that don't fill after N bars

## What $500 TP means per contract (1 lot)

| Symbol | $/tick | $500 = |
|--------|-------:|-------:|
| NQ     | $5.00  | 100 ticks / 25 pts |
| ES     | $12.50 | 40 ticks / 10 pts |
| MNQ    | $0.50  | 1000 ticks / 250 pts |
| MES    | $1.25  | 400 ticks / 100 pts |
| GC     | $10.00 | 50 ticks / $5.00 |
| CL     | $10.00 | 50 ticks / $0.50 |

If you trade more contracts, the TP distance shrinks: on 2 NQ, $500 is 12.5 pts. The info panel on the chart shows the exact number.

## Load it

1. In TradingView, open the **Pine Editor**, paste in the file, click **Save**, then **Add to chart**.
2. Use a futures chart such as `NQ1!` or `ES1!` on a 1m–5m timeframe.
3. The info panel (top right) shows how many signals fired and why any were skipped (stop too wide, already in a trade or day limit hit, limit order never filled). Use it to tune the settings.
4. Check the **Strategy Tester** tab for results. Adjust inputs in the settings (gear icon).

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

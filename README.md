# Futures Trade Calculator

Simple local web app that:

- checks whether the current day/time is safer to trade based on today's scheduled economic reports
- uses the Forex Factory weekly JSON export as the news source
- shows Twelve Data market boards for stocks, forex, and futures-style proxies
- calculates direction, reward, risk, and risk/reward from Entry, TP, and SL prices

## Run

```bash
python3 server.py
```

Then open:

```text
http://127.0.0.1:8000
```

## Notes

- The news check uses your browser timezone.
- "Unsafe" means a high-impact event is within 60 minutes before/after now, or a medium-impact event is within 30 minutes.
- The market section uses Twelve Data through the local backend.
- Tabs are loaded on demand to stay inside the plan's per-minute credit limits.
- The futures tab uses working market proxies for `NQ`, `ES`, `GC`, and `CL` when direct futures symbols are not available on the current Twelve Data plan.
- Market boards are cached for 15 minutes and chart history is cached for 6 hours.
- The news feed is cached for 15 minutes and will fall back to the last successful pull if the live source rate-limits.
- This is a scheduled-news filter, not financial advice.

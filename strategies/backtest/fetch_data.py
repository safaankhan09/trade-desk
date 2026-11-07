"""Download ~60 days of 5m futures bars from Yahoo into data/<SYM>.pkl (NY time)."""
import json, os, urllib.request
import pandas as pd

os.makedirs("data", exist_ok=True)
for sym in ["NQ", "ES", "YM", "GC", "SI"]:
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}=F?interval=5m&range=60d"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    j = json.load(urllib.request.urlopen(req))["chart"]["result"][0]
    q = j["indicators"]["quote"][0]
    df = pd.DataFrame({"o": q["open"], "h": q["high"], "l": q["low"], "c": q["close"]},
                      index=pd.to_datetime(j["timestamp"], unit="s", utc=True).tz_convert("America/New_York")).dropna()
    df.to_pickle(f"data/{sym}.pkl")
    print(sym, len(df), df.index[0], "->", df.index[-1])

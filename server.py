from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib import error, parse, request
from zoneinfo import ZoneInfo
from pathlib import Path
import datetime as dt
import json
import mimetypes
import os
import time


BASE_DIR = Path(__file__).resolve().parent
HOST = "0.0.0.0"
PORT = int(os.environ.get("PORT", 8000))
CALENDAR_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json"
TWELVE_DATA_URL = "https://api.twelvedata.com"
TIMEZONE_FALLBACK = "America/New_York"
TWELVE_DATA_API_KEY = os.environ.get("TWELVE_DATA_API_KEY", "1bf3a13bf01e409faf1d906b0def1041")
MARKET_GROUPS = {
    "stocks": [
        {"id": "CME", "symbol": "CME", "label": "CME", "kind": "stock", "description": "CME Group"},
        {"id": "AAPL", "symbol": "AAPL", "label": "AAPL", "kind": "stock", "description": "Apple"},
        {"id": "IBM", "symbol": "IBM", "label": "IBM", "kind": "stock", "description": "IBM"},
    ],
    "forex": [
        {"id": "GBPUSD", "symbol": "GBP/USD", "label": "GBP/USD", "kind": "forex", "description": "British Pound vs US Dollar"},
        {"id": "EURUSD", "symbol": "EUR/USD", "label": "EUR/USD", "kind": "forex", "description": "Euro vs US Dollar"},
        {"id": "USDJPY", "symbol": "USD/JPY", "label": "USD/JPY", "kind": "forex", "description": "US Dollar vs Japanese Yen"},
    ],
    "futures": [
        {"id": "NQ", "symbol": "QQQ", "label": "NQ", "kind": "proxy", "description": "Nasdaq 100 proxy via QQQ"},
        {"id": "ES", "symbol": "SPY", "label": "ES", "kind": "proxy", "description": "S&P 500 proxy via SPY"},
        {"id": "GC", "symbol": "XAU/USD", "label": "GC", "kind": "proxy", "description": "Gold proxy via XAU/USD"},
        {"id": "CL", "symbol": "USO", "label": "CL", "kind": "proxy", "description": "Crude oil proxy via USO"},
    ],
}
NEWS_CACHE_TTL_SECONDS = 900
QUOTE_CACHE_TTL_SECONDS = 900
CHART_CACHE_TTL_SECONDS = 21600
VIX_CACHE_TTL_SECONDS = 900
CACHE = {}


def parse_event_datetime(event):
    raw = event.get("date")
    if not raw:
        return None

    try:
        parsed = dt.datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        return None

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=dt.timezone.utc)
    return parsed


def event_to_client(event, timezone_name):
    tz = ZoneInfo(timezone_name)
    event_dt_source = parse_event_datetime(event)
    event_dt_utc = event_dt_source.astimezone(dt.timezone.utc) if event_dt_source else None
    event_dt_local = event_dt_source.astimezone(tz) if event_dt_source else None

    return {
        "title": event.get("title") or "Untitled event",
        "country": event.get("country") or "",
        "currency": event.get("country") or "",
        "impact": (event.get("impact") or "Low").title(),
        "forecast": event.get("forecast") or "",
        "previous": event.get("previous") or "",
        "actual": event.get("actual") or "",
        "url": event.get("url") or "",
        "datetimeUtc": event_dt_utc.isoformat() if event_dt_utc else "",
        "datetimeLocal": event_dt_local.isoformat() if event_dt_local else "",
        "localDateLabel": event_dt_local.strftime("%a, %b %d") if event_dt_local else "",
        "localTimeLabel": event_dt_local.strftime("%I:%M %p").lstrip("0") if event_dt_local else "TBA",
    }


def classify_vix_risk(vix_snapshot):
    if not vix_snapshot:
        return None

    if vix_snapshot.get("isProxy"):
        change_percent = vix_snapshot.get("changePercent", 0)
        if change_percent >= 6:
            return {
                "riskLevel": "Unsafe",
                "message": (
                    f"{vix_snapshot.get('symbol', 'volatility proxy')} is surging {change_percent:.2f}%, "
                    "which suggests a stressed volatility backdrop."
                ),
            }
        if change_percent >= 3:
            return {
                "riskLevel": "Caution",
                "message": (
                    f"{vix_snapshot.get('symbol', 'volatility proxy')} is up {change_percent:.2f}%, "
                    "which points to volatility picking up."
                ),
            }
        return {
            "riskLevel": "Safe",
            "message": (
                f"{vix_snapshot.get('symbol', 'volatility proxy')} is not showing a strong volatility surge right now."
            ),
        }

    price = vix_snapshot["price"]
    if price >= 28:
        return {
            "riskLevel": "Unsafe",
            "message": f"VIX is elevated at {price:.2f}, which points to stressed or unstable conditions.",
        }
    if price >= 22:
        return {
            "riskLevel": "Caution",
            "message": f"VIX is firm at {price:.2f}, so volatility risk is above a calm baseline.",
        }
    return {
        "riskLevel": "Safe",
        "message": f"VIX is relatively contained at {price:.2f} compared with higher-volatility conditions.",
    }


def build_trade_assessment(events, timezone_name, vix_snapshot=None):
    tz = ZoneInfo(timezone_name)
    now = dt.datetime.now(tz)
    vix_risk = classify_vix_risk(vix_snapshot)

    if now.weekday() >= 5:
        return {
            "status": "Unsafe",
            "summary": "Weekend session detected. Treat today as a no-trade day for most futures strategies.",
            "reason": "Markets are either closed or running with poor liquidity on weekends.",
            "nextSafeWindow": "Check again on the next trading day before your session begins.",
        }

    relevant_events = []
    for event in events:
        if not event.get("datetimeLocal"):
            continue

        event_dt = dt.datetime.fromisoformat(event["datetimeLocal"])
        delta_minutes = (event_dt - now).total_seconds() / 60
        impact = event.get("impact", "Low")

        if impact == "High" and -60 <= delta_minutes <= 60:
            relevant_events.append(
                {
                    "severity": 3,
                    "summary": f"High-impact event near now: {event['title']} at {event['localTimeLabel']}.",
                    "nextSafe": (event_dt + dt.timedelta(minutes=60)).strftime("%I:%M %p").lstrip("0"),
                }
            )
        elif impact == "Medium" and -30 <= delta_minutes <= 30:
            relevant_events.append(
                {
                    "severity": 2,
                    "summary": f"Medium-impact event near now: {event['title']} at {event['localTimeLabel']}.",
                    "nextSafe": (event_dt + dt.timedelta(minutes=30)).strftime("%I:%M %p").lstrip("0"),
                }
            )

    if relevant_events:
        highest = sorted(relevant_events, key=lambda item: item["severity"], reverse=True)[0]
        vix_note = ""
        if vix_risk and vix_risk["riskLevel"] in {"Caution", "Unsafe"}:
            vix_note = f" VIX is also elevated at {vix_snapshot['price']:.2f}."
        return {
            "status": "Unsafe",
            "summary": highest["summary"],
            "reason": f"Volatility risk is elevated inside the event buffer window.{vix_note}",
            "nextSafeWindow": f"Earliest safer window: {highest['nextSafe']} ({timezone_name}).",
        }

    next_high_impact = None
    for event in events:
        if event.get("impact") != "High" or not event.get("datetimeLocal"):
            continue
        event_dt = dt.datetime.fromisoformat(event["datetimeLocal"])
        if event_dt > now:
            next_high_impact = event
            break

    if vix_risk and vix_risk["riskLevel"] == "Unsafe":
        return {
            "status": "Unsafe",
            "summary": f"VIX is elevated at {vix_snapshot['price']:.2f}, which points to a rougher trading backdrop.",
            "reason": vix_risk["message"],
            "nextSafeWindow": "Wait for volatility to cool off or tighten risk substantially before trading.",
        }

    if next_high_impact and vix_risk and vix_risk["riskLevel"] == "Caution":
        return {
            "status": "Caution",
            "summary": "Scheduled news is still ahead and volatility is already running above a calm baseline.",
            "reason": f"Next major event: {next_high_impact['title']} at {next_high_impact['localTimeLabel']}. {vix_risk['message']}",
            "nextSafeWindow": "Keep size smaller and stay selective as you get closer to the report time.",
        }

    if next_high_impact:
        return {
            "status": "Caution",
            "summary": "No active danger window right now, but a high-impact report is still ahead.",
            "reason": f"Next major event: {next_high_impact['title']} at {next_high_impact['localTimeLabel']}.",
            "nextSafeWindow": "Keep risk smaller as you get closer to the report time.",
        }

    if vix_risk and vix_risk["riskLevel"] == "Caution":
        return {
            "status": "Caution",
            "summary": f"Scheduled news looks calm, but VIX is elevated at {vix_snapshot['price']:.2f}.",
            "reason": vix_risk["message"],
            "nextSafeWindow": "Conditions are tradable, but this is not a low-volatility backdrop.",
        }

    return {
        "status": "Safer",
        "summary": "No medium/high-impact event is inside the active buffer window.",
        "reason": (
            vix_risk["message"]
            if vix_risk
            else "The current day/time looks cleaner from a scheduled-news perspective."
        ),
        "nextSafeWindow": "Keep checking before each trade because conditions can change quickly.",
    }


def get_cache(key, ttl_seconds):
    item = CACHE.get(key)
    if not item:
        return None

    age = (dt.datetime.now(dt.timezone.utc) - item["saved_at"]).total_seconds()
    if age <= ttl_seconds:
        return item["payload"]
    return None


def get_stale_cache(key):
    item = CACHE.get(key)
    return item["payload"] if item else None


def save_cache(key, payload):
    CACHE[key] = {
        "saved_at": dt.datetime.now(dt.timezone.utc),
        "payload": payload,
    }


def cache_age_seconds(key):
    item = CACHE.get(key)
    if not item:
        return None
    return int((dt.datetime.now(dt.timezone.utc) - item["saved_at"]).total_seconds())


def twelve_data_request(path, params):
    request_url = f"{TWELVE_DATA_URL}/{path}?{parse.urlencode(params)}"
    api_request = request.Request(
        request_url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/135.0.0.0 Safari/537.36"
            ),
            "Accept": "application/json,text/plain,*/*",
            "Referer": "https://twelvedata.com/",
        },
    )

    with request.urlopen(api_request, timeout=15) as response:
        payload = json.loads(response.read().decode("utf-8"))

    if payload.get("status") == "error":
        raise ValueError(payload.get("message", "Unknown Twelve Data error"))
    return payload


def fetch_twelve_quotes(group_name):
    instruments = MARKET_GROUPS[group_name]
    symbols = ",".join(item["symbol"] for item in instruments)
    payload = twelve_data_request(
        "quote",
        {
            "symbol": symbols,
            "apikey": TWELVE_DATA_API_KEY,
        },
    )

    if len(instruments) == 1:
        payload = {instruments[0]["symbol"]: payload}

    items = []
    for instrument in instruments:
        quote = payload.get(instrument["symbol"])
        if not isinstance(quote, dict):
            raise ValueError(f"No quote data returned for {instrument['label']}")

        items.append(
            {
                "id": instrument["id"],
                "label": instrument["label"],
                "symbol": instrument["symbol"],
                "kind": instrument["kind"],
                "description": instrument["description"],
                "name": quote.get("name") or instrument["description"],
                "exchange": quote.get("exchange") or "",
                "currency": quote.get("currency") or "USD",
                "price": float(quote.get("close", "0") or 0),
                "previousClose": float(quote.get("previous_close", "0") or 0),
                "change": float(quote.get("change", "0") or 0),
                "changePercent": float(quote.get("percent_change", "0") or 0),
                "datetime": quote.get("datetime") or "",
                "isMarketOpen": bool(quote.get("is_market_open")),
            }
        )

    return {
        "group": group_name,
        "items": items,
        "sourceNote": "Twelve Data quotes cached locally to protect your plan limits.",
    }


def fetch_vix_snapshot():
    symbols_to_try = ["VIX", "^VIX", "VIX.X"]
    last_error = None

    for symbol in symbols_to_try:
        try:
            payload = twelve_data_request(
                "quote",
                {
                    "symbol": symbol,
                    "apikey": TWELVE_DATA_API_KEY,
                },
            )
            price = float(payload.get("close", "0") or 0)
            if not price:
                continue

            change = float(payload.get("change", "0") or 0)
            change_percent = float(payload.get("percent_change", "0") or 0)
            risk = classify_vix_risk({"price": price})
            return {
                "symbol": payload.get("symbol") or symbol,
                "name": payload.get("name") or "VIX",
                "price": price,
                "change": change,
                "changePercent": change_percent,
                "riskLevel": risk["riskLevel"] if risk else "Safe",
                "message": risk["message"] if risk else "",
                "exchange": payload.get("exchange") or "CBOE",
                "datetime": payload.get("datetime") or "",
                "isProxy": False,
            }
        except Exception as exc:
            last_error = exc

    proxy_symbol = "VIXY"
    payload = twelve_data_request(
        "quote",
        {
            "symbol": proxy_symbol,
            "apikey": TWELVE_DATA_API_KEY,
        },
    )
    price = float(payload.get("close", "0") or 0)
    change = float(payload.get("change", "0") or 0)
    change_percent = float(payload.get("percent_change", "0") or 0)
    proxy_snapshot = {
        "symbol": payload.get("symbol") or proxy_symbol,
        "name": payload.get("name") or "VIX proxy",
        "price": price,
        "change": change,
        "changePercent": change_percent,
        "exchange": payload.get("exchange") or "CBOE",
        "datetime": payload.get("datetime") or "",
        "isProxy": True,
        "proxyNote": "Direct VIX index data was unavailable on the current plan, so this panel is using VIXY as a volatility proxy.",
    }
    risk = classify_vix_risk(proxy_snapshot)
    proxy_snapshot["riskLevel"] = risk["riskLevel"] if risk else "Safe"
    proxy_snapshot["message"] = (
        f"{proxy_snapshot['proxyNote']} {risk['message']}" if risk else proxy_snapshot["proxyNote"]
    )
    return proxy_snapshot


def find_instrument_by_id(instrument_id):
    for group_items in MARKET_GROUPS.values():
        for instrument in group_items:
            if instrument["id"] == instrument_id:
                return instrument
    return None


def fetch_twelve_chart(instrument_id):
    instrument = find_instrument_by_id(instrument_id)
    if not instrument:
        raise ValueError("Unknown instrument id")

    payload = twelve_data_request(
        "time_series",
        {
            "symbol": instrument["symbol"],
            "interval": "1day",
            "outputsize": "60",
            "apikey": TWELVE_DATA_API_KEY,
        },
    )
    meta = payload.get("meta") or {}
    values = payload.get("values") or []
    if not values:
        raise ValueError("No chart data was returned.")

    values = list(reversed(values))
    points = []
    for value in values:
        points.append(
            {
                "date": value.get("datetime") or "",
                "open": float(value.get("open", "0") or 0),
                "high": float(value.get("high", "0") or 0),
                "low": float(value.get("low", "0") or 0),
                "close": float(value.get("close", "0") or 0),
                "volume": int(float(value.get("volume", "0") or 0)),
            }
        )

    latest = points[-1]
    previous = points[-2] if len(points) > 1 else None
    change = latest["close"] - previous["close"] if previous else 0
    change_percent = ((change / previous["close"]) * 100) if previous and previous["close"] else 0

    source_note = "Twelve Data daily chart cached locally to protect your plan limits."
    if instrument["kind"] == "proxy":
        source_note += " Futures labels are shown using live proxies because direct futures symbols were not available on the current plan."

    return {
        "id": instrument["id"],
        "displaySymbol": instrument["label"],
        "symbol": instrument["symbol"],
        "description": instrument["description"],
        "lastRefreshed": points[-1]["date"],
        "timeZone": meta.get("exchange_timezone") or "Exchange",
        "exchange": meta.get("exchange") or "",
        "currency": meta.get("currency") or "USD",
        "latestPrice": latest["close"],
        "change": round(change, 4),
        "changePercent": round(change_percent, 4),
        "points": points,
        "sourceNote": source_note,
    }


def fetch_calendar_events():
    calendar_request = request.Request(
        CALENDAR_URL,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/135.0.0.0 Safari/537.36"
            ),
            "Accept": "application/json,text/plain,*/*",
            "Referer": "https://www.forexfactory.com/",
        },
    )

    with request.urlopen(calendar_request, timeout=12) as response:
        return json.loads(response.read().decode("utf-8"))


class TradeToolHandler(BaseHTTPRequestHandler):
    def send_json(self, payload, status=200):
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def serve_file(self, relative_path):
        target = BASE_DIR / relative_path
        if not target.exists() or not target.is_file():
            self.send_error(404, "File not found")
            return

        content = target.read_bytes()
        content_type, _ = mimetypes.guess_type(str(target))
        self.send_response(200)
        self.send_header("Content-Type", content_type or "application/octet-stream")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def do_GET(self):
        parsed = parse.urlparse(self.path)

        if parsed.path == "/":
            self.serve_file("index.html")
            return

        if parsed.path in {"/app.js", "/styles.css"}:
            self.serve_file(parsed.path.lstrip("/"))
            return

        if parsed.path.startswith("/assets/"):
            self.serve_file(parsed.path.lstrip("/"))
            return

        if parsed.path == "/api/calendar":
            query = parse.parse_qs(parsed.query)
            timezone_name = query.get("tz", [TIMEZONE_FALLBACK])[0]
            force_refresh = query.get("refresh", ["0"])[0] == "1"
            cache_key = "calendar:raw"
            vix_cache_key = "market:vix"

            try:
                ZoneInfo(timezone_name)
            except Exception:
                timezone_name = TIMEZONE_FALLBACK

            try:
                raw_events = None
                if not force_refresh:
                    raw_events = get_cache(cache_key, NEWS_CACHE_TTL_SECONDS)
                if raw_events is None:
                    raw_events = fetch_calendar_events()
                    save_cache(cache_key, raw_events)
                cache_status = "live" if force_refresh or cache_age_seconds(cache_key) == 0 else "cached"
            except error.URLError as exc:
                raw_events = get_stale_cache(cache_key)
                if raw_events is not None:
                    cache_status = "stale"
                else:
                    self.send_json(
                        {
                            "error": "Failed to load economic calendar data.",
                            "details": str(exc),
                        },
                        status=502,
                    )
                    return
            except Exception as exc:
                raw_events = get_stale_cache(cache_key)
                if raw_events is not None:
                    cache_status = "stale"
                else:
                    self.send_json(
                        {
                            "error": "Failed to load economic calendar data.",
                            "details": str(exc),
                        },
                        status=502,
                    )
                    return

            vix_snapshot = None
            try:
                vix_snapshot = None if force_refresh else get_cache(vix_cache_key, VIX_CACHE_TTL_SECONDS)
                if vix_snapshot is None:
                    vix_snapshot = fetch_vix_snapshot()
                    save_cache(vix_cache_key, vix_snapshot)
            except Exception:
                vix_snapshot = get_stale_cache(vix_cache_key)

            events = [event_to_client(item, timezone_name) for item in raw_events]
            events.sort(key=lambda item: item.get("datetimeLocal") or "")

            today = dt.datetime.now(ZoneInfo(timezone_name)).date()
            todays_events = []
            for event in events:
                local_dt = event.get("datetimeLocal")
                if not local_dt:
                    continue
                if dt.datetime.fromisoformat(local_dt).date() == today:
                    todays_events.append(event)

            assessment = build_trade_assessment(todays_events, timezone_name, vix_snapshot=vix_snapshot)
            self.send_json(
                {
                    "timezone": timezone_name,
                    "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
                    "assessment": assessment,
                    "vix": vix_snapshot,
                    "todaysEvents": todays_events,
                    "sourceNote": "Forex Factory weekly calendar feed plus a cached VIX snapshot are used for the risk desk.",
                    "cacheStatus": cache_status,
                    "cacheAgeSeconds": cache_age_seconds(cache_key),
                }
            )
            return

        if parsed.path == "/api/market-board":
            query = parse.parse_qs(parsed.query)
            group_name = (query.get("group", ["stocks"])[0] or "stocks").lower()
            force_refresh = query.get("refresh", ["0"])[0] == "1"
            if group_name not in MARKET_GROUPS:
                self.send_json({"error": "Unknown market group."}, status=400)
                return
            cache_key = f"market-board:{group_name}"

            try:
                payload = None if force_refresh else get_cache(cache_key, QUOTE_CACHE_TTL_SECONDS)
                if payload is None:
                    payload = fetch_twelve_quotes(group_name)
                    payload["cacheStatus"] = "live"
                    save_cache(cache_key, payload)
                else:
                    payload = dict(payload)
                    payload["cacheStatus"] = "cached"
                payload["cacheAgeSeconds"] = cache_age_seconds(cache_key)
                self.send_json(payload)
                return
            except Exception as exc:
                stale_payload = get_stale_cache(cache_key)
                if stale_payload:
                    stale_payload = dict(stale_payload)
                    stale_payload["cacheStatus"] = "stale"
                    stale_payload["cacheAgeSeconds"] = cache_age_seconds(cache_key)
                    stale_payload["sourceNote"] = (
                        f"{stale_payload.get('sourceNote', '')} "
                        "Showing cached market board because the live request could not be completed."
                    ).strip()
                    self.send_json(stale_payload)
                    return

                self.send_json(
                    {
                        "error": "Failed to load market board.",
                        "details": str(exc),
                    }
                    ,
                    status=502,
                )
                return

        if parsed.path == "/api/chart":
            query = parse.parse_qs(parsed.query)
            instrument_id = (query.get("id", ["CME"])[0] or "CME").upper()
            force_refresh = query.get("refresh", ["0"])[0] == "1"
            cache_key = f"chart:{instrument_id}"

            cached_payload = None if force_refresh else get_cache(cache_key, CHART_CACHE_TTL_SECONDS)
            if cached_payload:
                cached_payload = dict(cached_payload)
                cached_payload["cacheStatus"] = "cached"
                self.send_json(cached_payload)
                return

            try:
                if force_refresh:
                    time.sleep(1.05)
                payload = fetch_twelve_chart(instrument_id)
                payload["cacheStatus"] = "live"
                save_cache(cache_key, payload)
                self.send_json(payload)
                return
            except Exception as exc:
                stale_payload = get_stale_cache(cache_key)
                if stale_payload:
                    stale_payload = dict(stale_payload)
                    stale_payload["cacheStatus"] = "stale"
                    stale_payload["sourceNote"] = (
                        f"{stale_payload.get('sourceNote', '')} "
                        "Showing cached chart data because the live request could not be completed."
                    ).strip()
                    self.send_json(stale_payload)
                    return

                self.send_json(
                    {
                        "error": "Failed to load stock chart data.",
                        "details": str(exc),
                    },
                    status=502,
                )
                return

        self.send_error(404, "Not found")


def run():
    server = HTTPServer((HOST, PORT), TradeToolHandler)
    print(f"Trade calculator running at http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    run()

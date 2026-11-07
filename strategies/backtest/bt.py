"""Python port of the Sweep + FVG/IFVG Pine strategy, for honest backtesting.

Conservative fill rules (stricter than TradingView defaults):
  - if TP and SL are both inside one bar, assume the SL hit first
  - limit entries fill only if price trades THROUGH the limit by 1 tick
  - stop exits and market entries get 1 tick slippage
  - commission per contract per side
"""
import math
import pandas as pd

SPECS = {  # tick size, $ per tick
    "NQ": (0.25, 5.0), "ES": (0.25, 12.5), "YM": (1.0, 5.0),
    "GC": (0.1, 10.0), "SI": (0.005, 25.0),
}
COMM = 2.0  # $ per contract per side (minis)


def hm(ts):
    return ts.hour * 60 + ts.minute


def in_sess(m, a, b):
    """session [a,b) in minutes, supports overnight"""
    if a < b:
        return a <= m < b
    return m >= a or m < b


def T(h, m=0):
    return h * 60 + m


DEFAULT = dict(
    windows=((T(9, 30), T(11, 30)),),
    hold_end=T(15, 55),
    use_asia=True, use_london=True, use_nyam=False, use_pd=True, use_swings=False, pivot=10,
    reclaim=True, model="IFVG", sweep_expiry=20, fvg_near=15, min_fvg_ticks=4, fvg_age=150,
    entry="limit", level="edge", limit_expiry=10,
    max_qty=2, risk=250.0, tp=500.0, min_rr=1.5, stop="zone", buf=4,
    dd=1000.0, lock_above=100.0, daily_loss=500.0, daily_goal=500.0, max_trades=2, stop_on_win=True,
    direction="both", through=1,
)


def run(df, sym, **kw):
    p = dict(DEFAULT)
    p.update(kw)
    tick, tv = SPECS[sym]
    o, h, l, c = df.o.values, df.h.values, df.l.values, df.c.values
    idx = df.index
    n = len(df)
    mins = [hm(t) for t in idx]
    # trading day id: new day at 18:00 NY
    tday = [(t + pd.Timedelta(hours=6)).date() for t in idx]

    eq = 25000.0
    start = eq
    peak_eod = eq
    blown = None
    trades = []
    liq_hi, liq_lo = [], []  # [price, name]
    fvgs = []  # dict(top,bot,bar,bull,inv)
    sess_state = {}
    pd_hi = pd_lo = None
    cur_hi = cur_lo = None
    long_sw = short_sw = None  # (bar, extreme)
    pos = None  # dict(side, entry, qty, tp, sl, bar)
    pend = None  # dict(side, px, qty, tpT, slT, bar)
    day_trades = 0
    day_start_eq = eq
    day_locked = False
    won_today = False

    sessions = []
    if p["use_asia"]:
        sessions.append(("Asia", T(20), T(0)))
    if p["use_london"]:
        sessions.append(("London", T(2), T(5)))
    if p["use_nyam"]:
        sessions.append(("NYAM", T(9, 30), T(11, 30)))

    def add_liq(arr, price, name):
        if name != "Swing":
            arr[:] = [x for x in arr if x[1] != name]
        arr.append([price, name])
        if len(arr) > 20:
            arr.pop(0)

    def close_pos(i, px, why):
        nonlocal pos, eq, won_today
        d = 1 if pos["side"] == "L" else -1
        pnl = (px - pos["entry"]) * d / tick * tv * pos["qty"] - 2 * COMM * pos["qty"]
        eq += pnl
        trades.append(dict(time=idx[i], entry_time=idx[pos["bar"]], side=pos["side"], qty=pos["qty"], pnl=pnl, why=why))
        if pnl > 0:
            won_today = True
        pos = None

    for i in range(n):
        m = mins[i]
        newday = i == 0 or tday[i] != tday[i - 1]
        if newday:
            if i > 0:
                pd_hi, pd_lo = cur_hi, cur_lo
                if p["use_pd"] and pd_hi is not None:
                    add_liq(liq_hi, pd_hi, "PDH")
                    add_liq(liq_lo, pd_lo, "PDL")
            cur_hi, cur_lo = h[i], l[i]
            day_trades = 0
            won_today = False
            day_locked = False
            day_start_eq = eq
            peak_eod = max(peak_eod, eq)
        else:
            cur_hi, cur_lo = max(cur_hi, h[i]), min(cur_lo, l[i])

        in_entry = any(in_sess(m, a, b) for a, b in p["windows"])
        in_hold = not (p["hold_end"] <= m < T(18))
        floor = min(peak_eod - p["dd"], start + p["lock_above"])

        # ---- fills & exits on this bar (orders placed on earlier bars) ----
        if pend is not None and pos is None and blown is None:
            side, px = pend["side"], pend["px"]
            filled = False
            if pend["market"]:
                fpx = o[i] + (tick if side == "L" else -tick)
                filled = True
            elif side == "L" and l[i] <= px - p["through"] * tick:
                fpx, filled = px, True
            elif side == "S" and h[i] >= px + p["through"] * tick:
                fpx, filled = px, True
            if filled:
                d = 1 if side == "L" else -1
                pos = dict(side=side, entry=fpx, qty=pend["qty"],
                           tp=fpx + d * pend["tpT"] * tick, sl=fpx - d * pend["slT"] * tick, bar=i)
                day_trades += 1
                pend = None
        if pos is not None:
            d = 1 if pos["side"] == "L" else -1
            hit_sl = (l[i] <= pos["sl"]) if d == 1 else (h[i] >= pos["sl"])
            hit_tp = (h[i] >= pos["tp"]) if d == 1 else (l[i] <= pos["tp"])
            # a position opened on this bar by a limit: only allow exits beyond the entry move
            if hit_sl:
                close_pos(i, pos["sl"] - d * tick, "SL")
            elif hit_tp:
                close_pos(i, pos["tp"], "TP")
        if pos is not None and not in_hold:
            close_pos(i, c[i], "EOD")

        # ---- guards (on close) ----
        open_pnl = 0.0
        if pos is not None:
            d = 1 if pos["side"] == "L" else -1
            open_pnl = (c[i] - pos["entry"]) * d / tick * tv * pos["qty"]
        if blown is None and eq + open_pnl <= floor:
            blown = idx[i]
            if pos is not None:
                close_pos(i, c[i], "DD")
            pend = None
        dpnl = eq + open_pnl - day_start_eq
        if not day_locked and p["daily_loss"] > 0 and dpnl <= -p["daily_loss"]:
            day_locked = True
        if not day_locked and p["daily_goal"] > 0 and dpnl >= p["daily_goal"]:
            day_locked = True
        if day_locked and pos is not None:
            close_pos(i, c[i], "LOCK")

        # ---- session liquidity ----
        for name, a, b in sessions:
            ins = in_sess(m, a, b)
            st = sess_state.setdefault(name, dict(ins=False, hi=None, lo=None))
            if ins and not st["ins"]:
                st["hi"], st["lo"] = h[i], l[i]
            elif ins:
                st["hi"], st["lo"] = max(st["hi"], h[i]), min(st["lo"], l[i])
            if not ins and st["ins"] and st["hi"] is not None:
                add_liq(liq_hi, st["hi"], name + " H")
                add_liq(liq_lo, st["lo"], name + " L")
            st["ins"] = ins
        if p["use_swings"]:
            k = p["pivot"]
            j = i - k
            if j - k >= 0:
                if h[j] == max(h[j - k:i + 1]) and h[j] > max(h[j - k:j]) :
                    add_liq(liq_hi, h[j], "Swing")
                if l[j] == min(l[j - k:i + 1]) and l[j] < min(l[j - k:j]):
                    add_liq(liq_lo, l[j], "Swing")

        # ---- sweeps ----
        if long_sw and (i - long_sw[0] > p["sweep_expiry"]):
            long_sw = None
        elif long_sw and l[i] < long_sw[1]:
            long_sw = (long_sw[0], l[i])
        if short_sw and (i - short_sw[0] > p["sweep_expiry"]):
            short_sw = None
        elif short_sw and h[i] > short_sw[1]:
            short_sw = (short_sw[0], h[i])
        swept_hi = swept_lo = False
        keep = []
        for lv in liq_hi:
            if h[i] > lv[0]:
                if not p["reclaim"] or c[i] < lv[0]:
                    swept_hi = True
            else:
                keep.append(lv)
        liq_hi[:] = keep
        keep = []
        for lv in liq_lo:
            if l[i] < lv[0]:
                if not p["reclaim"] or c[i] > lv[0]:
                    swept_lo = True
            else:
                keep.append(lv)
        liq_lo[:] = keep
        if swept_lo:
            long_sw = (i, l[i])
        if swept_hi:
            short_sw = (i, h[i])

        # ---- FVGs ----
        use_ifvg = p["model"] != "FVG"
        use_fvg = p["model"] != "IFVG"
        ltrig = strig = None
        keep = []
        for f in fvgs:
            kill = False
            if not f["inv"]:
                if f["bull"] and c[i] < f["bot"]:
                    f["inv"] = True
                    if use_ifvg and short_sw and strig is None and f["bar"] >= short_sw[0] - p["fvg_near"]:
                        strig = (f["top"], f["bot"])
                elif (not f["bull"]) and c[i] > f["top"]:
                    f["inv"] = True
                    if use_ifvg and long_sw and ltrig is None and f["bar"] >= long_sw[0] - p["fvg_near"]:
                        ltrig = (f["top"], f["bot"])
            else:
                if f["bull"] and c[i] > f["top"]:
                    kill = True
                elif (not f["bull"]) and c[i] < f["bot"]:
                    kill = True
            if i - f["bar"] > p["fvg_age"]:
                kill = True
            if not kill:
                keep.append(f)
        fvgs = keep
        if i >= 2:
            mg = p["min_fvg_ticks"] * tick
            if l[i] > h[i - 2] and l[i] - h[i - 2] >= mg:
                fvgs.append(dict(top=l[i], bot=h[i - 2], bar=i, bull=True, inv=False))
                if use_fvg and long_sw and ltrig is None and i - 2 >= long_sw[0]:
                    ltrig = (l[i], h[i - 2])
            if h[i] < l[i - 2] and l[i - 2] - h[i] >= mg:
                fvgs.append(dict(top=l[i - 2], bot=h[i], bar=i, bull=False, inv=False))
                if use_fvg and short_sw and strig is None and i - 2 >= short_sw[0]:
                    strig = (l[i - 2], h[i])
            if len(fvgs) > 40:
                fvgs.pop(0)

        # ---- pending limit expiry ----
        if pend is not None and i > pend["bar"]:
            if i - pend["bar"] >= p["limit_expiry"] or not in_entry or day_locked or blown:
                pend = None

        can = (in_entry and pos is None and pend is None and blown is None and not day_locked
               and day_trades < p["max_trades"] and not (p["stop_on_win"] and won_today))
        for side, trig, sw in (("L", ltrig, long_sw), ("S", strig, short_sw)):
            if not can or trig is None or pend is not None:
                continue
            if p["direction"] == "long" and side == "S":
                continue
            if p["direction"] == "short" and side == "L":
                continue
            top, bot = trig
            if p["entry"] == "limit":
                if side == "L":
                    epx = top if p["level"] == "edge" else (top + bot) / 2
                else:
                    epx = bot if p["level"] == "edge" else (top + bot) / 2
                epx = round(epx / tick) * tick
            else:
                epx = c[i]
            if side == "L":
                ss = (sw[1] if p["stop"] == "sweep" else bot) - p["buf"] * tick
                dist = epx - ss
            else:
                ss = (sw[1] if p["stop"] == "sweep" else top) + p["buf"] * tick
                dist = ss - epx
            if dist <= 0:
                continue
            slT = round(dist / tick)
            q = min(p["max_qty"], math.floor(p["risk"] / (slT * tv)))
            if q < 1:
                continue
            tpT = math.ceil(p["tp"] / (tv * q))
            rr = p["tp"] / (slT * tv * q)
            if p["min_rr"] > 0 and rr < p["min_rr"]:
                continue
            pend = dict(side=side, px=epx, qty=q, tpT=tpT, slT=slT, bar=i, market=p["entry"] == "market")
            if side == "L":
                long_sw = None
            else:
                short_sw = None

    tr = pd.DataFrame(trades)
    return tr, eq, blown


def stats(tr, eq, blown, start=25000.0):
    if tr is None or len(tr) == 0:
        return dict(n=0, net=0.0, pf=0.0, wr=0.0, mdd=0.0, blown=bool(blown), days=0)
    curve = start + tr.pnl.cumsum()
    peak = curve.cummax().clip(lower=start)
    mdd = float((peak - curve).max())
    gp = tr.pnl[tr.pnl > 0].sum()
    gl = -tr.pnl[tr.pnl < 0].sum()
    daily = tr.groupby(tr.time.dt.date).pnl.sum()
    return dict(n=len(tr), net=round(eq - start, 0), pf=round(gp / gl, 2) if gl > 0 else 99.0,
                wr=round((tr.pnl > 0).mean() * 100, 0), mdd=round(mdd, 0), blown=blown is not None,
                days=len(daily), green=int((daily > 0).sum()), red=int((daily < 0).sum()))

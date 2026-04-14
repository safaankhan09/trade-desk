const MARKET_GROUPS = {
  stocks: ["CME", "AAPL", "IBM"],
  forex: ["GBPUSD", "EURUSD", "USDJPY"],
  futures: ["NQ", "ES", "GC", "CL"],
};

const MARKET_GROUP_LABELS = {
  stocks: "Equities",
  forex: "FX Pairs",
  futures: "Futures",
};

const BRAND_THEMES = {
  CME: {
    cardName: "CME Group",
    venueLabel: "NASDAQ",
    descriptor: "CME Group market structure and exchange flow",
    imagePath: "/assets/cme.png",
  },
  AAPL: {
    cardName: "Apple",
    venueLabel: "NASDAQ",
    descriptor: "Apple equity trend and session pricing",
    imagePath: "/assets/apple.svg",
  },
  IBM: {
    cardName: "IBM",
    venueLabel: "NYSE",
    descriptor: "IBM institutional tape and daily trend",
    imagePath: "/assets/ibm.svg",
  },
  GBPUSD: {
    cardName: "GBP / USD",
    venueLabel: "FX",
    descriptor: "Sterling versus the US dollar",
    icon: dualTokenIcon("GBP", "USD", "#123154", "#1f5f89"),
  },
  EURUSD: {
    cardName: "EUR / USD",
    venueLabel: "FX",
    descriptor: "Euro versus the US dollar",
    icon: dualTokenIcon("EUR", "USD", "#133052", "#406ea8"),
  },
  USDJPY: {
    cardName: "USD / JPY",
    venueLabel: "FX",
    descriptor: "Dollar strength against the yen",
    icon: dualTokenIcon("USD", "JPY", "#16375c", "#8d3744"),
  },
  NQ: {
    cardName: "Nasdaq 100 E-mini Futures",
    venueLabel: "CME",
    descriptor: "Nasdaq futures view with futures-first pricing",
    icon: nasdaqFuturesIcon(),
  },
  ES: {
    cardName: "S&P 500 E-mini Futures",
    venueLabel: "CME",
    descriptor: "S&P futures view with futures-first pricing",
    icon: letterBadge("ES", "#153740", "#4abeb6"),
  },
  GC: {
    cardName: "Gold Proxy",
    venueLabel: "Proxy",
    descriptor: "GC view mapped through XAU / USD",
    imagePath: "/assets/gold.png",
  },
  CL: {
    cardName: "Crude Proxy",
    venueLabel: "Proxy",
    descriptor: "CL view mapped through USO",
    imagePath: "/assets/crude-oil.png",
  },
  VIX: {
    cardName: "CBOE Volatility Index",
    venueLabel: "CBOE",
    descriptor: "Volatility backdrop for broader market risk",
    icon: `
      <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="VIX mark">
        <rect width="64" height="64" rx="18" fill="#171d26"/>
        <path d="M12 41c5-4 8-17 14-17 5 0 7 13 12 13 6 0 8-11 14-14" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="41" r="2.4" fill="#ffffff"/>
        <circle cx="26" cy="24" r="2.4" fill="#ffffff"/>
        <circle cx="38" cy="37" r="2.4" fill="#ffffff"/>
        <circle cx="52" cy="23" r="2.4" fill="#ffffff"/>
      </svg>
    `,
  },
};

function dualTokenIcon(topLabel, bottomLabel, topColor, bottomColor) {
  return `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${topLabel} ${bottomLabel} mark">
      <rect width="64" height="64" rx="18" fill="#10151d"/>
      <rect x="8" y="8" width="48" height="21" rx="10.5" fill="${topColor}"/>
      <rect x="8" y="35" width="48" height="21" rx="10.5" fill="${bottomColor}"/>
      <text x="32" y="22" text-anchor="middle" font-size="11" font-weight="700" font-family="Arial, sans-serif" fill="#ffffff">${topLabel}</text>
      <text x="32" y="49" text-anchor="middle" font-size="11" font-weight="700" font-family="Arial, sans-serif" fill="#ffffff">${bottomLabel}</text>
    </svg>
  `;
}

function letterBadge(label, startColor, endColor) {
  return `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label} badge">
      <defs>
        <linearGradient id="grad-${label}" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${startColor}"/>
          <stop offset="100%" stop-color="${endColor}"/>
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#grad-${label})"/>
      <text x="32" y="38" text-anchor="middle" font-size="19" font-weight="700" font-family="Arial, sans-serif" fill="#ffffff">${label}</text>
    </svg>
  `;
}

function nasdaqFuturesIcon() {
  return `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Nasdaq futures badge">
      <defs>
        <linearGradient id="grad-nq" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#15253f"/>
          <stop offset="100%" stop-color="#416dff"/>
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#grad-nq)"/>
      <path d="M16 42V22l13 16V22h5v20h-4L21 31v11z" fill="#ffffff"/>
      <path d="M41 22h7c5 0 8 3 8 8s-3 8-8 8h-2v4h-5zm5 12h2c3 0 4.7-1.3 4.7-4S51 26 48 26h-2z" fill="#bfe1ff"/>
      <path d="M12 49h40" stroke="rgba(255,255,255,0.18)" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;
}

const clockEl = document.getElementById("clock");
const timezoneEl = document.getElementById("timezone");
const refreshNewsButton = document.getElementById("refreshNews");
const refreshMarketsButton = document.getElementById("refreshMarkets");
const warmMarketsButton = document.getElementById("warmMarkets");
const newsMeta = document.getElementById("newsMeta");
const stocksMeta = document.getElementById("stocksMeta");
const statusCard = document.getElementById("statusCard");
const statusReason = document.getElementById("statusReason");
const statusNextWindow = document.getElementById("statusNextWindow");
const eventsList = document.getElementById("eventsList");
const heroAssessment = document.getElementById("heroAssessment");
const heroAssessmentReason = document.getElementById("heroAssessmentReason");
const dailyPrepPill = document.getElementById("dailyPrepPill");
const dailyPrepEvents = document.getElementById("dailyPrepEvents");
const dailyPrepRisk = document.getElementById("dailyPrepRisk");
const dailyPrepSymbols = document.getElementById("dailyPrepSymbols");
const dailyPrepPlan = document.getElementById("dailyPrepPlan");
const vixValue = document.getElementById("vixValue");
const vixChange = document.getElementById("vixChange");
const vixReason = document.getElementById("vixReason");
const vixPill = document.getElementById("vixPill");
const watchlistEl = document.getElementById("watchlist");
const marketTabs = Array.from(document.querySelectorAll("[data-group]"));
const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
const revealEls = Array.from(document.querySelectorAll(".reveal"));

const chartShell = document.getElementById("chartShell");
const chartBadge = document.getElementById("chartBadge");
const chartEyebrow = document.getElementById("chartEyebrow");
const chartSymbol = document.getElementById("chartSymbol");
const chartDescriptor = document.getElementById("chartDescriptor");
const chartVenue = document.getElementById("chartVenue");
const chartPrice = document.getElementById("chartPrice");
const chartChange = document.getElementById("chartChange");
const chartState = document.getElementById("chartState");
const chartUpdated = document.getElementById("chartUpdated");
const chartSource = document.getElementById("chartSource");
const chartLine = document.getElementById("chartLine");
const chartArea = document.getElementById("chartArea");
const chartRange = document.getElementById("chartRange");
const chartMarker = document.getElementById("chartMarker");
const tradingviewChart = document.getElementById("tradingviewChart");

const tradeForm = document.getElementById("tradeForm");
const calcResults = document.getElementById("calcResults");
const calcMessage = document.getElementById("calcMessage");
const directionValue = document.getElementById("directionValue");
const rewardValue = document.getElementById("rewardValue");
const riskValue = document.getElementById("riskValue");
const rrValue = document.getElementById("rrValue");

const journalForm = document.getElementById("journalForm");
const clearJournalButton = document.getElementById("clearJournal");
const journalTableBody = document.getElementById("journalTableBody");
const totalTradesEl = document.getElementById("totalTrades");
const winRateEl = document.getElementById("winRate");
const avgWinnerEl = document.getElementById("avgWinner");
const avgLoserEl = document.getElementById("avgLoser");
const bestSymbolEl = document.getElementById("bestSymbol");
const worstSymbolEl = document.getElementById("worstSymbol");
const totalPnlEl = document.getElementById("totalPnl");
const bestHourEl = document.getElementById("bestHour");
const longWinRateEl = document.getElementById("longWinRate");
const shortWinRateEl = document.getElementById("shortWinRate");
const setupBreakdownEl = document.getElementById("setupBreakdown");
const aiDeskForm = document.getElementById("aiDeskForm");
const aiDeskInput = document.getElementById("aiDeskInput");
const aiDeskResponse = document.getElementById("aiDeskResponse");
const aiPromptButtons = Array.from(document.querySelectorAll("[data-ai-prompt]"));
const aiRiskState = document.getElementById("aiRiskState");
const aiWatchFocus = document.getElementById("aiWatchFocus");
const aiJournalEdge = document.getElementById("aiJournalEdge");

let activeGroup = "stocks";
let selectedInstrumentId = "CME";
let latestBoard = [];
let latestCalendarPayload = null;
let latestBoardsByGroup = {};
let latestChartPayload = null;
let latestJournalAnalytics = null;
const JOURNAL_STORAGE_KEY = "kts-trading-journal";

function cacheStatusLabel(status) {
  if (status === "live") return "Live";
  if (status === "stale") return "Rate-limited, showing last cached data";
  return "Cached";
}

function formatCacheAge(seconds, status = "cached") {
  if (seconds == null || seconds < 15) {
    return status === "live" ? "Updated just now" : "Cached just now";
  }
  if (seconds < 60) {
    return status === "live" ? "Updated just now" : "Cached just now";
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return status === "live" ? `Updated ${minutes} min ago` : `Cached ${minutes} min ago`;
  }
  const hours = Math.floor(minutes / 60);
  return status === "live" ? `Updated ${hours} hr ago` : `Cached ${hours} hr ago`;
}

function getTheme(id) {
  return BRAND_THEMES[id] || {
    cardName: id,
    venueLabel: "Market",
    descriptor: "Instrument view",
    icon: letterBadge(id.slice(0, 3), "#1d2633", "#44556f"),
  };
}

function iconMarkup(theme, label) {
  if (theme.imagePath) {
    return `<img src="${theme.imagePath}" alt="${label}" loading="lazy" />`;
  }
  return theme.icon;
}

function tradingViewSymbolForInstrument(id) {
  const symbols = {
    CME: "NASDAQ:CME",
    AAPL: "NASDAQ:AAPL",
    IBM: "NYSE:IBM",
    GBPUSD: "FX:GBPUSD",
    EURUSD: "FX:EURUSD",
    USDJPY: "FX:USDJPY",
    NQ: "CME_MINI:NQ1!",
    ES: "CME_MINI:ES1!",
    GC: "OANDA:XAUUSD",
    CL: "AMEX:USO",
  };
  return symbols[id] || "NASDAQ:CME";
}

function renderTradingViewWidget(instrumentId = selectedInstrumentId) {
  if (!tradingviewChart) return;
  if (!window.TradingView || typeof window.TradingView.widget !== "function") {
    return;
  }

  tradingviewChart.innerHTML = "";
  new window.TradingView.widget({
    autosize: true,
    symbol: tradingViewSymbolForInstrument(instrumentId),
    interval: "D",
    timezone: "America/New_York",
    theme: "dark",
    style: "1",
    locale: "en",
    hide_top_toolbar: true,
    hide_legend: true,
    allow_symbol_change: false,
    save_image: false,
    backgroundColor: "rgba(11,16,22,1)",
    gridColor: "rgba(255,255,255,0.05)",
    container_id: "tradingviewChart",
  });
}

function getTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
}

function updateClock() {
  const timezone = getTimezone();
  const now = new Date();
  clockEl.textContent = new Intl.DateTimeFormat([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZone: timezone,
  }).format(now);
  timezoneEl.textContent = timezone;
}

function statusClassFor(status) {
  if (status === "Unsafe") return "unsafe";
  if (status === "Caution") return "caution";
  return "safe";
}

function formatNumber(value) {
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatSigned(value) {
  const number = Number(value || 0);
  const prefix = number > 0 ? "+" : "";
  return `${prefix}${formatNumber(number)}`;
}

function formatAgeLabel(seconds) {
  if (seconds == null) return "fresh";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatHourLabel(hour) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 || 12;
  return `${normalized}:00 ${suffix}`;
}

function listMarkup(items) {
  return items
    .map((item) => `<div class="prep-item">${escapeHtml(item)}</div>`)
    .join("");
}

function buildPath(points, width, height, padding) {
  if (!points.length) return { line: "", area: "" };

  const values = points.map((point) => point.close);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const plotted = points.map((point, index) => {
    const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((point.close - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const line = plotted
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
  const first = plotted[0];
  const last = plotted[plotted.length - 1];
  const area = `${line} L ${last.x.toFixed(2)} ${(height - padding).toFixed(2)} L ${first.x.toFixed(2)} ${(height - padding).toFixed(2)} Z`;
  return { line, area };
}

function renderAssessment(assessment) {
  statusCard.className = `status-card ${statusClassFor(assessment.status)}`;
  statusCard.innerHTML = `
    <p class="status-label">${assessment.status}</p>
    <p class="status-summary">${assessment.summary}</p>
  `;
  statusReason.textContent = assessment.reason || "";
  statusNextWindow.textContent = assessment.nextSafeWindow || "";
  heroAssessment.textContent = assessment.summary || "Monitoring session conditions.";
  heroAssessmentReason.textContent = assessment.reason || "Monitoring volatility and scheduled events.";
}

function renderVix(snapshot) {
  if (!snapshot) {
    vixPill.className = "signal-pill neutral";
    vixPill.textContent = "Unavailable";
    vixValue.textContent = "Unavailable";
    vixChange.textContent = "Unavailable";
    vixChange.className = "vix-change muted";
    vixReason.textContent = "VIX data could not be loaded, so the safety call is leaning on scheduled events only.";
    return;
  }

  const riskClass = snapshot.riskLevel?.toLowerCase() || "neutral";
  vixPill.className = `signal-pill ${riskClass}`;
  vixPill.textContent = snapshot.isProxy ? "Proxy" : (snapshot.riskLevel || "Neutral");
  vixValue.textContent = formatNumber(snapshot.price);
  vixChange.textContent = `${formatSigned(snapshot.change)} (${formatSigned(snapshot.changePercent)}%)`;
  vixChange.className = `vix-change ${snapshot.change >= 0 ? "negative" : "positive"}`;
  vixReason.textContent = snapshot.message || "VIX is part of the risk check.";
}

function renderEvents(events) {
  if (!events.length) {
    eventsList.innerHTML = `<p class="muted">No scheduled reports found for today in your timezone.</p>`;
    return;
  }

  eventsList.innerHTML = events
    .map(
      (event) => `
        <article class="event-item">
          <div>
            <div class="event-title">${event.localTimeLabel}</div>
            <div class="event-meta">${event.localDateLabel}</div>
          </div>
          <div>
            <span class="event-pill ${event.impact.toLowerCase()}">${event.impact}</span>
          </div>
          <div>
            <div class="event-title">${event.title}</div>
            <div class="event-meta">${event.country}</div>
            <div class="event-values">Forecast: ${event.forecast || "-"} | Previous: ${event.previous || "-"} | Actual: ${event.actual || "-"}</div>
          </div>
        </article>
      `
    )
    .join("");
}

async function loadCalendar(forceRefresh = false) {
  const timezone = getTimezone();
  statusCard.className = "status-card loading";
  statusCard.innerHTML = `
    <p class="status-label">Checking calendar...</p>
    <p class="status-summary">Loading today's events and risk window.</p>
  `;
  statusReason.textContent = "";
  statusNextWindow.textContent = "";
  newsMeta.textContent = forceRefresh
    ? "Requesting a fresh calendar and volatility pull..."
    : "Checking feed health, scheduled-risk windows, and VIX.";

  try {
    const response = await fetch(`/api/calendar?tz=${encodeURIComponent(timezone)}&refresh=${forceRefresh ? "1" : "0"}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.details || payload.error || "Unknown error");

    latestCalendarPayload = payload;
    renderAssessment(payload.assessment);
    renderVix(payload.vix || null);
    renderEvents(payload.todaysEvents || []);
    renderDailyPrep();
    updateAIDeskContext();
    newsMeta.textContent = `Risk feed ${payload.cacheStatus || "live"} • ${formatAgeLabel(payload.cacheAgeSeconds)} • ${payload.sourceNote || ""}`;
  } catch (error) {
    statusCard.className = "status-card unsafe";
    statusCard.innerHTML = `
      <p class="status-label">Connection issue</p>
      <p class="status-summary">The app could not load the risk desk inputs right now.</p>
    `;
    statusReason.textContent = error.message;
    statusNextWindow.textContent = "Try refreshing in a moment.";
    heroAssessment.textContent = "Risk desk data is temporarily unavailable.";
    heroAssessmentReason.textContent = "The frontend is waiting for the calendar or VIX feed to respond.";
    renderVix(null);
    eventsList.innerHTML = `<p class="muted">Calendar data is unavailable until the feed responds.</p>`;
    newsMeta.textContent = "Risk request failed before cached data could be used.";
    latestCalendarPayload = null;
    renderDailyPrep();
    updateAIDeskContext();
  }
}

function renderTabs() {
  marketTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.group === activeGroup);
  });
}

function renderBoard(items, payload) {
  latestBoard = items;
  latestBoardsByGroup[activeGroup] = payload;
  if (!items.length) {
    watchlistEl.innerHTML = `<p class="muted">No instruments available for this market tab right now.</p>`;
    return;
  }

  watchlistEl.innerHTML = items
    .map((item) => {
      const positive = Number(item.change) >= 0;
      const liveClass = item.isMarketOpen ? "live" : "closed";
      const liveLabel = item.isMarketOpen ? "Open" : "Closed";
      const theme = getTheme(item.id);
      const cacheLabel = cacheStatusLabel(payload.cacheStatus || "cached");
      const cacheAge = formatCacheAge(payload.cacheAgeSeconds, payload.cacheStatus || "cached");
      return `
        <button class="watch-card ${item.id === selectedInstrumentId ? "active" : ""}" type="button" data-id="${item.id}">
          <div class="watch-top">
            <div class="watch-brand">
              <div class="watch-logo">${iconMarkup(theme, `${theme.cardName} icon`)}</div>
              <div>
                <div class="watch-symbol">${item.label}</div>
                <div class="watch-name">${theme.cardName}</div>
              </div>
            </div>
            <span class="watch-status ${liveClass}">${liveLabel}</span>
          </div>
          <div class="watch-price-block">
            <div class="watch-price">${formatNumber(item.price)}</div>
            <div class="watch-change ${positive ? "positive" : "negative"}">${formatSigned(item.change)} (${formatSigned(item.changePercent)}%)</div>
          </div>
          <div class="watch-meta">${item.description} • ${item.exchange || theme.venueLabel}</div>
          <div class="watch-cache">
            <span class="cache-dot ${payload.cacheStatus || "cached"}"></span>
            <span>${cacheLabel}</span>
            <span>•</span>
            <span>${cacheAge}</span>
          </div>
        </button>
      `;
    })
    .join("");

  watchlistEl.querySelectorAll("[data-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedInstrumentId = button.dataset.id || selectedInstrumentId;
      renderBoard(latestBoard, payload);
      loadChart(selectedInstrumentId);
    });
  });

  stocksMeta.textContent = `${cacheStatusLabel(payload.cacheStatus || "cached")} • ${formatCacheAge(payload.cacheAgeSeconds, payload.cacheStatus || "cached")} • ${payload.sourceNote || ""}`;
  renderDailyPrep();
  updateAIDeskContext();
}

function renderChart(payload) {
  latestChartPayload = payload;
  const points = payload.points || [];
  const { line, area } = buildPath(points, 920, 320, 24);
  const theme = getTheme(payload.id || payload.displaySymbol || payload.symbol);
  const positive = Number(payload.change) >= 0;
  const closes = points.map((point) => point.close);
  const low = closes.length ? Math.min(...closes) : 0;
  const high = closes.length ? Math.max(...closes) : 0;
  const lastIndex = Math.max(points.length - 1, 0);
  const markerX = 24 + (lastIndex / Math.max(points.length - 1, 1)) * (920 - 48);
  const markerY = (() => {
    if (!points.length) return 296;
    const range = high - low || 1;
    return 320 - 24 - ((points[lastIndex].close - low) / range) * (320 - 48);
  })();

  chartShell.classList.toggle("negative", !positive);
  chartLine.setAttribute("d", line);
  chartArea.setAttribute("d", area);
  chartMarker.setAttribute("r", points.length ? "5" : "0");
  chartMarker.setAttribute("cx", markerX.toFixed(2));
  chartMarker.setAttribute("cy", markerY.toFixed(2));
  chartBadge.innerHTML = iconMarkup(theme, `${theme.cardName} icon`);
  chartEyebrow.textContent = `${MARKET_GROUP_LABELS[activeGroup] || "Market"} View`;
  chartSymbol.textContent = payload.displaySymbol || payload.symbol;
  chartDescriptor.textContent = payload.description || theme.descriptor;
  chartVenue.textContent = payload.exchange || theme.venueLabel;
  chartVenue.className = `chart-pill ${payload.cacheStatus || "cached"}`;
  chartRange.textContent = points.length ? `Range ${formatNumber(low)} - ${formatNumber(high)}` : "Range unavailable";
  chartPrice.textContent = `${formatNumber(payload.latestPrice)} ${payload.currency || ""}`.trim();
  chartChange.textContent = `${formatSigned(payload.change)} (${formatSigned(payload.changePercent)}%)`;
  chartChange.className = `chart-stat ${positive ? "positive" : "negative"}`;
  chartState.textContent = payload.lastRefreshed || "Unknown";

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  chartUpdated.textContent = firstPoint && lastPoint
    ? `${theme.cardName} • ${firstPoint.date} to ${lastPoint.date} (${payload.timeZone})`
    : "No chart points available.";
  chartSource.textContent = `${cacheStatusLabel(payload.cacheStatus || "cached")} • ${formatCacheAge(payload.cacheAgeSeconds, payload.cacheStatus || "cached")} • ${payload.sourceNote || ""}`.trim();
  renderTradingViewWidget(payload.id || selectedInstrumentId);
  updateAIDeskContext();
}

function renderChartError(message) {
  chartShell.classList.remove("negative");
  chartLine.setAttribute("d", "");
  chartArea.setAttribute("d", "");
  chartMarker.setAttribute("r", "0");
  chartMarker.setAttribute("cx", "0");
  chartMarker.setAttribute("cy", "0");
  chartPrice.textContent = "Unavailable";
  chartChange.textContent = "Unavailable";
  chartChange.className = "chart-stat negative";
  chartState.textContent = "Unavailable";
  chartDescriptor.textContent = "Chart data could not be loaded.";
  chartUpdated.textContent = message;
  chartSource.textContent = "Chart request failed.";
  chartVenue.textContent = "Venue unavailable";
  chartVenue.className = "chart-pill";
  chartRange.textContent = "Range unavailable";
}

async function loadBoard(group = activeGroup, forceRefresh = false) {
  activeGroup = group;
  renderTabs();
  watchlistEl.innerHTML = `<p class="muted">Loading ${group} board...</p>`;
  stocksMeta.textContent = forceRefresh
    ? `Requesting fresh ${group} data from Twelve Data...`
    : `Loading ${group} board.`;

  try {
    const response = await fetch(`/api/market-board?group=${encodeURIComponent(group)}&refresh=${forceRefresh ? "1" : "0"}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.details || payload.error || "Unknown market-board error");

    const preferredIds = MARKET_GROUPS[group] || [];
    if (!preferredIds.includes(selectedInstrumentId)) {
      selectedInstrumentId = preferredIds[0];
    }
    renderBoard(payload.items || [], payload);
  } catch (error) {
    watchlistEl.innerHTML = `<p class="muted">Market board unavailable: ${error.message}</p>`;
    stocksMeta.textContent = error.message || `Failed to load ${group} board.`;
  }
}

async function loadChart(instrumentId = selectedInstrumentId, forceRefresh = false) {
  chartUpdated.textContent = `Loading ${instrumentId} chart...`;
  try {
    const response = await fetch(`/api/chart?id=${encodeURIComponent(instrumentId)}&refresh=${forceRefresh ? "1" : "0"}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.details || payload.error || "Unknown chart error");
    renderChart(payload);
  } catch (error) {
    renderChartError(error.message);
  }
}

function calculateTrade(entry, tp, sl) {
  const reward = Math.abs(tp - entry);
  const risk = Math.abs(entry - sl);
  let direction = "Invalid";
  if (tp > entry && sl < entry) direction = "Long";
  else if (tp < entry && sl > entry) direction = "Short";
  if (!reward || !risk || direction === "Invalid") {
    return { ok: false, message: "Use a valid long setup (TP above, SL below) or short setup (TP below, SL above)." };
  }
  return { ok: true, direction, reward, risk, rr: reward / risk };
}

function setupSectionReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    { threshold: 0.18 }
  );

  revealEls.forEach((element) => observer.observe(element));
}

function setupNavTracking() {
  const sections = navLinks
    .map((link) => {
      const target = document.querySelector(link.getAttribute("href"));
      return target ? { link, target } : null;
    })
    .filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const match = sections.find((item) => item.target === entry.target);
        if (match && entry.isIntersecting) {
          navLinks.forEach((link) => link.classList.remove("is-active"));
          match.link.classList.add("is-active");
        }
      });
    },
    { rootMargin: "-35% 0px -45% 0px", threshold: 0.05 }
  );

  sections.forEach((item) => observer.observe(item.target));
}

function buildJournalAnalytics(entries) {
  const totalTrades = entries.length;
  const winners = entries.filter((entry) => entry.pnl > 0);
  const losers = entries.filter((entry) => entry.pnl < 0);
  const totalPnl = entries.reduce((sum, entry) => sum + entry.pnl, 0);
  const winRate = totalTrades ? (winners.length / totalTrades) * 100 : 0;
  const avgWinner = winners.length ? winners.reduce((sum, entry) => sum + entry.pnl, 0) / winners.length : 0;
  const avgLoser = losers.length ? losers.reduce((sum, entry) => sum + entry.pnl, 0) / losers.length : 0;

  const symbolGroups = entries.reduce((accumulator, entry) => {
    accumulator[entry.symbol] = accumulator[entry.symbol] || { total: 0, count: 0 };
    accumulator[entry.symbol].total += entry.pnl;
    accumulator[entry.symbol].count += 1;
    return accumulator;
  }, {});

  const rankedSymbols = Object.entries(symbolGroups).sort((a, b) => b[1].total - a[1].total);
  const bestSymbol = rankedSymbols[0]?.[0] || "-";
  const worstSymbol = rankedSymbols[rankedSymbols.length - 1]?.[0] || "-";

  const hourGroups = entries.reduce((accumulator, entry) => {
    const date = new Date(entry.dateTime);
    if (Number.isNaN(date.getTime())) return accumulator;
    const hour = date.getHours();
    accumulator[hour] = accumulator[hour] || { total: 0, count: 0, wins: 0 };
    accumulator[hour].total += entry.pnl;
    accumulator[hour].count += 1;
    if (entry.pnl > 0) accumulator[hour].wins += 1;
    return accumulator;
  }, {});

  const rankedHours = Object.entries(hourGroups).sort((a, b) => b[1].total - a[1].total);
  const bestHour = rankedHours.length ? formatHourLabel(Number(rankedHours[0][0])) : "-";

  const directionStats = entries.reduce((accumulator, entry) => {
    const direction = entry.direction || "Unknown";
    accumulator[direction] = accumulator[direction] || { count: 0, wins: 0 };
    accumulator[direction].count += 1;
    if (entry.pnl > 0) accumulator[direction].wins += 1;
    return accumulator;
  }, {});

  const longWinRate = directionStats.Long?.count ? (directionStats.Long.wins / directionStats.Long.count) * 100 : 0;
  const shortWinRate = directionStats.Short?.count ? (directionStats.Short.wins / directionStats.Short.count) * 100 : 0;

  const setups = entries.reduce((accumulator, entry) => {
    const label = entry.setup || "Unlabeled";
    accumulator[label] = accumulator[label] || { count: 0, wins: 0, pnl: 0 };
    accumulator[label].count += 1;
    accumulator[label].pnl += entry.pnl;
    if (entry.pnl > 0) accumulator[label].wins += 1;
    return accumulator;
  }, {});

  const setupBreakdown = Object.entries(setups)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([setup, stats]) => ({
      setup,
      count: stats.count,
      pnl: stats.pnl,
      winRate: stats.count ? (stats.wins / stats.count) * 100 : 0,
    }));

  return {
    totalTrades,
    winRate,
    avgWinner,
    avgLoser,
    totalPnl,
    bestSymbol,
    worstSymbol,
    bestHour,
    longWinRate,
    shortWinRate,
    setupBreakdown,
  };
}

function getWatchCandidates() {
  const sourceBoard = latestBoardsByGroup.stocks?.items || latestBoard || [];
  return sourceBoard
    .slice()
    .sort((a, b) => Math.abs(Number(b.changePercent || 0)) - Math.abs(Number(a.changePercent || 0)))
    .slice(0, 3);
}

function buildTradingPlanLines() {
  const assessment = latestCalendarPayload?.assessment;
  const vix = latestCalendarPayload?.vix;
  const lines = [];

  if (!assessment) {
    return ["Wait for the risk desk to finish loading before planning the session."];
  }

  if (assessment.status === "Unsafe") {
    lines.push("Stand down on aggressive entries until the current risk window clears.");
    lines.push(assessment.nextSafeWindow || "Wait for volatility and event pressure to settle.");
  } else if (assessment.status === "Caution") {
    lines.push("Trade smaller and only take clean A-grade setups around obvious levels.");
    lines.push(assessment.nextSafeWindow || "Stay selective while event or volatility pressure remains elevated.");
  } else {
    lines.push("Focus on clean continuation or pullback setups while the calendar stays quiet.");
    lines.push("Keep size disciplined and re-check risk before each new entry.");
  }

  if (vix?.riskLevel === "Caution" || vix?.riskLevel === "Unsafe") {
    lines.push("Respect wider swings because volatility is elevated.");
  }

  const journalHint = latestJournalAnalytics?.bestSymbol;
  if (journalHint && journalHint !== "-") {
    lines.push(`If conditions line up, lean toward the symbols where your journal edge has been stronger, starting with ${journalHint}.`);
  }

  return lines.slice(0, 3);
}

function renderDailyPrep() {
  const assessment = latestCalendarPayload?.assessment;
  const vix = latestCalendarPayload?.vix;
  const events = latestCalendarPayload?.todaysEvents || [];
  const watchCandidates = getWatchCandidates();

  if (!assessment) {
    dailyPrepPill.className = "signal-pill neutral";
    dailyPrepPill.textContent = "Pending";
    dailyPrepEvents.textContent = "Loading today's calendar focus...";
    dailyPrepRisk.textContent = "Checking current session risk...";
    dailyPrepSymbols.textContent = "Waiting for the market board...";
    dailyPrepPlan.textContent = "Building the desk plan...";
    return;
  }

  const keyEvents = events.slice(0, 3).map((event) => `${event.localTimeLabel} • ${event.impact} • ${event.title}`);
  const riskLines = [
    `${assessment.status}: ${assessment.summary}`,
    vix ? `Volatility state: ${vix.riskLevel || "Neutral"} at ${formatNumber(vix.price)}.` : "Volatility state unavailable.",
  ];
  const symbolLines = watchCandidates.length
    ? watchCandidates.map((item) => `${item.label} • ${formatSigned(item.changePercent)}% • ${item.description}`)
    : ["Market board still loading. Start with CME, AAPL, and IBM once the board is ready."];
  const planLines = buildTradingPlanLines();

  dailyPrepPill.className = `signal-pill ${statusClassFor(assessment.status)}`;
  dailyPrepPill.textContent = assessment.status;
  dailyPrepEvents.innerHTML = listMarkup(keyEvents.length ? keyEvents : ["No major scheduled reports are showing for today."]);
  dailyPrepRisk.innerHTML = listMarkup(riskLines);
  dailyPrepSymbols.innerHTML = listMarkup(symbolLines);
  dailyPrepPlan.innerHTML = listMarkup(planLines);
}

function renderSetupBreakdown(analytics) {
  if (!analytics || !analytics.setupBreakdown.length) {
    setupBreakdownEl.textContent = "No setup data yet.";
    return;
  }

  setupBreakdownEl.innerHTML = analytics.setupBreakdown
    .map(
      (item) => `
        <div class="setup-row">
          <div>
            <div class="setup-name">${escapeHtml(item.setup)}</div>
            <div class="setup-meta">${item.count} trades • ${formatNumber(item.winRate)}% win rate</div>
          </div>
          <div class="setup-pnl ${item.pnl >= 0 ? "positive" : "negative"}">${formatSigned(item.pnl)}</div>
        </div>
      `
    )
    .join("");
}

function updateAIDeskContext() {
  const assessment = latestCalendarPayload?.assessment;
  const watchCandidates = getWatchCandidates();
  aiRiskState.textContent = assessment?.status || "Pending";
  aiWatchFocus.textContent = watchCandidates[0]?.label || (latestChartPayload?.displaySymbol || "Pending");
  aiJournalEdge.textContent = latestJournalAnalytics?.bestSymbol || "Pending";
}

function buildAIDeskAnswer(prompt) {
  const normalized = (prompt || "").trim().toLowerCase();
  const assessment = latestCalendarPayload?.assessment;
  const events = latestCalendarPayload?.todaysEvents || [];
  const vix = latestCalendarPayload?.vix;
  const watchCandidates = getWatchCandidates();
  const analytics = latestJournalAnalytics;

  if (!assessment) {
    return "The desk is still loading risk data. Wait for the calendar and volatility inputs before relying on a session summary.";
  }

  if (normalized.includes("journal")) {
    if (!analytics || !analytics.totalTrades) {
      return "Your journal does not have enough trades logged yet to suggest a clear edge. Start by logging a few sessions so the desk can compare symbols, setups, and timing.";
    }
    const setupLead = analytics.setupBreakdown[0];
    return `Your journal is showing ${analytics.totalTrades} trades with a ${formatNumber(analytics.winRate)}% win rate and total PnL of ${formatSigned(analytics.totalPnl)}. Your strongest symbol so far is ${analytics.bestSymbol}, your weaker symbol is ${analytics.worstSymbol}, and your best trading hour has been ${analytics.bestHour}. ${setupLead ? `Your most active setup is ${setupLead.setup} with ${setupLead.count} trades and ${formatNumber(setupLead.winRate)}% win rate.` : ""}`.trim();
  }

  if (normalized.includes("safer") || normalized.includes("safe")) {
    return `${assessment.status}: ${assessment.summary} ${assessment.reason || ""} ${assessment.nextSafeWindow || ""}`.trim();
  }

  if (normalized.includes("watch")) {
    const eventLine = events[0]
      ? `The first event to respect is ${events[0].title} at ${events[0].localTimeLabel}.`
      : "There are no major scheduled reports crowding the session right now.";
    const symbolLine = watchCandidates.length
      ? `The desk would watch ${watchCandidates.map((item) => item.label).join(", ")} first because they are moving the most on the loaded board.`
      : "The market board is still loading, so start by checking the default equities board.";
    return `${eventLine} ${symbolLine} ${vix ? `Volatility is reading ${vix.riskLevel || "Neutral"} at ${formatNumber(vix.price)}.` : ""}`.trim();
  }

  return `Today's setup leans ${assessment.status.toLowerCase()}: ${assessment.summary} ${events[0] ? `The nearest scheduled event is ${events[0].title} at ${events[0].localTimeLabel}.` : "The calendar looks relatively quiet."} ${watchCandidates.length ? `Primary symbols to watch are ${watchCandidates.map((item) => item.label).join(", ")}.` : ""} ${analytics?.totalTrades ? `Your journal edge currently looks best in ${analytics.bestSymbol}.` : ""}`.trim();
}

function renderAIDeskAnswer(prompt) {
  aiDeskResponse.textContent = buildAIDeskAnswer(prompt);
}

function loadJournalEntries() {
  try {
    return JSON.parse(localStorage.getItem(JOURNAL_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveJournalEntries(entries) {
  localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries));
}

function renderJournal(entries) {
  if (!entries.length) {
    journalTableBody.innerHTML = `<tr><td colspan="7" class="muted">No trades logged yet.</td></tr>`;
  } else {
    journalTableBody.innerHTML = entries
      .slice()
      .reverse()
      .map(
        (entry) => `
          <tr>
            <td>${entry.symbol}</td>
            <td>${entry.dateTime}</td>
            <td>${entry.direction}</td>
            <td>${formatNumber(entry.entry)}</td>
            <td>${formatNumber(entry.exit)}</td>
            <td class="${entry.pnl >= 0 ? "positive" : "negative"}">${formatSigned(entry.pnl)}</td>
            <td>${entry.setup || "-"}</td>
          </tr>
        `
      )
      .join("");
  }

  const analytics = buildJournalAnalytics(entries);
  latestJournalAnalytics = analytics;
  totalTradesEl.textContent = String(analytics.totalTrades);
  winRateEl.textContent = `${formatNumber(analytics.winRate)}%`;
  totalPnlEl.textContent = formatSigned(analytics.totalPnl);
  totalPnlEl.className = analytics.totalPnl >= 0 ? "positive" : "negative";
  avgWinnerEl.textContent = formatNumber(analytics.avgWinner);
  avgLoserEl.textContent = formatNumber(analytics.avgLoser);
  bestSymbolEl.textContent = analytics.bestSymbol;
  worstSymbolEl.textContent = analytics.worstSymbol;
  bestHourEl.textContent = analytics.bestHour;
  longWinRateEl.textContent = `${formatNumber(analytics.longWinRate)}%`;
  shortWinRateEl.textContent = `${formatNumber(analytics.shortWinRate)}%`;
  renderSetupBreakdown(analytics);
  renderDailyPrep();
  updateAIDeskContext();
}

tradeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const entry = Number(document.getElementById("entryPrice").value);
  const tp = Number(document.getElementById("tpPrice").value);
  const sl = Number(document.getElementById("slPrice").value);
  const result = calculateTrade(entry, tp, sl);
  if (!result.ok) {
    calcResults.classList.add("hidden");
    calcMessage.textContent = result.message;
    return;
  }

  calcResults.classList.remove("hidden");
  directionValue.textContent = result.direction;
  rewardValue.textContent = formatNumber(result.reward);
  riskValue.textContent = formatNumber(result.risk);
  rrValue.textContent = `1 : ${formatNumber(result.rr)}`;
  calcMessage.textContent = "Trade numbers updated from your three price inputs.";
});

journalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const entries = loadJournalEntries();
  const newEntry = {
    symbol: document.getElementById("journalSymbol").value.trim().toUpperCase(),
    dateTime: document.getElementById("journalDateTime").value,
    direction: document.getElementById("journalDirection").value,
    entry: Number(document.getElementById("journalEntry").value),
    exit: Number(document.getElementById("journalExit").value),
    stop: Number(document.getElementById("journalStop").value || 0),
    takeProfit: Number(document.getElementById("journalTakeProfit").value || 0),
    size: Number(document.getElementById("journalSize").value || 0),
    pnl: Number(document.getElementById("journalPnl").value),
    setup: document.getElementById("journalSetup").value.trim(),
    notes: document.getElementById("journalNotes").value.trim(),
  };
  entries.push(newEntry);
  saveJournalEntries(entries);
  renderJournal(entries);
  journalForm.reset();
});

clearJournalButton.addEventListener("click", () => {
  saveJournalEntries([]);
  renderJournal([]);
});

aiDeskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  renderAIDeskAnswer(aiDeskInput.value);
});

aiPromptButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const prompt = button.dataset.aiPrompt || "";
    aiDeskInput.value = prompt;
    renderAIDeskAnswer(prompt);
  });
});

refreshNewsButton.addEventListener("click", () => loadCalendar(true));
refreshMarketsButton.addEventListener("click", async () => {
  await loadBoard(activeGroup, true);
  await loadChart(selectedInstrumentId, true);
});

warmMarketsButton.addEventListener("click", async () => {
  stocksMeta.textContent = "Warming market cache with gentle spacing for free-tier limits...";
  try {
    const response = await fetch("/api/warm-market-cache");
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.details || payload.error || "Warm cache request failed");
    const summaries = (payload.results || [])
      .map((item) => `${item.group}: ${cacheStatusLabel(item.cacheStatus || "cached")}`)
      .join(" • ");
    stocksMeta.textContent = summaries || "Market cache warm-up completed.";
    await loadBoard(activeGroup, false);
    await loadChart(selectedInstrumentId, false);
  } catch (error) {
    stocksMeta.textContent = error.message || "Warm cache request failed.";
  }
});

marketTabs.forEach((tab) => {
  tab.addEventListener("click", async () => {
    const nextGroup = tab.dataset.group || "stocks";
    await loadBoard(nextGroup, false);
    await loadChart(selectedInstrumentId, false);
  });
});

updateClock();
loadCalendar();
loadBoard("stocks").then(() => loadChart(selectedInstrumentId));
renderJournal(loadJournalEntries());
setupSectionReveal();
setupNavTracking();
setInterval(updateClock, 1000);

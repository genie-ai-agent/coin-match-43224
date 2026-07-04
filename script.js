(function () {
  const $ = (sel) => document.querySelector(sel);
  const state = {
    idx: 0,
    answers: [],  // one axes object per question
    prices: {},   // id -> {usd, change24h}
  };

  // ---------- LIVE PRICES ----------
  const COIN_IDS = window.COINS.map(c => c.id);

  async function loadPrices() {
    const cacheKey = "cm_prices_" + new Date().toISOString().slice(0, 13); // hourly
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        state.prices = JSON.parse(cached);
        renderTicker();
        return;
      }
    } catch (_) {}

    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${COIN_IDS.join(",")}&vs_currencies=usd&include_24hr_change=true`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      const out = {};
      for (const id of COIN_IDS) {
        if (data[id]) {
          out[id] = {
            usd: data[id].usd,
            change24h: data[id].usd_24h_change ?? 0
          };
        }
      }
      state.prices = out;
      try { localStorage.setItem(cacheKey, JSON.stringify(out)); } catch (_) {}
      renderTicker();
    } catch (e) {
      // graceful fallback — no live prices, quiz still works
      state.prices = {};
      renderTicker();
    }
  }

  function fmtPrice(v) {
    if (v == null) return "$--";
    if (v >= 1000) return "$" + v.toLocaleString("en-US", { maximumFractionDigits: 0 });
    if (v >= 1) return "$" + v.toLocaleString("en-US", { maximumFractionDigits: 2 });
    if (v >= 0.01) return "$" + v.toFixed(4);
    return "$" + v.toExponential(2);
  }
  function fmtChange(c) {
    if (c == null || isNaN(c)) return "±0.00%";
    const s = c >= 0 ? "+" : "";
    return `${s}${c.toFixed(2)}%`;
  }

  function renderTicker() {
    const t = $("#ticker");
    if (!t) return;
    const pill = c => {
      const p = state.prices[c.id];
      if (!p) {
        return `<span class="ticker-pill"><span class="sym">${c.symbol}</span><span class="flat">--</span></span>`;
      }
      const dir = p.change24h >= 0 ? "up" : "down";
      const arrow = p.change24h >= 0 ? "↗" : "↘";
      return `<span class="ticker-pill"><span class="sym">${c.symbol}</span><span class="px">${fmtPrice(p.usd)}</span><span class="${dir}">${arrow} ${fmtChange(p.change24h)}</span></span>`;
    };
    const one = window.COINS.map(pill).join("");
    // duplicate for seamless -50% translate loop
    t.innerHTML = one + one;
  }

  // ---------- QUIZ ----------
  function startQuiz() {
    state.idx = 0;
    state.answers = [];
    $("#intro").classList.add("hidden");
    $("#result").classList.add("hidden");
    $("#quiz").classList.remove("hidden");
    $("#qtotal").textContent = String(window.QUESTIONS.length).padStart(2, "0");
    renderQuestion();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderQuestion() {
    const q = window.QUESTIONS[state.idx];
    $("#qnum").textContent = String(state.idx + 1).padStart(2, "0");
    $("#progress-fill").style.width = ((state.idx) / window.QUESTIONS.length * 100) + "%";

    const container = $("#question");
    container.innerHTML = "";
    const promptEl = document.createElement("div");
    promptEl.className = "q-prompt";
    promptEl.textContent = q.prompt;
    container.appendChild(promptEl);

    if (q.hint) {
      const hint = document.createElement("div");
      hint.className = "q-hint";
      hint.textContent = q.hint;
      container.appendChild(hint);
    }

    const choices = document.createElement("div");
    choices.className = "choices";
    q.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.className = "choice";
      btn.type = "button";
      btn.innerHTML = `<span class="key">${String.fromCharCode(65 + i)}.</span><span>${opt.label}</span>`;
      btn.addEventListener("click", () => selectOption(opt));
      choices.appendChild(btn);
    });
    container.appendChild(choices);
  }

  function selectOption(opt) {
    state.answers.push(opt.axes);
    state.idx += 1;
    if (state.idx >= window.QUESTIONS.length) {
      finish();
    } else {
      renderQuestion();
    }
  }

  // ---------- SCORING ----------
  function averageAxes(list) {
    const keys = ["risk", "conviction", "horizon", "thrill"];
    const acc = { risk: 0, conviction: 0, horizon: 0, thrill: 0 };
    list.forEach(a => keys.forEach(k => acc[k] += a[k]));
    keys.forEach(k => acc[k] = acc[k] / list.length);
    return acc;
  }

  function matchScore(userAxes, coinAxes) {
    // euclidean distance across 4 axes; convert to % match
    const keys = ["risk", "conviction", "horizon", "thrill"];
    let sq = 0;
    keys.forEach(k => {
      const d = userAxes[k] - coinAxes[k];
      sq += d * d;
    });
    const dist = Math.sqrt(sq);
    // max distance across 4 axes with 0..10 range = sqrt(4*100)=20
    const pct = Math.max(0, Math.min(100, Math.round((1 - dist / 20) * 100)));
    return { dist, pct };
  }

  function rankCoins(userAxes) {
    return window.COINS
      .map(c => ({ coin: c, ...matchScore(userAxes, c.axes) }))
      .sort((a, b) => a.dist - b.dist);
  }

  // ---------- RESULT ----------
  function finish() {
    const userAxes = averageAxes(state.answers);
    const ranked = rankCoins(userAxes);
    const winner = ranked[0];
    const runners = ranked.slice(1, 5);

    $("#progress-fill").style.width = "100%";
    $("#quiz").classList.add("hidden");

    const r = $("#result");
    r.classList.remove("hidden");
    r.innerHTML = renderResultHTML(winner, runners, userAxes);

    $("#retake").addEventListener("click", startQuiz);
    $("#share").addEventListener("click", () => {
      const text = `my crypto personality match: ${winner.coin.symbol} (${winner.pct}% fit) via COIN//MATCH`;
      if (navigator.share) {
        navigator.share({ text, url: location.href }).catch(() => {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(text + " " + location.href);
        const btn = $("#share");
        const orig = btn.textContent;
        btn.textContent = "copied ✓";
        setTimeout(() => btn.textContent = orig, 1600);
      }
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderResultHTML(winner, runners, userAxes) {
    const c = winner.coin;
    const p = state.prices[c.id];
    const priceHTML = p
      ? `<div class="price">${fmtPrice(p.usd)}</div>
         <div class="delta ${p.change24h >= 0 ? "up" : "down"}">${p.change24h >= 0 ? "↗" : "↘"} ${fmtChange(p.change24h)} today</div>`
      : `<div class="price">—</div><div class="delta flat">price loading…</div>`;

    const axisRow = (label, val) => `
      <div class="axis">
        <div class="axis-label">${label}</div>
        <div class="axis-bar"><div class="axis-fill" style="width:${val * 10}%"></div></div>
        <div class="axis-val">${val.toFixed(1)}</div>
      </div>`;

    const runnersHTML = runners.map(r => `
      <div class="runner">
        <div><span class="sym">${r.coin.symbol}</span><span class="name">${r.coin.name}</span></div>
        <div class="match">${r.pct}% fit</div>
      </div>`).join("");

    return `
      <div class="result-head">
        <span class="ok">your match</span>
        <span>${winner.pct}% fit</span>
      </div>

      <div class="coin-hero">
        <div class="coin-symbol">${c.symbol}</div>
        <div class="coin-meta">
          <div class="coin-name">${c.name}</div>
          <div class="coin-tag">${c.tag}</div>
        </div>
        <div class="price-block">${priceHTML}</div>
      </div>

      <p class="blurb">${c.blurb}</p>

      <div class="section-label">your money personality</div>
      <div class="axes">
        ${axisRow("RISK", userAxes.risk)}
        ${axisRow("CONVICTION", userAxes.conviction)}
        ${axisRow("HORIZON", userAxes.horizon)}
        ${axisRow("THRILL", userAxes.thrill)}
      </div>

      <div class="section-label">why you two click</div>
      <ul class="traits">
        ${c.traits.map(t => `<li>${t}</li>`).join("")}
      </ul>

      <div class="section-label">runners-up</div>
      <div class="runners">${runnersHTML}</div>

      <div class="actions">
        <button id="retake" class="btn primary">retake the quiz</button>
        <button id="share" class="btn">share my match</button>
      </div>

      <div class="disclaimer">
        <strong>a note:</strong> this is a personality quiz, not financial advice. crypto is volatile. do your own research and only invest what you can afford to lose.
      </div>
    `;
  }

  // ---------- INIT ----------
  document.addEventListener("DOMContentLoaded", () => {
    $("#start").addEventListener("click", startQuiz);
    loadPrices();
  });
})();

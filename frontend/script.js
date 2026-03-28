// frontend/script.js

// ---------------------------
// DOM helpers
// ---------------------------
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

// Core elements
const runBtn = $("#runBtn");
const rerunBtn = $("#rerunBtn");
const exportCsvBtn = $("#exportCsvBtn");
const shareLinkBtn = $("#shareLinkBtn");
const toastEl = $("#toast");

const decisionAInput = $("#decisionA");
const decisionBInput = $("#decisionB");
const descriptionAInput = $("#descriptionA");
const descriptionBInput = $("#descriptionB");
const riskInput = $("#risk");
const yearsInput = $("#years");
const runsInput = $("#runs");
const narrativeModeInput = $("#narrativeMode");

const resultSection = $("#result");
const resultsGrid = $("#resultsGrid");
const probBars = $("#probBars");
const distributionGrid = $("#distributionGrid");
const scenarioGrid = $("#scenarioGrid");
const recommendedEl = $("#recommended");
const narrativeTextEl = $("#narrativeText");
const comparisonBlock = $("#comparisonBlock");
const primaryModelLabel = $("#primaryModelLabel");
const secondaryModelLabel = $("#secondaryModelLabel");
const primaryModelText = $("#primaryModelText");
const secondaryModelText = $("#secondaryModelText");

const trackFill = $("#trackFill");
const trackLabelA = $("#trackLabelA");
const trackLabelB = $("#trackLabelB");

const charCountA = $("#charCountA");
const charCountB = $("#charCountB");

const nowPlayingText = $("#nowPlayingText");

// Spinner assumption: .is-loading class on runBtn toggles spinner visibility
const RUN_BTN_LOADING_CLASS = "is-loading";
const HIDDEN_CLASS = "hidden";

// ---------------------------
// State
// ---------------------------
let lastSimulationResponse = null;
let narrativeTypingTimeout = null;

// ---------------------------
// Utilities
// ---------------------------

const formatCurrencyINR = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value, decimals = 2) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "0";
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

// Copy text to clipboard with fallback
const copyToClipboard = async (text) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    const temp = document.createElement("textarea");
    temp.value = text;
    temp.style.position = "fixed";
    temp.style.opacity = "0";
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    document.body.removeChild(temp);
  }
};

const showToast = (message, type = "error", duration = 3500) => {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.remove("toast-success", "toast-error", HIDDEN_CLASS);
  toastEl.classList.add(type === "success" ? "toast-success" : "toast-error");

  setTimeout(() => {
    toastEl.classList.add(HIDDEN_CLASS);
  }, duration);
};

const scrollToElement = (el) => {
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
};

// ---------------------------
// Feature 1: Char counters
// ---------------------------

const MAX_DESCRIPTION_CHARS = 300;
const SOFT_LIMIT_WARNING = 280;

const updateCharCounter = (textarea, counterEl) => {
  if (!textarea || !counterEl) return;
  const length = textarea.value.length;
  counterEl.textContent = `${length} / ${MAX_DESCRIPTION_CHARS}`;
  if (length > SOFT_LIMIT_WARNING) {
    counterEl.classList.add("over-limit");
  } else {
    counterEl.classList.remove("over-limit");
  }
};

const initCharCounters = () => {
  if (descriptionAInput && charCountA) {
    descriptionAInput.addEventListener("input", () =>
      updateCharCounter(descriptionAInput, charCountA)
    );
    updateCharCounter(descriptionAInput, charCountA);
  }

  if (descriptionBInput && charCountB) {
    descriptionBInput.addEventListener("input", () =>
      updateCharCounter(descriptionBInput, charCountB)
    );
    updateCharCounter(descriptionBInput, charCountB);
  }
};

// ---------------------------
// Feature 2: Preset buttons
// ---------------------------

const PRESETS = {
  startup: {
    decisionA: "Join early‑stage startup",
    decisionB: "Join stable corporate role",
    descriptionA:
      "You join a fast‑growing startup with high upside but uncertain cash flow, long hours, and a lot of learning by doing.",
    descriptionB:
      "You join a well‑known corporate with predictable salary, structured growth, and clearer work‑life balance.",
  },
  grad: {
    decisionA: "Pursue grad school",
    decisionB: "Start full‑time work",
    descriptionA:
      "You enroll in a competitive graduate program, delay income for a few years, and aim for higher long‑term earnings.",
    descriptionB:
      "You start working immediately, build experience, and potentially upskill on the side instead of a formal degree.",
  },
  house: {
    decisionA: "Buy a house",
    decisionB: "Keep renting",
    descriptionA:
      "You buy a house with a mortgage, commit to EMIs, and build equity over time, exposed to property market swings.",
    descriptionB:
      "You continue renting, keep flexibility to move, and invest the surplus capital into diversified assets instead.",
  },
};

const applyPreset = (presetKey) => {
  const preset = PRESETS[presetKey];
  if (!preset) return;

  if (decisionAInput) decisionAInput.value = preset.decisionA;
  if (decisionBInput) decisionBInput.value = preset.decisionB;
  if (descriptionAInput) descriptionAInput.value = preset.descriptionA;
  if (descriptionBInput) descriptionBInput.value = preset.descriptionB;

  // Update counters and labels
  updateCharCounter(descriptionAInput, charCountA);
  updateCharCounter(descriptionBInput, charCountB);
  if (trackLabelA && decisionAInput) trackLabelA.textContent = decisionAInput.value || "Path A";
  if (trackLabelB && decisionBInput) trackLabelB.textContent = decisionBInput.value || "Path B";

  // Optionally update now playing text to reflect preset
  if (nowPlayingText && runsInput && decisionAInput && decisionBInput) {
    const runs = runsInput.value || "0";
    nowPlayingText.textContent = `Ready to run ${runs} timelines for ${decisionAInput.value} vs ${decisionBInput.value}…`;
  }
};

const initPresets = () => {
  $$(".preset-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const presetKey =Here’s a complete, self‑contained plan: every terminal command, then a full `frontend/script.js` implementation that wires all features to your existing HTML.

---

## 1. Git workflow commands

From your repo root (`lifesim-montecarlo`):

```bash
# 1) Make sure you’re on main and up to date
git checkout main
git pull origin main

# 2) Create and switch to your feature branch
git checkout -b feature/frontend-logic
```

Do your coding work (replace `frontend/script.js` with the file below), then:

```bash
# 3) See what changed
git status
git diff frontend/script.js

# 4) Stage the file
git add frontend/script.js

# 5) Commit with the requested message
git commit -m "feat: full JS logic with animations and backend integration"

# 6) Push the branch to GitHub
git push origin feature/frontend-logic
```

Then in GitHub’s UI:

1. Open the `lifesim-montecarlo` repo.
2. You’ll see a banner for `feature/frontend-logic`; click “Compare & pull request”.
3. Base branch: `main`, compare: `feature/frontend-logic`.
4. Fill PR title/description, then click “Create pull request”.

[web:1]

---

## 2. Full `frontend/script.js`

Replace everything in `frontend/script.js` with this complete implementation:

```js
/* global navigator, window, document */

(() => {
  const API_URL = "http://localhost:8000/simulate";

  // Cached DOM elements
  const els = {
    runBtn: document.getElementById("runBtn"),
    rerunBtn: document.getElementById("rerunBtn"),
    exportCsvBtn: document.getElementById("exportCsvBtn"),
    shareLinkBtn: document.getElementById("shareLinkBtn"),
    decisionA: document.getElementById("decisionA"),
    decisionB: document.getElementById("decisionB"),
    descriptionA: document.getElementById("descriptionA"),
    descriptionB: document.getElementById("descriptionB"),
    risk: document.getElementById("risk"),
    years: document.getElementById("years"),
    runs: document.getElementById("runs"),
    narrativeMode: document.getElementById("narrativeMode"),
    resultSection: document.getElementById("result"),
    resultsGrid: document.getElementById("resultsGrid"),
    probBars: document.getElementById("probBars"),
    distributionGrid: document.getElementById("distributionGrid"),
    scenarioGrid: document.getElementById("scenarioGrid"),
    recommended: document.getElementById("recommended"),
    narrativeText: document.getElementById("narrativeText"),
    comparisonBlock: document.getElementById("comparisonBlock"),
    primaryModelLabel: document.getElementById("primaryModelLabel"),
    secondaryModelLabel: document.getElementById("secondaryModelLabel"),
    primaryModelText: document.getElementById("primaryModelText"),
    secondaryModelText: document.getElementById("secondaryModelText"),
    toast: document.getElementById("toast"),
    trackFill: document.getElementById("trackFill"),
    trackLabelA: document.getElementById("trackLabelA"),
    trackLabelB: document.getElementById("trackLabelB"),
    charCountA: document.getElementById("charCountA"),
    charCountB: document.getElementById("charCountB"),
    nowPlayingText: document.getElementById("nowPlayingText")
  };

  const MAX_CHARS = 300;
  const WARN_THRESHOLD = 280;
  const NARRATIVE_CHAR_DELAY = 18; // ms per character

  let lastSimulationResponse = null;
  let narrativeTimeoutId = null;

  // ---------- Utility helpers ----------

  const formatCurrencyINR = (value) => {
    if (value == null || Number.isNaN(value)) return "₹0";
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
      }).format(value);
    } catch {
      return `₹${Math.round(value).toLocaleString("en-IN")}`;
    }
  };

  const formatNumber = (value, fractionDigits = 2) => {
    if (value == null || Number.isNaN(value)) return "0";
    return Number(value).toLocaleString("en-IN", {
      maximumFractionDigits: fractionDigits
    });
  };

  const clearElement = (el) => {
    if (el) el.innerHTML = "";
  };

  const hideElement = (el) => {
    if (el && !el.classList.contains("hidden")) {
      el.classList.add("hidden");
    }
  };

  const showElement = (el) => {
    if (el && el.classList.contains("hidden")) {
      el.classList.remove("hidden");
    }
  };

  const showToast = (message, type = "error", duration = 3000) => {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.classList.remove("hidden", "toast-error", "toast-success");
    const cls = type === "success" ? "toast-success" : "toast-error";
    els.toast.classList.add(cls);

    setTimeout(() => {
      els.toast.classList.add("hidden");
    }, duration);
  };

  const scrollToElement = (el) => {
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const setNowPlaying = (text) => {
    if (!els.nowPlayingText) return;
    els.nowPlayingText.textContent = text;
  };

  // ---------- Feature 1 — Char counters ----------

  const updateCharCounter = (textarea, counterEl) => {
    if (!textarea || !counterEl) return;
    const length = textarea.value.length;
    counterEl.textContent = `${length} / ${MAX_CHARS}`;
    if (length > WARN_THRESHOLD) {
      counterEl.classList.add("text-red");
    } else {
      counterEl.classList.remove("text-red");
    }
  };

  const initCharCounters = () => {
    if (els.descriptionA && els.charCountA) {
      updateCharCounter(els.descriptionA, els.charCountA);
      els.descriptionA.addEventListener("input", () =>
        updateCharCounter(els.descriptionA, els.charCountA)
      );
    }
    if (els.descriptionB && els.charCountB) {
      updateCharCounter(els.descriptionB, els.charCountB);
      els.descriptionB.addEventListener("input", () =>
        updateCharCounter(els.descriptionB, els.charCountB)
      );
    }
  };

  // ---------- Feature 2 — Preset buttons ----------

  const applyPreset = (preset) => {
    if (!els.decisionA || !els.decisionB || !els.descriptionA || !els.descriptionB) return;

    const presets = {
      startup: {
        decisionA: "Join early-stage startup",
        decisionB: "Join established corporate",
        descriptionA:
          "High-upside startup role with equity, fast-paced environment, broad responsibilities, and significant uncertainty around income and stability.",
        descriptionB:
          "Stable corporate role with predictable salary, strong benefits, slower promotion cycles, and clearer work-life boundaries."
      },
      grad: {
        decisionA: "Go to grad school",
        decisionB: "Start working immediately",
        descriptionA:
          "Pursue a graduate degree to deepen expertise, delay full-time earnings, and open doors to research or specialized roles.",
        descriptionB:
          "Enter the workforce now, build experience, and start compounding savings and career capital earlier."
      },
      house: {
        decisionA: "Buy a house",
        decisionB: "Keep renting",
        descriptionA:
          "Buy a home with a mortgage, build equity over time, take on maintenance and property tax risk, and reduce flexibility to move.",
        descriptionB:
          "Continue renting to maintain flexibility, avoid large upfront costs, and keep investment capital liquid in markets."
      }
    };

    const data = presets[preset];
    if (!data) return;

    els.decisionA.value = data.decisionA;
    els.decisionB.value = data.decisionB;
    els.descriptionA.value = data.descriptionA;
    els.descriptionB.value = data.descriptionB;

    updateCharCounter(els.descriptionA, els.charCountA);
    updateCharCounter(els.descriptionB, els.charCountB);
  };

  const initPresets = () => {
    const chips = document.querySelectorAll(".preset-chip");
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const preset = chip.getAttribute("data-preset");
        applyPreset(preset);
      });
    });
  };

  // ---------- Feature 3 — Backend call ----------

  const buildRequestBody = () => {
    return {
      decision_a: els.decisionA?.value?.trim() || "",
      decision_b: els.decisionB?.value?.trim() || "",
      description_a: els.descriptionA?.value?.trim() || "",
      description_b: els.descriptionB?.value?.trim() || "",
      risk: Number(els.risk?.value) || 0,
      years: Number(els.years?.value) || 0,
      runs: Number(els.runs?.value) || 0,
      narrative_mode: els.narrativeMode?.value || "balanced"
    };
  };

  const setRunButtonState = (isRunning) => {
    if (!els.runBtn) return;
    if (isRunning) {
      els.runBtn.disabled = true;
      els.runBtn.classList.add("is-loading");
    } else {
      els.runBtn.disabled = false;
      els.runBtn.classList.remove("is-loading");
    }
  };

  const hideOldResults = () => {
    hideElement(els.resultSection);
    clearElement(els.resultsGrid);
    clearElement(els.probBars);
    clearElement(els.distributionGrid);
    clearElement(els.scenarioGrid);
    if (els.recommended) els.recommended.textContent = "";
    if (els.narrativeText) els.narrativeText.textContent = "";
    if (els.trackFill) els.trackFill.style.width = "0%";
    hideElement(els.comparisonBlock);
  };

  const simulate = async () => {
    const body = buildRequestBody();
    const { runs, decision_a: decA, decision_b: decB } = body;

    hideOldResults();
    setRunButtonState(true);

    if (decA && decB && runs) {
      setNowPlaying(
        `Running ${runs.toLocaleString("en-IN")} timelines for ${decA} vs ${decB}...`
      );
    } else {
      setNowPlaying("Running simulation...");
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with status ${res.status}`);
      }

      const data = await res.json();
      lastSimulationResponse = data;

      renderAll(data);
      showElement(els.resultSection);
      scrollToElement(els.resultSection);
      setRunButtonState(false);
      setNowPlaying("Simulation complete. Scroll to explore your future timelines.");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Something went wrong while running the simulation.");
      setRunButtonState(false);
      setNowPlaying("Idle");
    }
  };

  const initRunButton = () => {
    if (!els.runBtn) return;
    els.runBtn.addEventListener("click", (e) => {
      e.preventDefault();
      simulate();
    });
  };

  // ---------- Feature 4 — Metric cards (#resultsGrid) ----------

  const renderMetricCard = (label, stats) => {
    const {
      avg_final_income,
      final_income_std,
      avg_satisfaction,
      p5_income,
      p95_income,
      p25_income,
      p75_income,
      min_income,
      max_income
    } = stats || {};

    const card = document.createElement("div");
    card.className = "metric-card";

    card.innerHTML = `
      <h3 class="metric-title">${label}</h3>
      <div class="metric-row">
        <span>Avg final income</span>
        <span>${formatCurrencyINR(avg_final_income)}</span>
      </div>
      <div class="metric-row">
        <span>Income volatility (σ)</span>
        <span>${formatCurrencyINR(final_income_std)}</span>
      </div>
      <div class="metric-row">
        <span>Avg satisfaction</span>
        <span>${formatNumber(avg_satisfaction, 2)}</span>
      </div>
      <div class="metric-row">
        <span>P5 – P95 band</span>
        <span>${formatCurrencyINR(p5_income)} – ${formatCurrencyINR(p95_income)}</span>
      </div>
      <div class="metric-row">
        <span>P25 – P75 band</span>
        <span>${formatCurrencyINR(p25_income)} – ${formatCurrencyINR(p75_income)}</span>
      </div>
      <div class="metric-row">
        <span>Min / Max</span>
        <span>${formatCurrencyINR(min_income)} – ${formatCurrencyINR(max_income)}</span>
      </div>
    `;
    return card;
  };

  const renderMetricCards = (data) => {
    if (!els.resultsGrid) return;
    clearElement(els.resultsGrid);

    const { path_a, path_b } = data || {};
    if (!path_a || !path_b) return;

    const cardA = renderMetricCard(path_a.label || "Path A", path_a);
    const cardB = renderMetricCard(path_b.label || "Path B", path_b);

    els.resultsGrid.appendChild(cardA);
    els.resultsGrid.appendChild(cardB);
  };

  // ---------- Feature 5 — Animated probability bars (#probBars) ----------

  const createProbBar = (title, valuePercent, colorClass) => {
    const container = document.createElement("div");
    container.className = "prob-bar-block";

    const labelRow = document.createElement("div");
    labelRow.className = "prob-bar-label-row";
    labelRow.innerHTML = `
      <span>${title}</span>
      <span class="prob-bar-value">${Math.round(valuePercent)}%</span>
    `;

    const barOuter = document.createElement("div");
    barOuter.className = "prob-bar-outer";

    const barInner = document.createElement("div");
    barInner.className = `prob-bar-inner ${colorClass}`;
    barInner.style.width = "0%";

    barOuter.appendChild(barInner);
    container.appendChild(labelRow);
    container.appendChild(barOuter);

    // Trigger animation in next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        barInner.style.transition = "width 700ms ease-out";
        barInner.style.width = `${Math.max(0, Math.min(100, valuePercent))}%`;
      });
    });

    return container;
  };

  const renderProbabilityBars = (data) => {
    if (!els.probBars) return;
    clearElement(els.probBars);

    const { path_a, path_b } = data || {};
    if (!path_a || !path_b) return;

    const p75_a = Number(path_a.p75_income || 0);
    const p75_b = Number(path_b.p75_income || 0);
    const denom = p75_a + p75_b || 1;

    const successA = (p75_a / denom) * 100;
    const successB = (p75_b / denom) * 100;

    const incomeAdvA =
      path_a.avg_final_income && path_b.avg_final_income
        ? ((path_a.avg_final_income - path_b.avg_final_income) /
            Math.max(path_a.avg_final_income, path_b.avg_final_income)) *
          100
        : 50;

    const incomeAdvB = 100 - Math.max(0, Math.min(100, incomeAdvA));

    const satisfactionA =
      path_a.avg_satisfaction && path_b.avg_satisfaction
        ? (path_a.avg_satisfaction /
            (path_a.avg_satisfaction + path_b.avg_satisfaction || 1)) *
          100
        : 50;
    const satisfactionB = 100 - satisfactionA;

    const block = document.createElement("div");
    block.className = "prob-bars-container";

    const successRow = document.createElement("div");
    successRow.className = "prob-bars-row";
    successRow.appendChild(createProbBar("Success Probability (A)", successA, "prob-bar-green"));
    successRow.appendChild(createProbBar("Success Probability (B)", successB, "prob-bar-orange"));

    const incomeRow = document.createElement("div");
    incomeRow.className = "prob-bars-row";
    incomeRow.appendChild(
      createProbBar("Income Advantage (A)", Math.max(0, Math.min(100, incomeAdvA)), "prob-bar-green")
    );
    incomeRow.appendChild(createProbBar("Income Advantage (B)", incomeAdvB, "prob-bar-orange"));

    const satRow = document.createElement("div");
    satRow.className = "prob-bars-row";
    satRow.appendChild(
      createProbBar("Satisfaction Score (A)", satisfactionA, "prob-bar-green")
    );
    satRow.appendChild(
      createProbBar("Satisfaction Score (B)", satisfactionB, "prob-bar-orange")
    );

    block.appendChild(successRow);
    block.appendChild(incomeRow);
    block.appendChild(satRow);

    els.probBars.appendChild(block);
  };

  // ---------- Feature 6 — Histogram (#distributionGrid) ----------

  const renderHistogramCard = (label, stats) => {
    const { histogram_counts: counts, p25_income, p75_income } = stats || {};
    const card = document.createElement("div");
    card.className = "histogram-card";

    const title = document.createElement("h3");
    title.className = "histogram-title";
    title.textContent = label;

    const barsContainer = document.createElement("div");
    barsContainer.className = "histogram-bars";

    if (Array.isArray(counts) && counts.length > 0) {
      const maxCount = Math.max(...counts.map((v) => Number(v) || 0)) || 1;
      counts.forEach((count) => {
        const bar = document.createElement("div");
        bar.className = "histogram-bar";
        const h = (Number(count) / maxCount) * 100;
        bar.style.height = `${h}%`;
        barsContainer.appendChild(bar);
      });
    } else {
      const empty = document.createElement("div");
      empty.className = "histogram-empty";
      empty.textContent = "No distribution data";
      barsContainer.appendChild(empty);
    }

    const band = document.createElement("div");
    band.className = "histogram-band";
    band.textContent = `P25 – P75: ${formatCurrencyINR(p25_income)} – ${formatCurrencyINR(
      p75_income
    )}`;

    card.appendChild(title);
    card.appendChild(barsContainer);
    card.appendChild(band);
    return card;
  };

  const renderHistograms = (data) => {
    if (!els.distributionGrid) return;
    clearElement(els.distributionGrid);

    const { path_a, path_b } = data || {};
    if (!path_a || !path_b) return;

    const cardA = renderHistogramCard(path_a.label || "Path A", path_a);
    const cardB = renderHistogramCard(path_b.label || "Path B", path_b);

    els.distributionGrid.appendChild(cardA);
    els.distributionGrid.appendChild(cardB);
  };

  // ---------- Feature 7 — Scenarios (#scenarioGrid) ----------

  const renderScenarios = (data) => {
    if (!els.scenarioGrid) return;
    clearElement(els.scenarioGrid);

    const { scenarios, path_a, path_b } = data || {};
    if (!Array.isArray(scenarios) || !path_a || !path_b) return;

    scenarios.forEach((scenario) => {
      const { name, income_a, income_b } = scenario;

      const card = document.createElement("div");
      card.className = "scenario-card";

      const title = document.createElement("h4");
      title.className = "scenario-title";
      title.textContent = name || "Scenario";

      const rowA = document.createElement("div");
      rowA.className = "scenario-row";
      const labelA = document.createElement("span");
      labelA.textContent = path_a.label || "Path A";
      const valueA = document.createElement("span");
      valueA.textContent = formatCurrencyINR(income_a);

      const rowB = document.createElement("div");
      rowB.className = "scenario-row";
      const labelB = document.createElement("span");
      labelB.textContent = path_b.label || "Path B";
      const valueB = document.createElement("span");
      valueB.textContent = formatCurrencyINR(income_b);

      const aWins = Number(income_a || 0) > Number(income_b || 0);
      const bWins = Number(income_b || 0) > Number(income_a || 0);

      if (aWins) {
        valueA.classList.add("scenario-win");
      } else if (bWins) {
        valueB.classList.add("scenario-win");
      }

      rowA.appendChild(labelA);
      rowA.appendChild(valueA);
      rowB.appendChild(labelB);
      rowB.appendChild(valueB);

      card.appendChild(title);
      card.appendChild(rowA);
      card.appendChild(rowB);

      els.scenarioGrid.appendChild(card);
    });
  };

  // ---------- Feature 8 — Recommendation ----------

  const renderRecommendation = (data) => {
    if (!els.recommended) return;

    const { recommended_path, path_a, path_b } = data || {};
    if (!recommended_path || !path_a || !path_b) {
      els.recommended.textContent = "";
      return;
    }

    let label;
    if (recommended_path === "a" || recommended_path === "path_a") {
      label = path_a.decision || path_a.label || els.decisionA?.value || "Path A";
    } else if (recommended_path === "b" || recommended_path === "path_b") {
      label = path_b.decision || path_b.label || els.decisionB?.value || "Path B";
    } else {
      label = recommended_path;
    }

    els.recommended.textContent = label;
  };

  // ---------- Feature 9 — Narrative + comparisonBlock ----------

  const stopNarrative = () => {
    if (narrativeTimeoutId) {
      clearTimeout(narrativeTimeoutId);
      narrativeTimeoutId = null;
    }
  };

  const typeWriter = (text, idx = 0) => {
    if (!els.narrativeText) return;
    if (idx === 0) els.narrativeText.textContent = "";

    if (idx >= text.length) {
      narrativeTimeoutId = null;
      return;
    }
    els.narrativeText.textContent += text.charAt(idx);
    narrativeTimeoutId = setTimeout(() => typeWriter(text, idx + 1), NARRATIVE_CHAR_DELAY);
  };

  const renderNarrativeAndComparison = (data) => {
    const { narrative, comparison } = data || {};

    stopNarrative();
    if (els.narrativeText) {
      if (narrative && typeof narrative === "string") {
        typeWriter(narrative, 0);
      } else {
        els.narrativeText.textContent = "";
      }
    }

    if (comparison && typeof comparison === "object") {
      showElement(els.comparisonBlock);
      if (els.primaryModelLabel) {
        els.primaryModelLabel.textContent = comparison.primary_label || "Primary model";
      }
      if (els.secondaryModelLabel) {
        els.secondaryModelLabel.textContent = comparison.secondary_label || "Secondary model";
      }
      if (els.primaryModelText) {
        els.primaryModelText.textContent = comparison.primary_text || "";
      }
      if (els.secondaryModelText) {
        els.secondaryModelText.textContent = comparison.secondary_text || "";
      }
    } else {
      hideElement(els.comparisonBlock);
    }
  };

  // ---------- Feature 10 — Track bar ----------

  const renderTrackBar = (data) => {
    if (!els.trackFill || !els.trackLabelA || !els.trackLabelB) return;

    const { path_a, path_b } = data || {};
    if (!path_a || !path_b) return;

    const incomeA = Number(path_a.avg_final_income || 0);
    const incomeB = Number(path_b.avg_final_income || 0);
    const total = incomeA + incomeB || 1;
    const shareA = (incomeA / total) * 100;

    els.trackLabelA.textContent = path_a.label || els.decisionA?.value || "Path A";
    els.trackLabelB.textContent = path_b.label || els.decisionB?.value || "Path B";

    els.trackFill.style.transition = "none";
    els.trackFill.style.width = "0%";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        els.trackFill.style.transition = "width 800ms cubic-bezier(0.16, 1, 0.3, 1)";
        els.trackFill.style.width = `${Math.max(5, Math.min(95, shareA))}%`;
      });
    });
  };

  // ---------- Feature 11 — Export CSV ----------

  const toCsvRow = (values) =>
    values
      .map((v) => {
        if (v == null) return "";
        const str = String(v);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(",");

  const buildCsvFromResponse = (data) => {
    if (!data) return "";

    const { path_a, path_b, scenarios } = data;
    const lines = [];

    lines.push("Section,Metric,Path,Value");
    if (path_a && path_b) {
      const metrics = [
        ["avg_final_income", path_a.avg_final_income, path_b.avg_final_income],
        ["final_income_std", path_a.final_income_std, path_b.final_income_std],
        ["avg_satisfaction", path_a.avg_satisfaction, path_b.avg_satisfaction],
        ["p5_income", path_a.p5_income, path_b.p5_income],
        ["p25_income", path_a.p25_income, path_b.p25_income],
        ["p75_income", path_a.p75_income, path_b.p75_income],
        ["p95_income", path_a.p95_income, path_b.p95_income],
        ["min_income", path_a.min_income, path_b.min_income],
        ["max_income", path_a.max_income, path_b.max_income]
      ];

      metrics.forEach(([metric, aVal, bVal]) => {
        lines.push(toCsvRow(["Paths", metric, "A", aVal]));
        lines.push(toCsvRow(["Paths", metric, "B", bVal]));
      });
    }

    if (Array.isArray(scenarios) && scenarios.length) {
      lines.push("");
      lines.push("Section,Scenario,Path,Income");
      scenarios.forEach((s) => {
        lines.push(toCsvRow(["Scenario", s.name, "A", s.income_a]));
        lines.push(toCsvRow(["Scenario", s.name, "B", s.income_b]));
      });
    }

    return lines.join("\n");
  };

  const triggerCsvDownload = (filename, content) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const initExportCsv = () => {
    if (!els.exportCsvBtn) return;
    els.exportCsvBtn.addEventListener("click", () => {
      if (!lastSimulationResponse) {
        showToast("Run a simulation before exporting CSV.");
        return;
      }
      const csv = buildCsvFromResponse(lastSimulationResponse);
      if (!csv) {
        showToast("No data available to export.");
        return;
      }
      triggerCsvDownload("lifesim-results.csv", csv);
      showToast("CSV exported successfully.", "success");
    });
  };

  // ---------- Feature 12 — Share link ----------

  const buildShareUrl = () => {
    const body = buildRequestBody();
    const url = new URL(window.location.href);
    Object.entries(body).forEach(([key, val]) => {
      if (val !== "" && val != null) {
        url.searchParams.set(key, String(val));
      }
    });
    return url.toString();
  };

  const copyToClipboard = async (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand("copy");
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const initShareLink = () => {
    if (!els.shareLinkBtn) return;
    els.shareLinkBtn.addEventListener("click", async () => {
      try {
        const url = buildShareUrl();
        await copyToClipboard(url);
        showToast("Shareable link copied to clipboard.", "success");
      } catch (err) {
        console.error(err);
        showToast("Unable to copy link to clipboard.");
      }
    });
  };

  // ---------- Feature 13 — Rerun ----------

  const initRerun = () => {
    if (!els.rerunBtn) return;
    els.rerunBtn.addEventListener("click", (e) => {
      e.preventDefault();
      hideElement(els.resultSection);
      scrollToElement(document.body);
      setNowPlaying("Ready for another run.");
    });
  };

  // ---------- Feature 14 — Now playing text from URL params ----------

  const applyUrlParamsToInputs = () => {
    const params = new URLSearchParams(window.location.search);
    const mapping = {
      decision_a: els.decisionA,
      decision_b: els.decisionB,
      description_a: els.descriptionA,
      description_b: els.descriptionB,
      risk: els.risk,
      years: els.years,
      runs: els.runs,
      narrative_mode: els.narrativeMode
    };
    Object.entries(mapping).forEach(([param, input]) => {
      if (!input) return;
      const val = params.get(param);
      if (val != null) {
        input.value = val;
      }
    });

    if (els.descriptionA && els.charCountA) {
      updateCharCounter(els.descriptionA, els.charCountA);
    }
    if (els.descriptionB && els.charCountB) {
      updateCharCounter(els.descriptionB, els.charCountB);
    }
  };

  // ---------- Render all ----------

  const renderAll = (data) => {
    renderMetricCards(data);
    renderProbabilityBars(data);
    renderHistograms(data);
    renderScenarios(data);
    renderRecommendation(data);
    renderNarrativeAndComparison(data);
    renderTrackBar(data);
  };

  // ---------- Init ----------

  const init = () => {
    applyUrlParamsToInputs();
    initCharCounters();
    initPresets();
    initRunButton();
    initExportCsv();
    initShareLink();
    initRerun();
    setNowPlaying("Idle");
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
```

This assumes:

- Your backend JSON response includes `path_a`, `path_b`, `scenarios`, `recommended_path`, `narrative`, and optional `comparison` fields in the shapes implied by the UI requirements. [web:3]

Do you already have the exact backend response shape (field names and nesting), or should I adapt this file to a concrete sample JSON you can share?  

<user_response_autocomplete>
I already have the exact backend response shape
I will adjust the backend to match this structure
Here is a sample JSON response I want you to match
</user_response_autocomplete>
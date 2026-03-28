// LifeSim Frontend - Script
(() => {
  const API_URL = "http://localhost:8000/simulate";

  // DOM Elements - MATCH YOUR HTML
  const els = {
    // Input fields
    decisionA: document.getElementById("decisionA"),
    decisionB: document.getElementById("decisionB"),
    descA: document.getElementById("descA"),
    descB: document.getElementById("descB"),
    charA: document.getElementById("charA"),
    charB: document.getElementById("charB"),
    riskTolerance: document.getElementById("riskTolerance"),
    yearsInput: document.getElementById("yearsInput"),
    runsInput: document.getElementById("runsInput"),
    narrativeMode: document.getElementById("narrativeMode"),

    // Buttons
    runBtn: document.getElementById("runBtn"),
    simulateAgainBtn: document.getElementById("simulateAgainBtn"),
    exportCsvBtn: document.getElementById("exportCsvBtn"),
    copyLinkBtn: document.getElementById("copyLinkBtn"),

    // Result sections
    resultsGrid: document.getElementById("resultsGrid"),
    probBars: document.getElementById("probBars"),
    distributionGrid: document.getElementById("distributionGrid"),
    scenarioGrid: document.getElementById("scenarioGrid"),
    recommended: document.getElementById("recommended"),
    narrativeText: document.getElementById("narrativeText"),
    comparisonBlock: document.getElementById("comparisonBlock"),
    trackFill: document.getElementById("trackFill"),
    trackLabelA: document.getElementById("trackLabelA"),
    trackLabelB: document.getElementById("trackLabelB"),

    // Toast
    toast: document.getElementById("toast"),

    // Session stats
    sessionRuns: document.getElementById("sessionRuns"),
    sessionLast: document.getElementById("sessionLast"),
  };

  const MAX_CHARS = 300;
  const WARN_THRESHOLD = 280;
  let lastSimulationResponse = null;
  let narrativeTimeoutId = null;

  // ===== SECTION NAVIGATION =====
  const initNavigation = () => {
    const navLinks = document.querySelectorAll(".nav-link");
    const sections = document.querySelectorAll(".section");

    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();

        // Remove active class from all links and sections
        navLinks.forEach((l) => l.classList.remove("active"));
        sections.forEach((s) => s.classList.remove("active-section"));

        // Add active class to clicked link and corresponding section
        link.classList.add("active");
        const sectionId = link.getAttribute("data-section");
        const section = document.getElementById(sectionId);
        if (section) {
          section.classList.add("active-section");
        }
      });
    });
  };

  // ===== CHAR COUNTERS =====
  const updateCharCounter = (textarea, counterEl) => {
    if (!textarea || !counterEl) return;
    const length = textarea.value.length;
    counterEl.textContent = length;
    if (length > WARN_THRESHOLD) {
      counterEl.parentElement.style.color = "#ff6b6b";
    } else {
      counterEl.parentElement.style.color = "";
    }
  };

  const initCharCounters = () => {
    if (els.descA && els.charA) {
      updateCharCounter(els.descA, els.charA);
      els.descA.addEventListener("input", () =>
        updateCharCounter(els.descA, els.charA)
      );
    }
    if (els.descB && els.charB) {
      updateCharCounter(els.descB, els.charB);
      els.descB.addEventListener("input", () =>
        updateCharCounter(els.descB, els.charB)
      );
    }
  };

  // ===== PRESETS =====
  const PRESETS = {
    startup: {
      decisionA: "Join early-stage startup",
      decisionB: "Stay at established corporate",
      descA:
        "High-upside startup role with equity, fast-paced environment, broad responsibilities, and significant uncertainty around income and stability.",
      descB:
        "Stable corporate role with predictable salary, strong benefits, slower promotion cycles, and clearer work-life boundaries.",
    },
    gradschool: {
      decisionA: "Go to grad school",
      decisionB: "Start working immediately",
      descA:
        "Pursue a graduate degree to deepen expertise, delay full-time earnings, and open doors to research or specialized roles.",
      descB:
        "Enter the workforce now, build experience, and start compounding savings and career capital earlier.",
    },
    housing: {
      decisionA: "Buy a house",
      decisionB: "Keep renting",
      descA:
        "Buy a home with a mortgage, build equity over time, take on maintenance and property tax risk, and reduce flexibility to move.",
      descB:
        "Continue renting to maintain flexibility, avoid large upfront costs, and keep investment capital liquid in markets.",
    },
  };

  const applyPreset = (presetKey) => {
    const preset = PRESETS[presetKey];
    if (!preset) return;

    if (els.decisionA) els.decisionA.value = preset.decisionA;
    if (els.decisionB) els.decisionB.value = preset.decisionB;
    if (els.descA) els.descA.value = preset.descA;
    if (els.descB) els.descB.value = preset.descB;

    updateCharCounter(els.descA, els.charA);
    updateCharCounter(els.descB, els.charB);
  };

  const initPresets = () => {
    const presetBtns = document.querySelectorAll(".preset-btn");
    presetBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const preset = btn.getAttribute("data-preset");
        applyPreset(preset);
      });
    });
  };

  // ===== FORMATTING =====
  const formatCurrencyINR = (value) => {
    if (value == null || Number.isNaN(value)) return "₹0";
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      return `₹${Math.round(value).toLocaleString("en-IN")}`;
    }
  };

  const formatNumber = (value, fractionDigits = 2) => {
    if (value == null || Number.isNaN(value)) return "0";
    return Number(value).toLocaleString("en-IN", {
      maximumFractionDigits: fractionDigits,
    });
  };

  // ===== UTILITIES =====
  const clearElement = (el) => {
    if (el) el.innerHTML = "";
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

  const showElement = (el) => {
    if (el && el.classList.contains("hidden")) {
      el.classList.remove("hidden");
    }
  };

  const hideElement = (el) => {
    if (el && !el.classList.contains("hidden")) {
      el.classList.add("hidden");
    }
  };

  // ===== SIMULATION =====
  const buildRequestBody = () => {
    return {
      decision_a: els.decisionA?.value?.trim() || "",
      decision_b: els.decisionB?.value?.trim() || "",
      description_a: els.descA?.value?.trim() || "",
      description_b: els.descB?.value?.trim() || "",
      risk: els.riskTolerance?.value || "medium",
      years: Number(els.yearsInput?.value) || 10,
      runs: Number(els.runsInput?.value) || 500,
      narrative_mode: els.narrativeMode?.value || "ai",
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

  const simulate = async () => {
    const body = buildRequestBody();

    // Validate inputs
    if (!body.decision_a || !body.decision_b) {
      showToast("Please enter both decision A and decision B.");
      return;
    }

    setRunButtonState(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with status ${res.status}`);
      }

      const data = await res.json();
      lastSimulationResponse = data;

      renderResults(data);

      // Show results section
      document.querySelectorAll(".section").forEach((s) =>
        s.classList.remove("active-section")
      );
      document.getElementById("results").classList.add("active-section");

      // Update nav
      document.querySelectorAll(".nav-link").forEach((l) =>
        l.classList.remove("active")
      );
      document
        .querySelector('[data-section="results"]')
        .classList.add("active");

      setRunButtonState(false);
      showToast("Simulation complete!", "success");

      // Update session stats
      if (els.sessionRuns) {
        els.sessionRuns.textContent = Number(els.sessionRuns.textContent) + 1;
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || "Simulation failed.");
      setRunButtonState(false);
    }
  };

  const initRunButton = () => {
    if (!els.runBtn) return;
    els.runBtn.addEventListener("click", (e) => {
      e.preventDefault();
      simulate();
    });
  };

  // ===== RESULT RENDERING =====
  const renderResults = (data) => {
    if (!data) return;
    renderMetricCards(data);
    renderProbabilityBars(data);
    renderHistograms(data);
    renderScenarios(data);
    renderRecommendation(data);
    renderTrackBar(data);
    renderNarrative(data);
  };

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
      max_income,
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
        <span>Volatility (σ)</span>
        <span>${formatCurrencyINR(final_income_std)}</span>
      </div>
      <div class="metric-row">
        <span>Avg satisfaction</span>
        <span>${formatNumber(avg_satisfaction, 2)}</span>
      </div>
      <div class="metric-row">
        <span>P5–P95</span>
        <span>${formatCurrencyINR(p5_income)}–${formatCurrencyINR(p95_income)}</span>
      </div>
      <div class="metric-row">
        <span>P25–P75</span>
        <span>${formatCurrencyINR(p25_income)}–${formatCurrencyINR(p75_income)}</span>
      </div>
      <div class="metric-row">
        <span>Range</span>
        <span>${formatCurrencyINR(min_income)}–${formatCurrencyINR(max_income)}</span>
      </div>
    `;
    return card;
  };

  const renderMetricCards = (data) => {
    if (!els.resultsGrid) return;
    clearElement(els.resultsGrid);
    const { path_a, path_b } = data || {};
    if (!path_a || !path_b) return;

    els.resultsGrid.appendChild(renderMetricCard("Path A", path_a));
    els.resultsGrid.appendChild(renderMetricCard("Path B", path_b));
  };

  const renderProbabilityBars = (data) => {
    if (!els.probBars) return;
    clearElement(els.probBars);
    // TODO: implement probability bars
  };

  const renderHistograms = (data) => {
    if (!els.distributionGrid) return;
    clearElement(els.distributionGrid);
    // TODO: implement histograms
  };

  const renderScenarios = (data) => {
    if (!els.scenarioGrid) return;
    clearElement(els.scenarioGrid);
    const { scenarios, path_a, path_b } = data || {};
    if (!Array.isArray(scenarios)) return;

    scenarios.forEach((scenario) => {
      const { name, income_a, income_b } = scenario;
      const card = document.createElement("div");
      card.className = "scenario-card";
      card.innerHTML = `
        <h4>${name}</h4>
        <div>Path A: ${formatCurrencyINR(income_a)}</div>
        <div>Path B: ${formatCurrencyINR(income_b)}</div>
      `;
      els.scenarioGrid.appendChild(card);
    });
  };

  const renderRecommendation = (data) => {
    if (!els.recommended) return;
    const { recommended_path } = data || {};
    if (recommended_path === "a" || recommended_path === "path_a") {
      els.recommended.textContent = els.decisionA?.value || "Path A";
    } else if (recommended_path === "b" || recommended_path === "path_b") {
      els.recommended.textContent = els.decisionB?.value || "Path B";
    }
  };

  const renderTrackBar = (data) => {
    if (!els.trackFill) return;
    const { path_a, path_b } = data || {};
    if (!path_a || !path_b) return;

    const incomeA = Number(path_a.avg_final_income || 0);
    const incomeB = Number(path_b.avg_final_income || 0);
    const total = incomeA + incomeB || 1;
    const shareA = (incomeA / total) * 100;

    if (els.trackLabelA)
      els.trackLabelA.textContent = els.decisionA?.value || "Path A";
    if (els.trackLabelB)
      els.trackLabelB.textContent = els.decisionB?.value || "Path B";

    els.trackFill.style.transition = "none";
    els.trackFill.style.width = "0%";

    setTimeout(() => {
      els.trackFill.style.transition = "width 800ms ease-out";
      els.trackFill.style.width = `${Math.max(5, Math.min(95, shareA))}%`;
    }, 50);
  };

  const renderNarrative = (data) => {
    if (!els.narrativeText || !data.narrative) return;
    els.narrativeText.textContent = data.narrative;
  };

  // ===== EXPORT =====
  const initExportCsv = () => {
    if (!els.exportCsvBtn) return;
    els.exportCsvBtn.addEventListener("click", () => {
      if (!lastSimulationResponse) {
        showToast("Run a simulation first.");
        return;
      }
      // TODO: implement CSV export
      showToast("CSV export coming soon.", "success");
    });
  };

  // ===== COPY LINK =====
  const initCopyLink = () => {
    if (!els.copyLinkBtn) return;
    els.copyLinkBtn.addEventListener("click", async () => {
      try {
        const url = new URL(window.location.href);
        const body = buildRequestBody();
        Object.entries(body).forEach(([key, val]) => {
          if (val && val !== "") {
            url.searchParams.set(key, String(val));
          }
        });
        await navigator.clipboard.writeText(url.toString());
        showToast("Link copied to clipboard!", "success");
      } catch (err) {
        showToast("Failed to copy link.");
      }
    });
  };

  // ===== SIMULATE AGAIN =====
  const initSimulateAgain = () => {
    if (!els.simulateAgainBtn) return;
    els.simulateAgainBtn.addEventListener("click", () => {
      document.querySelectorAll(".section").forEach((s) =>
        s.classList.remove("active-section")
      );
      document.getElementById("simulate").classList.add("active-section");

      document.querySelectorAll(".nav-link").forEach((l) =>
        l.classList.remove("active")
      );
      document
        .querySelector('[data-section="simulate"]')
        .classList.add("active");
    });
  };

  // ===== INIT =====
  const init = () => {
    initNavigation();
    initCharCounters();
    initPresets();
    initRunButton();
    initExportCsv();
    initCopyLink();
    initSimulateAgain();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
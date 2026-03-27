const runBtn = document.getElementById('runBtn');
const resultCard = document.getElementById('result');
const resultsGrid = document.getElementById('resultsGrid');
const recommendedEl = document.getElementById('recommended');
const rerunBtn = document.getElementById('rerunBtn');

function simulatePath(name, risk, isA) {
  const runs = 10000;
  let wealthSum = 0, happinessSum = 0, success = 0;
  const baseWealth = isA ? 92000 : 68000;
  const vol = risk === 'low' ? 0.18 : risk === 'medium' ? 0.32 : 0.52;

  for (let i = 0; i < runs; i++) {
    const rand = (Math.random() - 0.5) * 2.2;
    let wealth = baseWealth * (1 + rand * vol + (Math.random() * 0.3));
    wealth = Math.max(25000, Math.round(wealth));

    const happiness = Math.min(97, Math.max(42, 68 + rand * 22 + (risk === 'high' ? 7 : risk === 'low' ? -10 : 2)));

    wealthSum += wealth;
    happinessSum += happiness;
    if (wealth > (isA ? 125000 : 105000)) success++;
  }

  return {
    name,
    avgWealth: Math.round(wealthSum / runs),
    avgHappiness: (happinessSum / runs).toFixed(1),
    successRate: ((success / runs) * 100).toFixed(1)
  };
}

runBtn.addEventListener('click', () => {
  const decA = document.getElementById('decisionA').value.trim() || "Path A";
  const decB = document.getElementById('decisionB').value.trim() || "Path B";
  const risk = document.getElementById('risk').value;

  // Loading
  runBtn.disabled = true;
  runBtn.querySelector('.btn-text').classList.add('hidden');
  runBtn.querySelector('.btn-loader').classList.remove('hidden');

  setTimeout(() => {
    const resA = simulatePath(decA, risk, true);
    const resB = simulatePath(decB, risk, false);

    resultsGrid.innerHTML = `
      <div class="result-path">
        <div style="color:#22c55e;font-weight:700;margin-bottom:12px;">REALITY A</div>
        <h3>${resA.name}</h3>
        <div class="metric"><span>Expected Income</span><span>₹${resA.avgWealth.toLocaleString('en-IN')}</span></div>
        <div class="metric"><span>Life Satisfaction</span><span>${resA.avgHappiness}/100</span></div>
        <div class="metric"><span>Success Probability</span><span style="color:#22c55e">${resA.successRate}%</span></div>
      </div>

      <div class="result-path">
        <div style="color:#f97316;font-weight:700;margin-bottom:12px;">REALITY B</div>
        <h3>${resB.name}</h3>
        <div class="metric"><span>Expected Income</span><span>₹${resB.avgWealth.toLocaleString('en-IN')}</span></div>
        <div class="metric"><span>Life Satisfaction</span><span>${resB.avgHappiness}/100</span></div>
        <div class="metric"><span>Success Probability</span><span style="color:#f97316">${resB.successRate}%</span></div>
      </div>
    `;

    // Smart recommendation
    let rec = resA.avgHappiness > resB.avgHappiness + 4 ? resA.name : resB.name;
    if (Math.abs(resA.avgHappiness - resB.avgHappiness) < 2) {
      rec = resA.avgWealth > resB.avgWealth ? resA.name : resB.name;
    }
    recommendedEl.innerHTML = `${rec} <span style="font-size:0.9rem;opacity:0.7;">(with high confidence)</span>`;

    resultCard.classList.remove('hidden');
    rerunBtn.classList.remove('hidden');
    resultCard.scrollIntoView({ behavior: 'smooth' });

    // Reset button
    runBtn.disabled = false;
    runBtn.querySelector('.btn-text').classList.remove('hidden');
    runBtn.querySelector('.btn-loader').classList.add('hidden');
  }, 1450);
});

rerunBtn.addEventListener('click', () => {
  resultCard.classList.add('hidden');
  rerunBtn.classList.add('hidden');
});
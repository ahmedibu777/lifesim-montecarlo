const btn       = document.getElementById('runBtn');
const resultDiv = document.getElementById('result');

btn.addEventListener('click', async () => {
  const decisionA = document.getElementById('decisionA').value.trim();
  const decisionB = document.getElementById('decisionB').value.trim();
  const risk      = document.getElementById('risk').value;

  // Basic validation
  if (!decisionA || !decisionB) {
    alert('Please fill in both decisions before simulating.');
    return;
  }

  // Show loading state
  btn.disabled = true;
  btn.textContent = 'Simulating…';
  resultDiv.classList.remove('hidden');
  resultDiv.innerHTML = '<p>Running 500 simulations per path… please wait.</p>';

  try {
    const response = await fetch('http://localhost:8000/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision_a:     decisionA,
        decision_b:     decisionB,
        risk_tolerance: risk,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data  = await response.json();
    const sim   = data.simulation;
    const story = data.narrative;

    resultDiv.innerHTML = `
      <h2>Simulation Results</h2>
      <div class="result-numbers">
        <p>
          <strong>${decisionA}</strong> &rarr;
          Avg Final Income: <strong>$${sim.decision_a.avg_final_income.toLocaleString(undefined, {maximumFractionDigits: 0})}</strong> |
          Volatility: $${sim.decision_a.final_income_std.toLocaleString(undefined, {maximumFractionDigits: 0})} |
          Avg Satisfaction: <strong>${sim.decision_a.avg_satisfaction.toFixed(2)}</strong>
        </p>
        <p>
          <strong>${decisionB}</strong> &rarr;
          Avg Final Income: <strong>$${sim.decision_b.avg_final_income.toLocaleString(undefined, {maximumFractionDigits: 0})}</strong> |
          Volatility: $${sim.decision_b.final_income_std.toLocaleString(undefined, {maximumFractionDigits: 0})} |
          Avg Satisfaction: <strong>${sim.decision_b.avg_satisfaction.toFixed(2)}</strong>
        </p>
      </div>
      <h3>Your Story (by Hugging Face Nemotron)</h3>
      <pre>${story}</pre>
    `;

  } catch (err) {
    console.error(err);
    resultDiv.innerHTML = `
      <p class="error">
        Something went wrong: ${err.message}<br><br>
        Make sure the backend is running on
        de>http://localhost:8000</code>
      </p>
    `;
  } finally {
    // Always re-enable the button
    btn.disabled = false;
    btn.textContent = 'Simulate My Future';
  }
});
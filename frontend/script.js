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

    const data = await response.json();
    const sim  = data.simulation;
    const story = data.narrative;

    resultDiv.innerHTML = `
      <h2>Simulation Results</h2>
      <div class="result-numbers">
        <p><strong>${decisionA}</strong> → Score: ${sim.decision_a_score}</p>
        <p><strong>${decisionB}</strong> → Score: ${sim.decision_b_score}</p>
        <p><strong>Recommended:</strong> ${sim.recommended}</p>
      </div>

      <h3>Future Narrative</h3>
      <pre>${story}</pre>
    `;
  } catch (err) {
    resultDiv.innerHTML = `<p class="error">Error: ${err.message}</p>`;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Simulate My Future';
  }
});
function ResultCard({ label, value, unit, accent = false }) {
  return (
    <article className={`result-card ${accent ? 'result-card-accent' : ''}`}>
      <h3>{label}</h3>
      <p>
        {value} {unit}
      </p>
    </article>
  );
}

function ResultsPanel({ result }) {
  if (!result) {
    return <p className="placeholder">Run calculation to view wave and breaker results.</p>;
  }

  return (
    <div className="results-layout">
      <div className="result-grid">
        <ResultCard label="L0" value={result.L0} unit="m" />
        <ResultCard label="L" value={result.L} unit="m" />
        <ResultCard label="C" value={result.C} unit="m/s" />
        <ResultCard label="Wave Type" value={result.wave_type} unit="" accent />
      </div>

      <article className="status-card">
        <h3>Breaker Status</h3>
        <p className="status-main">'{result.breaker_type}' regime</p>
        <p>Hb = {result.Hb} m | hb = {result.hb} m</p>
        <p>Iribarren number xi = {result.iribarren_number}</p>
      </article>

      <article className="breaker-band">
        <span className="breaker-band-label">Breaker Type</span>
        <strong>{result.breaker_type}</strong>
        <span className="status-button">STATUS</span>
      </article>

      <article className="iribarren-band">
        <span className="iribarren-symbol">ξ</span>
        <span>Iribarren number ξ = {result.iribarren_number}</span>
      </article>

      <article className="zone-card">
        <h3>Energy Dissipation Zone</h3>
        <p>{result.energy_dissipation_zone}</p>
        <p>Hb/H0 ratio = {result.breaking_ratio_h0_l0}</p>
      </article>
    </div>
  );
}

export default ResultsPanel;

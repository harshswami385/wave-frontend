import { useState } from 'react';
import { calculateWave } from './api';
import InputPanel from './components/InputPanel';
import ResultsPanel from './components/ResultsPanel';
import DispersionProfile from './components/DispersionProfile';
import BreakerVisualizer from './components/BreakerVisualizer.jsx';

const initialInputs = {
  wave_period: 8.5,
  deep_water_wave_height: 2.5,
  water_depth: 50,
  bed_slope: 0.01,
};

function App() {
  const [inputs, setInputs] = useState(initialInputs);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (name, value) => {
    setInputs((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await calculateWave(inputs);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Unable to calculate wave parameters.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <header className="hero">
        <div className="hero-wave" />
        <h1>WaveLab</h1>
        <p>Modular Visualization System for Coastal Engineering</p>
      </header>

      <main className="dashboard-grid">
        <section className="panel glass input-panel top-module">
          <h2>Focused Input Module</h2>
          <InputPanel
            inputs={inputs}
            onInputChange={handleInputChange}
            onCalculate={handleCalculate}
            loading={loading}
          />
          {error && <p className="error-text">{error}</p>}
        </section>

        <section className="panel glass top-module results-panel">
          <h2>Results and Summary Module</h2>
          <ResultsPanel result={result} />
        </section>

        <section className="panel graph-panel glass">
          <h2>Dispersion Profile Graph Module</h2>
          <DispersionProfile result={result} />
        </section>

        <section className="panel graph-panel glass">
          <h2>Breaker Visualizer Module</h2>
          <BreakerVisualizer inputs={inputs} result={result} />
        </section>
      </main>
    </div>
  );
}

export default App;

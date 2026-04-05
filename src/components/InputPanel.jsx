const fieldConfig = [
  {
    icon: '🌊',
    name: 'wave_period',
    label: 'Wave Period (T)',
    min: 4,
    max: 20,
    step: 0.1,
    unit: 's',
  },
  {
    icon: '≈',
    name: 'deep_water_wave_height',
    label: 'Wave Height (H0)',
    min: 0,
    max: 10,
    step: 0.1,
    unit: 'm',
  },
  {
    icon: '◫',
    name: 'water_depth',
    label: 'Offshore Depth (d0)',
    min: 1,
    max: 50,
    step: 0.1,
    unit: 'm',
  },
  {
    icon: '⟍',
    name: 'bed_slope',
    label: 'Beach Slope (m)',
    min: 0.01,
    max: 0.1,
    step: 0.001,
    unit: '-',
  },
];

function InputPanel({ inputs, onInputChange, onCalculate, loading }) {
  return (
    <div className="input-wrap">
      <h3 className="module-subtitle">Wave Generation Parameters</h3>
      {fieldConfig.map((field) => (
        <div className="field-row" key={field.name}>
          <div className="field-icon" aria-hidden="true">{field.icon}</div>
          <div className="field-main">
            <div className="field-header">
              <label htmlFor={field.name}>{field.label}</label>
              <span className="value-pill">
                {Number(inputs[field.name]).toFixed(field.step < 0.01 ? 3 : 1)} {field.unit}
              </span>
            </div>
            <input
              id={field.name}
              type="range"
              min={field.min}
              max={field.max}
              step={field.step}
              value={inputs[field.name]}
              onChange={(event) => onInputChange(field.name, event.target.value)}
            />
            <div className="range-scale">
              <span>{field.min}</span>
              <span>{field.max}</span>
            </div>
            <input
              className="number-input"
              type="number"
              min={field.min}
              max={field.max}
              step={field.step}
              value={inputs[field.name]}
              onChange={(event) => onInputChange(field.name, event.target.value)}
            />
          </div>
        </div>
      ))}

      <button className="calculate-btn" type="button" onClick={onCalculate} disabled={loading}>
        {loading ? 'Calculating...' : 'Calculate'}
      </button>
    </div>
  );
}

export default InputPanel;

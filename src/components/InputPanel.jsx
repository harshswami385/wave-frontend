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

function getDynamicSliderBounds(field, currentValue) {
  const value = Number.isFinite(currentValue) ? currentValue : field.min;
  const baseMin = field.min;
  const baseMax = field.max;

  // Expand bounds when slider reaches an edge, so users can keep dragging without a hard cap.
  const precision = field.step < 0.01 ? 3 : field.step < 0.1 ? 2 : 1;
  const round = (n) => Number(n.toFixed(precision));

  const dynamicMin = value <= baseMin ? round(Math.max(0, value * 0.75)) : baseMin;
  const dynamicMax = value >= baseMax ? round(Math.max(baseMax + field.step * 10, value * 1.25)) : baseMax;

  return { min: dynamicMin, max: dynamicMax };
}

function InputPanel({ inputs, onInputChange, onCalculate, loading }) {
  return (
    <div className="input-wrap">
      <h3 className="module-subtitle">Wave Generation Parameters</h3>
      {fieldConfig.map((field) => (
        <div className="field-row" key={field.name}>
          {(() => {
            const currentValue = Number(inputs[field.name]);
            const bounds = getDynamicSliderBounds(field, currentValue);

            return (
              <>
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
              min={bounds.min}
              max={bounds.max}
              step={field.step}
              value={inputs[field.name]}
              onChange={(event) => onInputChange(field.name, event.target.value)}
            />
            <div className="range-scale">
              <span>{bounds.min}</span>
              <span>{bounds.max}</span>
            </div>
            <input
              className="number-input"
              type="number"
              min={field.min}
              step={field.step}
              value={inputs[field.name]}
              onChange={(event) => onInputChange(field.name, event.target.value)}
            />
          </div>
              </>
            );
          })()}
        </div>
      ))}

      <button className="calculate-btn" type="button" onClick={onCalculate} disabled={loading}>
        {loading ? 'Calculating...' : 'Calculate'}
      </button>
    </div>
  );
}

export default InputPanel;

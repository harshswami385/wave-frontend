import { useEffect, useState } from 'react';

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

function stepDecimals(step) {
  const value = String(step);
  if (!value.includes('.')) {
    return 0;
  }
  return value.split('.')[1].length;
}

function buildInitialBounds() {
  return fieldConfig.reduce((acc, field) => {
    acc[field.name] = { min: field.min, max: field.max };
    return acc;
  }, {});
}

function valueBasedExpansion(value, step) {
  const magnitude = Math.abs(value);
  return Math.max(magnitude, step);
}

function InputPanel({ inputs, onInputChange, onCalculate, loading }) {
  const [sliderBounds, setSliderBounds] = useState(buildInitialBounds);

  useEffect(() => {
    setSliderBounds((prev) => {
      let changed = false;
      const next = { ...prev };

      fieldConfig.forEach((field) => {
        const value = Number(inputs[field.name]);
        if (!Number.isFinite(value)) {
          return;
        }

        const bounds = next[field.name] ?? { min: field.min, max: field.max };
        let min = bounds.min;
        let max = bounds.max;
        const expandBy = valueBasedExpansion(value, field.step);

        if (value <= min) {
          min = value - expandBy;
        }
        if (value >= max) {
          max = value + expandBy;
        }

        if (min !== bounds.min || max !== bounds.max) {
          changed = true;
          next[field.name] = { min, max };
        }
      });

      return changed ? next : prev;
    });
  }, [inputs]);

  const handleRangeChange = (field, rawValue) => {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      return;
    }

    setSliderBounds((prev) => {
      const bounds = prev[field.name] ?? { min: field.min, max: field.max };
      const expandBy = valueBasedExpansion(value, field.step);
      let min = bounds.min;
      let max = bounds.max;

      if (value >= bounds.max - field.step * 0.5) {
        max = bounds.max + expandBy;
      }
      if (value <= bounds.min + field.step * 0.5) {
        min = bounds.min - expandBy;
      }

      if (min === bounds.min && max === bounds.max) {
        return prev;
      }

      return {
        ...prev,
        [field.name]: { min, max },
      };
    });

    onInputChange(field.name, value);
  };

  return (
    <div className="input-wrap">
      <h3 className="module-subtitle">Wave Generation Parameters</h3>
      {fieldConfig.map((field) => (
        <div className="field-row" key={field.name}>
          {(() => {
            const bounds = sliderBounds[field.name] ?? { min: field.min, max: field.max };
            const decimals = stepDecimals(field.step);

            return (
              <>
          <div className="field-icon" aria-hidden="true">{field.icon}</div>
          <div className="field-main">
            <div className="field-header">
              <label htmlFor={field.name}>{field.label}</label>
              <span className="value-pill">
                {Number(inputs[field.name]).toFixed(decimals)} {field.unit}
              </span>
            </div>
            <input
              id={field.name}
              type="range"
              min={bounds.min}
              max={bounds.max}
              step={field.step}
              value={inputs[field.name]}
              onChange={(event) => handleRangeChange(field, event.target.value)}
            />
            <div className="range-scale">
              <span>{Number(bounds.min).toFixed(decimals)}</span>
              <span>{Number(bounds.max).toFixed(decimals)}</span>
            </div>
            <input
              className="number-input"
              type="number"
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

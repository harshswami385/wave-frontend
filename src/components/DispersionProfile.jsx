function buildPath(values, xStart, xStep, yScale, yOffset, cap = 1) {
  let path = '';
  values.forEach((value, idx) => {
    const x = xStart + idx * xStep;
    const y = yOffset - Math.min(value, cap) * yScale;
    path += `${idx === 0 ? 'M' : ' L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  });
  return path;
}

function DispersionProfile({ result }) {
  if (!result) {
    return <p className="placeholder">Run calculation to display the dispersion profile graph.</p>;
  }

  const width = 860;
  const height = 370;
  const left = 54;
  const right = 22;
  const top = 16;
  const bottom = 44;
  const chartW = width - left - right;
  const chartH = height - top - bottom;

  const dataPoints = result.chart_data;
  const xStep = chartW / Math.max(dataPoints.length - 1, 1);

  const wavelengthMax = Math.max(...dataPoints.map((p) => p.wavelength), 1);
  const celerityMax = Math.max(...dataPoints.map((p) => p.celerity), 1);
  const heightMax = Math.max(...dataPoints.map((p) => p.wave_height), 1);

  const yScale = chartH * 0.86;
  const yOffset = top + chartH * 0.95;

  const normalizedL = dataPoints.map((p) => p.wavelength / wavelengthMax);
  const normalizedC = dataPoints.map((p) => p.celerity / celerityMax);
  const normalizedH = dataPoints.map((p) => p.wave_height / heightMax);
  const deepTrack = dataPoints.map((_, idx) => 0.94 - 0.34 * (idx / Math.max(dataPoints.length - 1, 1)) ** 1.75);

  const bed = dataPoints.map((_, idx) => 0.08 + 0.54 * (idx / Math.max(dataPoints.length - 1, 1)) ** 1.28);

  const lPath = buildPath(normalizedL.map((v) => 0.5 + 0.31 * v), left, xStep, yScale, yOffset, 1);
  const cPath = buildPath(normalizedC.map((v) => 0.48 + 0.34 * v), left, xStep, yScale, yOffset, 1);
  const hPath = buildPath(normalizedH.map((v) => 0.3 + 0.36 * v), left, xStep, yScale, yOffset, 1);
  const dPath = buildPath(deepTrack, left, xStep, yScale, yOffset, 1);
  const bedPath = buildPath(bed, left, xStep, yScale * 0.9, yOffset, 1);

  const bedFill = `${bedPath} L ${left + chartW} ${yOffset} L ${left} ${yOffset} Z`;

  const breakIdx = Math.max(0, dataPoints.findIndex((p) => p.depth >= result.hb));
  const breakX = left + xStep * breakIdx;

  return (
    <div className="profile-shell">
      <svg viewBox={`0 0 ${width} ${height}`} className="profile-svg" role="img" aria-label="Dispersion profile graph module">
        <defs>
          <linearGradient id="profileBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f3f68" />
            <stop offset="100%" stopColor="#0a2346" />
          </linearGradient>
          <linearGradient id="bedFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#9f8f67" />
            <stop offset="100%" stopColor="#d4c18f" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width={width} height={height} fill="url(#profileBg)" />

        {[0.25, 0.5, 0.75].map((g) => (
          <line
            key={`h-${g}`}
            x1={left}
            y1={top + chartH * g}
            x2={left + chartW}
            y2={top + chartH * g}
            stroke="rgba(209,231,244,0.18)"
            strokeDasharray="4 5"
          />
        ))}

        {[0.2, 0.4, 0.6, 0.8].map((g) => (
          <line
            key={`v-${g}`}
            x1={left + chartW * g}
            y1={top}
            x2={left + chartW * g}
            y2={top + chartH}
            stroke="rgba(209,231,244,0.14)"
            strokeDasharray="4 5"
          />
        ))}

        <path d={bedFill} fill="url(#bedFill)" opacity="0.9" />

        <path d={dPath} fill="none" stroke="#5fc0d0" strokeWidth="2.8" />
        <path d={lPath} fill="none" stroke="#61c3d7" strokeWidth="3" />
        <path d={cPath} fill="none" stroke="#e7d09a" strokeWidth="2.6" />
        <path d={hPath} fill="none" stroke="#d27f90" strokeWidth="2.2" strokeDasharray="5 4" />

        <line x1={breakX} y1={top} x2={breakX} y2={top + chartH} stroke="rgba(235,246,255,0.65)" strokeWidth="1.2" />
        <text x={breakX + 4} y={top + chartH - 8} fill="rgba(235,246,255,0.82)" fontSize="11">Shoreline</text>

        <line x1={left} y1={top + chartH} x2={left + chartW} y2={top + chartH} stroke="#cee3ef" strokeWidth="1.2" />
        <line x1={left} y1={top} x2={left} y2={top + chartH} stroke="#cee3ef" strokeWidth="1.2" />

        {[0, 25, 50, 75, 100].map((tick) => {
          const y = top + chartH - (tick / 100) * chartH;
          return (
            <text key={`yt-${tick}`} x="22" y={y + 4} fill="#d7e8f2" fontSize="12">
              {tick}
            </text>
          );
        })}

        {[0, 50, 100, 150, 200, 250, 300, 350, 400].map((tick) => {
          const x = left + (tick / 400) * chartW;
          return (
            <text key={`xt-${tick}`} x={x - 8} y={height - 16} fill="#d7e8f2" fontSize="12">
              {tick}
            </text>
          );
        })}

        <text x={width / 2 - 74} y={height - 8} fill="#c9dfeb" fontSize="13">Distance from Offshore (m)</text>
        <text transform={`translate(16 ${top + chartH / 2}) rotate(-90)`} fill="#c9dfeb" fontSize="13">
          Elevation / Wave Height (m)
        </text>
      </svg>

      <p className="profile-caption">Detailed Shoaling and Transition Plot</p>
    </div>
  );
}

export default DispersionProfile;

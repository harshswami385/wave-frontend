function BreakerVisualizer({ inputs, result }) {
  if (!inputs) {
    return <p className="placeholder">Run calculation to display breaker zones and wave transformation.</p>;
  }

  const width = 860;
  const height = 370;
  const left = 44;
  const right = 22;
  const top = 18;
  const bottom = 42;
  const g = 9.81;

  const wavePeriod = Number(inputs.wave_period ?? 8);
  const offshoreHeight = Number(inputs.deep_water_wave_height ?? 2);
  const offshoreDepth = Math.max(0.5, Number(inputs.water_depth ?? 15));
  const bedSlope = Math.max(0.0005, Number(inputs.bed_slope ?? 0.02));

  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const shoreDistance = offshoreDepth / bedSlope;
  const seaLevelY = top + 34;
  const maxWaterDepthPx = chartHeight * 0.72;
  const depthScale = Math.min(maxWaterDepthPx / offshoreDepth, 8.8);
  const waveScale = Math.min(12, Math.max(6, depthScale * 0.9));
  const sampleCount = 240;

  const solveDispersion = (period, depth) => {
    let wavelength = 1.56 * period * period;
    for (let i = 0; i < 40; i += 1) {
      const next = (g * period * period / (2 * Math.PI)) * Math.tanh((2 * Math.PI * depth) / Math.max(wavelength, 1e-9));
      if (Math.abs(next - wavelength) < 1e-6) {
        return Math.max(next, 1e-6);
      }
      wavelength = Math.max(next, 1e-6);
    }
    return Math.max(wavelength, 1e-6);
  };

  const groupVelocityFactor = (depth, wavelength) => {
    const kd = (2 * Math.PI * depth) / Math.max(wavelength, 1e-9);
    if (kd < 1e-9) {
      return 1;
    }
    return 0.5 * (1 + (2 * kd) / Math.sinh(2 * kd));
  };

  const cg0 = g * wavePeriod / (4 * Math.PI);

  const profile = Array.from({ length: sampleCount }, (_, index) => {
    const t = index / (sampleCount - 1);
    const xPhysical = t * shoreDistance;
    const xScreen = left + t * chartWidth;
    const depth = Math.max(offshoreDepth - bedSlope * xPhysical, 0.25);
    const wavelength = solveDispersion(wavePeriod, depth);
    const celerity = wavelength / wavePeriod;
    const cg = groupVelocityFactor(depth, wavelength) * celerity;
    const shoaledHeight = offshoreHeight * Math.sqrt(cg0 / Math.max(cg, 1e-9));
    const breakingRatio = shoaledHeight / depth;
    const waveHeight = Math.min(shoaledHeight, 0.78 * depth);
    const k = (2 * Math.PI) / wavelength;
    const phase = k * xPhysical;
    const eta = 0.5 * waveHeight * Math.cos(phase);
    const seabedY = seaLevelY + depth * depthScale;
    const surfaceY = seaLevelY - eta * waveScale;

    return {
      xPhysical,
      xScreen,
      depth,
      wavelength,
      celerity,
      cg,
      waveHeight,
      breakingRatio,
      eta,
      seabedY,
      surfaceY,
    };
  });

  const breakIndex = profile.findIndex((point) => point.breakingRatio >= 0.78);
  const breakPoint = breakIndex >= 0 ? profile[breakIndex] : null;

  const createPath = (points, valueKey) => points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.xScreen.toFixed(2)} ${point[valueKey].toFixed(2)}`)
    .join(' ');

  const surfacePath = createPath(profile, 'surfaceY');
  const seabedPath = createPath(profile, 'seabedY');
  const seabedFillPath = `${seabedPath} L ${profile[profile.length - 1].xScreen.toFixed(2)} ${height - bottom} L ${profile[0].xScreen.toFixed(2)} ${height - bottom} Z`;
  const waterFillPath = `${surfacePath} L ${profile[profile.length - 1].xScreen.toFixed(2)} ${profile[profile.length - 1].seabedY.toFixed(2)} ${profile
    .slice()
    .reverse()
    .map((point) => `L ${point.xScreen.toFixed(2)} ${point.seabedY.toFixed(2)}`)
    .join(' ')} Z`;

  const offshoreWavePath = profile
    .map((point, index) => {
      const deepWavelength = Math.max(solveDispersion(wavePeriod, offshoreDepth), 1e-6);
      const deepEta = 0.5 * offshoreHeight * Math.cos((2 * Math.PI * point.xPhysical) / deepWavelength);
      const y = seaLevelY - deepEta * waveScale;
      return `${index === 0 ? 'M' : 'L'} ${point.xScreen.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  const foamPoints = breakPoint
    ? [
        { x: breakPoint.xScreen - 28, y: breakPoint.surfaceY - 6, r: 3.2 },
        { x: breakPoint.xScreen - 18, y: breakPoint.surfaceY - 16, r: 2.7 },
        { x: breakPoint.xScreen - 8, y: breakPoint.surfaceY - 22, r: 2.5 },
        { x: breakPoint.xScreen + 4, y: breakPoint.surfaceY - 16, r: 2.9 },
        { x: breakPoint.xScreen + 16, y: breakPoint.surfaceY - 8, r: 2.2 },
      ]
    : [];

  const breakLineX = breakPoint ? breakPoint.xScreen : left + chartWidth * 0.82;
  const breakerType = result?.breaker_type ?? 'Unknown';
  const iribarren = result?.iribarren_number ?? 'N/A';
  const labelTopY = 38;
  const breakLabelY = breakPoint ? Math.max(52, breakPoint.surfaceY - 34) : 56;
  const breakDetailY = Math.max(68, breakLabelY + 16);
  const breakLabelX = breakPoint ? Math.max(left + 14, Math.min(width - 170, breakPoint.xScreen - 38)) : left + chartWidth * 0.45;

  return (
    <div className="breaker-shell">
      <svg viewBox={`0 0 ${width} ${height}`} className="breaker-svg" role="img" aria-label="Breaker visualizer">
        <defs>
          <linearGradient id="breakerBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0c2747" />
            <stop offset="100%" stopColor="#081f36" />
          </linearGradient>
          <linearGradient id="waterFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(105,220,235,0.78)" />
            <stop offset="85%" stopColor="rgba(25,86,125,0.78)" />
            <stop offset="100%" stopColor="rgba(10,36,68,0.94)" />
          </linearGradient>
          <linearGradient id="seabedFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8a7d61" />
            <stop offset="100%" stopColor="#d9c69a" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width={width} height={height} fill="url(#breakerBg)" rx="14" />

        <path d={seabedFillPath} fill="url(#seabedFill)" opacity="0.98" />
        <path d={waterFillPath} fill="url(#waterFill)" opacity="0.86" />
        <path d={seabedPath} fill="none" stroke="rgba(82,61,24,0.4)" strokeWidth="1.1" />

        <path d={offshoreWavePath} fill="none" stroke="rgba(168,244,255,0.38)" strokeWidth="1.5" strokeDasharray="7 6" />
        <path d={surfacePath} fill="none" stroke="#8feeff" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />

        <line x1={breakLineX} y1={top} x2={breakLineX} y2={height - bottom + 4} stroke="rgba(245,247,251,0.33)" strokeDasharray="4 5" />

        {breakPoint && (
          <>
            <path
              d={`M ${breakPoint.xScreen - 32} ${breakPoint.surfaceY - 7} C ${breakPoint.xScreen - 4} ${breakPoint.surfaceY - 35}, ${breakPoint.xScreen + 32} ${breakPoint.surfaceY - 12}, ${breakPoint.xScreen + 18} ${breakPoint.surfaceY + 14} C ${breakPoint.xScreen + 9} ${breakPoint.surfaceY + 26}, ${breakPoint.xScreen - 8} ${breakPoint.surfaceY + 22}, ${breakPoint.xScreen - 18} ${breakPoint.surfaceY + 8} Z`}
              fill="rgba(250, 238, 205, 0.48)"
              stroke="rgba(255,245,216,0.84)"
              strokeWidth="1"
            />
            {foamPoints.map((dot, index) => (
              <circle key={index} cx={dot.x} cy={dot.y} r={dot.r} fill="rgba(255,255,255,0.82)" />
            ))}
            <text x={breakLabelX} y={breakLabelY} fill="#f3fbff" fontSize="12" fontWeight="700" textAnchor="start">
              Breaking Point
            </text>
            <text x={breakLabelX} y={breakDetailY} fill="#f3fbff" fontSize="11" textAnchor="start">
              x = xb, d = db, H = Hb
            </text>
          </>
        )}

        <text x={left + 10} y={labelTopY} fill="#d9eef7" fontSize="16" fontWeight="600">
          Offshore
        </text>
        <text x={left + chartWidth * 0.36} y={labelTopY} fill="#d9eef7" fontSize="16" fontWeight="600" textAnchor="middle">
          Transition
        </text>
        <text x={left + chartWidth * 0.78} y={labelTopY} fill="#d9eef7" fontSize="16" fontWeight="600" textAnchor="middle">
          Surf Zone
        </text>

        <text x={left} y={height - 12} fill="#c9dfeb" fontSize="13">
          Offshore
        </text>
        <text x={left + chartWidth * 0.43} y={height - 12} fill="#c9dfeb" fontSize="13">
          Shoaling / Transition
        </text>
        <text x={left + chartWidth * 0.78} y={height - 12} fill="#c9dfeb" fontSize="13">
          Surf Zone
        </text>

        <rect x={width - 245} y={height - 104} width="220" height="86" rx="10" fill="rgba(13,34,53,0.62)" stroke="rgba(179,214,233,0.36)" />
        <text x={width - 230} y={height - 81} fill="#d7ebf7" fontSize="12">
          Breaking Type: {breakerType}
        </text>
        <text x={width - 230} y={height - 63} fill="#d7ebf7" fontSize="12">
          Iribarren ξ = {iribarren}
        </text>
        <text x={width - 230} y={height - 45} fill="#d7ebf7" fontSize="12">
          Offshore H0 = {offshoreHeight.toFixed(2)} m
        </text>
        <text x={width - 230} y={height - 27} fill="#d7ebf7" fontSize="12">
          Offshore d0 = {offshoreDepth.toFixed(2)} m
        </text>
      </svg>

      <p className="profile-caption">Physics-based coastal wave profile with shoaling and breaking</p>
    </div>
  );
}

export default BreakerVisualizer;

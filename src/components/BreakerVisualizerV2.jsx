import React from "react";

/**
 * BreakerVisualizerV2: Proper Coastal Engineering Physics
 * 
 * Physics implemented:
 * 1. Dispersion relation: L = (gT²/2π) * tanh(2πd/L) [iterative]
 * 2. Local depth: d(x) = d₀ - x*tan(β)
 * 3. Wave shoaling: H(x) via energy flux conservation (Snell's law analogue)
 * 4. Breaking condition: H/d ≥ 0.78 (Munk criterion)
 * 5. Wave surface: η(x) = (H(x)/2) * cos(k(x)*x)
 */

const BreakerVisualizerV2 = ({ T = 8, H0 = 2, depth = 15, slope = 0.02 }) => {
  const width = 860;
  const height = 370;
  const g = 9.81;
  const margin = { left: 40, right: 20, top: 16, bottom: 44 };

  // ============================================
  // PHYSICS: Iterative dispersion solver
  // ============================================
  const solveDispersion = (T, d) => {
    let L = 1.56 * T * T; // Initial guess: deep-water wavelength
    for (let i = 0; i < 30; i++) {
      const arg = (2 * Math.PI * d) / L;
      L = (g * T * T) / (2 * Math.PI) * Math.tanh(arg);
    }
    return Math.max(L, 0.5);
  };

  // ============================================
  // PHYSICS: Energy-conserving wave shoaling
  // ============================================
  const computeWaveHeight = (H0_local, L0, L_local, d0, d_local) => {
    // Energy flux conservation: (E*C_g)_offshore = (E*C_g)_local
    // Simplified: H ∝ sqrt(C_g ratio)
    // For shallow water: C_g ≈ sqrt(g*d), so H ∝ (d₀/d)^(1/4)
    // More accurate (Green's law): H = H0 * sqrt(L0/L * 1/2)
    
    if (d_local < 0.1) return H0_local;
    
    // Use Green's law (energy conservation in intermediate/shallow)
    const n_ratio = 0.5 * (1 + (4 * Math.PI * d_local) / L_local / Math.sinh((4 * Math.PI * d_local) / L_local));
    const H = H0_local * Math.sqrt((L0 / L_local) * n_ratio);
    
    return Math.max(H, 0.1);
  };

  // ============================================
  // PHYSICS: Generate discretized wave profile
  // ============================================
  const generateWaveProfile = () => {
    const profile = [];
    const dx = 4; // Discretization step (m)
    let breakingX = null;
    let breakingDepth = null;
    let breakingH = null;

    // Deep-water reference
    const L0 = solveDispersion(T, depth);
    const H_offshore = H0;

    for (let x = 0; x <= width - margin.left - margin.right; x += dx) {
      // 1. Compute local depth: d(x) = d₀ - x*tan(β)
      const localDepth = Math.max(0.5, depth - slope * x);

      // 2. Solve dispersion for local wavelength
      const L = solveDispersion(T, localDepth);

      // 3. Apply shoaling (energy conservation)
      const H = computeWaveHeight(H_offshore, L0, L, depth, localDepth);

      // 4. Check breaking condition: H/d ≥ 0.78
      const breakingRatio = H / localDepth;
      if (!breakingX && breakingRatio >= 0.78) {
        breakingX = x;
        breakingDepth = localDepth;
        breakingH = H;
      }

      // 5. Compute wave number and surface elevation
      const k = (2 * Math.PI) / L;
      const waveElevation = (H / 2) * Math.cos(k * x);

      profile.push({
        x,
        d: localDepth,
        L,
        H,
        k,
        η: waveElevation,
        breaking: breakingRatio >= 0.78,
      });
    }

    return { profile, L0, breakingX, breakingDepth, breakingH };
  };

  const { profile, L0, breakingX, breakingDepth, breakingH } = generateWaveProfile();

  // ============================================
  // SVG RENDERING
  // ============================================

  // Canvas origin (accounting for margins)
  const canvasWidth = width - margin.left - margin.right;
  const canvasHeight = height - margin.top - margin.bottom;

  // Scaling factors
  const maxDepth = depth * 1.2;
  const yScale = canvasHeight / maxDepth; // depth to SVG pixels

  // Seabed y-coordinate at each x
  const seabedY = (x) => {
    const d = depth - slope * x;
    return margin.top + canvasHeight - Math.max(d, 0.5) * yScale;
  };

  // Water surface y-coordinate at each x
  const waterSurfaceY = (x) => {
    const point = profile.find((p) => p.x === x) || profile[Math.floor(x / 4) * 4];
    if (!point) return margin.top + canvasHeight;
    const d = point.d;
    const η = point.η;
    const baseY = margin.top + canvasHeight - d * yScale;
    return baseY - η * yScale * 1.5; // Amplify vertical oscillation for visibility
  };

  // Generate seabed path
  const seabedPath = `M ${margin.left},${margin.top + canvasHeight} ${profile
    .map((p) => `L ${margin.left + p.x},${seabedY(p.x)}`)
    .join(" ")} L ${width - margin.right},${margin.top + canvasHeight} Z`;

  // Generate wave surface path
  const wavePath = `M ${margin.left},${margin.top + canvasHeight} ${profile
    .map((p) => `L ${margin.left + p.x},${waterSurfaceY(p.x)}`)
    .join(" ")} L ${width - margin.right},${margin.top + canvasHeight} Z`;

  // Deep-water reference wave (ghost)
  const ghostWavePath = `M ${margin.left},${margin.top + canvasHeight} ${profile
    .map((p) => `L ${margin.left + p.x},${margin.top + canvasHeight - (H0 / 2) * Math.cos(p.k * p.x) * yScale}`)
    .join(" ")} L ${width - margin.right},${margin.top + canvasHeight} Z`;

  // Breaking point visualization
  const breakPointSVGX = breakingX ? margin.left + breakingX : null;
  const breakPointSVGY = breakingX ? seabedY(breakingX) - breakingDepth * 0.5 * yScale : null;

  return (
    <div className="p-4 bg-gradient-to-br from-blue-900/40 to-cyan-900/20 rounded-lg border border-cyan-500/40">
      <h2 className="text-cyan-300 mb-3 text-sm font-semibold">🌊 COASTAL WAVE PROPAGATION</h2>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full border border-cyan-300/20 rounded"
        style={{ backgroundColor: "rgba(8, 31, 54, 0.5)" }}
      >
        {/* Seabed with gradient */}
        <defs>
          <linearGradient id="seabedGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#c2a878" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8b7355" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(97, 195, 215, 0.4)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgba(97, 195, 215, 0.6)" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* Seabed */}
        <path d={seabedPath} fill="url(#seabedGrad)" />

        {/* Deep-water reference wave (ghost) */}
        <path d={ghostWavePath} fill="none" stroke="#00e5ff" strokeWidth="1" strokeDasharray="4,3" opacity="0.4" />

        {/* Wave surface */}
        <path d={wavePath} fill="url(#waterGrad)" stroke="#00d4ff" strokeWidth="2" />

        {/* Breaking foam/crest */}
        {breakPointSVGX && (
          <>
            {/* Foam crest (bezier curve) */}
            <path
              d={`M ${breakPointSVGX - 20} ${breakPointSVGY - 8} C ${breakPointSVGX} ${breakPointSVGY - 28}, ${breakPointSVGX + 25} ${breakPointSVGY - 12}, ${breakPointSVGX + 15} ${breakPointSVGY + 12} C ${breakPointSVGX + 8} ${breakPointSVGX + 22}, ${breakPointSVGX - 10} ${breakPointSVGY + 18}, ${breakPointSVGX - 15} ${breakPointSVGY + 6} Z`}
              fill="rgba(250, 238, 205, 0.5)"
              stroke="rgba(255, 245, 216, 0.7)"
              strokeWidth="1"
            />

            {/* Foam particles */}
            {[
              { cx: breakPointSVGX - 5, cy: breakPointSVGY - 22, r: 3.2 },
              { cx: breakPointSVGX + 8, cy: breakPointSVGY - 26, r: 2.8 },
              { cx: breakPointSVGX + 18, cy: breakPointSVGY - 16, r: 2.4 },
            ].map((dot, i) => (
              <circle
                key={i}
                cx={dot.cx}
                cy={dot.cy}
                r={dot.r}
                fill="rgba(255, 255, 255, 0.6)"
              />
            ))}

            {/* Breaking marker */}
            <circle cx={breakPointSVGX} cy={breakPointSVGY} r="4" fill="none" stroke="white" strokeWidth="1.5" opacity="0.6" />
          </>
        )}

        {/* Zone labels */}
        <text x={margin.left + 30} y={20} fill="#61c3d7" fontSize="12" fontWeight="500">
          OFFSHORE
        </text>
        <text x={margin.left + canvasWidth * 0.35} y={20} fill="#61c3d7" fontSize="12" fontWeight="500">
          TRANSITION
        </text>
        {breakPointSVGX && (
          <text x={breakPointSVGX - 20} y={20} fill="#ff6b6b" fontSize="12" fontWeight="700">
            BREAKING POINT
          </text>
        )}
        <text x={Math.max(breakPointSVGX + 40, margin.left + canvasWidth * 0.7)} y={20} fill="#61c3d7" fontSize="12" fontWeight="500">
          SURF ZONE
        </text>

        {/* Statistics box */}
        <rect x={margin.left + 10} y={height - 90} width="180" height="75" fill="rgba(8, 31, 54, 0.9)" stroke="#61c3d7" strokeWidth="1" rx="3" />
        <text x={margin.left + 20} y={height - 70} fill="#61c3d7" fontSize="11" fontWeight="bold">
          Wavelength (m):
        </text>
        <text x={margin.left + 20} y={height - 56} fill="#e7d09a" fontSize="10">
          L₀={L0.toFixed(1)} (offshore)
        </text>
        {breakingX && (
          <>
            <text x={margin.left + 20} y={height - 42} fill="#ff6b6b" fontSize="10" fontWeight="bold">
              Breaking: d={breakingDepth.toFixed(1)}m, H={breakingH.toFixed(2)}m
            </text>
          </>
        )}
      </svg>

      <p className="text-xs text-cyan-400/70 mt-2 text-center">
        <strong>Physics:</strong> Dispersion relation (iterative) + Energy conservation shoaling + H/d ≥ 0.78 breaking criterion
      </p>
    </div>
  );
};

export default BreakerVisualizerV2;

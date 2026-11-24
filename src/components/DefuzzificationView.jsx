import React from 'react';
import { Target, Layers, HelpCircle, Activity } from 'lucide-react';

export const DefuzzificationView = ({
  fuzzyOutput,
  outputConfig,
  defuzzResult,
  defuzzMethod,
  setDefuzzMethod,
}) => {
  const { xPoints, yValues, ruleOutputProfiles, min, max } = fuzzyOutput;
  const width = 500;
  const height = 180;
  const padding = { top: 25, right: 30, bottom: 30, left: 45 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const scaleX = (x) => padding.left + ((x - min) / (max - min)) * innerWidth;
  const scaleY = (y) => padding.top + innerHeight - y * innerHeight;

  // Build aggregate filled polygon
  const polyPoints = [
    `${scaleX(min)},${scaleY(0)}`,
    ...xPoints.map((x, i) => `${scaleX(x)},${scaleY(yValues[i])}`),
    `${scaleX(max)},${scaleY(0)}`,
  ];
  const polyData = `M ${polyPoints.join(' L ')} Z`;

  const crispVal = defuzzResult.crispValue;

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800">
      {/* Header and Method Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm tracking-wide text-slate-200 uppercase">
              Aggregated Fuzzy Set &amp; Defuzzification
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Union Envelope μ_agg(y) = max(μ_C'k(y))
          </span>
        </div>

        {/* Method Picker */}
        <div className="flex items-center space-x-2">
          <label className="text-xs text-slate-400">Method:</label>
          <select
            value={defuzzMethod}
            onChange={(e) => setDefuzzMethod(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="centroid">Centroid (Center of Gravity - COG)</option>
            <option value="bisector">Bisector of Area (BOA)</option>
            <option value="mom">Mean of Maximum (MOM)</option>
            <option value="som">Smallest of Maximum (SOM)</option>
            <option value="lom">Largest of Maximum (LOM)</option>
          </select>
        </div>
      </div>

      {/* Aggregated Output SVG Chart */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          {/* Grid lines */}
          <line
            x1={padding.left}
            y1={scaleY(0)}
            x2={width - padding.right}
            y2={scaleY(0)}
            stroke="#334155"
            strokeWidth="1.5"
          />
          <line
            x1={padding.left}
            y1={scaleY(1)}
            x2={width - padding.right}
            y2={scaleY(1)}
            stroke="#1e293b"
            strokeDasharray="3 3"
            strokeWidth="1"
          />

          {/* Y Axis Labels */}
          <text x={padding.left - 6} y={scaleY(0) + 3} textAnchor="end" className="text-[9px] fill-slate-500 font-mono">0.0</text>
          <text x={padding.left - 6} y={scaleY(0.5) + 3} textAnchor="end" className="text-[9px] fill-slate-500 font-mono">0.5</text>
          <text x={padding.left - 6} y={scaleY(1) + 3} textAnchor="end" className="text-[9px] fill-slate-500 font-mono">1.0</text>

          {/* X Axis Labels */}
          <text x={padding.left} y={height - 8} textAnchor="start" className="text-[9px] fill-slate-500 font-mono">{min} {outputConfig.unit}</text>
          <text x={width - padding.right} y={height - 8} textAnchor="end" className="text-[9px] fill-slate-500 font-mono">{max} {outputConfig.unit}</text>

          {/* Individual Rule Truncated Profiles (dashed outlines) */}
          {ruleOutputProfiles.map((rop, idx) => {
            if (rop.rule.firingStrength <= 0.001) return null;
            const pts = rop.profile.map((y, i) => `${scaleX(xPoints[i])},${scaleY(y)}`);
            return (
              <path
                key={idx}
                d={`M ${pts.join(' L ')}`}
                fill="none"
                stroke={rop.targetMF?.color || '#94a3b8'}
                strokeWidth="1"
                strokeDasharray="3 2"
                opacity="0.4"
              />
            );
          })}

          {/* Union / Aggregated Filled Polygon */}
          <defs>
            <linearGradient id="aggGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path
            d={polyData}
            fill="url(#aggGradient)"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Defuzzified Crisp Value Vertical Fulcrum Arrow */}
          <line
            x1={scaleX(crispVal)}
            y1={padding.top - 10}
            x2={scaleX(crispVal)}
            y2={scaleY(0)}
            stroke="#10b981"
            strokeWidth="2.5"
          />

          {/* Fulcrum Balance Triangle */}
          <polygon
            points={`
              ${scaleX(crispVal)},${scaleY(0)}
              ${scaleX(crispVal) - 7},${scaleY(0) + 12}
              ${scaleX(crispVal) + 7},${scaleY(0) + 12}
            `}
            fill="#10b981"
          />

          {/* Top Crisp Output Flag */}
          <g transform={`translate(${scaleX(crispVal)}, ${padding.top - 12})`}>
            <rect
              x="-42"
              y="-18"
              width="84"
              height="20"
              rx="4"
              fill="#064e3b"
              stroke="#10b981"
              strokeWidth="1"
            />
            <text
              x="0"
              y="-4"
              textAnchor="middle"
              className="text-[10px] font-mono font-bold fill-white"
            >
              y* = {crispVal.toFixed(2)} {outputConfig.unit}
            </text>
          </g>
        </svg>
      </div>

      {/* Output Summary Card */}
      <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
          <span className="text-[11px] text-slate-400 block">Crisp Actuation Signal:</span>
          <span className="text-xl font-mono font-bold text-emerald-400">
            {crispVal.toFixed(2)} <span className="text-xs font-normal text-slate-300">{outputConfig.unit}</span>
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
          <span className="text-[11px] text-slate-400 block">Total Integrated Area:</span>
          <span className="text-base font-mono font-bold text-sky-400">
            {defuzzResult.totalArea.toFixed(3)}
          </span>
          <span className="text-[10px] text-slate-500 block">∫ μ_agg(y) dy</span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
          <span className="text-[11px] text-slate-400 block">Inference Confidence:</span>
          <span className="text-base font-mono font-bold text-indigo-400">
            {(defuzzResult.confidence * 100).toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-500 block">Based on fired set mass</span>
        </div>
      </div>
    </div>
  );
};

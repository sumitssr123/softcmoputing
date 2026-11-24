import React from 'react';
import { evaluateMF } from '../engine/fuzzyEngine';

export const MembershipFunctionChart = ({
  inputConfig,
  currentValue,
  onChangeValue,
  fuzzifiedData,
  highlightStep,
}) => {
  const { min, max, mfs, name, unit } = inputConfig;
  const width = 360;
  const height = 150;
  const padding = { top: 20, right: 25, bottom: 25, left: 35 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Scale functions
  const scaleX = (x) => padding.left + ((x - min) / (max - min)) * innerWidth;
  const scaleY = (y) => padding.top + innerHeight - y * innerHeight;

  // Generate paths for each MF
  const resolution = 100;
  const step = (max - min) / (resolution - 1);

  return (
    <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 shadow-sm">
      {/* Header and Value Slider */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-xs font-semibold text-slate-200">{name}</h4>
          <span className="text-[10px] text-slate-400">Range: [{min}, {max}] {unit}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-bold text-sky-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {currentValue} {unit}
          </span>
        </div>
      </div>

      {/* SVG Chart */}
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
            strokeWidth="1"
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
          <line
            x1={padding.left}
            y1={scaleY(0.5)}
            x2={width - padding.right}
            y2={scaleY(0.5)}
            stroke="#1e293b"
            strokeDasharray="2 2"
            strokeWidth="1"
          />

          {/* Y Axis Labels */}
          <text x={padding.left - 6} y={scaleY(0) + 3} textAnchor="end" className="text-[9px] fill-slate-500 font-mono">0.0</text>
          <text x={padding.left - 6} y={scaleY(0.5) + 3} textAnchor="end" className="text-[9px] fill-slate-500 font-mono">0.5</text>
          <text x={padding.left - 6} y={scaleY(1) + 3} textAnchor="end" className="text-[9px] fill-slate-500 font-mono">1.0</text>

          {/* X Axis Labels */}
          <text x={padding.left} y={height - 6} textAnchor="start" className="text-[9px] fill-slate-500 font-mono">{min}</text>
          <text x={width - padding.right} y={height - 6} textAnchor="end" className="text-[9px] fill-slate-500 font-mono">{max}</text>

          {/* Membership Curves */}
          {mfs.map((mf) => {
            const points = [];
            for (let i = 0; i < resolution; i++) {
              const xVal = min + i * step;
              const yVal = evaluateMF(mf, xVal);
              points.push(`${scaleX(xVal)},${scaleY(yVal)}`);
            }
            const pathData = `M ${points.join(' L ')}`;
            const fillPath = `M ${scaleX(min)},${scaleY(0)} L ${points.join(' L ')} L ${scaleX(max)},${scaleY(0)} Z`;

            return (
              <g key={mf.id}>
                {/* Soft area fill */}
                <path
                  d={fillPath}
                  fill={mf.color}
                  fillOpacity="0.12"
                />
                {/* Curve line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={mf.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>
            );
          })}

          {/* Vertical Crisp Input Scan Line */}
          <line
            x1={scaleX(currentValue)}
            y1={padding.top - 5}
            x2={scaleX(currentValue)}
            y2={scaleY(0)}
            stroke="#38bdf8"
            strokeWidth="2"
            strokeDasharray="4 3"
            className="animate-pulse"
          />

          {/* Intersection Points & μ Badges */}
          {fuzzifiedData && fuzzifiedData.memberships.map((m) => {
            if (m.degree <= 0.001) return null;
            const cx = scaleX(currentValue);
            const cy = scaleY(m.degree);

            return (
              <g key={m.id} className="transition-all duration-200">
                <circle
                  cx={cx}
                  cy={cy}
                  r="5"
                  fill="#0f172a"
                  stroke={m.color}
                  strokeWidth="2.5"
                />
                {/* Tooltip badge */}
                <rect
                  x={cx > width - 80 ? cx - 65 : cx + 8}
                  y={cy - 12}
                  width="54"
                  height="18"
                  rx="4"
                  fill="#0f172a"
                  stroke={m.color}
                  strokeWidth="1"
                />
                <text
                  x={cx > width - 80 ? cx - 38 : cx + 35}
                  y={cy + 1}
                  textAnchor="middle"
                  className="text-[9px] font-mono font-bold fill-white"
                >
                  μ={m.degree.toFixed(2)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Interactive Input Slider */}
      <div className="mt-2.5 pt-2 border-t border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="text-[10px] text-slate-500 font-mono">Adjust:</span>
          <input
            type="range"
            min={min}
            max={max}
            step={inputConfig.step || 0.1}
            value={currentValue}
            onChange={(e) => onChangeValue(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 mt-2">
          {mfs.map((mf) => {
            const mem = fuzzifiedData?.memberships.find(m => m.id === mf.id);
            const active = (mem?.degree || 0) > 0;
            return (
              <span
                key={mf.id}
                className={`text-[10px] px-2 py-0.5 rounded-full flex items-center space-x-1 border ${
                  active
                    ? 'bg-slate-800 border-sky-500/40 text-slate-200 font-medium'
                    : 'bg-slate-900/50 border-slate-800/80 text-slate-500'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: mf.color }}></span>
                <span>{mf.name}</span>
                {active && <span className="font-mono text-sky-400">({mem.degree.toFixed(2)})</span>}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

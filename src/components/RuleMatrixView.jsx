import React from 'react';
import { Layers, ArrowRight, Zap, Check } from 'lucide-react';

export const RuleMatrixView = ({
  rules,
  evaluatedRules,
  outputConfig,
  currentStep,
}) => {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-sm tracking-wide text-slate-200 uppercase">
            Fuzzy Rule Base &amp; Inference Matrix
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">
          T-Norm: <strong className="text-sky-400 font-mono">Mamdani Min</strong>
        </span>
      </div>

      <div className="space-y-3">
        {evaluatedRules.map((rule, idx) => {
          const isActive = rule.firingStrength > 0.001;
          const targetTerm = outputConfig.mfs.find(m => m.id === rule.outputTermId);

          return (
            <div
              key={rule.id}
              className={`p-3 rounded-xl border transition-all duration-300 ${
                isActive
                  ? 'bg-slate-800/90 border-amber-500/50 shadow-md shadow-amber-500/5'
                  : 'bg-slate-900/40 border-slate-800 text-slate-500'
              }`}
            >
              {/* Rule title and firing meter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center space-x-2">
                  <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    isActive ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className={`font-semibold text-xs ${isActive ? 'text-slate-100' : 'text-slate-400'}`}>
                    {rule.name}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[11px] text-slate-400">Firing Strength (α):</span>
                  <div className="w-24 sm:w-32 bg-slate-950 rounded-full h-3 p-0.5 border border-slate-700/60 overflow-hidden flex items-center">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isActive ? 'bg-gradient-to-r from-amber-500 to-yellow-300' : 'bg-slate-700'
                      }`}
                      style={{ width: `${Math.round(rule.firingStrength * 100)}%` }}
                    />
                  </div>
                  <span className={`font-mono text-xs font-bold w-12 text-right ${
                    isActive ? 'text-amber-400' : 'text-slate-600'
                  }`}>
                    {rule.firingStrength.toFixed(3)}
                  </span>
                </div>
              </div>

              {/* Natural Language IF ... THEN ... */}
              <div className="text-xs flex flex-wrap items-center gap-1.5 font-mono text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                <span className="text-sky-400 font-bold">IF</span>
                {rule.conditions.map((c, cIdx) => (
                  <React.Fragment key={cIdx}>
                    <span className="text-slate-200">
                      {c.inputId} is <span className="text-cyan-300 underline underline-offset-2">{c.termId}</span>
                    </span>
                    {cIdx < rule.conditions.length - 1 && (
                      <span className="text-amber-400 font-bold">{rule.operator}</span>
                    )}
                  </React.Fragment>
                ))}
                <span className="text-sky-400 font-bold ml-1">THEN</span>
                <span className="text-slate-200 flex items-center space-x-1">
                  <span>{outputConfig.name} is</span>
                  <span 
                    className="font-bold px-1.5 py-0.5 rounded text-[11px] border ml-1"
                    style={{
                      color: targetTerm?.color || '#38bdf8',
                      borderColor: `${targetTerm?.color}40` || '#38bdf840',
                      backgroundColor: `${targetTerm?.color}15` || '#38bdf815',
                    }}
                  >
                    {targetTerm?.name || rule.outputTermId}
                  </span>
                </span>
              </div>

              {/* Consequent clipping note if step >= 4 */}
              {currentStep >= 4 && isActive && (
                <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between pt-1.5 border-t border-slate-700/40">
                  <span className="flex items-center space-x-1 text-sky-300">
                    <ArrowRight className="w-3 h-3" />
                    <span>Clipped consequent: {targetTerm?.name} truncated at height μ = {rule.firingStrength.toFixed(3)}</span>
                  </span>
                  <span className="text-emerald-400 font-medium">Contributes to Defuzzification</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

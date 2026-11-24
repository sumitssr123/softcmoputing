import React from 'react';
import { Terminal, Code } from 'lucide-react';

const PSEUDOCODE_LINES = [
  { line: 1, text: '// Fuzzy Logic Controller (Mamdani Inference)', step: null },
  { line: 2, text: 'function RUN_FUZZY_CONTROLLER(crisp_inputs):', step: 1 },
  { line: 3, text: '    // Step 1: Read continuous crisp measurements', step: 1 },
  { line: 4, text: '    inputs = acquire_sensors()', step: 1 },
  { line: 5, text: '    // Step 2: Fuzzify into linguistic terms [0, 1]', step: 2 },
  { line: 6, text: '    fuzzified = {}', step: 2 },
  { line: 7, text: '    for each input in inputs:', step: 2 },
  { line: 8, text: '        fuzzified[input] = [evaluate_mf(mf, val) for mf in input.mfs]', step: 2 },
  { line: 9, text: '    // Step 3: Evaluate rule base (T-Norm min)', step: 3 },
  { line: 10, text: '    for each rule in rule_base:', step: 3 },
  { line: 11, text: '        alpha[k] = min(antecedent_memberships)', step: 3 },
  { line: 12, text: '    // Step 4: Implication (clip) & Max-aggregation', step: 4 },
  { line: 13, text: '    mu_agg(y) = max_k( min(alpha[k], mu_consequent_k(y)) )', step: 4 },
  { line: 14, text: '    // Step 5: Defuzzify using Center of Gravity (COG)', step: 5 },
  { line: 15, text: '    crisp_output = integral(y * mu_agg(y)) / integral(mu_agg(y))', step: 5 },
  { line: 16, text: '    return crisp_output // Pass signal to actuator', step: 5 },
];

export const PseudocodeViewer = ({ currentStep }) => {
  return (
    <div className="glass-panel rounded-2xl p-4 shadow-lg border border-slate-800 font-mono text-xs">
      <div className="flex items-center space-x-2 pb-2 mb-2 border-b border-slate-800 text-slate-300">
        <Code className="w-3.5 h-3.5 text-sky-400" />
        <span className="font-bold text-[11px] uppercase tracking-wider text-slate-300">
          Algorithm Pseudocode Trace
        </span>
      </div>

      <div className="space-y-0.5 overflow-x-auto">
        {PSEUDOCODE_LINES.map((item) => {
          const isHighlighted = item.step === currentStep;
          return (
            <div
              key={item.line}
              className={`flex items-center px-2 py-0.5 rounded transition-all duration-200 ${
                isHighlighted
                  ? 'bg-sky-500/20 text-sky-200 border-l-2 border-sky-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <span className="w-6 text-[10px] text-slate-600 select-none text-right mr-3">
                {item.line}
              </span>
              <pre className="font-mono text-[11px] whitespace-pre">{item.text}</pre>
            </div>
          );
        })}
      </div>
    </div>
  );
};

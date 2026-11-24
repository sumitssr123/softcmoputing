import React from 'react';
import { Info, HelpCircle, CheckCircle, ArrowRight, Zap, Target, Layers, Award } from 'lucide-react';

export const ExplanationPanel = ({ 
  currentStep, 
  problem, 
  pipelineResult, 
  crispInputs 
}) => {
  const { fuzzified, evaluatedRules, activeRules, defuzzResult } = pipelineResult;

  const renderContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sky-400">
              <Target className="w-4 h-4" />
              <h4 className="font-semibold text-sm">Step 1: Reading Crisp Real-World Inputs</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Fuzzy logic controllers act as an interface between continuous physical sensors and human-like heuristic rules. 
              Here, exact numerical measurements are collected from the environment:
            </p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {problem.inputs.map((inp) => (
                <div key={inp.id} className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
                  <span className="text-[11px] text-slate-400 block">{inp.name}:</span>
                  <span className="text-base font-mono font-bold text-sky-300">
                    {crispInputs[inp.id]} {inp.unit}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Range: [{inp.min}, {inp.max}]
                  </span>
                </div>
              ))}
            </div>
            <div className="p-2.5 rounded-lg bg-sky-950/40 border border-sky-800/40 text-xs text-sky-200 flex items-start space-x-2">
              <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span>
                <strong>Next:</strong> In Step 2, each crisp number will be intersected with overlapping linguistic curves to compute partial truth degrees &mu; &isin; [0, 1].
              </span>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400">
              <Zap className="w-4 h-4" />
              <h4 className="font-semibold text-sm">Step 2: Fuzzification (Grade of Membership)</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Unlike classical boolean logic where a statement is strictly 0 or 1, fuzzy sets allow <em>gradual membership</em>.
              Each crisp input is evaluated against its membership functions &mu;<sub>A</sub>(x) &isin; [0, 1]:
            </p>
            <div className="space-y-2 mt-2">
              {problem.inputs.map((inp) => {
                const data = fuzzified[inp.id];
                return (
                  <div key={inp.id} className="p-2 rounded-lg bg-slate-800/70 border border-slate-700/50">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-semibold text-slate-300">{inp.name} ({data.value} {inp.unit})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {data.memberships.map((m) => (
                        <div
                          key={m.id}
                          className={`px-2 py-1 rounded text-[11px] font-mono flex items-center space-x-1.5 border ${
                            m.degree > 0
                              ? 'bg-slate-900 border-sky-500/40 text-sky-200 shadow-sm'
                              : 'bg-slate-900/40 border-slate-800 text-slate-500'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }}></span>
                          <span>{m.name}:</span>
                          <strong className={m.degree > 0 ? 'text-sky-400' : 'text-slate-600'}>
                            {m.degree.toFixed(3)}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400">
              Note how input values near linguistic boundaries fire multiple membership sets simultaneously, producing smooth interpolation.
            </p>
          </div>
        );

      case 3:
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-amber-400">
              <CheckCircle className="w-4 h-4" />
              <h4 className="font-semibold text-sm">Step 3: Rule Evaluation &amp; Firing Strengths</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              The rule base applies expert heuristics in the form: 
              <code className="text-sky-300 font-mono text-[11px] px-1 py-0.5 bg-slate-800 rounded mx-1">
                IF &lt;antecedents&gt; THEN &lt;consequent&gt;
              </code>.
              For multiple conditions, fuzzy operators combine the inputs:
            </p>
            <ul className="text-xs text-slate-400 list-disc list-inside space-y-0.5 ml-1">
              <li><strong>AND</strong> operator uses <em>Min T-Norm</em>: &alpha; = min(&mu;<sub>1</sub>, &mu;<sub>2</sub>)</li>
              <li><strong>OR</strong> operator uses <em>Max T-Conorm</em>: &alpha; = max(&mu;<sub>1</sub>, &mu;<sub>2</sub>)</li>
            </ul>

            <div className="space-y-1.5 mt-2">
              {evaluatedRules.map((r) => (
                <div
                  key={r.id}
                  className={`p-2 rounded-lg border text-xs transition ${
                    r.firingStrength > 0
                      ? 'bg-amber-950/20 border-amber-500/40 text-amber-100'
                      : 'bg-slate-900/40 border-slate-800/60 text-slate-500'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-300">{r.name}</span>
                    <span className="font-mono font-bold text-amber-400">
                      Strength &alpha; = {r.firingStrength.toFixed(3)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{r.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-cyan-400">
              <Layers className="w-4 h-4" />
              <h4 className="font-semibold text-sm">Step 4: Consequent Implication &amp; Aggregation</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              In Mamdani inference, each rule firing strength &alpha;<sub>k</sub> is used to <strong>clip (truncate)</strong> the corresponding output membership triangle:
              &mu;<sub>C&apos;<sub>k</sub></sub>(y) = min(&alpha;<sub>k</sub>, &mu;<sub>C<sub>k</sub></sub>(y)).
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Then, all clipped fuzzy sets are unified through the <strong>Max Aggregation Operator</strong>:
              &mu;<sub>agg</sub>(y) = max<sub>k</sub>(&mu;<sub>C&apos;<sub>k</sub></sub>(y)).
            </p>
            <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              <span className="text-slate-400 block mb-1">Active Rules Participating in Aggregated Envelope:</span>
              <div className="space-y-1">
                {activeRules.map((ar) => (
                  <div key={ar.id} className="flex justify-between items-center text-[11px]">
                    <span className="text-sky-300 font-medium">{ar.name} ({ar.outputTermId}):</span>
                    <span className="font-mono text-slate-300">Clipped at height = {ar.firingStrength.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-violet-400">
              <Award className="w-4 h-4" />
              <h4 className="font-semibold text-sm">Step 5: Defuzzification (Crisp Actuation)</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              The aggregated fuzzy region represents an entire spectrum of possibility. To control physical actuators (e.g. brakes, motors, tip payments), we collapse this fuzzy shape into a single <strong>crisp number</strong>.
            </p>
            <div className="p-3 rounded-lg bg-gradient-to-r from-violet-950/40 to-sky-950/40 border border-violet-500/30 text-xs">
              <span className="text-violet-300 font-semibold block mb-1">
                Center of Gravity (Centroid / COG):
              </span>
              <p className="font-mono text-slate-300 text-[11px] mb-2">
                y* = &int; y &middot; &mu;(y) dy / &int; &mu;(y) dy &approx; &Sigma; (y<sub>i</sub> &middot; &mu;(y<sub>i</sub>)) / &Sigma; &mu;(y<sub>i</sub>)
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                <span className="text-slate-300">Final Crisp Control Output:</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {defuzzResult.crispValue.toFixed(2)} {problem.output.unit}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              {defuzzResult.details}
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse"></span>
          <h3 className="font-bold text-sm tracking-wide text-slate-200 uppercase">
            Pedagogical Step Narration
          </h3>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
          Step {currentStep} of 5
        </span>
      </div>
      {renderContent()}
    </div>
  );
};


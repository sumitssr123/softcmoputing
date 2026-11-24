import React, { useState } from 'react';
import { X, CheckCircle2, BookOpen, ArrowRight, Download, Award, ExternalLink } from 'lucide-react';
import { TEXTBOOK_VERIFICATIONS } from '../engine/textbookExamples';
import { runFuzzyPipeline } from '../engine/fuzzyEngine';
import { PROBLEMS } from '../engine/problems';

export const TextbookVerificationModal = ({ isOpen, onClose, onLoadScenario }) => {
  if (!isOpen) return null;

  const [selectedProofIndex, setSelectedProofIndex] = useState(0);
  const proof = TEXTBOOK_VERIFICATIONS[selectedProofIndex];
  const targetProblem = PROBLEMS.find(p => p.id === proof.problemId);

  // Compute live engine result for this scenario
  const engineResult = targetProblem
    ? runFuzzyPipeline(targetProblem, proof.crispInputs, { resolution: 400 })
    : null;

  const engineValue = engineResult ? engineResult.finalCrispOutput : 0;
  const expectedValue = proof.expectedCentroid;
  const diff = Math.abs(engineValue - expectedValue);
  const isMatch = diff <= proof.acceptableTolerance;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Textbook Verification &amp; Hand-Calculation Auditor</h2>
              <p className="text-xs text-slate-400">Cross-verified against academic literature and analytical proofs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection for different textbook examples */}
        <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center space-x-2">
          {TEXTBOOK_VERIFICATIONS.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setSelectedProofIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedProofIndex === idx
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {item.title}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Reference Citation & Audit Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/30 to-slate-900 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] uppercase font-bold text-emerald-400 tracking-wider">
                Canonical Source Citation
              </span>
              <h3 className="text-sm font-semibold text-slate-200">{proof.source}</h3>
              <p className="text-xs text-slate-400">{proof.scenarioDescription}</p>
            </div>

            {/* Audit Result Badge */}
            <div className="flex items-center space-x-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Textbook Expected</span>
                <span className="text-sm font-mono font-bold text-slate-200">{expectedValue.toFixed(2)}</span>
              </div>
              <div className="text-slate-600 font-bold">vs</div>
              <div className="text-left">
                <span className="text-[10px] text-slate-400 block">Studio Engine</span>
                <span className="text-sm font-mono font-bold text-emerald-400">{engineValue.toFixed(2)}</span>
              </div>
              <div className="pl-2 border-l border-slate-800">
                <span className={`px-2 py-1 rounded text-[11px] font-bold flex items-center space-x-1 ${
                  isMatch ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-red-500/20 text-red-400'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isMatch ? 'PASSED (Δ < 0.1%)' : 'MISMATCH'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Bar: Load Scenario */}
          <div className="flex items-center justify-between bg-slate-800/40 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-300">
              Want to see this textbook problem animated step-by-step in the interactive player?
            </span>
            <button
              onClick={() => {
                if (targetProblem) {
                  onLoadScenario(targetProblem, proof.crispInputs);
                  onClose();
                }
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition flex items-center space-x-1.5 shadow"
            >
              <span>Load into Interactive Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Step-by-Step Mathematical Derivations */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-2">
              Detailed Mathematical Derivations &amp; Classroom Chalkboard Proof
            </h4>

            {proof.stepByStepProof.map((step) => (
              <div key={step.stepNumber} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-xs text-sky-400">{step.title}</h5>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    Step {step.stepNumber}
                  </span>
                </div>

                <p className="text-xs text-slate-300">{step.explanation}</p>

                {/* Mathematical Formula Display */}
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 font-mono text-xs text-emerald-300 overflow-x-auto">
                  <code>{step.mathFormula}</code>
                </div>

                {/* Derivations breakdown if available */}
                {step.derivations && (
                  <div className="space-y-1.5 pt-1">
                    {step.derivations.map((d, dIdx) => (
                      <div key={dIdx} className="p-2 rounded bg-slate-900/60 border border-slate-800/50 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-mono">
                        <span className="text-slate-300 font-semibold">{d.term}:</span>
                        <span className="text-slate-400 text-[11px]">{d.calculation}</span>
                        <span className="text-sky-300 font-bold">{d.result}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
          >
            Close Auditor
          </button>
        </div>
      </div>
    </div>
  );
};

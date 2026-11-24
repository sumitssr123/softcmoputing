import React, { useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, FastForward } from 'lucide-react';

const STEPS = [
  { step: 1, label: '1. Crisp Inputs', desc: 'Read sensor inputs' },
  { step: 2, label: '2. Fuzzification', desc: 'Evaluate membership μ' },
  { step: 3, label: '3. Rule Firing', desc: 'Antecedent T-Norm' },
  { step: 4, label: '4. Implication & Aggregation', desc: 'Clip sets & Max union' },
  { step: 5, label: '5. Defuzzification', desc: 'Compute Centroid (COG)' },
];

export const VisuAlgoPlayer = ({
  currentStep,
  setCurrentStep,
  isPlaying,
  setIsPlaying,
  speed,
  setSpeed,
  onReset,
}) => {
  // Auto-play timer
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= 5) {
            setIsPlaying(false);
            return 5;
          }
          return prev + 1;
        });
      }, 2000 / speed);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, speed, setCurrentStep, setIsPlaying]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-800 backdrop-blur-md px-4 py-3 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Step Progress Pills (VisuAlgo timeline scrubber) */}
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {STEPS.map((s) => {
            const isActive = currentStep === s.step;
            const isPast = currentStep > s.step;
            return (
              <button
                key={s.step}
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStep(s.step);
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30 scale-105'
                    : isPast
                    ? 'bg-slate-800 text-sky-400 hover:bg-slate-700/80 border border-sky-500/20'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                }`}
              >
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                  isActive ? 'bg-white text-sky-600' : isPast ? 'bg-sky-400/20 text-sky-400' : 'bg-slate-700 text-slate-400'
                }`}>
                  {s.step}
                </span>
                <span className="whitespace-nowrap">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Playback Controls */}
        <div className="flex items-center space-x-3">
          {/* Reset button */}
          <button
            onClick={onReset}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition shadow"
            title="Reset to Step 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Step Backward */}
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentStep((p) => Math.max(1, p - 1));
            }}
            disabled={currentStep <= 1}
            className={`p-2 rounded-lg bg-slate-800 text-slate-300 transition shadow ${
              currentStep <= 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-700 hover:text-white'
            }`}
            title="Previous Step"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play / Pause toggle */}
          <button
            onClick={() => {
              if (currentStep >= 5 && !isPlaying) {
                setCurrentStep(1);
              }
              setIsPlaying(!isPlaying);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-lg shadow-sky-500/25 hover:from-sky-400 hover:to-cyan-400 transition transform active:scale-95"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Play</span>
              </>
            )}
          </button>

          {/* Step Forward */}
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentStep((p) => Math.min(5, p + 1));
            }}
            disabled={currentStep >= 5}
            className={`p-2 rounded-lg bg-slate-800 text-slate-300 transition shadow ${
              currentStep >= 5 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-700 hover:text-white'
            }`}
            title="Next Step"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center space-x-1 bg-slate-800 rounded-lg p-1 border border-slate-700/60 text-xs">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold transition ${
                  speed === s ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

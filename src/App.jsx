import React, { useState, useMemo } from 'react';
import { PROBLEMS } from './engine/problems';
import { runFuzzyPipeline } from './engine/fuzzyEngine';
import { Navbar } from './components/Navbar';
import { VisuAlgoPlayer } from './components/VisuAlgoPlayer';
import { ExplanationPanel } from './components/ExplanationPanel';
import { MembershipFunctionChart } from './components/MembershipFunctionChart';
import { RuleMatrixView } from './components/RuleMatrixView';
import { DefuzzificationView } from './components/DefuzzificationView';
import { PseudocodeViewer } from './components/PseudocodeViewer';
import { SimulationCanvas } from './components/SimulationCanvas';
import { ControlSurface3D } from './components/ControlSurface3D';
import { TextbookVerificationModal } from './components/TextbookVerificationModal';
import { QuizMode } from './components/QuizMode';
import { CodeExportModal } from './components/CodeExportModal';
import { BookOpen, Sparkles, SlidersHorizontal, Info, ShieldCheck, Github } from 'lucide-react';

export default function App() {
  const [currentProblem, setCurrentProblem] = useState(PROBLEMS[0]);
  const [activeTab, setActiveTab] = useState('studio'); // 'studio' | 'surface3d' | 'simulation'

  // Current crisp input values (e.g. { service: 6.5, food: 9.8 })
  const [crispInputs, setCrispInputs] = useState(() => {
    const init = {};
    PROBLEMS[0].inputs.forEach((inp) => {
      init[inp.id] = inp.default;
    });
    return init;
  });

  // VisuAlgo Player state
  const [currentStep, setCurrentStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [defuzzMethod, setDefuzzMethod] = useState('centroid');

  // Modals
  const [isTextbookOpen, setIsTextbookOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isCodeExportOpen, setIsCodeExportOpen] = useState(false);

  // Switch problem helper
  const handleSelectProblem = (problem) => {
    setCurrentProblem(problem);
    const newInputs = {};
    problem.inputs.forEach((inp) => {
      newInputs[inp.id] = inp.default;
    });
    setCrispInputs(newInputs);
    setCurrentStep(1);
    setIsPlaying(false);
  };

  // Load scenario from Textbook Verification modal
  const handleLoadScenario = (targetProblem, newInputs) => {
    setCurrentProblem(targetProblem);
    setCrispInputs(newInputs);
    setCurrentStep(1);
    setIsPlaying(false);
  };

  // Run Fuzzy Pipeline
  const pipelineResult = useMemo(() => {
    return runFuzzyPipeline(currentProblem, crispInputs, {
      defuzzMethod,
      resolution: 300,
    });
  }, [currentProblem, crispInputs, defuzzMethod]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-24">
      {/* Top Navigation */}
      <Navbar
        problems={PROBLEMS}
        currentProblem={currentProblem}
        onSelectProblem={handleSelectProblem}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenTextbook={() => setIsTextbookOpen(true)}
        onOpenQuiz={() => setIsQuizOpen(true)}
        onOpenCodeExport={() => setIsCodeExportOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-6">
        
        {/* Banner: Problem Header & Context */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">
                {currentProblem.category}
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400">{currentProblem.realWorldContext}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {currentProblem.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {currentProblem.description}
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center space-x-3 bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 self-start md:self-center shrink-0">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Fuzzy Output Signal</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {pipelineResult.finalCrispOutput.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 ml-1">{currentProblem.output.unit}</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Active Rules</span>
              <span className="text-xl font-bold font-mono text-amber-400">
                {pipelineResult.activeRules.length} / {currentProblem.rules.length}
              </span>
            </div>
          </div>
        </div>

        {/* TAB 1: INTERACTIVE STUDIO (VISUALGO STYLE STEP-BY-STEP) */}
        {activeTab === 'studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Visual Membership Curves & Rule Matrix (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Membership Function Curves for all Inputs */}
              <div className="glass-panel rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <SlidersHorizontal className="w-4 h-4 text-sky-400" />
                    <h3 className="font-bold text-sm tracking-wide text-slate-200 uppercase">
                      Linguistic Membership Curves (Inputs)
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Drag sliders or edit values
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentProblem.inputs.map((inp) => (
                    <MembershipFunctionChart
                      key={inp.id}
                      inputConfig={inp}
                      currentValue={crispInputs[inp.id]}
                      onChangeValue={(val) =>
                        setCrispInputs((prev) => ({ ...prev, [inp.id]: val }))
                      }
                      fuzzifiedData={pipelineResult.fuzzified[inp.id]}
                      highlightStep={currentStep}
                    />
                  ))}
                </div>
              </div>

              {/* Rule Inference Matrix */}
              <RuleMatrixView
                rules={currentProblem.rules}
                evaluatedRules={pipelineResult.evaluatedRules}
                outputConfig={currentProblem.output}
                currentStep={currentStep}
              />

              {/* Aggregated Output Polygon & Defuzzification */}
              <DefuzzificationView
                fuzzyOutput={pipelineResult.fuzzyOutput}
                outputConfig={currentProblem.output}
                defuzzResult={pipelineResult.defuzzResult}
                defuzzMethod={defuzzMethod}
                setDefuzzMethod={setDefuzzMethod}
              />
            </div>

            {/* Right Column: Pedagogical Explanation & Algorithm Pseudocode (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Plain-Language Explanation Panel */}
              <ExplanationPanel
                currentStep={currentStep}
                problem={currentProblem}
                pipelineResult={pipelineResult}
                crispInputs={crispInputs}
              />

              {/* VisuAlgo-Style Pseudocode Line-by-Line Highlighter */}
              <PseudocodeViewer currentStep={currentStep} />

              {/* Quick Plant Preview Widget */}
              <SimulationCanvas
                problem={currentProblem}
                crispInputs={crispInputs}
                setCrispInputs={setCrispInputs}
                pipelineResult={pipelineResult}
              />
            </div>
          </div>
        )}

        {/* TAB 2: 3D CONTROL SURFACE */}
        {activeTab === 'surface3d' && (
          <div className="space-y-6">
            <ControlSurface3D
              problem={currentProblem}
              currentCrispInputs={crispInputs}
            />
          </div>
        )}

        {/* TAB 3: DYNAMIC SIMULATION */}
        {activeTab === 'simulation' && (
          <div className="space-y-6">
            <SimulationCanvas
              problem={currentProblem}
              crispInputs={crispInputs}
              setCrispInputs={setCrispInputs}
              pipelineResult={pipelineResult}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RuleMatrixView
                rules={currentProblem.rules}
                evaluatedRules={pipelineResult.evaluatedRules}
                outputConfig={currentProblem.output}
                currentStep={currentStep}
              />
              <DefuzzificationView
                fuzzyOutput={pipelineResult.fuzzyOutput}
                outputConfig={currentProblem.output}
                defuzzResult={pipelineResult.defuzzResult}
                defuzzMethod={defuzzMethod}
                setDefuzzMethod={setDefuzzMethod}
              />
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom VisuAlgo Playback Control Bar */}
      <VisuAlgoPlayer
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        speed={speed}
        setSpeed={setSpeed}
        onReset={() => {
          setIsPlaying(false);
          setCurrentStep(1);
        }}
      />

      {/* Modals */}
      <TextbookVerificationModal
        isOpen={isTextbookOpen}
        onClose={() => setIsTextbookOpen(false)}
        onLoadScenario={handleLoadScenario}
      />

      <QuizMode
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
      />

      <CodeExportModal
        isOpen={isCodeExportOpen}
        onClose={() => setIsCodeExportOpen(false)}
        problem={currentProblem}
      />

      {/* Footer / GitHub Repository Attribution */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span>Built for Soft Computing Coursework</span>
            <span>•</span>
            <span className="text-slate-400">Interactive Fuzzy Logic Studio</span>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/sumitssr123/softcmoputing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white flex items-center space-x-1.5 transition"
            >
              <Github className="w-3.5 h-3.5" />
              <span>sumitssr123/softcmoputing</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

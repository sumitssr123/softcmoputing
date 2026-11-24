import React from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, RotateCcw, 
  HelpCircle, BookOpen, Layers, Activity, Award, Code2, 
  Box, ChevronRight, Sliders, CheckCircle2 
} from 'lucide-react';

export const Navbar = ({ 
  problems, 
  currentProblem, 
  onSelectProblem, 
  activeTab, 
  setActiveTab,
  onOpenTextbook,
  onOpenQuiz,
  onOpenCodeExport,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 p-0.5 shadow-lg shadow-sky-500/20 flex items-center justify-center">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Activity className="h-5 w-5 text-sky-400 animate-pulse-subtle" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-sky-400 bg-clip-text text-transparent">
                FuzzyLogic Studio
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Interactive Lab
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Soft Computing Algorithm Visualizer &amp; Pedagogical Engine
            </p>
          </div>
        </div>

        {/* Problem Selector Dropdown */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <label className="text-xs text-slate-400 mr-2 hidden md:inline-block">Problem:</label>
            <select
              value={currentProblem.id}
              onChange={(e) => {
                const p = problems.find(prob => prob.id === e.target.value);
                if (p) onSelectProblem(p);
              }}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer hover:border-slate-600 transition"
            >
              {problems.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="hidden lg:flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 ${
              activeTab === 'studio'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Interactive Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('surface3d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 ${
              activeTab === 'surface3d'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Control Surface</span>
          </button>

          <button
            onClick={() => setActiveTab('simulation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 ${
              activeTab === 'simulation'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live Physics Sim</span>
          </button>
        </div>

        {/* Action Modals: Textbook Proof & Quiz & Code */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenTextbook}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition flex items-center space-x-1.5 shadow-sm"
            title="Compare against rigorous textbook hand calculation"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Textbook Proof</span>
          </button>

          <button
            onClick={onOpenQuiz}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition flex items-center space-x-1.5 shadow-sm"
            title="Interactive Math Quiz"
          >
            <Award className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Practice Quiz</span>
          </button>

          <button
            onClick={onOpenCodeExport}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20 transition flex items-center space-x-1.5 shadow-sm"
            title="Export Python / C++ Code"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Code</span>
          </button>
        </div>
      </div>
    </header>
  );
};

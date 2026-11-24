import React, { useState } from 'react';
import { X, Award, CheckCircle2, AlertCircle, HelpCircle, ArrowRight, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: 'A triangular membership function is parameterized as [a, b, c] = [2, 5, 8]. What is the membership degree μ at crisp input x = 4?',
    options: [
      { text: 'μ = 0.67 (2/3)', correct: true, explanation: 'For x in [a, b], μ(x) = (x - a) / (b - a) = (4 - 2) / (5 - 2) = 2/3 ≈ 0.667.' },
      { text: 'μ = 0.50 (1/2)', correct: false, explanation: 'Incorrect: (4 - 2)/(5 - 2) evaluates to 2/3.' },
      { text: 'μ = 0.33 (1/3)', correct: false, explanation: 'Incorrect: that would be (c - x)/(c - b).' },
      { text: 'μ = 1.00', correct: false, explanation: 'Incorrect: μ reaches 1 only at vertex b = 5.' },
    ],
  },
  {
    id: 2,
    question: 'In Mamdani inference, if Rule 1 states "IF Service is Good (μ=0.7) AND Food is Fresh (μ=0.4)", what is the firing strength using Min T-Norm?',
    options: [
      { text: 'α = 0.40', correct: true, explanation: 'Min T-norm computes min(0.7, 0.4) = 0.40.' },
      { text: 'α = 0.70', correct: false, explanation: '0.70 would be the result if using OR (Max T-conorm).' },
      { text: 'α = 0.28', correct: false, explanation: '0.28 is the Larsen product t-norm, not standard Mamdani min.' },
      { text: 'α = 1.10', correct: false, explanation: 'Membership truth values never exceed 1.0.' },
    ],
  },
  {
    id: 3,
    question: 'Why is Centroid (Center of Gravity / COG) the most popular defuzzification method in engineering control?',
    options: [
      { text: 'It produces smooth, continuous control signals without abrupt jumps', correct: true, explanation: 'Centroid integrates all rule masses, ensuring continuous differentiability and no sudden jumps in motor or brake actuators.' },
      { text: 'It is the computationally simplest method to evaluate on 8-bit CPUs', correct: false, explanation: 'Mean of Max (MOM) or Sugeno is computationally simpler; Centroid requires numerical integration.' },
      { text: 'It always outputs integer values', correct: false, explanation: 'Centroid outputs continuous real numbers.' },
      { text: 'It ignores rules that have low firing strengths', correct: false, explanation: 'Centroid accounts for every active rule proportionally to its area.' },
    ],
  },
  {
    id: 4,
    question: 'Two clipped symmetrical triangles of equal area A = 2.0 have individual centroids at y = 10 and y = 20. What is the combined centroid of their union if they do not overlap?',
    options: [
      { text: 'y* = 15.0', correct: true, explanation: 'y* = (10 * 2 + 20 * 2) / (2 + 2) = (20 + 40) / 4 = 60 / 4 = 15.0.' },
      { text: 'y* = 12.5', correct: false, explanation: 'Both sets have equal weight, so the balance point is exactly at the midpoint 15.0.' },
      { text: 'y* = 20.0', correct: false, explanation: 'Incorrect.' },
      { text: 'y* = 30.0', correct: false, explanation: 'Centroid must lie within the convex hull of the points [10, 20].' },
    ],
  },
];

export const QuizMode = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = QUIZ_QUESTIONS[currentQIndex];

  const handleSelectOption = (idx) => {
    if (hasAnswered) return;
    setSelectedOption(idx);
    setHasAnswered(true);

    if (currentQ.options[idx].correct) {
      setScore((s) => s + 1);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    }
  };

  const handleNext = () => {
    if (currentQIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentQIndex((i) => i + 1);
      setSelectedOption(null);
      setHasAnswered(false);
    } else {
      setIsFinished(true);
      confetti({ particleCount: 100, spread: 90, origin: { y: 0.5 } });
    }
  };

  const handleRestart = () => {
    setCurrentQIndex(0);
    setSelectedOption(null);
    setHasAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Soft Computing Interactive Quiz</h2>
              <p className="text-xs text-slate-400">Test your mastery of Fuzzification, Rules &amp; Centroid Defuzzification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {!isFinished ? (
            <>
              {/* Question Tracker */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Question {currentQIndex + 1} of {QUIZ_QUESTIONS.length}</span>
                <span className="font-mono text-amber-400">Score: {score} / {QUIZ_QUESTIONS.length}</span>
              </div>

              {/* Question Text */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <h3 className="font-semibold text-sm sm:text-base text-slate-100 leading-snug">
                  {currentQ.question}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQ.options.map((opt, idx) => {
                  let btnStyle = 'bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-700 hover:border-slate-600';
                  if (hasAnswered) {
                    if (opt.correct) {
                      btnStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow-sm';
                    } else if (selectedOption === idx) {
                      btnStyle = 'bg-red-950/40 border-red-500 text-red-200';
                    } else {
                      btnStyle = 'bg-slate-900/40 border-slate-800/60 text-slate-500 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={hasAnswered}
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition flex items-center justify-between ${btnStyle}`}
                    >
                      <span>{opt.text}</span>
                      {hasAnswered && opt.correct && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                      )}
                      {hasAnswered && selectedOption === idx && !opt.correct && (
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation after answering */}
              {hasAnswered && (
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 animate-in fade-in space-y-2">
                  <div className="font-semibold text-sky-400 flex items-center space-x-1.5">
                    <HelpCircle className="w-4 h-4" />
                    <span>Explanation &amp; Math Breakdown:</span>
                  </div>
                  <p>{currentQ.options[selectedOption]?.explanation || currentQ.options.find(o => o.correct)?.explanation}</p>
                </div>
              )}
            </>
          ) : (
            /* Quiz Completed View */
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Quiz Completed!</h3>
              <p className="text-sm text-slate-300">
                You scored <strong className="text-amber-400 font-mono text-base">{score}</strong> out of <strong className="text-slate-100 font-mono">{QUIZ_QUESTIONS.length}</strong>!
              </p>
              <div className="pt-4 flex justify-center space-x-3">
                <button
                  onClick={handleRestart}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition flex items-center space-x-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Try Again</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 transition"
                >
                  Return to Studio
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isFinished && (
          <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex justify-between items-center">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Exit
            </button>
            {hasAnswered && (
              <button
                onClick={handleNext}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 transition flex items-center space-x-1"
              >
                <span>{currentQIndex < QUIZ_QUESTIONS.length - 1 ? 'Next Question' : 'View Results'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ARITHMETIC_QUESTIONS } from '../data';
import { ArithmeticQuestion, LearningLog } from '../types';
import { Coins, Lightbulb, CheckCircle2, XCircle, ArrowRight, RotateCcw, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ArithmeticGameProps {
  onComplete: (logs: Omit<LearningLog, 'id' | 'timestamp'>[]) => void;
  onAddCoins: (coins: number) => void;
}

const playSuccessSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    // Play dual-tone chime
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    
    osc1.type = 'sine';
    osc2.type = 'sine';
    
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc2.frequency.setValueAtTime(659.25, now); // E5
    
    osc1.frequency.setValueAtTime(1046.50, now + 0.15); // C6
    osc2.frequency.setValueAtTime(1318.51, now + 0.15); // E6
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.4);
  } catch (e) {}
};

const playFailureSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(120, now + 0.25);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    
    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {}
};

export default function ArithmeticGame({ onComplete, onAddCoins }: ArithmeticGameProps) {
  const [questions, setQuestions] = useState<ArithmeticQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [sessionLogs, setSessionLogs] = useState<Omit<LearningLog, 'id' | 'timestamp'>[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  // Initialize and shuffle 5 questions from the bank
  useEffect(() => {
    const shuffled = [...ARITHMETIC_QUESTIONS].sort(() => 0.5 - Math.random()).slice(0, 5);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setSessionLogs([]);
    setIsFinished(false);
    setHasAnswered(false);
    setSelectedOption(null);
    setShowHint(false);
  }, []);

  if (questions.length === 0) return null;

  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (option: number) => {
    if (hasAnswered) return;
    
    setSelectedOption(option);
    setHasAnswered(true);
    const correct = option === currentQuestion.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      playSuccessSound();
      onAddCoins(5); // Reward coins directly
    } else {
      playFailureSound();
    }

    // Build log entry
    const newLog: Omit<LearningLog, 'id' | 'timestamp'> = {
      subject: 'math',
      topicName: getTopicName(currentQuestion.id),
      questionText: currentQuestion.questionText,
      userAnswer: currentQuestion.id === 'm10' ? `0.${option}` : option.toString(),
      correctAnswer: currentQuestion.id === 'm10' ? `0.${currentQuestion.correctAnswer}` : currentQuestion.correctAnswer.toString(),
      isCorrect: correct,
      score: correct ? 100 : 0,
      coinsEarned: correct ? 5 : 0,
      feedback: correct ? 'せいかい！ばっちりです！' : 'おしかったね！つぎはがんばろう！',
    };

    setSessionLogs((prev) => [...prev, newLog]);
  };

  const getTopicName = (id: string) => {
    if (['m1', 'm2', 'm3', 'm4'].includes(id)) return 'わり算';
    if (['m5', 'm6', 'm7'].includes(id)) return 'かけ算筆算';
    if (['m8'].includes(id)) return 'あまりのあるわり算';
    if (['m9'].includes(id)) return '大きな数';
    return '小数・分数';
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setHasAnswered(false);
      setSelectedOption(null);
      setShowHint(false);
    } else {
      setIsFinished(true);
      onComplete(sessionLogs);
    }
  };

  const restartGame = () => {
    const shuffled = [...ARITHMETIC_QUESTIONS].sort(() => 0.5 - Math.random()).slice(0, 5);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setSessionLogs([]);
    setIsFinished(false);
    setHasAnswered(false);
    setSelectedOption(null);
    setShowHint(false);
  };

  const totalCoinsEarned = sessionLogs.reduce((sum, log) => sum + log.coinsEarned, 0);
  const correctCount = sessionLogs.filter(log => log.isCorrect).length;

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl border-4 border-blue-200 p-6 shadow-sm">
      
      {!isFinished ? (
        /* Active Quiz Screen */
        <div className="flex flex-col">
          
          {/* Header Stats */}
          <div className="flex justify-between items-center border-b border-blue-50 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 font-black text-xs rounded-full">
                さんすうドリル
              </span>
              <span className="text-xs text-slate-400 font-bold">
                第 {currentIndex + 1} / {questions.length} 問
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-xl border border-amber-100">
              <Coins className="text-amber-500 fill-amber-300" size={16} />
              <span className="text-xs text-amber-800 font-black font-mono">+{totalCoinsEarned}</span>
            </div>
          </div>

          {/* Question Text */}
          <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100/50 mb-6 relative">
            <p className="text-sm sm:text-base font-black text-slate-800 leading-relaxed">
              {currentQuestion.questionText}
            </p>
            
            {/* Visual representation helper for fractions or divisions */}
            {currentQuestion.operator === '÷' && (
              <div className="flex justify-center gap-1 mt-4">
                {Array.from({ length: Math.min(currentQuestion.num1, 24) }).map((_, i) => (
                  <div key={i} className="w-3 h-3 rounded-full bg-blue-400 shadow-xs border border-blue-500"></div>
                ))}
                {currentQuestion.num1 > 24 && <span className="text-xs text-blue-400 font-bold font-mono">...</span>}
              </div>
            )}
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOption === option;
              const isOptionCorrect = option === currentQuestion.correctAnswer;
              
              let btnStyle = 'border-slate-200 hover:bg-slate-50 text-slate-800 hover:border-slate-300';
              if (hasAnswered) {
                if (isOptionCorrect) {
                  btnStyle = 'bg-emerald-100 border-emerald-400 text-emerald-800 ring-2 ring-emerald-100';
                } else if (isSelected) {
                  btnStyle = 'bg-red-100 border-red-400 text-red-800';
                } else {
                  btnStyle = 'opacity-55 border-slate-100 text-slate-400 pointer-events-none';
                }
              }

              return (
                <button
                  key={option}
                  id={`btn-option-${option}`}
                  onClick={() => handleSelectOption(option)}
                  disabled={hasAnswered}
                  className={`py-3.5 px-4 border-2 rounded-2xl text-sm font-black transition-all text-center focus:outline-none ${btnStyle}`}
                >
                  {currentQuestion.id === 'm10' ? `0.${option}` : option}
                </button>
              );
            })}
          </div>

          {/* Feedback & Helpers */}
          <div className="flex flex-col gap-4">
            
            {/* Hint Box toggle */}
            {!hasAnswered && (
              <div className="self-end">
                <button
                  id="btn-show-hint"
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-50 px-3 py-1 rounded-lg"
                >
                  <Lightbulb size={14} className="text-amber-500 fill-amber-300" />
                  <span>{showHint ? 'ヒントを閉じる' : 'ヒントをみる'}</span>
                </button>
              </div>
            )}

            {showHint && !hasAnswered && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800 font-bold leading-relaxed"
              >
                💡 {currentQuestion.hint}
              </motion.div>
            )}

            {/* Answer Correct/Incorrect Message */}
            <AnimatePresence>
              {hasAnswered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-4 rounded-2xl border flex items-start gap-3 ${
                    isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  {isCorrect ? (
                    <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                  ) : (
                    <XCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                  )}
                  <div className="flex-1">
                    <p className="text-xs font-black">
                      {isCorrect ? 'せいかい！ おめでとう！ 🎉' : 'おしかった！ 次のヒントを読んでみてね。'}
                    </p>
                    <p className="text-[11px] font-bold text-slate-600 mt-1">
                      {isCorrect ? `コインを 5 枚ゲットしたよ！` : currentQuestion.hint}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Next Button */}
            {hasAnswered && (
              <button
                id="btn-next-question"
                onClick={handleNext}
                className="w-full mt-2 py-3 bg-blue-600 text-white font-black text-sm rounded-xl hover:bg-blue-700 transition-all shadow flex items-center justify-center gap-2"
              >
                <span>{currentIndex < questions.length - 1 ? 'つぎのもんだいへ' : 'おわりにする！'}</span>
                <ArrowRight size={16} />
              </button>
            )}

          </div>

        </div>
      ) : (
        /* Completion Summary Screen */
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center py-6 text-center"
        >
          <Award className="text-amber-500 fill-amber-300 mb-2 animate-bounce" size={48} />
          <h2 className="text-lg font-black text-slate-800 mb-1">
            ✨ さんすうドリル しゅうりょう！ ✨
          </h2>
          <p className="text-xs text-slate-500 font-bold mb-6">
            さいごまでよくがんばったね！勉強のせいかだよ。
          </p>

          {/* Results Block */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-8">
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 block">正解した数</span>
              <span className="text-2xl font-black text-slate-700 font-mono">{correctCount}</span>
              <span className="text-xs font-bold text-slate-400"> / {questions.length}問</span>
            </div>
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-amber-600 block">ゲットしたコイン</span>
              <span className="text-2xl font-black text-amber-600 font-mono">+{totalCoinsEarned}</span>
              <span className="text-xs font-bold text-amber-600"> c</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 w-full max-w-xs">
            <button
              id="btn-restart-math"
              onClick={restartGame}
              className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={14} />
              <span>もういちど遊ぶ</span>
            </button>
          </div>

        </motion.div>
      )}

    </div>
  );
}

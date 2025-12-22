import { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { CrackPattern } from './icons/index.jsx';

export function QuestionModal({
  questionNumber,
  title,
  questionText,
  points,
  hint,
  isOpen,
  onClose,
  onSubmitAnswer,
}) {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [serverMessage, setServerMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(true);

  // Auto-hide incorrect feedback after 3 seconds
  useEffect(() => {
    if (feedback === 'wrong') {
      setShowFeedback(true);
      const timer = setTimeout(() => {
        setShowFeedback(false);
      }, 3000);

      return () => clearTimeout(timer);
    } else if (feedback === 'correct') {
      setShowFeedback(true);
    }
  }, [feedback]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!answer.trim()) return;

    setIsSubmitting(true);
    setServerMessage('');

    try {
      const result = await onSubmitAnswer(answer);
      const isCorrect = Boolean(result?.correct);

      setFeedback(isCorrect ? 'correct' : 'wrong');
      setIsSubmitting(false);

      if (isCorrect) {
        setTimeout(() => {
          handleClose();
        }, 1200);
      }
    } catch (_err) {
      // Surface backend message (e.g. "Hint not unlocked yet")
      const msg = _err?.message || 'Request failed';
      setServerMessage(msg);
      setFeedback('wrong');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAnswer('');
    setFeedback(null);
    setServerMessage('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-8 animate-scale-in-fog"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/95 backdrop-blur-md"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(139, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.98) 100%)',
        }}
      />

      {/* Modal Container */}
      <div
        className="relative max-w-3xl w-full rounded-xl border-2 border-[var(--blood-red)]/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          background:
            'linear-gradient(180deg, rgba(20, 0, 0, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
          boxShadow:
            'inset 0 0 80px rgba(229, 9, 20, 0.2), 0 0 80px rgba(229, 9, 20, 0.5)',
        }}
      >
        {/* Top crack border */}
        <div className="absolute top-0 left-0 right-0 h-1 text-[var(--blood-red)] opacity-80 z-10">
          <CrackPattern className="w-full h-full" />
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 z-20 w-10 h-10 rounded-lg bg-[var(--void-dark)]/80 border-2 border-[var(--blood-red)]/40 flex items-center justify-center hover:border-[var(--blood-red)] hover:bg-[var(--blood-red)]/10 transition-all duration-300 group"
          style={{ boxShadow: '0 0 20px rgba(229, 9, 20, 0.3)' }}
        >
          <X className="w-5 h-5 text-[var(--blood-red)] group-hover:rotate-90 transition-transform duration-300" />
        </button>

        {/* Fog overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background: `
              radial-gradient(ellipse at 50% 50%, rgba(229, 9, 20, 0.1) 0%, transparent 60%)
            `,
            animation: 'fog-drift 15s ease-in-out infinite',
          }}
        />

        {/* Content */}
        <div className="relative z-10 p-10">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span
                className="text-sm font-bold text-[var(--ash-dim)]"
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                QUESTION {questionNumber}
              </span>
              <div className="w-px h-4 bg-[var(--blood-red)]/40" />
              <div className="flex items-center gap-1.5">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 100 100"
                  fill="currentColor"
                  className="text-[var(--ember-orange)]"
                >
                  <path d="M 50 10 L 60 38 L 90 38 L 66 56 L 76 84 L 50 66 L 24 84 L 34 56 L 10 38 L 40 38 Z" />
                </svg>
                <span className="text-sm font-bold text-[var(--ember-orange)]">
                  {points} Points
                </span>
              </div>
            </div>

            <h3
              className="text-3xl text-[var(--blood-red)] mb-2 animate-flicker-red"
              style={{
                fontFamily: 'Cinzel, serif',
                textShadow: '0 0 20px var(--red-glow)',
              }}
            >
              {title}
            </h3>
          </div>

          {/* Question Content */}
          <div
            className="mb-8 p-6 rounded-lg border border-[var(--blood-red)]/30 bg-[var(--void-dark)]/40"
            style={{ boxShadow: 'inset 0 0 30px rgba(229, 9, 20, 0.05)' }}
          >
            <p className="text-[var(--ash-gray)] leading-relaxed text-lg whitespace-pre-wrap">
              {questionText}
            </p>
          </div>

          {/* Hint from Hawkins Lab */}
          {hint ? (
            <div
              className="mb-8 p-5 rounded-lg border border-[var(--ember-orange)]/40 bg-[var(--ember-orange)]/5"
              style={{ boxShadow: 'inset 0 0 24px rgba(255, 106, 61, 0.12)' }}
            >
              <p className="text-xs uppercase tracking-widest text-[var(--ash-dim)] mb-2">
                Hint from Hawkins Lab
              </p>
              <p className="text-[var(--ember-orange)] font-mono whitespace-pre-wrap">
                {hint}
              </p>
            </div>
          ) : (
            <div
              className="mb-8 p-5 rounded-lg border border-[var(--ash-darker)]/40 bg-[var(--void-dark)]/30"
            >
              <p className="text-xs uppercase tracking-widest text-[var(--ash-dim)] mb-2">
                Hint status
              </p>
              <p className="text-[var(--ash-gray)] text-sm">
                Waiting for Hawkins Lab to submit the hint…
              </p>
            </div>
          )}

          {/* Answer Input */}
          <div className="mb-6">
            <label
              className="block text-sm text-[var(--ash-dim)] uppercase tracking-wide mb-3"
              htmlFor="answer-input"
            >
              Your Answer
            </label>
            <textarea
              id="answer-input"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={feedback === 'correct' || isSubmitting}
              className="w-full h-32 px-4 py-3 bg-[var(--void-dark)]/60 border-2 border-[var(--blood-red)]/30 rounded-lg text-[var(--ash-gray)] placeholder-[var(--ash-darker)] focus:border-[var(--blood-red)] focus:outline-none transition-all duration-300 resize-none font-mono"
              placeholder="Type your answer here..."
              style={{
                boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.5)',
              }}
            />
          </div>

          {/* Feedback Message */}
          <div
            className={`overflow-hidden transition-all duration-700 ease-out ${
              feedback && showFeedback ? 'mb-6' : 'mb-0'
            }`}
            style={{
              maxHeight: feedback && showFeedback ? '200px' : '0px',
            }}
          >
            {feedback && (
              <div
                className={`p-4 rounded-lg border-2 flex items-center gap-3 ${
                  feedback === 'correct'
                    ? 'bg-[var(--ember-orange)]/10 border-[var(--ember-orange)]/50'
                    : 'bg-[var(--blood-red)]/10 border-[var(--blood-red)]/50'
                } ${
                  showFeedback
                    ? 'animate-scale-in-fog'
                    : 'opacity-0'
                }`}
                style={{
                  boxShadow:
                    feedback === 'correct'
                      ? '0 0 30px rgba(255, 106, 61, 0.3)'
                      : '0 0 30px rgba(229, 9, 20, 0.3)',
                  animation: !showFeedback
                    ? 'fade-out-collapse 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards'
                    : undefined,
                }}
              >
                {feedback === 'correct' ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-[var(--ember-orange)] flex-shrink-0" />
                    <div>
                      <p className="font-bold text-[var(--ember-orange)]">Correct!</p>
                      <p className="text-sm text-[var(--ash-gray)] mt-1">
                        Well done! You earned {points} points. Next question unlocking...
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-[var(--blood-red)] flex-shrink-0" />
                    <div>
                      <p className="font-bold text-[var(--blood-red)]">Incorrect</p>
                      <p className="text-sm text-[var(--ash-gray)] mt-1">
                        {serverMessage ? serverMessage : "That's not right.."}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!hint || !answer.trim() || feedback === 'correct' || isSubmitting}
            className={`
              w-full py-4 rounded-lg font-bold uppercase tracking-widest text-sm
              transition-all duration-700 border-2
              ${
                feedback === 'correct' || isSubmitting || !answer.trim() || !hint
                  ? 'bg-[var(--void-dark)]/40 border-[var(--ash-darker)]/30 text-[var(--ash-darker)] cursor-not-allowed'
                  : 'bg-[var(--blood-red)]/20 border-[var(--blood-red)] text-[var(--blood-red)] hover:bg-[var(--blood-red)]/30 hover:scale-[1.02] animate-pulse-red'
              }
            `}
            style={{
              boxShadow:
                feedback !== 'correct' && !isSubmitting && answer.trim() && hint
                  ? '0 0 30px rgba(229, 9, 20, 0.4), inset 0 0 20px rgba(229, 9, 20, 0.1)'
                  : 'none',
              transform: feedback === 'wrong' && !showFeedback ? 'translateY(-10px)' : 'translateY(0)',
            }}
          >
            {!hint
              ? 'Waiting for hint...'
              : isSubmitting
              ? 'Checking Answer...'
              : feedback === 'correct'
              ? 'Correct!'
              : 'Submit Answer'}
          </button>
        </div>

        {/* Bottom crack border */}
        <div className="absolute bottom-0 left-0 right-0 h-1 text-[var(--blood-red)] opacity-80 rotate-180 z-10">
          <CrackPattern className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}
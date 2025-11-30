import { DollarSign, CheckCircle } from 'lucide-react';
import { Team } from '../../services/api';

interface QuestionPhaseProps {
  phase: number;
  currentTeam: Team;
  question: string;
  answerCost: number;
  onBuyAnswer: () => void;
  hasAnswer: boolean;
  answer?: string;
}

export function QuestionPhase({
  phase,
  currentTeam,
  question,
  answerCost,
  onBuyAnswer,
  hasAnswer,
  answer,
}: QuestionPhaseProps) {
  const canBuyAnswer = currentTeam.points >= answerCost;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-teal-900 to-blue-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">{currentTeam.name}</h1>
            <div className="text-2xl font-bold text-teal-300">
              {currentTeam.points} points
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-2">Phase {phase}</h2>
            <p className="text-teal-300 text-lg">Question Médicale</p>
          </div>

          <div className="bg-blue-900/50 rounded-xl p-8 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Question:</h3>
            <p className="text-white text-lg leading-relaxed">{question}</p>
          </div>

          {!hasAnswer ? (
            <div className="bg-white/5 rounded-xl p-6">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <DollarSign className="text-yellow-400" size={32} />
                  <span className="text-3xl font-bold text-yellow-400">
                    {answerCost} points
                  </span>
                </div>
                <p className="text-white/70">
                  Achetez la réponse à cette question
                </p>
              </div>

              <button
                onClick={onBuyAnswer}
                disabled={!canBuyAnswer}
                className="w-full py-4 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold text-lg rounded-lg transition-colors"
              >
                {canBuyAnswer
                  ? 'Acheter la réponse'
                  : 'Points insuffisants'}
              </button>

              {!canBuyAnswer && (
                <p className="text-red-400 text-center mt-4 text-sm">
                  Vous avez besoin de {answerCost - currentTeam.points} points de plus
                </p>
              )}
            </div>
          ) : (
            <div className="bg-green-900/50 border border-green-500/50 rounded-xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="text-green-400" size={32} />
                <h3 className="text-2xl font-bold text-white">Réponse Achetée</h3>
              </div>
              <div className="bg-white/10 rounded-lg p-6">
                <p className="text-white text-lg leading-relaxed">{answer}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

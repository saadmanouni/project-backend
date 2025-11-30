import { DollarSign, CheckCircle } from "lucide-react";
import { Team } from "../../services/api";

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
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 transition-all hover:scale-[1.01]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-teal-300">
          Phase {phase} — Question
        </h3>
        <span className="text-white text-sm opacity-70">
          {answerCost} pts
        </span>
      </div>

      <div className="bg-blue-900/40 rounded-xl p-4 mb-4">
        <p className="text-white text-lg leading-relaxed">{question}</p>
      </div>

      {!hasAnswer ? (
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-yellow-400">
              <DollarSign size={22} />
              <span className="font-bold">{answerCost} points</span>
            </div>
            <p className="text-white/70 text-sm text-center mb-2">
              Achetez cette réponse si votre équipe a assez de points
            </p>

            <button
              onClick={onBuyAnswer}
              disabled={!canBuyAnswer}
              className="px-6 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {canBuyAnswer ? "Acheter la réponse" : "Points insuffisants"}
            </button>

            {!canBuyAnswer && (
              <p className="text-red-400 text-xs text-center mt-2">
                Il vous manque {answerCost - currentTeam.points} points
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-green-900/40 border border-green-500/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="text-green-400" size={24} />
            <h4 className="text-lg font-bold text-green-300">
              Réponse achetée
            </h4>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-white leading-relaxed">{answer}</p>
          </div>
        </div>
      )}
    </div>
  );
}

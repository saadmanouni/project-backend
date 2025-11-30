import { QuestionPhase } from "./QuestionPhase";
import { Team } from "../../services/api";

interface Question {
  id: string;
  question_text: string;
  expected_answer: string;
  points: number;
}

interface Phase4Props {
  currentTeam: Team;
  onBuyAnswer: (questionId: string, cost: number) => void;
  purchasedQuestions: string[];
  questions: Question[];   // 👈 questions venant de App.tsx
}

export function Phase4({
  currentTeam,
  onBuyAnswer,
  purchasedQuestions,
  questions,
}: Phase4Props) {

  // Si aucune question n'est disponible
  if (!questions || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-teal-900 to-blue-900">
        <p className="text-white text-xl">
          Aucune question disponible pour cette phase.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-teal-900 to-blue-900 p-6">
      <div className="max-w-5xl mx-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
        <h1 className="text-4xl font-bold text-teal-300 mb-10 text-center">
          Phase 4 — Examens complémentaires
        </h1>

        <div className="space-y-6">
          {questions.map((q) => {
            const hasAnswer = purchasedQuestions.includes(q.id);

            return (
              <QuestionPhase
                key={q.id}
                phase={4}
                currentTeam={currentTeam}
                question={q.question_text}
                answer={hasAnswer ? q.expected_answer : undefined}
                answerCost={q.points}
                hasAnswer={hasAnswer}
                onBuyAnswer={() => onBuyAnswer(q.id, q.points)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

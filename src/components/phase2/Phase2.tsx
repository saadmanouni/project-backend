import { Team } from "../../services/api";
import { QuestionPhase } from "./QuestionPhase";

interface Question {
  id: string;
  question_text: string;
  expected_answer: string;
  points: number;
}

interface Phase2Props {
  currentTeam: Team;
  onBuyAnswer: (questionId: string, cost: number) => void;
  purchasedQuestions: string[];
  questions: Question[];   // 👈 venant de App.tsx
}

export function Phase2({
  currentTeam,
  onBuyAnswer,
  purchasedQuestions,
  questions,     // 👈 IMPORTANT
}: Phase2Props) 
{
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
          Phase 2 — Interrogatoire
        </h1>

        <div className="space-y-6">
          {questions.map((q) => {
            const hasAnswer = purchasedQuestions.includes(q.id);

            return (
              <QuestionPhase
                key={q.id}
                phase={2}
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

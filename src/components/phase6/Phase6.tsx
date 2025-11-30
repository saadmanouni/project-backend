import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  HeartPulse,
  MessageSquare,
} from 'lucide-react';
import { Team } from '../../services/api';
import socketService from '../../services/socket';

interface Phase6Props {
  currentTeam: Team;
  onSubmitComment: (comment: string) => void;
  hasSubmitted: boolean;
  submittedComment?: string;
}

type Phase6Status = 'waiting' | 'playing' | 'eliminated' | 'finished';

interface Phase6QuestionPayload {
  index: number;
  total: number;
  question: {
    id: string;
    text: string;
  };
}

interface Phase6TeamState {
  lives: number;
  score: number;
  eliminated: boolean;
}

interface Phase6FinalScore {
  id: string;
  name: string;
  phase6_score: number;
  phase6_lives: number;
  phase6_eliminated: number;
}

export function Phase6({
  currentTeam,
  onSubmitComment,
  hasSubmitted,
  submittedComment,
}: Phase6Props) {
  // État jeu
  const [status, setStatus] = useState<Phase6Status>('waiting');
  const [currentQuestion, setCurrentQuestion] =
    useState<Phase6QuestionPayload | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [teamState, setTeamState] = useState<Phase6TeamState | null>(null);
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState(false);
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null);
  const [finalScores, setFinalScores] = useState<Phase6FinalScore[] | null>(
    null,
  );

  // Pour ne pas envoyer plusieurs fois le résumé à l'admin
  const summarySentRef = useRef(false);

  // 🔹 Construction du résumé envoyé à l’admin
  const sendSummaryToAdmin = (reason: string) => {
    if (summarySentRef.current) return;
    summarySentRef.current = true;

    const totalQuestions = currentQuestion?.total ?? 0;
    const score = teamState?.score ?? 0;
    const lives = teamState?.lives ?? 0;

    const summaryLines = [
      `Résultat Phase 6 (Vrai/Faux) pour l'équipe "${currentTeam.name}"`,
      '',
      `Score : ${score} / ${totalQuestions}`,
      `Vies restantes : ${lives}`,
      `Fin de partie : ${reason}`,
    ];

    onSubmitComment(summaryLines.join('\n'));
  };

  // 🔌 Connexion & listeners socket
  useEffect(() => {
    if (hasSubmitted) return; // si déjà joué, on n'écoute même pas

    const socket = socketService.connect();

    // Phase démarrée (optionnel, mais pratique)
    const handleStarted = (_payload: { totalQuestions: number }) => {
      setStatus('playing');
      setFinalScores(null);
      setLastResult(null);
      setHasAnsweredCurrent(false);
      summarySentRef.current = false;
    };

    // Nouvelle question envoyée par le serveur → tout le monde voit la même
    const handleNewQuestion = (payload: Phase6QuestionPayload) => {
      setCurrentQuestion(payload);
      setStatus((prev) =>
        prev === 'eliminated' || prev === 'finished' ? prev : 'playing',
      );
      setHasAnsweredCurrent(false);
      setLastResult(null);
    };

    // Timer global
    const handleTimer = (seconds: number) => {
      setTimeLeft(seconds);
    };

    // Mise à jour de l'équipe (vies / score / élimination)
    const handleTeamUpdated = (team: any) => {
  if (team.id !== currentTeam.id) return;

  const newState: Phase6TeamState = {
    lives: team.phase6_lives ?? 0,
    score: team.phase6_score ?? 0,
    eliminated: !!team.phase6_eliminated,
  };

  setTeamState(newState);

  // Optionnel : status visuel "éliminé" (mais on continue à voir les questions)
  if (newState.eliminated && status !== 'finished') {
    setStatus('eliminated');
  }
};


    // Fin globale de la phase 6
    const handleFinished = (scores: any) => {
  setStatus('finished');

 // 👉 Normaliser pour obtenir TOUJOURS un tableau
const realScores = Array.isArray(scores) ? scores : scores.results;

// 👉 Trier le classement : score desc puis vies desc
realScores.sort((a: Phase6FinalScore, b: Phase6FinalScore) => {
  if (b.phase6_score !== a.phase6_score) {
    return b.phase6_score - a.phase6_score; // Score en premier
  }
  return b.phase6_lives - a.phase6_lives;   // Vies en deuxième
});

setFinalScores(realScores);


  const self = realScores.find((s: Phase6FinalScore) => s.id === currentTeam.id) 
  ?? ({ } as Phase6FinalScore);


  const reason = self.phase6_eliminated
    ? 'Équipe éliminée'
    : 'Phase terminée pour toutes les équipes';

  setTeamState((prev) => ({
    lives: self.phase6_lives ?? prev?.lives ?? 0,
    score: self.phase6_score ?? prev?.score ?? 0,
    eliminated: !!self.phase6_eliminated || prev?.eliminated || false,
  }));

  sendSummaryToAdmin(reason);
};


    socket.on('phase6:started', handleStarted);
    socket.on('phase6:newQuestion', handleNewQuestion);
    socket.on('phase6:timer', handleTimer);
    socket.on('phase6:teamUpdated', handleTeamUpdated);
    socket.on('phase6:finished', handleFinished);

    // Au cas où l’admin démarre la phase alors que la page est déjà ouverte
    // (optionnel, mais c’est propre)
    socket.emit('phase6:requestSync', { teamId: currentTeam.id }, () => {});

    return () => {
      socket.off('phase6:started', handleStarted);
      socket.off('phase6:newQuestion', handleNewQuestion);
      socket.off('phase6:timer', handleTimer);
      socket.off('phase6:teamUpdated', handleTeamUpdated);
      socket.off('phase6:finished', handleFinished);
    };
  }, [currentTeam.id, hasSubmitted]);

  // ➕ Envoi de la réponse Vrai/Faux
  const sendAnswer = (value: 1 | 0) => {
    if (!currentQuestion) return;
    if (status !== 'playing') return;
    if (hasAnsweredCurrent) return;
    if (teamState?.eliminated) return;

    setHasAnsweredCurrent(true);

    const socket = socketService.connect();
    socket.emit(
      'phase6:answer',
      {
        teamId: currentTeam.id,
        questionId: currentQuestion.question.id,
        answer: value,
      },
      (response: any) => {
        if (!response || !response.success) {
          // échec → on redonne la main
          setHasAnsweredCurrent(false);
          alert(response?.error || 'Erreur lors de l’envoi de la réponse');
          return;
        }
        setLastResult(response.correct ? 'correct' : 'wrong');
      },
    );
  };

 /* ------------------------------------------------------------------ */
/* -------------------- VUE SI DÉJÀ SOUMIS (comment) ---------------- */
/* ------------------------------------------------------------------ */

if (hasSubmitted && finalScores === null && status !== 'finished') {


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-900/80 border border-emerald-400/40 shadow-[0_0_40px_rgba(16,185,129,0.35)] rounded-2xl p-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-emerald-300 flex items-center gap-2">
                <HeartPulse className="text-emerald-400" />
                {currentTeam.name}
              </h1>
              <p className="text-emerald-200 text-sm mt-1">
                Résumé médical de la Phase 6
              </p>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-emerald-300">
                {currentTeam.points} pts
              </div>
            </div>
          </div>

          {/* Badge */}
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="text-emerald-400" size={28} />
            <h2 className="text-xl font-bold text-white">Phase 6 déjà jouée</h2>
          </div>

          {/* Nouvelle carte premium */}
          <div className="bg-slate-800/70 rounded-xl p-6 border border-emerald-500/30 shadow-lg space-y-5">

            <p className="text-emerald-200 text-sm uppercase tracking-wide">
              Résultat enregistré par l’administrateur
            </p>

            {/* Score */}
            <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-lg border border-slate-700">
              <span className="text-emerald-200 text-sm uppercase tracking-wide">
                Score total
              </span>
              <span className="text-white text-xl font-bold">
                {submittedComment?.match(/Score\s*:\s*(.*)/)?.[1] || "-"}
              </span>
            </div>

            {/* Vies */}
            <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-lg border border-slate-700">
              <span className="text-emerald-200 text-sm uppercase tracking-wide">
                Vies restantes
              </span>
              <span className="text-white text-xl font-bold">
                {submittedComment?.match(/Vies restantes\s*:\s*(.*)/)?.[1] || "-"}
              </span>
            </div>

            {/* Statut final */}
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
              <span className="text-emerald-200 text-sm uppercase tracking-wide block mb-1">
                Statut final
              </span>
              <span className="text-white font-medium">
                {submittedComment?.match(/Fin de partie\s*:\s*(.*)/)?.[1] || "-"}
              </span>
            </div>

            {/* Nom équipe */}
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
              <span className="text-emerald-200 text-sm uppercase tracking-wide block mb-1">
                Équipe évaluée
              </span>
              <span className="text-white font-medium">
                {currentTeam.name}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 👉 PRIORITÉ 2 : si hasSubmitted mais pas encore finalScores → attendre
if (hasSubmitted) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-emerald-300 text-lg">
      Résultat enregistré. Le classement complet sera affiché lorsque l’administrateur terminera la phase.
    </div>
  );
}

  /* ------------------------------------------------------------------ */
  /* ----------------------------- UI JEU ------------------------------ */
  /* ------------------------------------------------------------------ */

  const totalQuestions = currentQuestion?.total ?? '?';
  const questionNumber =
    currentQuestion && typeof currentQuestion.index === 'number'
      ? currentQuestion.index + 1
      : '?';

  const livesDisplay =
    (teamState?.lives ?? 0) > 0
      ? '❤️'.repeat(Math.min(teamState?.lives ?? 0, 6))
      : '💀';

  const isUrgent = (timeLeft ?? 0) <= 5 && (timeLeft ?? 0) > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Bandeau haut : équipe + points + badge urgence */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-emerald-300 flex items-center gap-3">
              <HeartPulse className="text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
              {currentTeam.name}
            </h1>
            <p className="text-emerald-200 text-sm mt-1">
              Phase 6 — Urgences Vrai / Faux
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="text-2xl font-bold text-emerald-300">
              {currentTeam.points} pts
            </div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide">
              <span className="px-2 py-1 rounded-full bg-red-600/20 text-red-300 border border-red-500/40 flex items-center gap-1">
                <AlertTriangle size={14} />
                Urgences
              </span>
              <span className="px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-400/40 flex items-center gap-1">
                <Activity size={14} />
                Case clinique
              </span>
            </div>
          </div>
        </div>

        {/* Carte principale */}
        <div className="bg-slate-900/80 border border-emerald-500/40 rounded-2xl shadow-[0_0_35px_rgba(16,185,129,0.35)] overflow-hidden">
          {/* Bandeau ECG */}
          <div className="relative h-12 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 flex items-center px-6">
            <div className="w-full h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-500/70 to-emerald-500/0 relative overflow-hidden">
              <div className="absolute inset-0 animate-[pulse_2.4s_infinite] bg-[radial-gradient(circle_at_10px,theme(colors.emerald.400)_0,theme(colors.emerald.400)_2px,transparent_3px)]" />
            </div>
            <div className="absolute right-6 text-emerald-300 text-xs uppercase tracking-[0.3em]">
              Monitoring
            </div>
          </div>

          {/* Contenu */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Infos haute : question / temps / vies / score */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-800/80 rounded-xl py-3 border border-slate-700">
                <div className="text-[10px] uppercase text-emerald-200 tracking-wide">
                  Question
                </div>
                <div className="text-xl font-bold text-white">
                  {questionNumber} / {totalQuestions}
                </div>
              </div>

              <div
                className={`bg-slate-800/80 rounded-xl py-3 border ${
                  isUrgent
                    ? 'border-red-500 shadow-[0_0_18px_rgba(248,113,113,0.6)]'
                    : 'border-slate-700'
                }`}
              >
                <div className="text-[10px] uppercase text-emerald-200 tracking-wide">
                  Temps restant
                </div>
                <div
                  className={`text-xl font-bold ${
                    isUrgent ? 'text-red-300 animate-pulse' : 'text-white'
                  }`}
                >
                  {timeLeft ?? '-'} s
                </div>
              </div>

              <div className="bg-slate-800/80 rounded-xl py-3 border border-slate-700">
                <div className="text-[10px] uppercase text-emerald-200 tracking-wide">
                  Vies
                </div>
                <div className="text-xl font-bold text-white">{livesDisplay}</div>
              </div>

              <div className="bg-slate-800/80 rounded-xl py-3 border border-slate-700">
                <div className="text-[10px] uppercase text-emerald-200 tracking-wide">
                  Score Phase 6
                </div>
                <div className="text-xl font-bold text-emerald-300">
                  {teamState?.score ?? 0} / {totalQuestions}
                </div>
              </div>
            </div>

            {/* Question */}
            <div className="bg-slate-800/90 rounded-2xl p-5 sm:p-6 border border-emerald-500/40">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-400/70">
                  <MessageSquare className="text-emerald-300" size={20} />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-white">
                  Question clinique
                </h2>
              </div>
              <p className="text-slate-50 text-base sm:text-lg leading-relaxed">
                {currentQuestion?.question.text ?? 'En attente du lancement…'}
              </p>
            </div>

            {/* Feedback dernière réponse */}
            {lastResult && (
              <div
                className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2 border ${
                  lastResult === 'correct'
                    ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/50'
                    : 'bg-red-500/10 text-red-200 border-red-400/50'
                }`}
              >
                {lastResult === 'correct' ? (
                  <>
                    <CheckCircle size={18} />
                    <span>Bonne décision clinique.</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={18} />
                    <span>Réponse incorrecte — attention au pronostic !</span>
                  </>
                )}
              </div>
            )}

            {teamState?.eliminated && (
  <div className="rounded-xl px-4 py-3 mb-4 
    bg-red-900/40 text-red-200 border border-red-500/50 
    text-center font-bold text-sm tracking-wide">
    🫀 Arrêt cardiaque simulé — Vous ne pouvez plus répondre, mais vous continuez l’observation.
  </div>
)}


            {/* Boutons réponses */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => sendAnswer(1)}
                disabled={
                  status !== 'playing' || hasAnsweredCurrent || !currentQuestion
                }
                className={`py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2 transition-all
                ${
                  status !== 'playing' || hasAnsweredCurrent || !currentQuestion
                    ? 'bg-emerald-700/40 text-emerald-200/60 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_18px_rgba(16,185,129,0.7)] hover:shadow-[0_0_25px_rgba(16,185,129,0.9)]'
                }`}
              >
                🩺 VRAI
              </button>

              <button
                onClick={() => sendAnswer(0)}
                disabled={
                  status !== 'playing' || hasAnsweredCurrent || !currentQuestion
                }
                className={`py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2 transition-all
                ${
                  status !== 'playing' || hasAnsweredCurrent || !currentQuestion
                    ? 'bg-red-800/40 text-red-200/60 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-400 text-white shadow-[0_0_18px_rgba(248,113,113,0.7)] hover:shadow-[0_0_25px_rgba(248,113,113,0.9)]'
                }`}
              >
                🚨 FAUX
              </button>
            </div>

            {/* Messages d’état */}
            {status === 'waiting' && (
              <p className="text-center text-emerald-200 text-sm mt-2">
                En attente que l&apos;admin démarre la Phase 6…
              </p>
            )}

      

            {status === 'finished' && (
              <div className="mt-4 rounded-xl bg-emerald-900/30 border border-emerald-500/50 p-4 flex items-center gap-3">
                <CheckCircle className="text-emerald-400" />
                <div>
                  <p className="text-emerald-200 font-semibold">
                    Phase 6 terminée.
                  </p>
                  <p className="text-emerald-100 text-sm">
                    Votre résultat a été enregistré. Attendez la phase suivante.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Classement final (si envoyé par le serveur) */}
          {finalScores && status === 'finished' && (
            <div className="border-t border-slate-800 bg-slate-950/70 px-6 py-5">
              <h3 className="text-sm font-semibold text-emerald-200 mb-3 flex items-center gap-2">
                <Activity size={16} />
                Classement Phase 6
              </h3>
              <div className="space-y-2">
                {finalScores.map((t, index) => (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between text-sm rounded-lg px-3 py-2 ${
                      t.id === currentTeam.id
                        ? 'bg-emerald-500/15 border border-emerald-400/50'
                        : 'bg-slate-900/60 border border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs w-6 text-emerald-300 font-semibold">
                        #{index + 1}
                      </span>
                      <span className="text-slate-50">{t.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-emerald-200">
                        Score : {t.phase6_score}
                      </span>
                      <span className="text-slate-300">
                        Vies : {t.phase6_lives}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

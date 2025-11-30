import { useState, useEffect } from 'react';
import { Crown, Play, ArrowRight, Award, RotateCcw } from 'lucide-react';
import { Team, Comment, PriseEnCharge } from '../../services/api';
import socketService from '../../services/socket';

interface AdminPanelProps {
  teams: Team[];
  comments: Comment[];
  priseEnCharges: PriseEnCharge[];
  phase5Responses: any[];
  currentPhase: number;
  onStartGame: () => void;
  onNextPhase: () => void;
  onAwardPoints: (teamId: string, points: number) => void;
  gameStatus: string;
  onResetGame: () => void;
}

export function AdminPanel({
  teams,
  comments,
  priseEnCharges,
  phase5Responses,
  currentPhase,
  onStartGame,
  onNextPhase,
  onAwardPoints,
  gameStatus,
  onResetGame,
}: AdminPanelProps) {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [pointsToAward, setPointsToAward] = useState('');
  const [buzzQueue, setBuzzQueue] = useState<string[]>([]);
  const [buzzQuestion, setBuzzQuestion] = useState<{ question: string; answer?: string } | null>(null);
  const [buzzQuestions, setBuzzQuestions] = useState<{ question: string; answer?: string }[]>([]);
  const [currentBuzzIndex, setCurrentBuzzIndex] = useState(0);
  const [phase5Local, setPhase5Local] = useState(phase5Responses);
  const [phase6Question, setPhase6Question] = useState("");
  const [phase6Timer, setPhase6Timer] = useState(0);
  const [phase6Teams, setPhase6Teams] = useState(teams);

  useEffect(() => {
  setPhase6Teams(teams);
}, [teams]);


  // === Sélection du cas ===
const [casesList, setCasesList] = useState<any[]>([]);
const [selectedCase, setSelectedCase] = useState('');

useEffect(() => {
  setPhase5Local(phase5Responses);
}, [phase5Responses]);


useEffect(() => {
  // Charger la liste des cas
  fetch('/api/cases')
    .then(res => res.json())
    .then(data => setCasesList(data))
    .catch(err => console.error('Erreur chargement cas :', err));
}, []);

const handleSelectCase = async (caseId: string) => {
  setSelectedCase(caseId);

  try {
    const response = await fetch('/api/cases/admin/set-case', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ case_id: caseId })
    });

    const data = await response.json();

    if (!data.success) {
      alert(data.error || "Erreur lors du choix du cas");
    } else {
      alert("Cas sélectionné avec succès !");
    }

  } catch (err) {
    alert("Erreur serveur lors de la sélection du cas");
  }
};



  // ✅ écoute des événements socket
  useEffect(() => {
    const handleQueue = (q: string[]) => setBuzzQueue(q || []);
    const handleQuestion = (q: { question: string; answer?: string } | null) => setBuzzQuestion(q);

    socketService.on('buzz:updateQueue', handleQueue);
    socketService.on('buzz:newQuestion', handleQuestion);

    // synchronisation initiale
    socketService.emit('buzz:requestSync');

    return () => {
      socketService.off('buzz:updateQueue', handleQueue);
      socketService.off('buzz:newQuestion', handleQuestion);
    };
  }, []);

  const handleAwardPoints = () => {
    if (selectedTeam && pointsToAward) {
      onAwardPoints(selectedTeam, parseInt(pointsToAward));
      setSelectedTeam('');
      setPointsToAward('');
    }
  };

  const sortedTeams = [...teams].sort((a, b) => b.points - a.points);

  // ✅ envoie une nouvelle question à tous les joueurs
  const handleSendBuzzQuestion = (question: { question: string; answer?: string }) => {
    socketService.emit('buzz:newQuestion', question);
  };

  // ✅ passe à l’équipe suivante dans la file
  const handleNextInQueue = () => {
    socketService.emit('buzz:nextInQueue');
  };

  // ✅ réinitialise complètement la file des buzz
  const handleResetBuzzQueue = () => {
    socketService.emit('buzz:resetQueue');
  };

  // ✅ attribue / retire des points à une équipe
  const handleAwardBuzzPoints = (teamId: string, points: number) => {
    onAwardPoints(teamId, points);
  };

  useEffect(() => {
  fetch(`${import.meta.env.VITE_API_URL}/api/buzz/questions`)
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data)) setBuzzQuestions(data);
    })
    .catch((err) => console.error('Erreur chargement questions Buzz:', err));
}, []);

// ============================
// 🔥 Mise à jour LIVE Phase 5
// ============================
useEffect(() => {
  // même API_URL que dans Phase5.jsx
  const API_URL = import.meta.env.VITE_API_URL;

  async function refreshPhase5() {
    const res = await fetch(`${API_URL}/api/phase5`);
    const data = await res.json();
    setPhase5Local(data); // mise à jour instantanée
  }

  socketService.on("phase5:updated", refreshPhase5);

  // première synchro
  refreshPhase5();

  return () => {
    socketService.off("phase5:updated", refreshPhase5);
  };
}, []);


// ============================
// 🔥 Mise à jour LIVE Phase 6
// ============================
useEffect(() => {

  socketService.emit("admin:join");

  interface Phase6StartedPayload {
    totalQuestions: number;
  }

  const handleStarted = (payload: Phase6StartedPayload) => {
    console.log("Phase 6 started", payload.totalQuestions);
  };

  const handleNewQuestion = (payload: { question: { text: string } }) => {
    setPhase6Question(payload.question.text);
  };

  const handleTimer = (seconds: number) => {
    setPhase6Timer(seconds);
  };

  const handleTeamUpdated = (team: Team) => {
    setPhase6Teams(prev => prev.map(t => (t.id === team.id ? team : t)));
  };

  const handleFinished = (scores: any) => {
  const realScores = Array.isArray(scores) ? scores : scores.results;
};

  // 🔹 Nouveau handler unique (plus de doublons)
  const handleAdminUpdate = (team: Team) => {
    console.log("🟢 ADMIN UPDATE REÇU :", team);
    setPhase6Teams(prev =>
      prev.map(t => (t.id === team.id ? team : t))
    );
  };

  // 🔥 Subscriptions
  socketService.on("phase6:started", handleStarted);
  socketService.on("phase6:newQuestion", handleNewQuestion);
  socketService.on("phase6:timer", handleTimer);
  socketService.on("phase6:teamUpdated", handleTeamUpdated);
  socketService.on("phase6:finished", handleFinished);
  socketService.on("phase6:adminUpdate", handleAdminUpdate);

  socketService.emit("phase6:requestSync");

  return () => {
    socketService.off("phase6:started", handleStarted);
    socketService.off("phase6:newQuestion", handleNewQuestion);
    socketService.off("phase6:timer", handleTimer);
    socketService.off("phase6:teamUpdated", handleTeamUpdated);
    socketService.off("phase6:finished", handleFinished);
    socketService.off("phase6:adminUpdate", handleAdminUpdate);
  };
}, []);






    
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Crown className="text-yellow-400" size={40} />
              <h1 className="text-4xl font-bold text-white">Panneau Admin</h1>
            </div>
            <button
              onClick={onResetGame}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
            >
              <RotateCcw size={20} />
              Réinitialiser le jeu
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-900/50 rounded-xl p-6">
              <div className="text-blue-300 text-sm mb-2">Statut du jeu</div>
              <div className="text-white text-2xl font-bold capitalize">
                {gameStatus === 'lobby' ? 'En attente' : `Phase ${currentPhase}`}
              </div>
            </div>

            <div className="bg-teal-900/50 rounded-xl p-6">
              <div className="text-teal-300 text-sm mb-2">Nombre d'équipes</div>
              <div className="text-white text-2xl font-bold">{teams.length}</div>
            </div>

            <div className="bg-purple-900/50 rounded-xl p-6">
              <div className="text-purple-300 text-sm mb-2">Total membres</div>
              <div className="text-white text-2xl font-bold">
                {teams.reduce((sum, t) => sum + t.members.length, 0)}
              </div>
            </div>
          </div>

          {/* === Sélection du Cas === */}
<div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 mb-6">
  <h2 className="text-xl font-bold text-white mb-4">Sélection du Cas</h2>

  <select
    value={selectedCase}
    onChange={(e) => handleSelectCase(e.target.value)}
    className="w-full p-3 rounded bg-white/20 text-white"
  >
    <option value="">Sélectionner un cas...</option>

    {casesList.map((c) => (
      <option key={c.id} value={c.id} className="bg-gray-800 text-white">
        {c.title}
      </option>
    ))}
  </select>

  {selectedCase && (
    <div className="text-green-400 mt-3">
      Cas sélectionné : {casesList.find(c => c.id === selectedCase)?.title}
    </div>
  )}
</div>
      

          <div className="flex gap-4">
            {gameStatus === 'lobby' && (
              <button
                onClick={onStartGame}
                className="flex-1 py-4 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Play size={24} />
                Démarrer le jeu
              </button>
            )}

            {gameStatus !== 'lobby' && gameStatus !== 'finished' && (
              <button
                onClick={onNextPhase}
                className="flex-1 py-4 bg-teal-500 hover:bg-teal-600 text-white font-bold text-lg rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ArrowRight size={24} />
                Phase suivante
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              

              {/* === Phase Buzz === */}
<div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-6">
  <h2 className="text-2xl font-bold text-white mb-6">Phase Buzz</h2>

  {/* Question actuelle */}
  <div className="mb-4">
    <div className="text-white/80 mb-2">Question actuelle :</div>
    <div className="p-4 rounded bg-white/5 border border-white/10 text-white">
      {buzzQuestion ? buzzQuestion.question : <em>Aucune question active</em>}
    </div>
    <div className="mt-3 flex items-center gap-2">
     <button
  className="px-4 py-2 rounded bg-yellow-400 text-gray-900 font-bold"
  onClick={() => {
    if (buzzQuestions.length === 0) return;
    const nextQuestion = buzzQuestions[currentBuzzIndex];
    handleSendBuzzQuestion(nextQuestion);
    setBuzzQuestion(nextQuestion);
    setCurrentBuzzIndex((prev) => (prev + 1) % buzzQuestions.length);
  }}
>
  🎲 Nouvelle question
</button>

{buzzQuestion && (
  <div className="mt-4 text-white/80">
    <strong>Question en cours :</strong> {buzzQuestion.question}
  </div>
)}

      <button
        className="px-3 py-2 rounded bg-gray-600 text-white"
        onClick={handleResetBuzzQueue}
      >
        Réinitialiser la file
      </button>
    </div>
  </div>

  {/* File des buzz */}
  <div className="mt-6">
    <div className="text-white/80 mb-2">Ordre des buzz :</div>
    <ol className="list-decimal list-inside space-y-2 text-white/90">
      {buzzQueue.map((teamId, idx) => {
        const team = teams.find((t) => t.id === teamId);
        return (
          <li key={teamId} className="flex items-center gap-3">
            <span className="w-6 text-right">{idx + 1}.</span>
            <span className="flex-1">{team ? team.name : teamId}</span>
{idx === 0 && (
  <>
    <button
      className="px-3 py-1 rounded bg-green-500 text-white"
      onClick={() => {
        socketService.emit(
          'admin:awardPoints',
          { teamId, points: 10 },
          (response: any) => {
            if (!response.success) {
              alert(response.error || 'Erreur attribution points');
            } else {
              console.log(`[ADMIN] +10 points attribués à ${team?.name}`);
            }
          }
        );
      }}
    >
      +10
    </button>

    <button
      className="px-3 py-1 rounded bg-red-500 text-white"
      onClick={() => {
        socketService.emit(
          'admin:awardPoints',
          { teamId, points: -10 },
          (response: any) => {
            if (!response.success) {
              alert(response.error || 'Erreur attribution points');
            } else {
              console.log(`[ADMIN] -10 points retirés à ${team?.name}`);
            }
          }
        );
      }}
    >
      -10
    </button>

    <button
      className="px-3 py-1 rounded bg-blue-500 text-white"
      onClick={handleNextInQueue}
    >
      ⏭️ Suivante
    </button>
  </>
)}

          </li>
        );
      })}
      {buzzQueue.length === 0 && (
        <li className="text-white/50 italic">Aucun buzz pour l’instant</li>
      )}
    </ol>
  </div>
</div>




          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Classement</h2>
            <div className="space-y-3">
              {sortedTeams.map((team, index) => (
                <div
                  key={team.id}
                  className={`bg-white/5 rounded-xl p-4 ${
                    index === 0 ? 'border-2 border-yellow-400' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`text-2xl font-bold ${
                          index === 0
                            ? 'text-yellow-400'
                            : index === 1
                            ? 'text-gray-400'
                            : index === 2
                            ? 'text-orange-600'
                            : 'text-white/50'
                        }`}
                      >
                        #{index + 1}
                      </div>
                      <div>
                        <div className="text-white font-bold">{team.name}</div>
                        <div className="text-white/60 text-sm">
                          {team.members.length} membres
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-teal-400">
                      {team.points} pts
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Attribuer des points</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-white mb-2 font-semibold">Équipe</label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Sélectionner une équipe...</option>
                  {phase6Teams.map((team) => (
                    <option key={team.id} value={team.id} className="bg-gray-800">
                      {team.name} ({team.points} pts)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white mb-2 font-semibold">
                  Points à attribuer
                </label>
                <input
                  type="number"
                  value={pointsToAward}
                  onChange={(e) => setPointsToAward(e.target.value)}
                  placeholder="Ex: 10, -5..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

                <button
                         onClick={() => {
                 if (!selectedTeam || !pointsToAward) return;
                socketService.emit(
                     'admin:awardPoints',
                    { teamId: selectedTeam, points: parseInt(pointsToAward) },
                   (response: any) => {
                  if (!response.success) {
                        alert(response.error || 'Erreur attribution points');
                  } else {
                  console.log(`[ADMIN] Points ${pointsToAward} attribués à ${selectedTeam}`);
                  setSelectedTeam('');
                  setPointsToAward('');
                 }
               }
                );
        }}
                  disabled={!selectedTeam || !pointsToAward}
                 className="w-full py-3 bg-purple-500 hover:bg-purple-600 ..."
                  >
                  <Award size={20} />
                 Attribuer les points
               </button>

            </div>
        </div>
      </div>


      {/* === PHASE 6 – Épreuve du Vrai / Faux === */}
<div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mt-10">
  
  <h2 className="text-3xl font-bold text-yellow-300 mb-6 flex items-center gap-3">
    🎯 Phase 6 — Épreuve du Vrai / Faux
  </h2>

  {/* Question actuelle */}
  <p className="text-white/70 mb-6 italic">
    {currentPhase === 6
      ? (phase6Question

          ? `Question en cours : "${phase6Question}"`
          : "Aucune question en cours.")
      : "En attente du lancement de la Phase 6."}
  </p>

  <p className="text-white text-xl mb-6">
  ⏳ Temps restant : {phase6Timer}s
</p>


  {/* Tableau des équipes */}
  <div className="space-y-4">

    {/* === CLASSEMENT FINAL PHASE 6 === */}
<div className="mt-10 p-6 rounded-xl bg-white/5 border border-white/10">

  <h3 className="text-2xl font-bold text-yellow-300 mb-4">
    🏆 Classement Phase 6
  </h3>

  {phase6Teams
    .slice()
    .sort((a, b) => {
  const scoreA = a.phase6_score ?? 0;
  const scoreB = b.phase6_score ?? 0;

  if (scoreB !== scoreA) {
    return scoreB - scoreA;
  }

  const livesA = a.phase6_lives ?? 0;
  const livesB = b.phase6_lives ?? 0;

  return livesB - livesA;
})

    .map((team, index) => (
      <div
        key={team.id}
        className="flex items-center justify-between bg-white/10 rounded-lg p-4 mb-2"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-yellow-300 w-8">
            #{index + 1}
          </span>
          <span className="text-white text-lg">{team.name}</span>
        </div>

        <div className="flex items-center gap-6 text-white">
          <span>Score : {team.phase6_score}</span>
          <span>Vies : {team.phase6_lives}</span>
        </div>
      </div>
    ))
  }

</div>



     {phase6Teams.map((team) => (

      <div
        key={team.id}
        className="flex items-center justify-between bg-gradient-to-r from-gray-800/40 to-gray-700/30 p-5 rounded-xl border border-white/10 shadow-md"
      >
        {/* Nom équipe */}
        <div className="text-white font-bold text-lg flex items-center gap-3">
          <span className="px-4 py-2 rounded-lg bg-white/10 border border-white/20">
            {team.name}
          </span>
        </div>

        {/* VIES */}
        <div className="flex items-center gap-2 text-red-400 font-semibold">
          ❤️ <span className="text-white">{team.phase6_lives ?? 0}</span>
        </div>

        {/* SCORE */}
        <div className="text-white font-semibold">
          Score : <span className="text-teal-300">{team.phase6_score ?? 0}</span>
        </div>

        {/* STATUT */}
        <div className="flex items-center gap-2">
          {team.phase6_eliminated ? (
            <span className="text-red-400 font-bold">🔴 Éliminée</span>
          ) : (
            <span className="text-green-400 font-bold">🟢 En jeu</span>
          )}
        </div>
      </div>
    ))}
  </div>

  

  {/* Bouton lancer Phase 6 */}
  <div className="mt-8 flex justify-center">
    <button
      onClick={() => socketService.emit("phase6:start")}
      className="px-8 py-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-extrabold rounded-lg shadow-lg text-lg flex items-center gap-3"
    >
      🚀 Lancer la Phase Vrai/Faux
    </button>
  </div>
</div>




      {/* ==== Tableau Résumé Phase 5 & Phase 7 ==== */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mt-10 w-full">
        <h2 className="text-3xl font-bold text-white mb-6">
          Soumissions des équipes
        </h2>

        <div className="overflow-x-auto w-full">
          <table className="min-w-full text-left text-white border-collapse">
            <thead>
              <tr className="bg-white/10">
                <th className="p-3 border-b border-white/20 w-[10%]">Équipe</th>
                <th className="p-3 border-b border-white/20 w-[30%]">
                  Diagnostic (Phase 5)
                </th>
                <th className="p-3 border-b border-white/20 w-[60%]">
                  Prise en Charge (Phase 7)
                </th>
              </tr>
            </thead>

            <tbody>
              {teams.map((team) => {
                const diag = phase5Local.find(
                  (r) => r.team_id === team.id
                );
                const prise = priseEnCharges.find(
                  (p) => p.team_id === team.id
                );

                return (
                  <tr
                    key={team.id}
                    className="hover:bg-white/5 align-top border-b border-white/10"
                  >
                    <td className="p-3 font-bold text-teal-300 whitespace-nowrap">
                      {team.name}
                    </td>

                    {/* Diagnostic Phase 5 */}
                    <td className="p-3">
                      {diag ? (
                        <div className="text-white whitespace-pre-wrap bg-white/5 p-3 rounded-lg">
                          {diag.response_text}
                        </div>
                      ) : (
                        <span className="text-white/40 italic">
                          Pas encore soumis
                        </span>
                      )}
                    </td>

                    {/* Prise en Charge Phase 7 */}
                    <td className="p-3">
                      {prise ? (
                        <div className="text-white whitespace-pre-wrap bg-white/5 p-3 rounded-lg">
                          {prise.content}
                        </div>
                      ) : (
                        <span className="text-white/40 italic">
                          Pas encore soumis
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==== Détails des équipes ==== */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mt-6">
        <h2 className="text-2xl font-bold text-white mb-6">
          Détails des équipes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {phase6Teams.map((team) => (
            <div key={team.id} className="bg-white/5 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-3">
                {team.name}
              </h3>
              <div className="space-y-2 mb-4">
                <div className="text-white/70">
                  <span className="font-semibold">Points:</span>{' '}
                  {team.points}
                </div>
                <div className="text-white/70">
                  <span className="font-semibold">Membres:</span>{' '}
                  {(team.members || []).join(', ') || 'Aucun'}
              </div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-white/70 text-sm mb-1">
                  Indice actuel:
                </div>
                <div className="text-white text-sm">{team.clue}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
  );
}


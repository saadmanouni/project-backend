import { useState, useEffect } from 'react';
import { Lightbulb, ArrowRightLeft, Skull, Check, X } from 'lucide-react';
import { Team, ClueExchange } from '../../services/api';
import socketService from '../../services/socket';
import { teamCluesApi } from '../../services/api';
import { sessionApi } from '../../services/api';





interface Phase1Props {
  currentTeam: Team;
  allTeams: Team[];
  clueExchanges: ClueExchange[];
  onExchangeClue: (targetTeamId: string) => void;
  onAcceptExchange: (exchangeId: string) => void;
  onRejectExchange: (exchangeId: string) => void;
  onHackClue: (targetTeamId: string) => void;
  onTeamReady?: (teamId: string) => void;
  activeCase: any;
}

export function Phase1({
  currentTeam,
  allTeams,
  clueExchanges,
  onExchangeClue,
  onAcceptExchange,
  onRejectExchange,
  onHackClue,
  onTeamReady,
  activeCase
}: Phase1Props) {

 const [selectedAction, setSelectedAction] = useState<'exchange' | 'hack' | null>(null);
const [selectedTargetTeam, setSelectedTargetTeam] = useState<string>('');
const [clue, setClue] = useState<string>('');   // FIX ✔️
const [hackedClues, setHackedClues] = useState<any[]>([]); // pour les indices piratés ✔️
const [points, setPoints] = useState(currentTeam.points);
const [localExchanges, setLocalExchanges] = useState(clueExchanges);





  const otherTeams = allTeams.filter((t) => t.id !== currentTeam.id);
  const pendingExchanges = localExchanges.filter(
  (ex) => ex.status === 'pending' && ex.to_team_id === currentTeam.id
);


  const handleAction = () => {
    if (!selectedTargetTeam) return;

    if (selectedAction === 'exchange') {
      onExchangeClue(selectedTargetTeam);
    } else if (selectedAction === 'hack') {
      onHackClue(selectedTargetTeam);
    }

    setSelectedAction(null);
    setSelectedTargetTeam('');
  };

 useEffect(() => {
  async function loadClues() {
    try {
      // 1️⃣ Charger la session de jeu
      const sessionRes = await sessionApi.get();
      const session = sessionRes.data;

      const caseId = session.current_case_id;
      if (!caseId) {
        console.warn("⚠️ Aucun current_case_id dans la session – pas d'indice à charger.");
        return;
      }

      // 2️⃣ Charger l'indice de l'équipe pour ce cas
      const res = await teamCluesApi.getForTeam(currentTeam.id, caseId);
      const clues = res.data;

      if (clues.length > 0) {
        setClue(clues[0].clue_text);      // indice principal
        setHackedClues(clues.slice(1));   // indices piratés
      } else {
        setClue("");  // éviter un affichage fantôme
      }

    } catch (err) {
      console.error("Erreur chargement indices:", err);
    }
  }

  loadClues();
}, [currentTeam.id]);

useEffect(() => {}, [clueExchanges]);

useEffect(() => {
  const socket = socketService.connect();

  // 🔥 Quand les équipes changent (hack, points…)
  socket.on("teams:updated", (updatedTeams) => {
    const updatedTeam = updatedTeams.find((t: any) => t.id === currentTeam.id);
    if (!updatedTeam) return;

    if (updatedTeam.clues) {
      setClue(updatedTeam.clues[0]?.clue_text || "");
      setHackedClues(updatedTeam.clues.slice(1) || []);
    }

    setPoints(updatedTeam.points);
  });

  // 🔥 Quand il y a un échange créé / accepté / refusé
  socket.on("exchanges:updated", (updatedExchanges) => {
    // ➜ On met à jour la liste locale (le tableau va apparaître instantanément)
    setLocalExchanges(updatedExchanges);

    // ➜ On recharge l’indice (au cas où il a changé)
    sessionApi.get().then((session) => {
      const caseId = session.data.current_case_id;
      if (!caseId) return;

      teamCluesApi.getForTeam(currentTeam.id, caseId).then((res) => {
        const clues = res.data;
        setClue(clues[0]?.clue_text || "");
        setHackedClues(clues.slice(1) || []);
      });
    });
  });

  return () => {
    socket.off("teams:updated");
    socket.off("exchanges:updated");
  };
}, [currentTeam.id]);






  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-teal-900 to-blue-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">{currentTeam.name}</h1>
            <div className="text-2xl font-bold text-teal-300">
              {points} points
            </div>
          </div>
          {/* 🔹 Description clinique du patient */}
<div className="bg-white/10 p-4 rounded-lg mb-6 border border-white/20">
  <h2 className="text-xl font-bold text-yellow-300 mb-2">🧍 Description clinique</h2>
  <p className="text-white/80">
    {activeCase?.clinical_description || "Pas de description pour ce cas."}
  </p>
</div>



          <div className="bg-blue-900/50 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Lightbulb className="text-yellow-400" size={24} />
              <h2 className="text-xl font-bold text-white">Votre Indice</h2>
            </div>
            <p className="text-white text-lg">{clue}</p>

          </div>
      {hackedClues.length > 0 && (

  <div className="bg-red-900/40 rounded-xl p-6 mb-6">
    <div className="flex items-center gap-3 mb-3">
      <Lightbulb className="text-red-400" size={24} />
      <h2 className="text-xl font-bold text-white">Indice piraté</h2>
    </div>
    {hackedClues.map((c, idx) => (
  <p key={idx} className="text-white text-lg">🕵️ {c.clue_text}</p>
))}

  </div>
)}


          <h2 className="text-xl font-bold text-white mb-4">Phase 1: Collecte d'Indices</h2>
          <p className="text-white/80 mb-6">
  Échangez des indices avec une autre équipe ou piratez un indice (coûte 20 points)
</p>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => {
                setSelectedAction('exchange');
                setSelectedTargetTeam('');
              }}
              className={`p-6 rounded-xl border-2 transition-all ${selectedAction === 'exchange'
                ? 'bg-teal-500 border-teal-400 shadow-lg'
                : 'bg-white/5 border-white/20 hover:bg-white/10'
                }`}
            >
              <ArrowRightLeft className="text-teal-300 mb-3" size={32} />
              <h3 className="text-xl font-bold text-white mb-2">Échanger</h3>
              <p className="text-white/70 text-sm">
                Proposer un échange d'indices avec une autre équipe
              </p>
            </button>

            <button
              onClick={() => {
                setSelectedAction('hack');
                setSelectedTargetTeam('');
              }}
              disabled={points < 20}
              className={`p-6 rounded-xl border-2 transition-all ${selectedAction === 'hack'
                ? 'bg-red-500 border-red-400 shadow-lg'
                : 'bg-white/5 border-white/20 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
            >
              <Skull className="text-red-400 mb-3" size={32} />
              <h3 className="text-xl font-bold text-white mb-2">Pirater (20 pts)</h3>
              <p className="text-white/70 text-sm">
                Voler l'indice d'une équipe sans échange
              </p>
            </button>
          </div>

          {selectedAction && (
            <div className="bg-white/5 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold text-white mb-4">
                Choisissez une équipe cible
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {otherTeams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTargetTeam(team.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${selectedTargetTeam === team.id
                      ? 'bg-teal-500 border-teal-400'
                      : 'bg-white/5 border-white/20 hover:bg-white/10'
                      }`}
                  >
                    <div className="text-white font-bold">{team.name}</div>
                    <div className="text-white/70 text-sm">{team.points} pts</div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleAction}
                disabled={!selectedTargetTeam}
                className="w-full py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
              >
                Confirmer l'action
              </button>
            </div>
          )}

          {pendingExchanges.length > 0 && (
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                Demandes d'échange reçues
              </h3>
              <div className="space-y-3">
                {pendingExchanges.map((exchange) => {
                  const fromTeam = allTeams.find((t) => t.id === exchange.from_team_id);
                  return (
                    <div
                      key={exchange.id}
                      className="bg-white/5 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="text-white">
                        <span className="font-bold">{fromTeam?.name}</span> veut échanger
                        des indices
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onAcceptExchange(exchange.id)}
                          className="p-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
                        >
                          <Check size={20} className="text-white" />
                        </button>
                        <button
                          onClick={() => onRejectExchange(exchange.id)}
                          className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                        >
                          <X size={20} className="text-white" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}
          {/** Some backends do not include an `isReady` field on the team object.
              Read it defensively to avoid TypeScript errors and runtime crashes. */}
          {(() => {
            const isReady = (currentTeam as any)?.isReady ?? false;
            return (
              <button
                onClick={() => onTeamReady?.(currentTeam.id)}
                disabled={isReady}
                className={`mt-6 px-6 py-3 rounded-lg font-bold text-white ${isReady ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500'
                  }`}
              >
                ✅ Je suis prêt !
              </button>
            );
          })()}

        </div>
      </div>
    </div>
  );
}

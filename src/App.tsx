import { useEffect, useState } from 'react';
import { Crown } from 'lucide-react';
import {
  Team, ClueExchange, PhaseAnswer, Comment, GameSession, PriseEnCharge,
  teamsApi, exchangesApi, answersApi, commentsApi, sessionApi, priseEnChargeApi
} from './services/api';
import socketService from './services/socket';
import { TeamSelection } from './components/lobby/TeamSelection';
import { Phase1 } from './components/phase1/Phase1';
import { Phase2 } from './components/phase2/Phase2';
import { Phase3 } from './components/phase3/Phase3';
import { Phase4 } from './components/phase4/Phase4';
import { Phase5 } from './components/phase5/Phase5';
import { Phase6 } from './components/phase6/Phase6';
import { Phase7 } from './components/phase7/Phase7';
import { AdminPanel } from './components/admin/AdminPanel';
import axios from "axios";

interface Case {
  id: string;
  title?: string;
  clinical_description?: string;
}
const RAW_API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_URL = RAW_API.replace(/\/+$/, '') + "/api";



const QUESTIONS = [
  {
    question: 'Quels sont les symptômes typiques d\'un infarctus du myocarde?',
    answer: 'Douleur thoracique intense, essoufflement, nausées, sueurs froides',
    cost: 20
  },
  {
    question: 'Quelle est l\'importance de l\'électrocardiogramme dans ce cas?',
    answer: 'L\'ECG permet de détecter l\'élévation du segment ST, signe d\'infarctus aigu',
    cost: 25
  },
  {
    question: 'Pourquoi mesure-t-on la troponine?',
    answer: 'La troponine est un marqueur de lésion myocardique, élevé en cas d\'infarctus',
    cost: 30
  },
  {
    question: 'Quelle est la conduite à tenir en urgence?',
    answer: 'Appel au SAMU, aspirine, repos, surveillance, coronarographie en urgence',
    cost: 35
  },
];

function App() {
  const [gameSession, setGameSession] = useState<GameSession>({ status: 'lobby', current_phase: 0 });
  const [teams, setTeams] = useState<Team[]>([]);
  const [clueExchanges, setClueExchanges] = useState<ClueExchange[]>([]);
  const [phaseAnswers, setPhaseAnswers] = useState<PhaseAnswer[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [priseEnCharges, setPriseEnCharges] = useState<PriseEnCharge[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buzzQuestion, setBuzzQuestion] = useState<{ question: string; answer?: string } | null>(null);
  const [buzzQueue, setBuzzQueue] = useState<string[]>([]);
  const [buzzDisabled, setBuzzDisabled] = useState(false);
  const [activeCase, setActiveCase] = useState(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [phase5Responses, setPhase5Responses] = useState<any[]>([]);


    // 🔐 Détection du mode admin en fonction de l'URL
  useEffect(() => {
    const isAdminUrl =
      window.location.pathname.toLowerCase().includes("admin") ||
      window.location.search.toLowerCase().includes("admin=true");

    setIsAdmin(isAdminUrl);

    if (isAdminUrl) {
      console.log("[App] Admin mode enabled via URL");
    }
  }, []);





  useEffect(() => {
    // Connect socket immediately and handle initial connection
    const socket = socketService.connect();
    if (socket) {
      console.log('[App] Socket connected on mount');
    }

    // Set up real-time listeners AVANT le chargement des données
setupSocketListeners();

// Initialize game data APRÈS
initializeGame().catch(error => {
  console.error('[App] Failed to initialize game:', error);
  setLoading(false);
  
});

socketService.on('diagnosis:updated', (responses: any[]) => {
  console.log('[App] Phase 5 responses updated:', responses);
  setPhase5Responses(responses);
});



    // Cleanup function
    return () => {
      console.log('[App] Cleaning up socket connection');
      socketService.disconnect();
    };
  }, []);




  const initializeGame = async () => {
    console.log('[App] Initializing game data...');
    try {
      // Fetch all initial game data in parallel
      const [
        teamsRes,
        exchangesRes,
        answersRes,
        commentsRes,
        sessionRes,
        prisesRes
      ] = await Promise.all([
        teamsApi.getAll().catch(e => {
          console.error('[App] Failed to fetch teams:', e);
          return { data: [] };
        }),
        exchangesApi.getAll().catch(e => {
          console.error('[App] Failed to fetch exchanges:', e);
          return { data: [] };
        }),
        answersApi.getAll().catch(e => {
          console.error('[App] Failed to fetch answers:', e);
          return { data: [] };
        }),
        commentsApi.getAll().catch(e => {
          console.error('[App] Failed to fetch comments:', e);
          return { data: [] };
        }),
        sessionApi.get().catch(e => {
         console.error('[App] Failed to fetch session:', e);
         return {
         data: {
         status: 'lobby',
         current_phase: 0,
        current_case_id: null,
         } as GameSession,
          };
        }),

        priseEnChargeApi.getAll().catch(e => {
          console.error('[App] Failed to fetch priseEnCharge:', e);
          return { data: [] };
        })
      ]);

      const casesRes = await axios.get(`${API_URL}/cases`);
     const active = casesRes.data.find(
  (c: Case) => c.id === (sessionRes.data.current_case_id ?? null)
);


      setActiveCase(active || null);

            // Charger les questions associées au cas actif
      if (sessionRes.data.current_case_id) {
        try {
          const questionsRes = await axios.get(`${API_URL}/questions`, {
            params: { case_id: sessionRes.data.current_case_id },
          });
          setQuestions(questionsRes.data);
          console.log('[App] Questions chargées:', questionsRes.data.length);
        } catch (err) {
          console.error('[App] Failed to fetch questions:', err);
        }
      }



      console.log('[App] Setting initial state...');
      
      // Update all game state
      setTeams(teamsRes.data);
      setClueExchanges(exchangesRes.data);
      setPhaseAnswers(answersRes.data);
      setComments(commentsRes.data);
      setGameSession(sessionRes.data);
      setPriseEnCharges(prisesRes.data);

      // Restore previous session if available
      const savedTeamId = sessionStorage.getItem('currentTeamId');
      if (savedTeamId) {
        console.log('[App] Restoring previous team session:', savedTeamId);
        const team = teamsRes.data.find((t: Team) => t.id === savedTeamId);
        if (team) {
          console.log('[App] Previous team found:', team.name);
          setCurrentTeam(team);
        } else {
          console.log('[App] Previous team not found, clearing session storage');
          sessionStorage.removeItem('currentTeamId');
        }
      }

            setLoading(false);
      console.log('[App] Game initialized successfully');


      setLoading(false);
      console.log('[App] Game initialized successfully');
    } catch (error) {
      console.error('[App] Critical initialization error:', error);
      setLoading(false);
    }

  };

  const setupSocketListeners = () => {
    // Team updates - includes current team refresh
socketService.on('teams:updated', (updatedTeams: Team[]) => {
  setTeams(updatedTeams);

  setCurrentTeam(prev => {
    if (!prev) return prev;
    const updated = updatedTeams.find(t => t.id === prev.id);
    return updated ? updated : prev;
  });
});





    // Game state updates
   socketService.on('session:updated', async (updatedSession: GameSession) => {
  console.log('[App] Game session updated:', updatedSession);

  setGameSession(updatedSession);

  if (updatedSession.current_case_id) {
    try {
      const caseRes = await axios.get(`${API_URL}/cases`);
      const active = caseRes.data.find((c: Case) => c.id === updatedSession.current_case_id);
      setActiveCase(active || null);
      console.log("[App] Cas actif mis à jour après changement de phase.");

      // 🔥🔥🔥 RECHARGER LES QUESTIONS APRÈS LE CHANGEMENT DE PHASE !!
      const questionsRes = await axios.get(`${API_URL}/questions`, {
        params: { case_id: updatedSession.current_case_id },
      });
      setQuestions(questionsRes.data);
      console.log("[App] Questions rechargées après changement de phase.");

    } catch (err) {
      console.error("[App] Erreur rechargement case/questions :", err);
    }
  }
});



    // Real-time game data updates
    socketService.on('exchanges:updated', (updatedExchanges: ClueExchange[]) => {
      console.log('[App] Exchanges updated:', updatedExchanges.length, 'exchanges');
      setClueExchanges(updatedExchanges);
    });

    socketService.on('answers:updated', (updatedAnswers: PhaseAnswer[]) => {
      console.log('[App] Answers updated:', updatedAnswers.length, 'answers');
      setPhaseAnswers(updatedAnswers);
    });

    socketService.on('comments:updated', (updatedComments: Comment[]) => {
      console.log('[App] Comments updated:', updatedComments.length, 'comments');
      setComments(updatedComments);
    });

    socketService.on('priseEnCharge:updated', (updatedPrises: PriseEnCharge[]) => {
      console.log('[App] PriseEnCharge updated:', updatedPrises.length, 'entries');
      setPriseEnCharges(updatedPrises);
    });

    socketService.on('game:reset', () => {
  console.log('[App] Game reset received');

  // On efface juste les données joueur
  sessionStorage.removeItem('currentTeamId');

  // Si c'est l'admin → on le renvoie proprement sur l'admin panel
  if (window.location.pathname.includes('admin')) {
    window.location.href = '/admin-content';
  } else {
    // Joueur → retour lobby, pas reload
    // Pour éviter de perdre selectedCase de l'admin
    window.location.href = '/';
  }
});


    socketService.on('buzz:newQuestion', (q: { question: string; answer?: string } | null) => {
       console.log('[App] Nouvelle question Buzz:', q);
       setBuzzQuestion(q);
       setBuzzQueue([]);
   });

    socketService.on('buzz:updateQueue', (queue: string[]) => {
       console.log('[App] File de buzz mise à jour:', queue);
       setBuzzQueue(queue);
  });

  };

  const handleJoinTeam = (teamId: string, memberName: string) => {
    socketService.emit('team:join', { teamId, memberName }, (response: any) => {
      if (response.success) {
        const team = teams.find(t => t.id === teamId);
        if (team) {
          setCurrentTeam(team);
          sessionStorage.setItem('currentTeamId', teamId);
        }
      } else {
        alert(response.error || 'Impossible de rejoindre l\'équipe');
      }
    });
  };

  const handleExchangeClue = (targetTeamId: string) => {
    if (!currentTeam) return;

    socketService.emit('exchange:create', {
      fromTeamId: currentTeam.id,
      toTeamId: targetTeamId
    }, (response: any) => {
      if (!response.success) {
        alert(response.error || 'Échec de la création de l\'échange');
      }
    });
  };

  const handleAcceptExchange = (exchangeId: string) => {
    socketService.emit('exchange:accept', { exchangeId }, (response: any) => {
      if (!response.success) {
        alert(response.error || 'Échec de l\'acceptation de l\'échange');
      }
    });
  };

  const handleRejectExchange = (exchangeId: string) => {
    socketService.emit('exchange:reject', { exchangeId }, (response: any) => {
      if (!response.success) {
        alert(response.error || 'Échec du rejet de l\'échange');
      }
    });
  };
  
const handleHackClue = (targetTeamId: string) => {
  if (!currentTeam || currentTeam.points < 20) return;

  const socket = socketService.connect();

  socket.emit(
    'clue:hack', // 🔹 nom d'événement corrigé (était "clue:hack")
    {
      fromTeamId: currentTeam.id,
      targetTeamId,
    },
    (response: any) => {
      // 🔸 Vérifie la réponse du backend
      if (!response || response.error) {
        alert(response?.error || 'Échec du piratage');
        return;
      }

      // 🔸 Si piratage réussi → afficher l’indice volé
      if (response.clue && response.clue.text) {
        alert(`🕵️ Indice piraté : ${response.clue.text}`);
      } else {
        alert('✅ Piratage réussi !');
      }
    }
  );
};



  const handleBuyAnswer = (phase: number, cost: number) => {
    if (!currentTeam || currentTeam.points < cost) return;

    const answer = QUESTIONS[phase - 2].answer;
    socketService.emit('answer:buy', {
      teamId: currentTeam.id,
      phase,
      answer,
      pointsSpent: cost
    }, (response: any) => {
      if (!response.success) {
        alert(response.error || 'Échec de l\'achat de la réponse');
      }
    });
  };

  const handleSubmitDiagnosis = (diagnosis: string) => {
    if (!currentTeam) return;

    socketService.emit('diagnosis:submit', {
      teamId: currentTeam.id,
      diagnosis
    }, (response: any) => {
      if (!response.success) {
        alert(response.error || 'Échec de la soumission du diagnostic');
      }
    });
  };

  const handleSubmitComment = (comment: string) => {
    if (!currentTeam) return;

    socketService.emit('comment:submit', {
      teamId: currentTeam.id,
      comment
    }, (response: any) => {
      if (!response.success) {
        alert(response.error || 'Échec de la soumission du commentaire');
      }
    });
  };

  const handleSubmitPriseEnCharge = (content: string) => {
    if (!currentTeam) return;

    socketService.emit('priseEnCharge:submit', {
      teamId: currentTeam.id,
      content
    }, (response: any) => {
      if (!response.success) {
        alert(response.error || 'Échec de la soumission de la prise en charge');
      }
    });
  };

  const handleStartGame = () => {
    console.log('[App] Attempting to start game...');
    socketService.emit('admin:startGame', {}, (response: any) => {
      if (response.success) {
        console.log('[App] Game started successfully');
      } else {
        console.error('[App] Failed to start game:', response.error);
        alert(response.error || 'Échec du démarrage du jeu');
      }
    });
  };

  const handleNextPhase = () => {
    console.log('[App] Attempting to advance to next phase...');
    socketService.emit('admin:nextPhase', {}, (response: any) => {
      if (response.success) {
        console.log('[App] Advanced to next phase successfully');
      } else {
        console.error('[App] Failed to advance phase:', response.error);
        alert(response.error || 'Échec du passage à la phase suivante');
      }
    });
  };

  const handleAwardPoints = (teamId: string, points: number) => {
    const comment = comments.find(c => c.team_id === teamId);
    const prise = priseEnCharges.find(p => p.team_id === teamId);

    socketService.emit('admin:awardPoints', {
      teamId,
      points,
      commentId: comment?.id,
      priseId: prise?.id
    }, (response: any) => {
      if (!response.success) {
        alert(response.error || 'Échec de l\'attribution des points');
      }
    });
  };

  const handleResetGame = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser le jeu? Toutes les données seront perdues.')) {
      socketService.emit('admin:resetGame', {}, (response: any) => {
        if (response.success) {
          sessionStorage.removeItem('currentTeamId');
          window.location.reload();
        } else {
          alert(response.error || 'Échec de la réinitialisation');
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-teal-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">Chargement...</div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <AdminPanel
        teams={teams}
        comments={comments}
        priseEnCharges={priseEnCharges}
        phase5Responses={phase5Responses}
        currentPhase={gameSession.current_phase}
        onStartGame={handleStartGame}
        onNextPhase={handleNextPhase}
        onAwardPoints={handleAwardPoints}
        gameStatus={gameSession.status}
        onResetGame={handleResetGame}
      />
    );
  }

  if (!currentTeam) {
    return (
      <TeamSelection
        teams={teams.map(team => ({
          id: team.id,
          name: team.name,
          members: team.members.length,
          points: team.points,
        }))}
        onJoinTeam={handleJoinTeam}
      />
    );
  }

  const updatedCurrentTeam = currentTeam;


  if (gameSession.status === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-teal-900 to-blue-900 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">En attente du début du jeu...</h1>
          <p className="text-teal-300 mb-8">Vous êtes dans {updatedCurrentTeam.name}</p>
          <p className="text-white/70 mb-4">Membres: {updatedCurrentTeam.members.join(', ')}</p>
          <div className="animate-pulse text-teal-400 text-2xl">⏳</div>
        </div>
      </div>
    );
  }

  if (gameSession.status === 'phase1') {
    return (
      <Phase1
        currentTeam={updatedCurrentTeam}
        allTeams={teams}
        clueExchanges={clueExchanges}
        onExchangeClue={handleExchangeClue}
        onAcceptExchange={handleAcceptExchange}
        onRejectExchange={handleRejectExchange}
        onHackClue={handleHackClue}
        activeCase={activeCase} 
      />
    );
  }

 if (gameSession.status === 'phase2') {
  // On récupère les réponses déjà achetées par cette équipe (phase 2 uniquement)
  const purchasedAnswers = phaseAnswers
    .filter(a => a.team_id === updatedCurrentTeam.id && a.phase === 2 && a.question_id)
    .map(a => a.question_id!) as string[];

  // Fonction pour acheter une réponse spécifique
  const handleBuyAnswerForQuestion = (questionId: string, cost: number) => {
    if (!currentTeam || currentTeam.points < cost) {
      alert("Points insuffisants !");
      return;
    }

    // 🔹 On envoie l’achat au serveur
    socketService.emit('answer:buy', {
      teamId: currentTeam.id,
      phase: 2,
      questionId,
      pointsSpent: cost,
    }, (response: any) => {
      if (!response.success) {
        alert(response.error || "Échec de l'achat de la réponse");
      }
    });
  };

  return (
    <Phase2
      currentTeam={updatedCurrentTeam}
      onBuyAnswer={handleBuyAnswerForQuestion}
      purchasedQuestions={purchasedAnswers}
      questions={questions.filter(q => q.phase === 2)}

    />
  );
}

  if (gameSession.status === 'phase3') {
  const purchasedAnswers = phaseAnswers
    .filter(a => a.team_id === updatedCurrentTeam.id && a.phase === 3 && a.question_id)
    .map(a => a.question_id!) as string[];

  const handleBuyAnswerPhase3 = (questionId: string, cost: number) => {
    if (!currentTeam || currentTeam.points < cost) {
      alert("Points insuffisants !");
      return;
    }

    socketService.emit('answer:buy', {
      teamId: currentTeam.id,
      phase: 3,
      questionId,
      pointsSpent: cost,
    });
  };

  return (
    <Phase3
      currentTeam={updatedCurrentTeam}
      onBuyAnswer={handleBuyAnswerPhase3}
      purchasedQuestions={purchasedAnswers}
      questions={questions.filter(q => q.phase === 3)}
    />
  );
}


if (gameSession.status === 'phase4') {
  // Réponses achetées par cette équipe
  const purchasedAnswers = phaseAnswers
    .filter(a => a.team_id === updatedCurrentTeam.id && a.phase === 4 && a.question_id)
    .map(a => a.question_id!) as string[];

  // Acheter une réponse pour une question
  const handleBuyAnswerPhase4 = (questionId: string, cost: number) => {
    if (!currentTeam || currentTeam.points < cost) {
      alert("Points insuffisants !");
      return;
    }

    socketService.emit('answer:buy', {
      teamId: currentTeam.id,
      phase: 4,
      questionId,
      pointsSpent: cost,
    });
  };

  return (
    <Phase4
      currentTeam={updatedCurrentTeam}
      onBuyAnswer={handleBuyAnswerPhase4}
      purchasedQuestions={purchasedAnswers}
      questions={questions.filter(q => q.phase === 4)}
    />
  );
}


  if (gameSession.status === 'phase5') {
    const diagnosis = phase5Responses.find(r => r.team_id === updatedCurrentTeam.id);
    return (
      <Phase5
        currentTeam={updatedCurrentTeam}
        onSubmitDiagnosis={handleSubmitDiagnosis}
        hasSubmitted={!!diagnosis}
        submittedDiagnosis={diagnosis?.response_text}
      />
    );
  }

  if (gameSession.status === 'phase6') {
    const comment = comments.find(c => c.team_id === updatedCurrentTeam.id);
    return (
      <Phase6
        currentTeam={updatedCurrentTeam}
        onSubmitComment={handleSubmitComment}
        hasSubmitted={false}  
        submittedComment={undefined}
      />
    );
  }

  if (gameSession.status === 'phase7') {
    const prise = priseEnCharges.find(p => p.team_id === updatedCurrentTeam.id);
    return (
      <Phase7
        currentTeam={updatedCurrentTeam}
        onSubmitPriseEnCharge={handleSubmitPriseEnCharge}
        hasSubmitted={!!prise}
        submittedContent={prise?.content}
      />
    );
  }

// ✅ PHASE BUZZ

if (gameSession.status === 'buzz') {

  const handleBuzz = () => {
    if (!currentTeam || buzzDisabled) return;

    setBuzzDisabled(true); // Empêche le spam

    socketService.emit('buzz:press', { teamId: currentTeam.id }, (response: any) => {
      if (!response.success) {
        alert(response.error || "Erreur lors du buzz");
        setBuzzDisabled(false);
      } else {
        console.log(`[Buzz] ${currentTeam.name} a buzzé !`);
      }
    });

    // Réactive le bouton après 3 secondes
    setTimeout(() => setBuzzDisabled(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-teal-900 to-blue-900 p-6 text-white">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center">⚡ Phase Buzz</h1>

        {/* Question */}
        <div className="bg-white/10 rounded-xl p-6 border border-white/20 text-center">
          <div className="text-teal-300 mb-2">Question actuelle</div>
          <div className="text-2xl font-semibold">
            {buzzQuestion?.question ?? "En attente de la question…"}
          </div>
        </div>

        {/* Bouton Buzz */}
        <div className="flex justify-center">
          <button
            onClick={handleBuzz}
            disabled={buzzDisabled}
            className={`px-8 py-4 text-2xl font-bold rounded-xl transition-all duration-200 ${
              buzzDisabled
                ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                : "bg-yellow-400 hover:bg-yellow-300 text-black shadow-lg shadow-yellow-500/30"
            }`}
          >
            🔔 BUZZ !
          </button>
        </div>

        {/* File d'attente */}
        <div className="bg-white/10 rounded-xl p-6 border border-white/20">
          <div className="text-teal-300 mb-2">Ordre des buzz</div>
          {buzzQueue.length === 0 ? (
            <div className="text-white/70">Aucune équipe n’a buzzé pour le moment.</div>
          ) : (
            <ol className="list-decimal ml-5 space-y-1">
              {buzzQueue.map((id) => {
                const team = teams.find((t) => t.id === id);
                return <li key={id}>{team?.name ?? id}</li>;
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}



  if (gameSession.status === 'finished') {
    const sortedTeams = [...teams].sort((a, b) => b.points - a.points);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-teal-900 to-blue-900 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <Crown className="text-yellow-400 mx-auto mb-4" size={64} />
            <h1 className="text-5xl font-bold text-white mb-4">Jeu Terminé!</h1>
            <p className="text-teal-300 text-xl">Classement Final</p>
          </div>
          <div className="space-y-4">
            {sortedTeams.map((team, index) => (
              <div
                key={team.id}
                className={`bg-white/10 backdrop-blur border rounded-xl p-6 ${
                  index === 0 ? 'border-yellow-400 shadow-lg shadow-yellow-400/20' : 'border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`text-3xl font-bold ${
                      index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-600' : 'text-white/50'
                    }`}>
                      #{index + 1}
                    </div>
                    <span className="text-white text-xl font-semibold">{team.name}</span>
                  </div>
                  <div className="text-3xl font-bold text-teal-400">{team.points} pts</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default App;

import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import socketService from '../../services/socket';

interface PhaseBuzzProps {
  currentTeam: {
    id: string;
    name: string;
    points: number;
    members: string[];
  };
}

type BuzzQuestion = { question: string; answer?: string } | null;

export function PhaseBuzz({ currentTeam }: PhaseBuzzProps) {
  const [currentQuestion, setCurrentQuestion] = useState<BuzzQuestion>(null);
  const [queue, setQueue] = useState<string[]>([]);
  const youIndex = queue.indexOf(currentTeam.id);

  useEffect(() => {
    // 🔹 Mise à jour de la file des buzzs
    const handleQueue = (q: string[]) => setQueue(q || []);

    // 🔹 Mise à jour de la question en cours
    const handleQuestion = (q: BuzzQuestion) => setCurrentQuestion(q);

    // Écoute des événements
    socketService.on('buzz:updateQueue', handleQueue);
    socketService.on('buzz:newQuestion', handleQuestion);

    // ✅ Synchronisation automatique à la connexion
    socketService.emit('buzz:requestSync');

    // Nettoyage
    return () => {
      socketService.off('buzz:updateQueue', handleQueue);
      socketService.off('buzz:newQuestion', handleQuestion);
    };
  }, [currentTeam.id]);

  const handleBuzz = () => {
    // Envoie un signal de buzz au serveur avec l'ID de l'équipe
    socketService.emit('buzz:trigger', currentTeam.id);
  };

  return (
    <div className="min-h-[60vh] p-6 rounded-xl bg-purple-900/20 border border-purple-700/40">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Zap className="text-yellow-400" /> Phase Buzz
        </h2>
        <div className="text-white/80">
          Équipe : <b>{currentTeam.name}</b>
        </div>
      </div>

      {!currentQuestion ? (
        <div className="text-center py-16">
          <Zap className="text-yellow-400 mx-auto mb-4 animate-pulse" size={64} />
          <p className="text-white text-xl">
            En attente de la question (l’admin va l’envoyer) …
          </p>
        </div>
      ) : (
        <>
          <div className="bg-purple-900/30 rounded-xl p-6 mb-6">
            <h3 className="text-xl text-white mb-2">Question</h3>
            <p className="text-lg text-white">{currentQuestion.question}</p>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={handleBuzz}
              disabled={youIndex !== -1}
              className={`px-6 py-3 rounded-xl font-bold transition-colors ${
                youIndex === -1
                  ? 'bg-yellow-400 hover:bg-yellow-300 text-gray-900'
                  : 'bg-gray-600 text-gray-300 cursor-not-allowed'
              }`}
            >
              Buzz !
            </button>

            {youIndex === -1 ? (
              <span className="text-white/80">Clique pour te mettre dans la file</span>
            ) : youIndex === 0 ? (
              <span className="text-green-400 font-semibold">
                🎯 Tu es 1er dans la file — attends la parole de l’admin
              </span>
            ) : (
              <span className="text-yellow-200">
                ⏳ Tu es #{youIndex + 1} dans la file
              </span>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h4 className="text-white/90 mb-3">Ordre des buzz</h4>
            <ol className="list-decimal list-inside space-y-1 text-white/80">
              {queue.map((teamId, idx) => (
                <li key={teamId}>
                  {idx === 0 ? '🎯 ' : ''}
                  {teamId}
                  {teamId === currentTeam.id ? ' (toi)' : ''}
                </li>
              ))}
              {queue.length === 0 && (
                <li className="text-white/50 italic">Aucun buzz pour l’instant</li>
              )}
            </ol>
          </div>
        </>
      )}
    </div>
  );
}

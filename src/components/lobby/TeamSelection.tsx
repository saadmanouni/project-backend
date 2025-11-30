import { useState } from 'react';
import { Users } from 'lucide-react';

interface TeamOption {
  id: string;
  name: string;
  members: number;
  points: number;
}

interface TeamSelectionProps {
  teams: TeamOption[];
  onJoinTeam: (teamId: string, memberName: string) => void;
}

export function TeamSelection({ teams, onJoinTeam }: TeamSelectionProps) {
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [memberName, setMemberName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTeam && memberName.trim()) {
      onJoinTeam(selectedTeam, memberName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-teal-900 to-blue-900 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Shadow of the Diagnosis
          </h1>
          <p className="text-teal-300 text-xl">
            Jeu de Formation Médicale
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Choisissez votre équipe</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team.id)}
                disabled={team.members >= 3}
                className={`p-6 rounded-xl border-2 transition-all ${
                  selectedTeam === team.id
                    ? 'bg-teal-500 border-teal-400 shadow-lg shadow-teal-500/50'
                    : team.members >= 3
                    ? 'bg-gray-700/50 border-gray-600 cursor-not-allowed opacity-50'
                    : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-teal-400'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{team.name}</h3>
                  <div className="text-teal-300 font-bold">{team.points} pts</div>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <Users size={20} />
                  <span>{team.members}/3 membres</span>
                </div>
                {team.members >= 3 && (
                  <div className="mt-2 text-red-400 text-sm font-semibold">
                    Équipe complète
                  </div>
                )}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white mb-2 font-semibold">
                Votre nom
              </label>
              <input
                type="text"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="Entrez votre nom..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={!selectedTeam || !memberName.trim()}
              className="w-full py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
            >
              Rejoindre l'équipe
            </button>
          </form>
        </div>

        <div className="text-center text-white/60 text-sm">
          <p>Chaque équipe peut avoir maximum 3 membres</p>
        </div>
      </div>
    </div>
  );
}

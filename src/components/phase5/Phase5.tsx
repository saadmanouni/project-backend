import { Stethoscope, Send, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import socketService from "../../services/socket";
import { Team } from '../../services/api';

interface Phase5Props {
  currentTeam: Team;
  onSubmitDiagnosis: (diagnosis: string) => void;
  hasSubmitted: boolean;
  submittedDiagnosis?: string;
}


export function Phase5({ currentTeam, onSubmitDiagnosis }: Phase5Props) {

  const API_URL = import.meta.env.VITE_API_URL;

  const [diagnosis, setDiagnosis] = useState("");
  const [locked, setLocked] = useState(false);

  // ================================
  // 🔥 Charger le vrai diagnostic backend
  // ================================
  useEffect(() => {
    async function fetchPrevious() {
      try {
        const res = await fetch(`${API_URL}/api/phase5?team_id=${currentTeam.id}`);
        const data = await res.json();

        // 🚨 data = ARRAY (ex: [ { id, team_id, response_text } ])
        const entry = Array.isArray(data) ? data[0] : null;

        if (data && data.response_text) {
          setDiagnosis(data.response_text);
          setLocked(true);
        }
      } catch (err) {
        console.error("Erreur chargement P5:", err);
      }
    }
    fetchPrevious();
  }, [currentTeam.id]);


  // ================================
  // 🔥 SOCKET : une équipe soumet → toutes se bloquent
  // ================================
  useEffect(() => {
    socketService.on("phase5:updated", () => {
      setLocked(true); // on bloque immédiatement
      // recharge la valeur depuis la base
      fetch(`${API_URL}/api/phase5?team_id=${currentTeam.id}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.response_text) {
          setDiagnosis(data.response_text);
          }
        });
    });

    return () => {
      socketService.off("phase5:updated");
    };
  }, []);


  // Soumission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (diagnosis.trim()) {
      onSubmitDiagnosis(diagnosis.trim());
      setLocked(true);      // ➜ blocage immédiat
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-teal-900 to-blue-900 p-6">
      <div className="max-w-4xl mx-auto">

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">{currentTeam.name}</h1>
            <div className="text-2xl font-bold text-teal-300">
              {currentTeam.points} points
            </div>
          </div>

          {/* Titre */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Stethoscope className="text-teal-400" size={48} />
              <h2 className="text-4xl font-bold text-white">Phase 5</h2>
            </div>
            <p className="text-teal-300 text-lg">Diagnostic Final</p>
          </div>

          {/* Form */}
          {!locked ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white font-bold mb-3 text-lg">
                  Votre Diagnostic:
                </label>

                <textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Entrez votre diagnostic détaillé..."
                  rows={8}
                  disabled={locked}
                  className={`w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white 
                  placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-teal-500
                  ${locked ? "opacity-50 cursor-not-allowed" : ""}`}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={locked || !diagnosis.trim()}
                className="w-full py-4 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-600 
                disabled:cursor-not-allowed text-white font-bold text-lg rounded-lg 
                transition-colors flex items-center justify-center gap-2"
              >
                <Send size={24} />
                Soumettre le diagnostic
              </button>
            </form>
          ) : (
            // Affichage
            <div className="bg-green-900/50 border border-green-500/50 rounded-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="text-green-400" size={32} />
                <h3 className="text-2xl font-bold text-white">Diagnostic Soumis</h3>
              </div>

              <div className="bg-white/10 rounded-lg p-6">
                <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">
                  {diagnosis}
                </p>
              </div>

              <div className="mt-6 text-center">
                <p className="text-teal-300 text-lg">
                  En attente de l'évaluation de l'admin...
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

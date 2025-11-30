import { FileText, Send, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Team } from '../../services/api';

interface Phase7Props {
  currentTeam: Team;
  onSubmitPriseEnCharge: (content: string) => void;
  hasSubmitted: boolean;
  submittedContent?: string;
}

export function Phase7({
  currentTeam,
  onSubmitPriseEnCharge,
  hasSubmitted,
  submittedContent,
}: Phase7Props) {

  const API_URL = import.meta.env.VITE_API_URL;

  // Contenu de la prise en charge
  const [content, setContent] = useState("");

  // Empêche la réécriture après refresh
  const [locked, setLocked] = useState(false);

  // Charger la prise en charge déjà enregistrée
  useEffect(() => {
    async function fetchExisting() {
      try {
        const res = await fetch(`${API_URL}/api/prise-en-charge?team_id=${currentTeam.id}`);
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          setContent(data[0].content);
          setLocked(true);
        } else if (submittedContent) {
          setContent(submittedContent);
          setLocked(true);
        }
      } catch (err) {
        console.error("Erreur chargement prise en charge:", err);
      }
    }

    fetchExisting();
  }, [currentTeam.id, submittedContent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (content.trim()) {
      onSubmitPriseEnCharge(content.trim());
      setLocked(true);
    }
  };

  const isDisabled = locked || hasSubmitted;

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

          {/* Titles */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <FileText className="text-teal-400" size={48} />
              <h2 className="text-4xl font-bold text-white">Phase 7</h2>
            </div>
            <p className="text-teal-300 text-lg">Prise en Charge</p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-900/50 rounded-xl p-8 mb-8">
            <p className="text-white text-lg leading-relaxed mb-4">
              Proposez un plan de prise en charge complet pour le patient basé sur votre diagnostic.
            </p>
            <ul className="text-white/90 space-y-2 list-disc list-inside">
              <li>Examens complémentaires à prescrire</li>
              <li>Traitements médicamenteux recommandés</li>
              <li>Suivi médical et consultations nécessaires</li>
              <li>Conseils et recommandations pour le patient</li>
            </ul>
          </div>

          {/* FORM */}
          {!isDisabled ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white font-bold mb-3 text-lg">
                  Plan de Prise en Charge:
                </label>

                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Décrivez votre plan de prise en charge détaillé..."
                  rows={12}
                  disabled={isDisabled}
                  className={`w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white 
                    placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-teal-500
                    ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isDisabled || !content.trim()}
                className="w-full py-4 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-600 disabled:cursor-not-allowed 
                           text-white font-bold text-lg rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Send size={24} />
                Soumettre la prise en charge
              </button>
            </form>

          ) : (
            /* Submitted Display */
            <div className="bg-green-900/50 border border-green-500/50 rounded-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="text-green-400" size={32} />
                <h3 className="text-2xl font-bold text-white">Prise en Charge Soumise</h3>
              </div>

              <div className="bg-white/10 rounded-lg p-6">
                <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">
                  {content}
                </p>
              </div>

              <div className="mt-6 text-center">
                <p className="text-teal-300 text-lg">En attente de l'évaluation de l'admin...</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

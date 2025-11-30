import { useState, useEffect } from 'react';
import {
  BookOpen,
  FileText,
  HelpCircle,
  MessageSquare,
  Edit,
  Settings as SettingsIcon,
  Save,
  Plus,
  Trash2,
  Zap
} from 'lucide-react';
import axios from 'axios';

/* ---------------------- API NORMALISATION ---------------------- */

const RAW_API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// always ends with /api (but only once)
const API_URL = RAW_API.replace(/\/+$/, '').endsWith('/api')
  ? RAW_API.replace(/\/+$/, '')
  : RAW_API.replace(/\/+$/, '') + '/api';

/* ---------------------- INTERFACES ---------------------- */

interface Case {
  id: string;
  title: string;
  clinical_description: string;
  attachments?: string;
}

interface TeamClue {
  id: string;
  team_id: string;
  case_id: string;
  clue_text: string;
  clue_cost: number;
  is_piratable: number;
}

interface Question {
  id: string;
  case_id: string;
  phase: number;
  question_text: string;
  expected_answer: string;
  points: number;
  category: 'useful' | 'parasite';
  comment?: string;
}

interface GameSettings {
  buy_answer_cost: number;
  exchange_cost: number;
  hack_cost: number;
  correct_answer_reward: number;
  wrong_answer_penalty: number;
  max_errors_phase6: number;
}

interface Team {
  id: string;
  name: string;
}

type TabId = 'cases' | 'clues' | 'questions' | 'settings' | 'buzz' | 'phase6';


interface BuzzQuestion {
  question: string;
  answer: string;
}

interface EditingBuzz extends BuzzQuestion {
  index?: number;
}

  // -------- Phase 6 (Vrai/Faux) --------
interface Phase6Question {
  id: string;
  question_text: string;
  correct_answer: number;
  order_index: number;
}

/* ---------------------- COMPONENT ---------------------- */

export function AdminContentManager() {
  const [activeTab, setActiveTab] = useState<TabId>('cases');

  const [cases, setCases] = useState<Case[]>([]);
  const [teamClues, setTeamClues] = useState<TeamClue[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [buzzQuestions, setBuzzQuestions] = useState<BuzzQuestion[]>([]);

  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState(2);


  const [editingCase, setEditingCase] = useState<Partial<Case> | null>(null);
  const [editingClue, setEditingClue] = useState<Partial<TeamClue> | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);
  const [editingBuzz, setEditingBuzz] = useState<EditingBuzz | null>(null);


const [phase6Questions, setPhase6Questions] = useState<Phase6Question[]>([]);
const [editingPhase6, setEditingPhase6] = useState<Partial<Phase6Question> | null>(null);

const [phase6Settings, setPhase6Settings] = useState({
  time_per_question: 15,
  lives_per_team: 3,
});



  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: 'cases', label: 'Cas Cliniques', icon: FileText },
    { id: 'clues', label: 'Indices', icon: HelpCircle },
    { id: 'questions', label: 'Questions', icon: MessageSquare },
    { id: 'phase6', label: 'Phase 6 (VF)', icon: HelpCircle },
    { id: 'settings', label: 'Paramètres', icon: SettingsIcon },
    { id: 'buzz', label: 'Questions Buzz', icon: Zap },
  ];

  /* ---------------------- DATA LOADING ---------------------- */

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [
  casesRes,
  cluesRes,
  questionsRes,
  settingsRes,
  buzzRes,
  teamsRes,
  phase6Res,
  phase6SettingsRes
] = await Promise.all([
  axios.get(`${API_URL}/cases`),
  axios.get(`${API_URL}/team-clues`),
  axios.get(`${API_URL}/questions`),
  axios.get(`${API_URL}/settings`),
  axios.get(`${API_URL}/buzz/questions`),
  axios.get(`${API_URL}/teams`),
  axios.get(`${API_URL}/phase6/questions`),
  axios.get(`${API_URL}/phase6/settings`)
]);

setPhase6Settings(phase6SettingsRes.data);



      setCases(casesRes.data);
      setTeamClues(cluesRes.data);
      setQuestions(questionsRes.data);
      setSettings(settingsRes.data);
      setBuzzQuestions(buzzRes.data);
      setTeams(teamsRes.data);
      setPhase6Questions(phase6Res.data);


      if (!selectedCase && casesRes.data.length > 0) {
        setSelectedCase(casesRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      alert('Échec du chargement des données');
    }
  };




  /* ---------------------- SAVE / DELETE HANDLERS ---------------------- */

  const saveCase = async () => {
    if (!editingCase) return;

    try {
      if (editingCase.id) {
        await axios.put(`${API_URL}/cases/${editingCase.id}`, editingCase);
      } else {
        const res = await axios.post(`${API_URL}/cases`, editingCase);
        setSelectedCase(res.data.id);
      }
      setEditingCase(null);
      loadData();
    } catch (err) {
      console.error('Failed to save case:', err);
      alert('Échec de la sauvegarde du cas');
    }
  };

  const deleteCase = async (id: string) => {
    if (!confirm('Supprimer ce cas clinique ?')) return;
    try {
      await axios.delete(`${API_URL}/cases/${id}`);
      if (selectedCase === id) {
        setSelectedCase(null);
      }
      loadData();
    } catch (err) {
      console.error('Failed to delete case:', err);
      alert('Échec de la suppression du cas');
    }
  };

 const saveClue = async () => {
  console.log("Selected case:", selectedCase);
  console.log("Editing clue:", editingClue);

  if (!editingClue || !selectedCase) return;

  try {
    const payload = {
      team_id: editingClue.team_id,
      case_id: selectedCase,
      clue_text: editingClue.clue_text,
      clue_cost: Number(editingClue.clue_cost) || 0,
      is_piratable: Number(editingClue.is_piratable) || 0,
    };

    if (editingClue.id) {
      // 🔥 Mise à jour complète — important
      await axios.put(`${API_URL}/team-clues/${editingClue.id}`, payload);
    } else {
      // 🔥 Nouvel indice
      await axios.post(`${API_URL}/team-clues`, payload);
    }

    setEditingClue(null);
    loadData();
  } catch (err) {
    console.error("❌ Failed to save clue:", err);
    alert("Erreur lors de la sauvegarde de l'indice");
  }
};



  const deleteClue = async (id: string) => {
  if (!confirm("Supprimer cet indice ?")) return;

  try {
    await axios.delete(`${API_URL}/team-clues/${id}`);
    loadData();
  } catch (err) {
    console.error("❌ Failed to delete clue:", err);
    alert("Erreur lors de la suppression de l'indice");
  }
};

  const saveQuestion = async () => {
    if (!editingQuestion || !selectedCase) return;

    try {
      if (editingQuestion.id) {
        await axios.put(`${API_URL}/questions/${editingQuestion.id}`, editingQuestion);
      } else {
        await axios.post(`${API_URL}/questions`, {
           ...editingQuestion,
           case_id: selectedCase,
               });

      }
      setEditingQuestion(null);
      loadData();
    } catch (err) {
      console.error('Failed to save question:', err);
      alert('Échec de la sauvegarde de la question');
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm('Supprimer cette question ?')) return;
    try {
      await axios.delete(`${API_URL}/questions/${id}`);
      loadData();
    } catch (err) {
      console.error('Failed to delete question:', err);
      alert('Échec de la suppression de la question');
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    try {
      await axios.put(`${API_URL}/settings`, settings);
      alert('Paramètres sauvegardés');
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Échec de la sauvegarde des paramètres');
    }
  };

  const saveBuzzList = async (newList: BuzzQuestion[]) => {
    try {
      await axios.put(`${API_URL}/buzz/questions`, { questions: newList });
      setEditingBuzz(null);
      loadData();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde des questions Buzz :', err);
      alert('Erreur lors de la sauvegarde des questions Buzz');
    }
  };

  /* ---------------------- DERIVED DATA ---------------------- */

  const currentCase = cases.find((c) => c.id === selectedCase) || null;
  const currentClues = currentCase
    ? teamClues.filter((c) => c.case_id === currentCase.id)
    : [];
 const currentQuestions = questions.filter(
  (q) =>
    q.phase === selectedPhase &&
    q.case_id === selectedCase
);




  /* ---------------------- RENDER ---------------------- */

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="text-blue-600" size={32} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestion du Contenu
              </h1>
              <p className="text-gray-600">
                Configuration des cas cliniques et questions
              </p>
            </div>
          </div>

          {/* TABS */}
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* --- CAS CLINIQUES --- */}
        {activeTab === 'cases' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Cas Cliniques</h2>
              <button
                onClick={() =>
                  setEditingCase({ title: '', clinical_description: '' })
                }
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus size={18} />
                Nouveau Cas
              </button>
            </div>

            {editingCase && (
              <div className="bg-white border rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingCase.id ? 'Modifier le Cas' : 'Nouveau Cas'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Titre
                    </label>
                    <input
                      type="text"
                      value={editingCase.title || ''}
                      onChange={(e) =>
                        setEditingCase({
                          ...editingCase,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="Ex: Invagination intestinale aiguë"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description Clinique
                    </label>
                    <textarea
                      value={editingCase.clinical_description || ''}
                      onChange={(e) =>
                        setEditingCase({
                          ...editingCase,
                          clinical_description: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg h-32"
                      placeholder="Description complète du cas clinique..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveCase}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      <Save size={18} />
                      Sauvegarder
                    </button>
                    <button
                      onClick={() => setEditingCase(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4">
              {cases.map((c) => (
                <div
                  key={c.id}
                  className="bg-white border rounded-xl p-6 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {c.title}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {c.clinical_description}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingCase(c)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => deleteCase(c.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCase(c.id)}
                    className={`mt-4 px-4 py-2 rounded-lg font-medium ${
                      selectedCase === c.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {selectedCase === c.id ? 'Cas Actif' : 'Sélectionner'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- INDICES --- */}
        {activeTab === 'clues' && currentCase && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Indices - {currentCase.title}
              </h2>

              <button
                onClick={() =>
                  setEditingClue({
                    team_id: '',
                    clue_text: '',
                    clue_cost: 10,
                    is_piratable: 0,
                    case_id: currentCase.id,
                  })
                }
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus size={18} />
                Nouvel Indice
              </button>
            </div>

            {editingClue && (
              <div className="bg-white border rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingClue.id ? "Modifier l'Indice" : 'Nouvel Indice'}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Équipe
                    </label>
                    <select
                      value={editingClue.team_id || ''}
                      onChange={(e) =>
                        setEditingClue({
                          ...editingClue,
                          team_id: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="">Sélectionner...</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Texte de l'Indice
                    </label>
                    <input
                      type="text"
                      value={editingClue.clue_text || ''}
                      onChange={(e) =>
                        setEditingClue({
                          ...editingClue,
                          clue_text: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="Ex: Vomissements répétés"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Coût (points)
                      </label>
                      <input
                        type="number"
                        value={editingClue.clue_cost ?? 0}
                        onChange={(e) =>
                          setEditingClue({
                            ...editingClue,
                            clue_cost: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Piratable
                      </label>
                      <select
                        value={editingClue.is_piratable ?? 0}
                        onChange={(e) =>
                          setEditingClue({
                            ...editingClue,
                            is_piratable: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        <option value={0}>Non</option>
                        <option value={1}>Oui</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={saveClue}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      <Save size={18} />
                      Sauvegarder
                    </button>

                    <button
                      onClick={() => setEditingClue(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="bg-white border rounded-xl p-6 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {team.name}
                  </h3>

                  <div className="space-y-2">
                    {currentClues
                      .filter((c) => c.team_id === team.id)
                      .map((clue) => (
                        <div
                          key={clue.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="text-gray-900">{clue.clue_text}</p>
                            <p className="text-sm text-gray-600">
                              {clue.clue_cost} pts •{' '}
                              {clue.is_piratable
                                ? 'Piratable'
                                : 'Non piratable'}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingClue(clue)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit size={16} />
                            </button>

                            <button
                              onClick={() => deleteClue(clue.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- QUESTIONS PHASE 2 --- */}
        {activeTab === 'questions' && currentCase && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                🧠 Questions - {currentCase.title} (Phase {selectedPhase})

              </h2>
                  <div className="flex items-center gap-3">
  <label className="text-sm text-gray-700 font-medium">Phase :</label>
  <select
    value={selectedPhase}
    onChange={(e) => setSelectedPhase(parseInt(e.target.value))}
    className="px-3 py-2 border rounded-lg"
  >
    <option value={2}>Phase 2</option>
    <option value={3}>Phase 3</option>
    <option value={4}>Phase 4</option>
  </select>
</div>

              <button
                onClick={() =>
                  setEditingQuestion({
                  phase: selectedPhase,
                  question_text: '',
                  expected_answer: '',
                  points: 1,
                  category: 'useful',
                  comment: '',
                  case_id: currentCase.id,
                  })
                }
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus size={18} /> Nouvelle Question
              </button>
            </div>

            {editingQuestion && (
              <div className="bg-white border rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingQuestion.id
                    ? 'Modifier la Question'
                    : 'Nouvelle Question'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Texte de la question
                    </label>
                    <textarea
                      value={editingQuestion.question_text || ''}
                      onChange={(e) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          question_text: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg h-24"
                      placeholder="Ex : Antécédents personnels ?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Réponse attendue
                    </label>
                    <textarea
                      value={editingQuestion.expected_answer || ''}
                      onChange={(e) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          expected_answer: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg h-24"
                      placeholder="Ex : Une symptomatologie de gastroentérite..."
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Points
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={editingQuestion.points || 1}
                        onChange={(e) =>
                          setEditingQuestion({
                            ...editingQuestion,
                            points: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Catégorie
                      </label>
                      <select
                        value={editingQuestion.category || 'useful'}
                        onChange={(e) =>
                          setEditingQuestion({
                            ...editingQuestion,
                            category: e.target
                              .value as 'useful' | 'parasite',
                          })
                        }
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        <option value="useful">Utile</option>
                        <option value="parasite">Parasite</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Commentaire
                      </label>
                      <input
                        type="text"
                        value={editingQuestion.comment || ''}
                        onChange={(e) =>
                          setEditingQuestion({
                            ...editingQuestion,
                            comment: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border rounded-lg"
                        placeholder="Optionnel"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={saveQuestion}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      <Save size={18} /> Sauvegarder
                    </button>
                    <button
                      onClick={() => setEditingQuestion(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Phase {selectedPhase}
                   </h3>

              <div className="space-y-3">
                {currentQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium mb-1">
                        {question.question_text}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        {question.expected_answer}
                      </p>
                      <p className="text-xs text-gray-500">
                        {question.points} pts •{' '}
                        {question.category === 'useful' ? 'Utile' : 'Parasite'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingQuestion(question)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => deleteQuestion(question.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- PARAMÈTRES DU JEU --- */}
        {activeTab === 'settings' && settings && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              Paramètres du Jeu
            </h2>
            <div className="bg-white border rounded-xl p-6 shadow-sm">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Coût d'achat de réponse
                  </label>
                  <input
                    type="number"
                    value={settings.buy_answer_cost}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        buy_answer_cost: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Coût d'échange d'indice
                  </label>
                  <input
                    type="number"
                    value={settings.exchange_cost}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        exchange_cost: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Coût de piratage
                  </label>
                  <input
                    type="number"
                    value={settings.hack_cost}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        hack_cost: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points pour réponse correcte
                  </label>
                  <input
                    type="number"
                    value={settings.correct_answer_reward}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        correct_answer_reward: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pénalité pour mauvaise réponse
                  </label>
                  <input
                    type="number"
                    value={settings.wrong_answer_penalty}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        wrong_answer_penalty: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Erreurs max Phase 6
                  </label>
                  <input
                    type="number"
                    value={settings.max_errors_phase6}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        max_errors_phase6: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* --- PARAMETRES PHASE 6 --- */}
<h2 className="text-xl font-bold text-gray-900 mt-8">
  Paramètres Phase 6 (Vrai/Faux)
</h2>

<div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Temps par question (secondes)
    </label>
    <input
      type="number"
      value={phase6Settings.time_per_question}
      onChange={(e) =>
        setPhase6Settings({
          ...phase6Settings,
          time_per_question: parseInt(e.target.value),
        })
      }
      className="w-full px-4 py-2 border rounded-lg"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Vies par équipe
    </label>
    <input
      type="number"
      value={phase6Settings.lives_per_team}
      onChange={(e) =>
        setPhase6Settings({
          ...phase6Settings,
          lives_per_team: parseInt(e.target.value),
        })
      }
      className="w-full px-4 py-2 border rounded-lg"
    />
  </div>

  <button
    onClick={async () => {
      await axios.put(`${API_URL}/phase6/settings`, phase6Settings);
      alert("Paramètres Phase 6 sauvegardés !");
    }}
    className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
  >
    <Save size={18} />
    Sauvegarder Paramètres Phase 6
  </button>
</div>

              <button
                onClick={saveSettings}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
              >
                <Save size={18} />
                Sauvegarder les Paramètres
              </button>
            </div>
          </div>
        )}

        {/* --- QUESTIONS BUZZ --- */}
        {activeTab === 'buzz' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Questions du Buzz
              </h2>
              <button
                onClick={() =>
                  setEditingBuzz({
                    question: '',
                    answer: '',
                  })
                }
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus size={18} /> Nouvelle Question
              </button>
            </div>

            {editingBuzz && (
              <div className="bg-white border rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingBuzz.index !== undefined
                    ? 'Modifier la Question'
                    : 'Nouvelle Question'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question
                    </label>
                    <input
                      type="text"
                      value={editingBuzz.question}
                      onChange={(e) =>
                        setEditingBuzz({
                          ...editingBuzz,
                          question: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="Ex: Quel scientifique a proposé la théorie de la relativité ?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Réponse
                    </label>
                    <input
                      type="text"
                      value={editingBuzz.answer}
                      onChange={(e) =>
                        setEditingBuzz({
                          ...editingBuzz,
                          answer: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="Ex: Albert Einstein"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!editingBuzz) return;
                        let newList = [...buzzQuestions];
                        if (editingBuzz.index !== undefined) {
                          newList[editingBuzz.index] = {
                            question: editingBuzz.question,
                            answer: editingBuzz.answer,
                          };
                        } else {
                          newList = [
                            ...buzzQuestions,
                            {
                              question: editingBuzz.question,
                              answer: editingBuzz.answer,
                            },
                          ];
                        }
                        saveBuzzList(newList);
                      }}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      <Save size={18} /> Sauvegarder
                    </button>
                    <button
                      onClick={() => setEditingBuzz(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4">
              {buzzQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="bg-white border rounded-xl p-5 shadow-sm flex justify-between items-start"
                >
                  <div>
                    <p className="text-gray-900 font-medium mb-1">
                      {q.question}
                    </p>
                    <p className="text-gray-600 text-sm">{q.answer}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setEditingBuzz({
                          ...q,
                          index: idx,
                        })
                      }
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (!confirm('Supprimer cette question ?')) return;
                        const newList = buzzQuestions.filter(
                          (_, i) => i !== idx
                        );
                        saveBuzzList(newList);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {activeTab === 'phase6' && (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold text-gray-900">
        Phase 6 — Questions Vrai/Faux
      </h2>

      <button
        onClick={() =>
          setEditingPhase6({
            question_text: '',
            correct_answer: 1,
            order_index: phase6Questions.length,
          })
        }
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        <Plus size={18} /> Nouvelle Question
      </button>
    </div>

    {editingPhase6 && (
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {editingPhase6.id ? 'Modifier la Question' : 'Nouvelle Question'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Texte</label>
            <input
              value={editingPhase6.question_text || ''}
              onChange={(e) =>
                setEditingPhase6({
                  ...editingPhase6,
                  question_text: e.target.value,
                })
              }
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Réponse</label>
            <select
              value={editingPhase6.correct_answer}
              onChange={(e) =>
                setEditingPhase6({
                  ...editingPhase6,
                  correct_answer: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value={1}>Vrai</option>
              <option value={0}>Faux</option>
            </select>
          </div>

          <button
            onClick={async () => {
              if (editingPhase6.id) {
                await axios.put(`${API_URL}/phase6/questions/${editingPhase6.id}`, editingPhase6);
              } else {
                await axios.post(`${API_URL}/phase6/questions`, editingPhase6);
              }
              setEditingPhase6(null);
              loadData();
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    )}

    <div className="space-y-3">
      {phase6Questions.map((q) => (
        <div
          key={q.id}
          className="flex justify-between items-center bg-gray-50 p-4 rounded-lg"
        >
          <div>
            <p className="font-medium">{q.question_text}</p>
            <p className="text-sm text-gray-600">
              Réponse : {q.correct_answer ? 'VRAI' : 'FAUX'}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setEditingPhase6(q)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Edit size={16} />
            </button>

            <button
              onClick={async () => {
                if (!confirm("Supprimer ?")) return;
                await axios.delete(`${API_URL}/phase6/questions/${q.id}`);
                loadData();
              }}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

      </div>
    </div>
  );
}

import axios from 'axios';

const RAW_API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_URL = RAW_API.replace(/\/+$/, '') + '/api';



const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Team {
  id: string;
  name: string;
  points: number;
  clue: string;
  members: string[];
  phase6_lives?: number;
  phase6_score?: number;
  phase6_eliminated?: number;
}

export interface ClueExchange {
  id: string;
  from_team_id: string;
  to_team_id: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface PhaseAnswer {
  id: string;
  team_id: string;
  phase: number;
  question_id?: string; // ✅ ajouté : identifiant de la question concernée
  answer: string;
  points_spent: number;
}


export interface Comment {
  id: string;
  team_id: string;
  comment: string;
  points_awarded: number;
}

export interface GameSession {
  status: string;
  current_phase: number;
  current_case_id?: string | null;   // ✅ ajoute cette ligne
}



export interface PriseEnCharge {
  id: string;
  team_id: string;
  content: string;
  points_awarded: number;
}

export const teamsApi = {
  getAll: () => api.get<Team[]>('/teams'),
  getById: (id: string) => api.get<Team>(`/teams/${id}`),
  join: (teamId: string, memberName: string) =>
    api.post<Team>(`/teams/${teamId}/join`, { memberName }),
  updatePoints: (teamId: string, points: number) =>
    api.post<Team>(`/teams/${teamId}/update-points`, { points }),
};

export const exchangesApi = {
  getAll: () => api.get<ClueExchange[]>('/exchanges'),
  create: (fromTeamId: string, toTeamId: string) =>
    api.post<ClueExchange>('/exchanges', { fromTeamId, toTeamId }),
  accept: (id: string) => api.post<ClueExchange>(`/exchanges/${id}/accept`),
  reject: (id: string) => api.post<ClueExchange>(`/exchanges/${id}/reject`),
};

export const cluesApi = {
  hack: (fromTeamId: string, targetTeamId: string) =>
    api.post('/clues/hack', { fromTeamId, targetTeamId }),
};

export const answersApi = {
  getAll: () => api.get<PhaseAnswer[]>('/answers'),
  create: (teamId: string, phase: number, answer: string, pointsSpent: number) =>
    api.post<PhaseAnswer>('/answers', { teamId, phase, answer, pointsSpent }),
};

export const commentsApi = {
  getAll: () => api.get<Comment[]>('/comments'),
  create: (teamId: string, comment: string) =>
    api.post<Comment>('/comments', { teamId, comment }),
  awardPoints: (id: string, points: number) =>
    api.post<Comment>(`/comments/${id}/award-points`, { points }),
};

export const sessionApi = {
  get: () => api.get<GameSession>('/session'),
  start: () => api.post<GameSession>('/session/start'),
  nextPhase: () => api.post<GameSession>('/session/next-phase'),
  reset: () => api.post<GameSession>('/session/reset'),
};

export const priseEnChargeApi = {
  getAll: () => api.get<PriseEnCharge[]>('/prise-en-charge'),
  create: (teamId: string, content: string) =>
    api.post<PriseEnCharge>('/prise-en-charge', { teamId, content }),
  awardPoints: (id: string, points: number) =>
    api.post<PriseEnCharge>(`/prise-en-charge/${id}/award-points`, { points }),
};

export const teamCluesApi = {
  // 🔍 Récupérer les indices d’un cas (pour l’admin)
  getForCase: (caseId: string) =>
    api.get(`/team-clues?case_id=${caseId}`),

  // 🔍 Récupérer les indices d’une équipe dans un cas
  getForTeam: (teamId: string, caseId: string) =>
    api.get(`/team-clues?team_id=${teamId}&case_id=${caseId}`),

  // ➕ Créer un indice
  create: (teamId: string | null, caseId: string, clueText: string, cost: number, piratable: boolean) =>
    api.post('/team-clues', {
      team_id: teamId,
      case_id: caseId,
      clue_text: clueText,
      clue_cost: cost,
      is_piratable: piratable ? 1 : 0,
    }),
};

// ===============================
// 📌 PHASE 5 – Diagnostic Final
// ===============================

export interface Phase5Response {
  id: string;
  team_id: string;
  response_text: string;
  created_at: string;
  updated_at?: string;
}

export const phase5Api = {
  getAll: () => api.get<Phase5Response[]>('/phase5'),
  submit: (teamId: string, response_text: string) =>
    api.post<Phase5Response>('/phase5', { teamId, response_text }),
};




export default api;

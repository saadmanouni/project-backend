export interface Team {
  id: string;
  name: string;
  points: number;
  clue: string;
  members: string[];
}

export interface ClueExchange {
  id: string;
  fromTeamId: string;
  toTeamId: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface PhaseAnswer {
  id: string;
  teamId: string;
  phase: number;
  answer: string;
  pointsSpent: number;
}

export interface Comment {
  id: string;
  teamId: string;
  comment: string;
  pointsAwarded: number;
}

export interface GameSession {
  status: 'lobby' | 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5' | 'phase6' | 'finished';
  currentPhase: number;
}

const STORAGE_KEYS = {
  TEAMS: 'doctor_game_teams',
  EXCHANGES: 'doctor_game_exchanges',
  ANSWERS: 'doctor_game_answers',
  COMMENTS: 'doctor_game_comments',
  SESSION: 'doctor_game_session',
};

export const localStorage_api = {
  getTeams: (): Team[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TEAMS);
    return data ? JSON.parse(data) : [];
  },

  setTeams: (teams: Team[]) => {
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
    window.dispatchEvent(new Event('storage'));
  },

  getExchanges: (): ClueExchange[] => {
    const data = localStorage.getItem(STORAGE_KEYS.EXCHANGES);
    return data ? JSON.parse(data) : [];
  },

  setExchanges: (exchanges: ClueExchange[]) => {
    localStorage.setItem(STORAGE_KEYS.EXCHANGES, JSON.stringify(exchanges));
    window.dispatchEvent(new Event('storage'));
  },

  getAnswers: (): PhaseAnswer[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ANSWERS);
    return data ? JSON.parse(data) : [];
  },

  setAnswers: (answers: PhaseAnswer[]) => {
    localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(answers));
    window.dispatchEvent(new Event('storage'));
  },

  getComments: (): Comment[] => {
    const data = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    return data ? JSON.parse(data) : [];
  },

  setComments: (comments: Comment[]) => {
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
    window.dispatchEvent(new Event('storage'));
  },

  getSession: (): GameSession => {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION);
    return data ? JSON.parse(data) : { status: 'lobby', currentPhase: 0 };
  },

  setSession: (session: GameSession) => {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    window.dispatchEvent(new Event('storage'));
  },

  resetGame: () => {
    localStorage.removeItem(STORAGE_KEYS.TEAMS);
    localStorage.removeItem(STORAGE_KEYS.EXCHANGES);
    localStorage.removeItem(STORAGE_KEYS.ANSWERS);
    localStorage.removeItem(STORAGE_KEYS.COMMENTS);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    window.dispatchEvent(new Event('storage'));
  },

  generateId: (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  },
};

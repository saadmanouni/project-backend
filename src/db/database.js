import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DATABASE_PATH || join(__dirname, '../../game.db');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

import { initializeGameData } from './init.js';

export async function initializeDatabase() {
  // Create tables first
  db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 100,
      clue TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id TEXT NOT NULL,
      member_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'player',
      clue TEXT DEFAULT '',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      clinical_description TEXT NOT NULL,
      attachments TEXT,
      clue TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS game_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      buy_answer_cost INTEGER NOT NULL DEFAULT 20,
      exchange_cost INTEGER NOT NULL DEFAULT 15,
      hack_cost INTEGER NOT NULL DEFAULT 20,
      correct_answer_reward INTEGER NOT NULL DEFAULT 10,
      wrong_answer_penalty INTEGER NOT NULL DEFAULT 5,
      clue TEXT DEFAULT '',
      max_errors_phase6 INTEGER NOT NULL DEFAULT 3
    );

    CREATE TABLE IF NOT EXISTS team_clues (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      case_id TEXT NOT NULL,
      clue_text TEXT NOT NULL,
      clue_cost INTEGER NOT NULL DEFAULT 10,
      is_piratable INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS clue_exchanges (
      id TEXT PRIMARY KEY,
      from_team_id TEXT NOT NULL,
      to_team_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (to_team_id) REFERENCES teams(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      phase INTEGER NOT NULL,
      clue TEXT DEFAULT '',
      question_text TEXT NOT NULL,
      expected_answer TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 10,
      category TEXT NOT NULL DEFAULT 'useful',
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS phase_answers (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      phase INTEGER NOT NULL,
      answer TEXT NOT NULL,
      points_spent INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS phase5_responses (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      case_id TEXT NOT NULL,
      clue TEXT DEFAULT '',
      response_text TEXT NOT NULL,
      grade INTEGER DEFAULT 0,
      feedback TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS phase6_questions (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      question_text TEXT NOT NULL,
      correct_answer INTEGER NOT NULL,
      clue TEXT DEFAULT '',
      points INTEGER NOT NULL DEFAULT 10,
      timer INTEGER NOT NULL DEFAULT 10,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS phase6_answers (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      answer INTEGER NOT NULL,
      clue TEXT DEFAULT '',
      is_correct INTEGER NOT NULL DEFAULT 0,
      wrong_count INTEGER NOT NULL DEFAULT 0,
      is_eliminated INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES phase6_questions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS phase7_submissions (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      case_id TEXT NOT NULL,
      submission_text TEXT NOT NULL,
      grade INTEGER DEFAULT 0,
      clue TEXT DEFAULT '',
      feedback TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      comment TEXT NOT NULL,
      clue TEXT DEFAULT '',
      points_awarded INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS game_session (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      status TEXT NOT NULL DEFAULT 'lobby',
      current_phase INTEGER NOT NULL DEFAULT 0,
      current_case_id TEXT,
      clue TEXT DEFAULT '',
      buzz_active INTEGER NOT NULL DEFAULT 0,
      buzz_current_question INTEGER,
      phase6_current_question INTEGER,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (current_case_id) REFERENCES cases(id)
    );

    CREATE TABLE IF NOT EXISTS game_settings (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      buy_answer_cost INTEGER NOT NULL DEFAULT 10,
      exchange_cost INTEGER NOT NULL DEFAULT 10,
      clue TEXT DEFAULT '',
      hack_cost INTEGER NOT NULL DEFAULT 20,
      correct_answer_reward INTEGER NOT NULL DEFAULT 5,
      wrong_answer_penalty INTEGER NOT NULL DEFAULT -2,
      max_errors_phase6 INTEGER NOT NULL DEFAULT 3,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS flash_questions (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      question TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      options TEXT NOT NULL,
      clue TEXT DEFAULT '',
      points INTEGER NOT NULL DEFAULT 10,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS flash_answers (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      answer TEXT NOT NULL,
      clue TEXT DEFAULT '',
      is_correct INTEGER NOT NULL DEFAULT 0,
      points_earned INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES flash_questions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS prise_en_charge (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      clue TEXT DEFAULT '',
      content TEXT NOT NULL,
      points_awarded INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS event_cards (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      trigger_phase INTEGER NOT NULL,
      question TEXT,
      clue TEXT DEFAULT '',
      answer TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );
  `);
  
  // Initialize game data after tables are created
  await initializeGameData();

  // Ensure default case and per-team clues are seeded
  seedDefaultCase();

  const sessionExists = db.prepare('SELECT COUNT(*) as count FROM game_session WHERE id = 1').get();
  if (sessionExists.count === 0) {
    db.prepare('INSERT INTO game_session (id, status, current_phase) VALUES (1, ?, ?)').run('lobby', 0);
  }

  const settingsExists = db.prepare('SELECT COUNT(*) as count FROM game_settings WHERE id = 1').get();
  if (settingsExists.count === 0) {
    db.prepare('INSERT INTO game_settings (id, buy_answer_cost, exchange_cost, hack_cost, correct_answer_reward, wrong_answer_penalty, max_errors_phase6) VALUES (1, 10, 10, 20, 5, -2, 3)').run();
  }

  console.log('Database initialized successfully');
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function seedDefaultTeams() {
  const teams = db.prepare('SELECT COUNT(*) as count FROM teams').get();
  if (teams.count === 0) {
    const teamNames = ['Équipe 1', 'Équipe 2', 'Équipe 3', 'Équipe 4'];
    const insertTeam = db.prepare('INSERT INTO teams (id, name, points) VALUES (?, ?, ?)');

    teamNames.forEach((name) => {
      const id = generateId();
      insertTeam.run(id, name, 100);
    });

    console.log('Default teams seeded successfully');
  }
}

export function seedDefaultCase() {
  const cases = db.prepare('SELECT COUNT(*) as count FROM cases').get();
  if (cases.count === 0) {
    const caseId = generateId();
    db.prepare('INSERT INTO cases (id, title, clinical_description) VALUES (?, ?, ?)').run(
      caseId,
      'Invagination intestinale aiguë',
      'Enfant de 2 ans présentant des douleurs abdominales aiguës, vomissements et rectorragies.'
    );

    const clues = [
      { text: "Enfant de 2 ans", cost: 0 },
      { text: "Vomissements répétés", cost: 10 },
      { text: "Rectorragies en gelée de groseille", cost: 10 },
      { text: "Douleurs abdominales paroxystiques", cost: 10 }
    ];

    const teams = db.prepare('SELECT id FROM teams ORDER BY name').all();
    const insertClue = db.prepare('INSERT INTO team_clues (id, team_id, case_id, clue_text, clue_cost, is_piratable) VALUES (?, ?, ?, ?, ?, ?)');

    teams.forEach((team, index) => {
      const clue = clues[index] || clues[0];
      insertClue.run(generateId(), team.id, caseId, clue.text, clue.cost, clue.cost > 0 ? 1 : 0);
    });

    console.log('Default case and clues seeded successfully');
  }
}

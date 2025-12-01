import { db } from './database.js';

export function setupInitialData() {

  // ✅ Table des paramètres du jeu
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      buy_answer_cost INTEGER NOT NULL DEFAULT 20,
      exchange_cost INTEGER NOT NULL DEFAULT 15,
      hack_cost INTEGER NOT NULL DEFAULT 20,
      correct_answer_reward INTEGER NOT NULL DEFAULT 10,
      wrong_answer_penalty INTEGER NOT NULL DEFAULT 5,
      max_errors_phase6 INTEGER NOT NULL DEFAULT 3
    );
  `);

  // ✅ Table des questions
  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      case_id TEXT,
      phase INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      expected_answer TEXT NOT NULL,
      points INTEGER DEFAULT 10,
      category TEXT DEFAULT 'useful',
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 🧩 Initialiser les settings s'ils n'existent pas
  const settings = db.prepare('SELECT * FROM game_settings WHERE id = 1').get();

  if (!settings) {
    db.prepare(`
      INSERT INTO game_settings (
        id, buy_answer_cost, exchange_cost, hack_cost,
        correct_answer_reward, wrong_answer_penalty, max_errors_phase6
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(1, 20, 15, 20, 10, 5, 3);
  }

  // 🧩 Initialiser les équipes si elles n'existent pas
  const teams = db.prepare('SELECT * FROM teams').all();

  if (teams.length === 0) {
    const stmt = db.prepare('INSERT INTO teams (id, name, points) VALUES (?, ?, ?)');
    for (let i = 1; i <= 4; i++) {
      stmt.run(String(i), `Équipe ${i}`, 100);
    }
  }

  // 🧩 Ajouter quelques questions de test (phase 2)
  const questions = db.prepare('SELECT * FROM questions').all();

  if (questions.length === 0) {
    const insert = db.prepare(`
      INSERT INTO questions (id, case_id, phase, question_text, expected_answer, points, category)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      'q1', null, 2,
      "Quels sont les symptômes typiques d’un infarctus du myocarde ?",
      "Douleur thoracique intense, essoufflement, nausées, sueurs froides",
      20, "useful"
    );

    insert.run(
      'q2', null, 2,
      "Quelle est l’importance de l’électrocardiogramme dans ce cas ?",
      "L’ECG permet de détecter l’élévation du segment ST, signe d’infarctus aigu",
      25, "useful"
    );

    insert.run(
      'q3', null, 2,
      "Pourquoi mesure-t-on la troponine ?",
      "La troponine est un marqueur de lésion myocardique, élevé en cas d’infarctus",
      30, "useful"
    );
  }
}

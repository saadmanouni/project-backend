import { db } from './database.js';

export function setupInitialData() {
  // Create settings table if it doesn't exist
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

  // Initialize settings if not exists
  const settings = db.prepare('SELECT * FROM game_settings WHERE id = 1').get();
  if (!settings) {
    db.prepare(`
      INSERT INTO game_settings (
        id, buy_answer_cost, exchange_cost, hack_cost,
        correct_answer_reward, wrong_answer_penalty, max_errors_phase6
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(1, 20, 15, 20, 10, 5, 3);
  }

  // Initialize teams if they don't exist
  const teams = db.prepare('SELECT * FROM teams').all();
  if (teams.length === 0) {
    const stmt = db.prepare('INSERT INTO teams (id, name, points) VALUES (?, ?, ?)');
    for (let i = 1; i <= 4; i++) {
      stmt.run(String(i), `Équipe ${i}`, 100);
    }
  }
}
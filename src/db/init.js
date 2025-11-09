import { db } from './database.js';

export async function initializeGameData() {
  // Create settings
  try {
    const settings = db.prepare('SELECT * FROM game_settings WHERE id = 1').get();
    if (!settings) {
      db.prepare(`
        INSERT INTO game_settings (
          id, buy_answer_cost, exchange_cost, hack_cost,
          correct_answer_reward, wrong_answer_penalty, max_errors_phase6
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(1, 20, 15, 20, 10, 5, 3);
    }
  } catch (error) {
    console.error('Error initializing settings:', error);
  }

  // Create teams
  try {
    const teams = db.prepare('SELECT * FROM teams').all();
    if (teams.length === 0) {
      const stmt = db.prepare('INSERT INTO teams (id, name, points) VALUES (?, ?, ?)');
      for (let i = 1; i <= 4; i++) {
        stmt.run(String(i), `Équipe ${i}`, 100);
      }
    }
  } catch (error) {
    console.error('Error initializing teams:', error);
  }
}
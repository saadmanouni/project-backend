import express from 'express';
import { db } from '../db/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM game_settings WHERE id = 1').get();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/', (req, res) => {
  const {
    buy_answer_cost,
    exchange_cost,
    hack_cost,
    correct_answer_reward,
    wrong_answer_penalty,
    max_errors_phase6
  } = req.body;

  try {
    db.prepare(`
      UPDATE game_settings
      SET buy_answer_cost = ?,
          exchange_cost = ?,
          hack_cost = ?,
          correct_answer_reward = ?,
          wrong_answer_penalty = ?,
          max_errors_phase6 = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(
      buy_answer_cost,
      exchange_cost,
      hack_cost,
      correct_answer_reward,
      wrong_answer_penalty,
      max_errors_phase6
    );

    const settings = db.prepare('SELECT * FROM game_settings WHERE id = 1').get();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

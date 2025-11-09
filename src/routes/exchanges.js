import express from 'express';
import { db, generateId } from '../db/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const exchanges = db.prepare('SELECT * FROM clue_exchanges ORDER BY created_at DESC').all();
    res.json(exchanges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  const { fromTeamId, toTeamId } = req.body;

  if (!fromTeamId || !toTeamId) {
    return res.status(400).json({ error: 'fromTeamId and toTeamId are required' });
  }

  if (fromTeamId === toTeamId) {
    return res.status(400).json({ error: 'Cannot exchange with the same team' });
  }

  try {
    const settings = db.prepare('SELECT exchange_cost FROM game_settings WHERE id = 1').get();
    const exchangeCost = settings ? settings.exchange_cost : 10;

    const fromTeam = db.prepare('SELECT points FROM teams WHERE id = ?').get(fromTeamId);
    if (!fromTeam) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (fromTeam.points < exchangeCost) {
      return res.status(400).json({ error: 'Insufficient points for exchange' });
    }

    const id = generateId();
    db.prepare('INSERT INTO clue_exchanges (id, from_team_id, to_team_id, status) VALUES (?, ?, ?, ?)').run(id, fromTeamId, toTeamId, 'pending');

    const exchange = db.prepare('SELECT * FROM clue_exchanges WHERE id = ?').get(id);
    res.json(exchange);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/accept', (req, res) => {
  const { id } = req.params;

  try {
    const exchange = db.prepare('SELECT * FROM clue_exchanges WHERE id = ?').get(id);
    if (!exchange) {
      return res.status(404).json({ error: 'Exchange not found' });
    }

    if (exchange.status !== 'pending') {
      return res.status(400).json({ error: 'Exchange is not pending' });
    }

    const settings = db.prepare('SELECT exchange_cost FROM game_settings WHERE id = 1').get();
    const exchangeCost = settings ? settings.exchange_cost : 10;

    const fromTeam = db.prepare('SELECT points FROM teams WHERE id = ?').get(exchange.from_team_id);
    const toTeam = db.prepare('SELECT points FROM teams WHERE id = ?').get(exchange.to_team_id);

    if (!fromTeam || !toTeam) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (fromTeam.points < exchangeCost) {
      return res.status(400).json({ error: 'Insufficient points' });
    }

    db.prepare('UPDATE teams SET points = points - ? WHERE id = ?').run(exchangeCost, exchange.from_team_id);
    db.prepare('UPDATE clue_exchanges SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('accepted', id);

    const updatedExchange = db.prepare('SELECT * FROM clue_exchanges WHERE id = ?').get(id);
    res.json(updatedExchange);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/reject', (req, res) => {
  const { id } = req.params;

  try {
    const exchange = db.prepare('SELECT * FROM clue_exchanges WHERE id = ?').get(id);
    if (!exchange) {
      return res.status(404).json({ error: 'Exchange not found' });
    }

    if (exchange.status !== 'pending') {
      return res.status(400).json({ error: 'Exchange is not pending' });
    }

    db.prepare('UPDATE clue_exchanges SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('rejected', id);

    const updatedExchange = db.prepare('SELECT * FROM clue_exchanges WHERE id = ?').get(id);
    res.json(updatedExchange);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

import express from 'express';
import { db } from '../db/database.js';

const router = express.Router();

router.post('/hack', (req, res) => {
  const { fromTeamId, targetTeamId } = req.body;

  if (!fromTeamId || !targetTeamId) {
    return res.status(400).json({ error: 'fromTeamId and targetTeamId are required' });
  }

  if (fromTeamId === targetTeamId) {
    return res.status(400).json({ error: 'Cannot hack your own team' });
  }

  try {
    const settings = db.prepare('SELECT hack_cost FROM game_settings WHERE id = 1').get();
    const hackCost = settings ? settings.hack_cost : 20;

    const fromTeam = db.prepare('SELECT points FROM teams WHERE id = ?').get(fromTeamId);
    if (!fromTeam) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (fromTeam.points < hackCost) {
      return res.status(400).json({ error: 'Insufficient points to hack' });
    }

    db.prepare('UPDATE teams SET points = points - ? WHERE id = ?').run(hackCost, fromTeamId);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

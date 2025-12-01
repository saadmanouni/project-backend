import express from 'express';
import { db, generateId } from '../db/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const prises = db.prepare('SELECT * FROM prise_en_charge ORDER BY created_at DESC').all();
    res.json(prises);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  const { teamId, content } = req.body;

  if (!teamId || !content || !content.trim()) {
    return res.status(400).json({ error: 'teamId and content are required' });
  }

  try {
    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const existing = db.prepare('SELECT * FROM prise_en_charge WHERE team_id = ?').get(teamId);
    if (existing) {
      db.prepare('UPDATE prise_en_charge SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE team_id = ?').run(content.trim(), teamId);
      const updated = db.prepare('SELECT * FROM prise_en_charge WHERE team_id = ?').get(teamId);
      return res.json(updated);
    }

    const id = generateId();
    db.prepare('INSERT INTO prise_en_charge (id, team_id, content, points_awarded) VALUES (?, ?, ?, ?)').run(id, teamId, content.trim(), 0);

    const newPrise = db.prepare('SELECT * FROM prise_en_charge WHERE id = ?').get(id);
    res.json(newPrise);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/award-points', (req, res) => {
  const { points } = req.body;
  const { id } = req.params;

  if (typeof points !== 'number') {
    return res.status(400).json({ error: 'Points must be a number' });
  }

  try {
    const prise = db.prepare('SELECT * FROM prise_en_charge WHERE id = ?').get(id);
    if (!prise) {
      return res.status(404).json({ error: 'Prise en charge not found' });
    }

    db.prepare('UPDATE prise_en_charge SET points_awarded = points_awarded + ? WHERE id = ?').run(points, id);
    db.prepare('UPDATE teams SET points = points + ? WHERE id = ?').run(points, prise.team_id);

    const updated = db.prepare('SELECT * FROM prise_en_charge WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

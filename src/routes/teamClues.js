import express from 'express';
import { db, generateId } from '../db/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { team_id, case_id } = req.query;
    let query = 'SELECT * FROM team_clues WHERE 1=1';
    const params = [];

    if (team_id) {
      query += ' AND team_id = ?';
      params.push(team_id);
    }

    if (case_id) {
      query += ' AND case_id = ?';
      params.push(case_id);
    }

    query += ' ORDER BY team_id, created_at';
    const clues = db.prepare(query).all(...params);
    res.json(clues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  const { team_id, case_id, clue_text, clue_cost, is_piratable } = req.body;

  if (!team_id || !case_id || !clue_text) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const id = generateId();
    db.prepare(`
      INSERT INTO team_clues (id, team_id, case_id, clue_text, clue_cost, is_piratable)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, team_id, case_id, clue_text, clue_cost || 10, is_piratable || 0);

    const clue = db.prepare('SELECT * FROM team_clues WHERE id = ?').get(id);
    res.json(clue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { clue_text, clue_cost, is_piratable } = req.body;

  try {
    db.prepare(`
      UPDATE team_clues
      SET clue_text = COALESCE(?, clue_text),
          clue_cost = COALESCE(?, clue_cost),
          is_piratable = COALESCE(?, is_piratable)
      WHERE id = ?
    `).run(clue_text, clue_cost, is_piratable, id);

    const clue = db.prepare('SELECT * FROM team_clues WHERE id = ?').get(id);
    res.json(clue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;

  try {
    db.prepare('DELETE FROM team_clues WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

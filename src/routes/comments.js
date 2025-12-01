import express from 'express';
import { db, generateId } from '../db/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const comments = db.prepare('SELECT * FROM comments ORDER BY created_at DESC').all();
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  const { teamId, comment } = req.body;

  if (!teamId || !comment || !comment.trim()) {
    return res.status(400).json({ error: 'teamId and comment are required' });
  }

  try {
    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const existingComment = db.prepare('SELECT * FROM comments WHERE team_id = ?').get(teamId);
    if (existingComment) {
      db.prepare('UPDATE comments SET comment = ?, updated_at = CURRENT_TIMESTAMP WHERE team_id = ?').run(comment.trim(), teamId);
      const updatedComment = db.prepare('SELECT * FROM comments WHERE team_id = ?').get(teamId);
      return res.json(updatedComment);
    }

    const id = generateId();
    db.prepare('INSERT INTO comments (id, team_id, comment, points_awarded) VALUES (?, ?, ?, ?)').run(id, teamId, comment.trim(), 0);

    const newComment = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
    res.json(newComment);
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
    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    db.prepare('UPDATE comments SET points_awarded = points_awarded + ? WHERE id = ?').run(points, id);
    db.prepare('UPDATE teams SET points = points + ? WHERE id = ?').run(points, comment.team_id);

    const updatedComment = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
    res.json(updatedComment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

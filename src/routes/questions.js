import express from 'express';
import { db, generateId } from '../db/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { case_id, phase } = req.query;
    let query = 'SELECT * FROM questions WHERE 1=1';
    const params = [];

    if (case_id) {
      query += ' AND case_id = ?';
      params.push(case_id);
    }

    if (phase) {
      query += ' AND phase = ?';
      params.push(parseInt(phase));
    }

    query += ' ORDER BY phase, created_at';
    const questions = db.prepare(query).all(...params);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  const { case_id, phase, question_text, expected_answer, points, category, comment } = req.body;

  if (!case_id || !phase || !question_text || !expected_answer) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const id = generateId();
    db.prepare(`
      INSERT INTO questions (id, case_id, phase, question_text, expected_answer, points, category, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, case_id, phase, question_text, expected_answer, points || 10, category || 'useful', comment || null);

    const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(id);
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { question_text, expected_answer, points, category, comment } = req.body;

  try {
    db.prepare(`
      UPDATE questions
      SET question_text = COALESCE(?, question_text),
          expected_answer = COALESCE(?, expected_answer),
          points = COALESCE(?, points),
          category = COALESCE(?, category),
          comment = COALESCE(?, comment)
      WHERE id = ?
    `).run(question_text, expected_answer, points, category, comment, id);

    const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(id);
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;

  try {
    db.prepare('DELETE FROM questions WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

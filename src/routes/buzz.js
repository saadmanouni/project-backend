import express from 'express';
import { db, generateId } from '../db/database.js';

const router = express.Router();

router.get('/questions', (req, res) => {
  try {
    const { case_id } = req.query;
    let query = 'SELECT * FROM flash_questions';
    const params = [];

    if (case_id) {
      query += ' WHERE case_id = ?';
      params.push(case_id);
    }

    query += ' ORDER BY created_at';
    const questions = db.prepare(query).all(...params);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/questions', (req, res) => {
  const { case_id, question, correct_answer, options, points } = req.body;

  if (!case_id || !question || !correct_answer || !options) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const id = generateId();
    const optionsStr = typeof options === 'string' ? options : JSON.stringify(options);

    db.prepare(`
      INSERT INTO flash_questions (id, case_id, question, correct_answer, options, points)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, case_id, question, correct_answer, optionsStr, points || 10);

    const flashQuestion = db.prepare('SELECT * FROM flash_questions WHERE id = ?').get(id);
    res.json(flashQuestion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/answer', (req, res) => {
  const { team_id, question_id, answer } = req.body;

  if (!team_id || !question_id || !answer) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const question = db.prepare('SELECT * FROM flash_questions WHERE id = ?').get(question_id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const isCorrect = answer === question.correct_answer ? 1 : 0;
    const pointsEarned = isCorrect ? question.points : -5;

    const id = generateId();
    db.prepare(`
      INSERT INTO flash_answers (id, team_id, question_id, answer, is_correct, points_earned)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, team_id, question_id, answer, isCorrect, pointsEarned);

    db.prepare('UPDATE teams SET points = points + ? WHERE id = ?').run(pointsEarned, team_id);

    const result = {
      id,
      is_correct: isCorrect,
      points_earned: pointsEarned,
      correct_answer: question.correct_answer
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/answers', (req, res) => {
  try {
    const { team_id } = req.query;
    let query = 'SELECT * FROM flash_answers';
    const params = [];

    if (team_id) {
      query += ' WHERE team_id = ?';
      params.push(team_id);
    }

    query += ' ORDER BY created_at';
    const answers = db.prepare(query).all(...params);
    res.json(answers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

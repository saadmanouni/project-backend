import express from 'express';
import { db, generateId } from '../db/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { team_id, phase } = req.query;

    let query =
      'SELECT pa.*, q.question_text, q.expected_answer FROM phase_answers pa LEFT JOIN questions q ON pa.question_id = q.id WHERE 1=1';
    const params = [];

    if (team_id) {
      query += ' AND pa.team_id = ?';
      params.push(team_id);
    }

    if (phase) {
      query += ' AND pa.phase = ?';
      params.push(parseInt(phase));
    }

    query += ' ORDER BY pa.created_at DESC';
    const answers = db.prepare(query).all(...params);

    res.json(answers);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  const { teamId, questionId, phase, answer, pointsSpent } = req.body;

  if (!teamId || !questionId || !phase) {
    return res
      .status(400)
      .json({ error: 'teamId, questionId, and phase are required' });
  }

  try {
    const team = db
      .prepare('SELECT * FROM teams WHERE id = ?')
      .get(teamId);

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const question = db
      .prepare('SELECT * FROM questions WHERE id = ?')
      .get(questionId);

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const existingAnswer = db
      .prepare('SELECT * FROM phase_answers WHERE team_id = ? AND question_id = ?')
      .get(teamId, questionId);

    if (existingAnswer) {
      return res
        .status(400)
        .json({ error: 'Answer already purchased for this question' });
    }

    if (pointsSpent > 0 && team.points < pointsSpent) {
      return res.status(400).json({ error: 'Insufficient points' });
    }

    const id = generateId();

    db.prepare(
      'INSERT INTO phase_answers (id, team_id, question_id, phase, answer, points_spent) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(
      id,
      teamId,
      questionId,
      phase,
      answer || question.expected_answer,
      pointsSpent || 0
    );

    if (pointsSpent > 0) {
      db.prepare('UPDATE teams SET points = points - ? WHERE id = ?')
        .run(pointsSpent, teamId);
    }

    const newAnswer = db
      .prepare(
        'SELECT pa.*, q.question_text, q.expected_answer FROM phase_answers pa LEFT JOIN questions q ON pa.question_id = q.id WHERE pa.id = ?'
      )
      .get(id);

    res.json(newAnswer);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

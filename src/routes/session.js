import express from 'express';
import { db, generateId } from '../db/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const session = db.prepare('SELECT * FROM game_session WHERE id = 1').get();
    res.json(session || { status: 'lobby', current_phase: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/start', (req, res) => {
  try {
    db.prepare('UPDATE game_session SET status = ?, current_phase = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1').run('phase1', 1);
    const session = db.prepare('SELECT * FROM game_session WHERE id = 1').get();
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/next-phase', (req, res) => {
  try {
    const session = db.prepare('SELECT * FROM game_session WHERE id = 1').get();
    const nextPhase = session.current_phase + 1;
    let status = `phase${nextPhase}`;

    if (nextPhase > 7) {
      status = 'finished';
    }

    db.prepare('UPDATE game_session SET status = ?, current_phase = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1').run(status, nextPhase);
    const updatedSession = db.prepare('SELECT * FROM game_session WHERE id = 1').get();
    res.json(updatedSession);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reset', (req, res) => {
  try {
    db.exec(`
      DELETE FROM team_members;
      DELETE FROM clue_exchanges;
      DELETE FROM phase_answers;
      DELETE FROM comments;
      DELETE FROM flash_answers;
      DELETE FROM prise_en_charge;
      DELETE FROM team_clues;
      DELETE FROM teams;
      UPDATE game_session SET status = 'lobby', current_phase = 0, updated_at = CURRENT_TIMESTAMP WHERE id = 1;
    `);

    const clues = [
      "Femme de 28 ans",
      "Douleurs abdominales depuis 2 semaines",
      "Fièvre intermittente à 38.5°C",
      "Antécédents: appendicectomie il y a 3 ans"
    ];

    const teamNames = ['Équipe 1', 'Équipe 2', 'Équipe 3', 'Équipe 4'];
    const insertTeam = db.prepare('INSERT INTO teams (id, name, points) VALUES (?, ?, ?)');

    // ensure there is at least one case to attach initial clues to
    let defaultCase = db.prepare('SELECT id FROM cases LIMIT 1').get();
    let caseId;
    if (defaultCase && defaultCase.id) {
      caseId = defaultCase.id;
    } else {
      caseId = generateId();
      db.prepare('INSERT INTO cases (id, title, clinical_description) VALUES (?, ?, ?)').run(
        caseId,
        'Cas par défaut',
        'Cas initial créé automatiquement.'
      );
    }

    const insertClue = db.prepare('INSERT INTO team_clues (id, team_id, case_id, clue_text, clue_cost, is_piratable) VALUES (?, ?, ?, ?, ?, ?)');

    teamNames.forEach((name, index) => {
      const id = generateId();
      insertTeam.run(id, name, 100);
      insertClue.run(generateId(), id, caseId, clues[index], 0, 0);
    });

    const session = db.prepare('SELECT * FROM game_session WHERE id = 1').get();
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

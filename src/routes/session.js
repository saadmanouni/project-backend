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
    // 1️⃣ On récupère le case_id envoyé par l'admin
    const { case_id } = req.body;

    // 2️⃣ On récupère la session actuelle
    const session = db
      .prepare('SELECT * FROM game_session WHERE id = 1')
      .get();

    // 3️⃣ On détermine quel case_id utiliser
    const selectedCaseId = case_id || session.current_case_id;

    if (!selectedCaseId) {
      return res.status(400).json({
        error: "Aucun cas sélectionné. Impossible de démarrer le jeu."
      });
    }

    // 4️⃣ Mise à jour de la session avec current_case_id
    db.prepare(`
      UPDATE game_session 
      SET 
        status = 'phase1', 
        current_phase = 1,
        current_case_id = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(selectedCaseId);

    const updatedSession = db
      .prepare('SELECT * FROM game_session WHERE id = 1')
      .get();

    res.json(updatedSession);

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

      UPDATE teams SET points = 100;

      UPDATE game_session SET 
        status = 'lobby',
        current_phase = 0,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1;
    `);

    const session = db
      .prepare('SELECT * FROM game_session WHERE id = 1')
      .get();

    res.json(session);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




export default router;

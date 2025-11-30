import express from 'express';
import { db, generateId } from '../db/database.js';

const router = express.Router();


/* ----------------------------------------------------------
   GET /cases/selected → Retourne le cas actuellement actif
-----------------------------------------------------------*/
router.get('/selected', (req, res) => {
  try {
    const session = db.prepare(`
      SELECT current_case_id 
      FROM game_session 
      WHERE id = 1
    `).get();

    if (!session || !session.current_case_id) {
      return res.json(null);
    }

    const caseData = db.prepare(`
      SELECT * FROM cases WHERE id = ?
    `).get(session.current_case_id);

    res.json(caseData);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/* ---------------------------
   GET : Liste des cas
---------------------------- */
router.get('/', (req, res) => {
  try {
    const cases = db.prepare(`
      SELECT id, title, clinical_description, attachments, clue, created_at, updated_at
      FROM cases
      ORDER BY created_at DESC
    `).all();

    res.json(cases);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------------------------
   GET : Cas par ID
---------------------------- */
router.get('/:id', (req, res) => {
  try {
    const caseData = db.prepare(`
      SELECT id, title, clinical_description, attachments, clue, created_at, updated_at
      FROM cases
      WHERE id = ?
    `).get(req.params.id);

    if (!caseData) {
      return res.status(404).json({ error: 'Cas introuvable' });
    }

    res.json(caseData);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------------------------
   POST : Créer un cas
---------------------------- */
router.post('/', (req, res) => {
  const { title, clinical_description, attachments } = req.body;

  if (!title || !clinical_description) {
    return res.status(400).json({
      error: 'title et clinical_description sont obligatoires'
    });
  }

  try {
    const id = generateId();

    db.prepare(`
      INSERT INTO cases (id, title, clinical_description, attachments)
      VALUES (?, ?, ?, ?)
    `).run(id, title, clinical_description, attachments || null);

    const newCase = db.prepare(`
      SELECT id, title, clinical_description, attachments, clue, created_at
      FROM cases
      WHERE id = ?
    `).get(id);

    res.json(newCase);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------------------------
   PUT : Modifier un cas
---------------------------- */
router.put('/:id', (req, res) => {
  const { title, clinical_description, attachments } = req.body;

  try {
    db.prepare(`
      UPDATE cases
      SET
        title = COALESCE(?, title),
        clinical_description = COALESCE(?, clinical_description),
        attachments = COALESCE(?, attachments),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, clinical_description, attachments, req.params.id);

    const updated = db.prepare(`
      SELECT id, title, clinical_description, attachments, clue, updated_at
      FROM cases
      WHERE id = ?
    `).get(req.params.id);

    res.json(updated);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------------------------
   DELETE : supprimer
---------------------------- */
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM cases WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post('/admin/set-case', (req, res) => {
  const { case_id } = req.body;

  if (!case_id) {
    return res.status(400).json({ error: 'case_id manquant' });
  }

  try {
    // Vérifier que le cas existe
    const exists = db.prepare('SELECT id FROM cases WHERE id = ?').get(case_id);
    if (!exists) {
      return res.status(404).json({ error: 'Cas introuvable.' });
    }

    // Mettre à jour la session du jeu
    db.prepare(`
      UPDATE game_session
      SET current_case_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(case_id);

    return res.json({ success: true });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});





export default router;
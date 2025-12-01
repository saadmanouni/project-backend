import express from 'express';
import { db, generateId } from '../db/database.js';

const router = express.Router();

/* ----------------------------------------------------------
   GET /team-clues  →  Retourne les indices filtrés
-----------------------------------------------------------*/
router.get('/', (req, res) => {
  try {
    const { team_id, case_id } = req.query;

    let query = `
      SELECT id, team_id, case_id, clue_text, clue_cost, 
             is_piratable, clue_order, created_at
      FROM team_clues 
      WHERE 1=1
    `;
    const params = [];

    if (team_id) {
      query += ' AND team_id = ?';
      params.push(team_id);
    }

    if (case_id) {
      query += ' AND case_id = ?';
      params.push(case_id);
    }

    // IMPORTANT : tri correct
    query += ' ORDER BY clue_order ASC, created_at ASC';

    const clues = db.prepare(query).all(...params);
    res.json(clues);

  } catch (error) {
    console.error('❌ GET /team-clues :', error);
    res.status(500).json({ error: error.message });
  }
});

/* ----------------------------------------------------------
   POST /team-clues  → Créer un indice
-----------------------------------------------------------*/
router.post('/', (req, res) => {
  try {
    const { team_id, case_id, clue_text, clue_cost, is_piratable, clue_order } = req.body;

    if (!clue_text) {
      return res.status(400).json({ error: 'clue_text est obligatoire.' });
    }

    const id = generateId();

    db.prepare(`
      INSERT INTO team_clues (
        id, team_id, case_id, clue_text, clue_cost, 
        is_piratable, clue_order, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      id,
      team_id || null,
      case_id || null,
      clue_text,
      clue_cost ?? 10,
      is_piratable ? 1 : 0,
      clue_order ?? 0
    );

    const newClue = db.prepare(`SELECT * FROM team_clues WHERE id = ?`).get(id);
    res.json(newClue);

  } catch (error) {
    console.error('❌ POST /team-clues :', error);
    res.status(500).json({ error: error.message });
  }
});

/* ----------------------------------------------------------
   PUT /team-clues/:id  → Modifier un indice
-----------------------------------------------------------*/
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const existing = db.prepare(`
      SELECT * FROM team_clues WHERE id = ?
    `).get(id);

    if (!existing) {
      return res.status(404).json({ error: 'Indice introuvable.' });
    }

    const {
      team_id,
      case_id,
      clue_text,
      clue_cost,
      is_piratable,
      clue_order
    } = req.body;

    db.prepare(`
      UPDATE team_clues SET
        team_id = ?,
        case_id = ?,
        clue_text = ?,
        clue_cost = ?,
        is_piratable = ?,
        clue_order = ?
      WHERE id = ?
    `).run(
      team_id ?? existing.team_id,
      case_id ?? existing.case_id,
      clue_text ?? existing.clue_text,
      clue_cost ?? existing.clue_cost,
      is_piratable ?? existing.is_piratable,
      clue_order ?? existing.clue_order,
      id
    );

    const updated = db.prepare('SELECT * FROM team_clues WHERE id = ?').get(id);
    res.json(updated);

  } catch (error) {
    console.error('❌ PUT /team-clues/:id :', error);
    res.status(500).json({ error: error.message });
  }
});

/* ----------------------------------------------------------
  DELETE /team-clues/:id → Supprimer un indice
-----------------------------------------------------------*/
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM team_clues WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ DELETE /team-clues :', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

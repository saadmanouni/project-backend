import express from 'express';
import { db, generateId } from '../db/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const cases = db.prepare('SELECT * FROM cases ORDER BY created_at DESC').all();
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  const { id } = req.params;

  try {
    const caseData = db.prepare('SELECT * FROM cases WHERE id = ?').get(id);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }
    res.json(caseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  const { title, clinical_description, attachments } = req.body;

  if (!title || !clinical_description) {
    return res.status(400).json({ error: 'Title and clinical description are required' });
  }

  try {
    const id = generateId();
    db.prepare(`
      INSERT INTO cases (id, title, clinical_description, attachments)
      VALUES (?, ?, ?, ?)
    `).run(id, title, clinical_description, attachments || null);

    const caseData = db.prepare('SELECT * FROM cases WHERE id = ?').get(id);
    res.json(caseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, clinical_description, attachments } = req.body;

  try {
    db.prepare(`
      UPDATE cases
      SET title = COALESCE(?, title),
          clinical_description = COALESCE(?, clinical_description),
          attachments = COALESCE(?, attachments),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, clinical_description, attachments, id);

    const caseData = db.prepare('SELECT * FROM cases WHERE id = ?').get(id);
    res.json(caseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;

  try {
    db.prepare('DELETE FROM cases WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

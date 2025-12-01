import express from "express";
import { db, generateId } from "../db/database.js";

const router = express.Router();

// 🧠 Middleware de vérification admin (pour ajouter/modifier/supprimer)
function verifyAdmin(req, res, next) {
  const adminKey = process.env.ADMIN_KEY;
  const isLocal = req.hostname === "localhost" || req.hostname === "127.0.0.1";
  if (!adminKey || isLocal) return next();
  if (req.headers["x-admin-key"] !== adminKey) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  next();
}

// 🔹 Récupérer toutes les questions (optionnellement par case_id et phase)
router.get("/", (req, res) => {
  try {
    const { case_id, phase } = req.query;
    let query = "SELECT * FROM questions WHERE 1=1";
    const params = [];

   if (case_id && case_id !== "null") {
  // Afficher aussi les questions générales (case_id NULL)
  query += " AND (case_id = ? OR case_id IS NULL)";
  params.push(case_id);
}

    if (phase) {
      query += " AND phase = ?";
      params.push(parseInt(phase));
    }

    query += " ORDER BY phase, created_at";
    const questions = db.prepare(query).all(...params);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Ajouter une question (admin uniquement)
router.post("/", verifyAdmin, (req, res) => {
  const {
    case_id,
    phase,
    question_text,
    expected_answer,
    points,
    category,
    comment,
  } = req.body;

  if (!case_id || !phase || !question_text || !expected_answer) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const id = generateId();
    db.prepare(
      `
      INSERT INTO questions (id, case_id, phase, question_text, expected_answer, points, category, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      id,
      case_id,
      phase,
      question_text,
      expected_answer,
      points || 10,
      category || "useful",
      comment || null
    );

    const question = db
      .prepare("SELECT * FROM questions WHERE id = ?")
      .get(id);
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Modifier une question (admin uniquement)
router.put("/:id", verifyAdmin, (req, res) => {
  const { id } = req.params;
  const { question_text, expected_answer, points, category, comment } =
    req.body;

  try {
    db.prepare(
      `
      UPDATE questions
      SET question_text = COALESCE(?, question_text),
          expected_answer = COALESCE(?, expected_answer),
          points = COALESCE(?, points),
          category = COALESCE(?, category),
          comment = COALESCE(?, comment)
      WHERE id = ?
    `
    ).run(question_text, expected_answer, points, category, comment, id);

    const question = db
      .prepare("SELECT * FROM questions WHERE id = ?")
      .get(id);
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Supprimer une question (admin uniquement)
router.delete("/:id", verifyAdmin, (req, res) => {
  const { id } = req.params;

  try {
    db.prepare("DELETE FROM questions WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✏️ Modifier une question (texte, points ou réponse)
router.put("/:id", verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { question_text, expected_answer, points } = req.body;

    const result = db.prepare(`
      UPDATE questions
      SET 
        question_text = COALESCE(?, question_text),
        expected_answer = COALESCE(?, expected_answer),
        points = COALESCE(?, points),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(question_text, expected_answer, points, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Question non trouvée" });
    }

    const updated = db.prepare("SELECT * FROM questions WHERE id = ?").get(id);
    res.json(updated);
  } catch (error) {
    console.error("Erreur PUT /questions:", error);
    res.status(500).json({ error: error.message });
  }
});


export default router;

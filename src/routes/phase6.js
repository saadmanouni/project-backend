// src/routes/phase6.js
import express from "express";
import { db, generateId } from "../db/database.js";

const router = express.Router();

/* ---------- PHASE 6 : QUESTIONS VRAI/FAUX ---------- */

// GET toutes les questions
router.get("/questions", (req, res) => {
  const rows = db
    .prepare(
      "SELECT * FROM phase6_questions ORDER BY order_index ASC, created_at ASC"
    )
    .all();
  res.json(rows);
});

// POST nouvelle question
router.post("/questions", (req, res) => {
  const { question_text, correct_answer, order_index } = req.body;

  if (!question_text || correct_answer === undefined) {
    return res
      .status(400)
      .json({ error: "question_text et correct_answer sont obligatoires" });
  }

  const id = generateId();
  db.prepare(
    `INSERT INTO phase6_questions (id, question_text, correct_answer, order_index)
     VALUES (?, ?, ?, ?)`
  ).run(id, question_text, correct_answer ? 1 : 0, order_index ?? 0);

  const row = db
    .prepare("SELECT * FROM phase6_questions WHERE id = ?")
    .get(id);
  res.status(201).json(row);
});

// PUT mise à jour question
router.put("/questions/:id", (req, res) => {
  const { id } = req.params;
  const { question_text, correct_answer, order_index } = req.body;

  const existing = db
    .prepare("SELECT * FROM phase6_questions WHERE id = ?")
    .get(id);
  if (!existing) {
    return res.status(404).json({ error: "Question non trouvée" });
  }

  db.prepare(
    `UPDATE phase6_questions
     SET question_text = ?, correct_answer = ?, order_index = ?
     WHERE id = ?`
  ).run(
    question_text ?? existing.question_text,
    correct_answer !== undefined ? (correct_answer ? 1 : 0) : existing.correct_answer,
    order_index ?? existing.order_index,
    id
  );

  const row = db
    .prepare("SELECT * FROM phase6_questions WHERE id = ?")
    .get(id);
  res.json(row);
});

// DELETE question
router.delete("/questions/:id", (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM phase6_questions WHERE id = ?").run(id);
  res.json({ success: true });
});

/* ---------- PHASE 6 : SETTINGS (chrono + vies) ---------- */

// GET paramètres phase 6
router.get("/settings", (req, res) => {
  let settings = db
    .prepare("SELECT * FROM phase6_settings WHERE id = 1")
    .get();

  // si pas encore de ligne, on en crée une avec les valeurs par défaut
  if (!settings) {
    db.prepare(
      "INSERT INTO phase6_settings (id, time_per_question, lives_per_team) VALUES (1, 15, 3)"
    ).run();
    settings = db
      .prepare("SELECT * FROM phase6_settings WHERE id = 1")
      .get();
  }

  res.json(settings);
});

// PUT paramètres phase 6
router.put("/settings", (req, res) => {
  const { time_per_question, lives_per_team } = req.body;

  const current = db
    .prepare("SELECT * FROM phase6_settings WHERE id = 1")
    .get();

  if (!current) {
    db.prepare(
      "INSERT INTO phase6_settings (id, time_per_question, lives_per_team) VALUES (1, ?, ?)"
    ).run(time_per_question ?? 15, lives_per_team ?? 3);
  } else {
    db.prepare(
      "UPDATE phase6_settings SET time_per_question = ?, lives_per_team = ? WHERE id = 1"
    ).run(
      time_per_question ?? current.time_per_question,
      lives_per_team ?? current.lives_per_team
    );
  }

  const settings = db
    .prepare("SELECT * FROM phase6_settings WHERE id = 1")
    .get();
  res.json(settings);
});

export default router;

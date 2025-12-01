import express from "express";
import { db, generateId } from "../db/database.js";

const router = express.Router();

/**
 * 🟢 1️⃣ Récupérer toutes les questions Buzz
 * Route : GET /api/buzz/questions
 */
router.get("/questions", (req, res) => {
  try {
    const questions = db.prepare("SELECT * FROM buzz_questions ORDER BY created_at").all();
    res.json(questions);
  } catch (err) {
    console.error("Erreur GET /buzz/questions :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * 🟢 2️⃣ Ajouter une nouvelle question Buzz
 * Route : POST /api/buzz/questions
 * Body attendu : { question: string, answer: string }
 */
router.post("/questions", (req, res) => {
  try {
    const { question, answer } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: "Champs requis manquants (question, answer)" });
    }

    const id = generateId();
    db.prepare("INSERT INTO buzz_questions (id, question, answer) VALUES (?, ?, ?)").run(id, question, answer);

    const newQ = db.prepare("SELECT * FROM buzz_questions WHERE id = ?").get(id);
    res.json(newQ);
  } catch (err) {
    console.error("Erreur POST /buzz/questions :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * 🟢 3️⃣ Mettre à jour toutes les questions Buzz
 * Route : PUT /api/buzz/questions
 * Body attendu : { questions: [{ question, answer }] }
 */
router.put("/questions", (req, res) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions)) {
      return res.status(400).json({ error: "Format invalide, attendu: tableau de questions" });
    }

    db.prepare("DELETE FROM buzz_questions").run();
    const insert = db.prepare("INSERT INTO buzz_questions (id, question, answer) VALUES (?, ?, ?)");

    const insertMany = db.transaction((arr) => {
      arr.forEach((q) => insert.run(generateId(), q.question, q.answer));
    });
    insertMany(questions);

    res.json({ success: true });
  } catch (err) {
    console.error("Erreur PUT /buzz/questions :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;

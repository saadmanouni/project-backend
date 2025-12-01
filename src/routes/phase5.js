import express from "express";
import { db, generateId } from "../db/database.js";

const router = express.Router();

/**
 * GET /api/phase5?team_id=xxx
 * → Récupère : 
 *    - toutes les réponses (admin)
 *    - ou celle d’une équipe (joueur)
 */
router.get("/", (req, res) => {
  const { team_id } = req.query;

  try {
    // Admin → récupérer toutes les réponses
    if (!team_id) {
      const all = db.prepare("SELECT * FROM phase5_responses").all();
      return res.json(all); // 👈 tableau
    }

    // Joueur → récupérer UNE seule ligne
    const row = db
      .prepare("SELECT * FROM phase5_responses WHERE team_id = ?")
      .get(team_id);

    return res.json(row || {}); // 👈 objet
  } catch (err) {
    console.error("Erreur GET Phase 5:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/phase5
 * → Ajouter ou mettre à jour un diagnostic
 */
router.post("/", (req, res) => {
  const { teamId, diagnosis } = req.body;

  if (!teamId || !diagnosis || !diagnosis.trim()) {
    return res.status(400).json({
      error: "teamId et diagnosis sont obligatoires.",
    });
  }

  try {
    // Vérifier si équipe existe
    const team = db.prepare("SELECT * FROM teams WHERE id = ?").get(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });

    const existing = db
      .prepare("SELECT * FROM phase5_responses WHERE team_id = ?")
      .get(teamId);

    let saved;

    if (existing) {
      // 🔥 Mise à jour correcte
      db.prepare(
        `UPDATE phase5_responses
         SET response_text = ?, updated_at = CURRENT_TIMESTAMP
         WHERE team_id = ?`
      ).run(diagnosis.trim(), teamId);

      saved = db
        .prepare("SELECT * FROM phase5_responses WHERE team_id = ?")
        .get(teamId);
    } else {
      // 🔥 Nouvelle ligne
      const id = generateId();
      db.prepare(
        `INSERT INTO phase5_responses (id, team_id, response_text)
         VALUES (?, ?, ?)`
      ).run(id, teamId, diagnosis.trim());

      saved = db.prepare("SELECT * FROM phase5_responses WHERE id = ?").get(id);
    }

    // 🔥 Notifier admin + joueurs
    if (global.io) {
      global.io.emit("phase5:updated", saved);
    }

    return res.json(saved);
  } catch (err) {
    console.error("Erreur POST Phase 5:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

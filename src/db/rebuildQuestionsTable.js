import Database from "better-sqlite3";

const db = new Database("./game.db");

try {
  console.log("🧱 Reconstruction complète de la table 'questions'...");

  // 1️⃣ Sauvegarde ancienne table (si elle existe)
  db.exec(`
    CREATE TABLE IF NOT EXISTS old_questions_backup AS
    SELECT * FROM questions;
  `);

  // 2️⃣ Supprime l'ancienne table
  db.exec(`DROP TABLE IF EXISTS questions;`);

  // 3️⃣ Recrée la table avec la bonne structure
  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      case_id TEXT,
      phase INTEGER,
      question_text TEXT NOT NULL,
      expected_answer TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      category TEXT DEFAULT 'useful',
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("✅ Nouvelle table 'questions' créée avec succès !");
} catch (err) {
  console.error("❌ Erreur :", err.message);
}

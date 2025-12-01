import Database from "better-sqlite3";

const db = new Database("./game.db", { fileMustExist: true });

try {
  console.log("🔄 Renommage de la table phase_questions → questions...");
  db.exec("ALTER TABLE phase_questions RENAME TO questions;");
  console.log("✅ Table renommée avec succès !");
} catch (err) {
  console.error("⚠️ Erreur :", err.message);
}

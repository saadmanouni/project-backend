import Database from "better-sqlite3";

const db = new Database("./game.db", { fileMustExist: true });

try {
  console.log("🧹 Suppression de l’ancienne table 'questions' si elle existe...");
  db.exec("DROP TABLE IF EXISTS questions;");
  console.log("✅ Table supprimée avec succès !");
} catch (err) {
  console.error("⚠️ Erreur :", err.message);
}

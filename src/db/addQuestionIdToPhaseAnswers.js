import { db } from "./database.js";

console.log("🧩 Vérification / ajout de la colonne 'question_id' dans la table phase_answers...");

try {
  // Vérifie si la colonne existe déjà
  const tableInfo = db.prepare("PRAGMA table_info(phase_answers)").all();
  const hasColumn = tableInfo.some(col => col.name === "question_id");

  if (!hasColumn) {
    db.prepare("ALTER TABLE phase_answers ADD COLUMN question_id TEXT").run();
    console.log("✅ Colonne 'question_id' ajoutée avec succès !");
  } else {
    console.log("⚡ La colonne 'question_id' existe déjà, rien à faire.");
  }
} catch (error) {
  console.error("❌ Erreur lors de l’ajout de la colonne :", error);
}

import Database from "better-sqlite3";

const db = new Database("./game.db");

try {
  console.log("🔧 Ajout de la colonne case_id à la table questions...");

  // Vérifie si la colonne existe déjà
  const pragma = db.prepare("PRAGMA table_info(questions)").all();
  const hasCaseId = pragma.some(col => col.name === "case_id");

  if (!hasCaseId) {
    db.exec(`ALTER TABLE questions ADD COLUMN case_id TEXT`);
    console.log("✅ Colonne 'case_id' ajoutée avec succès !");
  } else {
    console.log("ℹ️ La colonne 'case_id' existe déjà, rien à faire.");
  }
} catch (err) {
  console.error("❌ Erreur lors de la modification :", err.message);
}

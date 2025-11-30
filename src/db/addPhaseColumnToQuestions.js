import Database from "better-sqlite3";

const db = new Database("./game.db");

try {
  console.log("🔧 Vérification / ajout de la colonne 'phase' dans la table questions...");

  // Vérifie la structure actuelle de la table
  const columns = db.prepare("PRAGMA table_info(questions)").all();
  const hasPhase = columns.some(col => col.name === "phase");

  if (!hasPhase) {
    db.exec(`ALTER TABLE questions ADD COLUMN phase INTEGER`);
    console.log("✅ Colonne 'phase' ajoutée avec succès !");
  } else {
    console.log("ℹ️ La colonne 'phase' existe déjà, rien à faire.");
  }

} catch (err) {
  console.error("❌ Erreur lors de l'ajout :", err.message);
}

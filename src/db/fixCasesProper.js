import Database from "better-sqlite3";
const db = new Database("./game.db");

console.log("🔧 Réparation complète de la table cases...");

// Supprimer l’ancienne table s'il y en a une
db.exec(`DROP TABLE IF EXISTS cases;`);

// Recréer la bonne table complète
db.exec(`
  CREATE TABLE cases (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    clinical_description TEXT NOT NULL,
    attachments TEXT,
    clue TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log("🆕 Nouvelle table 'cases' créée !");
console.log("➡️ Tu peux maintenant redémarrer ton serveur.");

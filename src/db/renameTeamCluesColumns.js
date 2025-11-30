import Database from "better-sqlite3";

const db = new Database("./src/db/database.sqlite");

console.log("🔧 Vérification et renommage des colonnes de team_clues...");

try {
  // Vérifie si la colonne "text" existe
  const columns = db.prepare("PRAGMA table_info(team_clues)").all();
  const hasText = columns.some(c => c.name === "text");
  const hasCost = columns.some(c => c.name === "cost");

  if (hasText) {
    db.prepare(`ALTER TABLE team_clues RENAME COLUMN text TO clue_text;`).run();
    console.log("✅ Colonne 'text' renommée en 'clue_text'");
  }

  if (hasCost) {
    db.prepare(`ALTER TABLE team_clues RENAME COLUMN cost TO clue_cost;`).run();
    console.log("✅ Colonne 'cost' renommée en 'clue_cost'");
  }

  console.log("🎉 Mise à jour terminée !");
} catch (err) {
  console.error("❌ Erreur :", err.message);
}

import Database from "better-sqlite3";
const db = new Database("./src/db/database.sqlite");

function addColumnIfNotExists(table, column, type) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  const exists = columns.some(c => c.name === column);
  if (!exists) {
    console.log(`➡️ Ajout de la colonne ${column} (${type})`);
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
  } else {
    console.log(`✅ Colonne ${column} déjà existante`);
  }
}

addColumnIfNotExists("team_clues", "cost", "INTEGER DEFAULT 10");
addColumnIfNotExists("team_clues", "is_piratable", "INTEGER DEFAULT 0");
addColumnIfNotExists("team_clues", "case_id", "TEXT");

console.log("✅ Vérification terminée.");

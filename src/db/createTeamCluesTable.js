import Database from "better-sqlite3";
const db = new Database("./src/db/database.sqlite");

console.log("🛠️ Création de la table team_clues...");

db.prepare(`
  CREATE TABLE IF NOT EXISTS team_clues (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL,
    text TEXT,
    cost INTEGER DEFAULT 10,
    is_piratable INTEGER DEFAULT 0,
    case_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )
`).run();

console.log("✅ Table team_clues prête !");

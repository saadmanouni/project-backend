import Database from "better-sqlite3";

const db = new Database("./src/db/database.sqlite");

console.log("🧱 Création de la table cases...");

db.prepare(`
  CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )
`).run();

console.log("✅ Table 'cases' créée (ou déjà existante).");

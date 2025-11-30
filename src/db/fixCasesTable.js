import Database from "better-sqlite3";
const db = new Database("./src/db/database.sqlite");

console.log("🔧 Correction de la table 'cases'...");

// 1. sauvegarde de l’ancienne table
db.exec(`
  ALTER TABLE cases RENAME TO cases_old;
`);

// 2. nouvelle table propre
db.exec(`
  CREATE TABLE cases (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

// 3. transférer les données compatibles
db.exec(`
  INSERT INTO cases (id, title, description, created_at, updated_at)
  SELECT 
    id,
    title,
    clinical_description AS description,
    created_at,
    updated_at
  FROM cases_old;
`);

// 4. supprimer l’ancienne
db.exec(`DROP TABLE cases_old;`);

console.log("✅ Table 'cases' corrigée !");

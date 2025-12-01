import Database from "better-sqlite3";

const db = new Database("./src/db/database.sqlite");

console.log("🔧 Reconstruction de la table team_clues...");

// 1. Renommer l'ancienne table
db.prepare(`
  ALTER TABLE team_clues RENAME TO team_clues_old;
`).run();

// 2. Recréer correctement la table AVEC FOREIGN KEY
db.prepare(`
  CREATE TABLE team_clues (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL,
    case_id TEXT NOT NULL,
    clue_text TEXT,
    clue_cost INTEGER DEFAULT 10,
    is_piratable INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (case_id) REFERENCES cases(id)
  );
`).run();

// 3. Copier les données existantes (si utiles)
db.prepare(`
  INSERT INTO team_clues (id, team_id, case_id, clue_text, clue_cost, is_piratable, created_at)
  SELECT id, team_id, case_id, clue_text, clue_cost, is_piratable, created_at
  FROM team_clues_old;
`).run();

// 4. Supprimer l’ancienne table
db.prepare("DROP TABLE team_clues_old;").run();

console.log("✅ Table team_clues reconstruite proprement !");

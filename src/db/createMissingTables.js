import Database from "better-sqlite3";

// --- Connexion à la base ---
const db = new Database("./src/db/database.sqlite");

console.log("🧱 Vérification / création des tables manquantes...");

// =====================
// TABLE : TEAMS
// =====================
db.prepare(`
  CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )
`).run();


// =====================
// TABLE : CASES
// =====================
db.prepare(`
  CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )
`).run();


// =====================
// TABLE : GAME_SESSION
// =====================
// (contient l’état global du jeu)
db.prepare(`
  CREATE TABLE IF NOT EXISTS game_session (
    id INTEGER PRIMARY KEY,
    status TEXT DEFAULT 'lobby',
    current_phase INTEGER DEFAULT 0,
    is_buzz_phase INTEGER DEFAULT 0,
    current_case_id TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
  )
`).run();


// === Insérer une seule ligne SESSION (id = 1) si elle n'existe pas ===
const existingSession = db.prepare("SELECT id FROM game_session WHERE id = 1").get();
if (!existingSession) {
  db.prepare("INSERT INTO game_session (id) VALUES (1)").run();
  console.log("🆕 Session créée (id=1)");
}


// =====================
// INSÉRER EXEMPLES SI ABSENTS
// =====================

// --- TEAM EXEMPLE ---
const existingTeam = db.prepare("SELECT id FROM teams WHERE id = '2'").get();
if (!existingTeam) {
  db.prepare("INSERT INTO teams (id, name, points) VALUES (?, ?, ?)").run(
    "2",
    "Équipe 1",
    100
  );
  console.log("➕ Équipe 1 ajoutée (id=2)");
} else {
  console.log("ℹ️ Équipe 1 déjà existante.");
}

// === NEW : colonne clue_order dans team_clues ===
const hasClueOrder = db.prepare(`
  SELECT 1 
  FROM pragma_table_info('team_clues') 
  WHERE name = 'clue_order'
`).get();

if (!hasClueOrder) {
  db.prepare(`
    ALTER TABLE team_clues
    ADD COLUMN clue_order INTEGER DEFAULT 0
  `).run();
  console.log("✅ Colonne team_clues.clue_order ajoutée");
}


// --- CASE EXEMPLE ---
const existingCase = db.prepare(
  "SELECT id FROM cases WHERE id = 'mhr0x640gkvd0li9zbq'"
).get();

if (!existingCase) {
  db.prepare(
    "INSERT INTO cases (id, title, description) VALUES (?, ?, ?)"
  ).run(
    "mhr0x640gkvd0li9zbq",
    "Invagination intestinale aiguë",
    "Cas clinique de test."
  );
  console.log("➕ Cas clinique de test ajouté (id=mhr0x640gkvd0li9zbq)");
} else {
  console.log("ℹ️ Cas clinique déjà existant.");
}

console.log("🎉 Base prête !");

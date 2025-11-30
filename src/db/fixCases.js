import Database from "better-sqlite3";
const db = new Database("./src/db/database.sqlite");

console.log("🔍 Inspection table 'cases'...");

// Lire les colonnes existantes
const columns = db.prepare(`PRAGMA table_info('cases')`).all();
console.table(columns);

const hasTitle = columns.some(col => col.name === "title");
const hasDescription = columns.some(col => col.name === "description");

// 1️⃣ Ajouter la colonne description si elle n'existe pas
if (!hasDescription) {
  console.log("➕ Ajout colonne 'description'");
  db.exec(`ALTER TABLE cases ADD COLUMN description TEXT;`);
}

// 2️⃣ Récupérer toutes les données existantes
const data = db.prepare(`SELECT * FROM cases`).all();
console.log("📦 Données trouvées :", data.length);

// 3️⃣ Recréer une table propre
console.log("🔧 Reconstruction de la table cases...");

db.exec(`
  CREATE TABLE IF NOT EXISTS cases_new (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT
  );
`);

// 4️⃣ Réinsérer les données propres
const insert = db.prepare(`
  INSERT INTO cases_new (id, title, description, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?)
`);

for (const row of data) {
  insert.run(
    row.id,
    row.title || null,
    row.description || null,
    row.created_at || null,
    row.updated_at || null
  );
}

console.log("📥 Données réinsérées.");

// 5️⃣ Supprimer l'ancienne table et renommer
db.exec(`DROP TABLE cases;`);
db.exec(`ALTER TABLE cases_new RENAME TO cases;`);

console.log("✅ Table 'cases' réparée avec succès !");

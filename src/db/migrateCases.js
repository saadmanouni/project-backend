import Database from "better-sqlite3";
const db = new Database("./src/db/database.sqlite");

console.log("🔧 Migration table 'cases'...");

// Ajouter colonne description si absente
const hasDescription = db.prepare(`
  SELECT 1 FROM pragma_table_info('cases') WHERE name = 'description'
`).get();

if (!hasDescription) {
  db.exec(`ALTER TABLE cases ADD COLUMN description TEXT;`);
  console.log("🆕 Colonne 'description' ajoutée.");
}

// Copier clinical_description → description
db.exec(`
  UPDATE cases
  SET description = clinical_description
  WHERE description IS NULL AND clinical_description IS NOT NULL;
`);

console.log("📌 Copie clinical_description → description OK");

// Supprimer colonnes inutiles (si elles existent)
const columns = db.prepare(`PRAGMA table_info('cases')`).all();

const dropCol = (col) => {
  if (columns.some(c => c.name === col)) {
    db.exec(`
      CREATE TABLE cases_tmp AS 
      SELECT id, title, description, created_at, updated_at
      FROM cases;
    `);
    db.exec(`DROP TABLE cases;`);
    db.exec(`ALTER TABLE cases_tmp RENAME TO cases;`);
    console.log(`🗑️ Colonne '${col}' supprimée.`);
  }
};

dropCol("clinical_description");
dropCol("clue");
dropCol("attachments");

console.log("✅ Migration terminée !");

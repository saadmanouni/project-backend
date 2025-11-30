import { db } from "./database.js";

console.log("🔍 Inspection de la table 'cases'...");

try {
  const columns = db.prepare(`PRAGMA table_info(cases)`).all();
  console.table(columns);
} catch (err) {
  console.error("❌ ERREUR :", err.message);
}

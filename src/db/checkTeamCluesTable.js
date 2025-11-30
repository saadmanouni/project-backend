import Database from "better-sqlite3";
const db = new Database("./src/db/database.sqlite");

console.log("📋 Liste des tables disponibles :");
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.table(tables);

import Database from 'better-sqlite3';

// 🔹 Ouvre la base de données
const db = new Database('./game.db', { fileMustExist: true });

console.log('📋 Tables existantes :');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(tables);

console.log('\n🧠 Contenu de la table questions :');
try {
  const questions = db.prepare('SELECT * FROM questions').all();
  console.log(questions);
} catch (err) {
  console.error('⚠️ Erreur :', err.message);
}

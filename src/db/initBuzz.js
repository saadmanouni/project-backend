import { db, generateId } from './database.js';

const questions = [
  { question: "Je peux construire un avenir ou le détruire, selon la manière dont tu m’emploies. Qui suis-je ?", answer: "Le temps" },
  { question: "Quel film a remporté l’Oscar du meilleur film en 2024 ?", answer: "Oppenheimer" },
  { question: "On me casse quand on me prononce. Qui suis-je ?", answer: "Le silence" },
  { question: "Quel pays a remporté la Coupe du Monde de football 2002 ?", answer: "Le Brésil" },
  { question: "Quelle est la capitale de la Corée du Sud ?", answer: "Séoul" },
  { question: "Dans quel pays a été inventé le sudoku ?", answer: "Le Japon" },
  { question: "Quel compositeur est devenu sourd mais a continué à composer ?", answer: "Beethoven" },
  { question: "Quel scientifique a proposé la théorie de la relativité ?", answer: "Albert Einstein" },
  { question: "Quel est le plus grand pays d’Afrique par sa superficie ?", answer: "L’Algérie" },
  { question: "Quel est le plus petit pays du monde ?", answer: "Le Vatican" },
];

export function seedBuzzQuestions() {
  const count = db.prepare("SELECT COUNT(*) as count FROM buzz_questions").get().count;
  if (count === 0) {
    const insert = db.prepare("INSERT INTO buzz_questions (id, question, answer) VALUES (?, ?, ?)");
    const insertMany = db.transaction((list) => {
      for (const q of list) insert.run(generateId(), q.question, q.answer);
    });
    insertMany(questions);
    console.log("✅ 10 questions Buzz insérées avec succès !");
  } else {
    console.log("⚡ Table buzz_questions déjà remplie, aucune insertion.");
  }
}

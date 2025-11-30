import Database from "better-sqlite3";
import { randomUUID } from "crypto";

const db = new Database("./game.db", { fileMustExist: true });

const questions = [
  {
    case_id: "case1",
    phase: 2,
    question_text: "Antécédents personnels ?",
    expected_answer: "Une symptomatologie de gastroentérite et diarrhée dans les 2 semaines précédentes.",
    points: 1,
    category: "useful",
  },
  {
    case_id: "case1",
    phase: 2,
    question_text: "S'agit-il d’un premier épisode ?",
    expected_answer: "Les parents rapportent que le nourrisson a déjà présenté des crises similaires, qui se résolvaient spontanément.",
    points: 1,
    category: "useful",
  },
  {
    case_id: "case1",
    phase: 2,
    question_text: "Vomissements ?",
    expected_answer: "Oui, vomissements alimentaires puis bilieux après quelques heures d’évolution.",
    points: 1,
    category: "useful",
  },
  {
    case_id: "case1",
    phase: 2,
    question_text: "Type de vomissement (bilieux / alimentaire) ?",
    expected_answer: "Des vomissements tardifs.",
    points: 1,
    category: "useful",
  },
  {
    case_id: "case1",
    phase: 2,
    question_text: "Dernières selles ? Aspect ?",
    expected_answer: "Selles sanglantes, rouge foncé, glaireuses (“gelée de groseille”).",
    points: 2,
    category: "useful",
  },
  {
    case_id: "case1",
    phase: 2,
    question_text: "Le comportement du transit ?",
    expected_answer: "Nourrisson émet quelques gaz mais arrêt des matières.",
    points: 2,
    category: "useful",
  },
  {
    case_id: "case1",
    phase: 2,
    question_text: "Évolution des symptômes dans le temps ?",
    expected_answer: "Début brutal il y a 8 heures, crises paroxystiques de douleur, avec vomissements puis rectorragies.",
    points: 3,
    category: "useful",
  },
  {
    case_id: "case1",
    phase: 2,
    question_text: "Antécédents familiaux de MICI ?",
    expected_answer: "Aucun antécédent familial de MICI, information non contributive.",
    points: 2,
    category: "useful",
  },
  {
    case_id: "case1",
    phase: 2,
    question_text: "Antécédents chirurgicaux ?",
    expected_answer: "Pas d’antécédent chirurgical.",
    points: 1,
    category: "useful",
  },
  {
    case_id: "case1",
    phase: 2,
    question_text: "Type de la douleur ?",
    expected_answer: "Crises de pleurs intenses, soudaines et inhabituelles entrecoupées de périodes de calme.",
    points: 3,
    category: "useful",
  },
  {
    case_id: "case1",
    phase: 2,
    question_text: "Douleur testiculaire ?",
    expected_answer: "Non, absence de douleur testiculaire.",
    points: 3,
    category: "useful",
  },
];

try {
  console.log("🌱 Insertion des questions officielles de la Phase 2...");
  const stmt = db.prepare(`
    INSERT INTO questions (id, case_id, phase, question_text, expected_answer, points, category)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((questions) => {
    for (const q of questions) {
      stmt.run(randomUUID(), q.case_id, q.phase, q.question_text, q.expected_answer, q.points, q.category);
    }
  });

  insertMany(questions);
  console.log(`✅ ${questions.length} questions insérées avec succès !`);
} catch (err) {
  console.error("⚠️ Erreur :", err.message);
}

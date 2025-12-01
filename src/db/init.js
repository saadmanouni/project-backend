import { db, generateId } from "./database.js";

export async function initializeGameData() {
  /* ===============================
      1) SETTINGS
  =============================== */
  try {
    const settings = db.prepare("SELECT COUNT(*) AS c FROM game_settings WHERE id = 1").get();

    if (settings.c === 0) {
      db.prepare(`
        INSERT INTO game_settings (
          id, buy_answer_cost, exchange_cost, hack_cost,
          correct_answer_reward, wrong_answer_penalty, max_errors_phase6
        ) VALUES (1, 20, 15, 20, 10, 5, 3)
      `).run();
      console.log("⚙️ Settings seeded");
    }
  } catch (err) {
    console.error("❌ Error seeding settings:", err);
  }

  /* ===============================
      2) TEAMS
  =============================== */
  try {
    const t = db.prepare("SELECT COUNT(*) AS c FROM teams").get();

    if (t.c === 0) {
      const insertTeam = db.prepare("INSERT INTO teams (id, name, points) VALUES (?, ?, ?)");

      for (let i = 1; i <= 4; i++) {
        insertTeam.run(generateId(), `Équipe ${i}`, 100);
      }

      console.log("👥 Teams seeded");
    }
  } catch (err) {
    console.error("❌ Error seeding teams:", err);
  }

  /* ===============================
    2.5) TABLE PHASE 5 RESPONSES
=============================== */
try {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS phase5_responses (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      response_text TEXT NOT NULL,
      points_awarded INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(team_id) REFERENCES teams(id)
    )
  `).run();

  console.log("🧪 Table phase5_responses OK");
} catch (err) {
  console.error("❌ Error creating phase5_responses:", err);
}


  /* ===============================
      3) DEFAULT CASE
  =============================== */
  try {
    const c = db.prepare("SELECT COUNT(*) AS c FROM cases").get();

    if (c.c === 0) {
      const caseId = generateId();

      db.prepare(`
        INSERT INTO cases (id, title, clinical_description)
        VALUES (?, ?, ?)
      `).run(
        caseId,
        "Invagination intestinale aiguë",
        "Enfant de 2 ans présentant des douleurs abdominales aiguës, vomissements et rectorragies."
      );

      console.log("📚 Case seeded");

      /* SEED CLUES */
      const clues = [
        { text: "Enfant de 2 ans", cost: 0 },
        { text: "Vomissements bilieux", cost: 10 },
        { text: "Rectorragies", cost: 10 },
        { text: "Image en cocarde à l'échographie", cost: 10 }
      ];

      const teams = db.prepare("SELECT id FROM teams").all();
      const insertClue = db.prepare(`
        INSERT INTO team_clues (id, team_id, case_id, clue_text, clue_cost, is_piratable, clue_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      teams.forEach((team, i) => {
        const clue = clues[i] || clues[0];
        insertClue.run(
          generateId(),
          team.id,
          caseId,
          clue.text,
          clue.cost,
          clue.cost > 0 ? 1 : 0,
          i
        );
      });

      console.log("📝 Clues seeded");
    }
  } catch (err) {
    console.error("❌ Error seeding default case:", err);
  }
}

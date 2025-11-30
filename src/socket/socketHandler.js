import { db, generateId } from '../db/database.js';

const gameState = {
  phase: "lobby",             // phase actuelle
  teams: [],                  // liste des équipes
  scores: {},                 // scores des équipes
  buzzQueue: [],              // ordre des buzz
  currentBuzzQuestion: null,  // question buzz active
  currentCaseId: null,        // cas clinique sélectionné
  answers: {},                // réponses par équipe (phase clinique)
  comments: {},               // commentaires par équipe
  priseEnCharge: {},          // éléments de prise en charge
  maxErrorsPhase6: 3,         // limite des erreurs
};


// === PHASE 6 : TIMER GLOBAL ===

let phase6Interval = null;
let phase6Remaining = 0;

function stopPhase6Timer() {
  if (phase6Interval) {
    clearInterval(phase6Interval);
    phase6Interval = null;
  }
}

function startPhase6Question(io) {
  stopPhase6Timer();

  // Lire session
  const session = db.prepare('SELECT * FROM game_session WHERE id = 1').get();
  const currentIndex = session.phase6_current_question || 0;

  // Lire question actuelle
  const question = db.prepare(`
      SELECT q.*,
            (SELECT COUNT(*) FROM phase6_questions) AS total
      FROM phase6_questions q
      ORDER BY q.order_index ASC
      LIMIT 1 OFFSET ?
    `).get(currentIndex);

// Si plus de questions → fin phase 6
if (!question) {

  // === 1) Récupération et classement ===
  let scores = db.prepare(`
    SELECT id, name, phase6_score, phase6_lives, phase6_eliminated
    FROM teams
  `).all();

  // Classement multicritère
  scores.sort((a, b) => {
    if (b.phase6_score !== a.phase6_score)
      return b.phase6_score - a.phase6_score;

    if (b.phase6_lives !== a.phase6_lives)
      return b.phase6_lives - a.phase6_lives;

    if (a.phase6_eliminated !== b.phase6_eliminated)
      return a.phase6_eliminated - b.phase6_eliminated;

    return a.name.localeCompare(b.name);
  });

  const totalQuestions = db.prepare(`
    SELECT COUNT(*) AS total FROM phase6_questions
  `).get().total;

  // === 2) Génération des résumés + podium
  scores.forEach((t, index) => {
    const rank = index + 1;

    const medal = rank === 1 ? "🥇" :
                  rank === 2 ? "🥈" :
                  rank === 3 ? "🥉" : "🏅";

    const appreciation =
      t.phase6_score === totalQuestions ? "💯 *Zéro faute : maîtrise parfaite !*" :
      t.phase6_score >= totalQuestions * 0.7 ? "🟢 *Très bonne compréhension clinique.*" :
      t.phase6_score >= totalQuestions * 0.4 ? "🟡 *Quelques hésitations mais une base solide.*" :
      "🔴 *Beaucoup d’erreurs… Un débrief sera nécessaire.*";

    const eliminationMsg =
      t.phase6_eliminated
        ? "❌ Éliminée avant la fin : attention à la gestion des vies."
        : "✅ A survécu à toute l’épreuve sans élimination.";

    const summary = `
${medal} **Classement : #${rank} – Phase 6 : Vrai/Faux**
━━━━━━━━━━━━━━━━━━━━━━

🏷️ **Équipe :** ${t.name}

📊 **Statistiques**
• 🧪 Score : **${t.phase6_score} / ${totalQuestions}**
• ❤️ Vies restantes : **${t.phase6_lives}**
• 🚨 Élimination : **${t.phase6_eliminated ? "🔴 Oui" : "🟢 Non"}**

🧠 **Analyse**
${appreciation}

🩺 **Diagnostic final**
${eliminationMsg}

━━━━━━━━━━━━━━━━━━━━━━
  `;

    const id = generateId();
    db.prepare(`
      INSERT INTO comments (id, team_id, comment, points_awarded)
      VALUES (?, ?, ?, 0)
    `).run(id, t.id, summary);
  });

  // Envoyer les commentaires aux front
  const allComments = db.prepare("SELECT * FROM comments").all();
  io.emit("comments:updated", allComments);

  // 🔥 ENVOI DU PODIUM + RÉSULTATS AU FRONT
  io.emit("phase6:finished", {
  results: scores
});


  return;
}



  // Récupérer temps par question
  const settings =
    db.prepare('SELECT time_per_question FROM phase6_settings WHERE id = 1').get() ||
    { time_per_question: 15 };

  phase6Remaining = settings.time_per_question;

  // Envoyer la question à TOUT LE MONDE
  io.emit('phase6:newQuestion', {
    index: currentIndex,
    total: question.total,
    question: {
      id: question.id,
      text: question.question_text,
    },
  });

  // Envoyer premier timer
  io.emit('phase6:timer', phase6Remaining);

  // Lancer timer 1 seconde
  phase6Interval = setInterval(() => {
    phase6Remaining -= 1;

    if (phase6Remaining <= 0) {
      io.emit('phase6:timer', 0);
      stopPhase6Timer();

      db.prepare(`
          UPDATE game_session
          SET phase6_current_question = phase6_current_question + 1
          WHERE id = 1
        `).run();

        // 🔥 Perte de vie si l'équipe n'a PAS répondu
const currentQuestionId = question.id;

// Récupérer toutes les équipes
const teams = db.prepare(`SELECT id, phase6_lives, phase6_eliminated FROM teams`).all();

for (const team of teams) {
  // Vérifier si cette équipe a répondu à cette question
  const answered = db.prepare(`
    SELECT 1 FROM phase6_answers
    WHERE team_id = ? AND question_id = ?
  `).get(team.id, currentQuestionId);

  if (!answered) {
    // Retirer 1 vie
    db.prepare(`
      UPDATE teams
      SET phase6_lives = phase6_lives - 1
      WHERE id = ?
    `).run(team.id);

    // Vérifier élimination
    const t = db.prepare(`SELECT phase6_lives FROM teams WHERE id = ?`).get(team.id);
    if (t.phase6_lives <= 0) {
      db.prepare(`UPDATE teams SET phase6_eliminated = 1 WHERE id = ?`).run(team.id);
    }

    // Notifier front
    const updatedTeam = db.prepare(`SELECT * FROM teams WHERE id = ?`).get(team.id);
    io.emit('phase6:teamUpdated', updatedTeam);
    io.to("admins").emit("phase6:adminUpdate", updatedTeam);

  }
}


      // Lancer la suivante
      startPhase6Question(io);
    } else {
      io.emit('phase6:timer', phase6Remaining);
    }
  }, 1000);
}



export function setupSocketHandlers(io) {
  // Debug socket connections
  const DEBUG = true;
  const debug = (...args) => {
    if (DEBUG) console.log('[Socket]', ...args);
  };

  io.on('connection', (socket) => {

    socket.on("admin:join", () => {
    console.log("Admin joined dashboard");
    socket.join("admins");
});

    debug('Client connected:', socket.id);

    // Handle disconnections
    socket.on('disconnect', (reason) => {
      debug('Client disconnected:', socket.id, 'Reason:', reason);
    });

    // Handle errors
    socket.on('error', (error) => {
      debug('Socket error:', error);
    });

    socket.on('team:join', async (data, callback) => {
      try {
        const { teamId, memberName } = data;

        const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
        if (!team) {
          callback({ error: 'Team not found' });
          return;
        }

        const memberCount = db.prepare('SELECT COUNT(*) as count FROM team_members WHERE team_id = ?').get(teamId);
        if (memberCount.count >= 3) {
          callback({ error: 'Team is full' });
          return;
        }

        db.prepare('INSERT INTO team_members (team_id, member_name) VALUES (?, ?)').run(teamId, memberName);

        const teams = getFormattedTeams();
        io.emit('teams:updated', teams);
        callback({ success: true, teamId });
      } catch (error) {
        callback({ error: error.message });
      }
    });

// === PHASE BUZZ ===
// ⚡ PHASE BUZZ : quand une équipe appuie sur le bouton "BUZZ !"
socket.on('buzz:press', (data, callback) => {
  try {
    const { teamId } = data || {};
    if (!teamId) return callback?.({ success: false, error: 'Team ID manquant' });

    console.log('🚨 Buzz reçu de:', teamId);

    if (gameState.buzzQueue.includes(teamId)) {
      return callback?.({ success: false, error: 'Équipe déjà dans la file' });
    }

    gameState.buzzQueue.push(teamId);

    io.emit('buzz:updateQueue', gameState.buzzQueue);

    return callback?.({ success: true });
  } catch (err) {
    console.error('💥 Erreur buzz:press:', err);
    return callback?.({ success: false, error: 'Erreur interne serveur' });
  }
});



// ⚡ 2️⃣ L’admin envoie une nouvelle question à tout le monde
socket.on('buzz:newQuestion', (questionObj) => {
  gameState.currentBuzzQuestion = questionObj || null;
  gameState.buzzQueue = [];

  io.emit('buzz:newQuestion', gameState.currentBuzzQuestion);
  io.emit('buzz:updateQueue', gameState.buzzQueue);
});


// ⚡ 3️⃣ L’admin passe à l’équipe suivante (retire la première de la file)
socket.on('buzz:nextInQueue', () => {
  if (gameState.buzzQueue.length > 0) {
    gameState.buzzQueue.shift();
    io.emit('buzz:updateQueue', gameState.buzzQueue);
  }
});



// ⚡ 4️⃣ L’admin réinitialise complètement la file
socket.on('buzz:resetQueue', () => {
  gameState.buzzQueue = [];
  io.emit('buzz:updateQueue', gameState.buzzQueue);
});


// ⚡ 5️⃣ Quand un client rejoint, on lui envoie l’état actuel du Buzz
socket.on('buzz:requestSync', () => {
  socket.emit('buzz:newQuestion', gameState.currentBuzzQuestion);
  socket.emit('buzz:updateQueue', gameState.buzzQueue);
});




    socket.on('exchange:create', async (data, callback) => {
      try {
        const { fromTeamId, toTeamId } = data;

        const fromTeam = db.prepare('SELECT * FROM teams WHERE id = ?').get(fromTeamId);
        if (!fromTeam) {
          callback({ error: 'Team not found' });
          return;
        }

        if (fromTeam.points < 10) {
          callback({ error: 'Insufficient points' });
          return;
        }


        
       
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    db.prepare('INSERT INTO clue_exchanges (id, from_team_id, to_team_id, status) VALUES (?, ?, ?, ?)').run(id, fromTeamId, toTeamId, 'pending');

    const teams = getFormattedTeams();
    const exchanges = db.prepare('SELECT * FROM clue_exchanges').all();

    io.emit('teams:updated', teams);
    io.emit('exchanges:updated', exchanges);
    callback({ success: true });
  } catch (error) {
    callback({ error: error.message });
  }
});

 socket.on('exchange:accept', async (data, callback) => {
  try {
    const { exchangeId } = data;

    // 1️⃣ Vérifier que l'échange existe et est encore en attente
    const exchange = db.prepare(`
      SELECT * FROM clue_exchanges 
      WHERE id = ? AND status = 'pending'
    `).get(exchangeId);

    if (!exchange) {
      callback({ error: 'Échange invalide ou déjà traité.' });
      return;
    }

    // 2️⃣ Récupérer le coût d'échange dans game_settings (sinon 10)
    const settings = db.prepare('SELECT exchange_cost FROM game_settings WHERE id = 1').get();
    const exchangeCost = settings ? settings.exchange_cost : 10;

    // 3️⃣ Récupérer les deux équipes
    const fromTeam = db.prepare('SELECT id, points FROM teams WHERE id = ?').get(exchange.from_team_id);
    const toTeam   = db.prepare('SELECT id, points FROM teams WHERE id = ?').get(exchange.to_team_id);

    if (!fromTeam || !toTeam) {
      callback({ error: 'Une des équipes est introuvable.' });
      return;
    }

    // 4️⃣ Vérifier les points
    if (fromTeam.points < exchangeCost || toTeam.points < exchangeCost) {
      callback({ error: 'Points insuffisants pour l’une des équipes.' });
      return;
    }

    // 5️⃣ Récupérer les indices actuels dans team_clues
    const fromClues = db.prepare(`
      SELECT case_id, clue_text, clue_cost, is_piratable
      FROM team_clues
      WHERE team_id = ?
    `).all(fromTeam.id);

    const toClues = db.prepare(`
      SELECT case_id, clue_text, clue_cost, is_piratable
      FROM team_clues
      WHERE team_id = ?
    `).all(toTeam.id);

    // 6️⃣ Supprimer les anciens indices des deux équipes
    db.prepare('DELETE FROM team_clues WHERE team_id IN (?, ?)').run(fromTeam.id, toTeam.id);

    // 7️⃣ Réinsérer les indices échangés
    const insertStmt = db.prepare(`
      INSERT INTO team_clues (id, team_id, case_id, clue_text, clue_cost, is_piratable)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const clue of fromClues) {
      insertStmt.run(
        generateId(),
        toTeam.id,
        clue.case_id,
        clue.clue_text,
        clue.clue_cost,
        clue.is_piratable
      );
    }

    for (const clue of toClues) {
      insertStmt.run(
        generateId(),
        fromTeam.id,
        clue.case_id,
        clue.clue_text,
        clue.clue_cost,
        clue.is_piratable
      );
    }

    // 8️⃣ Déduire les points
    db.prepare('UPDATE teams SET points = points - ? WHERE id IN (?, ?)').run(
      exchangeCost,
      fromTeam.id,
      toTeam.id
    );

    // 9️⃣ Marquer l'échange comme accepté
    db.prepare(`
      UPDATE clue_exchanges
      SET status = 'accepted',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(exchangeId);

    // 🔟 Rafraîchir les données et notifier le front
    const teams = getFormattedTeams();
    const exchanges = db.prepare('SELECT * FROM clue_exchanges').all();

    io.emit('teams:updated', teams);
    io.emit('exchanges:updated', exchanges);

    callback({ success: true });
  } catch (error) {
    console.error('Erreur dans exchange:accept:', error);
    callback({ error: error.message });
  }
});





    socket.on('exchange:reject', async (data, callback) => {
      try {
        const { exchangeId } = data;
        db.prepare('UPDATE clue_exchanges SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('rejected', exchangeId);

        const exchanges = db.prepare('SELECT * FROM clue_exchanges').all();
        io.emit('exchanges:updated', exchanges);
        callback({ success: true });
      } catch (error) {
        callback({ error: error.message });
      }
    });

    // ---------- Handler : pirater l'indice d'une équipe ----------
// ---------- Handler : pirater l'indice d'une équipe ----------
// ---------- Handler : pirater l'indice d'une équipe ----------
socket.on('clue:hack', async (data, callback) => {
  try {
    console.log('📡 Requête reçue : clue:hack', data);

    const { fromTeamId, targetTeamId } = data || {};

    // Vérifier l'existence des équipes
    const fromTeam = db.prepare('SELECT id, points FROM teams WHERE id = ?').get(fromTeamId);
    const targetTeam = db.prepare('SELECT id, clue FROM teams WHERE id = ?').get(targetTeamId);

    if (!fromTeam || !targetTeam) {
      console.log('❌ Équipe non trouvée');
      return callback({ success: false, error: 'Équipe introuvable.' });
    }

    // Récupérer le coût du piratage (par défaut = 20)
    const settings = db.prepare('SELECT hack_cost FROM game_settings WHERE id = 1').get();
    const hackCost = settings ? settings.hack_cost : 20;

    if (fromTeam.points < hackCost) {
      console.log('❌ Points insuffisants');
      return callback({ success: false, error: 'Points insuffisants pour pirater.' });
    }

  
   // 🔹 Récupère un indice piratable spécifique à l’équipe cible
    let clueRow = db
     .prepare(`
    SELECT id, case_id, clue_text 
    FROM team_clues 
    WHERE team_id = ? AND is_piratable = 1
    ORDER BY RANDOM() 
    LIMIT 1
  `)
  .get(targetTeamId);

// 🔹 Si aucun indice piratable trouvé, fallback sur son indice principal
if (!clueRow && targetTeam.clue && targetTeam.clue.trim() !== '') {
  clueRow = { id: null, case_id: null, clue_text: targetTeam.clue };
}

if (!clueRow) {
  console.log('❌ Aucun indice piratable trouvé pour la cible');
  return callback({ success: false, error: 'Aucun indice disponible pour cette équipe.' });
}


    // Déduire les points du pirate
    db.prepare('UPDATE teams SET points = points - ? WHERE id = ?').run(hackCost, fromTeamId);
    console.log(`💰 ${hackCost} points retirés à ${fromTeamId}`);

   // Persister l'indice piraté pour l'équipe pirate (afin qu'il apparaisse à côté de son indice principal)
   const newClueId = generateId();
   db.prepare(`
     INSERT INTO team_clues (id, team_id, case_id, clue_text, clue_cost, is_piratable, created_at)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(newClueId, fromTeamId, clueRow.case_id || null, clueRow.clue_text, 0, 0);


    console.log(`🕵️ Indice piraté ajouté à ${fromTeamId}`);

    // Émettre mise à jour des équipes (utilise getFormattedTeams pour garder le format attendu par le front)
    const teams = getFormattedTeams();
    io.emit('teams:updated', teams);
    console.log('📤 teams:updated envoyé');

    // Retourner l'indice piraté au frontend (callback)
    return callback({
      success: true,
      clue: { id: newClueId, clue_text: clueRow.clue_text, case_id: clueRow.case_id || null },
      hackCost,
    });
  } catch (err) {
    console.error('💥 Erreur clue:hack:', err);
    return callback({ success: false, error: 'Erreur serveur interne' });
  }
});


socket.on("answer:buy", async (data, callback) => {
  try {
    const { teamId, questionId, phase, pointsSpent } = data;

    console.log("🧾 Achat reçu :", data);

    if (!teamId || !questionId || !phase) {
      return callback?.({ success: false, error: "Missing data" });
    }

    const team = db.prepare("SELECT * FROM teams WHERE id = ?").get(teamId);
    if (!team) {
      return callback?.({ success: false, error: "Team not found" });
    }

    if (team.points < pointsSpent) {
      return callback?.({ success: false, error: "Not enough points" });
    }

    // 🔹 Récupère la bonne réponse dans la table questions
    const question = db.prepare("SELECT expected_answer FROM questions WHERE id = ?").get(questionId);
    if (!question) {
      return callback?.({ success: false, error: "Question not found" });
    }

    const answerText = question.expected_answer || "Réponse non disponible";

    const id = generateId();

    // 🔹 On enregistre aussi la réponse dans phase_answers
    db.prepare(
      `
      INSERT INTO phase_answers (id, team_id, question_id, phase, answer, points_spent)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    ).run(id, teamId, questionId, phase, answerText, pointsSpent);

    // 🔹 Déduire les points de l’équipe
    db.prepare("UPDATE teams SET points = points - ? WHERE id = ?").run(pointsSpent, teamId);

    // 🔹 Rafraîchir les données
    const teams = getFormattedTeams();
    const answers = db.prepare("SELECT * FROM phase_answers").all();

    io.emit("teams:updated", teams);
    io.emit("answers:updated", answers);

    callback?.({ success: true, questionId });
  } catch (error) {
    console.error("💥 Erreur achat réponse :", error);
    callback?.({ success: false, error: error.message });
  }
});



   socket.on('diagnosis:submit', async (data, callback) => {
  try {
    const { teamId, diagnosis } = data;

    // 1️⃣ Récupérer le cas actif
    const session = db.prepare('SELECT current_case_id FROM game_session WHERE id = 1').get();
    const caseId = session?.current_case_id || null;

    if (!caseId) {
      return callback({ success: false, error: "Aucun cas clinique actif" });
    }

    // 2️⃣ Générer un ID unique
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);

    // 3️⃣ INSERT correct compatible avec ta table
    db.prepare(`
      INSERT INTO phase5_responses (id, team_id, case_id, response_text, grade, feedback)
      VALUES (?, ?, ?, ?, 0, NULL)
    `).run(id, teamId, caseId, diagnosis);

    // 4️⃣ Récupérer toutes les réponses Phase 5
    const responses = db.prepare('SELECT * FROM phase5_responses').all();

    // 5️⃣ Notifier toutes les interfaces
    io.emit('diagnosis:updated', responses);

    callback({ success: true });
  } catch (error) {
    console.error("Erreur diagnosis:submit:", error);
    callback({ success: false, error: error.message });
  }
});


// === PHASE 6 : TRUE/FALSE ===

// Admin démarre la phase 6

socket.on('phase6:start', () => {
  // Réinitialiser les vies / scores à partir des settings
  const settings =
    db.prepare('SELECT time_per_question, lives_per_team FROM phase6_settings WHERE id = 1').get() ||
    { time_per_question: 15, lives_per_team: 3 };

  db.prepare(`
    UPDATE teams SET 
      phase6_lives = ?,
      phase6_score = 0,
      phase6_eliminated = 0
  `).run(settings.lives_per_team);

  // Mettre la session en phase 6, question index = 0
  db.prepare(`
    UPDATE game_session
    SET current_phase = 6,
        status = 'phase6',
        phase6_current_question = 0
    WHERE id = 1
  `).run();
  
  db.prepare('DELETE FROM phase6_answers').run();


  // Informer tout le monde que la phase 6 démarre
  const totalQuestions = db.prepare('SELECT COUNT(*) AS c FROM phase6_questions').get().c;
  io.emit('phase6:started', { totalQuestions });

  // Lancer la première question + timer global
  startPhase6Question(io);
});


// Une équipe répond
socket.on('phase6:answer', (data, callback) => {
  const { teamId, questionId, answer } = data;

  const q = db.prepare(`
    SELECT correct_answer FROM phase6_questions WHERE id = ?
  `).get(questionId);

  const correct = q.correct_answer === answer ? 1 : 0;

  db.prepare(`
    INSERT INTO phase6_answers (id, team_id, question_id, answer, is_correct)
    VALUES (?, ?, ?, ?, ?)
  `).run(generateId(), teamId, questionId, answer, correct);

  if (!correct) {
    db.prepare(`
      UPDATE teams SET phase6_lives = phase6_lives - 1 WHERE id = ?
    `).run(teamId);

    const t = db.prepare(`SELECT phase6_lives FROM teams WHERE id = ?`).get(teamId);
    if (t.phase6_lives <= 0) {
      db.prepare(`UPDATE teams SET phase6_eliminated = 1 WHERE id = ?`).run(teamId);
    }
  } else {
    db.prepare(`
      UPDATE teams SET phase6_score = phase6_score + 1 WHERE id = ?
    `).run(teamId);
  }

  const team = db.prepare(`SELECT * FROM teams WHERE id = ?`).get(teamId);
  io.emit('phase6:teamUpdated', team);
  io.to("admins").emit("phase6:adminUpdate", team);


  callback({ success: true, correct });
});

// Admin passe manuellement à la question suivante (override du timer)
socket.on('phase6:nextQuestion', () => {
  stopPhase6Timer();

  db.prepare(`
    UPDATE game_session
    SET phase6_current_question = phase6_current_question + 1
    WHERE id = 1
  `).run();

  startPhase6Question(io);
});


// Fin de phase (arrêt manuel)
socket.on('phase6:end', () => {
  stopPhase6Timer();
  const scores = db.prepare(`
    SELECT id, name, phase6_score, phase6_lives, phase6_eliminated
    FROM teams
    ORDER BY phase6_score DESC
  `).all();

  io.emit('phase6:finished', scores);
});




    socket.on('comment:submit', async (data, callback) => {
      try {
        const { teamId, comment } = data;

        const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
        db.prepare('INSERT INTO comments (id, team_id, comment, points_awarded) VALUES (?, ?, ?, ?)').run(id, teamId, comment, 0);

        const comments = db.prepare('SELECT * FROM comments').all();
        io.emit('comments:updated', comments);
        callback({ success: true });
      } catch (error) {
        callback({ error: error.message });
      }
    });

    socket.on('priseEnCharge:submit', async (data, callback) => {
      try {
        const { teamId, content } = data;

        const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
        db.prepare('INSERT INTO prise_en_charge (id, team_id, content, points_awarded) VALUES (?, ?, ?, ?)').run(id, teamId, content, 0);

        const prises = db.prepare('SELECT * FROM prise_en_charge').all();
        io.emit('priseEnCharge:updated', prises);
        callback({ success: true });
      } catch (error) {
        callback({ error: error.message });
      }
    });

    
// --- ADMIN : Démarrage du jeu ---
socket.on('admin:startGame', async (data, callback) => {
  try {
    debug('Starting game...');

    // 1️⃣ Récupérer le cas sélectionné
    const session = db.prepare(`SELECT current_case_id FROM game_session WHERE id = 1`).get();

    if (!session || !session.current_case_id) {
      return callback({ success: false, error: "Aucun cas sélectionné" });
    }

    const caseId = session.current_case_id;

    // 2️⃣ Récupérer tous les indices du cas (triés par date de création)
    const caseClues = db.prepare(`
      SELECT clue_text 
      FROM team_clues 
      WHERE case_id = ?
      ORDER BY created_at ASC
    `).all(caseId);

    if (caseClues.length === 0) {
      return callback({ success: false, error: "Aucun indice trouvé pour ce cas." });
    }

    // 3️⃣ Récupérer les équipes dans l'ordre
    const teams = db.prepare(`
      SELECT id 
      FROM teams 
      ORDER BY created_at ASC
    `).all();

    if (teams.length === 0) {
      return callback({ success: false, error: "Aucune équipe enregistrée." });
    }

    // 4️⃣ Distribuer les indices dans l'ordre
    teams.forEach((team, index) => {
      const clue = caseClues[index] ? caseClues[index].clue_text : null;
      db.prepare(`UPDATE teams SET clue = ? WHERE id = ?`).run(clue, team.id);
    });

    // 5️⃣ Mettre la session en phase 1
    db.prepare(`
      UPDATE game_session 
      SET status = 'phase1',
          current_phase = 1,
          is_buzz_phase = 0,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run();

    const updatedSession = db.prepare(`SELECT * FROM game_session WHERE id = 1`).get();

    // 6️⃣ Rafraîchir front-end
    io.emit('session:updated', updatedSession);

    const updatedTeams = getFormattedTeams();
    io.emit('teams:updated', updatedTeams);

    callback({ success: true });

  } catch (error) {
    debug('Error starting game:', error);
    callback({ error: error.message });
  }
});



// --- ADMIN : Passage à la phase suivante (avec phase Buzz automatique) ---
socket.on('admin:nextPhase', async (data, callback) => {
  try {
    const session = db.prepare('SELECT * FROM game_session WHERE id = 1').get();
    let { current_phase, status } = session;

    let isBuzzPhase = session.is_buzz_phase || 0;

    if (isBuzzPhase === 0) {
      // ⚡ Passage à une phase Buzz
      const buzzQuestion = db.prepare('SELECT * FROM buzz_questions ORDER BY RANDOM() LIMIT 1').get();

      if (buzzQuestion) {
        console.log(`⚡ Passage à phase Buzz : ${buzzQuestion.question}`);
        io.emit('buzz:newQuestion', {
          question: buzzQuestion.question,
          answer: buzzQuestion.answer,
        });
      }

      // ✅ Enregistrer "phase Buzz active"
      db.prepare(`
        UPDATE game_session 
        SET is_buzz_phase = 1, 
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = 1
      `).run();

      io.emit('session:updated', { ...session, is_buzz_phase: 1, status: 'buzz' });
      callback({ success: true, buzz: true });
      return;
    }

    // ✅ Passage à la phase normale suivante
    const nextPhase = current_phase + 1;
    if (nextPhase > 7) {
      db.prepare(`
        UPDATE game_session
        SET status = 'finished',
            current_phase = ?,
            is_buzz_phase = 0,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `).run(nextPhase);

      io.emit('session:updated', { status: 'finished', current_phase: nextPhase });
      return callback({ success: true });
    }

    const statusLabel = `phase${nextPhase}`;
    db.prepare(`
      UPDATE game_session
      SET current_phase = ?,
          status = ?,
          is_buzz_phase = 0,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(nextPhase, statusLabel);

    const updatedSession = db.prepare('SELECT * FROM game_session WHERE id = 1').get();
    io.emit('session:updated', updatedSession);

    // 🔁 notifier toutes les équipes
    const teams = getFormattedTeams();
    io.emit('teams:updated', teams);

    callback({ success: true, phase: nextPhase });
  } catch (error) {
    console.error('Erreur admin:nextPhase automatique Buzz:', error);
    callback({ error: error.message });
  }
});

// --- ADMIN : Réinitialisation du jeu complet ---
socket.on('admin:resetGame', async (data, callback) => {
  try {
    // 1️⃣ Supprimer uniquement les données dynamiques
    db.exec(`
      DELETE FROM team_members;
      DELETE FROM clue_exchanges;
      DELETE FROM phase_answers;
      DELETE FROM comments;
      DELETE FROM flash_answers;
      DELETE FROM prise_en_charge;
      DELETE FROM phase5_responses;
      DELETE FROM team_clues
      WHERE clue_cost = 0 OR is_piratable = 0;
  

      UPDATE teams SET 
        points = 100,
        clue = NULL;  -- reset de l’indice visible en phase 1
    `);

    // 2️⃣ Réinitialiser la session
    db.prepare(`
      UPDATE game_session
      SET status = 'lobby',
          current_phase = 0,
          is_buzz_phase = 0,
          current_case_id = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run();

    // 3️⃣ Notifier le front
    io.emit('game:reset');

    callback({ success: true });

  } catch (error) {
    console.error("Erreur resetGame:", error);
    callback({ success: false, error: error.message });
  }
});




// --- ADMIN : Attribution de points manuelle ---
socket.on('admin:awardPoints', async (data, callback) => {
  try {
    const { teamId, points } = data;
    if (!teamId || typeof points !== 'number') {
      return callback({ success: false, error: 'Données invalides' });
    }

    // ✅ Met à jour les points de l’équipe dans la base
    db.prepare(`UPDATE teams SET points = points + ? WHERE id = ?`).run(points, teamId);

    // ✅ Recharge la liste des équipes
    const teams = getFormattedTeams();

    // ✅ Émet la mise à jour en temps réel à tous les clients
    io.emit('teams:updated', teams);

    console.log(`🏅 ${points > 0 ? '+' : ''}${points} points attribués à ${teamId}`);
    callback({ success: true });
  } catch (error) {
    console.error('Erreur dans admin:awardPoints:', error);
    callback({ success: false, error: error.message });
  }
});


    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

function getFormattedTeams() {
  const rows = db.prepare(`
    SELECT
      t.id,
      t.name,
      t.points,
      t.clue,
      GROUP_CONCAT(tm.member_name) AS members,
      GROUP_CONCAT(
        (tc.id || ':::SEP:::' || IFNULL(tc.case_id, '') || ':::SEP:::' || tc.clue_text),
        '|||'
      ) AS raw_clues
    FROM teams t
    LEFT JOIN team_members tm ON t.id = tm.team_id
    LEFT JOIN team_clues tc ON t.id = tc.team_id
    GROUP BY t.id
  `).all();

  return rows.map(r => {
  const clues = r.raw_clues
  ? r.raw_clues.split('|||').map(part => {
      const [id, case_id, clue_text] = part.split(':::SEP:::');
      return { id, case_id: case_id || null, clue_text };
    })
  : [];

    return {
      id: r.id,
      name: r.name,
      points: r.points,
      clue: r.clue,
      members: r.members ? r.members.split(',') : [],
      clues,
    };
  });
}

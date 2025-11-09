import { db, generateId } from '../db/database.js';

export function setupSocketHandlers(io) {
  // Debug socket connections
  const DEBUG = true;
  const debug = (...args) => {
    if (DEBUG) console.log('[Socket]', ...args);
  };

  io.on('connection', (socket) => {
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

        db.prepare('UPDATE teams SET points = points - 10 WHERE id = ?').run(fromTeamId);

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
    const exchange = db.prepare('SELECT * FROM clue_exchanges WHERE id = ?').get(exchangeId);

    if (!exchange || exchange.status !== 'pending') {
      callback({ error: 'Invalid exchange' });
      return;
    }

    // Récupérer les indices actuels
    const fromTeam = db.prepare('SELECT id, clue FROM teams WHERE id = ?').get(exchange.from_team_id);
    const toTeam = db.prepare('SELECT id, clue FROM teams WHERE id = ?').get(exchange.to_team_id);

    if (!fromTeam || !toTeam) {
      callback({ error: 'Teams not found' });
      return;
    }

    if (!fromTeam.clue || !toTeam.clue) {
      callback({ error: 'One or both teams are missing a clue' });
      return;
    }

    // Échanger les indices
    const tempClue = fromTeam.clue;
    db.prepare('UPDATE teams SET clue = ? WHERE id = ?').run(toTeam.clue, fromTeam.id);
    db.prepare('UPDATE teams SET clue = ? WHERE id = ?').run(tempClue, toTeam.id);

    // Déduire 10 points à chaque équipe
    db.prepare('UPDATE teams SET points = points - 10 WHERE id IN (?, ?)').run(fromTeam.id, toTeam.id);

    // ✅ Correction ici : guillemets ajoutés
    db.prepare('UPDATE clue_exchanges SET status = "accepted", updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(exchangeId);

    const teams = getFormattedTeams();
    const exchanges = db.prepare('SELECT * FROM clue_exchanges').all();
    io.emit('teams:updated', teams);
    io.emit('exchanges:updated', exchanges);

    callback({ success: true });
  } catch (error) {
    console.error('Error in exchange:accept:', error);
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

    socket.on('clue:hack', async (data, callback) => {
      try {
        const { fromTeamId, targetTeamId } = data;

        const fromTeam = db.prepare('SELECT * FROM teams WHERE id = ?').get(fromTeamId);
        const targetTeam = db.prepare('SELECT * FROM teams WHERE id = ?').get(targetTeamId);

        if (!fromTeam || !targetTeam) {
          callback({ error: 'Team not found' });
          return;
        }

        if (fromTeam.points < 20) {
          callback({ error: 'Insufficient points' });
          return;
        }

        const fromRows = db.prepare('SELECT case_id, clue_text FROM team_clues WHERE team_id = ?').all(fromTeamId);
        const targetRows = db.prepare('SELECT case_id, clue_text FROM team_clues WHERE team_id = ?').all(targetTeamId);

        const targetSet = new Set(targetRows.map(r => `${r.case_id}:::${r.clue_text}`));
        const fromSet = new Set(fromRows.map(r => `${r.case_id}:::${r.clue_text}`));

        const insertStmt = db.prepare('INSERT INTO team_clues (id, team_id, case_id, clue_text, clue_cost, is_piratable) VALUES (?, ?, ?, ?, ?, ?)');
        const existsStmt = db.prepare('SELECT COUNT(*) as count FROM team_clues WHERE team_id = ? AND case_id = ? AND clue_text = ?');

        for (const item of targetSet) {
          if (!fromSet.has(item)) {
            const [caseId, clueText] = item.split(':::');
            const e = existsStmt.get(fromTeamId, caseId, clueText);
            if (!e || e.count === 0) {
              insertStmt.run(generateId(), fromTeamId, caseId, clueText, 0, 0);
            }
          }
        }

        db.prepare('UPDATE teams SET points = points - 20 WHERE id = ?').run(fromTeamId);

        const teams = getFormattedTeams();
        io.emit('teams:updated', teams);
        callback({ success: true });
      } catch (error) {
        callback({ error: error.message });
      }
    });

    socket.on('answer:buy', async (data, callback) => {
      try {
        const { teamId, phase, answer, pointsSpent } = data;

        const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
        if (!team || team.points < pointsSpent) {
          callback({ error: 'Insufficient points' });
          return;
        }

        const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
        db.prepare('INSERT INTO phase_answers (id, team_id, phase, answer, points_spent) VALUES (?, ?, ?, ?, ?)').run(id, teamId, phase, answer, pointsSpent);
        db.prepare('UPDATE teams SET points = points - ? WHERE id = ?').run(pointsSpent, teamId);

        const teams = getFormattedTeams();
        const answers = db.prepare('SELECT * FROM phase_answers').all();
        io.emit('teams:updated', teams);
        io.emit('answers:updated', answers);
        callback({ success: true });
      } catch (error) {
        callback({ error: error.message });
      }
    });

    socket.on('diagnosis:submit', async (data, callback) => {
      try {
        const { teamId, diagnosis } = data;

        const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
        db.prepare('INSERT INTO phase_answers (id, team_id, phase, answer, points_spent) VALUES (?, ?, ?, ?, ?)').run(id, teamId, 5, diagnosis, 0);

        const answers = db.prepare('SELECT * FROM phase_answers').all();
        io.emit('answers:updated', answers);
        callback({ success: true });
      } catch (error) {
        callback({ error: error.message });
      }
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

    socket.on('admin:startGame', async (data, callback) => {
      try {
        debug('Starting game...');
        db.prepare('UPDATE game_session SET status = ?, current_phase = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1').run('phase1', 1);
        const session = db.prepare('SELECT * FROM game_session WHERE id = 1').get();
        
        debug('Game started, emitting session update:', session);
        io.emit('session:updated', session);
        
        // Broadcast teams state at game start to ensure UI sync
        const teams = getFormattedTeams();
        io.emit('teams:updated', teams);
        
        callback({ success: true });
      } catch (error) {
        debug('Error starting game:', error);
        callback({ error: error.message });
      }
    });

    socket.on('admin:nextPhase', async (data, callback) => {
      try {
        debug('Advancing to next phase...');
        const session = db.prepare('SELECT * FROM game_session WHERE id = 1').get();
        const nextPhase = session.current_phase + 1;
        let status = `phase${nextPhase}`;

        if (nextPhase > 7) {
          status = 'finished';
        }

        debug(`Updating session: Phase ${session.current_phase} -> ${nextPhase}, Status: ${status}`);
        db.prepare('UPDATE game_session SET status = ?, current_phase = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1').run(status, nextPhase);

        const updatedSession = db.prepare('SELECT * FROM game_session WHERE id = 1').get();
        debug('Broadcasting session update:', updatedSession);
        io.emit('session:updated', updatedSession);

        // Broadcast teams state on phase change to ensure UI sync
        const teams = getFormattedTeams();
        io.emit('teams:updated', teams);
        
        callback({ success: true });
      } catch (error) {
        debug('Error advancing phase:', error);
        callback({ error: error.message });
      }
    });

    socket.on('admin:awardPoints', async (data, callback) => {
      try {
        const { teamId, points, commentId, priseId } = data;

        db.prepare('UPDATE teams SET points = points + ? WHERE id = ?').run(points, teamId);

        if (commentId) {
          db.prepare('UPDATE comments SET points_awarded = points_awarded + ? WHERE id = ?').run(points, commentId);
        }

        if (priseId) {
          db.prepare('UPDATE prise_en_charge SET points_awarded = points_awarded + ? WHERE id = ?').run(points, priseId);
        }

        const teams = getFormattedTeams();
        const comments = db.prepare('SELECT * FROM comments').all();
        const prises = db.prepare('SELECT * FROM prise_en_charge').all();
        io.emit('teams:updated', teams);
        io.emit('comments:updated', comments);
        io.emit('priseEnCharge:updated', prises);
        callback({ success: true });
      } catch (error) {
        callback({ error: error.message });
      }
    });

    socket.on('admin:resetGame', async (data, callback) => {
      try {
        db.exec(`
          DELETE FROM team_members;
          DELETE FROM clue_exchanges;
          DELETE FROM phase_answers;
          DELETE FROM comments;
          DELETE FROM flash_answers;
          DELETE FROM prise_en_charge;
          DELETE FROM teams;
          UPDATE game_session SET status = 'lobby', current_phase = 0, updated_at = CURRENT_TIMESTAMP WHERE id = 1;
        `);

        const clues = [
          "Femme de 28 ans",
          "Douleurs abdominales depuis 2 semaines",
          "Fièvre intermittente à 38.5°C",
          "Antécédents: appendicectomie il y a 3 ans"
        ];

        const teamNames = ['Équipe 1', 'Équipe 2', 'Équipe 3', 'Équipe 4'];
        const insertTeam = db.prepare('INSERT INTO teams (id, name, points, clue) VALUES (?, ?, ?, ?)');

        teamNames.forEach((name, index) => {
          const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
          insertTeam.run(id, name, 100, clues[index]);
        });

        io.emit('game:reset');
        callback({ success: true });
      } catch (error) {
        callback({ error: error.message });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

function getFormattedTeams() {
  const teams = db.prepare(`
    SELECT
      t.id,
      t.name,
      t.points,
      t.clue,
      GROUP_CONCAT(tm.member_name) as members
    FROM teams t
    LEFT JOIN team_members tm ON t.id = tm.team_id
    GROUP BY t.id
  `).all();

  return teams.map(team => ({
    id: team.id,
    name: team.name,
    points: team.points,
    clue: team.clue,
    members: team.members ? team.members.split(',') : []
  }));
}

import express from 'express';
import { db, generateId } from '../db/database.js';


const router = express.Router();



router.get('/', (req, res) => {
  try {
    const exchanges = db.prepare('SELECT * FROM clue_exchanges ORDER BY created_at DESC').all();
    res.json(exchanges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  const { fromTeamId, toTeamId } = req.body;

  if (!fromTeamId || !toTeamId) {
    return res.status(400).json({ error: 'fromTeamId and toTeamId are required' });
  }

  if (fromTeamId === toTeamId) {
    return res.status(400).json({ error: 'Cannot exchange with the same team' });
  }

  try {
    const settings = db.prepare('SELECT exchange_cost FROM game_settings WHERE id = 1').get();
    const exchangeCost = settings ? settings.exchange_cost : 10;

    const fromTeam = db.prepare('SELECT points FROM teams WHERE id = ?').get(fromTeamId);
    if (!fromTeam) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (fromTeam.points < exchangeCost) {
      return res.status(400).json({ error: 'Insufficient points for exchange' });
    }

    const id = generateId();
    db.prepare('INSERT INTO clue_exchanges (id, from_team_id, to_team_id, status) VALUES (?, ?, ?, ?)').run(id, fromTeamId, toTeamId, 'pending');

    const exchange = db.prepare('SELECT * FROM clue_exchanges WHERE id = ?').get(id);

    // ✅ AJOUTE CE BLOC POUR NOTIFIER LE FRONT
    if (typeof io !== "undefined") {
      io.emit("exchanges:updated", db.prepare("SELECT * FROM clue_exchanges").all());
    }

    res.json(exchange);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ✅ Route : accepter un échange d'indice (échange réel dans team_clues)
router.post('/:id/accept', (req, res) => {
  const { id } = req.params;

  try {
    const exchange = db.prepare('SELECT * FROM clue_exchanges WHERE id = ?').get(id);
    if (!exchange) {
      return res.status(404).json({ error: 'Exchange not found' });
    }

    if (exchange.status !== 'pending') {
      return res.status(400).json({ error: 'Exchange is not pending' });
    }

    const settings = db.prepare('SELECT exchange_cost FROM game_settings WHERE id = 1').get();
    const exchangeCost = settings ? settings.exchange_cost : 10;

    const fromTeam = db.prepare('SELECT id, points FROM teams WHERE id = ?').get(exchange.from_team_id);
    const toTeam   = db.prepare('SELECT id, points FROM teams WHERE id = ?').get(exchange.to_team_id);

    if (!fromTeam || !toTeam) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Vérification des points disponibles
    if (fromTeam.points < exchangeCost || toTeam.points < exchangeCost) {
      return res.status(400).json({ error: 'Insufficient points for one of the teams' });
    }

    // --- ÉCHANGER les indices réels (table team_clues) ---
    const fromClues = db.prepare('SELECT case_id, clue_text, clue_cost, is_piratable FROM team_clues WHERE team_id = ?').all(fromTeam.id);
    const toClues   = db.prepare('SELECT case_id, clue_text, clue_cost, is_piratable FROM team_clues WHERE team_id = ?').all(toTeam.id);

    // Supprimer les anciens indices
    db.prepare('DELETE FROM team_clues WHERE team_id IN (?, ?)').run(fromTeam.id, toTeam.id);

    // Réinsérer les indices échangés
    const insertStmt = db.prepare(`
      INSERT INTO team_clues (id, team_id, case_id, clue_text, clue_cost, is_piratable)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const clue of fromClues) {
      insertStmt.run(generateId(), toTeam.id, clue.case_id, clue.clue_text, clue.clue_cost, clue.is_piratable);
    }
    for (const clue of toClues) {
      insertStmt.run(generateId(), fromTeam.id, clue.case_id, clue.clue_text, clue.clue_cost, clue.is_piratable);
    }

    // --- Déduire 10 points à chaque équipe ---
    db.prepare('UPDATE teams SET points = points - ? WHERE id IN (?, ?)').run(exchangeCost, fromTeam.id, toTeam.id);

    // --- Marquer l’échange comme accepté ---
    db.prepare('UPDATE clue_exchanges SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('accepted', id);

    // --- Rafraîchir les données et envoyer au front (si Socket.io est dispo) ---
    const updatedExchange = db.prepare('SELECT * FROM clue_exchanges WHERE id = ?').get(id);
   const teams = db.prepare(`
    SELECT
    t.id,
    t.name,
    t.points,
    json_group_array(json_object(
      'id', tc.id,
      'case_id', tc.case_id,
      'clue_text', tc.clue_text,
      'clue_cost', tc.clue_cost,
      'is_piratable', tc.is_piratable
    )) AS clues
     FROM teams t
     LEFT JOIN team_clues tc ON t.id = tc.team_id
     GROUP BY t.id
        `).all();

      teams.forEach((team) => {
  team.clues = team.clues ? JSON.parse(team.clues) : [];
});

 if (typeof io !== 'undefined') {
      io.emit('teams:updated', teams);
      io.emit('exchanges:updated', db.prepare('SELECT * FROM clue_exchanges').all());
    }

    res.json(updatedExchange);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// ✅ Route : refus de l’échange ("X") — aucun point perdu
router.post('/:id/reject', (req, res) => {
  const { id } = req.params;

  try {
    const exchange = db.prepare('SELECT * FROM clue_exchanges WHERE id = ?').get(id);
    if (!exchange) {
      return res.status(404).json({ error: 'Exchange not found' });
    }

    if (exchange.status !== 'pending') {
      return res.status(400).json({ error: 'Exchange is not pending' });
    }

    // --- Marquer simplement l’échange comme refusé ---
    db.prepare('UPDATE clue_exchanges SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('rejected', id);

    const updatedExchange = db.prepare('SELECT * FROM clue_exchanges WHERE id = ?').get(id);
    res.json(updatedExchange);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route : pirater un indice (voir l'indice de la cible sans le modifier)
router.post('/hack', (req, res) => {
  try {
    const { from_team_id, target_team_id } = req.body;
    if (!from_team_id || !target_team_id) {
      return res.status(400).json({ error: 'Missing from_team_id or target_team_id' });
    }

    // lire coût hack depuis settings
    const settings = db.prepare('SELECT hack_cost FROM game_settings WHERE id = 1').get();
    const hackCost = settings ? settings.hack_cost : 20;

    const fromTeam = db.prepare('SELECT id, points FROM teams WHERE id = ?').get(from_team_id);
    const toTeam   = db.prepare('SELECT id FROM teams WHERE id = ?').get(target_team_id);

    if (!fromTeam || !toTeam) return res.status(404).json({ error: 'Team not found' });

    if (fromTeam.points < hackCost) return res.status(400).json({ error: 'Insufficient points' });

    // choisir un indice piratable de la cible (premier disponible)
    const clue = db.prepare(`
      SELECT id, case_id, clue_text, clue_cost, is_piratable
      FROM team_clues
      WHERE team_id = ? AND is_piratable = 1
      ORDER BY created_at ASC
      LIMIT 1
    `).get(target_team_id);

    if (!clue) {
      return res.status(404).json({ error: 'No piratable clue available for target team' });
    }

    // Retirer les points au pirate (de façon définitive)
    db.prepare('UPDATE teams SET points = points - ? WHERE id = ?').run(hackCost, fromTeam.id);

    // NOTA : on NE modifie PAS team_clues de la cible (c'est juste une vue)
    // Si tu veux que le pirate garde l'indice (persistant), on pourrait INSERT dans team_clues pour fromTeam.id.
    // Exemple (commenté) :
    // db.prepare('INSERT INTO team_clues (id, team_id, case_id, clue_text, clue_cost, is_piratable) VALUES (?, ?, ?, ?, ?, ?)')
    //   .run(generateId(), fromTeam.id, clue.case_id, clue.clue_text, clue.clue_cost, 0);

    // Mettre à jour l'état des équipes (points) et émettre vers le front
    if (typeof io !== 'undefined') {
  const teams = db.prepare(`
   SELECT
   t.id,
   t.name,
   t.points,
   json_group_array(json_object(
    'id', tc.id,
    'case_id', tc.case_id,
    'clue_text', tc.clue_text,
    'clue_cost', tc.clue_cost,
    'is_piratable', tc.is_piratable
   )) AS clues
  FROM teams t
  LEFT JOIN team_clues tc ON t.id = tc.team_id
  GROUP BY t.id
  `).all();

  teams.forEach((team) => {
    team.clues = team.clues ? JSON.parse(team.clues) : [];
  });

  io.emit('teams:updated', teams);
  io.emit('hack:done', { from_team_id: fromTeam.id, target_team_id, clue_text: clue.clue_text });
}


    return res.json({ success: true, clue: { text: clue.clue_text, case_id: clue.case_id }, hackCost });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});




export default router;

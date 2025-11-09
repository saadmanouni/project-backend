import express from 'express';
import { db, generateId } from '../db/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const teams = db.prepare(`
      SELECT
        t.id,
        t.name,
        t.points,
        GROUP_CONCAT(tm.member_name) as members
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      GROUP BY t.id
    `).all();

    const formattedTeams = teams.map(team => ({
      id: team.id,
      name: team.name,
      points: team.points,
      members: team.members ? team.members.split(',') : []
    }));

    res.json(formattedTeams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const team = db.prepare('SELECT id, name, points, created_at FROM teams WHERE id = ?').get(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const members = db.prepare('SELECT member_name FROM team_members WHERE team_id = ?').all(req.params.id);
    team.members = members.map(m => m.member_name);

    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/join', (req, res) => {
  const { memberName } = req.body;
  const { id } = req.params;

  if (!memberName || !memberName.trim()) {
    return res.status(400).json({ error: 'Member name is required' });
  }

  try {
    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const memberCount = db.prepare('SELECT COUNT(*) as count FROM team_members WHERE team_id = ?').get(id);
    if (memberCount.count >= 3) {
      return res.status(400).json({ error: 'Team is full' });
    }

    db.prepare('INSERT INTO team_members (team_id, member_name) VALUES (?, ?)').run(id, memberName.trim());

    const members = db.prepare('SELECT member_name FROM team_members WHERE team_id = ?').all(id);
    team.members = members.map(m => m.member_name);

    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/update-points', (req, res) => {
  const { points } = req.body;
  const { id } = req.params;

  if (typeof points !== 'number') {
    return res.status(400).json({ error: 'Points must be a number' });
  }

  try {
    db.prepare('UPDATE teams SET points = points + ? WHERE id = ?').run(points, id);
    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(id);
    const members = db.prepare('SELECT member_name FROM team_members WHERE team_id = ?').all(id);
    team.members = members.map(m => m.member_name);

    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

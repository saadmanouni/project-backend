import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db/database.js';
import teamsRouter from './routes/teams.js';
import exchangesRouter from './routes/exchanges.js';
import cluesRouter from './routes/clues.js';
import answersRouter from './routes/answers.js';
import commentsRouter from './routes/comments.js';
import sessionRouter from './routes/session.js';
import priseEnChargeRouter from './routes/priseEnCharge.js';
import casesRouter from './routes/cases.js';
import settingsRouter from './routes/settings.js';
import questionsRouter from './routes/questions.js';
import buzzRouter from './routes/buzz.js';
import teamCluesRouter from './routes/teamClues.js';
import { setupSocketHandlers } from './socket/socketHandler.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Initialize database and seed initial data
await initializeDatabase();

app.use('/api/teams', teamsRouter);
app.use('/api/exchanges', exchangesRouter);
app.use('/api/clues', cluesRouter);
app.use('/api/answers', answersRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/session', sessionRouter);
app.use('/api/prise-en-charge', priseEnChargeRouter);
app.use('/api/cases', casesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/buzz', buzzRouter);
app.use('/api/team-clues', teamCluesRouter);

setupSocketHandlers(io);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io ready for connections`);
});

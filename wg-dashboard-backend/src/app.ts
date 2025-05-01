import express from 'express';
import cors from 'cors';
import { authMiddleware } from './middleware/auth';
import healthRouter from './routes/health';
import serversListRouter from './routes/serversList';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Health route doesn't need auth
app.use('/health', healthRouter);

// All other routes require authentication
app.use(authMiddleware);

// Servers list endpoint
app.use('/servers-list', serversListRouter);
// Also map the /servers endpoint to the same router
app.use('/servers', serversListRouter);

export default app; 
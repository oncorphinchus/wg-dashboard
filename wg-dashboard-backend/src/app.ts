import express from 'express';
import cors from 'cors';
import { authMiddleware } from './middleware/auth';
import healthRouter from './routes/health';
import serversListRouter from './routes/serversList';
import { serversRouter } from './routes/servers';

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
// Also map the /servers endpoint to the same router for list functionality
app.use('/servers', serversListRouter);
// Add the servers router with its specific endpoints (like status)
app.use('/api/servers', serversRouter);

export default app; 
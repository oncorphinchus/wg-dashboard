import express from 'express';
import cors from 'cors';
import { authMiddleware } from './middleware/auth';
import healthRouter from './routes/health';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Health route doesn't need auth
app.use('/health', healthRouter);

// All other routes require authentication
app.use(authMiddleware);

export default app; 
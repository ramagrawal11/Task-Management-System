import express, { Application, Request, Response } from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { generalLimiter } from './middleware/rateLimit';
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import commentRoutes from './routes/comments';
import fileRoutes from './routes/files';
import analyticsRoutes from './routes/analytics';

dotenv.config();

const app: Application = express();

app.use(express.json());
app.use(morgan('dev'));

app.use('/api', generalLimiter);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;


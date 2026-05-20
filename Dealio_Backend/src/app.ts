import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/authRoutes';
import builderRoutes from './routes/builderRoutes';
import customerRoutes from './routes/customerRoutes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
// morgan is noisy in tests, maybe skip it or use a different format
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Dealio Backend is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/builder', builderRoutes);
app.use('/api/portal', builderRoutes);
app.use('/api/customer', customerRoutes);

export default app;

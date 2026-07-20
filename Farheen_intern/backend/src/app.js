import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import routes from './routes/index.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Explicit GET to ensure some proxies/clients reaching '/api-docs' (without trailing slash)
// receive the UI HTML directly instead of relying on a redirect.
app.get('/api-docs', (_req, res) => {
  try {
    const html = swaggerUi.generateHTML(swaggerSpec, { explorer: true });
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to render API docs' });
  }
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(helmet());
const allowedOrigins = [env.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Too many requests, please try again later' },
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads');

app.use('/api', routes);
app.use('/uploads', express.static(uploadsDir));

app.use(notFound);
app.use(errorHandler);

export default app;

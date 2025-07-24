import express from 'express';
import cors from 'cors';
import config from './config/config.js';
import apiRoutes from './routes/api.js';

const app = express();

app.use(cors({
  origin: [config.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    timestamp: new Date().toISOString(),
    apis_configured: {
      tpapps: !!config.TPAPPS_API_URL,
      dikshank: !!config.DIKSHANK_API_URL
    },
  });
});

app.use('/api', apiRoutes);

app.listen(config.PORT, () => {
  console.log(`🚀 Server running on port ${config.PORT}`);
});

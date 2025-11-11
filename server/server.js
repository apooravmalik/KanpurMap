// server/server.js

import express from 'express';
import cors from 'cors';
import config from './config/config.js';
import apiRoutes from './routes/api.js';
import { connectToDb } from './config/database.js';

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
      dikshank: !!config.DIKSHANK_API_URL,
      arcgis_mapserver: !!config.MAPSERVER_URL
    },
  });
});

app.use('/api', apiRoutes);

// 2. CONNECT TO DB, THEN START SERVER
connectToDb().then(() => {
  // This code runs only after the DB connection is successful
  app.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
  });
}).catch(err => {
  // This code runs if the DB connection fails
  console.error('Failed to connect to DB, server not started.', err);
  process.exit(1); // Exit the process with an error
});
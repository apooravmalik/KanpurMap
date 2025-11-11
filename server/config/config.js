import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
  DIKSHANK_API_URL: process.env.DIKSHANK_API_URL || '',
  MAPSERVER_URL: process.env.MAPSERVER_URL || '',
  TPAPPS_API_URL: process.env.TPAPPS_API_URL || '',
  DB_DRIVER: process.env.DB_DRIVER || 'sqlite',
  DB_SERVER: process.env.DB_SERVER || 'APOORAV_MALIK',
  DB_DATABASE: process.env.DB_DATABASE || "TEST",
  DB_USERNAME: process.env.DB_USERNAME || "sa",
  DB_PASSWORD: process.env.DB_PASSWORD || " ",
  DB_TRUST_CERT: process.env.DB_TRUST_CERT || "yes",
  PORT: process.env.PORT || 5000,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173'
};

export default config;

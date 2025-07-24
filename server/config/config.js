import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
  DIKSHANK_API_URL: process.env.DIKSHANK_API_URL || '',
  PORT: process.env.PORT || 5000,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173'
};

export default config;

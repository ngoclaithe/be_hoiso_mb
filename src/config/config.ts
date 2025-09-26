import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUD_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUD_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
};

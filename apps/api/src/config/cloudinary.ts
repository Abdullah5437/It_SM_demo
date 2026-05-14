import { v2 as cloudinary } from 'cloudinary';


// Extend env to include Cloudinary variables
// These should be added to .env
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dg1asf18t';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '653718954316255';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'PLorjKtpNEojlcRypQxrr-MCem0';

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

export default cloudinary;
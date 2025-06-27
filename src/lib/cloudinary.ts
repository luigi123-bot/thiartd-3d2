import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// No necesitas instalar @types/cloudinary, cloudinary ya incluye sus propios tipos.
// Si usas TypeScript y ves advertencias, puedes ignorarlas o instalar cloudinary así:
// npm install cloudinary

export default cloudinary;

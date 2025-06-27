import type { NextApiRequest, NextApiResponse } from 'next';
import cloudinary from '~/lib/cloudinary';
import { IncomingForm } from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const form = new IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error parsing form:", err);
      return res.status(500).json({ error: 'Error parsing form' });
    }

    const file = files.file as any;
    if (!file) {
      console.error("No file uploaded");
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Validación de tipo MIME y tamaño
    const mime = file.mimetype || file.type;
    const size = file.size;
    console.log("Archivo recibido:", { name: file.originalFilename, mime, size });

    if (!ALLOWED_MIME.includes(mime)) {
      console.error("Tipo de archivo no permitido:", mime);
      return res.status(400).json({ error: "Tipo de archivo no permitido" });
    }
    if (size > MAX_SIZE) {
      console.error("Archivo demasiado grande:", size);
      return res.status(400).json({ error: "El archivo es demasiado grande (máx 5MB)" });
    }

    try {
      const result = await cloudinary.uploader.upload(file.filepath, {
        folder: 'my_uploads', // opcional
      });
      console.log("Imagen subida a Cloudinary:", result.secure_url);
      res.status(200).json({ url: result.secure_url });
    } catch (uploadError) {
      console.error("Error subiendo a Cloudinary:", uploadError);
      res.status(500).json({ error: "Error subiendo la imagen" });
    }
  });
}

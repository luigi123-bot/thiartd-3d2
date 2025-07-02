import type { NextApiRequest, NextApiResponse } from 'next';
import cloudinary from '~/lib/cloudinary';
import { IncomingForm } from 'formidable';


export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const form = new IncomingForm();

  interface UploadedFile {
    filepath: string;
    mimetype?: string;
    type?: string;
    size: number;
    originalFilename?: string;
  }

  form.parse(req, (err, files) => {
    void (async () => {
      if (err) {
        console.error("Error parsing form:", err);
        res.status(500).json({ error: 'Error parsing form' });
        return;
      }

      const file = (files.file as UploadedFile | UploadedFile[] | undefined);
      const singleFile: UploadedFile | undefined = Array.isArray(file) ? file[0] : file;

      if (!singleFile) {
        console.error("No file uploaded");
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      // Validación de tipo MIME y tamaño
      const mime: string = singleFile.mimetype ?? singleFile.type ?? '';
      const size: number = singleFile.size;
      console.log("Archivo recibido:", { name: singleFile.originalFilename, mime, size });

      if (!ALLOWED_MIME.includes(mime)) {
        console.error("Tipo de archivo no permitido:", mime);
        res.status(400).json({ error: "Tipo de archivo no permitido" });
        return;
      }
      if (size > MAX_SIZE) {
        console.error("Archivo demasiado grande:", size);
        res.status(400).json({ error: "El archivo es demasiado grande (máx 5MB)" });
        return;
      }

      try {
        const result = await cloudinary.uploader.upload(singleFile.filepath, {
          folder: 'my_uploads', // opcional
        });
        console.log("Imagen subida a Cloudinary:", result.secure_url);
        res.status(200).json({ url: result.secure_url });
      } catch (uploadError) {
        console.error("Error subiendo a Cloudinary:", uploadError);
        res.status(500).json({ error: "Error subiendo la imagen" });
      }
    })();
  });
}

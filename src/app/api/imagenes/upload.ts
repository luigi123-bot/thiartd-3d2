import type { NextApiRequest, NextApiResponse } from 'next';
import cloudinary from '~/lib/cloudinary';
import type formidable from 'formidable';
import { IncomingForm } from 'formidable';


export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const form = new IncomingForm();

  type UploadedFile = {
    filepath: string;
    originalFilename?: string;
    mimetype?: string;
    size?: number;
  };

  const parseForm = (): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
    return new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err instanceof Error ? err : new Error(String(err)));
        resolve({ fields, files });
      });
    });
  };

  try {
    const { files } = await parseForm();
    const file = (files.file as UploadedFile | UploadedFile[]);

    // Handle both single and multiple file uploads
    const uploadedFile = Array.isArray(file) ? file[0] : file;

    if (!uploadedFile?.filepath) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await cloudinary.uploader.upload(uploadedFile.filepath, {
      folder: 'my_uploads', // opcional
    });

    res.status(200).json({ url: result.secure_url });
  } catch (error) {
    res.status(500).json({ error: 'Error parsing form', details: error instanceof Error ? error.message : String(error) });
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import cloudinary from '~/lib/cloudinary';
import { IncomingForm } from 'formidable';


export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const form = new IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Error parsing form' });

    const file = files.file as any;

    const result = await cloudinary.uploader.upload(file.filepath, {
      folder: 'my_uploads', // opcional
    });

    res.status(200).json({ url: result.secure_url });
  });
}

import { NextResponse } from 'next/server';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';

// Set up multer for file upload
const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(process.cwd(), 'public/uploads'), // Directory to save files
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
});

// Define the API route handler
export async function POST(request: Request) {
  // Parse form-data
  const formData = await request.formData();
  const file = formData.get('file') as Blob;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  // Save file to the server
  const filename = `${Date.now()}-${file.name}`;
  const filePath = path.join(process.cwd(), 'public/uploads', filename);

  // Convert Blob to Buffer and save it
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return NextResponse.json({ message: 'File uploaded successfully', filename });
}

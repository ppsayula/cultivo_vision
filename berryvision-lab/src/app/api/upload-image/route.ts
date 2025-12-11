// BerryVision AI - Image Upload API
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const filename = `training_${timestamp}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    // Save file
    await writeFile(filepath, buffer);

    // Return public URL
    const imageUrl = `/uploads/${filename}`;

    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { success: false, error: 'Error uploading image' },
      { status: 500 }
    );
  }
}

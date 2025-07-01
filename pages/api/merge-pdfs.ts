import type { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import PDFMerger from 'pdf-merger-js';
import fs from 'fs';
import path from 'path';
import { getAuth } from '@clerk/nextjs/server';
import { connectToDatabase, canUserMerge, incrementUserGenerations, getUserDailyGenerations, getUserGenerations, isUserPro } from '../../lib/mongodb';

// Configure multer for file uploads
const upload = multer({
  dest: '/tmp/uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

const uploadMiddleware = upload.array('pdfs', 10); // Allow up to 10 files

// Disable default body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

function runMiddleware(req: any, res: any, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user authentication
    const { userId } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is pro
    const isPro = await isUserPro(userId);
    
    // Check if user can merge PDFs
    const canMerge = await canUserMerge(userId, isPro);
    
    if (!canMerge) {
      const dailyGenerations = await getUserDailyGenerations(userId);
      const totalGenerations = await getUserGenerations(userId);
      return res.status(403).json({ 
        error: 'Daily limit exceeded', 
        message: 'You have used all 5 free merges for today. Please upgrade to Pro for unlimited merges or try again tomorrow.',
        dailyGenerations,
        totalGenerations,
        maxFreeDailyMerges: 5,
        resetTime: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
      });
    }

    // Run multer middleware
    await runMiddleware(req, res, uploadMiddleware);

    const files = (req as any).files;
    
    if (!files || files.length < 2) {
      return res.status(400).json({ error: 'At least 2 PDF files are required' });
    }
      await merger.add(file.path);
    }

    // Generate output filename
    const outputPath = path.join('/tmp', `merged-${Date.now()}.pdf`);
    
    // Save merged PDF
    await merger.save(outputPath);

    // Read the merged PDF
    const mergedPdf = fs.readFileSync(outputPath);

    // Clean up uploaded files
    files.forEach((file: any) => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });

    // Clean up merged file
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    // Increment user generations after successful merge
    await incrementUserGenerations(userId);

    // Send the merged PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="merged.pdf"');
    res.send(mergedPdf);

  } catch (error) {
    console.error('Error merging PDFs:', error);
    res.status(500).json({ error: 'Failed to merge PDFs' });
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';  
import multer from 'multer';  
import PDFMerger from 'pdf-merger-js';  
import fs from 'fs';  
import path from 'path';  
import { getAuth } from '@clerk/nextjs/server';  
import { connectToDatabase } from '../../lib/mongodb';  
  
// Configure multer for file uploads  
const upload = multer({  
  storage: multer.diskStorage({  
    destination: '/tmp/uploads',  
    filename: (req, file, cb) => {  
      cb(null, `${Date.now()}-${file.originalname}`);  
    }  
  }),  
  limits: {  
    fileSize: 50 * 1024 * 1024, // 50MB per file  
    files: 10 // Maximum 10 files  
  },  
  fileFilter: (req, file, cb) => {  
    if (file.mimetype === 'application/pdf') {  
      cb(null, true);  
    } else {  
      cb(new Error('Only PDF files are allowed'));  
    }  
  }  
});  
  
// Middleware to handle multipart/form-data  
const runMiddleware = (req: NextApiRequest, res: NextApiResponse, fn: any) => {  
  return new Promise((resolve, reject) => {  
    fn(req, res, (result: any) => {  
      if (result instanceof Error) {  
        return reject(result);  
      }  
      return resolve(result);  
    });  
  });  
};  
  
// Ensure upload directory exists  
const uploadDir = '/tmp/uploads';  
if (!fs.existsSync(uploadDir)) {  
  fs.mkdirSync(uploadDir, { recursive: true });  
}  
  
export const config = {  
  api: {  
    bodyParser: false,  
  },  
};  
  
export default async function handler(req: NextApiRequest, res: NextApiResponse) {  
  if (req.method !== 'POST') {  
    return res.status(405).json({ error: 'Method not allowed' });  
  }  
  
  try {  
    // Authenticate user  
    const { userId } = getAuth(req);  
    if (!userId) {  
      return res.status(401).json({   
        error: 'Unauthorized',  
        message: 'You must be signed in to merge PDFs'  
      });  
    }  
  
    // Connect to database  
    const { db } = await connectToDatabase();  
  
    // Check user's merge limits  
    const user = await db.collection('users').findOne({ userId });  
    const isProUser = user?.status === 'active' && user?.paypalSubscriptionId;  
    const maxDailyMerges = isProUser ? Infinity : 5;  
  
    // Calculate current daily merges  
    const today = new Date();  
    today.setHours(0, 0, 0, 0);  
      
    let currentDailyMerges = 0;  
    if (user && user.lastUsed) {  
      const lastUsedDate = new Date(user.lastUsed);  
      lastUsedDate.setHours(0, 0, 0, 0);  
        
      if (lastUsedDate.getTime() === today.getTime()) {  
        currentDailyMerges = user.dailyMerges || 0;  
      }  
    }  
  
    if (!isProUser && currentDailyMerges >= maxDailyMerges) {  
      const resetTime = new Date();  
      resetTime.setHours(24, 0, 0, 0); // Midnight reset  
        
      return res.status(429).json({  
        error: 'Daily limit exceeded',  
        message: `You've reached your ${maxDailyMerges} free merges for today`,  
        dailyLimitReached: true,  
        resetTime: resetTime.toISOString()  
      });  
    }  
  
    // Process file upload  
    await runMiddleware(req, res, upload.array('files'));  
  
    const files = (req as any).files;  
    if (!files || files.length < 2) {  
      return res.status(400).json({  
        error: 'Invalid request',  
        message: 'At least 2 PDF files are required for merging'  
      });  
    }  
  
    // Verify total size doesn't exceed 100MB  
    const totalSize = files.reduce((sum: number, file: any) => sum + file.size, 0);  
    if (totalSize > 100 * 1024 * 1024) {  
      throw new Error('Total file size exceeds 100MB limit');  
    }  
  
    // Merge PDFs  
    const merger = new PDFMerger();  
    for (const file of files) {  
      await merger.add(file.path);  
    }  
  
    // Generate output file  
    const outputFileName = `merged-${Date.now()}.pdf`;  
    const outputPath = path.join('/tmp', outputFileName);  
    await merger.save(outputPath);  
  
    // Read the merged PDF  
    const mergedPdf = fs.readFileSync(outputPath);  
  
    // Update user's merge count with consistent field names  
    const newDailyMerges = currentDailyMerges + 1;  
    await db.collection('users').updateOne(  
      { userId },  
      {  
        $inc: {   
          totalMerges: 1  
        },  
        $set: {  
          dailyMerges: newDailyMerges,  
          lastUsed: new Date()  
        },  
        $setOnInsert: {  
          createdAt: new Date()  
        }  
      },  
      { upsert: true }  
    );  
  
    // Clean up temporary files  
    files.forEach((file: any) => {  
      try {  
        fs.unlinkSync(file.path);  
      } catch (err) {  
        console.error(`Error deleting temp file ${file.path}:`, err);  
      }  
    });  
  
    fs.unlinkSync(outputPath);  
  
    // Return the merged PDF  
    res.setHeader('Content-Type', 'application/pdf');  
    res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);  
    return res.send(mergedPdf);  
  
  } catch (error) {  
    console.error('PDF merge error:', error);  
  
    // Clean up any uploaded files if error occurred  
    if ((req as any).files) {  
      (req as any).files.forEach((file: any) => {  
        try {  
          if (fs.existsSync(file.path)) {  
            fs.unlinkSync(file.path);  
          }  
        } catch (err) {  
          console.error('Error cleaning up temp file:', err);  
        }  
      });  
    }  
  
    const errorMessage = error instanceof Error ? error.message : 'Failed to merge PDFs';  
    return res.status(500).json({  
      error: 'Merge failed',  
      message: errorMessage  
    });  
  }  
                  }

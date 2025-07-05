import { NextApiRequest, NextApiResponse } from 'next';  
import { getAuth } from '@clerk/nextjs/server';  
import { connectToDatabase } from '../../lib/mongodb';  
  
export default async function handler(req: NextApiRequest, res: NextApiResponse) {  
  if (req.method !== 'GET') {  
    return res.status(405).json({ error: 'Method not allowed' });  
  }  
  
  try {  
    const { userId } = getAuth(req);  
    if (!userId) {  
      return res.status(401).json({ error: 'Unauthorized' });  
    }  
  
    const { db } = await connectToDatabase();  
    const user = await db.collection('users').findOne({ userId });  
  
    // Calculate daily generations based on last used date  
    const today = new Date();  
    today.setHours(0, 0, 0, 0);  
      
    let dailyGenerations = 0;  
    if (user && user.lastUsed) {  
      const lastUsedDate = new Date(user.lastUsed);  
      lastUsedDate.setHours(0, 0, 0, 0);  
        
      if (lastUsedDate.getTime() === today.getTime()) {  
        dailyGenerations = user.dailyMerges || 0;  
      }  
    }  
  
    return res.status(200).json({  
      totalGenerations: user?.totalMerges || 0, // Consistent field naming  
      dailyGenerations: dailyGenerations,  
      subscriptionStatus: user?.subscriptionStatus || 'free'  
    });  
  
  } catch (error) {  
    console.error('Error fetching user data:', error);  
    return res.status(500).json({ error: 'Internal server error' });  
  }  
      }

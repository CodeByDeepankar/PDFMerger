import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { connectToDatabase, getUserDailyGenerations, getUserGenerations, isUserPro } from '../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await connectToDatabase();
    
    const dailyGenerations = await getUserDailyGenerations(userId);
    const totalGenerations = await getUserGenerations(userId);
    const isPro = await isUserPro(userId);

    res.status(200).json({
      dailyGenerations,
      totalGenerations,
      isPro
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
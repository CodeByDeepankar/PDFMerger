
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { getUserGenerations, canUserMerge, isUserPro } from '../../lib/mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const generations = await getUserGenerations(userId);
    const isPro = await isUserPro(userId);
    const canMerge = await canUserMerge(userId, isPro);
    
    res.status(200).json({
      userId,
      generations,
      maxFreeGenerations: 1,
      canMerge,
      needsUpgrade: !canMerge && !isPro,
      isPro
    });

  } catch (error) {
    console.error('Error getting user status:', error);
    res.status(500).json({ error: 'Failed to get user status' });
  }
}

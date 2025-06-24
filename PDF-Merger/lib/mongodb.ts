
import { MongoClient, Db } from 'mongodb';

let client: MongoClient;
let db: Db;

export async function connectToDatabase() {
  if (db) {
    return { client, db };
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db('pdfs');
    
    console.log('Connected to MongoDB');
    return { client, db };
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

export async function getUserGenerations(userId: string) {
  const { db } = await connectToDatabase();
  const user = await db.collection('users').findOne({ userId });
  return user?.generations || 0;
}

export async function incrementUserGenerations(userId: string) {
  const { db } = await connectToDatabase();
  const result = await db.collection('users').updateOne(
    { userId },
    { 
      $inc: { generations: 1 },
      $setOnInsert: { createdAt: new Date() },
      $set: { lastUsed: new Date() }
    },
    { upsert: true }
  );
  return result;
}

export async function canUserMerge(userId: string, isPro: boolean = false) {
  if (isPro) return true;
  
  const generations = await getUserGenerations(userId);
  return generations < 1; // Only 1 free generation allowed
}

export async function getUserSubscription(userId: string) {
  const { db } = await connectToDatabase();
  const user = await db.collection('users').findOne({ userId });
  return user;
}

export async function updateUserSubscription(userId: string, subscriptionData: any) {
  const { db } = await connectToDatabase();
  const result = await db.collection('users').updateOne(
    { userId },
    { 
      $set: {
        ...subscriptionData,
        updatedAt: new Date()
      },
      $setOnInsert: { 
        createdAt: new Date(),
        generations: 0
      }
    },
    { upsert: true }
  );
  return result;
}

export async function isUserPro(userId: string): Promise<boolean> {
  const user = await getUserSubscription(userId);
  return user?.status === 'active' && user?.paypalSubscriptionId;
}

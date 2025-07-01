
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
export async function getUserGenerations(userId: string) {
  const { db } = await connectToDatabase();
  const user = await db.collection('users').findOne({ userId });
  return user?.generations || 0;
}

export async function getUserDailyGenerations(userId: string) {
  const { db } = await connectToDatabase();
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  
  const user = await db.collection('users').findOne({ userId });
  
  if (!user || !user.lastUsed) {
    return 0;
  }
  
  const lastUsedDate = new Date(user.lastUsed);
  lastUsedDate.setHours(0, 0, 0, 0);
  
  // If last used date is today, return daily generations, otherwise 0
  if (lastUsedDate.getTime() === today.getTime()) {
    return user.dailyGenerations || 0;
  }
  
  return 0;
}

export async function incrementUserGenerations(userId: string) {
  const { db } = await connectToDatabase();
  const today = new Date();
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  
  const user = await db.collection('users').findOne({ userId });
  
  let dailyGenerations = 0;
  
  if (user && user.lastUsed) {
    const lastUsedDate = new Date(user.lastUsed);
    lastUsedDate.setHours(0, 0, 0, 0);
    
    // If last used today, increment daily count, otherwise reset to 1
    if (lastUsedDate.getTime() === todayStart.getTime()) {
      dailyGenerations = (user.dailyGenerations || 0) + 1;
    } else {
      dailyGenerations = 1;
    }
  } else {
    dailyGenerations = 1;
  }
  
  const result = await db.collection('users').updateOne(
    { userId },
    { 
      $inc: { generations: 1 },
      $set: { 
        dailyGenerations,
        lastUsed: today
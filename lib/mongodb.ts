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
  return user?.totalMerges || 0; // Changed from generations to totalMerges  
}  
  
export async function getUserDailyGenerations(userId: string) {  
  const { db } = await connectToDatabase();  
  const today = new Date();  
  today.setHours(0, 0, 0, 0);  
    
  const user = await db.collection('users').findOne({ userId });  
    
  if (!user || !user.lastUsed) {  
    return 0;  
  }  
    
  const lastUsedDate = new Date(user.lastUsed);  
  lastUsedDate.setHours(0, 0, 0, 0);  
    
  if (lastUsedDate.getTime() === today.getTime()) {  
    return user.dailyMerges || 0; // Changed from dailyGenerations to dailyMerges  
  }  
    
  return 0;  
}  
  
export async function incrementUserGenerations(userId: string) {  
  const { db } = await connectToDatabase();  
  const today = new Date();  
  const todayStart = new Date(today);  
  todayStart.setHours(0, 0, 0, 0);  
    
  const user = await db.collection('users').findOne({ userId });  
    
  let dailyMerges = 0;  
    
  if (user && user.lastUsed) {  
    const lastUsedDate = new Date(user.lastUsed);  
    lastUsedDate.setHours(0, 0, 0, 0);  
      
    if (lastUsedDate.getTime() === todayStart.getTime()) {  
      dailyMerges = (user.dailyMerges || 0) + 1;  
    } else {  
      dailyMerges = 1;  
    }  
  } else {  
    dailyMerges = 1;  
  }  
    
  const result = await db.collection('users').updateOne(  
    { userId },  
    {   
      $inc: { totalMerges: 1 }, // Changed from generations to totalMerges  
      $set: {   
        dailyMerges, // Changed from dailyGenerations to dailyMerges  
        lastUsed: today  
      },  
      $setOnInsert: { createdAt: new Date() }  
    },  
    { upsert: true }  
  );  
  return result;  
}  
  
export async function canUserMerge(userId: string, isPro: boolean = false) {  
  if (isPro) return true;  
    
  const dailyMerges = await getUserDailyGenerations(userId); // Updated variable name  
  const MAX_FREE_DAILY_MERGES = 5;  
    
  return dailyMerges < MAX_FREE_DAILY_MERGES;  
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
        totalMerges: 0, // Changed from generations to totalMerges  
        dailyMerges: 0 // Changed from dailyGenerations to dailyMerges  
      }  
    },  
    { upsert: true }  
  );  
  return result;  
}

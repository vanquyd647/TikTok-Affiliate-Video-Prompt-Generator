import { MongoClient } from 'mongodb'

const MONGODB_OPTIONS = {
  // Serverless-friendly defaults: small pool, short idle timeout.
  maxPoolSize: 5,
  minPoolSize: 0,
  maxIdleTimeMS: 30000,
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 5000,
}

const globalForMongo = globalThis

export async function getMongoClient() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('Missing MONGODB_URI environment variable')
  }

  if (!globalForMongo.__affMongoClientPromise) {
    const client = new MongoClient(uri, MONGODB_OPTIONS)
    globalForMongo.__affMongoClientPromise = client.connect()
  }

  return globalForMongo.__affMongoClientPromise
}

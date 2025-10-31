import mongoose from 'mongoose';

// Define the MongoDB connection URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI as string;

// Validate that the MongoDB URI is defined
if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

// Define types for the cached connection
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend the global object to include our mongoose cache
// This prevents TypeScript errors when accessing global.__mongooseCache
declare global {
  var __mongooseCache: MongooseCache | undefined;
}

// Initialize the cache object
// In development, use a global variable to preserve the connection across hot reloads
// In production, the cache will be scoped to this module
const cached: MongooseCache = global.__mongooseCache || { conn: null, promise: null };

if (!global.__mongooseCache) {
  global.__mongooseCache = cached;
}

/**
 * Establishes and returns a cached MongoDB connection using Mongoose
 *
 * Benefits of caching:
 * - Prevents exhausting database connections during development hot reloads
 * - Improves performance by reusing existing connections
 * - Avoids "too many connections" errors in serverless environments
 *
 * @returns Promise that resolves to the Mongoose instance
 */
async function connectToDatabase(): Promise<typeof mongoose> {
  // Return existing connection if available
  if (cached.conn) {
    return cached.conn;
  }

  // Return existing connection promise if one is in progress
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable Mongoose buffering to fail fast if no connection
    };

    // Create new connection promise
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    // Wait for the connection to establish
    cached.conn = await cached.promise;
  } catch (e) {
    // Reset promise on failure so next call can retry
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;

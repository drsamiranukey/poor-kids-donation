import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const options: mongoose.ConnectOptions = {
      // Connection options
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
      
      // Database name
      dbName: process.env.DB_NAME || 'poorkidsdonation',
    };

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, options);

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    logger.info(`📊 Database: ${conn.connection.name}`);

    // Connection event listeners
    mongoose.connection.on('connected', () => {
      logger.info('🔗 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('❌ Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ Mongoose disconnected from MongoDB');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('🔌 Mongoose connection closed through app termination');
        process.exit(0);
      } catch (error) {
        logger.error('Error closing mongoose connection:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Database health check
export const checkDBHealth = async (): Promise<boolean> => {
  try {
    const state = mongoose.connection.readyState;
    
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (state === 1 && mongoose.connection.db) {
      // Perform a simple operation to verify connection
      await mongoose.connection.db.admin().ping();
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};

// Get database statistics
export const getDBStats = async () => {
  try {
    if (!mongoose.connection.db) {
      return null;
    }
    
    const stats = await mongoose.connection.db.stats();
    return {
      collections: stats.collections,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      indexSize: stats.indexSize,
      objects: stats.objects,
    };
  } catch (error) {
    logger.error('Error getting database stats:', error);
    return null;
  }
};

// Database cleanup utility
export const cleanupDB = async (): Promise<void> => {
  try {
    if (process.env.NODE_ENV === 'test' && mongoose.connection.db) {
      // Only allow cleanup in test environment
      const collections = await mongoose.connection.db.collections();
      
      for (const collection of collections) {
        await collection.deleteMany({});
      }
      
      logger.info('🧹 Database cleaned up for testing');
    } else {
      logger.warn('⚠️ Database cleanup is only allowed in test environment');
    }
  } catch (error) {
    logger.error('Error cleaning up database:', error);
    throw error;
  }
};

// Create database indexes
export const createIndexes = async (): Promise<void> => {
  try {
    // User indexes
    await mongoose.connection.collection('users').createIndex({ email: 1 }, { unique: true });
    await mongoose.connection.collection('users').createIndex({ createdAt: -1 });
    
    // Campaign indexes
    await mongoose.connection.collection('campaigns').createIndex({ status: 1 });
    await mongoose.connection.collection('campaigns').createIndex({ category: 1 });
    await mongoose.connection.collection('campaigns').createIndex({ createdAt: -1 });
    await mongoose.connection.collection('campaigns').createIndex({ endDate: 1 });
    await mongoose.connection.collection('campaigns').createIndex({ 
      title: 'text', 
      description: 'text' 
    });
    
    // Donation indexes
    await mongoose.connection.collection('donations').createIndex({ userId: 1 });
    await mongoose.connection.collection('donations').createIndex({ campaignId: 1 });
    await mongoose.connection.collection('donations').createIndex({ status: 1 });
    await mongoose.connection.collection('donations').createIndex({ createdAt: -1 });
    await mongoose.connection.collection('donations').createIndex({ paymentIntentId: 1 });
    
    // Payment indexes
    await mongoose.connection.collection('payments').createIndex({ donationId: 1 });
    await mongoose.connection.collection('payments').createIndex({ stripePaymentId: 1 });
    await mongoose.connection.collection('payments').createIndex({ status: 1 });
    await mongoose.connection.collection('payments').createIndex({ createdAt: -1 });
    
    logger.info('📊 Database indexes created successfully');
  } catch (error) {
    logger.error('Error creating database indexes:', error);
    throw error;
  }
};

// Export mongoose instance for direct access if needed
export { mongoose };

export default {
  connectDB,
  checkDBHealth,
  getDBStats,
  cleanupDB,
  createIndexes,
};
import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define format for file logs (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    level: level(),
    format,
  }),
];

// Add file transports only in production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  );
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format: fileFormat,
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logger
const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper functions for structured logging
const logWithContext = (level: string, message: string, context?: any) => {
  const logData: any = { message };
  
  if (context) {
    if (typeof context === 'object') {
      Object.assign(logData, context);
    } else {
      logData.context = context;
    }
  }
  
  logger.log(level, logData);
};

// Enhanced logger with additional methods
const enhancedLogger = {
  ...logger,
  stream,
  
  // Request logging
  logRequest: (req: any, message?: string) => {
    logWithContext('http', message || 'HTTP Request', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
    });
  },
  
  // Error logging with stack trace
  logError: (error: Error, context?: any) => {
    logWithContext('error', error.message, {
      stack: error.stack,
      name: error.name,
      ...context,
    });
  },
  
  // Database operation logging
  logDB: (operation: string, collection: string, context?: any) => {
    logWithContext('debug', `DB ${operation}`, {
      collection,
      ...context,
    });
  },
  
  // Payment logging
  logPayment: (action: string, context?: any) => {
    logWithContext('info', `Payment ${action}`, {
      ...context,
      // Remove sensitive data
      cardNumber: context?.cardNumber ? '****' + context.cardNumber.slice(-4) : undefined,
    });
  },
  
  // Authentication logging
  logAuth: (action: string, context?: any) => {
    logWithContext('info', `Auth ${action}`, {
      ...context,
      // Remove sensitive data
      password: undefined,
      token: context?.token ? '***' : undefined,
    });
  },
  
  // Performance logging
  logPerformance: (operation: string, duration: number, context?: any) => {
    logWithContext('debug', `Performance: ${operation}`, {
      duration: `${duration}ms`,
      ...context,
    });
  },
  
  // Security logging
  logSecurity: (event: string, context?: any) => {
    logWithContext('warn', `Security: ${event}`, context);
  },
  
  // Business logic logging
  logBusiness: (event: string, context?: any) => {
    logWithContext('info', `Business: ${event}`, context);
  },
};

// Export the enhanced logger
export { enhancedLogger as logger };

// Export types for TypeScript
export interface LogContext {
  [key: string]: any;
}

export interface RequestLogContext extends LogContext {
  method?: string;
  url?: string;
  ip?: string;
  userAgent?: string;
  userId?: string;
}

export interface ErrorLogContext extends LogContext {
  stack?: string;
  name?: string;
}

export interface DBLogContext extends LogContext {
  collection: string;
  operation?: string;
  query?: any;
  result?: any;
}

export interface PaymentLogContext extends LogContext {
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  status?: string;
}

export interface AuthLogContext extends LogContext {
  userId?: string;
  email?: string;
  role?: string;
}

export interface PerformanceLogContext extends LogContext {
  operation: string;
  duration: number;
}

export interface SecurityLogContext extends LogContext {
  ip?: string;
  userAgent?: string;
  userId?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export default enhancedLogger;
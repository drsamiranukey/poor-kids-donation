import winston from 'winston';

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

// Define which transports the logger must use
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
      winston.format.colorize({ all: true }),
      winston.format.printf(
        (info: any) => `${info.timestamp} ${info.level}: ${info.message}`,
      ),
    ),
  }),
  
  // File transport for errors
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),
];

// Create the logger
const Logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  transports,
  exitOnError: false,
});

// Logger utility functions
export const logger = {
  // Basic logging methods
  error: (message: string, meta?: any) => Logger.error(message, meta),
  warn: (message: string, meta?: any) => Logger.warn(message, meta),
  info: (message: string, meta?: any) => Logger.info(message, meta),
  http: (message: string, meta?: any) => Logger.http(message, meta),
  debug: (message: string, meta?: any) => Logger.debug(message, meta),

  // Specialized logging methods
  logError: (error: Error, context?: any) => {
    Logger.error(`${error.message}`, {
      stack: error.stack,
      name: error.name,
      context,
      timestamp: new Date().toISOString(),
    });
  },

  logSecurity: (message: string, details?: any) => {
    Logger.warn(`SECURITY: ${message}`, {
      type: 'security',
      details,
      timestamp: new Date().toISOString(),
    });
  },

  logBusiness: (message: string, data?: any) => {
    Logger.info(`BUSINESS: ${message}`, {
      type: 'business',
      data,
      timestamp: new Date().toISOString(),
    });
  },

  logPerformance: (message: string, metrics?: any) => {
    Logger.info(`PERFORMANCE: ${message}`, {
      type: 'performance',
      metrics,
      timestamp: new Date().toISOString(),
    });
  },

  logRequest: (req: any, res: any, responseTime?: number) => {
    const logData = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      responseTime: responseTime ? `${responseTime}ms` : undefined,
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    };

    Logger.http('HTTP Request', logData);
  },

  logAuth: (message: string, details?: any) => {
    const logData = {
      message,
      details,
      timestamp: new Date().toISOString(),
      type: 'authentication',
    };

    Logger.info('Authentication', logData);
  },

  logDB: (message: string, details?: any) => {
    Logger.info(`DATABASE: ${message}`, {
      type: 'database',
      details,
      timestamp: new Date().toISOString(),
    });
  },

  logPayment: (message: string, details?: any) => {
    Logger.info(`PAYMENT: ${message}`, {
      type: 'payment',
      details,
      timestamp: new Date().toISOString(),
    });
  },
};

export default logger;
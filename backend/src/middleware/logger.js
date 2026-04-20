const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.printf(({ timestamp, level, message, stack }) => {
          return `[${timestamp}] ${level.toUpperCase()}: ${stack || message}`;
        })
  ),
  transports: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({ filename: path.join('logs', 'error.log'), level: 'error' }),
          new winston.transports.File({ filename: path.join('logs', 'combined.log') }),
        ]
      : []),
  ],
});

module.exports = logger;

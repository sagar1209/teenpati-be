const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

const logFormat = winston.format.printf(({ timestamp, level, message }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const infoTransport = new winston.transports.DailyRotateFile({
  filename: path.join(__dirname, '../logs/info-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'info',
  maxFiles: '14d',
  zippedArchive: true,
});

const errorTransport = new winston.transports.DailyRotateFile({
  filename: path.join(__dirname, '../logs/error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxFiles: '30d',
  zippedArchive: true,
});

const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
});

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [infoTransport, errorTransport, consoleTransport],
});

module.exports = logger;

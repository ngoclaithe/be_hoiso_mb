import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Injectable()
export class LoggerService {
  private logger: winston.Logger;

  constructor() {
    // Tạo logs directory
    const fs = require('fs');
    const path = require('path');
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Console format
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, context }) => {
        const ctx = context ? `[${context}]` : '';
        return `${timestamp} ${level} ${ctx} ${message}`;
      })
    );

    // File format
    const fileFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
      transports: [
        // Console transport
        new winston.transports.Console({
          level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
          format: consoleFormat
        }),
        
        // Error file transport
        new winston.transports.DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '10m',
          maxFiles: '7d',
          format: fileFormat
        }),

        // App file transport
        new winston.transports.DailyRotateFile({
          filename: 'logs/app-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'info',
          maxSize: '10m',
          maxFiles: '3d',
          format: fileFormat
        })
      ]
    });
  }

  // Methods chính - clean và đơn giản
  debug(message: string, context?: string, data?: any) {
    const fullMessage = data ? `${message} ${JSON.stringify(data)}` : message;
    this.logger.debug(fullMessage, { context });
  }

  log(message: string, context?: string, data?: any) {
    const fullMessage = data ? `${message} ${JSON.stringify(data)}` : message;
    this.logger.info(fullMessage, { context });
  }

  warn(message: string, context?: string, data?: any) {
    const fullMessage = data ? `${message} ${JSON.stringify(data)}` : message;
    this.logger.warn(fullMessage, { context });
  }

  error(message: string, context?: string, error?: Error | any) {
    if (error instanceof Error) {
      this.logger.error(message, { 
        context, 
        error: error.message, 
        stack: error.stack 
      });
    } else if (error) {
      this.logger.error(message, { 
        context, 
        error: JSON.stringify(error) 
      });
    } else {
      this.logger.error(message, { context });
    }
  }

  // Utility methods
  logObject(message: string, object: any, context?: string) {
    this.debug(`${message}: ${JSON.stringify(object, null, 2)}`, context);
  }

  logMethodStart(methodName: string, params?: any, context?: string) {
    const paramStr = params ? ` with params: ${JSON.stringify(params)}` : '';
    this.debug(`🚀 START ${methodName}${paramStr}`, context);
  }

  logMethodEnd(methodName: string, result?: any, context?: string) {
    const resultStr = result ? ` result: ${JSON.stringify(result)}` : '';
    this.debug(`✅ END ${methodName}${resultStr}`, context);
  }

  logMethodError(methodName: string, error: Error, context?: string) {
    this.error(`❌ ERROR in ${methodName}: ${error.message}`, context, error);
  }

  // Chỉ log HTTP khi thực sự cần (có thể disable)
  logHttpRequest(req: any, res: any, responseTime: number) {
    if (process.env.ENABLE_HTTP_LOGGING === 'true') {
      const { method, originalUrl, ip } = req;
      const { statusCode } = res;
      
      this.log(`${method} ${originalUrl} ${statusCode} ${responseTime}ms ${ip}`, 'HTTP');
    }
  }
}
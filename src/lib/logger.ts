// NIST CSF DETECT (Continuous Monitoring)
// NIST CSF RESPOND (Analysis, Mitigation)
// Structured logging with security event tracking

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL",
  SECURITY = "SECURITY",
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  userId?: number;
  endpoint?: string;
  ip?: string;
  metadata?: Record<string, any>;
}

export class SecurityLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // In production: use external service (Sentry, LogRocket, DataDog)

  log(level: LogLevel, message: string, metadata?: Partial<LogEntry>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...metadata,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Keep last 1000 entries
    }

    // Console output for development
    const color = level === LogLevel.SECURITY ? "\x1b[31m" : // Red for security
                 level === LogLevel.ERROR ? "\x1b[31m" :
                 level === LogLevel.WARN ? "\x1b[33m" :
                 level === LogLevel.DEBUG ? "\x1b[36m" : "\x1b[32m"; // Green default
    console.log(`${color}[${entry.timestamp}] ${level}: ${message}\x1b[0m`, metadata || "");

    return entry;
  }

  security(message: string, metadata?: Partial<LogEntry>) {
    return this.log(LogLevel.SECURITY, `SECURITY EVENT: ${message}`, metadata);
  }

  getSecurityLogs(): LogEntry[] {
    return this.logs.filter(l => l.level === LogLevel.SECURITY);
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(l => l.level === level);
  }

  clearOldLogs() {
    // In production: archive to external storage before clearing
    this.logs = [];
  }
}

export const logger = new SecurityLogger();

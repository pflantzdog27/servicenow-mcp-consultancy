export interface SimpleLogger {
  error(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

export function createSimpleLogger(level: string = 'info'): SimpleLogger {
  const levels = { error: 0, warn: 1, info: 2, debug: 3 };
  const currentLevel = levels[level as keyof typeof levels] || 2;

  const formatMessage = (level: string, message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  };

  return {
    error: (message: string, meta?: any) => {
      if (currentLevel >= 0) console.error(formatMessage('error', message, meta));
    },
    warn: (message: string, meta?: any) => {
      if (currentLevel >= 1) console.warn(formatMessage('warn', message, meta));
    },
    info: (message: string, meta?: any) => {
      if (currentLevel >= 2) console.log(formatMessage('info', message, meta));
    },
    debug: (message: string, meta?: any) => {
      if (currentLevel >= 3) console.log(formatMessage('debug', message, meta));
    },
  };
}
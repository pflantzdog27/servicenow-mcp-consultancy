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

  // Check if running in MCP mode (when stdout is used for protocol communication)
  const isMCPMode = process.env.MCP_MODE === 'true' || process.argv.includes('--mcp');

  return {
    error: (message: string, meta?: any) => {
      if (currentLevel >= 0) {
        const msg = formatMessage('error', message, meta);
        if (isMCPMode) {
          process.stderr.write(msg + '\n');
        } else {
          console.error(msg);
        }
      }
    },
    warn: (message: string, meta?: any) => {
      if (currentLevel >= 1) {
        const msg = formatMessage('warn', message, meta);
        if (isMCPMode) {
          process.stderr.write(msg + '\n');
        } else {
          console.warn(msg);
        }
      }
    },
    info: (message: string, meta?: any) => {
      if (currentLevel >= 2) {
        const msg = formatMessage('info', message, meta);
        if (isMCPMode) {
          process.stderr.write(msg + '\n');
        } else {
          console.log(msg);
        }
      }
    },
    debug: (message: string, meta?: any) => {
      if (currentLevel >= 3) {
        const msg = formatMessage('debug', message, meta);
        if (isMCPMode) {
          process.stderr.write(msg + '\n');
        } else {
          console.log(msg);
        }
      }
    },
  };
}
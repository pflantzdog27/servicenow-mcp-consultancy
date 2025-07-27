#!/usr/bin/env node

import { SimpleServiceNowMCPServer } from './simple-server.js';

// Set MCP mode to ensure logs go to stderr
process.env.MCP_MODE = 'true';

// Override console methods to prevent stdout pollution
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

console.log = (...args: any[]) => {
  process.stderr.write(`[STDOUT REDIRECT] ${args.join(' ')}\n`);
};
console.info = console.log;
console.warn = (...args: any[]) => {
  process.stderr.write(`[WARN] ${args.join(' ')}\n`);
};
console.error = (...args: any[]) => {
  process.stderr.write(`[ERROR] ${args.join(' ')}\n`);
};

async function main() {
  try {
    const server = new SimpleServiceNowMCPServer();
    await server.start();
  } catch (error) {
    process.stderr.write(`Failed to start ServiceNow MCP Server: ${(error as Error).message}\n`);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  process.stderr.write('\nShutting down ServiceNow MCP Server...\n');
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.stderr.write('\nShutting down ServiceNow MCP Server...\n');
  process.exit(0);
});

main().catch((error) => {
  process.stderr.write(`Unhandled error: ${error}\n`);
  process.exit(1);
});
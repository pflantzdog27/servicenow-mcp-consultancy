#!/usr/bin/env node

import { SimpleServiceNowMCPServer } from './simple-server.js';

async function main() {
  try {
    const server = new SimpleServiceNowMCPServer();
    await server.start();
  } catch (error) {
    console.error('Failed to start ServiceNow MCP Server:', (error as Error).message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down ServiceNow MCP Server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down ServiceNow MCP Server...');
  process.exit(0);
});

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
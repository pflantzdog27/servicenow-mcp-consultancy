import dotenv from 'dotenv';

dotenv.config();

export interface SimpleConfig {
  servicenow: {
    instanceUrl: string;
    username?: string;
    password?: string;
    clientId?: string;
    clientSecret?: string;
    authType: 'basic' | 'oauth2';
    updateSetPrefix: string;
    defaultScope: string;
  };
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
  };
  server: {
    name: string;
    version: string;
  };
}

export function getConfig(): SimpleConfig {
  const instanceUrl = process.env.SERVICENOW_INSTANCE_URL;
  if (!instanceUrl) {
    throw new Error('SERVICENOW_INSTANCE_URL is required');
  }

  const authType = process.env.SERVICENOW_AUTH_TYPE === 'oauth2' ? 'oauth2' : 'basic';
  
  if (authType === 'basic') {
    if (!process.env.SERVICENOW_USERNAME || !process.env.SERVICENOW_PASSWORD) {
      throw new Error('SERVICENOW_USERNAME and SERVICENOW_PASSWORD are required for basic auth');
    }
  } else {
    if (!process.env.SERVICENOW_CLIENT_ID || !process.env.SERVICENOW_CLIENT_SECRET) {
      throw new Error('SERVICENOW_CLIENT_ID and SERVICENOW_CLIENT_SECRET are required for oauth2');
    }
  }

  return {
    servicenow: {
      instanceUrl,
      username: process.env.SERVICENOW_USERNAME,
      password: process.env.SERVICENOW_PASSWORD,
      clientId: process.env.SERVICENOW_CLIENT_ID,
      clientSecret: process.env.SERVICENOW_CLIENT_SECRET,
      authType,
      updateSetPrefix: process.env.UPDATE_SET_PREFIX || 'MCP_',
      defaultScope: process.env.DEFAULT_APPLICATION_SCOPE || 'global',
    },
    logging: {
      level: (process.env.LOG_LEVEL as any) || 'info',
    },
    server: {
      name: process.env.MCP_SERVER_NAME || 'servicenow-nlp',
      version: process.env.MCP_SERVER_VERSION || '1.0.0',
    },
  };
}
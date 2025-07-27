import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { ServiceNowApiService } from './services/servicenow-api.js';
import { getConfig, SimpleConfig } from './utils/simple-config.js';
import { createSimpleLogger } from './utils/simple-logger.js';

export class SimpleServiceNowMCPServer {
  private server: Server;
  private config: SimpleConfig;
  private logger: any;
  private serviceNowApi: ServiceNowApiService | null = null;

  constructor() {
    this.config = getConfig();
    this.logger = createSimpleLogger(this.config.logging.level);

    this.server = new Server({
      name: this.config.server.name,
      version: this.config.server.version,
    });

    this.setupTools();
  }

  private setupTools() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'test-connection',
            description: 'Test connection to ServiceNow instance',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'create-catalog-item',
            description: 'Create a ServiceNow catalog item using natural language',
            inputSchema: {
              type: 'object',
              properties: {
                command: {
                  type: 'string',
                  description: 'Natural language command like "Create a catalog item called \'New Laptop Request\' in IT Service Catalog"',
                },
              },
              required: ['command'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'test-connection':
            return await this.testConnection();
          case 'create-catalog-item':
            return await this.createCatalogItem((args?.command as string) || '');
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        this.logger.error(`Tool execution failed: ${name}`, { error: (error as Error).message });
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${(error as Error).message}`,
            },
          ],
        };
      }
    });
  }

  private async getServiceNowApi(): Promise<ServiceNowApiService> {
    if (!this.serviceNowApi) {
      this.serviceNowApi = new ServiceNowApiService({
        instanceUrl: this.config.servicenow.instanceUrl,
        username: this.config.servicenow.username,
        password: this.config.servicenow.password,
        clientId: this.config.servicenow.clientId,
        clientSecret: this.config.servicenow.clientSecret,
        updateSetPrefix: this.config.servicenow.updateSetPrefix,
        defaultScope: this.config.servicenow.defaultScope,
      });

      // Test authentication
      await this.serviceNowApi.authenticate();
    }
    return this.serviceNowApi;
  }

  async testConnection() {
    try {
      const api = await this.getServiceNowApi();
      
      // Test by getting user info
      const response = await api.getRecords('sys_user', 'user_name=' + this.config.servicenow.username);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully connected to ServiceNow instance: ${this.config.servicenow.instanceUrl}\nAuthenticated as: ${this.config.servicenow.username}\nFound ${response.length} user record(s)`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to connect to ServiceNow: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  async createCatalogItem(command: string) {
    try {
      // Simple pattern matching for demo
      const nameMatch = command.match(/called\s+['"]([^'"]+)['"]/i);
      const categoryMatch = command.match(/in\s+([^'"]+?)(?:\s|$)/i);
      
      if (!nameMatch) {
        throw new Error('Could not extract catalog item name from command. Use format: "Create a catalog item called \'Item Name\' in Category"');
      }

      const itemName = nameMatch[1];
      const category = categoryMatch ? categoryMatch[1].trim() : 'General';

      const api = await this.getServiceNowApi();
      
      // Create update set first
      const updateSet = await api.createUpdateSet(
        `Catalog Item Creation - ${new Date().toISOString().split('T')[0]}`,
        `Created catalog item: ${itemName}`
      );
      
      // Note: Skipping setCurrentUpdateSet for now as it requires admin privileges

      // Find or create category
      let categoryRecord;
      try {
        const categories = await api.getRecords('sc_category', `title=${category}`);
        if (categories.length > 0) {
          categoryRecord = categories[0];
        } else {
          // Create category if it doesn't exist
          categoryRecord = await api.createRecord('sc_category', {
            title: category,
            description: `Category for ${category} items`,
            active: true,
          });
        }
      } catch (error) {
        // Default to first available category
        const categories = await api.getRecords('sc_category', 'active=true');
        if (categories.length > 0) {
          categoryRecord = categories[0];
        } else {
          throw new Error('No categories available in ServiceNow instance');
        }
      }

      // Create catalog item
      const catalogItem = await api.createRecord('sc_cat_item', {
        name: itemName,
        short_description: itemName,
        description: `Catalog item for ${itemName}`,
        category: categoryRecord.sys_id,
        active: true,
        template: '',
        workflow: '',
      });

      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully created catalog item:\n` +
                  `Name: ${itemName}\n` +
                  `Category: ${categoryRecord.title}\n` +
                  `Item ID: ${(catalogItem as any).sys_id}\n` +
                  `Update Set: ${updateSet.name} (${updateSet.sys_id})`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to create catalog item: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info(`ServiceNow MCP Server started successfully`);
  }
}
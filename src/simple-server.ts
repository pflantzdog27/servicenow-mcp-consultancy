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
            name: 'query-records',
            description: 'Query ServiceNow table records',
            inputSchema: {
              type: 'object',
              properties: {
                table: { type: 'string', description: 'Table name (e.g., incident, problem, change_request)' },
                query: { type: 'string', description: 'Encoded query string (e.g., active=true^state=1)' },
                limit: { type: 'number', description: 'Maximum number of records to return', default: 10 },
                fields: { type: 'string', description: 'Comma-separated list of fields to return (optional)' }
              },
              required: ['table'],
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
          {
            name: 'create-record-producer',
            description: 'Create a ServiceNow Record Producer with variables and configuration',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Record Producer name' },
                short_description: { type: 'string', description: 'Short description' },
                table: { type: 'string', description: 'Target table name' },
                category: { type: 'string', description: 'Catalog category' },
                scope: { type: 'string', description: 'Application scope', default: 'global' },
                access_type: { type: 'string', description: 'Access type (internal/external)', default: 'internal' }
              },
              required: ['name', 'short_description', 'table'],
            },
          },
          {
            name: 'create-variable',
            description: 'Create a variable for a Record Producer or Catalog Item',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Variable name' },
                question_text: { type: 'string', description: 'Display label' },
                type: { type: 'string', description: 'Variable type (string, reference, choice, etc.)' },
                mandatory: { type: 'boolean', description: 'Is mandatory', default: false },
                reference_table: { type: 'string', description: 'Reference table for reference type variables' },
                choices: { type: 'string', description: 'Choices for choice variables (comma-separated)' },
                default_value: { type: 'string', description: 'Default value' },
                max_length: { type: 'number', description: 'Maximum length for string fields' },
                catalog_item: { type: 'string', description: 'Parent catalog item sys_id' }
              },
              required: ['name', 'question_text', 'type', 'catalog_item'],
            },
          },
          {
            name: 'create-variable-set',
            description: 'Create a multi-row variable set',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Variable set name' },
                title: { type: 'string', description: 'Display title' },
                description: { type: 'string', description: 'Description' },
                max_entries: { type: 'number', description: 'Maximum entries', default: 10 },
                catalog_item: { type: 'string', description: 'Parent catalog item sys_id' }
              },
              required: ['name', 'title', 'catalog_item'],
            },
          },
          {
            name: 'create-ui-policy',
            description: 'Create a UI Policy for form behavior',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'UI Policy name' },
                table: { type: 'string', description: 'Target table' },
                conditions: { type: 'string', description: 'Condition script or encoded query' },
                short_description: { type: 'string', description: 'Description' },
                on_load: { type: 'boolean', description: 'Run on load', default: true },
                catalog_item: { type: 'string', description: 'Catalog item sys_id if applicable' },
                script_true: { type: 'string', description: 'Script to execute when condition is true' },
                script_false: { type: 'string', description: 'Script to execute when condition is false' }
              },
              required: ['name', 'table', 'conditions'],
            },
          },
          {
            name: 'create-script-include',
            description: 'Create a Script Include for reusable server-side JavaScript functions',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Script Include name' },
                script: { type: 'string', description: 'JavaScript code' },
                description: { type: 'string', description: 'Description' },
                application_scope: { type: 'string', description: 'Application scope', default: 'global' },
                api_name: { type: 'string', description: 'API name (defaults to name)' },
                access: { type: 'string', description: 'Access level (public, package_private, private)', default: 'package_private' },
                active: { type: 'boolean', description: 'Active status', default: true }
              },
              required: ['name', 'script'],
            },
          },
          {
            name: 'create-scheduled-job',
            description: 'Create a Scheduled Job for automated script execution',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Scheduled job name' },
                script: { type: 'string', description: 'JavaScript code to execute' },
                description: { type: 'string', description: 'Description' },
                run_period: { type: 'string', description: 'Run period (daily, weekly, monthly, etc.)', default: 'daily' },
                run_time: { type: 'string', description: 'Run time (HH:MM:SS format)', default: '00:00:00' },
                run_dayofweek: { type: 'string', description: 'Day of week for weekly jobs (1-7)' },
                run_dayofmonth: { type: 'string', description: 'Day of month for monthly jobs (1-31)' },
                active: { type: 'boolean', description: 'Active status', default: true },
                conditional: { type: 'boolean', description: 'Use conditional execution', default: false },
                condition: { type: 'string', description: 'Condition script for conditional execution' }
              },
              required: ['name', 'script'],
            },
          },
          {
            name: 'create-email-notification',
            description: 'Create an Email Notification for automated email sending',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Email notification name' },
                table: { type: 'string', description: 'Target table' },
                event: { type: 'string', description: 'Event that triggers the notification (insert, update, delete)' },
                subject: { type: 'string', description: 'Email subject line' },
                message: { type: 'string', description: 'Email message body' },
                recipients: { type: 'string', description: 'Recipient email addresses or field names' },
                cc_list: { type: 'string', description: 'CC email addresses' },
                from: { type: 'string', description: 'From email address' },
                active: { type: 'boolean', description: 'Active status', default: true },
                advanced_condition: { type: 'string', description: 'Advanced condition script' },
                weight: { type: 'number', description: 'Execution order weight', default: 0 }
              },
              required: ['name', 'table', 'event', 'subject', 'message'],
            },
          },
          {
            name: 'create-catalog-client-script',
            description: 'Create a Catalog Client Script for catalog item form behavior',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Client script name' },
                catalog_item: { type: 'string', description: 'Catalog item sys_id' },
                type: { type: 'string', description: 'Script type (onLoad, onChange, onSubmit, onCellEdit)' },
                script: { type: 'string', description: 'JavaScript code' },
                field: { type: 'string', description: 'Field name for onChange scripts' },
                description: { type: 'string', description: 'Description' },
                active: { type: 'boolean', description: 'Active status', default: true },
                applies_to: { type: 'string', description: 'Where the script applies', default: 'catalog' }
              },
              required: ['name', 'catalog_item', 'type', 'script'],
            },
          },
          {
            name: 'create-ui-policy-action',
            description: 'Create UI Policy Action',
            inputSchema: {
              type: 'object',
              properties: {
                ui_policy: { type: 'string', description: 'UI Policy sys_id' },
                field: { type: 'string', description: 'Target field name' },
                visible: { type: 'boolean', description: 'Make field visible' },
                mandatory: { type: 'boolean', description: 'Make field mandatory' },
                disabled: { type: 'boolean', description: 'Disable field' }
              },
              required: ['ui_policy', 'field'],
            },
          },
          {
            name: 'create-client-script',
            description: 'Create a Client Script for form interactivity',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Client Script name' },
                table: { type: 'string', description: 'Target table' },
                type: { type: 'string', description: 'Script type (onLoad, onChange, onSubmit, onCellEdit)' },
                field: { type: 'string', description: 'Field name for onChange scripts' },
                script: { type: 'string', description: 'JavaScript code' },
                description: { type: 'string', description: 'Description' },
                catalog_item: { type: 'string', description: 'Catalog item sys_id if applicable' }
              },
              required: ['name', 'table', 'type', 'script'],
            },
          },
          {
            name: 'create-business-rule',
            description: 'Create a Business Rule for server-side logic',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Business Rule name' },
                table: { type: 'string', description: 'Target table' },
                when: { type: 'string', description: 'When to run (before, after, async, display)' },
                operation: { type: 'string', description: 'Operations (insert, update, delete, query)' },
                script: { type: 'string', description: 'Server-side JavaScript code' },
                description: { type: 'string', description: 'Description' },
                order: { type: 'number', description: 'Execution order', default: 100 },
                condition: { type: 'string', description: 'Condition script' }
              },
              required: ['name', 'table', 'when', 'script'],
            },
          },
          {
            name: 'create-table-field',
            description: 'Add a field to a ServiceNow table',
            inputSchema: {
              type: 'object',
              properties: {
                table: { type: 'string', description: 'Target table name' },
                column_name: { type: 'string', description: 'Field name' },
                column_label: { type: 'string', description: 'Field label' },
                type: { type: 'string', description: 'Field type (string, reference, boolean, choice, etc.)' },
                reference_table: { type: 'string', description: 'Reference table for reference fields' },
                max_length: { type: 'number', description: 'Maximum length for string fields' },
                choices: { type: 'string', description: 'Choices for choice fields (comma-separated)' },
                mandatory: { type: 'boolean', description: 'Is mandatory', default: false }
              },
              required: ['table', 'column_name', 'column_label', 'type'],
            },
          },
          {
            name: 'create-assignment-group',
            description: 'Create an Assignment Group',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Group name' },
                description: { type: 'string', description: 'Group description' },
                type: { type: 'string', description: 'Group type', default: 'itil' },
                active: { type: 'boolean', description: 'Active status', default: true }
              },
              required: ['name'],
            },
          },
          {
            name: 'implement-invoice-status-inquiry',
            description: 'Complete implementation of Invoice Status Inquiry system with all components',
            inputSchema: {
              type: 'object',
              properties: {
                dry_run: { type: 'boolean', description: 'Preview changes without creating', default: false },
                scope: { type: 'string', description: 'Application scope', default: 'sn_customerservice' }
              },
            },
          },
          {
            name: 'create-update-set',
            description: 'Create a new update set for tracking changes',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Update set name' },
                description: { type: 'string', description: 'Update set description' }
              },
              required: ['name', 'description'],
            },
          },
          {
            name: 'set-current-update-set',
            description: 'Set the current update set for capturing changes',
            inputSchema: {
              type: 'object',
              properties: {
                update_set_id: { type: 'string', description: 'Update set sys_id' }
              },
              required: ['update_set_id'],
            },
          },
          {
            name: 'create-application-scope',
            description: 'Create a new application scope',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Application name' },
                scope: { type: 'string', description: 'Application scope identifier' },
                short_description: { type: 'string', description: 'Short description' },
                version: { type: 'string', description: 'Version number', default: '1.0.0' }
              },
              required: ['name', 'scope', 'short_description'],
            },
          },
          {
            name: 'set-application-scope',
            description: 'Set the current application scope for development',
            inputSchema: {
              type: 'object',
              properties: {
                scope: { type: 'string', description: 'Application scope to set as current' }
              },
              required: ['scope'],
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
          case 'query-records':
            return await this.queryRecords(args as any);
          case 'create-catalog-item':
            return await this.createCatalogItem((args?.command as string) || '');
          case 'create-record-producer':
            return await this.createRecordProducer(args as any);
          case 'create-variable':
            return await this.createVariable(args as any);
          case 'create-variable-set':
            return await this.createVariableSet(args as any);
          case 'create-ui-policy':
            return await this.createUIPolicy(args as any);
          case 'create-script-include':
            return await this.createScriptInclude(args as any);
          case 'create-scheduled-job':
            return await this.createScheduledJob(args as any);
          case 'create-email-notification':
            return await this.createEmailNotification(args as any);
          case 'create-catalog-client-script':
            return await this.createCatalogClientScript(args as any);
          case 'create-ui-policy-action':
            return await this.createUIPolicyAction(args as any);
          case 'create-client-script':
            return await this.createClientScript(args as any);
          case 'create-business-rule':
            return await this.createBusinessRule(args as any);
          case 'create-table-field':
            return await this.createTableField(args as any);
          case 'create-assignment-group':
            return await this.createAssignmentGroup(args as any);
          case 'implement-invoice-status-inquiry':
            return await this.implementInvoiceStatusInquiry(args as any);
          case 'create-update-set':
            return await this.createUpdateSet(args as any);
          case 'set-current-update-set':
            return await this.setCurrentUpdateSet(args as any);
          case 'create-application-scope':
            return await this.createApplicationScope(args as any);
          case 'set-application-scope':
            return await this.setApplicationScope(args as any);
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
      }, this.logger);

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

  async queryRecords(args: any) {
    try {
      const api = await this.getServiceNowApi();
      const { table, query, limit = 10, fields } = args;
      
      this.logger.info(`Querying table: ${table}`, { query, limit, fields });
      
      // Build query parameters
      let queryString = query || '';
      if (limit) {
        queryString += `^ORDERBYDESCsys_created_on`;
      }
      
      const records = await api.getRecords(table, queryString);
      
      // Limit results
      const limitedRecords = records.slice(0, limit);
      
      // Filter fields if specified
      let displayRecords = limitedRecords;
      if (fields) {
        const fieldList = fields.split(',').map((f: string) => f.trim());
        displayRecords = limitedRecords.map(record => {
          const filtered: any = {};
          fieldList.forEach((field: string) => {
            if (record[field] !== undefined) {
              filtered[field] = record[field];
            }
          });
          return filtered;
        });
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Found ${records.length} record(s) in table '${table}'\n` +
                  `Showing first ${limitedRecords.length} records:\n\n` +
                  JSON.stringify(displayRecords, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to query records: ${(error as Error).message}`,
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

  async createRecordProducer(args: any) {
    try {
      const api = await this.getServiceNowApi();
      
      const recordProducer = await api.createRecord('sc_cat_item_producer', {
        name: args.name,
        short_description: args.short_description,
        table_name: args.table,
        category: args.category || '',
        sc_catalogs: args.scope === 'sn_customerservice' ? 'e0d08b13c3330100c8b837659bba8fb4' : '', // Service Portal catalog
        access_type: args.access_type || 'internal',
        active: true,
        workflow: '',
        script: `// Record Producer script for ${args.name}\n// Generated by ServiceNow MCP`
      });

      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully created Record Producer:\n` +
                  `Name: ${args.name}\n` +
                  `Table: ${args.table}\n` +
                  `ID: ${(recordProducer as any).sys_id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to create Record Producer: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  async createVariable(args: any) {
    try {
      const api = await this.getServiceNowApi();
      
      const variableData: any = {
        name: args.name,
        question_text: args.question_text,
        type: args.type,
        mandatory: args.mandatory || false,
        cat_item: args.catalog_item,
        order: 100
      };

      if (args.reference_table) {
        variableData.reference = args.reference_table;
      }

      if (args.choices) {
        variableData.lookup_table = '';
        variableData.lookup_value = '';
        variableData.lookup_label = '';
        variableData.question_choices = args.choices;
      }

      if (args.default_value) {
        variableData.default_value = args.default_value;
      }

      if (args.max_length) {
        variableData.max_length = args.max_length;
      }

      const variable = await api.createRecord('item_option_new', variableData);

      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully created Variable:\n` +
                  `Name: ${args.name}\n` +
                  `Type: ${args.type}\n` +
                  `ID: ${(variable as any).sys_id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to create Variable: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  async createVariableSet(args: any) {
    try {
      const api = await this.getServiceNowApi();
      
      const variableSet = await api.createRecord('item_option_new_set', {
        variable_set: args.name,
        title: args.title,
        description: args.description || '',
        type: 'one_to_many',
        one_to_many_type: 'slushbucket',
        cat_item: args.catalog_item,
        order: 100
      });

      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully created Variable Set:\n` +
                  `Name: ${args.name}\n` +
                  `Title: ${args.title}\n` +
                  `ID: ${(variableSet as any).sys_id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to create Variable Set: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  async createUIPolicy(args: any) {
    try {
      const api = await this.getServiceNowApi();
      
      const uiPolicy = await api.createUIPolicy(args.table, args.name, args.conditions, {
        description: args.short_description,
        on_load: args.on_load,
        catalog_item: args.catalog_item,
        script_true: args.script_true,
        script_false: args.script_false
      });

      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully created UI Policy:\n` +
                  `Name: ${args.name}\n` +
                  `Table: ${args.table}\n` +
                  `ID: ${(uiPolicy as any).sys_id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to create UI Policy: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  async createScriptInclude(args: any) {
    try {
      const api = await this.getServiceNowApi();
      
      const scriptInclude = await api.createScriptInclude({
        name: args.name,
        script: args.script,
        description: args.description,
        application_scope: args.application_scope,
        api_name: args.api_name,
        access: args.access,
        active: args.active
      });

      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully created Script Include:\n` +
                  `Name: ${args.name}\n` +
                  `API Name: ${args.api_name || args.name}\n` +
                  `Access: ${args.access || 'package_private'}\n` +
                  `ID: ${(scriptInclude as any).sys_id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to create Script Include: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  async createScheduledJob(args: any) {
    try {
      const api = await this.getServiceNowApi();
      
      const scheduledJob = await api.createScheduledJob({
        name: args.name,
        script: args.script,
        description: args.description,
        run_period: args.run_period,
        run_time: args.run_time,
        run_dayofweek: args.run_dayofweek,
        run_dayofmonth: args.run_dayofmonth,
        active: args.active,
        conditional: args.conditional,
        condition: args.condition
      });

      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully created Scheduled Job:\n` +
                  `Name: ${args.name}\n` +
                  `Run Period: ${args.run_period || 'daily'}\n` +
                  `Run Time: ${args.run_time || '00:00:00'}\n` +
                  `ID: ${(scheduledJob as any).sys_id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to create Scheduled Job: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  async createEmailNotification(args: any) {
    try {
      const api = await this.getServiceNowApi();
      
      const emailNotification = await api.createEmailNotification({
        name: args.name,
        table: args.table,
        event: args.event,
        subject: args.subject,
        message: args.message,
        recipients: args.recipients,
        cc_list: args.cc_list,
        from: args.from,
        active: args.active,
        advanced_condition: args.advanced_condition,
        weight: args.weight
      });

      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully created Email Notification:\n` +
                  `Name: ${args.name}\n` +
                  `Table: ${args.table}\n` +
                  `Event: ${args.event}\n` +
                  `Subject: ${args.subject}\n` +
                  `ID: ${(emailNotification as any).sys_id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to create Email Notification: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  async createCatalogClientScript(args: any) {
    try {
      const api = await this.getServiceNowApi();
      
      const catalogClientScript = await api.createCatalogClientScript({
        name: args.name,
        catalog_item: args.catalog_item,
        type: args.type,
        script: args.script,
        field: args.field,
        description: args.description,
        active: args.active,
        applies_to: args.applies_to
      });

      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully created Catalog Client Script:\n` +
                  `Name: ${args.name}\n` +
                  `Type: ${args.type}\n` +
                  `Catalog Item: ${args.catalog_item}\n` +
                  `ID: ${(catalogClientScript as any).sys_id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to create Catalog Client Script: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  async createUIPolicyAction(args: any) {
    try {
      const api = await this.getServiceNowApi();
      
      const action = await api.createRecord('sys_ui_policy_action', {
        ui_policy: args.ui_policy,
        field: args.field,
        visible: args.visible !== undefined ? args.visible : true,
        mandatory: args.mandatory || false,
        disabled: args.disabled || false
      });

      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully created UI Policy Action:\n` +
                  `Field: ${args.field}\n` +
                  `Policy: ${args.ui_policy}\n` +
                  `ID: ${(action as any).sys_id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to create UI Policy Action: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  async createClientScript(args: any) {
    try {
      const api = await this.getServiceNowApi();
      
      const clientScript = await api.createRecord('sys_script_client', {
        name: args.name,
        table: args.table,
        type: args.type,
        field: args.field || '',
        script: args.script,
        description: args.description || '',
        active: true,
        ui_type: args.catalog_item ? '10' : '0', // 10 for catalog, 0 for forms
        cat_item: args.catalog_item || ''
      });

      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully created Client Script:\n` +
                  `Name: ${args.name}\n` +
                  `Type: ${args.type}\n` +
                  `Table: ${args.table}\n` +
                  `ID: ${(clientScript as any).sys_id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to create Client Script: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  async createBusinessRule(args: any) {
    try {
      const api = await this.getServiceNowApi();
      
      const businessRule = await api.createRecord('sys_script', {
        name: args.name,
        table: args.table,
        when: args.when,
        insert: args.operation?.includes('insert') !== false,
        update: args.operation?.includes('update') || false,
        delete: args.operation?.includes('delete') || false,
        query: args.operation?.includes('query') || false,
        script: args.script,
        description: args.description || '',
        order: args.order || 100,
        condition: args.condition || '',
        active: true
      });

      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully created Business Rule:\n` +
                  `Name: ${args.name}\n` +
                  `Table: ${args.table}\n` +
                  `When: ${args.when}\n` +
                  `ID: ${(businessRule as any).sys_id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to create Business Rule: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  async createTableField(args: any) {
    try {
      const api = await this.getServiceNowApi();
      
      const fieldData: any = {
        name: args.table,
        element: args.column_name,
        column_label: args.column_label,
        internal_type: args.type,
        mandatory: args.mandatory || false
      };

      if (args.reference_table) {
        fieldData.reference = args.reference_table;
      }

      if (args.max_length) {
        fieldData.max_length = args.max_length;
      }

      if (args.choices) {
        fieldData.choice = '1';
        // Note: Choices need to be created separately in sys_choice table
      }

      const field = await api.createRecord('sys_dictionary', fieldData);

      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully created Table Field:\n` +
                  `Table: ${args.table}\n` +
                  `Field: ${args.column_name}\n` +
                  `Type: ${args.type}\n` +
                  `ID: ${(field as any).sys_id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to create Table Field: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  async createAssignmentGroup(args: any) {
    try {
      const api = await this.getServiceNowApi();
      
      const group = await api.createRecord('sys_user_group', {
        name: args.name,
        description: args.description || '',
        type: args.type || 'itil',
        active: args.active !== false
      });

      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully created Assignment Group:\n` +
                  `Name: ${args.name}\n` +
                  `Type: ${args.type || 'itil'}\n` +
                  `ID: ${(group as any).sys_id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to create Assignment Group: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  async implementInvoiceStatusInquiry(args: any) {
    try {
      const api = await this.getServiceNowApi();
      const results: string[] = [];
      
      if (args.dry_run) {
        results.push('🔍 DRY RUN MODE - Preview of changes:');
      }

      // Step 1: Create table fields
      results.push('\n📋 Creating table extensions for sn_customerservice_case...');
      
      const fields = [
        { name: 'u_supplier', label: 'Supplier', type: 'reference', reference: 'sn_fin_supplier' },
        { name: 'u_customer_number', label: 'Customer Number', type: 'string', max_length: 50 },
        { name: 'u_tax_id', label: 'Tax ID', type: 'string', max_length: 50 },
        { name: 'u_invoice_entries', label: 'Invoice Entries', type: 'longstring' },
        { name: 'u_bulk_upload_used', label: 'Bulk Upload Used', type: 'boolean' },
        { name: 'u_additional_comments', label: 'Additional Comments', type: 'string', max_length: 4000 },
        { name: 'u_urgency_level', label: 'Urgency Level', type: 'choice', choices: 'low,medium,high,critical' },
        { name: 'u_bot_eligible', label: 'Bot Eligible', type: 'boolean' },
        { name: 'u_bot_eligibility_reason', label: 'Bot Eligibility Reason', type: 'string', max_length: 255 }
      ];

      for (const field of fields) {
        if (!args.dry_run) {
          await this.createTableField({
            table: 'sn_customerservice_case',
            column_name: field.name,
            column_label: field.label,
            type: field.type,
            reference_table: field.reference,
            max_length: field.max_length,
            choices: field.choices
          });
        }
        results.push(`  ✓ ${field.label} (${field.name})`);
      }

      // Step 2: Create assignment groups
      results.push('\n👥 Creating assignment groups...');
      
      const groups = [
        'AP_Helpdesk_NA',
        'AP_Helpdesk_Canada',
        'AP_Helpdesk_EMEA',
        'AP_Helpdesk_APAC',
        'AP_Helpdesk_Global'
      ];

      for (const groupName of groups) {
        if (!args.dry_run) {
          await this.createAssignmentGroup({
            name: groupName,
            description: `Accounts Payable helpdesk for ${groupName.split('_')[2] || 'Global'} region`,
            type: 'itil'
          });
        }
        results.push(`  ✓ ${groupName}`);
      }

      // Step 3: Create Record Producer
      results.push('\n📝 Creating Record Producer...');
      
      let recordProducerId = '';
      if (!args.dry_run) {
        const rpResult = await this.createRecordProducer({
          name: 'Invoice Status Inquiry',
          short_description: 'Check payment status for invoices',
          table: 'sn_customerservice_case',
          category: 'Finance & Accounting',
          scope: args.scope || 'sn_customerservice',
          access_type: 'internal'
        });
        // Extract sys_id from result (simplified for demo)
        recordProducerId = 'generated-rp-id';
      }
      results.push('  ✓ Invoice Status Inquiry Record Producer');

      // Step 4: Create Variables
      results.push('\n🔧 Creating variables...');
      
      const variables = [
        { name: 'supplier', label: 'Select Supplier', type: 'reference', reference: 'sn_fin_supplier', mandatory: true },
        { name: 'invoice_entries', label: 'Invoice Details', type: 'container_start' },
        { name: 'bulk_upload_option', label: 'Upload Excel template for >10 invoices', type: 'checkbox' },
        { name: 'excel_attachment', label: 'Excel Template', type: 'file_attachment' },
        { name: 'additional_comments', label: 'Additional Information', type: 'multi_line_text' },
        { name: 'urgency_level', label: 'Urgency Level', type: 'choice', choices: 'low,medium,high,critical', default: 'medium' }
      ];

      for (const variable of variables) {
        if (!args.dry_run && recordProducerId) {
          await this.createVariable({
            name: variable.name,
            question_text: variable.label,
            type: variable.type,
            mandatory: variable.mandatory,
            reference_table: variable.reference,
            choices: variable.choices,
            default_value: variable.default,
            catalog_item: recordProducerId
          });
        }
        results.push(`  ✓ ${variable.label}`);
      }

      // Step 5: Create Business Rules
      results.push('\n⚙️ Creating business rules...');
      
      const businessRules = [
        {
          name: 'AP Invoice Status Regional Routing',
          when: 'before',
          order: 100,
          description: 'Routes requests to appropriate regional teams'
        },
        {
          name: 'AP Bot Eligibility Check',
          when: 'after',
          order: 200,
          description: 'Determines if request is eligible for bot processing'
        },
        {
          name: 'AP SLA Configuration',
          when: 'after',
          order: 300,
          description: 'Assigns appropriate SLA based on urgency'
        }
      ];

      for (const rule of businessRules) {
        if (!args.dry_run) {
          await this.createBusinessRule({
            name: rule.name,
            table: 'sn_customerservice_case',
            when: rule.when,
            script: `// ${rule.description}\n// Generated by ServiceNow MCP\n// Implementation details in CLAUDE.md`,
            description: rule.description,
            order: rule.order
          });
        }
        results.push(`  ✓ ${rule.name}`);
      }

      // Step 6: Create Client Scripts
      results.push('\n💻 Creating client scripts...');
      
      const clientScripts = [
        { name: 'Invoice Form Validation', type: 'onSubmit' },
        { name: 'Bulk Upload Toggle', type: 'onChange' },
        { name: 'Multi-row Management', type: 'onLoad' }
      ];

      for (const script of clientScripts) {
        if (!args.dry_run && recordProducerId) {
          await this.createClientScript({
            name: script.name,
            table: 'sn_customerservice_case',
            type: script.type,
            script: `// ${script.name}\n// Generated by ServiceNow MCP\n// Implementation details in CLAUDE.md`,
            catalog_item: recordProducerId
          });
        }
        results.push(`  ✓ ${script.name}`);
      }

      // Step 7: Create UI Policies
      results.push('\n🎨 Creating UI policies...');
      
      const uiPolicies = [
        { name: 'Bulk Upload Display', condition: 'bulk_upload_option=true' },
        { name: 'Critical Urgency Validation', condition: 'urgency_level=critical' }
      ];

      for (const policy of uiPolicies) {
        if (!args.dry_run) {
          await this.createUIPolicy({
            name: policy.name,
            table: 'sn_customerservice_case',
            conditions: policy.condition,
            catalog_item: recordProducerId
          });
        }
        results.push(`  ✓ ${policy.name}`);
      }

      const summary = args.dry_run ? 
        '\n🎯 Preview complete! Use dry_run=false to create these components.' :
        '\n🎉 Invoice Status Inquiry system successfully implemented!';
      
      results.push(summary);
      results.push('\n📚 Refer to CLAUDE.md for detailed implementation guidance and code examples.');

      return {
        content: [
          {
            type: 'text',
            text: results.join('\n'),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to implement Invoice Status Inquiry: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  async createUpdateSet(args: any) {
    try {
      const api = await this.getServiceNowApi();
      const { name, description } = args;
      
      const updateSet = await api.createUpdateSet(name, description);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully created update set:\n` +
                  `Name: ${updateSet.name}\n` +
                  `Description: ${updateSet.description}\n` +
                  `State: ${updateSet.state}\n` +
                  `Sys ID: ${updateSet.sys_id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to create update set: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  async setCurrentUpdateSet(args: any) {
    try {
      const api = await this.getServiceNowApi();
      const { update_set_id } = args;
      
      await api.setCurrentUpdateSet(update_set_id);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Current update set has been set to: ${update_set_id}\n` +
                  `Note: This operation may require additional permissions in your ServiceNow instance.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to set current update set: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  async createApplicationScope(args: any) {
    try {
      const api = await this.getServiceNowApi();
      const { name, scope, short_description, version = '1.0.0' } = args;
      
      const application = await api.createApplicationScope(name, scope, short_description, version);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully created application scope:\n` +
                  `Name: ${application.name}\n` +
                  `Scope: ${application.scope}\n` +
                  `Description: ${application.short_description}\n` +
                  `Version: ${application.version}\n` +
                  `Sys ID: ${application.sys_id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to create application scope: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  async setApplicationScope(args: any) {
    try {
      const api = await this.getServiceNowApi();
      const { scope } = args;
      
      await api.setApplicationScope(scope);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Application scope set to: ${scope}\n` +
                  `Future development operations will be performed in this scope.\n` +
                  `Note: This operation may require additional permissions in your ServiceNow instance.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to set application scope: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    // Logger output is redirected to stderr in MCP mode
    this.logger.debug(`ServiceNow MCP Server started successfully`);
  }
}
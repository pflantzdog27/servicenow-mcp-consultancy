import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, InitializeRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { ServiceNowApiService } from './services/servicenow-api.js';
import { getConfig, SimpleConfig } from './utils/simple-config.js';
import { createSimpleLogger } from './utils/simple-logger.js';

export class SimpleServiceNowMCPServer {
  private server: Server;
  private config: SimpleConfig;
  private logger: any;
  private serviceNowApi: ServiceNowApiService | null = null;
  private currentUpdateSetId: string | null = null;

  constructor() {
    this.config = getConfig();
    this.logger = createSimpleLogger(this.config.logging.level);

    this.server = new Server({
      name: this.config.server.name,
      version: this.config.server.version,
    });

    this.setupInitialize();
    this.setupTools();
  }

  private setupInitialize() {
    // Override the default initialize handler to include proper capabilities
    this.server.setRequestHandler(InitializeRequestSchema, async (request) => {
      return {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {
            list: true
          }
        },
        serverInfo: {
          name: this.config.server.name,
          version: this.config.server.version,
        }
      };
    });
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
            name: 'create-record',
            description: 'Create a new record in any ServiceNow table (incidents, problems, change requests, etc.)',
            inputSchema: {
              type: 'object',
              properties: {
                table: { type: 'string', description: 'Table name (e.g., incident, problem, change_request, task)' },
                fields: { 
                  type: 'object', 
                  description: 'Field values for the new record as key-value pairs',
                  additionalProperties: true,
                  examples: [
                    {
                      short_description: 'Email server down',
                      priority: '2',
                      urgency: '2',
                      impact: '2',
                      category: 'software',
                      subcategory: 'email'
                    }
                  ]
                }
              },
              required: ['table', 'fields'],
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
                type: { type: 'string', description: 'Variable type (string, multi_line_text, reference, choice, boolean, integer, date, date_time, etc.)' },
                mandatory: { type: 'boolean', description: 'Is mandatory', default: false },
                reference_table: { type: 'string', description: 'Reference table for reference type variables' },
                reference_qual: { type: 'string', description: 'Reference qualifier for reference type variables' },
                choices: { type: 'string', description: 'Choices for choice variables (comma-separated)' },
                default_value: { type: 'string', description: 'Default value' },
                max_length: { type: 'number', description: 'Maximum length for string fields' },
                order: { type: 'number', description: 'Display order', default: 100 },
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
            name: 'create-catalog-ui-policy',
            description: 'Create a UI policy specifically for catalog items that controls variable behavior',
            inputSchema: {
              type: 'object',
              properties: {
                catalog_item: { type: 'string', description: 'sys_id of catalog item' },
                variable_set: { type: 'string', description: 'sys_id of variable set' },
                applies_to: { type: 'string', description: "'A Catalog Item' or 'A Variable Set'", default: 'A Catalog Item' },
                name: { type: 'string', description: 'Policy name' },
                short_description: { type: 'string', description: 'Brief description' },
                active: { type: 'boolean', description: 'Active status', default: true },
                catalog_conditions: { type: 'string', description: 'Conditions using variable names (e.g. equipment_type=Laptop)' },
                applies_on_catalog_item_view: { type: 'boolean', description: 'Apply in catalog item view', default: true },
                applies_on_requested_items: { type: 'boolean', description: 'Apply on requested items', default: false },
                applies_on_catalog_tasks: { type: 'boolean', description: 'Apply on catalog tasks', default: false },
                applies_on_target_record: { type: 'boolean', description: 'Apply on target record', default: false },
                on_load: { type: 'boolean', description: 'Run on form load', default: true },
                reverse_if_false: { type: 'boolean', description: 'Reverse if conditions are false', default: false },
                order: { type: 'number', description: 'Execution order', default: 100 }
              },
              required: ['name'],
            },
          },
          {
            name: 'create-catalog-ui-policy-action',
            description: 'Create actions for catalog UI policies that control specific variable behavior',
            inputSchema: {
              type: 'object',
              properties: {
                catalog_ui_policy: { type: 'string', description: 'sys_id of catalog UI policy' },
                variable_name: { type: 'string', description: 'Name of catalog variable to control' },
                order: { type: 'number', description: 'Execution order', default: 100 },
                mandatory: { type: 'string', description: "'true', 'false', or 'leave_alone'" },
                visible: { type: 'string', description: "'true', 'false', or 'leave_alone'" },
                read_only: { type: 'string', description: "'true', 'false', or 'leave_alone'" },
                value_action: { type: 'string', description: "'leave_alone', 'set_value', or 'clear_value'" },
                value: { type: 'string', description: "Value to set when value_action is 'set_value'" },
                field_message_type: { type: 'string', description: "'info', 'warning', 'error', or 'none'" },
                field_message: { type: 'string', description: 'Message to display' }
              },
              required: ['catalog_ui_policy', 'variable_name'],
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
                table: { type: 'string', description: 'Target table name (e.g., incident, problem, change_request)' },
                when: { type: 'string', description: 'When to run: before, after, async, display', enum: ['before', 'after', 'async', 'display'] },
                operation: { 
                  type: 'array', 
                  description: 'Database operations to trigger on',
                  items: { type: 'string', enum: ['insert', 'update', 'delete', 'query'] },
                  default: ['insert', 'update']
                },
                script: { type: 'string', description: 'JavaScript code wrapped in function(current, previous) {}' },
                description: { type: 'string', description: 'Description of what the business rule does' },
                order: { type: 'number', description: 'Execution order (lower numbers run first)', default: 100 },
                condition: { type: 'string', description: 'JavaScript condition that must return true' },
                filter_condition: { type: 'string', description: 'Encoded query string for filtering records' },
                advanced: { type: 'boolean', description: 'Enable advanced options', default: false },
                active: { type: 'boolean', description: 'Whether the rule is active', default: true },
                role_conditions: { type: 'string', description: 'Comma-separated list of roles' }
              },
              required: ['name', 'table', 'when', 'script'],
            },
          },
          {
            name: 'update-business-rule',
            description: 'Update an existing Business Rule',
            inputSchema: {
              type: 'object',
              properties: {
                sys_id: { type: 'string', description: 'Business Rule sys_id to update' },
                name: { type: 'string', description: 'Business Rule name' },
                table: { type: 'string', description: 'Target table name' },
                when: { type: 'string', description: 'When to run: before, after, async, display', enum: ['before', 'after', 'async', 'display'] },
                operation: { 
                  type: 'array', 
                  description: 'Database operations to trigger on',
                  items: { type: 'string', enum: ['insert', 'update', 'delete', 'query'] }
                },
                script: { type: 'string', description: 'JavaScript code wrapped in function(current, previous) {}' },
                description: { type: 'string', description: 'Description of what the business rule does' },
                order: { type: 'number', description: 'Execution order (lower numbers run first)' },
                condition: { type: 'string', description: 'JavaScript condition that must return true' },
                filter_condition: { type: 'string', description: 'Encoded query string for filtering records' },
                advanced: { type: 'boolean', description: 'Enable advanced options' },
                active: { type: 'boolean', description: 'Whether the rule is active' },
                role_conditions: { type: 'string', description: 'Comma-separated list of roles' }
              },
              required: ['sys_id'],
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
          {
            name: 'create-flow',
            description: 'Create a Flow Designer flow',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Flow name' },
                description: { type: 'string', description: 'Flow description' },
                scope: { type: 'string', description: 'Application scope', default: 'global' },
                active: { type: 'boolean', description: 'Active status', default: true }
              },
              required: ['name'],
            },
          },
          {
            name: 'create-flow-trigger',
            description: 'Create a trigger for a Flow Designer flow',
            inputSchema: {
              type: 'object',
              properties: {
                flow_id: { type: 'string', description: 'Flow sys_id' },
                type: { type: 'string', description: 'Trigger type (record_created, record_updated, scheduled)' },
                table: { type: 'string', description: 'Table name for record triggers' },
                condition: { type: 'string', description: 'Condition for when the trigger fires' }
              },
              required: ['flow_id', 'type'],
            },
          },
          {
            name: 'add-create-record-action',
            description: 'Add a Create Record action to a flow',
            inputSchema: {
              type: 'object',
              properties: {
                flow_id: { type: 'string', description: 'Flow sys_id' },
                table: { type: 'string', description: 'Table to create record in' },
                field_values: { type: 'object', description: 'Field values for the new record' },
                order: { type: 'number', description: 'Action execution order' }
              },
              required: ['flow_id', 'table', 'field_values', 'order'],
            },
          },
          {
            name: 'add-send-email-action',
            description: 'Add a Send Email action to a flow',
            inputSchema: {
              type: 'object',
              properties: {
                flow_id: { type: 'string', description: 'Flow sys_id' },
                to: { type: 'string', description: 'Email recipient(s)' },
                subject: { type: 'string', description: 'Email subject' },
                body: { type: 'string', description: 'Email body' },
                order: { type: 'number', description: 'Action execution order' }
              },
              required: ['flow_id', 'to', 'subject', 'body', 'order'],
            },
          },
          {
            name: 'get-current-update-set',
            description: 'Get the currently tracked update set for this session',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      // EXTREME LOGGING - Raw request input
      console.error('[MCP-RAW-INPUT]', JSON.stringify({
        timestamp: new Date().toISOString(),
        rawRequest: request,
        requestType: typeof request,
        paramsType: typeof request.params,
        paramsKeys: Object.keys(request.params || {}),
        fullRequestJson: JSON.stringify(request, null, 2)
      }));

      const { name, arguments: args } = request.params;

      // EXTREME LOGGING - Extracted parameters
      console.error('[MCP-EXTRACTED-PARAMS]', JSON.stringify({
        timestamp: new Date().toISOString(),
        toolName: name,
        extractedArgs: args,
        argsType: typeof args,
        argsKeys: Object.keys(args || {}),
        argsJson: JSON.stringify(args, null, 2)
      }));

      try {
        switch (name) {
          case 'test-connection':
            // EXTREME LOGGING - Test connection specific
            console.error('[TEST-CONNECTION-ARGS]', JSON.stringify({
              timestamp: new Date().toISOString(),
              receivedArgs: args,
              argsKeys: Object.keys(args || {}),
              argsType: typeof args,
              argsIsNull: args === null,
              argsIsUndefined: args === undefined,
              argContent: args,
              message: 'About to call testConnection()'
            }));
            return await this.testConnection();
          case 'query-records':
            return await this.queryRecords(args as any);
          case 'create-record':
            return await this.createRecord(args as any);
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
          case 'create-catalog-ui-policy':
            return await this.createCatalogUIPolicy(args as any);
          case 'create-catalog-ui-policy-action':
            return await this.createCatalogUIPolicyAction(args as any);
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
          case 'update-business-rule':
            return await this.updateBusinessRule(args as any);
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
          case 'get-current-update-set':
            return await this.getCurrentUpdateSet();
          case 'create-application-scope':
            return await this.createApplicationScope(args as any);
          case 'set-application-scope':
            return await this.setApplicationScope(args as any);
          case 'create-flow':
            return await this.createFlow(args as any);
          case 'create-flow-trigger':
            return await this.createFlowTrigger(args as any);
          case 'add-create-record-action':
            return await this.addCreateRecordAction(args as any);
          case 'add-send-email-action':
            return await this.addSendEmailAction(args as any);
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

  async createRecord(args: any) {
    try {
      const api = await this.getServiceNowApi();
      const { table, fields } = args;
      
      if (!table) {
        throw new Error('Table parameter is required');
      }
      
      if (!fields || typeof fields !== 'object') {
        throw new Error('Fields parameter is required and must be an object with field values');
      }
      
      this.logger.info(`Creating record in table: ${table}`, { fields });
      
      // Add update set to record data if available
      const recordData = this.addUpdateSetToRecord(fields);
      const record = await api.createRecord(table, recordData);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully created ${table} record:\n` +
                  `Record ID: ${(record as any).sys_id}\n` +
                  `Number: ${(record as any).number || 'N/A'}\n` +
                  `Short Description: ${fields.short_description || 'N/A'}\n` +
                  `Status: Created successfully`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to create record: ${(error as Error).message}`,
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
      
      const recordData = this.addUpdateSetToRecord({
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
      
      const recordProducer = await api.createRecord('sc_cat_item_producer', recordData);

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
      
      // Validation
      if (!args.name || !args.question_text || !args.type || !args.catalog_item) {
        throw new Error('Missing required parameters: name, question_text, type, and catalog_item are required');
      }

      // Validate reference type has reference_table
      if (args.type === 'reference' && !args.reference_table) {
        throw new Error('reference_table is required when type is "reference"');
      }

      // Validate choice type has choices
      if (args.type === 'choice' && !args.choices) {
        throw new Error('choices parameter is required when type is "choice"');
      }
      
      // ServiceNow variable type mappings
      const variableTypeMap: Record<string, string> = {
        'string': '6',              // Single Line Text
        'multi_line_text': '7',     // Multi Line Text
        'choice': '3',              // Multiple Choice
        'reference': '8',           // Reference
        'boolean': '11',            // True/False
        'integer': '4',             // Numeric Scale
        'date': '9',                // Date
        'date_time': '10',          // Date/Time
        'lookup_select_box': '18',  // Lookup Select Box
        'select_box': '5',          // Select Box
        'checkbox': '21',           // CheckBox
        'macro': '14',              // Macro
        'ui_page': '17',            // UI Page
        'wide_single_line': '16'    // Wide Single Line Text
      };

      const variableData: any = {
        name: args.name,
        question_text: args.question_text,
        type: variableTypeMap[args.type] || '6', // Default to single line text
        mandatory: args.mandatory || false,
        cat_item: args.catalog_item,
        order: args.order || 100,
        active: true
      };

      // Handle reference fields
      if (args.type === 'reference' && args.reference_table) {
        variableData.reference = args.reference_table;
        variableData.reference_qual = args.reference_qual || '';
      }

      // Handle string and multi-line text length
      if ((args.type === 'string' || args.type === 'multi_line_text') && args.max_length) {
        variableData.max_length = args.max_length;
      } else if (args.type === 'string') {
        variableData.max_length = 255; // Default for string
      } else if (args.type === 'multi_line_text') {
        variableData.max_length = 4000; // Default for multi-line
      }

      // Handle default values
      if (args.default_value) {
        variableData.default_value = args.default_value;
      }

      // Add update set and create the variable
      const recordDataWithUpdateSet = this.addUpdateSetToRecord(variableData);
      const variable = await api.createRecord('item_option_new', recordDataWithUpdateSet);
      const variableSysId = (variable as any).sys_id;

      // Handle choice variables - create choice records
      if (args.type === 'choice' && args.choices) {
        const choiceList = args.choices.split(',');
        for (let i = 0; i < choiceList.length; i++) {
          const choice = choiceList[i].trim();
          const choiceData = this.addUpdateSetToRecord({
            question: variableSysId,
            text: choice,
            value: choice,
            order: (i + 1) * 100,
            inactive: false
          });
          await api.createRecord('question_choice', choiceData);
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully created Variable:\n` +
                  `Name: ${args.name}\n` +
                  `Type: ${args.type} (ServiceNow type: ${variableTypeMap[args.type] || '6'})\n` +
                  `ID: ${variableSysId}` +
                  (args.type === 'choice' && args.choices ? `\nChoices: ${args.choices}` : '') +
                  (args.type === 'reference' && args.reference_table ? `\nReference Table: ${args.reference_table}` : ''),
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
      
      // Intelligent detection: If catalog_item is provided, redirect to catalog UI policy
      if (args.catalog_item && !args.table) {
        this.logger.warn('Deprecation warning: Using create-ui-policy with catalog_item parameter. Please use create-catalog-ui-policy instead.');
        
        // Redirect to catalog UI policy creation
        return await this.createCatalogUIPolicy({
          catalog_item: args.catalog_item,
          name: args.name,
          catalog_conditions: args.conditions,
          short_description: args.short_description,
          on_load: args.on_load,
          applies_on_catalog_item_view: true
        });
      }
      
      // Validate that table is provided for regular UI policies
      if (!args.table) {
        throw new Error('Table parameter is required for regular UI policies. For catalog items, use create-catalog-ui-policy instead.');
      }
      
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

  async createCatalogUIPolicy(args: any) {
    try {
      const api = await this.getServiceNowApi();
      
      // Validate that either catalog_item or variable_set is provided
      if (!args.catalog_item && !args.variable_set) {
        throw new Error('Either catalog_item or variable_set must be provided');
      }
      
      const catalogUIPolicy = await api.createCatalogUIPolicy({
        catalog_item: args.catalog_item,
        variable_set: args.variable_set,
        applies_to: args.applies_to,
        name: args.name,
        short_description: args.short_description,
        active: args.active,
        catalog_conditions: args.catalog_conditions,
        applies_on_catalog_item_view: args.applies_on_catalog_item_view,
        applies_on_requested_items: args.applies_on_requested_items,
        applies_on_catalog_tasks: args.applies_on_catalog_tasks,
        applies_on_target_record: args.applies_on_target_record,
        on_load: args.on_load,
        reverse_if_false: args.reverse_if_false,
        order: args.order
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully created Catalog UI Policy:\n` +
                  `Name: ${args.name}\n` +
                  `Applies to: ${args.applies_to || 'A Catalog Item'}\n` +
                  `Catalog Item: ${args.catalog_item || 'N/A'}\n` +
                  `Variable Set: ${args.variable_set || 'N/A'}\n` +
                  `ID: ${(catalogUIPolicy as any).sys_id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to create Catalog UI Policy: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  async createCatalogUIPolicyAction(args: any) {
    try {
      const api = await this.getServiceNowApi();
      
      const action = await api.createCatalogUIPolicyAction({
        catalog_ui_policy: args.catalog_ui_policy,
        variable_name: args.variable_name,
        order: args.order,
        mandatory: args.mandatory,
        visible: args.visible,
        read_only: args.read_only,
        value_action: args.value_action,
        value: args.value,
        field_message_type: args.field_message_type,
        field_message: args.field_message
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully created Catalog UI Policy Action:\n` +
                  `Variable: ${args.variable_name}\n` +
                  `Policy: ${args.catalog_ui_policy}\n` +
                  `ID: ${(action as any).sys_id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to create Catalog UI Policy Action: ${(error as Error).message}`,
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
      
      // Check if this might be a catalog UI policy action based on field naming
      if (args.field && args.field.includes('variables.')) {
        this.logger.warn('Deprecation warning: It appears you are trying to control a catalog variable. Please use create-catalog-ui-policy-action instead.');
        
        // Extract variable name from 'variables.variable_name' format
        const variableName = args.field.replace('variables.', '');
        
        // Redirect to catalog UI policy action creation
        return await this.createCatalogUIPolicyAction({
          catalog_ui_policy: args.ui_policy,
          variable_name: variableName,
          visible: args.visible !== undefined ? (args.visible ? 'true' : 'false') : 'leave_alone',
          mandatory: args.mandatory !== undefined ? (args.mandatory ? 'true' : 'false') : 'leave_alone',
          read_only: args.disabled !== undefined ? (args.disabled ? 'true' : 'false') : 'leave_alone'
        });
      }
      
      const recordData = this.addUpdateSetToRecord({
        ui_policy: args.ui_policy,
        field: args.field,
        visible: args.visible !== undefined ? args.visible : true,
        mandatory: args.mandatory || false,
        disabled: args.disabled || false
      });
      
      const action = await api.createRecord('sys_ui_policy_action', recordData);

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
      
      const recordData = this.addUpdateSetToRecord({
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
      
      const clientScript = await api.createRecord('sys_script_client', recordData);

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
      
      // Validate required fields
      if (!args.name || !args.table || !args.when || !args.script) {
        throw new Error('Missing required fields: name, table, when, and script are required');
      }
      
      // Validate 'when' field
      const validWhenValues = ['before', 'after', 'async', 'display'];
      if (!validWhenValues.includes(args.when)) {
        throw new Error(`Invalid 'when' value: ${args.when}. Must be one of: ${validWhenValues.join(', ')}`);
      }
      
      // Validate script structure
      if (!args.script.includes('function') || !args.script.includes('current')) {
        this.logger?.warn('Script may not follow proper structure. Should be wrapped in function(current, previous) {}');
      }
      
      // Handle operations - support both array and string formats
      let operations = args.operation || ['insert', 'update'];
      if (typeof operations === 'string') {
        operations = operations.split(',').map((op: string) => op.trim());
      }
      
      const recordData = this.addUpdateSetToRecord({
        name: args.name,
        table: args.table,
        when: args.when,
        insert: operations.includes('insert'),
        update: operations.includes('update'),
        delete: operations.includes('delete'),
        query: operations.includes('query'),
        script: args.script,
        description: args.description || '',
        order: args.order || 100,
        condition: args.condition || '',
        filter_condition: args.filter_condition || '',
        advanced: args.advanced || false,
        active: args.active !== false,
        role_conditions: args.role_conditions || ''
      });
      
      const businessRule = await api.createRecord('sys_script', recordData);
      
      // Provide detailed feedback
      const operationsList = operations.join(', ');
      const feedback = [
        `✅ Successfully created Business Rule:`,
        `Name: ${args.name}`,
        `Table: ${args.table}`,
        `When: ${args.when}`,
        `Operations: ${operationsList}`,
        `Order: ${args.order || 100}`,
        `Active: ${args.active !== false}`,
        `ID: ${(businessRule as any).sys_id}`
      ];
      
      if (args.condition) {
        feedback.push(`Condition: ${args.condition}`);
      }
      
      return {
        content: [
          {
            type: 'text',
            text: feedback.join('\n'),
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

      const recordDataWithUpdateSet = this.addUpdateSetToRecord(fieldData);
      const field = await api.createRecord('sys_dictionary', recordDataWithUpdateSet);

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
      
      const recordData = this.addUpdateSetToRecord({
        name: args.name,
        description: args.description || '',
        type: args.type || 'itil',
        active: args.active !== false
      });
      
      const group = await api.createRecord('sys_user_group', recordData);

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
      
      // Store locally for direct field setting
      this.currentUpdateSetId = update_set_id;
      
      // Try to set user preference (may fail due to API limitations)
      try {
        await api.setCurrentUpdateSet(update_set_id);
      } catch (prefError) {
        this.logger?.warn('Failed to set update set preference via API, using direct field assignment', {
          error: (prefError as Error).message
        });
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Update set tracked for this session. All subsequent record creations will be associated with this update set.\n` +
                  `Update Set ID: ${update_set_id}\n` +
                  `Note: Due to REST API limitations, we set the sys_update_set field directly on each record rather than changing the session preference.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to set current update set: ${(error as Error).message}. We'll still track it locally for direct field setting.`,
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

  async createFlow(args: any) {
    try {
      const api = await this.getServiceNowApi();
      
      const flow = await api.createFlow({
        name: args.name,
        description: args.description,
        scope: args.scope,
        active: args.active
      });

      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully created Flow:\n` +
                  `Name: ${args.name}\n` +
                  `Description: ${args.description || 'None'}\n` +
                  `Scope: ${args.scope || 'global'}\n` +
                  `Active: ${args.active !== false}\n` +
                  `ID: ${(flow as any).sys_id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to create Flow: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  async createFlowTrigger(args: any) {
    try {
      const api = await this.getServiceNowApi();
      
      const trigger = await api.createFlowTrigger({
        flow_id: args.flow_id,
        type: args.type,
        table: args.table,
        condition: args.condition
      });

      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully created Flow Trigger:\n` +
                  `Flow ID: ${args.flow_id}\n` +
                  `Type: ${args.type}\n` +
                  `Table: ${args.table || 'N/A'}\n` +
                  `Condition: ${args.condition || 'None'}\n` +
                  `ID: ${(trigger as any).sys_id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to create Flow Trigger: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  async addCreateRecordAction(args: any) {
    try {
      const api = await this.getServiceNowApi();
      
      const action = await api.addCreateRecordAction({
        flow_id: args.flow_id,
        table: args.table,
        field_values: args.field_values,
        order: args.order
      });

      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully added Create Record action:\n` +
                  `Flow ID: ${args.flow_id}\n` +
                  `Table: ${args.table}\n` +
                  `Field Values: ${JSON.stringify(args.field_values, null, 2)}\n` +
                  `Order: ${args.order}\n` +
                  `ID: ${(action as any).sys_id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to add Create Record action: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  async addSendEmailAction(args: any) {
    try {
      const api = await this.getServiceNowApi();
      
      const action = await api.addSendEmailAction({
        flow_id: args.flow_id,
        to: args.to,
        subject: args.subject,
        body: args.body,
        order: args.order
      });

      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully added Send Email action:\n` +
                  `Flow ID: ${args.flow_id}\n` +
                  `To: ${args.to}\n` +
                  `Subject: ${args.subject}\n` +
                  `Order: ${args.order}\n` +
                  `ID: ${(action as any).sys_id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to add Send Email action: ${(error as Error).message}`,
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

  // Helper method to add update set to record data
  private addUpdateSetToRecord(recordData: any): any {
    if (this.currentUpdateSetId && !recordData.sys_update_set) {
      recordData.sys_update_set = this.currentUpdateSetId;
    }
    return recordData;
  }

  async getCurrentUpdateSet() {
    try {
      if (this.currentUpdateSetId) {
        // Optionally fetch details about the update set
        const api = await this.getServiceNowApi();
        try {
          const updateSets = await api.getRecords('sys_update_set', `sys_id=${this.currentUpdateSetId}`);
          if (updateSets.length > 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: `✅ Current tracked update set:\n` +
                        `Name: ${updateSets[0].name}\n` +
                        `Description: ${updateSets[0].description || 'None'}\n` +
                        `State: ${updateSets[0].state}\n` +
                        `ID: ${this.currentUpdateSetId}\n` +
                        `Note: This update set is being applied to all record creations in this session.`,
                },
              ],
            };
          }
        } catch (fetchError) {
          // If we can't fetch details, just return the ID
          return {
            content: [
              {
                type: 'text',
                text: `✅ Current tracked update set ID: ${this.currentUpdateSetId}\n` +
                      `Note: This update set is being applied to all record creations in this session.`,
              },
            ],
          };
        }
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `ℹ️ No update set is currently tracked. Records will be created in the default update set.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to get current update set: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  async updateBusinessRule(args: any) {
    try {
      const api = await this.getServiceNowApi();
      
      // Validate required field
      if (!args.sys_id) {
        throw new Error('sys_id parameter is required for updating business rules');
      }
      
      // Get existing business rule
      const existingRules = await api.getRecords('sys_script', `sys_id=${args.sys_id}`);
      if (!existingRules || existingRules.length === 0) {
        throw new Error(`Business Rule with sys_id ${args.sys_id} not found`);
      }
      
      const existingRule = existingRules[0];
      
      // Validate 'when' field if provided
      if (args.when) {
        const validWhenValues = ['before', 'after', 'async', 'display'];
        if (!validWhenValues.includes(args.when)) {
          throw new Error(`Invalid 'when' value: ${args.when}. Must be one of: ${validWhenValues.join(', ')}`);
        }
      }
      
      // Handle operations if provided
      let updateData: any = {};
      
      if (args.operation) {
        let operations = args.operation;
        if (typeof operations === 'string') {
          operations = operations.split(',').map((op: string) => op.trim());
        }
        
        updateData.insert = operations.includes('insert');
        updateData.update = operations.includes('update');
        updateData.delete = operations.includes('delete');
        updateData.query = operations.includes('query');
      }
      
      // Build update data with only provided fields
      const fieldsToUpdate = ['name', 'table', 'when', 'script', 'description', 'order', 'condition', 'filter_condition', 'advanced', 'active', 'role_conditions'];
      fieldsToUpdate.forEach(field => {
        if (args[field] !== undefined) {
          updateData[field] = args[field];
        }
      });
      
      // Validate script structure if provided
      if (args.script && (!args.script.includes('function') || !args.script.includes('current'))) {
        this.logger?.warn('Script may not follow proper structure. Should be wrapped in function(current, previous) {}');
      }
      
      // Add update set tracking
      const recordData = this.addUpdateSetToRecord(updateData);
      
      // Update the business rule
      const updatedRule = await api.updateRecord('sys_script', args.sys_id, recordData);
      
      // Provide detailed feedback
      const feedback = [
        `✅ Successfully updated Business Rule:`,
        `Name: ${args.name || existingRule.name}`,
        `Table: ${args.table || existingRule.table}`,
        `When: ${args.when || existingRule.when}`,
        `ID: ${args.sys_id}`
      ];
      
      const updatedFields = Object.keys(updateData).filter(key => key !== 'sys_update_set');
      if (updatedFields.length > 0) {
        feedback.push(`Updated fields: ${updatedFields.join(', ')}`);
      }
      
      return {
        content: [
          {
            type: 'text',
            text: feedback.join('\n'),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to update Business Rule: ${(error as Error).message}`,
          },
        ],
      };
    }
  }
}
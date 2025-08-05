import axios, { AxiosInstance } from 'axios';
import { ServiceNowConfig, ServiceNowApiResponse } from '../types/servicenow.js';
import { SimpleLogger } from '../utils/simple-logger.js';

export interface ScriptIncludeParams {
  name: string;
  script: string;
  description?: string;
  application_scope?: string;
  api_name?: string;
  access?: string;
  active?: boolean;
}

export interface ScheduledJobParams {
  name: string;
  script: string;
  description?: string;
  run_period?: string;
  run_time?: string;
  run_dayofweek?: string;
  run_dayofmonth?: string;
  active?: boolean;
  conditional?: boolean;
  condition?: string;
}

export interface EmailNotificationParams {
  name: string;
  table: string;
  event: string;
  subject: string;
  message: string;
  recipients?: string;
  cc_list?: string;
  from?: string;
  active?: boolean;
  advanced_condition?: string;
  weight?: number;
}

export interface CatalogClientScriptParams {
  name: string;
  catalog_item: string;
  type: string;
  script: string;
  field?: string;
  description?: string;
  active?: boolean;
  applies_to?: string;
}

export interface UIScriptParams {
  script_true?: string;
  script_false?: string;
}

export interface FlowParams {
  name: string;
  description?: string;
  scope?: string;
  active?: boolean;
}

export interface FlowTriggerParams {
  flow_id: string;
  type: string;
  table?: string;
  condition?: string;
}

export interface CreateRecordActionParams {
  flow_id: string;
  table: string;
  field_values: Record<string, any>;
  order: number;
}

export interface SendEmailActionParams {
  flow_id: string;
  to: string;
  subject: string;
  body: string;
  order: number;
}

export interface IfThenActionParams {
  flow_id: string;
  condition: string;
  order: number;
}

export interface FlowConnectionParams {
  from_action: string;
  to_action: string;
  branch_type?: string;
}

export class ServiceNowApiService {
  private client: AxiosInstance;
  private config: ServiceNowConfig;
  private logger?: SimpleLogger;
  private currentUpdateSetId?: string;

  constructor(config: ServiceNowConfig, logger?: SimpleLogger) {
    this.config = config;
    this.logger = logger;
    
    this.client = axios.create({
      baseURL: config.instanceUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'ServiceNow-API-Client/1.0.0'
      },
      timeout: 30000
    });

    // Setup authentication
    if (config.username && config.password) {
      this.client.defaults.auth = {
        username: config.username,
        password: config.password
      };
    }

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        this.logger?.debug('API Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          headers: {
            ...config.headers,
            Authorization: config.headers?.Authorization ? '***REDACTED***' : undefined
          },
          service: 'servicenow-api',
          timestamp: new Date().toISOString()
        });
        return config;
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        this.logger?.debug('API Response', {
          status: response.status,
          url: response.config.url,
          service: 'servicenow-api',
          timestamp: new Date().toISOString()
        });
        return response;
      },
      (error) => {
        this.logger?.error(`API Error ${error.message}`, {
          status: error.response?.status,
          url: error.config?.url,
          response: error.response?.data,
          service: 'servicenow-api',
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    );
  }

  async authenticate(): Promise<void> {
    // For basic auth, no explicit authentication needed
    this.logger?.info('Using Basic authentication, no token required', {
      service: 'servicenow-api',
      timestamp: new Date().toISOString()
    });
  }

  async getRecords(table: string, query?: string): Promise<any[]> {
    const params: any = {};
    if (query) {
      params.sysparm_query = query;
    }

    const response = await this.client.get(`/api/now/table/${table}`, { params });
    return response.data.result;
  }

  async createRecord(table: string, data: any): Promise<any> {
    // Add update set if one is tracked and not already set
    if (this.currentUpdateSetId && !data.sys_update_set) {
      data.sys_update_set = this.currentUpdateSetId;
    }
    
    const response = await this.client.post(`/api/now/table/${table}`, data);
    return response.data.result;
  }

  async createUpdateSet(name: string, description: string): Promise<any> {
    const updateSetName = `${this.config.updateSetPrefix}${name}`;
    
    const updateSetData = {
      name: updateSetName,
      description: description,
      state: 'build',
      application: this.config.defaultScope
    };

    return await this.createRecord('sys_update_set', updateSetData);
  }

  async setCurrentUpdateSet(sysId: string): Promise<void> {
    try {
      // Get current user ID first
      const userResponse = await this.getRecords('sys_user', `user_name=${this.config.username}`);
      if (!userResponse || userResponse.length === 0) {
        throw new Error('Could not determine current user ID');
      }
      const userId = userResponse[0].sys_id;
      
      // Check for existing preference
      const prefResponse = await this.getRecords('sys_user_preference', `user=${userId}^name=sys_update_set`);
      
      if (prefResponse && prefResponse.length > 0) {
        // Update existing preference
        const prefId = prefResponse[0].sys_id;
        await this.client.put(`/api/now/table/sys_user_preference/${prefId}`, { value: sysId });
      } else {
        // Create new preference
        await this.createRecord('sys_user_preference', {
          user: userId,
          name: 'sys_update_set',
          value: sysId
        });
      }
      
      // Store locally for direct field setting
      this.currentUpdateSetId = sysId;
      
      this.logger?.info(`Successfully set current update set to ${sysId}`, {
        service: 'servicenow-api',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Still store locally for direct field setting even if preference setting fails
      this.currentUpdateSetId = sysId;
      
      this.logger?.warn(`Failed to set update set preference: ${(error as Error).message}`, {
        service: 'servicenow-api',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  async createApplicationScope(name: string, scope: string, shortDescription: string, version: string = '1.0.0'): Promise<any> {
    const applicationData = {
      name: name,
      scope: scope,
      short_description: shortDescription,
      version: version,
      active: true,
      source: 'custom'
    };

    return await this.createRecord('sys_app', applicationData);
  }

  async setApplicationScope(scope: string): Promise<void> {
    // This would normally set the current application scope for development
    // For now, we'll just log this action as it requires special API permissions
    this.logger?.info(`Would set current application scope to ${scope}`, {
      service: 'servicenow-api',
      timestamp: new Date().toISOString()
    });
    
    // Update the config for future operations
    this.config.defaultScope = scope;
  }

  async updateRecord(table: string, sysId: string, data: any): Promise<any> {
    const response = await this.client.put(`/api/now/table/${table}/${sysId}`, data);
    return response.data.result;
  }

  async createScriptInclude(params: ScriptIncludeParams): Promise<any> {
    const scriptIncludeData = {
      name: params.name,
      script: params.script,
      description: params.description || '',
      sys_scope: params.application_scope || this.config.defaultScope,
      api_name: params.api_name || params.name,
      access: params.access || 'package_private',
      active: params.active !== false
    };

    return await this.createRecord('sys_script_include', scriptIncludeData);
  }

  async createScheduledJob(params: ScheduledJobParams): Promise<any> {
    const scheduledJobData = {
      name: params.name,
      script: params.script,
      description: params.description || '',
      run_period: params.run_period || 'daily',
      run_time: params.run_time || '00:00:00',
      run_dayofweek: params.run_dayofweek || '',
      run_dayofmonth: params.run_dayofmonth || '',
      active: params.active !== false,
      conditional: params.conditional || false,
      condition: params.condition || ''
    };

    return await this.createRecord('sysauto_script', scheduledJobData);
  }

  async createEmailNotification(params: EmailNotificationParams): Promise<any> {
    const emailNotificationData = {
      name: params.name,
      table: params.table,
      event: params.event,
      subject: params.subject,
      message: params.message,
      recipients: params.recipients || '',
      cc_list: params.cc_list || '',
      from: params.from || '',
      active: params.active !== false,
      advanced_condition: params.advanced_condition || '',
      weight: params.weight || 0
    };

    return await this.createRecord('sysevent_email_action', emailNotificationData);
  }

  async createCatalogClientScript(params: CatalogClientScriptParams): Promise<any> {
    const catalogClientScriptData = {
      name: params.name,
      cat_item: params.catalog_item,
      type: params.type,
      script: params.script,
      field: params.field || '',
      description: params.description || '',
      active: params.active !== false,
      applies_to: params.applies_to || 'catalog'
    };

    return await this.createRecord('catalog_script_client', catalogClientScriptData);
  }

  async createUIPolicy(table: string, name: string, conditions: string, options?: {
    description?: string;
    on_load?: boolean;
    catalog_item?: string;
    script_true?: string;
    script_false?: string;
  }): Promise<any> {
    const uiPolicyData = {
      short_description: name,
      table: table,
      conditions: conditions,
      description: options?.description || '',
      active: true,
      on_load: options?.on_load !== false,
      catalog_item: options?.catalog_item || '',
      script_true: options?.script_true || '',
      script_false: options?.script_false || ''
    };

    return await this.createRecord('sys_ui_policy', uiPolicyData);
  }

  async createCatalogUIPolicy(params: {
    catalog_item?: string;
    variable_set?: string;
    applies_to?: string;
    name: string;
    short_description?: string;
    active?: boolean;
    catalog_conditions?: string;
    applies_on_catalog_item_view?: boolean;
    applies_on_requested_items?: boolean;
    applies_on_catalog_tasks?: boolean;
    applies_on_target_record?: boolean;
    on_load?: boolean;
    reverse_if_false?: boolean;
    order?: number;
  }): Promise<any> {
    const catalogUIPolicyData: any = {
      name: params.name,
      short_description: params.short_description || params.name,
      catalog_item: params.catalog_item || '',
      variable_set: params.variable_set || '',
      applies_to: params.applies_to === 'A Variable Set' ? 'variable_set' : 'item',
      catalog_conditions: params.catalog_conditions || '',
      active: params.active !== false,
      applies_catalog: params.applies_on_catalog_item_view !== false,
      applies_req_item: params.applies_on_requested_items || false,
      applies_sc_task: params.applies_on_catalog_tasks || false,
      applies_target_record: params.applies_on_target_record || false,
      on_load: params.on_load !== false,
      reverse_if_false: params.reverse_if_false || false,
      order: params.order || 100
    };

    return await this.createRecord('catalog_ui_policy', catalogUIPolicyData);
  }

  async createCatalogUIPolicyAction(params: {
    catalog_ui_policy: string;
    variable_name: string;
    order?: number;
    mandatory?: string;
    visible?: string;
    read_only?: string;
    value_action?: string;
    value?: string;
    field_message_type?: string;
    field_message?: string;
  }): Promise<any> {
    // First, get the catalog UI policy to find the catalog item
    const policyRecords = await this.getRecords('catalog_ui_policy', `sys_id=${params.catalog_ui_policy}`);
    if (!policyRecords || policyRecords.length === 0) {
      throw new Error('Catalog UI Policy not found');
    }
    const policyResponse = policyRecords[0];
    if (!policyResponse.catalog_item) {
      throw new Error('Catalog UI Policy has no catalog item');
    }

    // Extract the catalog_item sys_id from the reference field
    const catalogItemId = typeof policyResponse.catalog_item === 'object' 
      ? policyResponse.catalog_item.value 
      : policyResponse.catalog_item;

    if (!catalogItemId) {
      throw new Error('Catalog UI Policy catalog_item reference is empty');
    }

    // Now find the variable by name in the catalog item
    const variableQuery = `cat_item=${catalogItemId}^name=${params.variable_name}`;
    this.logger?.info(`Looking for variable with query: ${variableQuery}`);
    this.logger?.info(`Catalog item: ${catalogItemId}, Variable name: ${params.variable_name}`);
    
    const variables = await this.getRecords('item_option_new', variableQuery);
    this.logger?.info(`Found ${variables?.length || 0} variables matching the query`);
    
    if (!variables || variables.length === 0) {
      // Let's also try a broader search to see what variables exist
      const allVariables = await this.getRecords('item_option_new', `cat_item=${catalogItemId}`);
      this.logger?.info(`All variables in catalog item: ${JSON.stringify(allVariables.map(v => ({ name: v.name, sys_id: v.sys_id })))}`);
      throw new Error(`Variable '${params.variable_name}' not found in catalog item ${catalogItemId}. Found ${allVariables.length} total variables.`);
    }

    const variableSysId = variables[0].sys_id;

    // The catalog_ui_policy parameter should already be a sys_id string
    const uiPolicyId = params.catalog_ui_policy;
    
    this.logger?.info(`Original catalog_ui_policy param: ${JSON.stringify(params.catalog_ui_policy)}`);
    this.logger?.info(`UI Policy ID to use: ${uiPolicyId}, Variable sys_id: ${variableSysId}`);

    const actionData: any = {
      ui_policy: uiPolicyId,  // Use the policy sys_id
      catalog_variable: `IO:${variableSysId}`,  // "IO:" prefix + variable sys_id
      variable: params.variable_name,  // Use the variable name string directly
      order: params.order || 100
    };

    // Convert string values to appropriate choice values
    if (params.mandatory !== undefined) {
      actionData.mandatory = params.mandatory;
    }
    if (params.visible !== undefined) {
      actionData.visible = params.visible;
    }
    if (params.read_only !== undefined) {
      actionData.disabled = params.read_only;
    }
    if (params.value_action !== undefined) {
      actionData.cleared = params.value_action === 'clear_value' ? 'true' : 'false';
    }
    if (params.value !== undefined && params.value_action === 'set_value') {
      actionData.default_value = params.value;
    }
    if (params.field_message_type !== undefined) {
      actionData.help_tag = params.field_message_type;
    }
    if (params.field_message !== undefined) {
      actionData.help_text = params.field_message;
    }

    this.logger?.info(`Final actionData to create: ${JSON.stringify(actionData, null, 2)}`);
    return await this.createRecord('catalog_ui_policy_action', actionData);
  }

  async createFlow(params: FlowParams): Promise<any> {
    const flowData = {
      name: params.name,
      description: params.description || '',
      sys_scope: params.scope || this.config.defaultScope,
      active: params.active !== false,
      state: 'published'
    };

    return await this.createRecord('sys_hub_flow', flowData);
  }

  async createFlowTrigger(params: FlowTriggerParams): Promise<any> {
    const triggerData: any = {
      flow: params.flow_id,
      type: params.type,
      active: true
    };

    if (params.table) {
      triggerData.table = params.table;
    }

    if (params.condition) {
      triggerData.condition = params.condition;
    }

    return await this.createRecord('sys_hub_flow_input', triggerData);
  }

  async addCreateRecordAction(params: CreateRecordActionParams): Promise<any> {
    const actionData = {
      flow: params.flow_id,
      action_type: 'com.snc.process_flow.Create_Record',
      action_inputs: JSON.stringify({
        table: params.table,
        field_values: params.field_values
      }),
      order: params.order,
      active: true
    };

    return await this.createRecord('sys_hub_action_instance', actionData);
  }

  async addSendEmailAction(params: SendEmailActionParams): Promise<any> {
    const actionData = {
      flow: params.flow_id,
      action_type: 'com.snc.process_flow.Send_Email',
      action_inputs: JSON.stringify({
        to: params.to,
        subject: params.subject,
        body: params.body
      }),
      order: params.order,
      active: true
    };

    return await this.createRecord('sys_hub_action_instance', actionData);
  }

  async addIfThenAction(params: IfThenActionParams): Promise<any> {
    const actionData = {
      flow: params.flow_id,
      action_type: 'com.snc.process_flow.If',
      action_inputs: JSON.stringify({
        condition: params.condition
      }),
      order: params.order,
      active: true
    };

    return await this.createRecord('sys_hub_action_instance', actionData);
  }

  async connectFlowActions(params: FlowConnectionParams): Promise<any> {
    const connectionData = {
      from_action: params.from_action,
      to_action: params.to_action,
      branch_type: params.branch_type || 'always'
    };

    return await this.createRecord('sys_hub_action_connection', connectionData);
  }
}
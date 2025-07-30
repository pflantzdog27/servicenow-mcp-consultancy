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

export class ServiceNowApiService {
  private client: AxiosInstance;
  private config: ServiceNowConfig;
  private logger?: SimpleLogger;

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
    // This would normally set the current update set
    // For now, we'll skip this as it requires special API permissions
    this.logger?.info(`Would set current update set to ${sysId}`, {
      service: 'servicenow-api',
      timestamp: new Date().toISOString()
    });
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
}
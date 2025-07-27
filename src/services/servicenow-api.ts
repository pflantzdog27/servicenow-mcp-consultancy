import axios, { AxiosInstance } from 'axios';
import { ServiceNowConfig, ServiceNowApiResponse } from '../types/servicenow.js';
import { SimpleLogger } from '../utils/simple-logger.js';

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
}
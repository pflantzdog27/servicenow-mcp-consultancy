export interface ServiceNowConfig {
  instanceUrl: string;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
  updateSetPrefix: string;
  defaultScope: string;
}

export interface ServiceNowAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface UpdateSet {
  sys_id: string;
  name: string;
  description: string;
  state: 'build' | 'complete' | 'ignore';
  application: string;
  created_on: string;
  created_by: string;
}

export interface CatalogItem {
  sys_id?: string;
  name: string;
  short_description: string;
  description?: string;
  category: string;
  active: boolean;
  template?: string;
  workflow?: string;
  picture?: string;
  cost?: number;
  price?: number;
}

export interface ServiceNowApiResponse<T = any> {
  result: T;
}

export interface ServiceNowError {
  error: {
    message: string;
    detail?: string;
  };
  status: string;
}
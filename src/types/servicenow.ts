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

export interface CatalogUIPolicy {
  sys_id?: string;
  name: string;
  short_description: string;
  catalog_item?: string;
  variable_set?: string;
  applies_to: 'item' | 'variable_set';
  catalog_conditions?: string;
  active: boolean;
  applies_catalog: boolean;
  applies_req_item: boolean;
  applies_sc_task: boolean;
  applies_target_record: boolean;
  on_load: boolean;
  reverse_if_false: boolean;
  order: number;
}

export interface CatalogUIPolicyAction {
  sys_id?: string;
  ui_policy: string;
  catalog_variable: string;  // "IO:" prefix + variable sys_id
  variable: string;          // Variable name string
  order: number;
  mandatory?: string;
  visible?: string;
  disabled?: string;
  cleared?: string;
  default_value?: string;
  help_tag?: string;
  help_text?: string;
}
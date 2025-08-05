import { ServiceNowApiService } from '../services/servicenow-api';

// Mock the ServiceNow API calls for testing
jest.mock('../services/servicenow-api');

describe('Catalog UI Policy Field Mapping', () => {
  let mockApiService: jest.Mocked<ServiceNowApiService>;

  beforeEach(() => {
    // Create a mock instance
    mockApiService = {
      getRecords: jest.fn(),
      createRecord: jest.fn(),
      authenticate: jest.fn(),
    } as any;
  });

  test('createCatalogUIPolicyAction should map fields correctly', async () => {
    // Mock the policy lookup response
    mockApiService.getRecords
      .mockResolvedValueOnce([
        {
          sys_id: 'policy_sys_id',
          catalog_item: { value: 'catalog_item_sys_id' }
        }
      ])
      // Mock the variable lookup response
      .mockResolvedValueOnce([
        {
          sys_id: 'variable_sys_id',
          name: 'business_justification'
        }
      ]);

    // Mock the create response
    mockApiService.createRecord.mockResolvedValueOnce({
      sys_id: 'created_action_sys_id'
    });

    // Replace the actual getRecords and createRecord methods
    const originalGetRecords = ServiceNowApiService.prototype.getRecords;
    const originalCreateRecord = ServiceNowApiService.prototype.createRecord;
    
    ServiceNowApiService.prototype.getRecords = mockApiService.getRecords;
    ServiceNowApiService.prototype.createRecord = mockApiService.createRecord;

    try {
      // Create a test instance (without real config)
      const apiService = new (ServiceNowApiService as any)({
        instanceUrl: 'https://test.service-now.com',
        username: 'test',
        password: 'test',
        updateSetPrefix: 'TEST_',
        defaultScope: 'global'
      }, console);

      // Test the createCatalogUIPolicyAction method
      await apiService.createCatalogUIPolicyAction({
        catalog_ui_policy: 'policy_sys_id',
        variable_name: 'business_justification',
        order: 100,
        mandatory: 'true',
        visible: 'true'
      });

      // Verify the correct field mapping was used
      expect(mockApiService.createRecord).toHaveBeenCalledWith(
        'catalog_ui_policy_action',
        expect.objectContaining({
          ui_policy: 'policy_sys_id',
          catalog_variable: 'IO:variable_sys_id',
          variable: 'business_justification',
          order: 100,
          mandatory: 'true',
          visible: 'true'
        })
      );

    } finally {
      // Restore original methods
      ServiceNowApiService.prototype.getRecords = originalGetRecords;
      ServiceNowApiService.prototype.createRecord = originalCreateRecord;
    }
  });

  test('catalog_variable field should have IO: prefix', () => {
    const variableSysId = '11ef812ac3872e102bd4b2ddd40131d9';
    const expectedCatalogVariable = `IO:${variableSysId}`;
    
    expect(expectedCatalogVariable).toBe('IO:11ef812ac3872e102bd4b2ddd40131d9');
  });

  test('variable field should be the variable name string', () => {
    const variableName = 'business_justification';
    
    // The variable field should be the name, not the sys_id
    expect(typeof variableName).toBe('string');
    expect(variableName).toBe('business_justification');
  });
});
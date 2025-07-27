# ServiceNow MCP Consultancy - Claude Context

This document provides context for Claude or other AI assistants working with this ServiceNow MCP server project.

## Project Overview

This is a Model Context Protocol (MCP) server that enables natural language interactions with ServiceNow instances. It's designed to be used as a tool within Claude Desktop or other MCP-compatible AI assistants to facilitate ServiceNow development and administration tasks.

## Key Technical Details

### Architecture
- **Language**: TypeScript
- **Runtime**: Node.js 18+
- **Protocol**: Model Context Protocol (MCP)
- **API Integration**: ServiceNow REST API
- **Authentication**: Basic Auth and OAuth 2.0

### Core Components

1. **MCP Server (`src/simple-index.ts`)**
   - Implements the MCP protocol
   - Handles tool registration and execution
   - Manages communication with AI assistants

2. **ServiceNow API Service (`src/services/servicenow-api.ts`)**
   - Wraps ServiceNow REST API calls
   - Handles authentication and session management
   - Provides typed interfaces for ServiceNow operations

3. **Configuration (`src/utils/simple-config.ts`)**
   - Manages environment variables
   - Validates configuration
   - Provides defaults and error handling

4. **Logging (`src/utils/simple-logger.ts`)**
   - Structured logging with levels
   - Request/response tracking
   - Error reporting and debugging

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow ESLint configuration
- Use async/await for asynchronous operations
- Implement comprehensive error handling

### Testing
- Write unit tests for new features
- Test against multiple ServiceNow versions
- Mock external API calls in tests
- Ensure all tools have proper validation

### Security Considerations
- Never log sensitive information (passwords, tokens)
- Validate all user inputs
- Use environment variables for credentials
- Implement rate limiting for API calls

## Common Tasks

### Adding New Tools

1. Define the tool schema in the MCP server
2. Implement the tool handler
3. Add ServiceNow API integration if needed
4. Write tests for the new tool
5. Update documentation

### Debugging Issues

1. Check logs in development mode (`LOG_LEVEL=debug`)
2. Verify ServiceNow instance connectivity
3. Ensure proper authentication credentials
4. Check ServiceNow API permissions

### ServiceNow API Patterns

**Query Records**:
```typescript
const incidents = await api.getTableRecords('incident', {
  query: 'active=true^assigned_to=javascript:gs.getUserID()',
  limit: 10
});
```

**Create Record**:
```typescript
const newIncident = await api.createRecord('incident', {
  short_description: 'New incident',
  urgency: 3,
  impact: 3
});
```

**Update Record**:
```typescript
await api.updateRecord('incident', 'INC0001234', {
  state: 2,
  work_notes: 'Updated via MCP'
});
```

## Natural Language Processing Tips

When processing natural language commands:

1. **Extract Key Information**:
   - Table name (incident, change_request, etc.)
   - Action (create, update, query, delete)
   - Fields and values
   - Query conditions

2. **Handle Variations**:
   - "Show incidents" → Query incident table
   - "Create new incident" → Create incident record
   - "Update INC0001234" → Update specific incident

3. **Default Assumptions**:
   - Active records unless specified
   - Current user context when applicable
   - Reasonable limits on query results

## Environment Configuration

### Required Variables
```env
SERVICENOW_INSTANCE=dev12345.service-now.com
SERVICENOW_USERNAME=admin
SERVICENOW_PASSWORD=password
```

### Optional Variables
```env
LOG_LEVEL=info|debug|error
UPDATE_SET_PREFIX=CUSTOM
DEFAULT_APPLICATION_SCOPE=global
```

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Verify credentials are correct
   - Check if account is locked
   - Ensure proper instance URL format

2. **API Permission Errors**
   - Verify user has necessary roles
   - Check table-level ACLs
   - Ensure REST API access is enabled

3. **Connection Timeouts**
   - Check network connectivity
   - Verify instance is accessible
   - Consider proxy settings if applicable

## Future Enhancements

Areas for potential improvement:

1. **Caching Layer**: Implement Redis for performance
2. **Batch Operations**: Support bulk record operations
3. **Webhook Support**: Real-time event notifications
4. **Advanced Queries**: GlideRecord-style query builder
5. **File Attachments**: Support for uploading/downloading files

## Important Notes

- Always test changes against a development instance first
- Be cautious with destructive operations (delete, bulk updates)
- Respect ServiceNow API rate limits
- Follow ServiceNow best practices for integrations

## Invoice Status Inquiry Implementation

The MCP server includes a comprehensive tool for implementing the Invoice Status Inquiry system. This tool creates all necessary components automatically.

### Usage Examples

**Preview the implementation:**
```natural
"Use the implement-invoice-status-inquiry tool with dry_run=true to preview what will be created"
```

**Full implementation:**
```natural
"Implement the complete Invoice Status Inquiry system for internal users"
```

**Individual component creation:**
```natural
"Create a Record Producer named 'Invoice Status Inquiry' for the sn_customerservice_case table"
"Add a reference variable named 'supplier' pointing to sn_fin_supplier table"
"Create a business rule named 'AP Invoice Status Regional Routing' for sn_customerservice_case table"
```

### Implementation Components

The Invoice Status Inquiry system includes:

1. **Table Extensions** (9 custom fields on sn_customerservice_case)
   - u_supplier (Reference to sn_fin_supplier)
   - u_customer_number (String, 50 chars)
   - u_tax_id (String, 50 chars)
   - u_invoice_entries (Long String for JSON data)
   - u_bulk_upload_used (Boolean)
   - u_additional_comments (String, 4000 chars)
   - u_urgency_level (Choice: low/medium/high/critical)
   - u_bot_eligible (Boolean)
   - u_bot_eligibility_reason (String, 255 chars)

2. **Assignment Groups** (5 regional groups)
   - AP_Helpdesk_NA
   - AP_Helpdesk_Canada
   - AP_Helpdesk_EMEA
   - AP_Helpdesk_APAC
   - AP_Helpdesk_Global

3. **Record Producer Configuration**
   - Name: "Invoice Status Inquiry"
   - Table: sn_customerservice_case
   - Scope: sn_customerservice
   - Access: Internal users only

4. **Variables** (6 form variables)
   - Supplier selection (mandatory reference)
   - Invoice entries (multi-row container)
   - Bulk upload option (checkbox)
   - Excel attachment (file upload)
   - Additional comments (multi-line text)
   - Urgency level (choice with default 'medium')

5. **Business Rules** (3 server-side rules)
   - Regional routing logic
   - Bot eligibility assessment
   - SLA assignment based on urgency

6. **Client Scripts** (3 form behaviors)
   - Form validation on submit
   - Bulk upload toggle functionality
   - Multi-row entry management

7. **UI Policies** (2 conditional displays)
   - Show/hide bulk upload fields
   - Critical urgency validation

### Detailed Code Examples

The implementation includes the actual JavaScript code from your specification:

**Business Rule - Regional Routing:**
```javascript
// AP Invoice Status Regional Routing
// Table: sn_customerservice_case
(function executeRule(current, previous) {
    current.category = 'Finance & Accounting';
    current.subcategory = 'Accounts Payable';
    current.contact_type = 'Invoice Status Inquiry';
    
    var supplier = new GlideRecord('sn_fin_supplier');
    if (supplier.get(current.u_supplier)) {
        current.u_customer_number = supplier.customer_number;
        current.u_tax_id = supplier.tax_id;
        current.short_description = 'Invoice Status Inquiry - ' + supplier.name;
    }
    
    var userCompany = gs.getUser().getCompanyID();
    var assignmentGroup = getInternalRoutingGroup(userCompany);
    current.assignment_group = assignmentGroup;
    
    function getInternalRoutingGroup(companyId) {
        var company = new GlideRecord('core_company');
        if (company.get(companyId)) {
            var country = company.country;
            return getRegionFromCountry(country);
        }
        return 'AP_Helpdesk_Global';
    }
    
    function getRegionFromCountry(country) {
        var countryMapping = {
            'US': 'AP_Helpdesk_NA',
            'CA': 'AP_Helpdesk_Canada',
            'GB': 'AP_Helpdesk_EMEA',
            'DE': 'AP_Helpdesk_EMEA',
            'FR': 'AP_Helpdesk_EMEA',
            'SG': 'AP_Helpdesk_APAC',
            'AU': 'AP_Helpdesk_APAC',
            'JP': 'AP_Helpdesk_APAC'
        };
        return countryMapping[country] || 'AP_Helpdesk_Global';
    }
})(current, previous);
```

**Client Script - Form Validation:**
```javascript
// Form validation on submit
function onSubmit() {
    var bulkUpload = g_form.getValue('bulk_upload_option');
    var invoiceEntries = g_form.getValue('invoice_entries');
    
    if (bulkUpload == 'false' && (!invoiceEntries || invoiceEntries.length == 0)) {
        g_form.addErrorMessage('Please add at least one invoice entry or use bulk upload option');
        return false;
    }
    
    if (!g_form.getValue('supplier')) {
        g_form.addErrorMessage('Please select a supplier');
        return false;
    }
    
    // Critical keyword detection
    var comments = g_form.getValue('additional_comments').toLowerCase();
    var criticalKeywords = ['fraud', 'legal notice', 'compliance', 'audit deadline'];
    
    for (var j = 0; j < criticalKeywords.length; j++) {
        if (comments.indexOf(criticalKeywords[j]) > -1) {
            g_form.setValue('urgency_level', 'critical');
            g_form.addInfoMessage('Critical keywords detected - priority set to Critical');
            break;
        }
    }
    
    return true;
}
```

### Available MCP Tools

The server provides these tools for ServiceNow development:

1. **test-connection** - Verify ServiceNow connectivity
2. **create-record-producer** - Create catalog record producers
3. **create-variable** - Add form variables
4. **create-variable-set** - Create multi-row variable sets
5. **create-ui-policy** - Define form behavior rules
6. **create-ui-policy-action** - Configure field actions
7. **create-client-script** - Add client-side JavaScript
8. **create-business-rule** - Create server-side logic
9. **create-table-field** - Extend table schemas
10. **create-assignment-group** - Create user groups
11. **implement-invoice-status-inquiry** - Complete system implementation

### Best Practices

When using these tools:

1. **Always test first** - Use dry_run=true to preview changes
2. **Verify scope** - Ensure you're working in the correct application scope
3. **Check dependencies** - Verify required tables and fields exist
4. **Follow naming conventions** - Use consistent prefixes (u_ for custom fields)
5. **Document changes** - Keep track of created components
6. **Test thoroughly** - Validate all functionality after implementation

## Resources

- [ServiceNow REST API Documentation](https://developer.servicenow.com/dev.do#!/reference/api/vancouver/rest/)
- [Model Context Protocol Specification](https://github.com/anthropics/mcp)
- [ServiceNow Developer Portal](https://developer.servicenow.com)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [ServiceNow Catalog Item Development](https://docs.servicenow.com/csh?topicname=c_CatalogItemDevelopment.html)
- [ServiceNow Business Rules](https://docs.servicenow.com/csh?topicname=c_BusinessRules.html)
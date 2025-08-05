# ServiceNow MCP Consultancy - Claude Context

This document provides context for Claude or other AI assistants working with this ServiceNow MCP server project.

## Recent Updates (Latest)

### Enhanced Business Rule Management ⭐ NEW
- **Enhanced create-business-rule** - Comprehensive validation, proper field mapping, operation arrays
- **update-business-rule** - Update existing business rules by sys_id  
- **Advanced validation** - Proper when/operation validation, script structure warnings
- **Natural language support** - Convert user requests to proper business rule parameters

### Update Set Management ⭐ NEW  
- **Enhanced set-current-update-set** - Proper API handling with fallback to direct field assignment
- **get-current-update-set** - Check currently tracked update set with details
- **Automatic tracking** - All record creation tools now automatically apply tracked update set
- **API limitation handling** - Graceful handling of ServiceNow REST API constraints

### Flow Designer Tools Added ⭐ 
- **create-flow** - Create Flow Designer flows for process automation
- **create-flow-trigger** - Set up triggers for flows (record events, schedules)
- **add-create-record-action** - Add record creation actions to flows
- **add-send-email-action** - Add email notification actions to flows

### Advanced Development Tools ⭐
- **create-script-include** - Create reusable server-side JavaScript functions
- **create-scheduled-job** - Create automated script execution jobs  
- **create-email-notification** - Create automated email notifications
- **create-catalog-client-script** - Create catalog-specific client scripts
- **Enhanced create-ui-policy** - Added script_true/script_false parameters

### Features
✅ **26 total MCP tools** now available (added get-current-update-set)  
✅ **Enhanced business rule management** with comprehensive validation  
✅ **Update set tracking** with automatic application to all records  
✅ **API limitation handling** for ServiceNow REST constraints  
✅ **Full TypeScript interfaces** for all functions  
✅ **Flow Designer integration** for visual process automation
✅ **Backward compatibility** maintained  
✅ **Complete documentation** with usage examples

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

#### Core Development Tools
1. **test-connection** - Verify ServiceNow connectivity
2. **query-records** - Query ServiceNow table records with filters
3. **create-catalog-item** - Create catalog items using natural language
4. **create-record-producer** - Create catalog record producers
5. **create-variable** - Add form variables
6. **create-variable-set** - Create multi-row variable sets
7. **create-table-field** - Extend table schemas
8. **create-assignment-group** - Create user groups

#### Advanced Development Tools ⭐ NEW
9. **create-script-include** - Create reusable server-side JavaScript functions
10. **create-scheduled-job** - Create automated script execution jobs
11. **create-email-notification** - Create automated email notifications
12. **create-catalog-client-script** - Create catalog-specific client scripts

#### Flow Designer Tools ⭐ NEW
13. **create-flow** - Create Flow Designer flows
14. **create-flow-trigger** - Create triggers for flows (record created/updated, scheduled)
15. **add-create-record-action** - Add Create Record actions to flows
16. **add-send-email-action** - Add Send Email actions to flows

#### Form Behavior & Logic Tools
17. **create-ui-policy** - Define form behavior rules (✨ Enhanced with script execution)
18. **create-ui-policy-action** - Configure field actions
19. **create-client-script** - Add client-side JavaScript
20. **create-business-rule** - Create server-side logic (✨ Enhanced with comprehensive validation)

#### System Management Tools
21. **create-update-set** - Create update sets for change tracking
22. **set-current-update-set** - Set active update set (✨ Enhanced with API limitation handling)
23. **get-current-update-set** - Check currently tracked update set ⭐ NEW
24. **create-application-scope** - Create application scopes
25. **set-application-scope** - Set current application scope

#### Specialized Tools  
26. **implement-invoice-status-inquiry** - Complete system implementation
27. **update-business-rule** - Update existing business rules ⭐ NEW

## New Tools Documentation

### Advanced Development Tools ⭐

#### create-script-include
Creates reusable server-side JavaScript functions in the `sys_script_include` table.

**Parameters:**
- `name` (required) - Script Include name
- `script` (required) - JavaScript code
- `description` - Description of the Script Include
- `application_scope` - Application scope (default: global)
- `api_name` - API name (defaults to name)
- `access` - Access level: public, package_private, private (default: package_private)
- `active` - Active status (default: true)

**Example Usage:**
```natural
"Create a Script Include named 'UtilityFunctions' with public access that contains helper functions for data validation"
```

#### create-scheduled-job
Creates automated script execution jobs in the `sysauto_script` table.

**Parameters:**
- `name` (required) - Scheduled job name
- `script` (required) - JavaScript code to execute
- `description` - Job description
- `run_period` - Run period: daily, weekly, monthly, etc. (default: daily)
- `run_time` - Run time in HH:MM:SS format (default: 00:00:00)
- `run_dayofweek` - Day of week for weekly jobs (1-7)
- `run_dayofmonth` - Day of month for monthly jobs (1-31)
- `active` - Active status (default: true)
- `conditional` - Use conditional execution (default: false)
- `condition` - Condition script for conditional execution

**Example Usage:**
```natural
"Create a daily scheduled job named 'Data Cleanup' that runs at 02:00:00 to clean up old records"
```

#### create-email-notification
Creates automated email notifications in the `sysevent_email_action` table.

**Parameters:**
- `name` (required) - Email notification name
- `table` (required) - Target table
- `event` (required) - Event trigger: insert, update, delete
- `subject` (required) - Email subject line
- `message` (required) - Email message body
- `recipients` - Recipient email addresses or field names
- `cc_list` - CC email addresses
- `from` - From email address
- `active` - Active status (default: true)
- `advanced_condition` - Advanced condition script
- `weight` - Execution order weight (default: 0)

**Example Usage:**
```natural
"Create an email notification for the incident table on insert that sends alerts to the assigned user"
```

#### create-catalog-client-script
Creates catalog-specific client scripts in the `catalog_script_client` table.

**Parameters:**
- `name` (required) - Client script name
- `catalog_item` (required) - Catalog item sys_id
- `type` (required) - Script type: onLoad, onChange, onSubmit, onCellEdit
- `script` (required) - JavaScript code
- `field` - Field name for onChange scripts
- `description` - Script description
- `active` - Active status (default: true)
- `applies_to` - Where the script applies (default: catalog)

**Example Usage:**
```natural
"Create an onChange catalog client script for the 'priority' field that updates related fields based on selection"
```

### Flow Designer Tools ⭐

#### create-flow
Creates a new Flow Designer flow in the `sys_hub_flow` table.

**Parameters:**
- `name` (required) - Flow name
- `description` - Flow description
- `scope` - Application scope (default: global)
- `active` - Active status (default: true)

**Example Usage:**
```natural
"Create a flow named 'Incident Auto-Assignment' that routes incidents based on category"
```

#### create-flow-trigger
Creates a trigger that starts a flow based on specific events.

**Parameters:**
- `flow_id` (required) - Flow sys_id
- `type` (required) - Trigger type: record_created, record_updated, scheduled
- `table` - Target table for record triggers
- `condition` - Condition script for when trigger fires

**Example Usage:**
```natural
"Create a record_created trigger for the incident table on the flow abc123"
```

#### add-create-record-action
Adds a Create Record action to an existing flow.

**Parameters:**
- `flow_id` (required) - Flow sys_id
- `table` (required) - Table to create record in
- `field_values` (required) - Object containing field-value pairs
- `order` (required) - Execution order (1, 2, 3, etc.)

**Example Usage:**
```natural
"Add a Create Record action to flow abc123 that creates a task with short_description 'Follow up required'"
```

#### add-send-email-action
Adds a Send Email action to an existing flow.

**Parameters:**
- `flow_id` (required) - Flow sys_id
- `to` (required) - Email recipient(s)
- `subject` (required) - Email subject line
- `body` (required) - Email body content
- `order` (required) - Execution order

**Example Usage:**
```natural
"Add a Send Email action to flow abc123 that notifies the assigned user"
```

### Enhanced Tools ✨

#### create-business-rule (Enhanced)
Now includes comprehensive validation, proper field mapping, and natural language processing.

**Enhanced Features:**
- ✅ **Comprehensive validation** - Required fields, when values, operation arrays
- ✅ **Flexible operation format** - Supports both arrays and comma-separated strings  
- ✅ **Advanced field support** - filter_condition, role_conditions, advanced options
- ✅ **Script structure warnings** - Validates proper function wrapper format
- ✅ **Update set integration** - Automatic sys_update_set field assignment
- ✅ **Natural language processing** - Converts user requests to proper parameters

**Schema Definition:**
```javascript
{
  name: string (required),
  table: string (required), 
  when: 'before'|'after'|'async'|'display' (required),
  operation: ['insert','update','delete','query'] (array or string),
  script: string (required),
  description: string,
  order: number (default: 100),
  condition: string,
  filter_condition: string,
  advanced: boolean,
  active: boolean (default: true),
  role_conditions: string
}
```

#### update-business-rule (New)
Update existing business rules by sys_id with validation and tracking.

**Parameters:**
- `sys_id` (required) - Business Rule sys_id to update
- All create-business-rule parameters (optional) - Only provided fields are updated

**Example Usage:**
```natural
"Update business rule abc123 to also run on delete operations and change order to 50"
```

#### set-current-update-set (Enhanced)
Now handles ServiceNow REST API limitations gracefully.

**Enhanced Features:**
- ✅ **User preference management** - Attempts to set sys_user_preference properly
- ✅ **Fallback mechanism** - Uses direct field assignment when API fails
- ✅ **Session tracking** - Maintains update set state throughout MCP session
- ✅ **Clear messaging** - Explains API limitations and workaround approach

#### get-current-update-set (New)
Check the currently tracked update set with detailed information.

**Features:**
- ✅ **Update set details** - Fetches name, description, state from ServiceNow
- ✅ **Status reporting** - Clear indication of tracking status
- ✅ **Error handling** - Graceful fallback when details cannot be fetched

**Example Usage:**
```natural
"What update set is currently being used?"
```

#### create-ui-policy (Enhanced)
Now supports script execution with conditional logic.

**New Parameters:**
- `script_true` - JavaScript code to execute when condition is true
- `script_false` - JavaScript code to execute when condition is false

**Example Usage:**
```natural
"Create a UI Policy that shows additional fields when urgency is critical and executes custom validation script"
```

### Tool Usage Patterns

#### Flow Designer Development
```javascript
// Example: Create an incident auto-assignment flow
// Step 1: Create the flow
const flow = await createFlow({
  name: "Incident Auto Assignment",
  description: "Automatically assign incidents based on category and priority",
  scope: "global",
  active: true
});

// Step 2: Add a trigger
const trigger = await createFlowTrigger({
  flow_id: flow.sys_id,
  type: "record_created",
  table: "incident",
  condition: "priority=1^ORpriority=2"
});

// Step 3: Add a Create Record action
const taskAction = await addCreateRecordAction({
  flow_id: flow.sys_id,
  table: "task",
  field_values: {
    short_description: "Review high priority incident",
    description: "A high priority incident was created: ${trigger.number}",
    assigned_to: "javascript:gs.getUserID()"
  },
  order: 1
});

// Step 4: Add an email notification
const emailAction = await addSendEmailAction({
  flow_id: flow.sys_id,
  to: "${trigger.assigned_to.email}",
  subject: "High Priority Incident: ${trigger.number}",
  body: "A high priority incident has been assigned to you. Please review immediately.",
  order: 2
});
```

#### Script Include Development
```javascript
// Example Script Include structure
var UtilityFunctions = Class.create();
UtilityFunctions.prototype = {
    initialize: function() {
    },
    
    validateEmail: function(email) {
        var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    },
    
    formatCurrency: function(amount, currency) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD'
        }).format(amount);
    },
    
    type: 'UtilityFunctions'
};
```

#### Scheduled Job Patterns
```javascript
// Example scheduled job for data maintenance
(function() {
    var gr = new GlideRecord('incident');
    gr.addQuery('state', '7'); // Closed
    gr.addQuery('sys_created_on', '<', gs.daysAgoStart(90));
    gr.query();
    
    var count = 0;
    while (gr.next()) {
        // Archive or clean up old incidents
        count++;
    }
    
    gs.info('Processed ' + count + ' old incidents');
})();
```

#### Email Notification Templates
```javascript
// Advanced condition example
(function() {
    // Only send notification for high priority incidents
    return current.priority.toString() === '1';
})();
```

```html
<!-- Email message template -->
<p>A new ${current.table} has been created:</p>
<ul>
    <li><strong>Number:</strong> ${current.number}</li>
    <li><strong>Short Description:</strong> ${current.short_description}</li>
    <li><strong>Priority:</strong> ${current.priority.getDisplayValue()}</li>
    <li><strong>Assigned to:</strong> ${current.assigned_to.getDisplayValue()}</li>
</ul>
<p>Please review and take appropriate action.</p>
```

### Update Set Management

#### Workflow
1. **Create Update Set**: Use `create-update-set` to create a new update set
2. **Set Current**: Use `set-current-update-set` with the sys_id to track changes
3. **Verify Tracking**: Use `get-current-update-set` to confirm active tracking
4. **Create Records**: All subsequent record creation automatically includes update set
5. **Check Status**: Use `get-current-update-set` anytime to see current status

#### API Limitation Handling
The MCP server handles ServiceNow REST API limitations for update set management:

**The Challenge:**
- ServiceNow REST API doesn't allow setting user session preferences
- Standard approach requires admin privileges or special API endpoints

**The Solution:**  
- ✅ **Dual approach**: Try user preference API, fallback to direct field assignment
- ✅ **Session tracking**: MCP server maintains current update set per session
- ✅ **Automatic application**: All record creation tools add `sys_update_set` field
- ✅ **Transparent operation**: Same user experience regardless of API constraints

**Usage Examples:**
```natural
"Set update set abc123 as current"
"What update set am I using?"
"Create a business rule for incident validation" // Automatically includes update set
```

### Business Rule Management

#### Natural Language Processing
The enhanced business rule tools understand natural language requests:

**Timing Keywords:**
- "before save/submit/create" → `when: "before"`
- "after creation/update/save" → `when: "after"`  
- "when displaying/loading" → `when: "display"`
- "in background/asynchronously" → `when: "async"`

**Operation Keywords:**
- "when creating/new record" → `operation: ["insert"]`
- "when updating/modifying" → `operation: ["update"]`
- "when deleting/removing" → `operation: ["delete"]`
- "for any change" → `operation: ["insert", "update"]`

**Pattern Recognition:**
- "Set [field] to [value]" → Before rule with field assignment
- "Validate that [condition]" → Before rule with validation logic
- "Update related [table]" → After rule with GlideRecord queries
- "Send notification when" → After rule with gs.eventQueue
- "Prevent save if" → Before rule with current.setAbortAction(true)

#### Common Business Rule Patterns

**1. Field Validation (Before)**
```javascript
(function executeRule(current, previous) {
    if (!current.short_description || current.short_description.toString().length < 10) {
        current.setAbortAction(true);
        gs.addErrorMessage('Short description must be at least 10 characters');
    }
})(current, previous);
```

**2. Auto-Population (Before)**
```javascript
(function executeRule(current, previous) {
    if (!current.assignment_group && current.category == 'hardware') {
        current.assignment_group = 'HARDWARE_GROUP_SYS_ID';
    }
})(current, previous);
```

**3. Related Record Update (After)**
```javascript
(function executeRule(current, previous) {
    if (current.state == 'closed' && previous.state != 'closed') {
        var tasks = new GlideRecord('sc_task');
        tasks.addQuery('request_item', current.sys_id);
        tasks.addQuery('state', '!=', 'closed');
        tasks.query();
        while (tasks.next()) {
            tasks.state = 'closed';
            tasks.work_notes = 'Automatically closed - parent request closed';
            tasks.update();
        }
    }
})(current, previous);
```

**4. Notification Trigger (After)**
```javascript
(function executeRule(current, previous) {
    if (current.priority == 1 && previous.priority != 1) {
        gs.eventQueue('priority.escalated', current, current.assigned_to, current.number);
    }
})(current, previous);
```

#### Business Rule Best Practices

**Field Requirements:**
- ✅ **Required**: name, table, when, script
- ✅ **Important**: operation, order, active, description
- ✅ **Advanced**: condition, filter_condition, role_conditions, advanced

**Validation Rules:**
- ✅ **Table names**: Must be valid ServiceNow tables (incident, problem, change_request, etc.)
- ✅ **When values**: Must be before, after, async, or display
- ✅ **Script structure**: Should be wrapped in function(current, previous) {}
- ✅ **Operations**: insert, update, delete, query (array or comma-separated string)

**Best Practices:**
- ❌ **NEVER** use current.update() in business rules (causes recursion)
- ✅ **Use 'after' rules** for related record updates (prevents timing issues)
- ✅ **Keep conditions simple** - complex logic belongs in the script
- ✅ **Use meaningful names** - include table and purpose
- ✅ **Set appropriate order** - 100 is default, lower numbers run first

### Best Practices

When using these tools:

#### General Development
1. **Always test first** - Use dry_run=true to preview changes where available
2. **Verify scope** - Ensure you're working in the correct application scope
3. **Check dependencies** - Verify required tables and fields exist
4. **Follow naming conventions** - Use consistent prefixes (u_ for custom fields)
5. **Document changes** - Keep track of created components
6. **Test thoroughly** - Validate all functionality after implementation

#### Script Include Best Practices
7. **Use proper class structure** - Follow ServiceNow's class-based pattern
8. **Set appropriate access levels** - Use package_private unless public access is needed
9. **Include comprehensive error handling** - Wrap functions in try-catch blocks
10. **Document function parameters** - Use JSDoc comments for clarity

#### Scheduled Job Best Practices
11. **Limit execution time** - Keep scripts efficient to avoid timeouts
12. **Use conditional execution** - Add conditions to prevent unnecessary runs
13. **Log execution results** - Use gs.info() to track job performance
14. **Handle large datasets** - Use chunking for bulk operations

#### Email Notification Best Practices
15. **Use advanced conditions** - Only send emails when truly necessary
16. **Template variables properly** - Use ${field.getDisplayValue()} for display values
17. **Set appropriate weight** - Order notifications by importance
18. **Test email templates** - Verify formatting and variable substitution

#### UI Policy & Client Script Best Practices
19. **Minimize DOM manipulation** - Use ServiceNow's g_form API when possible
20. **Handle null values** - Always check for undefined/null before processing
21. **Use script_true/script_false wisely** - Keep conditional scripts lightweight
22. **Validate user input** - Implement proper client-side validation

#### Flow Designer Best Practices
23. **Plan flow structure** - Design flows with clear start and end points
24. **Use descriptive names** - Name flows and actions clearly for maintainability
25. **Limit action complexity** - Keep individual actions focused and simple
26. **Test with sample data** - Validate flows with different input scenarios
27. **Monitor flow execution** - Review flow execution history for optimization
28. **Use conditions wisely** - Add conditional logic to prevent unnecessary actions
29. **Document flow purpose** - Include detailed descriptions for each flow
30. **Version control flows** - Export flows regularly for backup and versioning

#### Update Set Best Practices  
31. **Create meaningful update sets** - Use descriptive names and descriptions
32. **Set update set before development** - Always track changes from the start
33. **Verify tracking status** - Use get-current-update-set to confirm active tracking
34. **Group related changes** - Keep logically related modifications in same update set
35. **Document update set contents** - Include clear descriptions of what's included

#### Business Rule Best Practices
36. **Validate input early** - Use before rules for data validation
37. **Handle timing properly** - Use after rules for related record updates
38. **Avoid recursion** - Never use current.update() in business rules
39. **Use proper script structure** - Always wrap in function(current, previous) {}
40. **Test with various scenarios** - Validate with insert, update, and edge cases
41. **Use meaningful conditions** - Keep condition logic simple and readable
42. **Set appropriate execution order** - Use order field to control rule sequence
43. **Include error handling** - Use try-catch blocks for complex operations
44. **Log important actions** - Use gs.log() for debugging and audit trails
45. **Follow role-based access** - Use role_conditions when appropriate

## Important Implementation Notes

### Update Set Integration
All record creation tools in the MCP server now automatically include update set tracking:

```javascript
// Helper method used across all tools
private addUpdateSetToRecord(recordData: any): any {
  if (this.currentUpdateSetId && !recordData.sys_update_set) {
    recordData.sys_update_set = this.currentUpdateSetId;
  }
  return recordData;
}
```

**Affected Tools:**
- create-record (generic)
- create-business-rule  
- create-client-script
- create-table-field
- create-record-producer
- create-variable
- create-assignment-group
- create-ui-policy-action
- All other record creation tools

### Business Rule Field Mapping
The enhanced business rule implementation properly maps to ServiceNow's sys_script table:

```javascript
// Proper ServiceNow field mapping
{
  name: args.name,              // Business rule name
  table: args.table,            // Target table
  when: args.when,              // before|after|async|display
  insert: operations.includes('insert'),    // Run on insert
  update: operations.includes('update'),    // Run on update  
  delete: operations.includes('delete'),    // Run on delete
  query: operations.includes('query'),      // Run on query
  script: args.script,          // JavaScript code
  description: args.description,// Description
  order: args.order || 100,     // Execution order
  condition: args.condition,    // Condition script
  filter_condition: args.filter_condition, // Encoded query
  advanced: args.advanced,      // Advanced options
  active: args.active !== false, // Active status
  role_conditions: args.role_conditions // Role restrictions
}
```

### API Limitation Handling
The MCP server gracefully handles ServiceNow REST API limitations:

**Update Set Preference Management:**
```javascript
// Attempts proper user preference setting
// Falls back to direct field assignment if API fails
try {
  await api.setCurrentUpdateSet(update_set_id);
} catch (prefError) {
  // Graceful fallback - still tracks locally
  this.logger.warn('Using direct field assignment fallback');
}
```

**Direct Field Assignment:**
```javascript
// All record creation includes update set field
async createRecord(table: string, data: any) {
  if (this.currentUpdateSetId && !data.sys_update_set) {
    data.sys_update_set = this.currentUpdateSetId;
  }
  // ... create record
}
```

## Resources

- [ServiceNow REST API Documentation](https://developer.servicenow.com/dev.do#!/reference/api/vancouver/rest/)
- [Model Context Protocol Specification](https://github.com/anthropics/mcp)
- [ServiceNow Developer Portal](https://developer.servicenow.com)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [ServiceNow Catalog Item Development](https://docs.servicenow.com/csh?topicname=c_CatalogItemDevelopment.html)
- [ServiceNow Business Rules](https://docs.servicenow.com/csh?topicname=c_BusinessRules.html)
- [ServiceNow Update Sets](https://docs.servicenow.com/csh?topicname=c_UpdateSets.html)
- [ServiceNow sys_script Table](https://docs.servicenow.com/csh?topicname=r_ScriptingAPIReference.html)
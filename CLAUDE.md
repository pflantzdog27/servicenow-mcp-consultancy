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

## Resources

- [ServiceNow REST API Documentation](https://developer.servicenow.com/dev.do#!/reference/api/vancouver/rest/)
- [Model Context Protocol Specification](https://github.com/anthropics/mcp)
- [ServiceNow Developer Portal](https://developer.servicenow.com)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
# ServiceNow MCP Natural Language Development Server

A comprehensive Model Context Protocol (MCP) server that enables natural language development for ServiceNow. This server allows developers to create and manage ServiceNow artifacts using plain English commands.

## 🚀 Features

- **Natural Language Interface**: Create ServiceNow catalog items, variables, UI policies, and client scripts using plain English
- **Multi-Authentication Support**: OAuth2 and Basic Authentication for ServiceNow
- **Update Set Management**: Automatic update set creation and management with customizable naming conventions
- **Application Scope Handling**: Automatic application scope detection and switching
- **ServiceNow Version Compatibility**: Supports Washington through Yokohama versions
- **Comprehensive Error Handling**: Robust error handling with detailed feedback
- **TypeScript Support**: Full TypeScript implementation with comprehensive type definitions

## 📋 Supported Natural Language Commands

### Catalog Item Management
```
"Create a catalog item called 'New Laptop Request' in IT Service Catalog"
"Add a catalog item named 'Software License' with description 'Request software licenses'"
```

### Test Connection
```
"Use the test-connection tool to verify my ServiceNow instance"
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pflantzdog27/servicenow-consultancy.git
   cd servicenow-consultancy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your ServiceNow instance details
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file with the following variables:

```bash
# ServiceNow Instance Configuration
SERVICENOW_INSTANCE_URL=https://your-instance.service-now.com
SERVICENOW_USERNAME=your-username
SERVICENOW_PASSWORD=your-password

# OAuth2 Configuration (alternative to username/password)
SERVICENOW_CLIENT_ID=your-client-id
SERVICENOW_CLIENT_SECRET=your-client-secret

# Update Set Configuration
UPDATE_SET_PREFIX=CUSTOM
DEFAULT_APPLICATION_SCOPE=global

# Logging Configuration
LOG_LEVEL=info

# MCP Server Configuration
MCP_SERVER_NAME=servicenow-nlp
MCP_SERVER_VERSION=1.0.0
```

## 🚀 Usage

### Starting the Server

```bash
# Basic usage with environment variables
npm start

# Development mode
npm run dev
```

### MCP Client Integration

The server implements the Model Context Protocol and can be used with any MCP-compatible client:

### Claude Desktop Integration

Add to your Claude Desktop configuration file (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "servicenow-nlp": {
      "command": "node",
      "args": ["/path/to/servicenow-consultancy/dist/simple-index.js"],
      "env": {
        "SERVICENOW_INSTANCE_URL": "https://your-instance.service-now.com",
        "SERVICENOW_USERNAME": "your-username",
        "SERVICENOW_PASSWORD": "your-password",
        "UPDATE_SET_PREFIX": "CUSTOM",
        "DEFAULT_APPLICATION_SCOPE": "global",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Available Tools

1. **test-connection**: Test connection to ServiceNow instance
2. **create-catalog-item**: Create ServiceNow catalog items with natural language

## 🧪 Testing

### Running Tests

```bash
# Run all tests with coverage
npm test

# Development testing
npm run dev
```

## 🏗️ Architecture

```
src/
├── simple-index.ts      # Main entry point
├── simple-server.ts     # MCP server implementation
├── services/
│   └── servicenow-api.ts # ServiceNow API service
├── types/
│   ├── servicenow.ts    # ServiceNow type definitions
│   └── mcp.ts          # MCP tool schemas
└── utils/
    ├── simple-config.ts # Configuration management
    └── simple-logger.ts # Logging utilities
```

## 🔒 Security

- Sensitive data sanitization in logs
- Secure credential handling
- Rate limiting to prevent API abuse
- Input validation and sanitization
- Error message sanitization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details.

## 🆘 Support

- Check the documentation in the `src/` directories
- Review test files for usage examples
- Check logs for detailed error information
- Open issues for bugs or feature requests

## 🗂️ ServiceNow Compatibility

### Supported Versions
- Washington (WAS)
- Xanadu (XAN)
- Yokohama (YOK)

### Supported Modules
- Service Portal
- IT Service Management (ITSM)
- HR Service Delivery (HRSD)
- Financial Management
- Customer Service Management (CSM)

### Update Set Management
- Automatic creation with naming convention: `PREFIX_YYYY_MM_DD_Description`
- Application scope-aware operations
- Proper dependency handling
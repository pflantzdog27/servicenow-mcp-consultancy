# ServiceNow MCP Consultancy

A Model Context Protocol (MCP) server that enables natural language interactions with ServiceNow instances, designed to revolutionize how developers and consultants work with the ServiceNow platform.

## 🚀 Overview

This project provides a natural language interface for ServiceNow development, allowing developers to interact with ServiceNow instances using conversational commands. Built on the Model Context Protocol (MCP), it seamlessly integrates with AI assistants like Claude to provide an intuitive development experience.

## ✨ Features

### Core Capabilities
- **Natural Language Interface**: Interact with ServiceNow using plain English commands
- **MCP Protocol Implementation**: Full compatibility with Claude and other MCP-enabled AI assistants
- **ServiceNow REST API Integration**: Comprehensive coverage of ServiceNow REST APIs
- **Secure Authentication**: Support for basic auth and OAuth 2.0
- **Session Management**: Intelligent session handling and connection pooling
- **Comprehensive Logging**: Detailed logging for debugging and monitoring

### ServiceNow Operations
- **Record Management**: Query, create, update, and delete records from any table
- **Incident Management**: Create and manage incidents with natural language
- **Change Management**: Handle change requests and approvals
- **Knowledge Base**: Search and manage knowledge articles
- **Workflow Execution**: Trigger and monitor workflows
- **Catalog Items**: Browse and order from the service catalog
- **User Management**: Query and update user records
- **Group Management**: Manage groups and membership

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- ServiceNow instance with admin access
- Claude Desktop (for MCP integration)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/pflantzdog27/servicenow-mcp-consultancy.git
   cd servicenow-consultancy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your ServiceNow instance details:
   ```env
   SERVICENOW_INSTANCE=your-instance.service-now.com
   SERVICENOW_USERNAME=your-username
   SERVICENOW_PASSWORD=your-password
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Configure Claude Desktop**
   Add to your Claude Desktop configuration:
   ```json
   {
     "mcpServers": {
       "servicenow": {
         "command": "node",
         "args": ["path/to/servicenow-consultancy/dist/simple-index.js"]
       }
     }
   }
   ```

## 📖 Usage

### Basic Commands

```natural
"Show me all open incidents assigned to me"
"Create a new incident for database connection issues"
"Update incident INC0010234 with a work note"
"Search knowledge base for password reset procedures"
"List all active change requests scheduled for this week"
```

### Advanced Operations

```natural
"Create a catalog item request for new laptop with 16GB RAM"
"Generate a report of all P1 incidents from last month"
"Update the assignment group for all incidents matching 'network'"
"Check the approval status of change request CHG0045678"
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Project Structure

```
servicenow-consultancy/
├── src/
│   ├── services/      # ServiceNow API integrations
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Utility functions
│   ├── simple-index.ts    # MCP server entry point
│   └── simple-server.ts   # Express server for testing
├── dist/              # Compiled JavaScript
├── tests/             # Test files
└── docs/              # Documentation
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with the [Model Context Protocol](https://github.com/anthropics/mcp)
- Powered by [ServiceNow REST APIs](https://developer.servicenow.com/dev.do)
- TypeScript and Node.js ecosystem

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/pflantzdog27/servicenow-mcp-consultancy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/pflantzdog27/servicenow-mcp-consultancy/discussions)

## 🗺️ Roadmap

- [ ] GraphQL API support
- [ ] Advanced workflow designer integration
- [ ] Multi-instance management
- [ ] Performance analytics dashboard
- [ ] Enhanced security features
- [ ] Plugin marketplace
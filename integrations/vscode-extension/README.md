# VS Code Extension for Enterprise AI Platform

## Overview
This VS Code extension integrates your development workspace with the Enterprise AI Development Platform, enabling intelligent code analysis, feature planning, and automated implementation.

## Features

### 🚀 Workspace Analysis
- **Automatic Detection**: Scans your workspace for git repositories and technology stacks
- **Multi-Repo Support**: Analyzes complex projects with multiple repositories
- **Language Detection**: Identifies programming languages and frameworks
- **Dependency Mapping**: Builds dependency graphs across repositories

### 🧠 AI-Powered Planning
- **Context-Aware**: Uses your actual codebase for planning
- **Evidence-Based**: All plans link to actual files and evidence
- **Risk Assessment**: Identifies potential issues before implementation
- **Phased Execution**: Breaks features into safe, manageable phases

### 🔧 Smart Implementation
- **Scoped Changes**: Only modifies files that need changing
- **Pattern Compliance**: Follows your existing coding patterns
- **Automated Testing**: Generates tests alongside code changes
- **PR Creation**: Automatically creates pull requests with descriptions

## Installation

### From Marketplace
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Enterprise AI Platform"
4. Click Install

### From Source
```bash
git clone https://github.com/anandkiran2007/enterprise-ai-dev-platform-
cd enterprise-ai-dev-platform-/integrations/vscode-extension
npm install
npm run compile
vsce package
```

## Configuration

### API Connection
1. Open VS Code Settings
2. Search for "Enterprise AI Platform"
3. Configure:
   - **API URL**: `http://localhost:8000`
   - **API Token**: Your authentication token
   - **Workspace Path**: Your project root directory

### Workspace Setup
```json
{
  "enterpriseAI.platform": {
    "apiUrl": "http://localhost:8000",
    "apiToken": "your-token-here",
    "workspacePath": "/path/to/your/project",
    "autoSync": true,
    "showRecommendations": true
  }
}
```

## Usage

### 1. Analyze Workspace
- Open Command Palette (Ctrl+Shift+P)
- Run "Enterprise AI: Analyze Workspace"
- View analysis results in the sidebar

### 2. Create Feature Request
- Select files in explorer
- Right-click and choose "Create Feature Request"
- Describe the feature you want to implement
- Review the generated execution plan

### 3. Get Code Context
- Open a file
- Run "Enterprise AI: Get Context"
- View related files and AI suggestions
- Use context for better AI assistance

### 4. Monitor Progress
- Open the Enterprise AI panel
- View active agent executions
- Track feature implementation progress
- Review generated pull requests

## Commands

| Command | Shortcut | Description |
|---------|-----------|-------------|
| `Enterprise AI: Analyze Workspace` | Ctrl+Shift+P | Analyze current workspace |
| `Enterprise AI: Create Feature Request` | Ctrl+Shift+P | Create feature from selection |
| `Enterprise AI: Get Code Context` | Ctrl+Shift+P | Get AI context for current file |
| `Enterprise AI: Sync Workspace` | Ctrl+Shift+P | Trigger workspace sync |
| `Enterprise AI: Show Agent Status` | Ctrl+Shift+P | Show agent execution status |

## Sidebar Panels

### 📊 Workspace Overview
- Repository count and types
- Technology stack summary
- Risk assessment
- Recommendations

### 🎯 Feature Planning
- Active feature requests
- Execution plans
- Blast radius analysis
- Risk assessments

### 🤖 Agent Status
- Running agents
- Execution progress
- Token usage
- Error logs

### 📝 Code Context
- Current file analysis
- Related files
- AI suggestions
- Dependency information

## Integration with Cursor

The extension also works seamlessly with Cursor:

### Cursor Integration Features
- **Native Commands**: Access Enterprise AI features from Cursor's command palette
- **Context Preservation**: Maintains context across Cursor sessions
- **Smart Suggestions**: Enhances Cursor's AI with your codebase context
- **Automated Sync**: Syncs changes automatically

### Setup in Cursor
1. Open Cursor Settings
2. Navigate to Extensions
3. Install "Enterprise AI Platform"
4. Configure API connection
5. Enable workspace integration

## API Integration

The extension communicates with the Enterprise AI Platform via REST API:

### Authentication
```typescript
const response = await fetch('/api/auth/github', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code, redirect_uri })
});
```

### Workspace Analysis
```typescript
const analysis = await fetch('/api/integration/workspace/analyze', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ workspace_path })
});
```

### Feature Requests
```typescript
const feature = await fetch('/api/integration/workspace/feature-request', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    workspace_path,
    selected_files,
    feature_description
  })
});
```

## Development

### Local Development
```bash
cd integrations/vscode-extension
npm install
npm run dev
```

### Testing
```bash
npm run test
npm run compile
npm run lint
```

### Packaging
```bash
npm run package
# Creates .vsix file for distribution
```

## Troubleshooting

### Common Issues

**Connection Failed**
- Check API URL is correct
- Verify API token is valid
- Ensure platform is running

**Workspace Not Found**
- Verify workspace path exists
- Check git repositories are present
- Ensure proper file permissions

**Agent Not Responding**
- Check Redis connection
- Verify worker processes
- Review agent logs

### Debug Mode
Enable debug logging in VS Code settings:
```json
{
  "enterpriseAI.debug": true
}
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## Support

- **Documentation**: [Platform Docs](https://github.com/anandkiran2007/enterprise-ai-dev-platform-/docs)
- **Issues**: [GitHub Issues](https://github.com/anandkiran2007/enterprise-ai-dev-platform-/issues)
- **Discussions**: [GitHub Discussions](https://github.com/anandkiran2007/enterprise-ai-dev-platform-/discussions)

## License

MIT License - see LICENSE file for details

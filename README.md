# Cursor Pro Limits MCP Server

A Model Context Protocol (MCP) server for monitoring Cursor Pro usage limits and API quotas. This server helps you track your daily usage across different AI services and stay within your Cursor Pro limits.

## Features

- 📊 **Real-time Usage Monitoring**: Track Sonnet 4.5, Gemini, and GPT-5 request usage
- 🚨 **Alert System**: Get warnings when approaching limits
- 📈 **Usage Statistics**: Detailed breakdown of current usage vs. limits
- 🔧 **Easy Integration**: Works with any MCP-compatible client
- 🎯 **TypeScript**: Fully typed with strict TypeScript configuration

## Cursor Pro Limits

Based on Cursor Pro subscription limits:
- **Sonnet 4.5**: ~225 requests per day
- **Gemini**: ~550 requests per day  
- **GPT-5**: ~500 requests per day
- **Total**: ~1,275 requests per day

## Installation

```bash
npm install cursor-pro-limits-mcp
```

## Usage

### As an MCP Server

1. **Configure your MCP client** to use this server:

```json
{
  "mcpServers": {
    "cursor-pro-limits": {
      "command": "npx",
      "args": ["cursor-pro-limits-mcp"]
    }
  }
}
```

2. **Available Tools**:

#### `get_usage_stats`
Get comprehensive usage statistics for all services.

```typescript
// Returns current usage, limits, percentages, and remaining requests
```

#### `get_service_usage`
Get detailed usage for a specific service.

**Parameters:**
- `service`: `"sonnet45" | "gemini" | "gpt5" | "total"`

#### `check_alerts`
Check for services approaching or exceeding limits.

#### `update_usage`
Update usage statistics (for testing or manual updates).

**Parameters:**
- `sonnet45Requests` (optional): Number of Sonnet 4.5 requests
- `geminiRequests` (optional): Number of Gemini requests  
- `gpt5Requests` (optional): Number of GPT-5 requests
- `totalRequests` (optional): Total number of requests

### Programmatic Usage

```typescript
import { CursorLimitsMonitor } from 'cursor-pro-limits-mcp';

const monitor = new CursorLimitsMonitor();

// Get current usage stats
const stats = monitor.getUsageStats();
console.log(`Sonnet 4.5: ${stats.limits.sonnet45Requests}/${stats.quotas.maxSonnet45Requests}`);

// Check for alerts
const alerts = monitor.checkAlerts();
if (alerts.length > 0) {
  console.log('Warning: Approaching limits!');
}

// Update usage (e.g., from API response)
monitor.updateLimits({
  sonnet45Requests: 150,
  geminiRequests: 300,
  gpt5Requests: 200,
  totalRequests: 650
});
```

## Development

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd cursor-pro-limits-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

### Available Scripts

```bash
# Build TypeScript
npm run build

# Watch mode for development
npm run dev

# Start the server
npm start

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Clean build directory
npm run clean
```

### Code Quality

This project uses:
- **TypeScript** with strict configuration
- **ESLint** for code linting
- **Prettier** for code formatting
- **No `any` types** - fully typed codebase

## API Reference

### Types

```typescript
interface CursorProLimits {
  sonnet45Requests: number;
  geminiRequests: number;
  gpt5Requests: number;
  totalRequests: number;
  lastUpdated: Date;
}

interface UsageStats {
  limits: CursorProLimits;
  quotas: CursorProQuotas;
  usagePercentages: {
    sonnet45: number;
    gemini: number;
    gpt5: number;
    total: number;
  };
  remaining: {
    sonnet45: number;
    gemini: number;
    gpt5: number;
    total: number;
  };
}
```

### Methods

#### `CursorLimitsMonitor`

- `getUsageStats()`: Get comprehensive usage statistics
- `getServiceUsage(service)`: Get usage for specific service
- `checkAlerts()`: Check for services approaching limits
- `updateLimits(limits)`: Update usage statistics
- `onUpdate(callback)`: Subscribe to usage updates

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests and linting: `npm run lint && npm run format:check`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

For issues and questions:
- Open an issue on GitHub
- Check the documentation
- Review the TypeScript types for API reference

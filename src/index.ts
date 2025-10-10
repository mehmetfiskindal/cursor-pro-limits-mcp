#!/usr/bin/env node

/**
 * Cursor Pro Limits MCP Server
 * Model Context Protocol server for monitoring Cursor Pro usage limits
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { CursorLimitsMonitor } from './cursorLimitsMonitor.js';
import { SubscriptionTier } from './types.js';

class CursorProLimitsMCPServer {
  private server: Server;
  private monitor: CursorLimitsMonitor;

  constructor() {
    this.server = new Server({
      name: 'cursor-pro-limits-mcp',
      version: '1.0.0',
      capabilities: {
        tools: {},
      },
    });

    this.monitor = new CursorLimitsMonitor();
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_usage_stats',
            description: 'Get current Cursor Pro usage statistics and limits',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_service_usage',
            description: 'Get usage statistics for a specific service',
            inputSchema: {
              type: 'object',
              properties: {
                service: {
                  type: 'string',
                  enum: ['sonnet45', 'gemini', 'gpt5', 'total'],
                  description: 'Service to check usage for',
                },
              },
              required: ['service'],
            },
          },
          {
            name: 'check_alerts',
            description: 'Check for services approaching or exceeding limits',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'update_usage',
            description:
              'Update usage statistics (for testing or manual updates)',
            inputSchema: {
              type: 'object',
              properties: {
                sonnet45Requests: {
                  type: 'number',
                  description: 'Number of Sonnet 4.5 requests',
                },
                geminiRequests: {
                  type: 'number',
                  description: 'Number of Gemini requests',
                },
                gpt5Requests: {
                  type: 'number',
                  description: 'Number of GPT-5 requests',
                },
                totalRequests: {
                  type: 'number',
                  description: 'Total number of requests',
                },
              },
            },
          },
          {
            name: 'set_subscription_tier',
            description: 'Set the subscription tier (pro, pro-plus, ultra)',
            inputSchema: {
              type: 'object',
              properties: {
                tier: {
                  type: 'string',
                  enum: ['pro', 'pro-plus', 'ultra'],
                  description: 'Subscription tier',
                },
              },
              required: ['tier'],
            },
          },
          {
            name: 'get_subscription_info',
            description: 'Get current subscription tier and limits',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ] as Tool[],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_usage_stats':
            return await this.handleGetUsageStats();

          case 'get_service_usage':
            return await this.handleGetServiceUsage(
              args as { service: string }
            );

          case 'check_alerts':
            return await this.handleCheckAlerts();

          case 'update_usage':
            return await this.handleUpdateUsage(
              args as {
                sonnet45Requests?: number;
                geminiRequests?: number;
                gpt5Requests?: number;
                totalRequests?: number;
              }
            );

          case 'set_subscription_tier':
            return await this.handleSetSubscriptionTier(
              args as { tier: string }
            );

          case 'get_subscription_info':
            return await this.handleGetSubscriptionInfo();

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async handleGetUsageStats() {
    const stats = this.monitor.getUsageStats();

    const content = `
# Cursor Pro Usage Statistics

## Subscription Tier: ${stats.quotas.tier.toUpperCase()}

## Current Usage (Monthly)
- **Sonnet 4.5**: ${stats.limits.sonnet45Requests}/${stats.quotas.maxSonnet45Requests} (${stats.usagePercentages.sonnet45.toFixed(1)}%)
- **Gemini**: ${stats.limits.geminiRequests}/${stats.quotas.maxGeminiRequests} (${stats.usagePercentages.gemini.toFixed(1)}%)
- **GPT-5**: ${stats.limits.gpt5Requests}/${stats.quotas.maxGpt5Requests} (${stats.usagePercentages.gpt5.toFixed(1)}%)
- **Total**: ${stats.limits.totalRequests}/${stats.quotas.maxTotalRequests} (${stats.usagePercentages.total.toFixed(1)}%)

## Remaining Requests (This Month)
- **Sonnet 4.5**: ${stats.remaining.sonnet45}
- **Gemini**: ${stats.remaining.gemini}
- **GPT-5**: ${stats.remaining.gpt5}
- **Total**: ${stats.remaining.total}

## Last Updated
${stats.limits.lastUpdated.toISOString()}
    `.trim();

    return {
      content: [
        {
          type: 'text',
          text: content,
        },
      ],
    };
  }

  private async handleGetServiceUsage(args: { service: string }) {
    const { service } = args;

    if (!['sonnet45', 'gemini', 'gpt5', 'total'].includes(service)) {
      throw new Error(
        'Invalid service. Must be one of: sonnet45, gemini, gpt5, total'
      );
    }

    const usage = this.monitor.getServiceUsage(
      service as 'sonnet45' | 'gemini' | 'gpt5' | 'total'
    );

    const status = usage.isCritical
      ? '🔴 CRITICAL'
      : usage.isWarning
        ? '🟡 WARNING'
        : '🟢 OK';

    const content = `
# ${service.toUpperCase()} Service Usage

## Status: ${status}

- **Current**: ${usage.current}
- **Maximum**: ${usage.max}
- **Percentage**: ${usage.percentage.toFixed(1)}%
- **Remaining**: ${usage.remaining}

${usage.isCritical ? '⚠️ This service is at or near its limit!' : ''}
${usage.isWarning ? '⚠️ This service is approaching its limit.' : ''}
    `.trim();

    return {
      content: [
        {
          type: 'text',
          text: content,
        },
      ],
    };
  }

  private async handleCheckAlerts() {
    const alerts = this.monitor.checkAlerts();

    if (alerts.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '✅ No alerts - all services are within normal limits.',
          },
        ],
      };
    }

    const alertContent = alerts
      .map(alert => {
        const status = alert.isCritical ? '🔴 CRITICAL' : '🟡 WARNING';
        return `- **${alert.service.toUpperCase()}**: ${status} (${alert.percentage.toFixed(1)}% used)`;
      })
      .join('\n');

    const content = `
# Alert Summary

${alertContent}

## Details
${alerts
  .map(alert =>
    `
### ${alert.service.toUpperCase()}
- Current: ${alert.current}/${alert.max}
- Percentage: ${alert.percentage.toFixed(1)}%
- Remaining: ${alert.remaining}
- Status: ${alert.isCritical ? 'CRITICAL' : 'WARNING'}
    `.trim()
  )
  .join('\n')}
    `.trim();

    return {
      content: [
        {
          type: 'text',
          text: content,
        },
      ],
    };
  }

  private async handleUpdateUsage(args: {
    sonnet45Requests?: number;
    geminiRequests?: number;
    gpt5Requests?: number;
    totalRequests?: number;
  }) {
    const updates: Partial<{
      sonnet45Requests: number;
      geminiRequests: number;
      gpt5Requests: number;
      totalRequests: number;
    }> = {};

    if (args.sonnet45Requests !== undefined) {
      updates.sonnet45Requests = args.sonnet45Requests;
    }
    if (args.geminiRequests !== undefined) {
      updates.geminiRequests = args.geminiRequests;
    }
    if (args.gpt5Requests !== undefined) {
      updates.gpt5Requests = args.gpt5Requests;
    }
    if (args.totalRequests !== undefined) {
      updates.totalRequests = args.totalRequests;
    }

    this.monitor.updateLimits(updates);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Usage statistics updated successfully.`,
        },
      ],
    };
  }

  private async handleSetSubscriptionTier(args: { tier: string }) {
    const { tier } = args;
    
    if (!['pro', 'pro-plus', 'ultra'].includes(tier)) {
      throw new Error('Invalid tier. Must be one of: pro, pro-plus, ultra');
    }

    this.monitor.updateTier(tier as SubscriptionTier);

    const stats = this.monitor.getUsageStats();
    const content = `
# Subscription Tier Updated

## New Tier: ${tier.toUpperCase()}

## Monthly Limits
- **Sonnet 4.5**: ${stats.quotas.maxSonnet45Requests} requests/month
- **Gemini**: ${stats.quotas.maxGeminiRequests} requests/month
- **GPT-5**: ${stats.quotas.maxGpt5Requests} requests/month
- **Total**: ${stats.quotas.maxTotalRequests} requests/month

## Current Usage
- **Sonnet 4.5**: ${stats.limits.sonnet45Requests}/${stats.quotas.maxSonnet45Requests} (${stats.usagePercentages.sonnet45.toFixed(1)}%)
- **Gemini**: ${stats.limits.geminiRequests}/${stats.quotas.maxGeminiRequests} (${stats.usagePercentages.gemini.toFixed(1)}%)
- **GPT-5**: ${stats.limits.gpt5Requests}/${stats.quotas.maxGpt5Requests} (${stats.usagePercentages.gpt5.toFixed(1)}%)
- **Total**: ${stats.limits.totalRequests}/${stats.quotas.maxTotalRequests} (${stats.usagePercentages.total.toFixed(1)}%)
    `.trim();

    return {
      content: [
        {
          type: 'text',
          text: content,
        },
      ],
    };
  }

  private async handleGetSubscriptionInfo() {
    const tier = this.monitor.getCurrentTier();
    const stats = this.monitor.getUsageStats();
    
    const content = `
# Subscription Information

## Current Tier: ${tier.toUpperCase()}

## Monthly Limits
- **Sonnet 4.5**: ${stats.quotas.maxSonnet45Requests} requests/month
- **Gemini**: ${stats.quotas.maxGeminiRequests} requests/month
- **GPT-5**: ${stats.quotas.maxGpt5Requests} requests/month
- **Total**: ${stats.quotas.maxTotalRequests} requests/month

## Current Usage
- **Sonnet 4.5**: ${stats.limits.sonnet45Requests}/${stats.quotas.maxSonnet45Requests} (${stats.usagePercentages.sonnet45.toFixed(1)}%)
- **Gemini**: ${stats.limits.geminiRequests}/${stats.quotas.maxGeminiRequests} (${stats.usagePercentages.gemini.toFixed(1)}%)
- **GPT-5**: ${stats.limits.gpt5Requests}/${stats.quotas.maxGpt5Requests} (${stats.usagePercentages.gpt5.toFixed(1)}%)
- **Total**: ${stats.limits.totalRequests}/${stats.quotas.maxTotalRequests} (${stats.usagePercentages.total.toFixed(1)}%)

## Available Tiers
- **Pro**: 225 Sonnet 4.5, 550 Gemini, 500 GPT-5 (1,275 total)
- **Pro+**: 675 Sonnet 4.5, 1,650 Gemini, 1,500 GPT-5 (3,825 total)
- **Ultra**: 4,500 Sonnet 4.5, 11,000 Gemini, 10,000 GPT-5 (25,500 total)
    `.trim();

    return {
      content: [
        {
          type: 'text',
          text: content,
        },
      ],
    };
  }

  public async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Cursor Pro Limits MCP Server started');
  }
}

// Start the server
const server = new CursorProLimitsMCPServer();
server.start().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
